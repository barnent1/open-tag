import { describe, expect, it } from 'vitest';
import { agentSchema, modelProviderConfigSchema } from './agent.js';
import { groupSchema, membershipSchema } from './group.js';
import { messageEnvelopeSchema } from './message.js';
import { platformIdentitySchema, platformSchema } from './platform.js';
import { mcpConnectionSchema, resourceAclSchema, resourceSchema } from './resource.js';
import { userSchema } from './user.js';

describe('platformSchema', () => {
  it('accepts every supported platform', () => {
    for (const platform of ['telegram', 'slack', 'discord', 'sms', 'whatsapp', 'imessage']) {
      expect(platformSchema.safeParse(platform).success).toBe(true);
    }
  });

  it('rejects an unsupported platform', () => {
    expect(platformSchema.safeParse('carrier-pigeon').success).toBe(false);
  });
});

describe('platformIdentitySchema', () => {
  it('parses a valid identity', () => {
    const result = platformIdentitySchema.safeParse({
      id: 'id-1',
      userId: 'user-1',
      platform: 'slack',
      externalId: 'U123',
      handle: '@glen',
    });
    expect(result.success).toBe(true);
  });

  it('allows handle to be omitted', () => {
    const result = platformIdentitySchema.safeParse({
      id: 'id-1',
      userId: 'user-1',
      platform: 'slack',
      externalId: 'U123',
    });
    expect(result.success).toBe(true);
  });
});

describe('userSchema', () => {
  it('coerces a date string for createdAt', () => {
    const result = userSchema.parse({
      id: 'user-1',
      displayName: 'Glen',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});

describe('groupSchema and membershipSchema', () => {
  it('parses a valid group', () => {
    const result = groupSchema.safeParse({
      id: 'group-1',
      name: 'Engineering',
      createdBy: 'user-1',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects a membership with an invalid role', () => {
    const result = membershipSchema.safeParse({
      groupId: 'group-1',
      userId: 'user-1',
      role: 'superadmin',
      joinedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });
});

describe('messageEnvelopeSchema', () => {
  it('parses a minimal envelope', () => {
    const result = messageEnvelopeSchema.safeParse({
      id: 'msg-1',
      platform: 'discord',
      senderId: 'user-1',
      text: 'hello',
      timestamp: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('parses an envelope with attachments and raw payload', () => {
    const result = messageEnvelopeSchema.safeParse({
      id: 'msg-1',
      platform: 'discord',
      groupId: 'group-1',
      senderId: 'user-1',
      text: 'check this out',
      attachments: [{ id: 'a1', kind: 'image', url: 'https://example.com/a.png' }],
      timestamp: new Date(),
      raw: { anything: 'goes' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing required field', () => {
    const result = messageEnvelopeSchema.safeParse({
      platform: 'discord',
      senderId: 'user-1',
      text: 'hello',
      timestamp: new Date(),
    });
    expect(result.success).toBe(false);
  });
});

describe('agentSchema and modelProviderConfigSchema', () => {
  it('parses a valid agent', () => {
    const result = agentSchema.safeParse({
      id: 'agent-1',
      groupId: 'group-1',
      modelConfig: { provider: 'anthropic', model: 'claude-opus' },
      systemPrompt: 'You are a helpful teammate.',
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unsupported model provider', () => {
    const result = modelProviderConfigSchema.safeParse({
      provider: 'chatgpt',
      model: 'gpt-5',
    });
    expect(result.success).toBe(false);
  });
});

describe('resourceSchema and resourceAclSchema', () => {
  it('parses a valid resource with an mcp connection', () => {
    const result = resourceSchema.safeParse({
      id: 'resource-1',
      ownerId: 'user-1',
      kind: 'repo',
      name: 'open-tag',
      mcp: { transport: 'stdio', command: 'mcp-server-git', args: ['--repo', '.'] },
      createdAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects an mcp connection with an invalid transport', () => {
    const result = mcpConnectionSchema.safeParse({ transport: 'carrier-pigeon' });
    expect(result.success).toBe(false);
  });

  it('parses a shared-visibility ACL with sharedWith userIds', () => {
    const result = resourceAclSchema.safeParse({
      resourceId: 'resource-1',
      visibility: 'shared',
      sharedWith: ['user-1', 'user-2'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid visibility value', () => {
    const result = resourceAclSchema.safeParse({
      resourceId: 'resource-1',
      visibility: 'everyone',
      sharedWith: [],
    });
    expect(result.success).toBe(false);
  });
});
