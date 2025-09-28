import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";

type RichTextItem = {
    type: "text";
    text: {
        content: string;
    };
    annotations?: {
        bold?: boolean;
        italic?: boolean;
        code?: boolean;
    };
};

// Function to convert markdown to Notion blocks
function markdownToNotionBlocks(markdown: string): BlockObjectRequest[] {
    const blocks: BlockObjectRequest[] = [];
    const lines = markdown.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
            continue; // Skip empty lines
        }

        // Handle headings
        if (line.startsWith("### ")) {
            blocks.push({
                object: "block",
                type: "heading_3",
                heading_3: {
                    rich_text: [
                        {
                            type: "text",
                            text: {
                                content: line.substring(4),
                            },
                        },
                    ],
                },
            });
        } else if (line.startsWith("## ")) {
            blocks.push({
                object: "block",
                type: "heading_2",
                heading_2: {
                    rich_text: [
                        {
                            type: "text",
                            text: {
                                content: line.substring(3),
                            },
                        },
                    ],
                },
            });
        } else if (line.startsWith("# ")) {
            blocks.push({
                object: "block",
                type: "heading_1",
                heading_1: {
                    rich_text: [
                        {
                            type: "text",
                            text: {
                                content: line.substring(2),
                            },
                        },
                    ],
                },
            });
        }
        // Handle unordered lists
        else if (line.startsWith("- ") || line.startsWith("* ")) {
            const bulletItems: BlockObjectRequest[] = [];
            let currentLine = i;

            // Collect all consecutive bullet points
            while (currentLine < lines.length) {
                const bulletLine = lines[currentLine].trim();
                if (
                    bulletLine.startsWith("- ") ||
                    bulletLine.startsWith("* ")
                ) {
                    bulletItems.push({
                        object: "block",
                        type: "bulleted_list_item",
                        bulleted_list_item: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content: bulletLine.substring(2),
                                    },
                                },
                            ],
                        },
                    });
                    currentLine++;
                } else {
                    break;
                }
            }

            blocks.push(...bulletItems);
            i = currentLine - 1; // Adjust the loop counter
        }
        // Handle ordered lists
        else if (/^\d+\.\s/.test(line)) {
            const numberedItems: BlockObjectRequest[] = [];
            let currentLine = i;

            // Collect all consecutive numbered points
            while (currentLine < lines.length) {
                const numberedLine = lines[currentLine].trim();
                if (/^\d+\.\s/.test(numberedLine)) {
                    const content = numberedLine.replace(/^\d+\.\s/, "");
                    numberedItems.push({
                        object: "block",
                        type: "numbered_list_item",
                        numbered_list_item: {
                            rich_text: [
                                {
                                    type: "text",
                                    text: {
                                        content: content,
                                    },
                                },
                            ],
                        },
                    });
                    currentLine++;
                } else {
                    break;
                }
            }

            blocks.push(...numberedItems);
            i = currentLine - 1; // Adjust the loop counter
        }
        // Handle regular paragraphs with basic formatting
        else {
            const richText = parseInlineFormatting(line);
            blocks.push({
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: richText,
                },
            });
        }
    }

    return blocks;
}

// Function to parse inline formatting (bold, italic, code)
function parseInlineFormatting(text: string): RichTextItem[] {
    const richText: RichTextItem[] = [];
    const currentText = text;

    // For simplicity, we'll handle the text as a single rich text block
    // In a more complex implementation, you'd parse and split the formatting
    richText.push({
        type: "text",
        text: {
            content: currentText
                .replace(/\*\*(.*?)\*\*/g, "$1")
                .replace(/\*(.*?)\*/g, "$1")
                .replace(/`(.*?)`/g, "$1"),
        },
        annotations: {
            bold: /\*\*(.*?)\*\*/.test(text),
            italic: /\*(.*?)\*/.test(text) && !/\*\*(.*?)\*\*/.test(text),
            code: /`(.*?)`/.test(text),
        },
    });

    return richText;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            notionToken,
            notionPageId,
            meetingName,
            summary,
            agentName,
            date,
            duration,
        } = body;

        // Validate required fields
        if (!notionToken || !notionPageId || !meetingName || !summary) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Initialize Notion client with the user's token
        const notion = new Client({
            auth: notionToken,
        });

        // Convert markdown summary to Notion blocks
        const summaryBlocks = markdownToNotionBlocks(summary);

        // Create a new page under the specified parent page
        const response = await notion.pages.create({
            parent: {
                page_id: notionPageId,
            },
            properties: {
                title: {
                    title: [
                        {
                            text: {
                                content: `Meeting Summary: ${meetingName}`,
                            },
                        },
                    ],
                },
            },
            children: [
                {
                    object: "block",
                    type: "heading_1",
                    heading_1: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: meetingName,
                                },
                            },
                        ],
                    },
                },
                {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: `Agent: ${agentName || "N/A"}`,
                                },
                            },
                        ],
                    },
                },
                {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: `Date: ${date || "N/A"}`,
                                },
                            },
                        ],
                    },
                },
                {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: `Duration: ${
                                        duration || "No duration"
                                    }`,
                                },
                            },
                        ],
                    },
                },
                {
                    object: "block",
                    type: "divider",
                    divider: {},
                },
                {
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: "Meeting Summary",
                                },
                            },
                        ],
                    },
                },
                // Spread the converted markdown blocks here
                ...summaryBlocks,
            ],
        });

        return NextResponse.json({
            success: true,
            pageId: response.id,
        });
    } catch (error: unknown) {
        console.error("Error creating Notion page:", error);

        // Handle specific Notion API errors
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "unauthorized"
        ) {
            return NextResponse.json(
                { error: "Invalid Notion token or insufficient permissions" },
                { status: 401 }
            );
        }

        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "object_not_found"
        ) {
            return NextResponse.json(
                { error: "Notion page not found or access denied" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create Notion page" },
            { status: 500 }
        );
    }
}
