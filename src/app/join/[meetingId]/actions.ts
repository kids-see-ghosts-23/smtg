"use server";

import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import { nanoid } from "nanoid";

export async function createGuestUserAndToken(name: string) {
  try {
    const userId = `guest-${nanoid()}`;
    const avatarUrl = generateAvatarUri({
      seed: name.trim(),
      variant: "initials",
    });
    await streamVideo.upsertUsers([
      {
        id: userId,
        name: name.trim(),
        role: "user",
        image: avatarUrl,
      },
    ]);
    const token = streamVideo.generateUserToken({
      user_id: userId,
      validity_in_seconds: 3600, // 1 hour
    });
    return {
      success: true,
      userId,
      token,
    };
  } catch (error) {
    console.error("Failed to create guest user:", error);
    return {
      success: false,
      error: "Failed to create guest user",
    };
  }
}