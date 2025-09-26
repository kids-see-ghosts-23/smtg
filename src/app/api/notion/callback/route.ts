import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    if (!code)
        return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.NOTION_REDIRECT_URI!,
    });

    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
        method: "POST",
        headers: {
            Authorization:
                "Basic " +
                Buffer.from(
                    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
                ).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    const tokenData = await tokenRes.json();

    // fetch top-level page (for simplicity: the first search result)
    let pageData = null;
    if (tokenData?.access_token) {
        const searchRes = await fetch("https://api.notion.com/v1/search", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                filter: { property: "object", value: "page" },
                page_size: 1,
            }),
        });
        const searchJson = await searchRes.json();
        if (searchJson.results?.[0]) {
            pageData = {
                id: searchJson.results[0].id,
                title: searchJson.results[0].properties?.title ?? "Untitled",
            };
        }
    }

    const payload = { ...tokenData, page: pageData };

    return new NextResponse(
        `<script>
       window.opener.postMessage(${JSON.stringify(payload)}, "*");
       window.close();
     </script>`,
        { headers: { "Content-Type": "text/html" } }
    );
}
