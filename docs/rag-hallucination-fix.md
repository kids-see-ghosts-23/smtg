# RAG Hallucination Fix

## Problem

The AI agent was hallucinating and providing false information during meetings, even though PDF embeddings were being stored correctly in the database.

## Root Causes Identified

### 1. **No RAG Integration During Live Meetings**

The agent was joining meetings with only basic instructions, without accessing the knowledge base. The webhook handler wasn't querying the RAG system to retrieve relevant context from uploaded PDFs.

### 2. **Inefficient Similarity Search**

The `RAGService.query()` method wasn't performing actual vector similarity search. It was just returning the first few chunks without comparing embeddings, making it impossible to find relevant information.

### 3. **Missing Knowledge Context**

The agent had no access to the document content during conversations, so it would make up answers instead of using the stored information.

## Fixes Implemented

### 1. **Proper Vector Similarity Search**

Updated `RAGService.query()` to:

-   Generate embeddings for user queries
-   Calculate cosine similarity between query and all document chunks
-   Return the most relevant chunks ranked by similarity score
-   Search across all agent documents, not just the first one

```typescript
// Calculate cosine similarity
const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

// Sort by similarity and return top results
const topChunks = chunksWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
```

### 2. **Knowledge Base Integration**

Added `getAllKnowledgeContext()` method to:

-   Retrieve all document chunks for an agent
-   Format them as a structured knowledge base
-   Include document names, page numbers, and section numbers
-   Limit chunks per document to avoid token limits

### 3. **Enhanced Instructions with RAG**

Modified `enhanceInstructions()` to:

-   Load the entire knowledge base context
-   Inject it directly into the agent's system prompt
-   Add strict behavioral guidelines to prevent hallucination
-   Instruct the agent to cite sources and acknowledge when information is not available

### 4. **Webhook Integration**

Updated the webhook handler to:

-   Call `RAGService.enhanceInstructions()` when agent joins meeting
-   Pass enhanced instructions to OpenAI Realtime API
-   Include all document content in the session context

## Key Behavioral Guidelines Added

The enhanced instructions now include:

1. **Always prioritize information from the knowledge base** when answering questions
2. **Cite specific document names, pages, and sections** when referencing information
3. **If asked about something not in the knowledge base, clearly state that**
4. **Do not make up or hallucinate information** - stick to what's in the documents
5. **If unsure, acknowledge the uncertainty** rather than guessing
6. **Provide concise, accurate answers** based on the source material

## How It Works Now

1. **Meeting Start**: When a meeting begins, the webhook handler:

    - Fetches the agent's base instructions
    - Calls `RAGService.enhanceInstructions(agentId, baseInstructions)`
    - Retrieves all document chunks from the database
    - Formats them into a knowledge base section
    - Adds behavioral guidelines
    - Passes the complete instructions to OpenAI Realtime API

2. **During Meeting**: The agent has access to:

    - The full knowledge base in its system prompt
    - Document names, page numbers, and sections
    - Clear instructions on how to use the information
    - Guidelines to prevent hallucination

3. **When Responding**: The agent:
    - References the knowledge base in its context
    - Cites specific documents and sections
    - Acknowledges when information isn't available
    - Doesn't make up information

## Testing Recommendations

1. **Create a test meeting** with an agent that has PDFs uploaded
2. **Ask specific questions** about the PDF content
3. **Verify the agent cites** document names, pages, and sections
4. **Ask questions outside** the knowledge base and verify it says "I don't have that information"
5. **Check the logs** for:
    - `[RAGService] Enhancing instructions for agent`
    - `[RAGService] Knowledge context created, length: X`
    - `Enhanced instructions length: X`

## Future Improvements

1. **Dynamic RAG Retrieval**: Instead of loading all chunks upfront, implement function calling to query the knowledge base dynamically during conversation
2. **PostgreSQL Vector Search**: Use pgvector extensions for faster similarity search
3. **Chunk Selection Optimization**: Use more intelligent chunking strategies (semantic chunking)
4. **Reranking**: Add a reranking step after similarity search for better results
5. **Citation Links**: Include clickable links to specific pages in documents

## Files Modified

1. `/src/modules/agents/services/rag-service.ts`

    - Added proper vector similarity search
    - Added `getAllKnowledgeContext()` method
    - Enhanced `enhanceInstructions()` with knowledge base

2. `/src/app/api/webhook/route.ts`
    - Added RAGService import
    - Integrated RAG enhancement in meeting initialization
    - Enhanced logging for debugging
