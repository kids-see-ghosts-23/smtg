# tRPC Implementation Documentation

## Table of Contents

-   [What is tRPC?](#what-is-trpc)
-   [Why tRPC?](#why-trpc)
-   [Core Components](#core-components)
-   [Server Setup](#server-setup)
-   [Client Setup](#client-setup)
-   [Routers & Procedures](#routers--procedures)
-   [Usage Examples](#usage-examples)
-   [Best Practices](#best-practices)

---

## What is tRPC?

**tRPC** (TypeScript Remote Procedure Call) is a library that enables you to build fully type-safe APIs without schemas or code generation. It allows your frontend and backend to communicate using TypeScript types that are automatically synchronized between client and server.

### Key Concepts

-   **No Code Generation**: Unlike GraphQL or OpenAPI, tRPC doesn't require code generation
-   **End-to-End Type Safety**: TypeScript types flow seamlessly from server to client
-   **RPC-Style API**: Call backend functions as if they were local functions
-   **Framework Agnostic**: Works with React, Next.js, Vue, and more

---

## Why tRPC?

### Problems tRPC Solves

#### 1. **Type Mismatch Between Frontend and Backend**

Traditional REST APIs often lead to type mismatches:

```typescript
// ❌ Without tRPC - No type safety
const response = await fetch("/api/agents/123");
const agent = await response.json(); // 'any' type - no autocomplete, no errors
```

#### 2. **Manual API Documentation**

REST/GraphQL require maintaining separate API documentation that can become outdated.

#### 3. **Boilerplate Code**

Writing API routes, validators, and types separately creates redundancy.

#### 4. **Runtime Errors**

Type mismatches are only caught at runtime, leading to production bugs.

### How tRPC Solves These Issues

✅ **Full Type Safety**: Your IDE knows exactly what data shape to expect

```typescript
// ✅ With tRPC - Full type safety
const { data } = trpc.agents.getOne.useQuery({ id: "123" });
// 'data' is fully typed - autocomplete & compile-time errors
```

✅ **Automatic Documentation**: Types serve as living documentation  
✅ **DRY Principle**: Define once, use everywhere  
✅ **Catch Errors Early**: Compile-time validation prevents runtime bugs  
✅ **Developer Experience**: IntelliSense, autocomplete, and refactoring support

### When to Use tRPC

**Good Fit:**

-   Full-stack TypeScript applications
-   Monorepo architectures
-   Next.js applications
-   Internal APIs where client and server are owned by the same team

**Not Ideal For:**

-   Public APIs consumed by third parties
-   Non-TypeScript clients
-   Microservices with different tech stacks

---

## Core Components

The SMTG application's tRPC implementation consists of:

| Component           | Purpose                                          | Location                             |
| ------------------- | ------------------------------------------------ | ------------------------------------ |
| **Context**         | Provides request context (user session, headers) | `src/trpc/init.ts`                   |
| **Procedures**      | Define procedure types (public, protected)       | `src/trpc/init.ts`                   |
| **Routers**         | Group related procedures                         | `src/trpc/routers/_app.ts`           |
| **Client Provider** | React integration with React Query               | `src/trpc/client.tsx`                |
| **API Routes**      | Module-specific endpoints                        | `src/modules/*/server/procedures.ts` |

---

## Server Setup

The server-side tRPC configuration establishes the foundation for type-safe API endpoints.

### 1. Context Creation

**File:** `src/trpc/init.ts`

The context is created for each request and provides shared data to all procedures:

```typescript
export const createTRPCContext = cache(async () => {
    return { userId: "user_123" };
});
```

**Key Points:**

-   Uses React's `cache()` for request deduplication
-   Available to all procedures via `ctx` parameter
-   Extended by middleware (e.g., auth adds session)

---

### 2. tRPC Instance Initialization

```typescript
const t = initTRPC.create({
    // Optional: Add data transformers like superjson
    // transformer: superjson,
});
```

**Purpose:** Creates the core tRPC instance with configuration options.

---

### 3. Procedure Types

#### Base Procedure

Public procedures accessible without authentication:

```typescript
export const baseProcedure = t.procedure;
```

#### Protected Procedure

Authenticated procedures that require a valid user session:

```typescript
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Unauthorized",
        });
    }

    return next({
        ctx: {
            ...ctx,
            auth: session,
        },
    });
});
```

**Features:**

-   ✅ Automatically validates user session
-   ✅ Enriches context with `auth` object
-   ✅ Throws typed error on missing session
-   ✅ All subsequent procedures get `ctx.auth`

---

### 4. Router & Caller Factory

```typescript
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
```

**Usage:**

-   `createTRPCRouter`: Combines procedures into logical groups
-   `createCallerFactory`: Enables server-side procedure calls

---

## Client Setup

The client-side setup integrates tRPC with React Query for optimal data fetching and caching.

**File:** `src/trpc/client.tsx`

---

### 1. tRPC Context Creation

```typescript
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
```

-   `TRPCProvider`: Wraps your app to provide tRPC context
-   `useTRPC`: Hook to access tRPC client in components

---

### 2. Query Client Management

```typescript
let browserQueryClient: QueryClient;

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return makeQueryClient();
    }
    // Browser: reuse existing client to prevent state loss
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}
```

**Strategy:**

-   **Server-Side**: New client per request (stateless)
-   **Client-Side**: Singleton pattern to preserve cache across renders

---

### 3. URL Configuration

```typescript
function getUrl() {
    const base = (() => {
        if (typeof window !== "undefined") return "";
        return process.env.NEXT_PUBLIC_APP_URL;
    })();
    return `${base}/api/trpc`;
}
```

**Behavior:**

-   Browser: Relative URL (`/api/trpc`)
-   Server: Absolute URL for SSR

---

### 4. Provider Component

```typescript
export function TRPCReactProvider(
    props: Readonly<{ children: React.ReactNode }>
) {
    const queryClient = getQueryClient();
    const [trpcClient] = useState(() =>
        createTRPCClient<AppRouter>({
            links: [
                httpBatchLink({
                    url: getUrl(),
                }),
            ],
        })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                {props.children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}
```

**Key Features:**

-   ✅ HTTP batch link for request batching
-   ✅ React Query integration for caching
-   ✅ Type-safe with `AppRouter` type
-   ✅ SSR-compatible setup

---

### 5. Integration in App Layout

```typescript
// app/layout.tsx
import { TRPCReactProvider } from "@/trpc/client";

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <TRPCReactProvider>{children}</TRPCReactProvider>
            </body>
        </html>
    );
}
```

---

## Routers & Procedures

Routers organize related procedures into logical groups. Each procedure defines an API endpoint with input validation and business logic.

**File:** `src/trpc/routers/_app.ts`

---

### Application Router

The main router combines all feature routers:

```typescript
export const appRouter = createTRPCRouter({
    agents: agentsRouter,
    meetings: meetingsRouter,
});

export type AppRouter = typeof appRouter;
```

**Type Export:** The `AppRouter` type is crucial - it's used by the client for type inference.

---

### Agents Router

**File:** `src/modules/agents/server/procedures.ts`

Handles all agent-related operations.

#### Queries (Data Fetching)

| Procedure | Purpose                | Input                         | Output                   |
| --------- | ---------------------- | ----------------------------- | ------------------------ |
| `getOne`  | Fetch single agent     | `{ id: string }`              | Agent with meeting count |
| `getMany` | Fetch paginated agents | `{ page, pageSize, search? }` | Paginated agent list     |

#### Mutations (Data Modification)

| Procedure | Purpose               | Input              | Output        |
| --------- | --------------------- | ------------------ | ------------- |
| `create`  | Create new agent      | Agent data         | Created agent |
| `update`  | Update existing agent | Agent data with ID | Updated agent |
| `remove`  | Delete agent          | `{ id: string }`   | Deleted agent |

---

### Meetings Router

**File:** `src/modules/meetings/server/procedures.ts`

Handles all meeting-related operations.

#### Queries

| Procedure           | Purpose                     | Input                                  | Output                   |
| ------------------- | --------------------------- | -------------------------------------- | ------------------------ |
| `getOne`            | Fetch single meeting        | `{ id: string }`                       | Meeting with agent info  |
| `getMany`           | Fetch paginated meetings    | `{ page, pageSize, status?, search? }` | Paginated meeting list   |
| `getTranscript`     | Fetch meeting transcript    | `{ meetingId: string }`                | Transcript with speakers |
| `generateToken`     | Generate Stream Video token | None                                   | Video token string       |
| `generateChatToken` | Generate Stream Chat token  | None                                   | Chat token string        |

#### Mutations

| Procedure | Purpose                 | Input                | Output          |
| --------- | ----------------------- | -------------------- | --------------- |
| `create`  | Create new meeting      | Meeting data         | Created meeting |
| `update`  | Update existing meeting | Meeting data with ID | Updated meeting |
| `remove`  | Delete meeting          | `{ id: string }`     | Deleted meeting |

---

### Procedure Anatomy

Each procedure follows a consistent pattern:

```typescript
export const agentsRouter = createTRPCRouter({
    getOne: protectedProcedure
        // 1. Input validation with Zod
        .input(z.object({ id: z.string() }))
        // 2. Query/Mutation handler
        .query(async ({ input, ctx }) => {
            // 3. Database operation
            const [agent] = await db
                .select()
                .from(agents)
                .where(
                    and(
                        eq(agents.id, input.id),
                        eq(agents.userId, ctx.auth.user.id)
                    )
                );

            // 4. Error handling
            if (!agent) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Agent not found",
                });
            }

            // 5. Return typed response
            return agent;
        }),
});
```

**Steps:**

1. **Input Validation**: Zod schema validates incoming data
2. **Handler Type**: `.query()` for reads, `.mutation()` for writes
3. **Business Logic**: Database queries, external API calls, etc.
4. **Error Handling**: Throw `TRPCError` with appropriate code
5. **Response**: Return is automatically typed

---

### Input Validation with Zod

```typescript
// Simple validation
.input(z.object({
    id: z.string()
}))

// Complex validation with defaults
.input(z.object({
    page: z.number().default(1),
    pageSize: z.number().min(10).max(100).default(20),
    search: z.string().nullish(),
}))

// Reusable schema
import { agentsInsertSchema } from "../schemas";
.input(agentsInsertSchema)
```

---

### Error Codes

tRPC provides standard error codes:

| Code                    | HTTP Status | Use Case                           |
| ----------------------- | ----------- | ---------------------------------- |
| `UNAUTHORIZED`          | 401         | Missing/invalid authentication     |
| `FORBIDDEN`             | 403         | Authenticated but lacks permission |
| `NOT_FOUND`             | 404         | Resource doesn't exist             |
| `BAD_REQUEST`           | 400         | Invalid input data                 |
| `INTERNAL_SERVER_ERROR` | 500         | Unexpected server error            |

**Example:**

```typescript
throw new TRPCError({
    code: "NOT_FOUND",
    message: "Agent not found",
});
```

---

## Usage Examples

### Client-Side Usage (React Components)

#### Queries (Data Fetching)

**Fetch Single Item:**

```typescript
import { useTRPC } from "@/trpc/client";

function AgentDetails({ agentId }: { agentId: string }) {
    const trpc = useTRPC();

    const { data, isLoading, error } = trpc.agents.getOne.useQuery({
        id: agentId,
    });

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error.message} />;

    return (
        <div>
            <h1>{data.name}</h1>
            <p>Meetings: {data.meetingCount}</p>
        </div>
    );
}
```

**Fetch Multiple Items with Pagination:**

```typescript
function AgentsList() {
    const trpc = useTRPC();
    const [page, setPage] = useState(1);

    const { data, isLoading } = trpc.agents.getMany.useQuery({
        page,
        pageSize: 20,
        search: "AI Assistant",
    });

    return (
        <div>
            {data?.items.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
            ))}
            <Pagination
                currentPage={page}
                totalPages={data?.totalPages ?? 0}
                onPageChange={setPage}
            />
        </div>
    );
}
```

---

#### Mutations (Data Modification)

**Create New Item:**

```typescript
function CreateAgentForm() {
    const trpc = useTRPC();

    const createAgent = trpc.agents.create.useMutation({
        onSuccess: (data) => {
            toast.success(`Agent ${data.name} created!`);
            router.push(`/agents/${data.id}`);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (formData: FormData) => {
        createAgent.mutate({
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            instructions: formData.get("instructions") as string,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <button type="submit" disabled={createAgent.isPending}>
                {createAgent.isPending ? "Creating..." : "Create Agent"}
            </button>
        </form>
    );
}
```

**Update Existing Item:**

```typescript
function UpdateAgentForm({ agent }: { agent: Agent }) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const updateAgent = trpc.agents.update.useMutation({
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({
                queryKey: [["agents", "getOne"], { id: agent.id }],
            });
            toast.success("Agent updated successfully!");
        },
    });

    const handleUpdate = (updates: Partial<Agent>) => {
        updateAgent.mutate({
            id: agent.id,
            ...updates,
        });
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleUpdate({ name: e.target.name.value });
            }}
        >
            {/* Form fields */}
        </form>
    );
}
```

**Delete Item:**

```typescript
function DeleteAgentButton({ agentId }: { agentId: string }) {
    const trpc = useTRPC();
    const router = useRouter();

    const deleteAgent = trpc.agents.remove.useMutation({
        onSuccess: () => {
            toast.success("Agent deleted");
            router.push("/agents");
        },
    });

    return (
        <button
            onClick={() => deleteAgent.mutate({ id: agentId })}
            disabled={deleteAgent.isPending}
        >
            {deleteAgent.isPending ? "Deleting..." : "Delete"}
        </button>
    );
}
```

---

### Server-Side Usage (Server Components / API Routes)

**Call Procedures Server-Side:**

```typescript
import { appRouter } from "@/trpc/routers/_app";
import { createTRPCContext } from "@/trpc/init";

// Create a caller instance
const caller = appRouter.createCaller(await createTRPCContext());

// Fetch data
const agent = await caller.agents.getOne({ id: agentId });

// Use in Server Component
export default async function AgentPage({
    params,
}: {
    params: { id: string };
}) {
    const agent = await caller.agents.getOne({ id: params.id });

    return <AgentDetails agent={agent} />;
}
```

---

### Advanced Patterns

#### Optimistic Updates

```typescript
const updateAgent = trpc.agents.update.useMutation({
    onMutate: async (newData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
            queryKey: [["agents", "getOne"], { id: newData.id }],
        });

        // Snapshot previous value
        const previous = queryClient.getQueryData([
            ["agents", "getOne"],
            { id: newData.id },
        ]);

        // Optimistically update
        queryClient.setQueryData(
            [["agents", "getOne"], { id: newData.id }],
            newData
        );

        return { previous };
    },
    onError: (err, newData, context) => {
        // Rollback on error
        queryClient.setQueryData(
            [["agents", "getOne"], { id: newData.id }],
            context?.previous
        );
    },
});
```

#### Infinite Queries

```typescript
const { data, fetchNextPage, hasNextPage } =
    trpc.agents.getMany.useInfiniteQuery(
        { pageSize: 20 },
        {
            getNextPageParam: (lastPage, pages) => {
                return pages.length < lastPage.totalPages
                    ? pages.length + 1
                    : undefined;
            },
        }
    );
```

#### Dependent Queries

```typescript
// Fetch agent first
const { data: agent } = trpc.agents.getOne.useQuery({ id: agentId });

// Fetch meetings only after agent is loaded
const { data: meetings } = trpc.meetings.getMany.useQuery(
    { agentId: agent?.id },
    { enabled: !!agent?.id }
);
```

---

## Best Practices

### 1. Input Validation

✅ **Always validate inputs with Zod:**

```typescript
.input(z.object({
    email: z.string().email(),
    age: z.number().min(18).max(120),
    role: z.enum(["admin", "user"])
}))
```

❌ **Don't trust raw inputs:**

```typescript
.input(z.any()) // Avoid this!
```

---

### 2. Error Handling

✅ **Use appropriate error codes:**

```typescript
if (!agent) {
    throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found",
    });
}
```

✅ **Handle errors in UI:**

```typescript
const { data, error } = trpc.agents.getOne.useQuery({ id });

if (error) {
    return <ErrorMessage error={error.message} />;
}
```

---

### 3. Query Invalidation

✅ **Invalidate related queries after mutations:**

```typescript
const updateAgent = trpc.agents.update.useMutation({
    onSuccess: () => {
        // Invalidate single item
        queryClient.invalidateQueries({
            queryKey: [["agents", "getOne"]],
        });

        // Invalidate list
        queryClient.invalidateQueries({
            queryKey: [["agents", "getMany"]],
        });
    },
});
```

---

### 4. Authorization

✅ **Always check ownership in protected procedures:**

```typescript
const [agent] = await db
    .select()
    .from(agents)
    .where(
        and(
            eq(agents.id, input.id),
            eq(agents.userId, ctx.auth.user.id) // ✅ Verify ownership
        )
    );
```

❌ **Don't rely on client-side checks only:**

```typescript
// ❌ Client can be manipulated
if (userOwnsAgent) {
    updateAgent.mutate(data);
}
```

---

### 5. Type Safety

✅ **Export and reuse types:**

```typescript
import type { RouterOutputs } from "@/trpc/routers/_app";

type Agent = RouterOutputs["agents"]["getOne"];
type Agents = RouterOutputs["agents"]["getMany"];
```

✅ **Use inferred types:**

```typescript
const { data } = trpc.agents.getOne.useQuery({ id });
// 'data' is automatically typed!
```

---

### 6. Performance Optimization

✅ **Use select to fetch only needed data:**

```typescript
const { data } = trpc.agents.getOne.useQuery(
    { id },
    {
        select: (data) => ({
            name: data.name,
            description: data.description,
        }),
    }
);
```

✅ **Enable batching for multiple queries:**

```typescript
// These will be batched into a single request
const agent1 = trpc.agents.getOne.useQuery({ id: "1" });
const agent2 = trpc.agents.getOne.useQuery({ id: "2" });
const agent3 = trpc.agents.getOne.useQuery({ id: "3" });
```

✅ **Set appropriate stale times:**

```typescript
const { data } = trpc.agents.getMany.useQuery(
    { page: 1 },
    {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    }
);
```

---

### 7. Testing

✅ **Test procedures directly:**

```typescript
import { appRouter } from "@/trpc/routers/_app";

describe("Agent Procedures", () => {
    it("creates an agent", async () => {
        const caller = appRouter.createCaller({
            auth: mockSession,
        });

        const agent = await caller.agents.create({
            name: "Test Agent",
            description: "Test description",
        });

        expect(agent.name).toBe("Test Agent");
    });
});
```

---

### 8. Code Organization

✅ **Group related procedures:**

```
src/modules/
  agents/
    server/
      procedures.ts     # All agent procedures
    schemas.ts          # Zod validation schemas
  meetings/
    server/
      procedures.ts     # All meeting procedures
    schemas.ts
```

✅ **Reuse schemas:**

```typescript
// schemas.ts
export const agentInsertSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
});

export const agentUpdateSchema = agentInsertSchema.partial().extend({
    id: z.string(),
});

// procedures.ts
.input(agentInsertSchema)
.input(agentUpdateSchema)
```

---

### 9. Security Considerations

✅ **Rate limiting (API route level):**

```typescript
// app/api/trpc/[trpc]/route.ts
import { ratelimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
        return new Response("Too many requests", { status: 429 });
    }

    // Continue with tRPC handler
}
```

✅ **Sanitize inputs:**

```typescript
.input(z.object({
    content: z.string().max(10000), // Limit size
    tags: z.array(z.string()).max(10), // Limit array length
}))
```

---

### 10. Documentation

✅ **Add JSDoc comments:**

```typescript
export const agentsRouter = createTRPCRouter({
    /**
     * Fetches a single agent by ID.
     * @requires Authentication
     * @throws NOT_FOUND if agent doesn't exist or user doesn't own it
     */
    getOne: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            // Implementation
        }),
});
```

---

## Common Patterns & Recipes

### Pagination Helper

```typescript
// lib/pagination.ts
export const paginationSchema = z.object({
    page: z.number().default(1),
    pageSize: z.number().min(10).max(100).default(20),
});

export function paginate<T>(items: T[], page: number, pageSize: number) {
    return {
        items: items.slice((page - 1) * pageSize, page * pageSize),
        total: items.length,
        totalPages: Math.ceil(items.length / pageSize),
        currentPage: page,
    };
}
```

### Search Helper

```typescript
export const searchSchema = z.object({
    ...paginationSchema.shape,
    search: z.string().nullish(),
    sortBy: z.enum(["name", "createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

### Soft Delete Pattern

```typescript
remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
        // Soft delete instead of hard delete
        const [deletedAgent] = await db
            .update(agents)
            .set({ deletedAt: new Date() })
            .where(
                and(
                    eq(agents.id, input.id),
                    eq(agents.userId, ctx.auth.user.id)
                )
            )
            .returning();

        return deletedAgent;
    }),
```

---

## Troubleshooting

### Common Issues

#### 1. "Type instantiation is excessively deep"

**Solution:** Upgrade TypeScript and ensure tRPC is up to date.

#### 2. Queries not refetching after mutation

**Solution:** Use `queryClient.invalidateQueries()` in mutation callbacks.

#### 3. Context not available in procedures

**Solution:** Ensure `createTRPCContext` is properly called and middleware is set up.

#### 4. CORS errors in development

**Solution:** Configure CORS in Next.js config or API route.

---

## Additional Resources

-   **Official Docs:** [trpc.io/docs](https://trpc.io/docs)
-   **React Query Docs:** [tanstack.com/query](https://tanstack.com/query/latest)
-   **Zod Documentation:** [zod.dev](https://zod.dev)
-   **Next.js tRPC Guide:** [trpc.io/docs/nextjs](https://trpc.io/docs/nextjs)

---

## Summary

tRPC provides a seamless, type-safe bridge between your frontend and backend:

-   🎯 **End-to-end type safety** - Catch errors at compile time
-   🚀 **Developer experience** - Autocomplete, refactoring, inline documentation
-   📦 **Zero boilerplate** - No code generation or schema files
-   🔒 **Built-in security** - Type-safe authentication and authorization
-   ⚡ **Performance** - Request batching and React Query integration
-   🧪 **Easy testing** - Direct procedure calls in tests

By following this documentation and best practices, you can build robust, type-safe APIs that scale with your application.
