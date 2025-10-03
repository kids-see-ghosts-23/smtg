import { db } from "@/db";
import { agentDocuments, documentChunks, agents } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import OpenAI from "openai";
import { saveDocument, saveDocumentChunks } from "@/lib/rag/db-utils";
import {
    extractTextFromPDF,
    splitTextIntoChunks,
    generateEmbeddings,
} from "@/lib/rag/pdf-processor";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class RAGService {
    /**
     * Process a PDF file and store its chunks with embeddings
     * @param fileBuffer - Buffer containing the PDF file
     * @param agentId - ID of the agent to associate with the document
     * @param fileName - Name of the file
     * @returns Promise<{ documentId: string; chunkCount: number }> - Processing result
     */
    static async processPDF(
        fileBuffer: ArrayBuffer,
        agentId: string,
        fileName: string
    ): Promise<{ documentId: string; chunkCount: number }> {
        try {
            console.log("[RAGService] Starting processPDF...");
            console.log("[RAGService] Agent ID:", agentId);
            console.log("[RAGService] File name:", fileName);
            console.log("[RAGService] Buffer size:", fileBuffer.byteLength);

            // Verify agent exists
            console.log("[RAGService] Verifying agent exists...");
            const [agent] = await db
                .select()
                .from(agents)
                .where(eq(agents.id, agentId));
            if (!agent) {
                console.error("[RAGService] Agent not found:", agentId);
                throw new Error("Agent not found");
            }
            console.log("[RAGService] Agent verified:", agent.name);

            // Extract text from PDF
            console.log("[RAGService] Extracting text from PDF...");
            const text = await extractTextFromPDF(fileBuffer);
            console.log(
                "[RAGService] Text extracted. Length:",
                text.length,
                "characters"
            );

            // Split text into chunks
            console.log("[RAGService] Splitting text into chunks...");
            const chunks = splitTextIntoChunks(text, 1000, 200);
            console.log("[RAGService] Created", chunks.length, "chunks");

            // Generate embeddings for chunks
            console.log("[RAGService] Generating embeddings...");
            const chunksWithEmbeddings = await generateEmbeddings(chunks);
            console.log(
                "[RAGService] Generated embeddings for",
                chunksWithEmbeddings.length,
                "chunks"
            );

            // Save document metadata
            console.log("[RAGService] Saving document metadata...");
            const documentId = await saveDocument(agentId, fileName);
            console.log("[RAGService] Document saved with ID:", documentId);

            // Save document chunks with embeddings
            console.log("[RAGService] Saving document chunks...");
            await saveDocumentChunks(documentId, chunksWithEmbeddings);
            console.log("[RAGService] Chunks saved successfully");

            return {
                documentId,
                chunkCount: chunksWithEmbeddings.length,
            };
        } catch (error) {
            console.error(
                "[RAGService] ========== ERROR IN processPDF =========="
            );
            console.error("[RAGService] Error type:", error?.constructor?.name);
            console.error(
                "[RAGService] Error message:",
                error instanceof Error ? error.message : String(error)
            );
            console.error(
                "[RAGService] Error stack:",
                error instanceof Error ? error.stack : "No stack"
            );
            console.error(
                "[RAGService] ============================================"
            );
            throw error instanceof Error
                ? error
                : new Error("Failed to process PDF file");
        }
    }

    /**
     * Query the RAG system to find relevant information using vector similarity
     * @param agentId - ID of the agent to query
     * @param query - User's query
     * @param limit - Maximum number of chunks to return
     * @returns Promise<Array<{ content: string; pageNumber: number; chunkNumber: number; similarity: number }>> - Relevant chunks
     */
    static async query(
        agentId: string,
        query: string,
        limit: number = 5
    ): Promise<
        Array<{
            content: string;
            pageNumber: number;
            chunkNumber: number;
            similarity: number;
        }>
    > {
        try {
            console.log("[RAGService] Querying with:", {
                agentId,
                query,
                limit,
            });

            // Generate embedding for the query
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: query,
            });

            const queryEmbedding = response.data[0].embedding;
            console.log("[RAGService] Query embedding generated");

            // Find the agent's documents
            const agentDocs = await db
                .select({ id: agentDocuments.id })
                .from(agentDocuments)
                .where(eq(agentDocuments.agentId, agentId));

            if (agentDocs.length === 0) {
                console.log("[RAGService] No documents found for agent");
                return [];
            }

            console.log("[RAGService] Found", agentDocs.length, "documents");

            // Get all chunks from all agent documents
            const allChunks = [];
            for (const doc of agentDocs) {
                const chunks = await db
                    .select({
                        content: documentChunks.content,
                        pageNumber: documentChunks.pageNumber,
                        chunkNumber: documentChunks.chunkNumber,
                        embedding: documentChunks.embedding,
                    })
                    .from(documentChunks)
                    .where(eq(documentChunks.documentId, doc.id));
                allChunks.push(...chunks);
            }

            console.log(
                "[RAGService] Total chunks retrieved:",
                allChunks.length
            );

            if (allChunks.length === 0) {
                console.log("[RAGService] No chunks found");
                return [];
            }

            // Calculate cosine similarity for each chunk
            const chunksWithSimilarity = allChunks.map((chunk) => {
                const chunkEmbedding = chunk.embedding as number[];

                // Calculate cosine similarity
                let dotProduct = 0;
                let normA = 0;
                let normB = 0;

                for (let i = 0; i < queryEmbedding.length; i++) {
                    dotProduct += queryEmbedding[i] * chunkEmbedding[i];
                    normA += queryEmbedding[i] * queryEmbedding[i];
                    normB += chunkEmbedding[i] * chunkEmbedding[i];
                }

                const similarity =
                    dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

                return {
                    content: chunk.content,
                    pageNumber: chunk.pageNumber
                        ? parseInt(chunk.pageNumber, 10)
                        : 0,
                    chunkNumber: chunk.chunkNumber
                        ? parseInt(chunk.chunkNumber, 10)
                        : 0,
                    similarity,
                };
            });

            // Sort by similarity (highest first) and take top results
            const topChunks = chunksWithSimilarity
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            console.log(
                "[RAGService] Top similarities:",
                topChunks.map((c) => c.similarity)
            );

            return topChunks;
        } catch (error) {
            console.error("[RAGService] Error querying RAG system:", error);
            throw new Error("Failed to query the knowledge base");
        }
    }

    /**
     * Get all knowledge context for an agent (first chunks from each document)
     * @param agentId - ID of the agent
     * @returns Promise<string> - Formatted knowledge context
     */
    static async getAllKnowledgeContext(agentId: string): Promise<string> {
        try {
            console.log(
                "[RAGService] Getting all knowledge for agent:",
                agentId
            );

            // Get all documents for the agent
            const agentDocs = await db
                .select({
                    id: agentDocuments.id,
                    name: agentDocuments.name,
                })
                .from(agentDocuments)
                .where(eq(agentDocuments.agentId, agentId));

            if (agentDocs.length === 0) {
                console.log("[RAGService] No documents found for agent");
                return "";
            }

            console.log("[RAGService] Found", agentDocs.length, "documents");

            // Get all chunks from all documents
            let knowledgeContext = "\n\n=== KNOWLEDGE BASE ===\n";
            knowledgeContext +=
                "You have access to the following documents. Use this information to answer questions accurately:\n\n";

            for (const doc of agentDocs) {
                const chunks = await db
                    .select({
                        content: documentChunks.content,
                        pageNumber: documentChunks.pageNumber,
                        chunkNumber: documentChunks.chunkNumber,
                    })
                    .from(documentChunks)
                    .where(eq(documentChunks.documentId, doc.id))
                    .orderBy(asc(documentChunks.chunkNumber))
                    .limit(20); // Limit to first 20 chunks per document to avoid token limits

                if (chunks.length > 0) {
                    knowledgeContext += `Document: ${doc.name}\n`;
                    for (const chunk of chunks) {
                        knowledgeContext += `[Page ${chunk.pageNumber}, Section ${chunk.chunkNumber}]\n${chunk.content}\n\n`;
                    }
                }
            }

            knowledgeContext += "=== END KNOWLEDGE BASE ===\n\n";
            knowledgeContext +=
                "IMPORTANT: When answering questions, refer to the knowledge base above. If asked about specific information, cite the relevant document, page, and section numbers. If information is not in the knowledge base, clearly state that you don't have that information in your documents.\n";

            console.log(
                "[RAGService] Knowledge context created, length:",
                knowledgeContext.length
            );
            return knowledgeContext;
        } catch (error) {
            console.error(
                "[RAGService] Error getting knowledge context:",
                error
            );
            return "";
        }
    }

    /**
     * Enhance agent instructions with RAG capabilities
     * @param agentId - ID of the agent
     * @param baseInstructions - Original agent instructions
     * @returns Promise<string> - Enhanced instructions
     */
    static async enhanceInstructions(
        agentId: string,
        baseInstructions: string
    ): Promise<string> {
        try {
            console.log(
                "[RAGService] Enhancing instructions for agent:",
                agentId
            );

            // Get all knowledge context
            const knowledgeContext = await this.getAllKnowledgeContext(agentId);

            if (!knowledgeContext) {
                // No documents, return base instructions
                console.log(
                    "[RAGService] No knowledge context, returning base instructions"
                );
                return baseInstructions;
            }

            // Enhance instructions with knowledge context
            const enhancedInstructions = `${baseInstructions}

${knowledgeContext}

Behavioral Guidelines:
1. Always prioritize information from the knowledge base when answering questions
2. Cite specific document names, pages, and sections when referencing information
3. If asked about something not in the knowledge base, clearly state that
4. Do not make up or hallucinate information - stick to what's in the documents
5. If you're unsure, acknowledge the uncertainty rather than guessing
6. Provide concise, accurate answers based on the source material`;

            console.log(
                "[RAGService] Instructions enhanced, total length:",
                enhancedInstructions.length
            );
            return enhancedInstructions;
        } catch (error) {
            console.error("[RAGService] Error enhancing instructions:", error);
            // Return base instructions if enhancement fails
            return baseInstructions;
        }
    }
}
