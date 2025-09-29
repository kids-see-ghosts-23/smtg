import { db } from "@/db";
import { meetings, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ meetingId: string }> }
) {
    try {
        const params = await context.params;
        const [meeting] = await db
            .select({
                id: meetings.id,
                name: meetings.name,
                status: meetings.status,
                userId: meetings.userId,
                user: {
                    id: user.id,
                    name: user.name,
                },
            })
            .from(meetings)
            .innerJoin(user, eq(meetings.userId, user.id))
            .where(eq(meetings.id, params.meetingId));

        if (!meeting) {
            return NextResponse.json(
                { error: "Meeting not found" },
                { status: 404 }
            );
        }

        // Check if meeting is active or upcoming
        if (meeting.status !== "active" && meeting.status !== "upcoming") {
            return NextResponse.json(
                { error: "Meeting is not available for joining" },
                { status: 400 }
            );
        }

        return NextResponse.json(meeting);
    } catch (error) {
        console.error("Error fetching meeting:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
