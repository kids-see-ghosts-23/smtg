import { useState } from 'react';
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
    FormDescription,
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
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { 
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
                            content: "You are an expert at crafting clear, effective, and engaging AI agent instructions. Create highly specialized and detailed instructions for an AI agent based on the user's specialization request. The instructions should clearly define the agent's expertise area, specific capabilities, and behavioral guidelines. RETURN ONLY AND ONLY THE ENHANCED PROMPT, NO CONVERSATIONAL FILLER",
                        },
                        {
                            role: "user",
                            content: `Create specialized instructions for an AI agent named "${name}" that specializes in: "${currentInstructions || 'No specialization provided.'}". 
                            
                            Requirements for the enhanced instructions:
                            1. Clearly define the agent's area of expertise
                            2. Specify what the agent should and shouldn't do
                            3. Include behavioral guidelines and response style
                            4. Define limitations and boundaries
                            5. Make it highly detailed and actionable
                            
                            Format the response as a clear, structured prompt that will guide the agent's behavior in all interactions.`,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 800,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Failed to enhance prompt.");
            }

            const data = await response.json();
            const enhancedText = data.choices[0]?.message?.content?.trim();

            if (enhancedText) {
                form.setValue("instructions", enhancedText);
                toast.success("Specialized prompt created successfully!");
                setHasEnhanced(true); 
            } else {
                throw new Error("Empty response from Groq.");
            }
        } catch (error: any) {
            console.error("Groq enhancement failed:", error);
            toast.error(
                error.message ||
                    "Failed to create specialized prompt. Check your Groq API key and try again."
            );
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
                                    placeholder="e.g. Math Tutor or Python Expert"
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
                            <FormLabel>Specialization</FormLabel>
                            <FormDescription>
                                Describe what this agent should specialize in. Be as specific as possible.
                            </FormDescription>
                            <FormControl>
                                <div className="relative">
                                    <Textarea
                                        {...field}
                                        placeholder="e.g. Python programming tutor specializing in data structures and algorithms"
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
                                            Create Specialized Prompt
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
                        {isEdit ? "Update" : "Create"} Specialized Agent
                    </Button>
                </div>
            </form>
        </Form>
    );
};