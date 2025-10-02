import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { repoUrl } = await request.json();

        if (!repoUrl) {
            return NextResponse.json(
                { error: "Repository URL is required" },
                { status: 400 }
            );
        }

        // Call the external analyze API endpoint
        const response = await fetch(
            "https://thecodeworks.in/smtgApi/api/analyze",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    repo_url: repoUrl.trim(),
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Repository not found or analysis failed.");
        }

        const data = await response.json();

        if (!data.success) {
            return NextResponse.json(
                { error: "Repository analysis was not successful." },
                { status: 500 }
            );
        }

        // Return the analysis data
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("GitHub repository analysis failed:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to analyze repository. Please check the URL and try again.",
            },
            { status: 500 }
        );
    }
}
