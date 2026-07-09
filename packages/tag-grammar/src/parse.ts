import {
  BROADCAST_CONFIRMATION_THRESHOLD,
  CONTROL_COMMANDS,
  type ControlCommand,
  type ParseContext,
  type ParsedMessage,
} from './types.js';

// `@agent` or `@agent,<group>`, with the comma form requiring a group token
// glued directly to the comma (no space). Either form must be immediately
// followed by whitespace or end-of-string — `@agentic` is not `@agent`.
const AGENT_RE = /^@agent(?:,([A-Za-z0-9][A-Za-z0-9_-]*))?(?=\s|$)/i;

// A generic single-word tag: `@<word>`, also bounded by whitespace/end-of-string.
const TAG_RE = /^@([A-Za-z0-9][A-Za-z0-9_-]*)(?=\s|$)/;

const CONTROL_COMMAND_SET: ReadonlySet<string> = new Set(CONTROL_COMMANDS);

/** Control commands that mutate membership destructively enough to confirm first. */
const CONFIRM_COMMANDS: ReadonlySet<ControlCommand> = new Set(['leave']);

/**
 * Parses a raw message body into a `ParsedMessage`. Control tags and the
 * `@agent`/`@agent,<group>` form are deterministic; a leading `@<name>` that
 * matches a known group is a broadcast; anything else — no tag, or an
 * unrecognized tag — is `plain`, with the entire original text as its body.
 */
export function parse(text: string, ctx: ParseContext): ParsedMessage {
  const trimmed = text.trim();

  const agentMatch = AGENT_RE.exec(trimmed);
  if (agentMatch) {
    const group = agentMatch[1];
    const body = trimmed.slice(agentMatch[0].length).trim();
    return group !== undefined ? { kind: 'agent', group, body } : { kind: 'agent', body };
  }

  const tagMatch = TAG_RE.exec(trimmed);
  if (tagMatch) {
    const tagName = tagMatch[1] as string;
    const lower = tagName.toLowerCase();
    const rest = trimmed.slice(tagMatch[0].length).trim();

    if (CONTROL_COMMAND_SET.has(lower)) {
      const command = lower as ControlCommand;
      const args = rest === '' ? [] : rest.split(/\s+/);
      return {
        kind: 'control',
        command,
        args,
        requiresConfirmation: CONFIRM_COMMANDS.has(command),
      };
    }

    if (ctx.knownGroups.includes(tagName)) {
      const size = ctx.groupSizes?.[tagName];
      const requiresConfirmation = size !== undefined && size > BROADCAST_CONFIRMATION_THRESHOLD;
      return { kind: 'broadcast', group: tagName, body: rest, requiresConfirmation };
    }
  }

  return { kind: 'plain', body: trimmed };
}
