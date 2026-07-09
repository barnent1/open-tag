import { z } from 'zod';

/** Chat platforms Open Tag can normalize messages to/from. */
export const platformSchema = z.enum([
  'telegram',
  'slack',
  'discord',
  'sms',
  'whatsapp',
  'imessage',
]);
export type Platform = z.infer<typeof platformSchema>;

/** Links a user to their identity on a specific platform. */
export const platformIdentitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  platform: platformSchema,
  externalId: z.string(),
  handle: z.string().optional(),
});
export type PlatformIdentity = z.infer<typeof platformIdentitySchema>;
