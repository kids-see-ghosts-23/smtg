"use client";

import { Loader2Icon, LoaderIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { generateAvatarUri } from "@/lib/avatar";
import { CallConnect } from "./call-connect";

interface Props {
    meetingId: string;
    meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: Props) => {
    const { data, isPending } = authClient.useSession();
    
    // Check if this is a guest user
    const guestUser = typeof window !== 'undefined' ? localStorage.getItem("guestUser") : null;
    
    if (guestUser) {
        const userData = JSON.parse(guestUser);
        return (
            <CallConnect
                meetingId={meetingId}
                meetingName={meetingName}
                userId={userData.id}
                userName={userData.name}
                userImage={userData.image}
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
            userImage={
                data.user.image ??
                generateAvatarUri({ seed: data.user.name, variant: "initials" })
            }
        />
    );
};