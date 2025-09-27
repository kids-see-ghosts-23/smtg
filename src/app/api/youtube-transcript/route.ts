import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript-plus";

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "YouTube URL is required" },
                { status: 400 }
            );
        }

        // Extract video ID from various YouTube URL formats
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
            return NextResponse.json(
                { error: "Invalid YouTube URL" },
                { status: 400 }
            );
        }

        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcript || transcript.length === 0) {
            return NextResponse.json(
                { error: "No transcript available for this video" },
                { status: 404 }
            );
        }

        const fullTranscript = transcript.map((t) => t.text).join(" ");
        const truncatedTranscript =
            fullTranscript.length > 5000
                ? fullTranscript.substring(0, 5000) + "..."
                : fullTranscript;

        const content = `YouTube Video Transcript Content:
${truncatedTranscript}

Use this transcript content to provide accurate information and assistance related to the video topic. When asked about specific parts of the video, reference the transcript as needed.`;

        return NextResponse.json({ content });
    } catch (error: any) {
        console.error("YouTube transcript extraction failed:", error);
        return NextResponse.json(
            {
                error:
                    error.message ||
                    "Failed to extract transcript from YouTube video. Please check the URL and try again.",
            },
            { status: 500 }
        );
    }
}

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
}
