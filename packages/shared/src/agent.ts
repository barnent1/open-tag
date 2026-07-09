import { z } from 'zod';

export const modelProviderSchema = z.enum(['local', 'anthropic', 'gemini', 'openai-compatible']);
export type ModelProvider = z.infer<typeof modelProviderSchema>;

/** Points an agent at a model, without embedding secrets — `keyRef` is a lookup key, not a value. */
export const modelProviderConfigSchema = z.object({
  provider: modelProviderSchema,
  model: z.string(),
  endpoint: z.string().optional(),
  keyRef: z.string().optional(),
});
export type ModelProviderConfig = z.infer<typeof modelProviderConfigSchema>;

/** An AI agent scoped to a single group and wired to a model + system prompt. */
export const agentSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  modelConfig: modelProviderConfigSchema,
  systemPrompt: z.string(),
  createdAt: z.coerce.date(),
});
export type Agent = z.infer<typeof agentSchema>;
