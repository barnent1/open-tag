import {
  groupRoleSchema,
  modelProviderSchema,
  platformSchema,
  resourceVisibilitySchema,
} from '@open-tag/shared';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

// Enums are derived from @open-tag/shared's zod schemas so the set of valid
// values only has one place it's defined.
export const platformEnum = pgEnum('platform', [...platformSchema.options] as [
  string,
  ...string[],
]);
export const groupRoleEnum = pgEnum('group_role', [...groupRoleSchema.options] as [
  string,
  ...string[],
]);
export const modelProviderEnum = pgEnum('model_provider', [...modelProviderSchema.options] as [
  string,
  ...string[],
]);
export const resourceVisibilityEnum = pgEnum('resource_visibility', [
  ...resourceVisibilitySchema.options,
] as [string, ...string[]]);

// Embedding dimension for the `memory` table's vector column. 1536 matches
// common embedding models (e.g. OpenAI text-embedding-3-small/ada-002).
export const MEMORY_EMBEDDING_DIMENSIONS = 1536;

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const platformIdentities = pgTable(
  'platform_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    externalId: text('external_id').notNull(),
    handle: text('handle'),
  },
  (table) => [
    uniqueIndex('platform_identities_platform_external_id_idx').on(
      table.platform,
      table.externalId,
    ),
    index('platform_identities_user_id_idx').on(table.userId),
  ],
);

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  'memberships',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: groupRoleEnum('role').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.groupId, table.userId] }),
    index('memberships_user_id_idx').on(table.userId),
  ],
);

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    provider: modelProviderEnum('provider').notNull(),
    model: text('model').notNull(),
    endpoint: text('endpoint'),
    keyRef: text('key_ref'),
    systemPrompt: text('system_prompt').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('agents_group_id_idx').on(table.groupId)],
);

export const resources = pgTable(
  'resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    name: text('name').notNull(),
    /** MCP connection info — shape matches @open-tag/shared's `McpConnection`. */
    mcp: jsonb('mcp').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('resources_owner_id_idx').on(table.ownerId)],
);

export const resourceAcl = pgTable('resource_acl', {
  resourceId: uuid('resource_id')
    .primaryKey()
    .references(() => resources.id, { onDelete: 'cascade' }),
  visibility: resourceVisibilityEnum('visibility').notNull(),
  sharedWith: jsonb('shared_with').$type<string[]>().notNull().default([]),
});

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: platformEnum('platform').notNull(),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id),
    text: text('text').notNull(),
    attachments: jsonb('attachments').$type<unknown[]>(),
    /** Original platform payload, kept for debugging/replay. */
    raw: jsonb('raw'),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('messages_group_id_idx').on(table.groupId),
    index('messages_sender_id_idx').on(table.senderId),
  ],
);

export const memory = pgTable(
  'memory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    sourceMessageId: uuid('source_message_id').references(() => messages.id, {
      onDelete: 'set null',
    }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: MEMORY_EMBEDDING_DIMENSIONS }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('memory_group_id_idx').on(table.groupId),
    index('memory_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  platformIdentities: many(platformIdentities),
  memberships: many(memberships),
  resources: many(resources),
}));

export const platformIdentitiesRelations = relations(platformIdentities, ({ one }) => ({
  user: one(users, { fields: [platformIdentities.userId], references: [users.id] }),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  memberships: many(memberships),
  agents: many(agents),
  messages: many(messages),
  memory: many(memory),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  group: one(groups, { fields: [memberships.groupId], references: [groups.id] }),
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
  group: one(groups, { fields: [agents.groupId], references: [groups.id] }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  owner: one(users, { fields: [resources.ownerId], references: [users.id] }),
  acl: one(resourceAcl, { fields: [resources.id], references: [resourceAcl.resourceId] }),
}));

export const resourceAclRelations = relations(resourceAcl, ({ one }) => ({
  resource: one(resources, { fields: [resourceAcl.resourceId], references: [resources.id] }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  group: one(groups, { fields: [messages.groupId], references: [groups.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  memories: many(memory),
}));

export const memoryRelations = relations(memory, ({ one }) => ({
  group: one(groups, { fields: [memory.groupId], references: [groups.id] }),
  sourceMessage: one(messages, {
    fields: [memory.sourceMessageId],
    references: [messages.id],
  }),
}));
