import type { MessageEnvelope, Platform } from '@open-tag/shared';
import type { ConnectorCapabilities, DeliveryResult, Recipient } from './types.js';

/**
 * The normalized shape every platform integration implements. Everything
 * upstream (routing, agents, memory) talks to a Connector, never to a
 * platform SDK directly.
 */
export interface Connector {
  readonly id: string;
  readonly platform: Platform;
  readonly capabilities: ConnectorCapabilities;
  /** Turns a raw platform payload (webhook body, SDK event, ...) into a MessageEnvelope. */
  normalize(raw: unknown): MessageEnvelope;
  /** Sends an envelope's content to a recipient on this connector's platform. */
  deliver(envelope: MessageEnvelope, recipient: Recipient): Promise<DeliveryResult>;
}
