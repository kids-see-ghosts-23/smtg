import { db } from "@/db";
import { agentDocuments, documentChunks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function saveDocument(
    agentId: string,
    name: string,
    url?: string
): Promise<string> {
    try {
        const [document] = await db
            .insert(agentDocuments)
            .values({
                agentId,
                name,
                url,
            })
            .returning({ id: agentDocuments.id });

        return document.id;
    } catch (error) {
        console.error("Error saving document:", error);
        throw new Error("Failed to save document");
    }
}

/**
 * Save document chunks with embeddings to the database
 * @param documentId - ID of the document
 * @param chunks - Array of chunks with embeddings
 * @returns Promise<void>
 */
export async function saveDocumentChunks(
    documentId: string,
    chunks: Array<{
        content: string;
        pageNumber: number;
        chunkNumber: number;
        embedding: number[];
    }>
): Promise<void> {
    try {
        // Convert embeddings to PostgreSQL vector format
        const chunkValues = chunks.map((chunk) => ({
            documentId,
            content: chunk.content,
            pageNumber: chunk.pageNumber?.toString() ?? null,
            chunkNumber: chunk.chunkNumber?.toString() ?? null,
            embedding: chunk.embedding,
        }));

        await db.insert(documentChunks).values(chunkValues);
    } catch (error) {
        console.error("Error saving document chunks:", error);
        throw new Error("Failed to save document chunks");
    }
}

/**
 * Find similar chunks based on a query embedding
 * @param agentId - ID of the agent to search for
 * @param queryEmbedding - Embedding vector for the query
 * @param limit - Maximum number of results to return
 * @returns Promise<Array<{ content: string; pageNumber: number; chunkNumber: number }>> - Similar chunks
 */
export async function findSimilarChunks(
    agentId: string,
    queryEmbedding: number[],
    limit: number = 5
): Promise<
    Array<{ content: string; pageNumber: number; chunkNumber: number }>
> {
    try {
        // First, get the document IDs for this agent
        const agentDocs = await db
            .select({ id: agentDocuments.id })
            .from(agentDocuments)
            .where(eq(agentDocuments.agentId, agentId));

        const documentIds = agentDocs.map((doc) => doc.id);

        if (documentIds.length === 0) {
            return [];
        }
        const similarChunks = await db
            .select({
                content: documentChunks.content,
                pageNumber: documentChunks.pageNumber,
                chunkNumber: documentChunks.chunkNumber,
            })
            .from(documentChunks)
            .where(eq(documentChunks.documentId, documentIds[0])) // Simplified for now
            .limit(limit);

        // Convert text fields back to numbers
        return similarChunks.map((chunk) => ({
            content: chunk.content,
            pageNumber: chunk.pageNumber ? parseInt(chunk.pageNumber, 10) : 0,
            chunkNumber: chunk.chunkNumber
                ? parseInt(chunk.chunkNumber, 10)
                : 0,
        }));
    } catch (error) {
        console.error("Error finding similar chunks:", error);
        throw new Error("Failed to find similar chunks");
    }
}
