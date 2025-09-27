import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { agentFormSchema } from "./agent-form";

interface AgentSourcesProps {
    onSourcesProcessed?: (content: string) => void;
}

export const AgentSources = ({ onSourcesProcessed }: AgentSourcesProps) => {
    const form = useFormContext<z.infer<typeof agentFormSchema>>();
    const [isProcessing, setIsProcessing] = useState(false);

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
        } catch (error: any) {
            console.error("YouTube transcript extraction failed:", error);
            throw new Error(
                error.message ||
                    "Failed to extract transcript from YouTube video. Please check the URL and try again."
            );
        } finally {
            setIsProcessing(false);
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
        } catch (error: any) {
            toast.error(error.message);
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
        <FormField
            name="youtubeUrl"
            render={({ field }) => (
                <FormItem>
                    <FormDescription className="text-xs text-muted-foreground">
                        Enter a YouTube URL to extract transcript content for
                        your agent.
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
                                {isProcessing ? "Processing..." : "Extract"}
                            </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
