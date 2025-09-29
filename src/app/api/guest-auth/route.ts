import { db } from "@/db";
import { guestUsers } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { guestId } = await req.json();

        if (!guestId) {
            return NextResponse.json(
                { error: "Guest ID is required" },
                { status: 400 }
            );
        }

        // Fetch guest user from database
        const [guestUser] = await db
            .select()
            .from(guestUsers)
            .where(eq(guestUsers.id, guestId));

        if (!guestUser) {
            return NextResponse.json(
                { error: "Guest user not found" },
                { status: 404 }
            );
        }

        // Generate a new token for the guest user
        const token = streamVideo.generateUserToken({
            user_id: guestUser.id,
            validity_in_seconds: 3600, // 1 hour
        });

        return NextResponse.json({
            success: true,
            token,
            guestUser: {
                id: guestUser.id,
                name: guestUser.name,
                image: guestUser.image,
                meetingId: guestUser.meetingId,
            },
        });
    } catch (error) {
        console.error("Error authenticating guest user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
