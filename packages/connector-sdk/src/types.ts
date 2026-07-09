import type { Platform } from '@open-tag/shared';

/** What a platform/connector can do — routing and rendering decisions read this. */
export interface ConnectorCapabilities {
  threads: boolean;
  richText: boolean;
  attachments: boolean;
  reactions: boolean;
  editing: boolean;
}

/** Where a delivered message should go: a user or a group, on a given platform. */
export interface Recipient {
  platform: Platform;
  externalId: string;
  groupId?: string | undefined;
}

export interface DeliveryResult {
  ok: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
}
