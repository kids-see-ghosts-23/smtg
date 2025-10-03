import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";
import { streamVideo } from "@/lib/stream-video";
import { RAGService } from "@/modules/agents/services/rag-service";
import {
    MessageNewEvent,
    CallEndedEvent,
    CallTranscriptionReadyEvent,
    CallSessionParticipantLeftEvent,
    CallSessionParticipantJoinedEvent,
    CallRecordingReadyEvent,
    CallSessionStartedEvent,
} from "@stream-io/node-sdk";
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

function verifySignatureWithSDK(body: string, signature: string): boolean {
    return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-signature");
    const apiKey = req.headers.get("x-api-key");

    if (!signature || !apiKey) {
        return NextResponse.json(
            { error: "Missing signature or API key" },
            { status: 400 }
        );
    }

    const body = await req.text();
    if (!verifySignatureWithSDK(body, signature)) {
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
        );
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = (payload as Record<string, unknown>)?.type;
    if (eventType === "call.session_started") {
        const event = payload as CallSessionStartedEvent;
        const meetingId = event.call.custom?.meetingId;

        if (!meetingId) {
            return NextResponse.json(
                { error: "Missing meeting ID" },
                { status: 400 }
            );
        }

        const [existingMeeting] = await db
            .select()
            .from(meetings)
            .where(
                and(
                    eq(meetings.id, meetingId),
                    not(eq(meetings.status, "completed")),
                    not(eq(meetings.status, "active")),
                    not(eq(meetings.status, "cancelled")),
                    not(eq(meetings.status, "processing"))
                )
            );

        if (!existingMeeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            );
        }

        await db
            .update(meetings)
            .set({ status: "active", startedAt: new Date() })
            .where(eq(meetings.id, existingMeeting.id));

        const [existingAgent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, existingMeeting.agentId));

        if (!existingAgent) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }

        const call = streamVideo.video.call("default", meetingId);

        console.log("Attempting to connect OpenAI for meeting:", meetingId);
        console.log("Agent ID:", existingAgent.id);
        console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

        // Test OpenAI connection first
        try {
            const testResponse = await openaiClient.chat.completions.create({
                messages: [{ role: "user", content: "Hello" }],
                model: "gpt-4o",
                max_tokens: 10,
            });
            console.log(
                "OpenAI API test successful:",
                !!testResponse.choices[0]?.message?.content
            );
        } catch (apiError) {
            console.error("OpenAI API test failed:", apiError);
            return NextResponse.json(
                { error: "OpenAI API connection failed" },
                { status: 500 }
            );
        }

        try {
            const realtimeClient = await streamVideo.video.connectOpenAi({
                call,
                openAiApiKey: process.env.OPENAI_API_KEY!,
                agentUserId: existingAgent.id,
            });

            console.log("OpenAI connection successful, updating session...");
            console.log(
                "Agent instructions length:",
                existingAgent.instructions?.length || 0
            );

            // Enhance instructions with RAG knowledge base
            console.log("Enhancing instructions with RAG knowledge base...");
            const instructions = await RAGService.enhanceInstructions(
                existingAgent.id,
                existingAgent.instructions ||
                    "You are a helpful AI assistant in a meeting. Listen to the conversation and respond when appropriate."
            );

            console.log("Enhanced instructions length:", instructions.length);

            // Add connection state logging
            console.log("Realtime client state:", {
                isConnected: !!realtimeClient,
                hasUpdateSession:
                    typeof realtimeClient.updateSession === "function",
            });

            await realtimeClient.updateSession({
                instructions: instructions,
                voice: "alloy",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                    model: "whisper-1",
                },
                turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500,
                },
            });

            console.log("Session updated with instructions and configuration");

            // Add event listeners for debugging
            realtimeClient.on("session.created", () => {
                console.log("Realtime session created successfully");
            });

            realtimeClient.on("session.updated", () => {
                console.log("Realtime session updated successfully");
            });

            realtimeClient.on(
                "conversation.item.input_audio_transcription.completed",
                (event: { transcript: string }) => {
                    console.log(
                        "Audio transcription completed:",
                        event.transcript
                    );
                }
            );

            realtimeClient.on("response.audio.done", () => {
                console.log("Audio response completed");
            });

            realtimeClient.on("error", (error: Error) => {
                console.error("Realtime client error:", error);
            });

            // Try to send a test message to verify connection
            setTimeout(() => {
                console.log("Attempting to test realtime connection...");
                try {
                    realtimeClient.conversation.item.create({
                        type: "message",
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: "Hello, I'm testing the connection",
                            },
                        ],
                    });
                    console.log("Test message sent successfully");
                } catch (testError) {
                    console.error("Test message failed:", testError);
                }
            }, 2000);
        } catch (error) {
            console.error("Error connecting to OpenAI:", error);
            return NextResponse.json(
                { error: "Failed to connect OpenAI agent" },
                { status: 500 }
            );
        }
    } else if (eventType === "call.session_participant_joined") {
        const event = payload as CallSessionParticipantJoinedEvent;
        const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"
        const newUserId = event.participant?.user?.id;

        if (!meetingId || !newUserId) {
            return NextResponse.json(
                { error: "Missing meeting ID or user ID" },
                { status: 400 }
            );
        }

        const [existingMeeting] = await db
            .select()
            .from(meetings)
            .where(eq(meetings.id, meetingId));

        if (!existingMeeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            );
        }

        const [existingAgent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, existingMeeting.agentId));

        if (!existingAgent) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }

        // If a new human joins (not the AI), log the event
        if (newUserId !== existingAgent.id) {
            console.log(
                "New participant joined:",
                newUserId,
                "for meeting:",
                meetingId
            );
        }
    } else if (eventType === "call.session_participant_left") {
        const event = payload as CallSessionParticipantLeftEvent;
        const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

        if (!meetingId) {
            return NextResponse.json(
                { error: "Missing meeting ID" },
                { status: 400 }
            );
        }

        const call = streamVideo.video.call("default", meetingId);
        await call.end();
    } else if (eventType === "call.session_ended") {
        const event = payload as CallEndedEvent;
        const meetingId = event.call.custom?.meetingId;

        if (!meetingId) {
            return NextResponse.json(
                { error: "Missing meeting ID" },
                { status: 400 }
            );
        }

        await db
            .update(meetings)
            .set({
                status: "processing",
                endedAt: new Date(),
            })
            .where(
                and(eq(meetings.id, meetingId), eq(meetings.status, "active"))
            );
    } else if (eventType === "call.transcription_ready") {
        const event = payload as CallTranscriptionReadyEvent;
        const meetingId = event.call_cid.split(":")[1];
        const [updateMeeting] = await db
            .update(meetings)
            .set({
                transcriptUrl: event.call_transcription.url,
            })
            .where(eq(meetings.id, meetingId))
            .returning();

        if (!updateMeeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            );
        }

        await inngest.send({
            name: "meetings/processing",
            data: {
                meetingId: updateMeeting.id,
                transcriptUrl: updateMeeting.transcriptUrl,
            },
        });
    } else if (eventType === "call.recording_ready") {
        const event = payload as CallRecordingReadyEvent;
        const meetingId = event.call_cid.split(":")[1];
        await db
            .update(meetings)
            .set({
                recordingUrl: event.call_recording.url,
            })
            .where(eq(meetings.id, meetingId));
    } else if (eventType === "message.new") {
        const event = payload as MessageNewEvent;

        const userId = event.user?.id;
        const channelId = event.channel_id;
        const text = event.message?.text;

        if (!userId || !channelId || !text) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const [existingMeeting] = await db
            .select()
            .from(meetings)
            .where(
                and(
                    eq(meetings.id, channelId),
                    eq(meetings.status, "completed")
                )
            );

        if (!existingMeeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            );
        }

        const [existingAgent] = await db
            .select()
            .from(agents)
            .where(eq(agents.id, existingMeeting.agentId));

        if (!existingAgent) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }
        if (userId !== existingAgent.id) {
            const instructions = `
            You are an AI assistant helping the user revisit a recently completed meeting.
            Below is a summary of the meeting, generated from the transcript:
            
            ${existingMeeting.summary}
            
            The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
            
            ${existingAgent.instructions}
            
            The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
            Always base your responses on the meeting summary above.
            
            You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
            
            If the summary does not contain enough information to answer a question, politely let the user know.
            
            Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
            `;

            const channel = streamChat.channel("messaging", channelId);
            await channel.watch();

            const previousMessages = channel.state.messages
                .slice(-5)
                .filter((msg) => msg.text && msg.text.trim() !== "")
                .map<ChatCompletionMessageParam>((message) => ({
                    role:
                        message.user?.id === existingAgent.id
                            ? "assistant"
                            : "user",
                    content: message.text || "",
                }));

            const GPTResponse = await openaiClient.chat.completions.create({
                messages: [
                    { role: "system", content: instructions },
                    ...previousMessages,
                    { role: "user", content: text },
                ],
                model: "gpt-4o",
            });

            const GPTResponseText = GPTResponse.choices[0].message.content;
            if (!GPTResponseText) {
                return NextResponse.json(
                    { error: "No response from GPT" },
                    { status: 400 }
                );
            }

            const avatarUrl = generateAvatarUri({
                seed: existingAgent.name,
                variant: "botttsNeutral",
            });
            streamChat.upsertUser({
                id: existingAgent.id,
                name: existingAgent.name,
                image: avatarUrl,
            });

            channel.sendMessage({
                text: GPTResponseText,
                user: {
                    id: existingAgent.id,
                    name: existingAgent.name,
                    image: avatarUrl,
                },
            });
        }
    }

    return NextResponse.json({ status: "ok" });
}
