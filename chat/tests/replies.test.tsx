// Replies on models other than xialong (Chat 0.6): carrying on at the limit, the emotion picked
// after, the prompt the player set, and the site's 18+ question.
import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROMPT, addReply, addUserMessage, newChat, pickedAlt, type Chat } from '../../core/chat/index.js';
import type { Connection, Generated, GenerateOptions } from '../../kit/src/connection';
import { AgeGate } from '../../kit/src/AgeGate';
import { ERRATA_ID, HOUSE_WORLD_ID, resortFrom } from '../../kit/src/included';
import resortFile from '../../content/dragons-resort/world.json';
import { ChatView } from '../src/ChatView';
import { DEFAULT_SETTINGS, type Settings } from '../src/settings';

const world = resortFrom(resortFile, 1);
const ERRATA = world.records.find((record) => record.id === ERRATA_ID)!;
const connection: Connection = { connected: true, provider: 'openrouter', model: 'test/model', mode: 'chat', format: 'auto', base: '', models: ['test/model'], contexts: {}, unlisted: false, providers: [] };
const start = (): Chat => { let n = 0; return newChat({ id: 'c1', worldId: HOUSE_WORLD_ID, characterId: ERRATA_ID, characterName: 'Errata', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'stranger', style: 'roleplay', responseLength: 'unspecified', greeting: ERRATA.greetings[0]! }, () => `m${++n}`, 1000); };

// Replies handed out in order, each with the finish reason the provider gave.
function provider(replies: [string, string][]) {
  const calls: { messages: { role: string; content: string }[]; options: GenerateOptions }[] = [];
  const impl = vi.fn(async (messages: { role: string; content: string }[], _target: unknown, options: GenerateOptions = {}): Promise<Generated> => {
    calls.push({ messages, options });
    const [text, finishReason] = replies[Math.min(calls.length - 1, replies.length - 1)]!;
    options.onDelta?.(text);
    await Promise.resolve();
    return { text, model: 'test/model', usage: null, diagnostics: { finishReason } as never };
  });
  return { calls, impl };
}

