"""
Vision Agents worker — replaces the deprecated Stream `connectOpenAi` beta flow.

It exposes a tiny HTTP API. When the Next.js webhook receives
`call.session_started`, it POSTs to `/join` and this worker spins up a
Vision Agents agent that joins the Stream call and talks to participants using
the OpenAI Realtime *GA* API (gpt-realtime).

The rest of the product (call creation, transcription, summaries, post-meeting
chat) is unchanged and still handled by the Next.js app.
"""

import asyncio
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from vision_agents.core import Agent, User
from vision_agents.plugins import getstream, openai

load_dotenv()


# --- Workaround for a bug in vision-agents 0.6.4 -----------------------------
# EventManager.register_events_from_module crashes when a Stream model class
# ending in "Event" has `type = None` (it calls None.startswith()). We patch the
# method to coerce a missing/None `type` to "" before the prefix check.
def _patch_event_manager() -> None:
    from vision_agents.core.events.manager import EventManager

    def register_events_from_module(
        self, module, prefix: str = "", ignore_not_compatible: bool = True
    ):
        for name, class_ in module.__dict__.items():
            if name.endswith("Event") and (
                not prefix or (getattr(class_, "type", "") or "").startswith(prefix)
            ):
                self.register(class_, ignore_not_compatible=ignore_not_compatible)
                self._modules.setdefault(module.__name__, []).append(class_)

    EventManager.register_events_from_module = register_events_from_module


_patch_event_manager()
# ----------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agent-worker")

# Model / voice can be overridden via env without code changes.
REALTIME_MODEL = os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime")
REALTIME_VOICE = os.getenv("OPENAI_REALTIME_VOICE", "marin")

app = FastAPI(title="Meeting AI Agent Worker")

# Track which calls already have an agent so duplicate webhooks don't double-join.
_active_calls: set[str] = set()


class JoinRequest(BaseModel):
    call_type: str = "default"
    call_id: str
    agent_id: str
    agent_name: str = "AI Assistant"
    instructions: str = (
        "You are a helpful AI assistant in a meeting. "
        "Listen to the conversation and respond when appropriate."
    )


async def _run_agent(req: JoinRequest) -> None:
    """Join the call and stay until it ends. Runs as a background task."""
    try:
        agent = Agent(
            edge=getstream.Edge(),
            agent_user=User(name=req.agent_name, id=req.agent_id),
            instructions=req.instructions,
            llm=openai.Realtime(model=REALTIME_MODEL, voice=REALTIME_VOICE),
        )

        logger.info(
            "Agent %s joining %s/%s", req.agent_id, req.call_type, req.call_id
        )
        call = await agent.create_call(req.call_type, req.call_id)
        async with agent.join(call):
            # Optional greeting so users immediately hear the agent is live.
            await agent.simple_response("Briefly greet the participants.")
            # Block here until the call ends.
            await agent.finish()
        logger.info("Agent left call %s", req.call_id)
    except Exception:
        logger.exception("Agent failed for call %s", req.call_id)
    finally:
        _active_calls.discard(req.call_id)


@app.post("/join")
async def join(req: JoinRequest):
    if req.call_id in _active_calls:
        logger.info("Agent already active for call %s — skipping", req.call_id)
        return {"status": "already_active", "call_id": req.call_id}

    _active_calls.add(req.call_id)
    # Launch in the background so the webhook returns immediately.
    asyncio.create_task(_run_agent(req))
    return {"status": "joining", "call_id": req.call_id}


@app.get("/health")
async def health():
    return {"status": "ok", "active_calls": len(_active_calls)}
