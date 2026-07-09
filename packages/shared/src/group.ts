import { z } from 'zod';

export const groupRoleSchema = z.enum(['owner', 'admin', 'member']);
export type GroupRole = z.infer<typeof groupRoleSchema>;

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
});
export type Group = z.infer<typeof groupSchema>;

/** A user's membership in a group, with their role in that group. */
export const membershipSchema = z.object({
  groupId: z.string(),
  userId: z.string(),
  role: groupRoleSchema,
  joinedAt: z.coerce.date(),
});
export type Membership = z.infer<typeof membershipSchema>;
