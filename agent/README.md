# Meeting AI Agent Worker

Server-side voice agent that joins Stream video calls using the **OpenAI Realtime
GA API** (`gpt-realtime`), built on [Vision Agents](https://visionagents.ai).

This replaces Stream's deprecated `connectOpenAi` beta flow (which broke when
OpenAI shut down the Realtime *Beta* API on 2026-05-07). The rest of the app is
unchanged — this is just the live in-call voice agent.

## How it fits in

```
Next.js webhook (call.session_started)
        │  POST /join { call_id, agent_id, instructions, ... }
        ▼
This worker  ──►  joins the Stream call as the agent user
             ──►  OpenAI Realtime GA (speech-to-speech)
```

## Setup (one time)

Requires Python 3.12+ and [uv](https://docs.astral.sh/uv/).

```bash
cd agent
cp .env.example .env        # then fill in the values (see below)
uv sync                     # installs vision-agents + deps
```

Fill `.env` with the **same** Stream credentials your Next.js app uses:

| Worker var          | Copy from app `.env`                |
| ------------------- | ----------------------------------- |
| `STREAM_API_KEY`    | `NEXT_PUBLIC_STREAM_VIDEO_API_KEY`  |
| `STREAM_API_SECRET` | `STREAM_VIDEO_SECRET_KEY`           |
| `OPENAI_API_KEY`    | `OPENAI_API_KEY`                    |

## Run

```bash
uv run uvicorn main:app --port 8100
```

Health check: `curl http://localhost:8100/health`

## Wire it to the app

In the Next.js app `.env`, point the webhook at this worker:

```
AGENT_SERVICE_URL=http://localhost:8100
```

(Defaults to `http://localhost:8100` if unset.)

## Running the full stack locally

You now need four processes:

```bash
npm run dev            # Next.js app
npm run dev:webhook    # ngrok tunnel for Stream webhooks
npx inngest-cli@latest dev   # Inngest (summaries)
cd agent && uv run uvicorn main:app --port 8100   # this worker
```

Start a meeting — the agent should join with voice.
