/** Deterministic control commands recognized as `@<command> ...`. */
export const CONTROL_COMMANDS = ['create-group', 'invite', 'rename', 'leave', 'members'] as const;
export type ControlCommand = (typeof CONTROL_COMMANDS)[number];

/**
 * Group size beyond which a broadcast should be confirmed before sending.
 * The parser only has enough information to flag this when the caller
 * supplies `groupSizes` in the context — final confirmation resolution
 * (e.g. re-checking live membership) is the router's job, not the parser's.
 */
export const BROADCAST_CONFIRMATION_THRESHOLD = 25;

export interface ParseContext {
  /** Names of groups the sender may address with `@<group>`. */
  knownGroups: string[];
  /** Optional member counts per group, used to flag requiresConfirmation on broadcasts. */
  groupSizes?: Record<string, number>;
}

export interface ControlMessage {
  kind: 'control';
  command: ControlCommand;
  args: string[];
  requiresConfirmation: boolean;
}

export interface BroadcastMessage {
  kind: 'broadcast';
  group: string;
  body: string;
  requiresConfirmation: boolean;
}

export interface AgentMessage {
  kind: 'agent';
  group?: string;
  body: string;
}

export interface PlainMessage {
  kind: 'plain';
  body: string;
}

export type ParsedMessage = ControlMessage | BroadcastMessage | AgentMessage | PlainMessage;
