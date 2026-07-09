import { describe, expect, it } from 'vitest';
import { createDb } from './client.js';

describe('createDb', () => {
  it('builds a Drizzle client without connecting to a live database', () => {
    // postgres.js connects lazily on first query, so this must not throw or block
    // even though nothing is listening on this connection string.
    const db = createDb('postgres://user:pass@localhost:5432/does-not-exist');

    expect(typeof db.select).toBe('function');
    expect(typeof db.insert).toBe('function');
    expect(typeof db.query).toBe('object');
  });
});
