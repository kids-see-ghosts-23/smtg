"use client";

import { LoaderIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { generateAvatarUri } from "@/lib/avatar";
import { CallConnect } from "./call-connect";

interface Props {
    meetingId: string;
    meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
    const { data, isPending } = authClient.useSession();

    // Check if this is a guest user for this specific meeting
    const guestUser =
        typeof window !== "undefined"
            ? sessionStorage.getItem(`guestUser_${meetingId}`)
            : null;

    if (guestUser) {
        const userData = JSON.parse(guestUser);
        const userImage =
            userData.image ??
            generateAvatarUri({
                seed: userData.name,
                variant: "initials",
            });

        return (
            <CallConnect
                meetingId={meetingId}
                meetingName={meetingName}
                userId={userData.id}
                userName={userData.name}
                userImage={userImage}
                isGuest={true}
                guestToken={userData.token}
            />
        );
    }

    if (!data || isPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white" />
            </div>
        );
    }

    return (
        <CallConnect
            meetingId={meetingId}
            meetingName={meetingName}
            userId={data.user.id}
            userName={data.user.name}
            userImage={data.user.image ?? undefined}
            isGuest={false}
        />
    );
};
