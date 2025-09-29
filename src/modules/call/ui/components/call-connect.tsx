"use client";
import { useTRPC } from "@/trpc/client";
import {
    Call,
    CallingState,
    StreamCall,
    StreamVideo,
    StreamVideoClient,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useMutation } from "@tanstack/react-query";
import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CallUI } from "./call-ui";

interface Props {
    meetingId: string;
    meetingName: string;
    userId?: string;
    userName?: string;
    userImage?: string;
    isGuest?: boolean;
    guestToken?: string;
}

export const CallConnect = ({
    meetingId,
    meetingName,
    userId,
    userName,
    userImage,
    isGuest = false,
    guestToken,
}: Props) => {
    const trpc = useTRPC();
    const { mutateAsync: generateToken } = useMutation(
        trpc.meetings.generateToken.mutationOptions()
    );

    const [client, setClient] = useState<StreamVideoClient>();
    useEffect(() => {
        // Check for guest user in sessionStorage first
        const sessionGuestUser =
            typeof window !== "undefined"
                ? sessionStorage.getItem(`guestUser_${meetingId}`)
                : null;
        let userData;

        if (sessionGuestUser) {
            userData = JSON.parse(sessionGuestUser);
        } else if (userId && userName) {
            userData = { id: userId, name: userName, image: userImage };
        } else {
            window.location.href = `/join/${meetingId}`;
            return;
        }

        const initializeClient = async () => {
            let token;

            if (sessionGuestUser) {
                // Use the token from sessionStorage for guests
                token = userData.token;
            } else {
                // Generate token for authenticated users
                token = await generateToken();
            }

            const _client = new StreamVideoClient({
                apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
                user: {
                    id: userData.id,
                    name: userData.name,
                    image: userData.image,
                },
                token,
            });

            setClient(_client);

            return () => {
                _client.disconnectUser();
                setClient(undefined);
            };
        };

        initializeClient();
    }, [
        userId,
        userName,
        userImage,
        generateToken,
        meetingId,
        isGuest,
        guestToken,
    ]);

    const [call, setCall] = useState<Call>();

    useEffect(() => {
        if (!client) {
            return;
        }
        const _call = client.call("default", meetingId);
        _call.camera.disable();
        _call.microphone.disable();
        setCall(_call);
        return () => {
            if (_call.state.callingState !== CallingState.LEFT) {
                _call.leave();
                _call.endCall();
                setCall(undefined);
            }
        };
    }, [client, meetingId]);

    if (!client || !call) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white" />
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallUI meetingName={meetingName} />
            </StreamCall>
        </StreamVideo>
    );
};
