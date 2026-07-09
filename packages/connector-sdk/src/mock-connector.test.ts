import { describe, expect, it } from 'vitest';
import { MockConnector } from './mock-connector.js';

describe('MockConnector', () => {
  it('normalizes a raw inbound payload into a MessageEnvelope', () => {
    const connector = new MockConnector();

    const envelope = connector.feedInbound({
      senderId: 'user-1',
      text: 'hello @agent',
      groupId: 'group-1',
    });

    expect(envelope.senderId).toBe('user-1');
    expect(envelope.text).toBe('hello @agent');
    expect(envelope.groupId).toBe('group-1');
    expect(envelope.platform).toBe('telegram');
    expect(envelope.id).toBeTruthy();
    expect(envelope.timestamp).toBeInstanceOf(Date);
  });

  it('generates an id and timestamp when the raw payload omits them', () => {
    const connector = new MockConnector();

    const a = connector.feedInbound({ senderId: 'user-1', text: 'a' });
    const b = connector.feedInbound({ senderId: 'user-1', text: 'b' });

    expect(a.id).not.toBe(b.id);
  });

  it('preserves an explicit id and timestamp from the raw payload', () => {
    const connector = new MockConnector();
    const timestamp = new Date('2026-01-01T00:00:00.000Z');

    const envelope = connector.feedInbound({
      id: 'msg-123',
      senderId: 'user-1',
      text: 'hi',
      timestamp,
    });

    expect(envelope.id).toBe('msg-123');
    expect(envelope.timestamp).toEqual(timestamp);
  });

  it('keeps the raw payload attached to the envelope', () => {
    const connector = new MockConnector();
    const raw = { senderId: 'user-1', text: 'hi' };

    const envelope = connector.feedInbound(raw);

    expect(envelope.raw).toBe(raw);
  });

  it('uses the configured platform, defaulting to telegram', () => {
    const telegram = new MockConnector();
    const slack = new MockConnector('mock-slack', { platform: 'slack' });

    expect(telegram.platform).toBe('telegram');
    expect(slack.platform).toBe('slack');
  });

  it('merges partial capability overrides with defaults', () => {
    const connector = new MockConnector('mock', { capabilities: { threads: true } });

    expect(connector.capabilities).toEqual({
      threads: true,
      richText: false,
      attachments: false,
      reactions: false,
      editing: false,
    });
  });

  it('records delivered messages and resolves ok', async () => {
    const connector = new MockConnector();
    const envelope = connector.feedInbound({ senderId: 'agent', text: 'response' });
    const recipient = { platform: connector.platform, externalId: 'user-1', groupId: 'group-1' };

    const result = await connector.deliver(envelope, recipient);

    expect(result.ok).toBe(true);
    expect(result.messageId).toBeTruthy();
    expect(connector.delivered).toHaveLength(1);
    expect(connector.delivered[0]).toEqual({ envelope, recipient });
  });

  it('accumulates multiple deliveries and clears them on reset', async () => {
    const connector = new MockConnector();
    const envelope = connector.feedInbound({ senderId: 'agent', text: 'hi' });
    const recipient = { platform: connector.platform, externalId: 'user-1' };

    await connector.deliver(envelope, recipient);
    await connector.deliver(envelope, recipient);
    expect(connector.delivered).toHaveLength(2);

    connector.reset();
    expect(connector.delivered).toHaveLength(0);
  });
});
