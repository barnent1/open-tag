import { describe, expect, it } from 'vitest';
import { BROADCAST_CONFIRMATION_THRESHOLD } from './types.js';
import { parse } from './parse.js';

const ctx = { knownGroups: ['eng-team', 'sales', 'Design'] };

describe('parse — control tags', () => {
  it.each([
    ['create-group', '@create-group my-new-team', 'create-group', ['my-new-team']],
    ['invite', '@invite bob to eng-team', 'invite', ['bob', 'to', 'eng-team']],
    ['rename', '@rename old-name new-name', 'rename', ['old-name', 'new-name']],
    ['members', '@members eng-team', 'members', ['eng-team']],
  ])('parses @%s as a control command', (_label, text, command, args) => {
    expect(parse(text, ctx)).toEqual({
      kind: 'control',
      command,
      args,
      requiresConfirmation: false,
    });
  });

  it('parses control commands case-insensitively, normalizing to lowercase', () => {
    expect(parse('@CREATE-GROUP Foo', ctx)).toEqual({
      kind: 'control',
      command: 'create-group',
      args: ['Foo'],
      requiresConfirmation: false,
    });
  });

  it('produces an empty args array when no arguments follow the command', () => {
    expect(parse('@members', ctx)).toEqual({
      kind: 'control',
      command: 'members',
      args: [],
      requiresConfirmation: false,
    });
  });

  it('collapses repeated whitespace between arguments', () => {
    expect(parse('@invite   bob    eng-team', ctx)).toEqual({
      kind: 'control',
      command: 'invite',
      args: ['bob', 'eng-team'],
      requiresConfirmation: false,
    });
  });

  it('flags requiresConfirmation for @leave', () => {
    expect(parse('@leave eng-team', ctx)).toEqual({
      kind: 'control',
      command: 'leave',
      args: ['eng-team'],
      requiresConfirmation: true,
    });
  });
});

describe('parse — agent tags', () => {
  it('parses a bare @agent with no group', () => {
    expect(parse('@agent what is the deploy status?', ctx)).toEqual({
      kind: 'agent',
      body: 'what is the deploy status?',
    });
  });

  it('parses @agent with no body as an empty string', () => {
    expect(parse('@agent', ctx)).toEqual({ kind: 'agent', body: '' });
  });

  it('is case-insensitive on the "agent" keyword', () => {
    expect(parse('@AGENT hello', ctx)).toEqual({ kind: 'agent', body: 'hello' });
  });

  it('parses @agent,<group> comma syntax with a body', () => {
    expect(parse('@agent,eng-team what is the deploy status?', ctx)).toEqual({
      kind: 'agent',
      group: 'eng-team',
      body: 'what is the deploy status?',
    });
  });

  it('parses @agent,<group> with no trailing body', () => {
    expect(parse('@agent,eng-team', ctx)).toEqual({
      kind: 'agent',
      group: 'eng-team',
      body: '',
    });
  });

  it('does not require the comma group to be a known group', () => {
    expect(parse('@agent,unknown-group ping', ctx)).toEqual({
      kind: 'agent',
      group: 'unknown-group',
      body: 'ping',
    });
  });

  it('leaves an embedded @-mention inside the body untouched', () => {
    expect(parse('@agent tell @bob to check @eng-team', ctx)).toEqual({
      kind: 'agent',
      body: 'tell @bob to check @eng-team',
    });
  });

  it('does not match "@agentic" as the agent tag', () => {
    expect(parse('@agentic something', ctx)).toEqual({
      kind: 'plain',
      body: '@agentic something',
    });
  });

  it('falls back to plain when the comma is present but no group token follows', () => {
    expect(parse('@agent, hello', ctx)).toEqual({
      kind: 'plain',
      body: '@agent, hello',
    });
  });
});

describe('parse — broadcast tags', () => {
  it('parses @<known-group> as a broadcast with the remaining text as body', () => {
    expect(parse('@eng-team standup moved to 10am', ctx)).toEqual({
      kind: 'broadcast',
      group: 'eng-team',
      body: 'standup moved to 10am',
      requiresConfirmation: false,
    });
  });

  it('parses a broadcast with an empty body', () => {
    expect(parse('@sales', ctx)).toEqual({
      kind: 'broadcast',
      group: 'sales',
      body: '',
      requiresConfirmation: false,
    });
  });

  it('matches known group names case-sensitively', () => {
    expect(parse('@design hello', ctx)).toEqual({
      kind: 'plain',
      body: '@design hello',
    });
    expect(parse('@Design hello', ctx)).toEqual({
      kind: 'broadcast',
      group: 'Design',
      body: 'hello',
      requiresConfirmation: false,
    });
  });
});

describe('parse — confirmation gating', () => {
  it('does not require confirmation when no group size is supplied', () => {
    const result = parse('@eng-team all hands', ctx);
    expect(result).toMatchObject({ kind: 'broadcast', requiresConfirmation: false });
  });

  it('does not require confirmation when the group is at or under the threshold', () => {
    const withSizes = {
      ...ctx,
      groupSizes: { 'eng-team': BROADCAST_CONFIRMATION_THRESHOLD },
    };
    expect(parse('@eng-team all hands', withSizes)).toMatchObject({ requiresConfirmation: false });
  });

  it('requires confirmation when the group exceeds the threshold', () => {
    const withSizes = {
      ...ctx,
      groupSizes: { 'eng-team': BROADCAST_CONFIRMATION_THRESHOLD + 1 },
    };
    expect(parse('@eng-team all hands', withSizes)).toMatchObject({ requiresConfirmation: true });
  });

  it('only applies the threshold to the addressed group', () => {
    const withSizes = { ...ctx, groupSizes: { sales: 1000 } };
    expect(parse('@eng-team all hands', withSizes)).toMatchObject({ requiresConfirmation: false });
  });
});

describe('parse — unknown tags and plain messages', () => {
  it('treats an unrecognized tag as plain, preserving the full original text', () => {
    expect(parse('@notagroup hey there', ctx)).toEqual({
      kind: 'plain',
      body: '@notagroup hey there',
    });
  });

  it('treats messages with no leading tag as plain', () => {
    expect(parse('just chatting, no tag here', ctx)).toEqual({
      kind: 'plain',
      body: 'just chatting, no tag here',
    });
  });

  it('trims surrounding whitespace on plain messages', () => {
    expect(parse('   hello there   ', ctx)).toEqual({
      kind: 'plain',
      body: 'hello there',
    });
  });

  it('handles an empty string as an empty plain message', () => {
    expect(parse('', ctx)).toEqual({ kind: 'plain', body: '' });
  });

  it('handles a whitespace-only string as an empty plain message', () => {
    expect(parse('   ', ctx)).toEqual({ kind: 'plain', body: '' });
  });

  it('treats a bare "@" with nothing after it as plain', () => {
    expect(parse('@', ctx)).toEqual({ kind: 'plain', body: '@' });
  });
});
