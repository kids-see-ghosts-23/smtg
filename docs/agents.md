# Agents Module

The Agents module handles AI agent management within the SMTG Notion application. Agents are AI personas that participate in meetings with users, following specific instructions and behaviors.

## Structure

```
src/modules/agents/
├── hooks/
│   └── use-agents-filters.ts
├── server/
│   └── procedures.ts
├── ui/
│   ├── components/
│   └── views/
├── params.ts
├── schemas.ts
└── types.ts
```

## TRPC Procedures

### Queries

#### `agents.getOne({ id })`
Fetches a single agent by its ID.

**Input:**
```ts
{
  id: string
}
```

**Output:**
Returns an agent object with all its properties plus a meeting count.

#### `agents.getMany({ page, pageSize, search })`
Fetches a paginated list of agents.

**Input:**
```ts
{
  page?: number // default: 1
  pageSize?: number // default: 10, min: 1, max: 100
  search?: string // optional search term
}
```

**Output:**
```ts
{
  items: Agent[]
  total: number
  totalPages: number
}
```

### Mutations

#### `agents.create(input)`
Creates a new agent.

**Input:**
Follows the [agentsInsertSchema](#schemas).

**Output:**
Returns the created agent object.

#### `agents.update(input)`
Updates an existing agent.

**Input:**
Follows the [agentsUpdateSchema](#schemas).

**Output:**
Returns the updated agent object.

#### `agents.remove({ id })`
Deletes an agent.

**Input:**
```ts
{
  id: string
}
```

**Output:**
Returns the deleted agent object.

## Schemas

### agentsInsertSchema
Defines the validation schema for creating new agents.

### agentsUpdateSchema
Defines the validation schema for updating existing agents.

## Types

Custom TypeScript types used within the agents module.

## Hooks

### useAgentsFilters
A custom hook for managing agent filtering state in the UI.

## UI Components

UI components related to agent management and display.