import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { newChat, type Chat } from '../../core/chat/index.js';
import type { Connection, Generated, GenerateOptions } from '../../kit/src/connection';
import { ChatView } from '../src/ChatView';
import { worldFor } from '../src/App';
import { ERRATA, ERRATA_ID, HOUSE_WORLD_ID, houseWorld, refreshHouse } from '../src/errata';
import { Home } from '../src/Home';
import { RichText } from '../src/RichText';
import { DEFAULT_SETTINGS } from '../src/settings';
import { newRecord, parseWorld, putRecord, newWorld } from '../../core/records/index.js';

const world = houseWorld(1);
const connection: Connection = { connected: true, provider: 'openrouter', model: 'test/model', mode: 'chat', format: 'auto', base: '', models: ['test/model'], contexts: {}, unlisted: false, providers: [] };

function start(): Chat {
  let n = 0;
  return newChat({ id: 'c1', worldId: HOUSE_WORLD_ID, characterId: ERRATA_ID, characterName: 'Errata', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'stranger', style: 'roleplay', responseLength: 'unspecified', greeting: ERRATA.greetings[0]! }, () => `m${++n}`, 1000);
}

// A provider that streams each reply in two pieces. Replies are handed out in order.
function provider(replies: string[]) {
  const calls: { messages: { role: string; content: string }[]; options: GenerateOptions }[] = [];
  const impl = vi.fn(async (messages: { role: string; content: string }[], _target: unknown, options: GenerateOptions = {}): Promise<Generated> => {
    calls.push({ messages, options });
    const text = replies[(calls.length - 1) % replies.length]!;
    options.onDelta?.(text.slice(0, 12));
    await Promise.resolve();
    options.onDelta?.(text.slice(12));
    return { text, model: 'test/model', usage: null };
  });
  return { calls, impl };
}

// Holds the chat the way the app does, so changes come back in as props.
function Harness({ impl, connected = true, layout = 'bubbles' as const }: { impl: ReturnType<typeof provider>['impl']; connected?: boolean; layout?: 'bubbles' | 'page' }) {
  const [chat, setChat] = useState(start);
  return <ChatView chat={chat} world={world} connection={{ ...connection, connected }} settings={{ ...DEFAULT_SETTINGS, layout }} onChange={setChat} onBack={() => {}} onDelete={() => {}} onSettings={() => {}} generateImpl={impl as never} />;
}

describe('the house format', () => {
  it('draws narration, thoughts and notes apart from speech, a paragraph a line', () => {
    const { container } = render(<RichText text={'*I turn a page.*\nGive it here. (Not bad.) [OOC: brb]'} />);
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(container.querySelector('em.narration')).toHaveTextContent('I turn a page.');
    expect(container.querySelector('.thought')).toHaveTextContent('(Not bad.)');
    expect(container.querySelector('.note')).toHaveTextContent('[OOC: brb]');
    expect(container).not.toHaveTextContent('*');
  });
});

describe('the bundled world', () => {
  it('is a valid world with Errata in it', () => {
    const read = parseWorld(JSON.parse(JSON.stringify(world)));
    expect(read.ok).toBe(true);
    expect(ERRATA.examples).toHaveLength(5);
    for (const text of [...ERRATA.sections.map((section) => section.text), ...ERRATA.greetings.map((greeting) => greeting.text), ...ERRATA.examples.flatMap((example) => example.messages.map((message) => message.text))]) expect(text).not.toContain('\n\n');
  });
  it('swaps an older bundled Errata for the current one and leaves the rest of her world alone', () => {
    const mine = { ...newRecord('lore', 'mine', 'My note', () => 'x') };
    const old = { ...world, records: [{ ...ERRATA, line: 'An old draft.', examples: [] }, mine], conditions: [] };
    const fresh = refreshHouse(old, 9);
    expect(fresh.records.find((record) => record.id === ERRATA_ID)).toEqual(ERRATA);
    expect(fresh.records.map((record) => record.id)).toContain('mine');
    expect(parseWorld(JSON.parse(JSON.stringify(fresh))).ok).toBe(true);
  });
  it('lends a chat a persona from another world', () => {
    const other = putRecord(newWorld('other', 'Other', 1), { ...newRecord('persona', 'p1', 'Robin', () => 'x') }, 2);
    const chat = { ...start(), personaId: 'p1' };
    expect(worldFor([world, other], chat)!.records.map((record) => record.id)).toContain('p1');
    expect(worldFor([other], chat)).toBeNull();
  });
});

