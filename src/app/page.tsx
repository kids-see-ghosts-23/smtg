"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { authClient } from "@/lib/auth-client"; //import the auth client

export default function Home() {
    const { data: session } = authClient.useSession();

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = () => {
        authClient.signUp.email(
            {
                email, // user email address
                password, // user password -> min 8 characters by default
                name, // user display name
                callbackURL: "/dashboard", //
            },
            {
                onRequest: (ctx) => {
                    //show loading
                },
                onSuccess: (ctx) => {
                    //redirect to the dashboard or sign in page
                    window.alert("success");
                },
                onError: (ctx) => {
                    // display the error message
                    window.alert("smtg went wrong");
                },
            }
        );
    };

    if (session) {
        return (
            <div className="flex flex-col gap-y-4 p-4">
                <p>you are logged in as {session.user.name}</p>
                <Button onClick={() => authClient.signOut()}>sign out</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-4 p-4">
            <Input
                placeholder="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Input
                placeholder="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={onSubmit}>create user</Button>
        </div>
    );
}
