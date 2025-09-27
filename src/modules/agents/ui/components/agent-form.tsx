import { useState } from "react";
import { AgentGetOne } from "../../types";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Github, Youtube } from "lucide-react";
import { enhanceInstructions } from "@/lib/agent-instructions";
import { fetchGithubRepo } from "@/lib/github-repo";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { AgentSources } from "./agent-sources";

// Extend the schema to include githubRepo field
export const agentFormSchema = agentsInsertSchema.extend({
    githubRepo: z.string().optional().nullable(),
    youtubeUrl: z.string().optional(),
});

interface AgentFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialValues?: AgentGetOne;
}

export const AgentForm = ({
    onSuccess,
    onCancel,
    initialValues,
}: AgentFormProps) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const router = useRouter();

    const createAgent = useMutation(
        trpc.agents.create.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.agents.getMany.queryOptions({})
                );
                onSuccess?.();
            },
            onError: (error) => {
                toast.error(error.message);
                if (error.message.includes("forbidden")) {
                    router.push("/upgrade");
                }
            },
        })
    );

    const updateAgent = useMutation(
        trpc.agents.update.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.agents.getMany.queryOptions({})
                );
                if (initialValues?.id) {
                    await queryClient.invalidateQueries(
                        trpc.agents.getOne.queryOptions({
                            id: initialValues.id,
                        })
                    );
                }
                onSuccess?.();
            },
            onError: (error) => {
                toast.error(error.message);
                if (error.message.includes("forbidden")) {
                    router.push("/upgrade");
                }
            },
        })
    );

    const form = useForm<z.infer<typeof agentFormSchema>>({
        resolver: zodResolver(agentFormSchema),
        defaultValues: {
            name: initialValues?.name ?? "",
            instructions: initialValues?.instructions ?? "",
            githubRepo: initialValues?.githubRepo ?? "",
            youtubeUrl: "",
        },
    });

    const isEdit = !!initialValues?.id;
    const isPending = createAgent.isPending || updateAgent.isPending;

    const [isEnhancing, setIsEnhancing] = useState(false);
    const [hasEnhanced, setHasEnhanced] = useState(false);
    const [isFetchingRepo, setIsFetchingRepo] = useState(false);
    const [showGithubRepo, setShowGithubRepo] = useState(
        !!initialValues?.githubRepo
    );
    const [showYoutubeUrl, setShowYoutubeUrl] = useState(false);

    // Handle Groq API call to enhance instructions
    const handleEnhanceInstructions = async () => {
        const name = form.watch("name");
        const currentInstructions = form.watch("instructions");

        setIsEnhancing(true);

        try {
            const enhancedText = await enhanceInstructions({
                name,
                currentInstructions,
            });

            form.setValue("instructions", enhancedText);
            setHasEnhanced(true);
        } catch (error: unknown) {
            return toast.error((error as Error).message);
        } finally {
            setIsEnhancing(false);
        }
    };

    // Handle GitHub repository fetching
    const handleFetchGithubRepo = async () => {
        const repoUrl = form.watch("githubRepo");

        if (!repoUrl) return;

        setIsFetchingRepo(true);

        try {
            const githubData = await fetchGithubRepo({ repoUrl });
            form.setValue("instructions", githubData);
            setHasEnhanced(true);
        } catch (error: unknown) {
            return toast.error((error as Error).message);
        } finally {
            setIsFetchingRepo(false);
        }
    };

    const onSubmit = (values: z.infer<typeof agentFormSchema>) => {
        if (isEdit) {
            updateAgent.mutate({ ...values, id: initialValues.id });
        } else {
            createAgent.mutate(values);
        }
    };

    return (
        <FormProvider {...form}>
            <Form {...form}>
                <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <GeneratedAvatar
                        seed={form.watch("name")}
                        variant="botttsNeutral"
                        className="border size-16"
                    />

                    {/* Name Field */}
                    <FormField
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. Math Tutor or Python Expert"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Specialization Field */}
                    <FormField
                        name="instructions"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Specialization</FormLabel>
                                <FormDescription>
                                    Describe what this agent should specialize
                                    in. Be as specific as possible.
                                </FormDescription>
                                <FormControl>
                                    <div className="relative">
                                        <Textarea
                                            {...field}
                                            placeholder="e.g. Python programming tutor specializing in data structures and algorithms"
                                            className="min-h-[120px] max-h-[300px] overflow-y-auto resize-none pr-32"
                                        />

                                        {!hasEnhanced && !isEnhancing && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="absolute bottom-2 right-2"
                                                disabled={isPending}
                                                onClick={
                                                    handleEnhanceInstructions
                                                }
                                            >
                                                {isEnhancing
                                                    ? "Enhancing..."
                                                    : "Enhance"}
                                            </Button>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Knowledge Sources Section */}
                    <div className="space-y-4">
                        <div className="flex flex-col space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Knowledge Sources (Optional)
                            </h3>

                            <div className="flex flex-wrap gap-2">
                                {!showGithubRepo && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowGithubRepo(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <Github className="h-4 w-4" />
                                        GitHub Repository
                                    </Button>
                                )}

                                {!showYoutubeUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowYoutubeUrl(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <Youtube className="h-4 w-4" />
                                        YouTube Video
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* GitHub Repository Section */}
                        {showGithubRepo && (
                            <FormField
                                name="githubRepo"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="flex items-center gap-2">
                                                <Github className="h-4 w-4" />
                                                GitHub Repository
                                            </FormLabel>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setShowGithubRepo(false);
                                                    form.setValue(
                                                        "githubRepo",
                                                        ""
                                                    );
                                                }}
                                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                                ×
                                            </Button>
                                        </div>
                                        <FormDescription className="text-xs">
                                            Enter a GitHub repository URL to
                                            create a knowledge base for this
                                            agent.
                                        </FormDescription>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="https://github.com/owner/repository"
                                                    className="flex-1"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={
                                                        isPending ||
                                                        isFetchingRepo
                                                    }
                                                    onClick={
                                                        handleFetchGithubRepo
                                                    }
                                                    className="shrink-0"
                                                >
                                                    {isFetchingRepo
                                                        ? "Fetching..."
                                                        : "Use Repo"}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* YouTube Video Section */}
                        {showYoutubeUrl && (
                            <div className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Youtube className="h-4 w-4" />
                                        <h4 className="text-sm font-medium">
                                            YouTube Video
                                        </h4>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowYoutubeUrl(false);
                                            form.setValue("youtubeUrl", "");
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                        ×
                                    </Button>
                                </div>
                                <AgentSources
                                    onSourcesProcessed={() =>
                                        setHasEnhanced(true)
                                    }
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between gap-x-2">
                        {onCancel && (
                            <Button
                                variant="ghost"
                                disabled={isPending}
                                type="button"
                                onClick={() => onCancel()}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button disabled={isPending} type="submit">
                            {isEdit ? "Update" : "Create"} Agent
                        </Button>
                    </div>
                </form>
            </Form>
        </FormProvider>
    );
};
