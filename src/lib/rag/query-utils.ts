import OpenAI from "openai";
import { findSimilarChunks } from "./db-utils";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Query the RAG system to find relevant information based on a user question
 * @param agentId - ID of the agent to query
 * @param question - User's question
 * @returns Promise<string> - Relevant information from the knowledge base
 */
export async function queryRAG(
    agentId: string,
    question: string
): Promise<string> {
    try {
        // Generate embedding for the question
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: question,
        });

        const queryEmbedding = response.data[0].embedding;

        // Find similar chunks in the knowledge base
        const similarChunks = await findSimilarChunks(
            agentId,
            queryEmbedding,
            3
        );

        if (similarChunks.length === 0) {
            return "No relevant information found in the knowledge base.";
        }

        // Format the results
        const formattedResults = similarChunks
            .map(
                (chunk) =>
                    `Document (Page ${chunk.pageNumber}, Chunk ${chunk.chunkNumber}):\n${chunk.content}`
            )
            .join("\n\n");

        return formattedResults;
    } catch (error) {
        console.error("Error querying RAG system:", error);
        throw new Error("Failed to query the knowledge base");
    }
}

/**
 * Enhance agent instructions with RAG capabilities
 * @param baseInstructions - Original agent instructions
 * @param agentId - ID of the agent
 * @returns Promise<string> - Enhanced instructions with RAG guidance
 */
export async function enhanceInstructionsWithRAG(
    baseInstructions: string,
): Promise<string> {
    const enhancedInstructions = `${baseInstructions}

Knowledge Base Instructions:
When responding to user queries, you have access to a knowledge base of documents that have been processed using RAG (Retrieval-Augmented Generation). 
If a user's question might be answered by the documents in your knowledge base, you should first retrieve relevant information before formulating your response.

To use the knowledge base:
1. Identify if the question relates to specific information that might be in your documents
2. Formulate a precise query to retrieve relevant chunks
3. Use the retrieved information to enhance your response

Example format for knowledge base queries:
User: "What does the research say about large language models?"
Assistant: "Based on the research documents in my knowledge base, large language models are trained on massive text corpora to understand context and generate human-like text. Embeddings are numerical representations of text used for semantic similarity search."

Always prioritize accuracy and cite information when possible. If you cannot find relevant information, acknowledge that limitation.`;

    return enhancedInstructions;
}
