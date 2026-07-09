import { z } from 'zod';

/** How an agent connects to a resource — an MCP server. */
export const mcpConnectionSchema = z.object({
  transport: z.enum(['stdio', 'sse', 'http']),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
});
export type McpConnection = z.infer<typeof mcpConnectionSchema>;

/** A resource an agent can be granted access to (a repo, a database, a docs site, ...). */
export const resourceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  kind: z.string(),
  name: z.string(),
  mcp: mcpConnectionSchema,
  createdAt: z.coerce.date(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const resourceVisibilitySchema = z.enum(['public', 'private', 'shared']);
export type ResourceVisibility = z.infer<typeof resourceVisibilitySchema>;

/**
 * Access control for a resource. `sharedWith` (userIds) only applies when
 * visibility is 'shared'; it's ignored for 'public' and 'private'.
 */
export const resourceAclSchema = z.object({
  resourceId: z.string(),
  visibility: resourceVisibilitySchema,
  sharedWith: z.array(z.string()),
});
export type ResourceACL = z.infer<typeof resourceAclSchema>;
