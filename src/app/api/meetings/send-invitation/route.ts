import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";
import { db } from "@/db";
import { meetings, agents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            meetingId,
            recipientEmails,
            scheduledDate,
            scheduledTime,
            message,
        } = body;

        // Validate required fields
        if (
            !meetingId ||
            !recipientEmails ||
            !scheduledDate ||
            !scheduledTime
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate recipientEmails is an array
        if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            return NextResponse.json(
                { error: "recipientEmails must be a non-empty array" },
                { status: 400 }
            );
        }

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
                    eq(meetings.userId, session.user.id)
                )
            );

        if (!meeting) {
            return NextResponse.json(
                { error: "Meeting not found or unauthorized" },
                { status: 404 }
            );
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
        const emailPromises = recipientEmails.map((email: string) =>
            emailService.sendMeetingInvitation({
                to: email,
                meetingName: meeting.name,
                organizerName: session.user.name,
                organizerEmail: session.user.email,
                joinUrl,
                scheduledDate: scheduledDateTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                scheduledTime: scheduledDateTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                }),
                agentName: meeting.agentName,
                message: message || undefined,
                startDateTime: scheduledDateTime,
                endDateTime,
            })
        );

        await Promise.all(emailPromises);

        return NextResponse.json({
            success: true,
            message: `Invitation sent to ${recipientEmails.length} recipient(s)`,
        });
    } catch (error) {
        console.error("Error sending meeting invitation:", error);
        return NextResponse.json(
            {
                error: "Failed to send invitation",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
