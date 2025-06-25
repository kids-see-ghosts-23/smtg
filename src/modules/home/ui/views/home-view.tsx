"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { authClient } from "@/lib/auth-client"; //import the auth client
import { useRouter } from "next/navigation";

export const HomeView = () => {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    if (!session) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex flex-col gap-y-4 p-4">
            <p>you are logged in as {session.user.name}</p>
            <Button
                onClick={() =>
                    authClient.signOut({
                        fetchOptions: {
                            onSuccess: () => {
                                router.push("/sign-in");
                            },
                        },
                    })
                }
            >
                sign out
            </Button>
        </div>
    );
};
