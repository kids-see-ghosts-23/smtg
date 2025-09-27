import { toast } from "sonner";

interface FetchGithubRepoParams {
    repoUrl: string;
}

interface GitHubRepoData {
    name: string;
    owner: { login: string };
    description: string | null;
    language: string | null;
    full_name: string;
    contents_url: string;
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

    // Extract owner and repo name from URL
    const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/.*)?$/;
    const match = repoUrl.trim().match(githubRegex);

    if (!match) {
        toast.error("Please enter a valid GitHub repository URL.");
        throw new Error("Invalid GitHub repository URL format");
    }

    const [, owner, repo] = match;

    try {
        // First, get repository details
        const repoResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`
        );

        if (!repoResponse.ok) {
            throw new Error("Repository not found or inaccessible.");
        }

        const repoData: GitHubRepoData = await repoResponse.json();

        // Get repository contents to understand the codebase
        const contentsResponse = await fetch(
            repoData.contents_url.replace("{+path}", "")
        );

        if (!contentsResponse.ok) {
            throw new Error("Unable to access repository contents.");
        }

        const contents = await contentsResponse.json();

        // Look for common documentation files
        const readme = contents.find(
            (file: any) =>
                file.name.toLowerCase().includes("readme") &&
                file.type === "file"
        );

        let readmeContent = "";
        if (readme) {
            const readmeResponse = await fetch(readme.download_url);
            if (readmeResponse.ok) {
                readmeContent = await readmeResponse.text();
                // Truncate to reasonable length
                readmeContent = readmeContent.substring(0, 5000) + "...";
            }
        }

        // Create enhanced instructions based on repository information
        const enhancedInstructions = `You are an expert on the ${
            repoData.name
        } repository by ${repoData.owner.login}.
            
Repository Description: ${repoData.description || "No description provided"}

Primary Language: ${repoData.language || "Not specified"}

Repository Information:
${readmeContent || "No README content available"}

Use this knowledge to provide accurate information and assistance related to this repository. When asked about code or functionality, reference the repository structure and content as needed.`;

        toast.success(
            `Repository knowledge base created from ${repoData.full_name}!`
        );
        return enhancedInstructions;
    } catch (error: any) {
        console.error("GitHub repository fetch failed:", error);
        const errorMessage =
            error.message ||
            "Failed to fetch repository information. Please check the URL and try again.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
}
