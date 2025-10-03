import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract text from a PDF file
 * @param fileBuffer - Buffer containing the PDF file
 * @returns Promise<string> - Extracted text from the PDF
 */
export async function extractTextFromPDF(
    fileBuffer: ArrayBuffer
): Promise<string> {
    console.log("[PDF-Processor] Starting text extraction...");
    console.log("[PDF-Processor] Input buffer size:", fileBuffer.byteLength);

    try {
        // Dynamic import of pdf-parse to avoid webpack bundling issues
        console.log("[PDF-Processor] Dynamically importing pdf-parse...");
        const pdfParse = (await import("pdf-parse")).default;
        console.log("[PDF-Processor] pdf-parse imported successfully");

        // Convert ArrayBuffer to Buffer for pdf-parse
        console.log("[PDF-Processor] Converting ArrayBuffer to Buffer...");
        const buffer = Buffer.from(fileBuffer);
        console.log("[PDF-Processor] Buffer created. Size:", buffer.length);

        // Parse the PDF
        console.log("[PDF-Processor] Parsing PDF with pdf-parse...");
        const data = await pdfParse(buffer);
        console.log("[PDF-Processor] PDF parsed successfully");
        console.log("[PDF-Processor] Number of pages:", data.numpages);
        console.log("[PDF-Processor] Text length:", data.text.length);

        // Format the text with page information
        const numPages = data.numpages;
        const text = data.text;

        // Split by form feed characters (page breaks) if available
        // Otherwise return the full text
        const pages = text.split("\f").filter((page: string) => page.trim());
        console.log(
            "[PDF-Processor] Split into",
            pages.length,
            "pages by form feed"
        );

        let fullText = "";
        if (pages.length > 1) {
            pages.forEach((pageText: string, index: number) => {
                fullText += `Page ${index + 1}:\n${pageText.trim()}\n\n`;
            });
        } else {
            // If no page breaks found, treat as single page or split by approximate length
            fullText = `Page 1:\n${text}\n\n`;
        }

        console.log(
            "[PDF-Processor] Text extraction complete. Final length:",
            fullText.length
        );
        return fullText;
    } catch (error) {
        console.error(
            "[PDF-Processor] ========== ERROR IN extractTextFromPDF =========="
        );
        console.error("[PDF-Processor] Error type:", error?.constructor?.name);
        console.error(
            "[PDF-Processor] Error message:",
            error instanceof Error ? error.message : String(error)
        );
        console.error(
            "[PDF-Processor] Error stack:",
            error instanceof Error ? error.stack : "No stack"
        );
        console.error(
            "[PDF-Processor] ==================================================="
        );
        throw error instanceof Error
            ? error
            : new Error("Failed to extract text from PDF");
    }
}

/**
 * Split text into chunks
 * @param text - Text to split
 * @param chunkSize - Size of each chunk in characters
 * @param overlap - Overlap between chunks in characters
 * @returns Array of text chunks with metadata
 */
export function splitTextIntoChunks(
    text: string,
    chunkSize: number = 1000,
    overlap: number = 200
): Array<{ content: string; pageNumber: number; chunkNumber: number }> {
    const chunks: Array<{
        content: string;
        pageNumber: number;
        chunkNumber: number;
    }> = [];
    const pages = text.split("Page ");

    // Remove the first empty element
    pages.shift();

    for (const page of pages) {
        const pageNumberMatch = page.match(/^(\d+):/);
        if (!pageNumberMatch) continue;

        const pageNumber = parseInt(pageNumberMatch[1]);
        const pageContent = page.replace(/^\d+:\n/, "");

        // Split page content into chunks
        let position = 0;
        let chunkNumber = 1;

        while (position < pageContent.length) {
            const start = Math.max(0, position - (position > 0 ? overlap : 0));
            const end = Math.min(pageContent.length, start + chunkSize);
            const chunk = pageContent.substring(start, end);

            chunks.push({
                content: chunk.trim(),
                pageNumber,
                chunkNumber: chunkNumber++,
            });

            position = end - overlap;

            // If we're at the end, break
            if (end >= pageContent.length) break;
        }
    }

    return chunks;
}

/**
 * Generate embeddings for text chunks
 * @param chunks - Array of text chunks
 * @returns Promise<Array<{ content: string; embedding: number[] }>> - Chunks with embeddings
 */
export async function generateEmbeddings(
    chunks: Array<{ content: string; pageNumber: number; chunkNumber: number }>
): Promise<
    Array<{
        content: string;
        pageNumber: number;
        chunkNumber: number;
        embedding: number[];
    }>
> {
    console.log(
        "[PDF-Processor] Starting embedding generation for",
        chunks.length,
        "chunks"
    );

    try {
        const chunksWithEmbeddings = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // Skip empty chunks
            if (!chunk.content.trim()) {
                console.log(
                    `[PDF-Processor] Skipping empty chunk ${i + 1}/${
                        chunks.length
                    }`
                );
                continue;
            }

            console.log(
                `[PDF-Processor] Generating embedding for chunk ${i + 1}/${
                    chunks.length
                }...`
            );
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk.content,
            });

            const embedding = response.data[0].embedding;
            console.log(
                `[PDF-Processor] Embedding generated. Dimensions:`,
                embedding.length
            );

            chunksWithEmbeddings.push({
                ...chunk,
                embedding,
            });
        }

        console.log("[PDF-Processor] All embeddings generated successfully");
        return chunksWithEmbeddings;
    } catch (error) {
        console.error(
            "[PDF-Processor] ========== ERROR IN generateEmbeddings =========="
        );
        console.error("[PDF-Processor] Error type:", error?.constructor?.name);
        console.error(
            "[PDF-Processor] Error message:",
            error instanceof Error ? error.message : String(error)
        );
        console.error(
            "[PDF-Processor] Error stack:",
            error instanceof Error ? error.stack : "No stack"
        );
        console.error(
            "[PDF-Processor] OpenAI API Key present:",
            !!process.env.OPENAI_API_KEY
        );
        console.error(
            "[PDF-Processor] ============================================================"
        );
        throw error instanceof Error
            ? error
            : new Error("Failed to generate embeddings");
    }
}
