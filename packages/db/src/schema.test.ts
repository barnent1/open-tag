import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import {
  agents,
  groups,
  memberships,
  memory,
  MEMORY_EMBEDDING_DIMENSIONS,
  messages,
  platformIdentities,
  resourceAcl,
  resources,
  users,
} from './schema.js';

describe('schema', () => {
  it.each([
    [users, 'users'],
    [platformIdentities, 'platform_identities'],
    [groups, 'groups'],
    [memberships, 'memberships'],
    [agents, 'agents'],
    [resources, 'resources'],
    [resourceAcl, 'resource_acl'],
    [messages, 'messages'],
    [memory, 'memory'],
  ])('table maps to its expected Postgres table name', (table, expectedName) => {
    expect(getTableName(table)).toBe(expectedName);
  });

  it('gives the memory table an embedding column sized to MEMORY_EMBEDDING_DIMENSIONS', () => {
    expect(memory.embedding.getSQLType()).toBe(`vector(${MEMORY_EMBEDDING_DIMENSIONS})`);
  });

  it('marks resource_acl.sharedWith as required with an empty-array default', () => {
    expect(resourceAcl.sharedWith.notNull).toBe(true);
    expect(resourceAcl.sharedWith.hasDefault).toBe(true);
  });
});
