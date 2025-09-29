"use client";

import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../components/call-provider";

interface Props {
    meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
    const trpc = useTRPC();

    // Check if this is a guest user
    const isGuest =
        typeof window !== "undefined" &&
        sessionStorage.getItem(`guestUser_${meetingId}`);

    // Always call both hooks to avoid conditional hook calls
    const guestQuery = useSuspenseQuery(
        trpc.meetings.getOneForGuest.queryOptions({ id: meetingId })
    );
    const userQuery = useSuspenseQuery(
        trpc.meetings.getOne.queryOptions({ id: meetingId })
    );

    // Select the appropriate data based on user type
    const data = isGuest ? guestQuery.data : userQuery.data;

    if (data.status === "completed") {
        return (
            <div className="flex h-screen items-center justify-center">
                <ErrorState
                    title="Meeting has ended"
                    description="You can no longer join the meeting"
                />
            </div>
        );
    }

    return <CallProvider meetingId={meetingId} meetingName={data.name} />;
};
