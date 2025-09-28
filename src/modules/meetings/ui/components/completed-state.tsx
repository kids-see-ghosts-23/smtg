import { MeetingGetOne } from "../../types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MindMap } from "./mindmap";
import Markdown from "react-markdown";
import {
    BookOpenTextIcon,
    ClockFadingIcon,
    FileTextIcon,
    FileVideoIcon,
    SparklesIcon,
    MailIcon,
    NotebookPenIcon,
	BrainIcon
} from "lucide-react";
import { GeneratedAvatar } from "@/components/generated-avatar";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { Transcript } from "./transcript";
import { ChatProvider } from "./chat-provider";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    data: MeetingGetOne;
}

export const CompletedState = ({ data }: Props) => {
    const { data: authData, isPending } = authClient.useSession();
    const [isEmailSending, setIsEmailSending] = useState(false);
    const [isNotionSending, setIsNotionSending] = useState(false);

    // Safely handle potentially null values with fallbacks
    const meetingSummary = data.summary ?? "No summary available";

    const handleSendEmail = async () => {
        if (!authData?.user?.email) {
            toast.error("User email not found");
            return;
        }

        setIsEmailSending(true);

        try {
            const response = await fetch("/api/send-summary-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: authData.user.email,
                    meetingName: data.name,
                    summary: meetingSummary,
                    agentName: data.agent.name,
                    date: data.startedAt
                        ? format(data.startedAt, "PPP")
                        : "N/A",
                    duration: data.duration
                        ? formatDuration(data.duration)
                        : "No duration",
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server response:", errorText);
                throw new Error(
                    `Server error: ${response.status} ${response.statusText}`
                );
            }

            const result = await response.json();

            if (result.success) {
                toast.success(
                    "Meeting summary sent to your email successfully!"
                );
            } else {
                throw new Error(result.error || "Failed to send email");
            }
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error(
                `Failed to send email: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setIsEmailSending(false);
        }
    };

    const handleSendToNotion = async () => {
        const notionToken = localStorage.getItem("notionToken");
        const notionPageId = localStorage.getItem("notionPageId");

        if (!notionToken || !notionPageId) {
            toast.error(
                "Notion not connected. Please connect your Notion account first."
            );
            return;
        }

        setIsNotionSending(true);

        try {
            const response = await fetch("/api/send-summary-notion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    notionToken,
                    notionPageId,
                    meetingName: data.name,
                    summary: data.summary ?? "",
                    agentName: data.agent.name,
                    date: data.startedAt
                        ? format(data.startedAt, "PPP")
                        : "N/A",
                    duration: data.duration
                        ? formatDuration(data.duration)
                        : "No duration",
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server response:", errorText);
                throw new Error(
                    `Server error: ${response.status} ${response.statusText}`
                );
            }

            const result = await response.json();

            if (result.success) {
                toast.success("Meeting summary sent to Notion successfully!");
            } else {
                throw new Error(result.error || "Failed to send to Notion");
            }
        } catch (error) {
            console.error("Error sending to Notion:", error);
            toast.error(
                `Failed to send to Notion: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
        } finally {
            setIsNotionSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-y-4">
            <Tabs defaultValue="summary">
                <div className="bg-white rounded-lg border px-3">
                    <ScrollArea>
                        <TabsList className="p-0 bg-background justify-start rounded-none h-13">
                            <TabsTrigger
                                value="summary"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <BookOpenTextIcon />
                                Summary
                            </TabsTrigger>
                            <TabsTrigger
                                value="transcript"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <FileTextIcon />
                                Transcript
                            </TabsTrigger>
                            <TabsTrigger
                                value="recording"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <FileVideoIcon />
                                Recording
                            </TabsTrigger>
                            <TabsTrigger
                                value="chat"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <SparklesIcon />
                                Ask AI
                            </TabsTrigger>
                            <TabsTrigger
                                value="mindmap"
                                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                            >
                                <BrainIcon />
                                Mind Map
                            </TabsTrigger>
                        </TabsList>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>

                <TabsContent value="chat">
                    <ChatProvider meetingId={data.id} meetingName={data.name} />
                </TabsContent>
                <TabsContent value="transcript">
                    <Transcript meetingId={data.id} />
                </TabsContent>
                <TabsContent value="mindmap">
                    <MindMap summary={data.summary ?? ""} />
                </TabsContent>
                <TabsContent value="recording">
                    <div className="bg-white rounded-lg border px-4 py-5">
                        <video
                            src={data.recordingUrl ?? ""}
                            className="w-full rounded-lg"
                            controls
                        />
                    </div>
                </TabsContent>
                <TabsContent value="summary">
                    <div className="bg-white rounded-lg border relative">
                        <div className="absolute top-4 right-4 flex items-center gap-x-2 z-10">
                            <Button
                                onClick={handleSendToNotion}
                                disabled={isNotionSending}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-x-2"
                            >
                                <NotebookPenIcon className="size-4" />
                                {isNotionSending
                                    ? "Sending..."
                                    : "Send to Notion"}
                            </Button>
                            <Button
                                onClick={handleSendEmail}
                                disabled={
                                    isEmailSending ||
                                    isPending ||
                                    !authData?.user?.email
                                }
                                className="flex items-center gap-x-2"
                                variant="outline"
                                size="sm"
                            >
                                <MailIcon className="size-4" />
                                {isEmailSending
                                    ? "Sending..."
                                    : "Email Summary"}
                            </Button>
                        </div>
                        <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
                            <h2 className="text-2xl font-medium capitalize pr-32">
                                {data.name}
                            </h2>
                            <div className="flex gap-x-2 items-center">
                                <Link
                                    href={`/agents/${data.agent.id}`}
                                    className="flex items-center gap-x-2 underline underline-offset-4 capitalize"
                                >
                                    <GeneratedAvatar
                                        variant="botttsNeutral"
                                        seed={data.agent.name}
                                        className="size-5"
                                    />
                                    {data.agent.name}
                                </Link>{" "}
                                <p>
                                    {data.startedAt
                                        ? format(data.startedAt, "PPP")
                                        : ""}
                                </p>
                            </div>
                            <div className="flex gap-x-2 items-center">
                                <SparklesIcon className="size-4" />
                                <p> General summary </p>
                            </div>
                            <Badge
                                variant="outline"
                                className="flex items-center gap-x-2 [&>svg]:size-4"
                            >
                                <ClockFadingIcon className="text-blue-700 " />
                                {data.duration
                                    ? formatDuration(data.duration)
                                    : "No duration"}
                            </Badge>
                            <div>
                                <Markdown
                                    components={{
                                        h1: (props) => (
                                            <h1
                                                className="text-2xl font-medium mb-6"
                                                {...props}
                                            />
                                        ),
                                        h2: (props) => (
                                            <h2
                                                className="text-xl font-medium mb-6"
                                                {...props}
                                            />
                                        ),
                                        h3: (props) => (
                                            <h3
                                                className="text-lg font-medium mb-6"
                                                {...props}
                                            />
                                        ),
                                        h4: (props) => (
                                            <h4
                                                className="text-base font-medium mb-6"
                                                {...props}
                                            />
                                        ),
                                        h5: (props) => (
                                            <h5
                                                className="text-sm font-medium mb-6"
                                                {...props}
                                            />
                                        ),
                                        h6: (props) => (
                                            <h6
                                                className="text-xs font-medium mb-6"
                                                {...props}
                                            />
                                        ),
                                        p: (props) => (
                                            <p
                                                className="leading-relaxed mb-6"
                                                {...props}
                                            />
                                        ),
                                        ul: (props) => (
                                            <ul
                                                className="list-disc list-inside mb-6"
                                                {...props}
                                            />
                                        ),
                                        ol: (props) => (
                                            <ol
                                                className="list-decimal list-inside mb-6"
                                                {...props}
                                            />
                                        ),
                                        li: (props) => (
                                            <li className="mb-1" {...props} />
                                        ),
                                        strong: (props) => (
                                            <strong
                                                className="font-semibold"
                                                {...props}
                                            />
                                        ),
                                        em: (props) => (
                                            <em
                                                className="font-semibold"
                                                {...props}
                                            />
                                        ),
                                        code: (props) => (
                                            <code
                                                className="bg-gray-100 px-1 py-0.5 rounded"
                                                {...props}
                                            />
                                        ),
                                        blockquote: (props) => (
                                            <blockquote
                                                className="border-l-4 pl-4 my-4 italic"
                                                {...props}
                                            />
                                        ),
                                    }}
                                >
                                    {data.summary ?? ""}
                                </Markdown>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
