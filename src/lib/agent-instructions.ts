import { toast } from "sonner";

interface EnhanceInstructionsParams {
    name: string;
    currentInstructions: string;
}

/**
 * Enhances agent instructions using Groq API
 * @param params - Object containing agent name and current instructions
 * @returns Promise<string> - Enhanced instructions text
 */
export async function enhanceInstructions({
    name,
    currentInstructions,
}: EnhanceInstructionsParams): Promise<string> {
    if (!name.trim()) {
        toast.warning("Please enter a name first.");
        throw new Error("Agent name is required");
    }

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
                                "You are an expert at crafting clear, effective, and engaging AI agent instructions. Create highly specialized and detailed instructions for an AI agent based on the user's specialization request. The instructions should clearly define the agent's expertise area, specific capabilities, and behavioral guidelines. RETURN ONLY AND ONLY THE ENHANCED PROMPT, NO CONVERSATIONAL FILLER",
                        },
                        {
                            role: "user",
                            content: `Create specialized instructions for an AI agent named "${name}" that specializes in: "${
                                currentInstructions ||
                                "No specialization provided."
                            }". 
                            
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

        if (!enhancedText) {
            throw new Error("Empty response from Groq.");
        }

        toast.success("Specialized prompt created successfully!");
        return enhancedText;
    } catch (error: unknown) {
        console.error("Groq enhancement failed:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to create specialized prompt. Check your Groq API key and try again.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
    }
}
