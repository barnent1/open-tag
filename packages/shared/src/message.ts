import { z } from 'zod';
import { platformSchema } from './platform.js';

export const attachmentSchema = z.object({
  id: z.string(),
  kind: z.enum(['image', 'file', 'audio', 'video', 'other']),
  url: z.string(),
  mimeType: z.string().optional(),
  name: z.string().optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

/**
 * The normalized cross-platform message shape. Every connector's `normalize()`
 * produces one of these, and everything downstream of ingestion (routing, agents,
 * memory) operates on this shape instead of any platform-specific payload.
 */
export const messageEnvelopeSchema = z.object({
  id: z.string(),
  platform: platformSchema,
  groupId: z.string().optional(),
  senderId: z.string(),
  text: z.string(),
  attachments: z.array(attachmentSchema).optional(),
  timestamp: z.coerce.date(),
  /** Original platform payload, kept for debugging/replay. Not relied on downstream. */
  raw: z.unknown().optional(),
});
export type MessageEnvelope = z.infer<typeof messageEnvelopeSchema>;
