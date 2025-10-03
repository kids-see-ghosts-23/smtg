import { nanoid } from "nanoid";
import {
    pgTable,
    text,
    timestamp,
    boolean,
    pgEnum,
    vector,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
        .$defaultFn(() => false)
        .notNull(),
    image: text("image"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(
        () => /* @__PURE__ */ new Date()
    ),
    updatedAt: timestamp("updated_at").$defaultFn(
        () => /* @__PURE__ */ new Date()
    ),
});

export const agents = pgTable("agents", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    instructions: text("instructions").notNull(),
    githubRepo: text("github_repo"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meetingStatus = pgEnum("meeting_status", [
    "upcoming",
    "active",
    "completed",
    "processing",
    "cancelled",
]);

export const meetings = pgTable("meetings", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    agentId: text("agent_id")
        .notNull()
        .references(() => agents.id, { onDelete: "cascade" }),
    status: meetingStatus("status").notNull().default("upcoming"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    transcriptUrl: text("transcript_url"),
    recordingUrl: text("recording_url"),
    summary: text("summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// New table for guest users
export const guestUsers = pgTable("guest_users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    meetingId: text("meeting_id")
        .notNull()
        .references(() => meetings.id, { onDelete: "cascade" }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// New tables for RAG PDF processing
export const agentDocuments = pgTable("agent_documents", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => nanoid()),
    agentId: text("agent_id")
        .notNull()
        .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // Original file name
    url: text("url"), // URL to the stored document
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentChunks = pgTable("document_chunks", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => nanoid()),
    documentId: text("document_id")
        .notNull()
        .references(() => agentDocuments.id, { onDelete: "cascade" }),
    pageNumber: text("page_number"), // Page number in the original document
    chunkNumber: text("chunk_number"), // Chunk number within the page
    content: text("content").notNull(), // Text content of the chunk
    embedding: vector("embedding", { dimensions: 1536 }), // Embedding vector (OpenAI ada-002 dimensions)
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
