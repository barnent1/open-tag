import { z } from 'zod';

/** A person, platform-agnostic. Platform-specific identities live in PlatformIdentity. */
export const userSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.string().optional(),
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;
