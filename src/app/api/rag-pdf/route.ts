import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { RAGService } from "@/modules/agents/services/rag-service";

export async function POST(req: NextRequest) {
    console.log("[RAG-PDF] Starting PDF upload processing...");

    try {
        console.log("[RAG-PDF] Checking authentication...");
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session) {
            console.log("[RAG-PDF] Unauthorized - no session found");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        console.log("[RAG-PDF] User authenticated:", session.user.id);

        console.log("[RAG-PDF] Parsing form data...");
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const agentId = formData.get("agentId") as string;

        console.log(
            "[RAG-PDF] File:",
            file?.name,
            "Type:",
            file?.type,
            "Size:",
            file?.size
        );
        console.log("[RAG-PDF] Agent ID:", agentId);

        if (!file) {
            console.log("[RAG-PDF] Error: No file provided");
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (!agentId) {
            console.log("[RAG-PDF] Error: No agent ID provided");
            return NextResponse.json(
                { error: "Agent ID is required" },
                { status: 400 }
            );
        }

        // Check file type
        if (file.type !== "application/pdf") {
            console.log("[RAG-PDF] Error: Invalid file type:", file.type);
            return NextResponse.json(
                { error: "Only PDF files are supported" },
                { status: 400 }
            );
        }

        // Convert File to ArrayBuffer
        console.log("[RAG-PDF] Converting file to ArrayBuffer...");
        const arrayBuffer = await file.arrayBuffer();
        console.log("[RAG-PDF] ArrayBuffer size:", arrayBuffer.byteLength);

        // Process PDF using RAG service
        console.log("[RAG-PDF] Starting RAG service processing...");
        const result = await RAGService.processPDF(
            arrayBuffer,
            agentId,
            file.name
        );

        console.log(
            "[RAG-PDF] Processing complete. Document ID:",
            result.documentId,
            "Chunks:",
            result.chunkCount
        );

        return NextResponse.json({
            success: true,
            message: `Document "${file.name}" processed successfully with ${result.chunkCount} chunks.`,
            documentId: result.documentId,
            chunkCount: result.chunkCount,
        });
    } catch (error) {
        console.error(
            "[RAG-PDF] ==================== ERROR ===================="
        );
        console.error("[RAG-PDF] Error occurred during PDF processing");
        console.error("[RAG-PDF] Error type:", error?.constructor?.name);
        console.error(
            "[RAG-PDF] Error message:",
            error instanceof Error ? error.message : String(error)
        );
        console.error(
            "[RAG-PDF] Error stack:",
            error instanceof Error ? error.stack : "No stack trace"
        );
        console.error(
            "[RAG-PDF] Full error object:",
            JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        );
        console.error(
            "[RAG-PDF] ==================================================="
        );

        return NextResponse.json(
            {
                error: "Failed to process PDF",
                details: error instanceof Error ? error.message : String(error),
                type: error?.constructor?.name || "UnknownError",
                stack:
                    process.env.NODE_ENV === "development" &&
                    error instanceof Error
                        ? error.stack
                        : undefined,
            },
            { status: 500 }
        );
    }
}
