import { useState } from "react";
import { AgentGetOne } from "../../types";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

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

    const form = useForm<z.infer<typeof agentsInsertSchema>>({
        resolver: zodResolver(agentsInsertSchema),
        defaultValues: {
            name: initialValues?.name ?? "",
            instructions: initialValues?.instructions ?? "",
        },
    });

    const isEdit = !!initialValues?.id;
    const isPending = createAgent.isPending || updateAgent.isPending;

    const [isEnhancing, setIsEnhancing] = useState(false);
    const [hasEnhanced, setHasEnhanced] = useState(false);

    // Handle Groq API call to enhance instructions
    const enhanceInstructions = async () => {
        const name = form.watch("name");
        const currentInstructions = form.watch("instructions");

        if (!name.trim()) {
            toast.warning("Please enter a name first.");
            return;
        }

        setIsEnhancing(true);

        try {
            const response = await fetch(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            {
                                role: "system",
                                content:
                                    "You are an expert at crafting clear, effective, and engaging AI agent instructions. Improve the following agent description to be more precise, helpful, and structured. RETURN ONLY AND ONLY THE ENHANCED PROMPT, NO CONVERSATIONAL FILLER.",
                            },
                            {
                                role: "user",
                                content: `The agent's name is "${name}". Currently, its instructions are: "${
                                    currentInstructions ||
                                    "No instructions provided."
                                }". 
                            Enhance these instructions to make them highly effective for an AI assistant. Be concise, professional, and action-oriented. `,
                            },
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error?.message || "Failed to enhance prompt."
                );
            }

            const data = await response.json();
            const enhancedText = data.choices[0]?.message?.content?.trim();

            if (enhancedText) {
                form.setValue("instructions", enhancedText);
                toast.success("Prompt enhanced successfully!");
                setHasEnhanced(true);
                throw new Error("Empty response from Groq.");
            }
        } catch (error: unknown) {
            console.error("Groq enhancement failed:", error);

            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(
                    "Failed to enhance prompt. Check your Groq API key and try again."
                );
            }
        } finally {
            setIsEnhancing(false);
        }
    };

    const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {
        if (isEdit) {
            updateAgent.mutate({ ...values, id: initialValues.id });
        } else {
            createAgent.mutate(values);
        }
    };

    return (
        <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <GeneratedAvatar
                    seed={form.watch("name")}
                    variant="botttsNeutral"
                    className="border size-16"
                />
                <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="e.g. smtg tutor"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    name="instructions"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Instructions</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Textarea
                                        {...field}
                                        placeholder="You are a helpful tutor that teaches smtg"
                                        className="min-h-[120px] max-h-[300px] overflow-y-auto resize-none border border-input bg-background rounded-md shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />

                                    {!hasEnhanced && !isEnhancing && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="absolute bottom-2 right-2"
                                            disabled={isPending}
                                            onClick={enhanceInstructions}
                                        >
                                            Enhance Prompt
                                        </Button>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
                        {isEdit ? "Update" : "Create"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