function Harness({ impl, settings, portraits, seen, initial = start }: { impl: ReturnType<typeof provider>['impl']; settings?: Partial<Settings>; portraits?: Record<string, string>; seen?: Chat[]; initial?: () => Chat }) {
  const [chat, setChat] = useState(initial);
  return <ChatView chat={chat} world={world} connection={connection} settings={{ ...DEFAULT_SETTINGS, ...settings }} portraits={portraits} onChange={(next) => { seen?.push(next); setChat(next); }} onBack={() => {}} onDelete={() => {}} onSettings={() => {}} generateImpl={impl as never} />;
}
const send = (text: string) => {
  fireEvent.change(screen.getByLabelText('Your message'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
};

describe('replies on models other than xialong', () => {
  it('carries a reply on at the limit, up to twice, as one piece, and then says it was cut', async () => {
    const { calls, impl } = provider([['Errata: *I take the', 'length'], ['page and read', 'length'], ['it twice', 'length']]);
    render(<Harness impl={impl} />);
    send('Here.');
    await screen.findByText(/reached its length limit/);
    expect(calls).toHaveLength(3);
    // Carried on from where it stopped: as a prefill where the provider takes one.
    const carried = calls[1]!.options.prefill ?? calls[1]!.messages.at(-1)!.content;
    expect(carried).toContain('I take the');
    expect(screen.getByText(/I take the page and read it twice/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('asks for the length in words and sends the thinking level and the player\'s prompt', async () => {
    const { calls, impl } = provider([['Errata: Fine.', 'stop']]);
    render(<Harness impl={impl} settings={{ prompt: { ...DEFAULT_PROMPT, off: ['content'], texts: { role: 'You are {{char}}, and only {{char}}.' }, after: 'Keep it brisk.', thinking: 'low' } }} />);
    send('Hi.');
    await screen.findByText('Fine.');
    const [system, ...rest] = calls[0]!.messages;
    expect(system!.content).toContain('You are Errata, and only Errata.');
    expect(system!.content).not.toContain('fiction between adults');
    expect(system!.content).not.toContain('Emotion');
    const note = rest.at(-1)!.content;
    expect(note).toContain('Length: two to four paragraphs.');
    expect(note).toContain('Keep it brisk.');
    expect(calls[0]!.options.thinking).toBe('low');
    expect(calls[0]!.options.maxTokens).toBe(1000);
  });

  it('picks the emotion after the reply when the character has emotion portraits', async () => {
    const seen: Chat[] = [];
    const { calls, impl } = provider([['Errata: *I laugh.*', 'stop'], ['laughing', 'stop']]);
    render(<Harness impl={impl} portraits={{ avatar: 'a.png', laughing: 'l.png' }} seen={seen} />);
    send('A joke.');
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]!.messages[0]!.content).toContain('one word from this list');
    expect(calls[1]!.options.maxTokens).toBeLessThan(40);
    await waitFor(() => expect(pickedAlt(seen.at(-1)!.messages.at(-1)!).parts.at(-1)!.emotion).toBe('laughing'));
  });

  it('makes no second request without portraits or moods, or when it is turned off', async () => {
    const { calls, impl } = provider([['Errata: *I laugh.*', 'stop']]);
    render(<Harness impl={impl} />);
    send('A joke.');
    await screen.findByText('I laugh.');
    await Promise.resolve();
    expect(calls).toHaveLength(1);
  });
});

describe('chapters', () => {
  const long = () => {
    let c = start();
    for (let i = 0; i < 40; i += 1) {
      c = addUserMessage(c, `Line ${i} from Sam. ${'more words here '.repeat(20)}`, `u${i}`, 2000 + i * 2);
      c = addReply(c, [{ text: `Line ${i} from Errata. ${'more words here '.repeat(20)}`, emotion: 'neutral' }], `r${i}`, 2001 + i * 2);
    }
    return c;
  };

  it('writes up what left the window after the reply, and shows it in Memory', async () => {
    const seen: Chat[] = [];
    const { calls, impl } = provider([['Errata: Noted.', 'stop'], ['Errata and Sam traded lines across the desk for hours, and she kept every one.\nKeys: desk, lines', 'stop']]);
    render(<Harness impl={impl} seen={seen} initial={long} settings={{ contextTokens: 6000, replyTokens: 300 }} />);
    send('Go on.');
    await waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(2));
    expect(calls[1]!.messages[0]!.content).toContain('You are keeping the record of a story');
    expect(calls[1]!.options.temperature).toBe(0.3);
    await waitFor(() => expect(seen.at(-1)!.chapters.some((chapter) => chapter.state === 'written')).toBe(true));
    const chapter = seen.at(-1)!.chapters.find((entry) => entry.state === 'written')!;
    expect(chapter).toMatchObject({ text: 'Errata and Sam traded lines across the desk for hours, and she kept every one.', keys: ['desk', 'lines'] });
    // The chat keeps every message.
    expect(seen.at(-1)!.messages.length).toBe(long().messages.length + 2);
  });

  it('writes none when chapters are turned off', async () => {
    const { calls, impl } = provider([['Errata: Noted.', 'stop']]);
    render(<Harness impl={impl} initial={long} settings={{ contextTokens: 6000, replyTokens: 300, chapters: false }} />);
    send('Go on.');
    await screen.findByText('Noted.');
    await Promise.resolve();
    expect(calls).toHaveLength(1);
  });
});

describe('the 18+ question', () => {
  it('shows nothing of the site until it is answered, and remembers the answer', () => {
    localStorage.removeItem('inkwyrm.adult');
    const { unmount } = render(<AgeGate><p>The site</p></AgeGate>);
    expect(screen.queryByText('The site')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'I\'m not' }));
    expect(screen.getByText(/Come back when you're 18/)).toBeInTheDocument();
    unmount();
    render(<AgeGate><p>The site</p></AgeGate>);
    fireEvent.click(screen.getByRole('button', { name: 'I\'m 18 or older' }));
    expect(screen.getByText('The site')).toBeInTheDocument();
    expect(localStorage.getItem('inkwyrm.adult')).toBe('yes');
  });
});
