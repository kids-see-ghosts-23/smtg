import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Define the response structure
interface WebScrapingResponse {
    content: string;
    title?: string;
    metaDescription?: string;
    headings?: string[];
    links?: { text: string; url: string }[];
}

export async function GET() {
    return NextResponse.json({
        message: "Web Scraper API is working",
        usage: "POST a URL to scrape content from websites",
    });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            );
        }

        // Fetch the webpage content
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch URL. Status: ${response.status}` },
                { status: response.status }
            );
        }

        const html = await response.text();

        // Use Cheerio to parse and extract content
        const $ = cheerio.load(html);

        // Remove script and style elements
        $("script, style, nav, footer, aside").remove();

        // Extract title
        const title = $("title").text().trim();

        // Extract meta description
        const metaDescription =
            $('meta[name="description"]').attr("content") ||
            $('meta[property="og:description"]').attr("content") ||
            undefined;

        // Extract headings
        const headings: string[] = [];
        $("h1, h2, h3").each((i, elem) => {
            const headingText = $(elem).text().trim();
            if (headingText) {
                headings.push(headingText);
            }
        });

        // Extract main content (prioritize main, article, then body)
        let content = "";
        if ($("main").length > 0) {
            content = $("main").text();
        } else if ($("article").length > 0) {
            content = $("article").text();
        } else {
            content = $("body").text();
        }

        // Clean up content
        content = content
            .replace(/\s+/g, " ") // Replace multiple whitespace with single space
            .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
            .trim();

        // Limit content length to prevent oversized responses
        // const maxLength = 10000;
        // if (content.length > maxLength) {
        //     content =
        //         content.substring(0, maxLength) + "... (content truncated)";
        // }

        // Extract links
        const links: { text: string; url: string }[] = [];
        $("a[href]").each((i, elem) => {
            const linkText = $(elem).text().trim();
            const linkUrl = $(elem).attr("href");

            // Only include links with text and valid URLs
            if (linkText && linkUrl) {
                // Convert relative URLs to absolute URLs
                try {
                    const absoluteUrl = new URL(linkUrl, url).href;
                    links.push({ text: linkText, url: absoluteUrl });
                } catch {
                    // Skip invalid URLs
                }
            }
        });

        // Limit links to first 50 to prevent oversized responses
        const limitedLinks = links.slice(0, 50);

        const result: WebScrapingResponse = {
            content: `Web Page Content from ${url}:
${content}

Use this content to provide accurate information and assistance related to the website topic. When asked about specific parts of the page, reference the content as needed.`,
            title,
            metaDescription,
            headings: headings.slice(0, 20), // Limit headings
            links: limitedLinks,
        };

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("Web scraping failed:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to scrape content from the website. Please check the URL and try again.",
            },
            { status: 500 }
        );
    }
}
