// Group chat in Chat (G2): the resort's three in one chat. Whoever is named answers, under their own
// name; a reply that runs into someone else's line is cut there; a question to someone by name hands
// them the turn; the player can pick who answers; and the group is set up in the chat's details.
import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { newGroupChat, setGroup, type Chat } from '../../core/chat/index.js';
import type { Connection, Generated, GenerateOptions } from '../../kit/src/connection';
import { HOUSE_WORLD_ID, resortFrom } from '../../kit/src/included';
import resortFile from '../../content/dragons-resort/world.json';
import { ChatView } from '../src/ChatView';
import { DetailsPanel } from '../src/Panels';
import { DEFAULT_SETTINGS } from '../src/settings';

const world = resortFrom(resortFile, 1);
const connection: Connection = { connected: true, provider: 'openrouter', model: 'test/model', mode: 'chat', format: 'auto', base: '', models: ['test/model'], contexts: {}, unlisted: false, providers: [] };
const start = (): Chat => {
  let n = 0;
  return setGroup(newGroupChat({
    id: 'g1', worldId: HOUSE_WORLD_ID, characterId: 'qiulong', characterName: 'Qiulong', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'acquaintance', style: 'roleplay', responseLength: 'unspecified', greeting: null,
    cast: ['qiulong', 'errata', 'echydna'], greetings: { qiulong: { text: 'Tea first.', emotion: 'happy' } },
  }, () => `m${++n}`, 1000), { picker: 'quietest' }, 1000);
};

function provider(replies: string[]) {
  const calls: { messages: { role: string; content: string }[]; options: GenerateOptions }[] = [];
  const impl = vi.fn(async (messages: { role: string; content: string }[], _target: unknown, options: GenerateOptions = {}): Promise<Generated> => {
    calls.push({ messages, options });
    const text = replies[Math.min(calls.length - 1, replies.length - 1)]!;
    options.onDelta?.(text);
    await Promise.resolve();
    return { text, model: 'test/model', usage: null, diagnostics: { finishReason: 'stop' } as never };
  });
  return { calls, impl };
}

function Harness({ impl, seen, initial = start }: { impl: ReturnType<typeof provider>['impl']; seen: Chat[]; initial?: () => Chat }) {
  const [chat, setChat] = useState(initial);
  return <ChatView chat={chat} world={world} connection={connection} settings={{ ...DEFAULT_SETTINGS, emotions: 'off', chapters: false }} onChange={(next) => { seen.push(next); setChat(next); }} onBack={() => {}} onDelete={() => {}} onSettings={() => {}} generateImpl={impl as never} />;
}
const send = (text: string) => {
  fireEvent.change(screen.getByLabelText('Your message'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
};

describe('a group chat in Chat', () => {
  it('has whoever is named answer under their own name, stopped at everyone else’s', async () => {
    const seen: Chat[] = [];
    const { calls, impl } = provider(['Echydna: Old films, darling.']);
    render(<Harness impl={impl} seen={seen} />);
    send('Echydna, what are we watching?');
    await screen.findByText('Old films, darling.');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.options.stop).toEqual(['\nQiulong:', '\nErrata:', '\nSam:']);
    expect(calls[0]!.messages[0]!.content).toContain('You are Echydna, in a group chat');
    const reply = seen.at(-1)!.messages.at(-1)!;
    expect(reply.speaker).toBe('echydna');
    expect(within(screen.getByRole('main')).getAllByText('Echydna').length).toBeGreaterThan(0);
  });

  it('cuts a reply where it starts writing for someone else, and says so', async () => {
    const seen: Chat[] = [];
    const { impl } = provider(['Errata: Fine.\nQiulong: More tea?']);
    render(<Harness impl={impl} seen={seen} />);
    send('Errata?');
    await screen.findByText('Fine.');
    expect(screen.queryByText('More tea?')).not.toBeInTheDocument();
    expect(screen.getByText(/went on to write for Qiulong/)).toBeInTheDocument();
  });

  it('hands the turn to someone the reply asks by name, once', async () => {
    const seen: Chat[] = [];
    const { calls, impl } = provider(['Qiulong: Long day here too. What do you think, Errata?', 'Errata: I think you talk too much.']);
    render(<Harness impl={impl} seen={seen} />);
    send('Qiulong, how was the floor?');
    await screen.findByText('I think you talk too much.');
    expect(calls).toHaveLength(2);
    expect(seen.at(-1)!.messages.slice(-2).map((message) => message.speaker)).toEqual(['qiulong', 'errata']);
  });

  it('lets the player pick who answers the next message', async () => {
    const seen: Chat[] = [];
    const { calls, impl } = provider(['Errata: Mm.']);
    render(<Harness impl={impl} seen={seen} />);
    fireEvent.change(screen.getByLabelText('Who answers'), { target: { value: 'errata' } });
    send('So.');
    await screen.findByText('Mm.');
    expect(calls[0]!.messages[0]!.content).toContain('You are Errata, in a group chat');
    expect(screen.getByLabelText('Who answers')).toHaveValue('auto');
  });

  it('asks the model who answers when nobody is named, and falls back to the quietest', async () => {
    const seen: Chat[] = [];
    const { calls, impl } = provider(['{"speaker": "Echydna"}', 'Echydna: Shh.']);
    render(<Harness impl={impl} seen={seen} initial={() => setGroup(start(), { picker: 'agent' }, 1000)} />);
    send('Evening.');
    await screen.findByText('Shh.');
    expect(calls[0]!.messages[0]!.content).toContain('You decide who speaks next');
    expect(calls[1]!.messages[0]!.content).toContain('You are Echydna');
  });
});

describe('setting up a group', () => {
  it('brings someone in from the same world, and sets how they speak up', () => {
    const changes: Chat[] = [];
    const solo = { ...start(), cast: [] };
    const { rerender } = render(<DetailsPanel chat={solo} onChange={(next) => changes.push(next)} scene={null} world={world} charName="Qiulong" onDelete={() => {}} />);
    fireEvent.change(screen.getByLabelText('Bring someone in'), { target: { value: 'errata' } });
    expect(changes.at(-1)!.cast.map((entry) => entry.characterId)).toEqual(['qiulong', 'errata']);
    rerender(<DetailsPanel chat={changes.at(-1)!} onChange={(next) => changes.push(next)} scene={null} world={world} charName="Qiulong" onDelete={() => {}} />);
    fireEvent.change(screen.getByLabelText('How often Errata speaks up'), { target: { value: 'chatty' } });
    expect(changes.at(-1)!.cast[1]).toMatchObject({ characterId: 'errata', talk: 'chatty' });
    void waitFor;
  });
});
