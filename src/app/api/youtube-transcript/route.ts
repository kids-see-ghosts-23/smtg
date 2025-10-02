import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "YouTube URL is required" },
                { status: 400 }
            );
        }

        // Call the new subtitles API endpoint with YouTube URL in body
        const response = await fetch(
            "https://thecodeworks.in/smtgApi/api/subtitles",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    youtube_url: url,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch subtitles from API");
        }

        const data = await response.json();

        if (!data.success || !data.text) {
            return NextResponse.json(
                { error: "No subtitles available for this video" },
                { status: 404 }
            );
        }

        // Format the content for the agent
        const content = `YouTube Video Subtitles/Transcript Content:
${data.text}

Use this transcript content to provide accurate information and assistance related to the video topic. When asked about specific parts of the video, reference the transcript as needed.`;

        return NextResponse.json({ content });
    } catch (error: unknown) {
        console.error("YouTube transcript extraction failed:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to extract transcript from YouTube video. Please check the URL and try again.",
            },
            { status: 500 }
        );
    }
}
