import { toast } from "sonner";

interface FetchGithubRepoParams {
    repoUrl: string;
}

interface AnalyzeApiResponse {
    success: boolean;
    summary: string;
    tree: string;
    chunk_count: number;
    [key: `chunk_${number}`]: string; // For chunk_1, chunk_2, etc.
}

/**
 * Fetches GitHub repository information and creates enhanced instructions
 * @param params - Object containing repository URL
 * @returns Promise<string> - Enhanced instructions based on repository content
 */
export async function fetchGithubRepo({
    repoUrl,
}: FetchGithubRepoParams): Promise<string> {
    if (!repoUrl?.trim()) {
        toast.warning("Please enter a GitHub repository URL first.");
        throw new Error("Repository URL is required");
    }

    try {
        // Call the proxy API endpoint to avoid CORS issues
        const response = await fetch("/api/github-analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                repoUrl: repoUrl.trim(),
            }),
        });

        if (!response.ok) {
            throw new Error("Repository not found or analysis failed.");
        }

        const data: AnalyzeApiResponse = await response.json();

        if (!data.success) {
            throw new Error("Repository analysis was not successful.");
        }

        // Process all chunks and combine them
        let allChunksContent = "";
        for (let i = 1; i <= data.chunk_count; i++) {
            const chunkKey = `chunk_${i}` as const;
            const chunkValue = data[chunkKey];
            if (chunkValue) {
                allChunksContent += chunkValue + "\n\n";
            }
        }

        // Create enhanced instructions based on repository information
        const enhancedInstructions = `You are an expert on this repository.

${data.summary}

## Directory Structure
${data.tree}

## Repository Code and Files
${allChunksContent}

Use this knowledge to provide accurate information and assistance related to this repository. When asked about code or functionality, reference the repository structure and content as needed. You have access to the complete codebase information provided above.`;

        toast.success(`Repository knowledge base created successfully!`);
        return enhancedInstructions;
    } catch (error: unknown) {
        console.error("GitHub repository fetch failed:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to fetch repository information. Please check the URL and try again.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
}
