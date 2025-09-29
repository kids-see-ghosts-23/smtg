"use server";

import { db } from "@/db";
import { guestUsers } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export async function createGuestUserInDatabase(
    name: string,
    meetingId: string,
    userId: string
) {
    try {
        // Create guest user in database
        const guestId = `guest-${nanoid()}`;
        const avatarUrl = generateAvatarUri({
            seed: name.trim(),
            variant: "initials",
        });

        const [guestUser] = await db
            .insert(guestUsers)
            .values({
                id: guestId,
                name: name.trim(),
                meetingId: meetingId,
                userId: userId, // The account holder's ID
                image: avatarUrl,
            })
            .returning();

        // Create user in Stream
        await streamVideo.upsertUsers([
            {
                id: guestId,
                name: name.trim(),
                role: "user",
                image: avatarUrl,
            },
        ]);

        // Generate token for the guest user
        const token = streamVideo.generateUserToken({
            user_id: guestId,
            validity_in_seconds: 3600, // 1 hour
        });

        return {
            success: true,
            guestUser: {
                id: guestUser.id,
                name: guestUser.name,
                image: guestUser.image,
                token: token,
                meetingId: guestUser.meetingId,
            },
        };
    } catch (error) {
        console.error("Failed to create guest user in database:", error);
        return {
            success: false,
            error: "Failed to create guest user",
        };
    }
}

export async function getGuestUserFromDatabase(guestId: string) {
    try {
        const [guestUser] = await db
            .select()
            .from(guestUsers)
            .where(eq(guestUsers.id, guestId));

        if (!guestUser) {
            return {
                success: false,
                error: "Guest user not found",
            };
        }

        return {
            success: true,
            guestUser: {
                id: guestUser.id,
                name: guestUser.name,
                image: guestUser.image,
                meetingId: guestUser.meetingId,
            },
        };
    } catch (error) {
        console.error("Failed to fetch guest user from database:", error);
        return {
            success: false,
            error: "Failed to fetch guest user",
        };
    }
}
