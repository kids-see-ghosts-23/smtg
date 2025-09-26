"use client";

import { useEffect } from "react";

export default function ConnectNotion() {
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.access_token) {
                localStorage.setItem("notionToken", e.data.access_token);
                if (e.data.page?.id) {
                    localStorage.setItem("notionPageId", e.data.page.id);
                }
                alert(
                    `✅ Connected! Saved token & page ${e.data.page?.id ?? ""}`
                );
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    const connect = () => {
        const params = new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_NOTION_CLIENT_ID!,
            response_type: "code",
            owner: "user",
            redirect_uri: process.env.NEXT_PUBLIC_NOTION_REDIRECT_URI!,
        });
        window.open(
            `https://api.notion.com/v1/oauth/authorize?${params}`,
            "notion-oauth",
            "width=600,height=700"
        );
    };

    return (
        <div className="rounded-xl border p-4 max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-2">Connect with Notion</h2>
            <button
                onClick={connect}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
                Connect
            </button>
        </div>
    );
}
