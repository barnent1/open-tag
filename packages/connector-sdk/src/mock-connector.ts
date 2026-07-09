import { randomUUID } from 'node:crypto';
import type { MessageEnvelope, Platform } from '@open-tag/shared';
import type { Connector } from './connector.js';
import type { ConnectorCapabilities, DeliveryResult, Recipient } from './types.js';

/** The shape of a raw inbound payload MockConnector.normalize() accepts. */
export interface MockInboundMessage {
  id?: string | undefined;
  groupId?: string | undefined;
  senderId: string;
  text: string;
  timestamp?: Date | undefined;
}

export interface DeliveredMessage {
  envelope: MessageEnvelope;
  recipient: Recipient;
}

export interface MockConnectorOptions {
  platform?: Platform;
  capabilities?: Partial<ConnectorCapabilities>;
}

const defaultCapabilities: ConnectorCapabilities = {
  threads: false,
  richText: false,
  attachments: false,
  reactions: false,
  editing: false,
};

/**
 * In-memory Connector for testing the pipeline without a real platform.
 * `normalize()`/`feedInbound()` play the role of a webhook arriving; `deliver()`
 * records what was sent instead of calling a platform API, so tests can assert
 * against `delivered`.
 */
export class MockConnector implements Connector {
  readonly id: string;
  readonly platform: Platform;
  readonly capabilities: ConnectorCapabilities;
  readonly delivered: DeliveredMessage[] = [];

  constructor(id = 'mock', options: MockConnectorOptions = {}) {
    this.id = id;
    this.platform = options.platform ?? 'telegram';
    this.capabilities = { ...defaultCapabilities, ...options.capabilities };
  }

  normalize(raw: unknown): MessageEnvelope {
    const msg = raw as MockInboundMessage;
    return {
      id: msg.id ?? randomUUID(),
      platform: this.platform,
      groupId: msg.groupId,
      senderId: msg.senderId,
      text: msg.text,
      timestamp: msg.timestamp ?? new Date(),
      raw,
    };
  }

  /** Convenience alias for normalize() — reads better at call sites feeding test fixtures. */
  feedInbound(raw: MockInboundMessage): MessageEnvelope {
    return this.normalize(raw);
  }

  deliver(envelope: MessageEnvelope, recipient: Recipient): Promise<DeliveryResult> {
    this.delivered.push({ envelope, recipient });
    return Promise.resolve({ ok: true, messageId: randomUUID() });
  }

  /** Clears recorded deliveries between tests. */
  reset(): void {
    this.delivered.length = 0;
  }
}
