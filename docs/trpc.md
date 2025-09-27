# TRPC Implementation Documentation

This document provides detailed documentation of the TRPC implementation in the SMTG Notion application. TRPC (TypeScript RPC) provides type-safe communication between the frontend and backend.

## Overview

TRPC enables end-to-end type safety between the client and server, providing autocompletion and compile-time error checking for API calls. The implementation includes:

1. **Server Setup** - Configuration of TRPC context, procedures, and routers
2. **Client Setup** - Integration with React Query for caching and state management
3. **Routers** - Organization of API endpoints into logical groups
4. **Procedures** - Individual API endpoints with input validation and type safety

## Server Setup

### Context Creation

The TRPC context is initialized in `src/trpc/init.ts`:

```ts
export const createTRPCContext = cache(async () => {
    return { userId: "user_123" };
});
```

This function creates a cached context that provides user session information to all procedures.

### Procedure Types

Two types of procedures are defined:

1. **Base Procedure** - Basic procedure without authentication requirements
2. **Protected Procedure** - Procedure that requires user authentication

```ts
const t = initTRPC.create();

export const baseProcedure = t.procedure;

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    return next({
        ctx: {
            ...ctx,
            auth: session,
        },
    });
});
```

### Router Creation

Functions for creating routers and caller factories:

```ts
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
```

## Client Setup

The client-side TRPC implementation is configured in `src/trpc/client.tsx`:

### TRPC Provider

A provider component that wraps the application and provides TRPC context:

```ts
export function TRPCReactProvider(props: { children: React.ReactNode }) {
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

### HTTP Batch Link

The client uses HTTP batch links for efficient batching of requests:

```ts
httpBatchLink({
    url: getUrl(),
})
```

### Query Client Integration

Integration with React Query for caching and state management:

```ts
function getQueryClient() {
    if (typeof window === "undefined") {
        return makeQueryClient();
    }
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}
```

## Routers

The application has two main routers that organize API endpoints into logical groups:

### Agents Router

Located at `src/modules/agents/server/procedures.ts`, this router handles all agent-related operations.

#### Queries

1. **getOne** - Fetch a single agent by ID
2. **getMany** - Fetch a paginated list of agents with search capabilities

#### Mutations

1. **create** - Create a new agent
2. **update** - Update an existing agent
3. **remove** - Delete an agent

### Meetings Router

Located at `src/modules/meetings/server/procedures.ts`, this router handles all meeting-related operations.

#### Queries

1. **getOne** - Fetch a single meeting by ID with associated agent information
2. **getMany** - Fetch a paginated list of meetings with filtering capabilities
3. **getTranscript** - Retrieve meeting transcript with speaker information
4. **generateToken** - Generate Stream Video token for the authenticated user
5. **generateChatToken** - Generate Stream Chat token for the authenticated user

#### Mutations

1. **create** - Create a new meeting and initialize Stream Video call
2. **update** - Update an existing meeting
3. **remove** - Delete a meeting

### Main Application Router

Both routers are combined in `src/trpc/routers/_app.ts`:

```ts
export const appRouter = createTRPCRouter({
    agents: agentsRouter,
    meetings: meetingsRouter,
});

export type AppRouter = typeof appRouter;
```

## Procedures

Each procedure follows a consistent pattern with input validation, business logic, and output typing.

### Input Validation

Procedures use Zod for input validation:

```ts
protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
        // Implementation
    });
```

### Error Handling

Procedures use TRPCError for consistent error handling:

```ts
throw new TRPCError({
    code: "NOT_FOUND",
    message: "Agent not found",
});
```

### Protected Procedures

Protected procedures automatically validate user authentication:

```ts
protectedProcedure
    .input(agentsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
        // ctx.auth is guaranteed to exist
    });
```

## Usage Examples

### Client-Side Usage

```ts
// Query
const { data, isLoading } = trpc.agents.getOne.useQuery({ id: agentId });

// Mutation
const [updateAgent, { isLoading }] = trpc.agents.update.useMutation();
```

### Server-Side Usage

```ts
const caller = appRouter.createCaller(createTRPCContext);
const agent = await caller.agents.getOne({ id: agentId });
```

## Type Safety

TRPC provides end-to-end type safety:

1. **Input Types** - Automatically inferred from Zod schemas
2. **Output Types** - Automatically inferred from return values
3. **Error Types** - Consistent error handling with typed errors

## Performance Considerations

1. **Batching** - HTTP batch links reduce the number of network requests
2. **Caching** - Integration with React Query provides automatic caching
3. **Dehydration** - Server-side rendering support with query dehydration
4. **Optimistic Updates** - Support for optimistic UI updates

## Security

1. **Authentication** - Protected procedures automatically validate user sessions
2. **Authorization** - Procedures can implement fine-grained access control
3. **Input Validation** - Zod schemas prevent invalid data from reaching business logic
4. **Error Filtering** - Sensitive information is filtered from error responses

## Extending TRPC

To add new functionality:

1. Create a new router in `src/trpc/routers/`
2. Add procedures to the router following the existing patterns
3. Register the router in `src/trpc/routers/_app.ts`
4. Update the AppRouter type definition

## Debugging

TRPC provides excellent debugging capabilities:

1. **Type Errors** - Clear error messages for type mismatches
2. **Runtime Errors** - Detailed error information in development
3. **Network Inspection** - Browser dev tools can inspect TRPC requests
4. **Logging** - Built-in logging for request/response tracing