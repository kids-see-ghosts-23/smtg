import { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    FormField,
    FormItem,
    FormControl,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { agentFormSchema } from "./agent-form";

interface AgentSourcesProps {
    onSourcesProcessed?: (content: string) => void;
    sourceType: "youtube" | "website" | "pdf";
    agentId?: string; // Optional agent ID for existing agents
    pendingPdfFiles?: File[]; // For new agents - files to upload after creation
    onPendingPdfFilesChange?: (files: File[]) => void; // Callback to update pending files
}

export const AgentSources = ({
    onSourcesProcessed,
    sourceType,
    agentId,
    pendingPdfFiles = [],
    onPendingPdfFilesChange,
}: AgentSourcesProps) => {
    const form = useFormContext<z.infer<typeof agentFormSchema>>();
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Process YouTube video transcript
    const processYouTubeVideo = async (url: string) => {
        try {
            // Extract video ID from various YouTube URL formats
            const videoId = extractYouTubeVideoId(url);
            if (!videoId) {
                throw new Error("Invalid YouTube URL");
            }

            setIsProcessing(true);

            const response = await fetch("/api/youtube-transcript", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to fetch transcript"
                );
            }

            const { content } = await response.json();
            return content;
        } catch (error: unknown) {
            console.error("YouTube transcript extraction failed:", error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to extract transcript from YouTube video. Please check the URL and try again."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // Process website content using web scraper
    const processWebsiteContent = async (url: string) => {
        try {
            // Validate URL format
            try {
                new URL(url);
            } catch {
                throw new Error("Invalid URL format");
            }

            setIsProcessing(true);

            const response = await fetch("/api/web-scraper", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to scrape website content"
                );
            }

            const { content } = await response.json();
            return content;
        } catch (error: unknown) {
            console.error("Website scraping failed:", error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to scrape content from the website. Please check the URL and try again."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // Process PDF file for RAG
    const processPDFFile = async (file: File) => {
        try {
            setIsProcessing(true);

            // This function is only called for existing agents
            // For new agents, files are stored in pendingPdfFiles state
            if (!agentId) {
                throw new Error("Agent ID is required for PDF processing.");
            }

            // Create FormData for file upload
            const formData = new FormData();
            formData.append("file", file);
            formData.append("agentId", agentId);

            // Call the RAG PDF API
            const response = await fetch("/api/rag-pdf", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to process PDF file"
                );
            }

            const result = await response.json();

            // Return a summary for the instructions
            return `Document "${file.name}" has been processed and added to the agent's knowledge base using RAG. The document contains ${result.chunkCount} chunks of information that will be used to enhance the agent's responses.`;
        } catch (error: unknown) {
            console.error("PDF processing failed:", error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Failed to process PDF file. Please try again."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle PDF file selection
    const handlePDFFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please select a PDF file.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            // 10MB limit
            toast.error("File size exceeds 10MB limit.");
            return;
        }

        // If agent exists, process immediately
        if (agentId) {
            processPDFFile(file)
                .then((content) => {
                    updateInstructions(content);
                    toast.success("PDF processed successfully!");
                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                })
                .catch((error) => {
                    toast.error(
                        error instanceof Error
                            ? error.message
                            : "An unexpected error occurred"
                    );
                });
        } else {
            // For new agents, add to pending files
            if (onPendingPdfFilesChange) {
                onPendingPdfFilesChange([...pendingPdfFiles, file]);
                toast.success(`${file.name} added.`);
                updateInstructions(
                    `Document "${file.name}" has been processed and added to the agent's knowledge base using RAG.`
                );
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        }
    };

    // Extract YouTube video ID from URL
    const extractYouTubeVideoId = (url: string): string | null => {
        const regExp =
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    // Handle YouTube URL submission
    const handleYouTubeSubmit = async () => {
        const youtubeUrl = form.getValues("youtubeUrl");

        if (!youtubeUrl?.trim()) {
            toast.warning("Please enter a YouTube URL first.");
            return;
        }

        try {
            const content = await processYouTubeVideo(youtubeUrl);
            updateInstructions(content);
            toast.success("YouTube video transcript processed successfully!");
            // Clear the input after successful processing
            form.setValue("youtubeUrl", "");
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"
            );
        }
    };

    // Handle website URL submission
    const handleWebsiteSubmit = async () => {
        const websiteUrl = form.getValues("websiteUrl");

        if (!websiteUrl?.trim()) {
            toast.warning("Please enter a website URL first.");
            return;
        }

        try {
            const content = await processWebsiteContent(websiteUrl);
            updateInstructions(content);
            toast.success("Website content processed successfully!");
            // Clear the input after successful processing
            form.setValue("websiteUrl", "");
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred"
            );
        }
    };

    // Update instructions with new content
    const updateInstructions = (newContent: string) => {
        const currentInstructions = form.getValues("instructions");
        const updatedInstructions = currentInstructions
            ? `${currentInstructions}\n\n${newContent}`
            : newContent;

        form.setValue("instructions", updatedInstructions);
        onSourcesProcessed?.(updatedInstructions);
    };

    return (
        <div className="space-y-4">
            {sourceType === "youtube" && (
                <FormField
                    name="youtubeUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormDescription className="text-xs text-muted-foreground">
                                Enter a YouTube URL to extract transcript
                                content for your agent.
                            </FormDescription>
                            <FormControl>
                                <div className="flex gap-2">
                                    <Input
                                        {...field}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isProcessing}
                                        onClick={handleYouTubeSubmit}
                                        className="shrink-0"
                                    >
                                        {isProcessing
                                            ? "Processing..."
                                            : "Extract"}
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {sourceType === "website" && (
                <FormField
                    name="websiteUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormDescription className="text-xs text-muted-foreground">
                                Enter a website URL to extract content for your
                                agent.
                            </FormDescription>
                            <FormControl>
                                <div className="flex gap-2">
                                    <Input
                                        {...field}
                                        placeholder="https://example.com"
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isProcessing}
                                        onClick={handleWebsiteSubmit}
                                        className="shrink-0"
                                    >
                                        {isProcessing
                                            ? "Processing..."
                                            : "Scrape"}
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            {sourceType === "pdf" && (
                <FormField
                    name="pdfFile"
                    render={() => (
                        <FormItem>
                            <FormDescription className="text-xs text-muted-foreground">
                                {agentId
                                    ? "Upload a PDF document to enhance your agent knowledge using RAG"
                                    : "Upload PDF documents. They will be processed after creating the agent."}
                            </FormDescription>
                            <FormControl>
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        ref={fileInputRef}
                                        onChange={handlePDFFileSelect}
                                        className="flex-1"
                                        disabled={isProcessing}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isProcessing}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="shrink-0"
                                    >
                                        {isProcessing
                                            ? "Processing..."
                                            : "Select"}
                                    </Button>
                                </div>
                            </FormControl>
                            {!agentId && pendingPdfFiles.length > 0 && (
                                <div className="space-y-2 mt-2">
                                    <p className="text-xs font-medium">
                                        Added files ({pendingPdfFiles.length}
                                        ):
                                    </p>
                                    <div className="space-y-1">
                                        {pendingPdfFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between text-xs bg-muted p-2 rounded"
                                            >
                                                <span className="truncate flex-1">
                                                    {file.name}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0 ml-2"
                                                    onClick={() => {
                                                        if (
                                                            onPendingPdfFilesChange
                                                        ) {
                                                            onPendingPdfFilesChange(
                                                                pendingPdfFiles.filter(
                                                                    (_, i) =>
                                                                        i !==
                                                                        index
                                                                )
                                                            );
                                                            toast.success(
                                                                `${file.name} removed`
                                                            );
                                                        }
                                                    }}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
    );
};