describe('the home screen', () => {
  it('lists characters and starts a chat with what CharacterRoom asks', () => {
    const onStart = vi.fn();
    render(<Home worlds={[world]} chats={[]} portraits={{}} status={null} userName="" onOpen={() => {}} onStart={onStart} onImport={() => {}} />);
    fireEvent.click(within(screen.getByRole('article', { name: 'Errata' })).getByRole('button', { name: 'Start chat' }));
    const sheet = screen.getByRole('dialog', { name: 'New chat with Errata' });
    for (const label of ['You are', 'Scenario', 'Relationship', 'Style', 'Response length', 'Greeting']) expect(within(sheet).getByLabelText(label)).toBeInTheDocument();
    fireEvent.change(within(sheet).getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.change(within(sheet).getByLabelText('Relationship'), { target: { value: 'close' } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Start the chat' }));
    const chat = onStart.mock.calls[0]![0] as Chat;
    expect(chat).toMatchObject({ characterId: ERRATA_ID, userName: 'Sam', relationship: 'close', style: 'roleplay' });
    expect(chat.messages[0]!.alts[0]!.parts[0]!.emotion).toBe('bored');
    // The card's own defaults fill the sheet.
    expect(chat.responseLength).toBe('medium');
  });

  it('shows recent chats with their last line', () => {
    const onOpen = vi.fn();
    render(<Home worlds={[world]} chats={[start()]} portraits={{}} status={null} userName="" onOpen={onOpen} onStart={() => {}} onImport={() => {}} />);
    const recent = screen.getByRole('region', { name: 'Continue' });
    expect(within(recent).getByText(/Loose pages cover the floor/)).toBeInTheDocument();
    fireEvent.click(within(recent).getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith('c1');
  });
});

describe('the chat screen', () => {
  it('stops and keeps a partial reply before flushing navigation to Overview', async () => {
    const order: string[] = [];
    const impl = vi.fn((_messages: unknown, _target: unknown, options: GenerateOptions = {}): Promise<Generated> => new Promise((_resolve, reject) => {
      options.onDelta?.('Errata: A partial reply.\n  Emotion: neutral');
      options.signal?.addEventListener('abort', () => { order.push('stopped'); reject(new DOMException('Stopped', 'AbortError')); }, { once: true });
    }));
    function Pending() {
      const [chat, setChat] = useState(start);
      return <ChatView chat={chat} world={world} connection={connection} settings={DEFAULT_SETTINGS} generateImpl={impl as never}
        onChange={(next) => { if (next.messages.length > 1 && next.messages.at(-1)?.from === 'character') order.push('kept'); setChat(next); }}
        onOverview={async () => { order.push('overview'); throw new Error('Stay here for this test'); }} onBack={() => {}} onDelete={() => {}} onSettings={() => {}} />;
    }
    render(<Pending />);
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hello.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('button', { name: 'Stop' });
    fireEvent.click(screen.getByRole('link', { name: 'Inkwyrm, the front page' }));
    await waitFor(() => expect(order).toContain('overview'));
    expect(order).toEqual(['stopped', 'kept', 'overview']);
    expect(screen.getByText('A partial reply.')).toBeInTheDocument();
  });
  it('sends a message, streams the reply into a bubble and shows the emotion on the portrait', async () => {
    const { calls, impl } = provider(['Errata: *I take the page.*\nThis line is yours.\n  Emotion: smug']);
    const { container } = render(<Harness impl={impl} />);
    expect(screen.getByText(/Give it here\./)).toBeInTheDocument();
    expect(container.querySelector('.chat-head .portrait')).toHaveAttribute('data-emotion', 'bored');
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Here is my draft.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('This line is yours.');
    expect(screen.getByText('Here is my draft.')).toBeInTheDocument();
    expect(screen.getByText('I take the page.').tagName).toBe('EM');
    expect(screen.queryByText(/Emotion:/)).toBeNull();
    expect(container.querySelector('.chat-head .portrait')).toHaveAttribute('data-emotion', 'smug');
    expect(screen.getByLabelText('Your message')).toHaveValue('');
    const sent = calls[0]!.messages;
    expect(sent[0]!.content).toContain('You are Errata');
    expect(sent.at(-1)!.content).toContain('Here is my draft.');
    expect(calls[0]!.options.stop).toEqual(['\nSam:']);
  });

  it('wraps an action in asterisks', async () => {
    const { calls, impl } = provider(['Errata: Fine.\n  Emotion: bored']);
    render(<Harness impl={impl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Speech' }));
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'I hand it over' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Fine.');
    expect(calls[0]!.messages.at(-1)!.content.startsWith('*I hand it over*')).toBe(true);
  });

  it('keeps every alternative reply and steps between them', async () => {
    const { calls, impl } = provider(['Errata: First.\n  Emotion: bored', 'Errata: Second.\n  Emotion: happy']);
    render(<Harness impl={impl} />);
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hi.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('First.');
    fireEvent.click(screen.getByRole('button', { name: 'Another reply' }));
    await screen.findByText('Second.');
    expect(screen.getByLabelText('Reply 2 of 2')).toBeInTheDocument();
    expect(screen.queryByText('First.')).toBeNull();
    // The second request stops before the turn being rewritten.
    expect(calls[1]!.messages.some((message) => message.content.includes('First.'))).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Earlier reply' }));
    expect(screen.getByText('First.')).toBeInTheDocument();
    expect(screen.getByLabelText('Reply 1 of 2')).toBeInTheDocument();
  });

  it('edits a message in place, emotion and all', async () => {
    const { impl } = provider(['Errata: Frist.\n  Emotion: bored']);
    const { container } = render(<Harness impl={impl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Frist.');
    // A message's controls stay out of the way until it is touched.
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    fireEvent.click(screen.getByText('Frist.'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const box = screen.getByLabelText('Edit this message');
    expect(box).toHaveValue('Frist.\n  Emotion: bored');
    fireEvent.change(box, { target: { value: 'First.\n  Emotion: laughing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('First.')).toBeInTheDocument();
    expect(container.querySelector('.chat-head .portrait')).toHaveAttribute('data-emotion', 'laughing');
  });

  it('carries a reply on, deletes a message, and remembers a fact for the journal', async () => {
    const { calls, impl } = provider(['Errata: A start', ' and an end.\n  Emotion: happy', 'Errata: Noted.\n  Emotion: neutral']);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Harness impl={impl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('button', { name: 'Regenerate' });
    fireEvent.click(screen.getByText('A start'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('A start and an end.');
    // The open turn goes as the start of the reply, for the model to carry on.
    expect(calls[1]!.options.prefill).toBe('Errata: A start');

    await screen.findByRole('button', { name: 'Regenerate' });
    fireEvent.click(screen.getByText('A start and an end.'));
    fireEvent.click(screen.getByRole('button', { name: 'Remember this' }));
    const dialog = screen.getByRole('dialog', { name: 'Remember this' });
    fireEvent.change(within(dialog).getByLabelText('The fact'), { target: { value: 'Sam writes at night.' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep it' }));
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Well?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Noted.');
    expect(calls[2]!.messages[1]!.content).toContain('- Sam writes at night.');

    fireEvent.click(screen.getByText('Well?'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('Well?')).toBeNull();
  });

  it('shows exactly what was sent, and what is in context now', async () => {
    const { impl } = provider(['Errata: Ink.\n  Emotion: neutral']);
    render(<Harness impl={impl} />);
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Is that ink on my sleeve?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Ink.');
    fireEvent.click(screen.getByRole('button', { name: 'Under the hood' }));
    const panel = screen.getByRole('complementary', { name: 'Under the hood' });
    expect(within(panel).getByText(/You are Errata, in a private one-on-one chat with Sam/)).toBeInTheDocument();
    expect(within(panel).getByText(/The ink: Ink comes off her/)).toBeInTheDocument();
    expect(within(panel).getByText('Errata: Ink.', { exact: false })).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('tab', { name: 'In context now' }));
    await waitFor(() => expect(within(panel).getByRole('region', { name: 'Errata' })).toBeInTheDocument());
    expect(within(panel).getByText(/deadpan and unhurried/)).toBeInTheDocument();
  });

  it('keeps story time, moved by hand, and shows it under the hood', () => {
    const { impl } = provider(['x']);
    render(<Harness impl={impl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Under the hood' }));
    const panel = screen.getByRole('complementary', { name: 'Under the hood' });
    fireEvent.click(within(panel).getByRole('tab', { name: 'Time' }));
    expect(within(panel).queryByRole('region', { name: 'Story time' })).toBeNull();
    fireEvent.click(within(panel).getByLabelText('Story time'));
    const story = within(panel).getByRole('region', { name: 'Story time' });
    fireEvent.change(within(story).getByLabelText('Set the time of day'), { target: { value: '08:00' } });
    expect(story.querySelector('.stamp')).toHaveTextContent(/ 08:00/);
    fireEvent.click(within(story).getByRole('button', { name: '+1 h' }));
    expect(story.querySelector('.stamp')).toHaveTextContent(/ 09:00/);
    expect(within(panel).getByText(/Errata has no schedule/)).toBeInTheDocument();
  });

  it('writes a plan when asked, showing what it will send first, and the plan rides on the next reply', async () => {
    const { calls, impl } = provider([' Ask again\nContent: Ask Sam for the bad draft before the good one.', 'Errata: So. The bad draft.\n  Emotion: smug']);
    render(<Harness impl={impl} />);
    fireEvent.click(screen.getByRole('button', { name: 'Under the hood' }));
    const panel = screen.getByRole('complementary', { name: 'Under the hood' });
    fireEvent.click(within(panel).getByRole('tab', { name: 'Memory' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Plan' }));
    const ask = await within(panel).findByRole('region', { name: 'Plan: what it will send' });
    expect(impl).not.toHaveBeenCalled();
    expect(within(ask).getByText(/An action plan consists of a Title: and Content:/)).toBeInTheDocument();
    fireEvent.click(within(ask).getByRole('button', { name: 'Write it' }));
    await waitFor(() => expect(within(panel).getByLabelText('The plan')).toHaveValue('Ask Sam for the bad draft before the good one.'));
    expect(calls[0]!.options.prefill).toBe('Title:');
    fireEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hello.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('So. The bad draft.');
    expect(calls[1]!.messages.at(-1)!.content).toContain('What Errata means to do next (act on it, don\'t announce it): Ask Sam for the bad draft before the good one.');
  });

  it('lays messages out as a page when asked, and draws a picture a card wrote in', () => {
    const { impl } = provider(['x']);
    const { container } = render(<Harness impl={impl} layout="page" />);
    expect(container.querySelector('.chat')).toHaveAttribute('data-layout', 'page');
    const picture = render(<RichText text={'A door. ![the door](https://example.com/door.png)\n![x](javascript:alert(1))'} />).container;
    expect(picture.querySelector('img.picture')).toHaveAttribute('src', 'https://example.com/door.png');
    expect(picture.querySelectorAll('img')).toHaveLength(1);
  });

  it('says so when no model is connected', async () => {
    const { impl } = provider(['x']);
    render(<Harness impl={impl} connected={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connect a model first');
    expect(impl).not.toHaveBeenCalled();
  });
});

describe('a character asked for by address', () => {
  it('reads #/with/<world>/<record>, and nothing else, as a character to start with', async () => {
    const { viewFromHash } = await import('../src/App');
    expect(viewFromHash('#/with/inkwyrm-house/errata')).toEqual({ name: 'home', with: { worldId: 'inkwyrm-house', recordId: 'errata' } });
    expect(viewFromHash('#/with/low%20water/dee')).toEqual({ name: 'home', with: { worldId: 'low water', recordId: 'dee' } });
    expect(viewFromHash('#/with/only-one')).toEqual({ name: 'home' });
    expect(viewFromHash('#/chat/abc')).toEqual({ name: 'chat', id: 'abc' });
  });

  it('opens the new-chat sheet for that character and creates no chat by itself', () => {
    const onStart = vi.fn();
    const done = vi.fn();
    render(<Home worlds={[houseWorld(1)]} chats={[]} portraits={{}} status={null} userName="Ama" startWith={{ worldId: HOUSE_WORLD_ID, recordId: ERRATA_ID }} onStartWithDone={done} onOpen={() => {}} onStart={onStart} onImport={() => {}} />);
    expect(done).toHaveBeenCalledWith(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('says so when the character isn\'t in this browser', () => {
    const done = vi.fn();
    render(<Home worlds={[houseWorld(1)]} chats={[]} portraits={{}} status={null} userName="Ama" startWith={{ worldId: 'gone', recordId: 'nobody' }} onStartWithDone={done} onOpen={() => {}} onStart={() => {}} onImport={() => {}} />);
    expect(done).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
