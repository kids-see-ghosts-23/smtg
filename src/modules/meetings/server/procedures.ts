import { z } from "zod";
import { db } from "@/db";
import { agents, meetings, user, guestUsers } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
    and,
    count,
    desc,
    eq,
    getTableColumns,
    ilike,
    inArray,
    sql,
} from "drizzle-orm";
import {
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import {
    meetingsInsertSchema,
    meetingsUpdateSchema,
    sendInvitationSchema,
} from "../schemas";
import { MeetingStatus, StreamTranscriptItem } from "../types";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import JSONL from "jsonl-parse-stringify";
import { streamChat } from "@/lib/stream-chat";
import { EmailService } from "@/lib/email";

export const meetingsRouter = createTRPCRouter({
    generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
        const token = streamChat.createToken(ctx.auth.user.id);
        await streamChat.upsertUser({
            id: ctx.auth.user.id,
            role: "admin",
        });

        return token;
    }),

    getTranscript: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            const [existingMeeting] = await db
                .select()
                .from(meetings)
                .where(
                    and(
                        eq(meetings.id, input.id),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                );
            if (!existingMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found",
                });
            }

            if (!existingMeeting.transcriptUrl) {
                return [];
            }

            const transcript = await fetch(existingMeeting.transcriptUrl)
                .then((res) => res.text())
                .then((text) => JSONL.parse<StreamTranscriptItem>(text))
                .catch(() => {
                    return [];
                });

            const speakerIds = [
                ...new Set(transcript.map((item) => item.speaker_id)),
            ];

            const userSpeakers = await db
                .select()
                .from(user)
                .where(inArray(user.id, speakerIds))
                .then((users) =>
                    users.map((user) => ({
                        ...user,
                        image:
                            user.image ??
                            generateAvatarUri({
                                seed: user.name,
                                variant: "initials",
                            }),
                    }))
                );

            const agentSpeakers = await db
                .select()
                .from(agents)
                .where(inArray(agents.id, speakerIds))
                .then((agents) =>
                    agents.map((agent) => ({
                        ...agent,
                        image: generateAvatarUri({
                            seed: agent.name,
                            variant: "botttsNeutral",
                        }),
                    }))
                );
            const guestSpeakerIds = speakerIds.filter((id) =>
                id.startsWith("guest-")
            );
            const guestSpeakers = guestSpeakerIds.map((id) => {
                // Try to get guest user from database first
                return db
                    .select()
                    .from(guestUsers)
                    .where(eq(guestUsers.id, id))
                    .then(([guestUser]) => {
                        if (guestUser) {
                            return {
                                id: guestUser.id,
                                name: guestUser.name,
                                image:
                                    guestUser.image ??
                                    generateAvatarUri({
                                        seed: guestUser.name,
                                        variant: "initials",
                                    }),
                            };
                        }
                        // Fallback if not found in database
                        return {
                            id,
                            name: `Guest User`,
                            image: generateAvatarUri({
                                seed: id,
                                variant: "initials",
                            }),
                        };
                    })
                    .catch(() => {
                        // Fallback if database query fails
                        return {
                            id,
                            name: `Guest User`,
                            image: generateAvatarUri({
                                seed: id,
                                variant: "initials",
                            }),
                        };
                    });
            });

            // Wait for all guest speaker promises to resolve
            const resolvedGuestSpeakers = await Promise.all(guestSpeakers);

            const speakers = [
                ...userSpeakers,
                ...agentSpeakers,
                ...resolvedGuestSpeakers,
            ];
            const transcriptWithSpeakers = transcript.map((item) => {
                const speaker = speakers.find(
                    (speaker) => speaker.id === item.speaker_id
                );

                if (!speaker) {
                    return {
                        ...item,
                        user: {
                            name: "Unknown Speaker",
                            image: generateAvatarUri({
                                seed: "Unknown",
                                variant: "initials",
                            }),
                        },
                    };
                }

                return {
                    ...item,
                    user: {
                        name: speaker.name,
                        image: speaker.image,
                    },
                };
            });

            return transcriptWithSpeakers;
        }),
    generateToken: protectedProcedure.mutation(async ({ ctx }) => {
        await streamVideo.upsertUsers([
            {
                id: ctx.auth.user.id,
                name: ctx.auth.user.name,
                role: "admin",
                image:
                    ctx.auth.user.image ??
                    generateAvatarUri({
                        seed: ctx.auth.user.name,
                        variant: "initials",
                    }),
            },
        ]);

        const expirationTime = Math.floor(Date.now() / 1000) + 3600;
        const issuedAt = Math.floor(Date.now() / 1000) - 60;
        const token = streamVideo.generateUserToken({
            user_id: ctx.auth.user.id,
            exp: expirationTime,
            validity_in_seconds: issuedAt,
        });

        return token;
    }),
    update: protectedProcedure
        .input(meetingsUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const [updatedMeeting] = await db
                .update(meetings)
                .set(input)
                .where(
                    and(
                        eq(meetings.id, input.id),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                )
                .returning();

            if (!updatedMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Agent not found",
                });
            }

            return updatedMeeting;
        }),
    remove: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const [removedMeeting] = await db
                .delete(meetings)
                .where(
                    and(
                        eq(meetings.id, input.id),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                )
                .returning();

            if (!removedMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Agent not found",
                });
            }

            return removedMeeting;
        }),
    create: protectedProcedure
        .input(meetingsInsertSchema)
        .mutation(async ({ input, ctx }) => {
            const [createdMeeting] = await db
                .insert(meetings)
                .values({
                    ...input,
                    userId: ctx.auth.user.id,
                })
                .returning();

            const call = streamVideo.video.call("default", createdMeeting.id);
            await call.create({
                data: {
                    created_by_id: ctx.auth.user.id,
                    custom: {
                        meetingId: createdMeeting.id,
                        meetingName: createdMeeting.name,
                    },
                    settings_override: {
                        transcription: {
                            language: "en",
                            mode: "auto-on",
                            closed_caption_mode: "auto-on",
                        },
                        recording: {
                            mode: "auto-on",
                            quality: "1080p",
                        },
                    },
                },
            });
            const [existingAgent] = await db
                .select()
                .from(agents)
                .where(eq(agents.id, createdMeeting.agentId));

            if (!existingAgent) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Agent not found",
                });
            }

            await streamVideo.upsertUsers([
                {
                    id: existingAgent.id,
                    name: existingAgent.name,
                    role: "user",
                    image: generateAvatarUri({
                        seed: existingAgent.name,
                        variant: "botttsNeutral",
                    }),
                },
            ]);

            return createdMeeting;
        }),
    getOne: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            const [existingMeeting] = await db
                .select({
                    ...getTableColumns(meetings),
                    agent: agents,
                    duration:
                        sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
                            "duration"
                        ),
                })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(eq(meetings.id, input.id)); // 👈 remove ownership check!

            if (!existingMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found",
                });
            }

            // Only owners can view completed/cancelled meetings
            if (
                existingMeeting.status === "completed" ||
                existingMeeting.status === "cancelled"
            ) {
                if (existingMeeting.userId !== ctx.auth.user.id) {
                    throw new TRPCError({
                        code: "UNAUTHORIZED",
                        message: "Not allowed",
                    });
                }
            }

            // For active/upcoming meetings, allow any authenticated user to join
            if (
                existingMeeting.status === "active" ||
                existingMeeting.status === "upcoming"
            ) {
                return existingMeeting;
            }

            // Fallback: only owner can
            if (existingMeeting.userId !== ctx.auth.user.id) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Not allowed",
                });
            }

            return existingMeeting;
        }),
    // New procedure for guest access to meetings
    getOneForGuest: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            // For guests joining meetings, we don't need to validate ownership
            // Only check that the meeting exists and is valid for joining
            const [existingMeeting] = await db
                .select({
                    ...getTableColumns(meetings),
                    agent: agents,
                    duration:
                        sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
                            "duration"
                        ),
                })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(eq(meetings.id, input.id));

            if (!existingMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found",
                });
            }

            return existingMeeting;
        }),
    getMany: protectedProcedure
        .input(
            z.object({
                page: z.number().default(DEFAULT_PAGE),
                pageSize: z
                    .number()
                    .min(MIN_PAGE_SIZE)
                    .max(MAX_PAGE_SIZE)
                    .default(DEFAULT_PAGE_SIZE),
                search: z.string().nullish(),
                agentId: z.string().nullish(),
                status: z
                    .enum([
                        MeetingStatus.Upcoming,
                        MeetingStatus.Active,
                        MeetingStatus.Completed,
                        MeetingStatus.Processing,
                        MeetingStatus.Cancelled,
                    ])
                    .nullish(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { search, page, pageSize, status, agentId } = input;
            const data = await db
                .select({
                    ...getTableColumns(meetings),
                    agent: agents,
                    duration:
                        sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
                            "duration"
                        ),
                })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(
                    and(
                        eq(meetings.userId, ctx.auth.user.id),
                        search
                            ? ilike(meetings.name, `%${search}%`)
                            : undefined,
                        status ? eq(meetings.status, status) : undefined,
                        agentId ? eq(meetings.agentId, agentId) : undefined
                    )
                )
                .orderBy(desc(meetings.createdAt), desc(meetings.id))
                .limit(pageSize)
                .offset((page - 1) * pageSize);

            const [total] = await db
                .select({ count: count() })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(
                    and(
                        eq(meetings.userId, ctx.auth.user.id),
                        search
                            ? ilike(meetings.name, `%${search}%`)
                            : undefined,
                        status ? eq(meetings.status, status) : undefined,
                        agentId ? eq(meetings.agentId, agentId) : undefined
                    )
                );

            const totalPages = Math.ceil(total.count / pageSize);

            return {
                items: data,
                total: total.count,
                totalPages,
            };
        }),
    sendInvitation: protectedProcedure
        .input(sendInvitationSchema)
        .mutation(async ({ ctx, input }) => {
            const {
                meetingId,
                recipientEmails,
                scheduledDate,
                scheduledTime,
                message,
            } = input;

            // Fetch meeting details
            const [meeting] = await db
                .select({
                    id: meetings.id,
                    name: meetings.name,
                    userId: meetings.userId,
                    agentId: meetings.agentId,
                    agentName: agents.name,
                })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(
                    and(
                        eq(meetings.id, meetingId),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                );

            if (!meeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found or unauthorized",
                });
            }

            // Construct meeting join URL
            const baseUrl =
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const joinUrl = `${baseUrl}/join/${meetingId}`;

            // Parse scheduled date and time
            const dateTimeString = `${scheduledDate}T${scheduledTime}`;
            const scheduledDateTime = new Date(dateTimeString);

            // Generate calendar event end time (1 hour after start)
            const endDateTime = new Date(
                scheduledDateTime.getTime() + 60 * 60 * 1000
            );

            // Initialize email service
            const emailService = new EmailService();

            // Send invitation emails to all recipients
            const emailPromises = recipientEmails.map((email) =>
                emailService.sendMeetingInvitation({
                    to: email,
                    meetingName: meeting.name,
                    organizerName: ctx.auth.user.name,
                    organizerEmail: ctx.auth.user.email,
                    joinUrl,
                    scheduledDate: scheduledDateTime.toLocaleDateString(
                        "en-US",
                        {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }
                    ),
                    scheduledTime: scheduledDateTime.toLocaleTimeString(
                        "en-US",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZoneName: "short",
                        }
                    ),
                    agentName: meeting.agentName,
                    message: message || undefined,
                    startDateTime: scheduledDateTime,
                    endDateTime,
                })
            );

            await Promise.all(emailPromises);

            return {
                success: true,
                message: `Invitation sent to ${recipientEmails.length} recipient(s)`,
            };
        }),
});
