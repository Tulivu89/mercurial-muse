// You (personas), the addresses for Home and You, a chat's way into its home, and posts from the
// press to what is kept.
import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { homeOf, newChat, newLife, addUserMessage, type Chat, type Life, type Post } from '../../core/chat/index.js';
import { importCardJson, newRecord, newWorld, putRecord, type StoryRecord, type World } from '../../core/records/index.js';
import type { Connection, Generated, GenerateOptions } from '../../kit/src/connection';
import { viewFromHash } from '../src/App';
import { ChatView } from '../src/ChatView';
import { Home } from '../src/Home';
import { postingFor } from '../src/posting';
import { DEFAULT_SETTINGS, type Settings } from '../src/settings';
import { You, defaultPersona, personasOf, type PersonaRef } from '../src/You';

const connection: Connection = { connected: true, provider: 'openrouter', model: 'test/model', mode: 'chat', format: 'auto', base: '', models: ['test/model'], contexts: {}, unlisted: false, providers: [] };

const contact = {
  cardType: 'contact', id: 'card-mira', name: 'Mira', persona: 'Wry.', greeting: 'Hey.', relationship: 'acquaintance',
  schedule: { Daily: [{ id: 'all', startTime: 0, endTime: 1439, text: 'Minding the counter.', requiredIntimacy: 'none' }] },
  cr: {
    lineHome: { all: { 'card-cafe': { room: 'vFloor', x: 0.25, y: 0.6, scale: 0.3 } } },
    needs: [{ id: 'hunger', name: 'Hunger', max: 100, decay: 6, low: 25, lowEmotion: 'irritated' }],
    homeActions: [{ id: 'feed', name: 'Feed', effects: { hunger: -80 }, say: '{{user}} takes {{char}}\'s plate away.' }],
  },
};
const scenario = { cardType: 'scenario', id: 'card-cafe', name: 'Cafe', cr: { sets: [{ id: 'sRooms', name: 'Location', variants: [{ id: 'vFloor', name: 'The floor', content: 'Tables and steam.' }, { id: 'vLoft', name: 'The loft', content: 'A bed.' }] }] } };

function cafeWorld(): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  const a = importCardJson(newWorld('w', 'Imported', 1), contact, ids, 2);
  if (!a.ok) throw new Error('contact');
  const b = importCardJson(a.result.world, scenario, ids, 3);
  if (!b.ok) throw new Error('scenario');
  const joss: StoryRecord = { ...newRecord('character', 'joss', 'Joss', ids), idle: { [b.result.recordId]: { room: 'vLoft', x: 0.5, y: 0.6, scale: 0.3, pic: '' } }, sections: [{ id: 'j1', title: 'Personality', reach: 'here', keys: [], when: null, text: 'Loud.' }] };
  const rook: StoryRecord = { ...newRecord('persona', 'rook', 'Rook', ids), line: 'A courier who is always late.', pronouns: 'they/them' };
  return putRecord(putRecord(b.result.world, joss, 4), rook, 5);
}
const mira = (w: World) => w.records.find((record) => record.name === 'Mira')!;
const cafe = (w: World) => w.records.find((record) => record.kind === 'scenario')!;
const chatWith = (w: World, over: Partial<Chat> = {}): Chat => {
  let n = 0;
  return { ...newChat({ id: 'c1', worldId: 'w', characterId: mira(w).id, characterName: 'Mira', personaId: null, scenarioId: cafe(w).id, userName: 'Sam', relationship: 'acquaintance', style: 'roleplay', responseLength: 'unspecified', greeting: { text: 'Hey.', emotion: 'bored' } }, () => `m${++n}`, 1), ...over };
};

describe('addresses', () => {
  it('reads Home as a list, one home, or one home\'s posts, and You', () => {
    expect(viewFromHash('#/home')).toEqual({ name: 'house' });
    expect(viewFromHash('#/home/dragons-resort/resort-house')).toEqual({ name: 'house', at: { worldId: 'dragons-resort', scenarioId: 'resort-house' } });
    expect(viewFromHash('#/home/a%20world/the%2Fhouse/posts')).toEqual({ name: 'house', at: { worldId: 'a world', scenarioId: 'the/house', tab: 'posts' } });
    expect(viewFromHash('#/you')).toEqual({ name: 'you' });
    expect(viewFromHash('#/home/only-a-world')).toEqual({ name: 'home' });
  });
});

describe('You', () => {
  function Page({ start = [cafeWorld()] }: { start?: World[] }) {
    const [worlds, setWorlds] = useState<World[]>(start);
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const create = async (name: string): Promise<PersonaRef> => {
      const record = newRecord('persona', `p-${name}`, name, () => `s-${name}`);
      const target = worlds.find((world) => world.id === 'inkwyrm-imports') ?? newWorld('inkwyrm-imports', 'Your characters', 1);
      const world = putRecord(target, record, 2);
      setWorlds((all) => [world, ...all.filter((entry) => entry.id !== world.id)]);
      return { world, record };
    };
    return (
      <>
        <You
          worlds={worlds} portraits={{}} settings={settings} onSettings={setSettings} onCreate={create}
          onSave={(worldId, record) => setWorlds((all) => all.map((world) => (world.id === worldId ? putRecord(world, record, 3) : world)))}
          onDelete={(worldId, record) => setWorlds((all) => all.map((world) => (world.id === worldId ? { ...world, records: world.records.filter((entry) => entry.id !== record.id) } : world)))}
          onPicture={() => {}} onImport={() => {}}
        />
        <output data-testid="usual">{defaultPersona(worlds, settings)?.record.name ?? 'none'}</output>
        <output data-testid="who">{personasOf(worlds).map((entry) => `${entry.record.name}:${entry.record.sections.map((section) => `${section.title}=${section.text}`).join('|')}`).join(';')}</output>
        <output data-testid="name">{settings.userName}</output>
      </>
    );
  }

  it('lists the personas every world has, and makes one your usual', () => {
    render(<Page />);
    const card = screen.getByRole('article', { name: 'Rook' });
    expect(card).toHaveTextContent('they/them · Imported');
    expect(card).toHaveTextContent('A courier who is always late.');
    fireEvent.click(within(card).getByRole('button', { name: 'Make this your usual' }));
    expect(within(card).getByText('Your usual')).toBeInTheDocument();
    expect(screen.getByTestId('usual')).toHaveTextContent('Rook');
    fireEvent.click(within(card).getByRole('button', { name: 'Stop using by default' }));
    expect(screen.getByTestId('usual')).toHaveTextContent('none');
  });

  it('makes a persona, opens it to write who you are and how you look, and the first one becomes your usual', async () => {
    render(<Page start={[]} />);
    expect(screen.getByText(/No personas yet/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('A new persona'), { target: { value: 'Wren' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make it' }));
    const sheet = await screen.findByRole('dialog', { name: 'You, as Wren' });
    fireEvent.change(within(sheet).getByLabelText('Who you are'), { target: { value: 'A night-shift cabbie.' } });
    fireEvent.change(within(sheet).getByLabelText('How you look'), { target: { value: 'Short, grey coat.' } });
    fireEvent.change(within(sheet).getByLabelText('Pronouns'), { target: { value: 'she/her' } });
    expect(screen.getByTestId('who')).toHaveTextContent('Wren:Who you are=A night-shift cabbie.|Appearance=Short, grey coat.');
    expect(screen.getByTestId('usual')).toHaveTextContent('Wren');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('article', { name: 'Wren' })).toHaveTextContent('A night-shift cabbie.');
  });

  it('deletes a persona when asked twice, and keeps the name for chats with no persona', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Page />);
    fireEvent.click(within(screen.getByRole('article', { name: 'Rook' })).getByRole('button', { name: 'Edit' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'You, as Rook' })).getByRole('button', { name: 'Delete this persona' }));
    expect(screen.queryByRole('article', { name: 'Rook' })).toBeNull();
    fireEvent.change(screen.getByLabelText('With no persona, they call you'), { target: { value: 'Sam' } });
    expect(screen.getByTestId('name')).toHaveTextContent('Sam');
  });

  it('starts a new chat as your usual persona', () => {
    const w = cafeWorld();
    const other = putRecord(newWorld('o', 'Other', 1), { ...newRecord('persona', 'vale', 'Vale', () => 'x') }, 2);
    const onStart = vi.fn();
    render(<Home worlds={[w, other]} chats={[]} portraits={{}} status={null} userName="" persona="o:vale" startWith={{ worldId: 'w', recordId: mira(w).id }} onOpen={() => {}} onStart={onStart} onImport={() => {}} />);
    const sheet = screen.getByRole('dialog', { name: 'New chat with Mira' });
    expect(within(sheet).getByLabelText('You are')).toHaveValue('vale');
    expect(within(sheet).getByRole('link', { name: 'You' })).toHaveAttribute('href', '#/you');
    fireEvent.click(within(sheet).getByRole('button', { name: 'Start the chat' }));
    expect(onStart.mock.calls[0]![0]).toMatchObject({ personaId: 'vale', userName: 'Vale' });
  });
});

describe('a chat and its home', () => {
  function Chatting({ onHome = () => {} }: { onHome?: (at: unknown) => void }) {
    const [w] = useState(cafeWorld);
    const [chat, setChat] = useState<Chat>(() => chatWith(w));
    const [life, setLife] = useState<Life>(() => newLife('w', mira(w), Date.now()));
    return (
      <>
        <ChatView
          chat={chat} world={w} connection={connection} settings={DEFAULT_SETTINGS} onChange={setChat} onBack={() => {}} onDelete={() => {}} onSettings={() => {}}
          life={life} onLife={setLife} home={homeOf(w, mira(w))} onHome={onHome} personas={personasOf([w])}
        />
        <output data-testid="you">{chat.personaId ?? 'none'}/{chat.userName}</output>
      </>
    );
  }

  it('shows her day at home inside the chat, with what can be done for her and the way to the house', () => {
    const onHome = vi.fn();
    render(<Chatting onHome={onHome} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mira at home: Cafe' }));
    const sheet = screen.getByRole('dialog', { name: 'About Mira' });
    expect(within(sheet).getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
    expect(within(sheet).getByText('Mira is in The floor.')).toBeInTheDocument();
    const keeper = within(sheet).getByRole('region', { name: 'Mira' });
    // The same card as Home, without a second way into the chat it is already in.
    expect(within(keeper).queryByRole('button', { name: 'Chat' })).toBeNull();
    fireEvent.click(within(keeper).getByRole('button', { name: 'Start keeping them' }));
    fireEvent.click(within(keeper).getByRole('button', { name: 'Feed' }));
    expect(within(keeper).getByRole('meter', { name: 'Hunger' })).toHaveAttribute('aria-valuenow', '20');
    fireEvent.click(within(sheet).getByRole('button', { name: /Go to the house/ }));
    expect(onHome).toHaveBeenCalledWith({ worldId: 'w', scenarioId: cafe(cafeWorld()).id, who: mira(cafeWorld()).id });
  });

  it('changes who you are in the chat', () => {
    render(<Chatting />);
    fireEvent.click(screen.getByRole('button', { name: 'About Mira' }));
    const sheet = screen.getByRole('dialog', { name: 'About Mira' });
    fireEvent.click(within(sheet).getByRole('tab', { name: 'You' }));
    expect(within(sheet).getByRole('radio', { name: /Just a name/ })).toBeChecked();
    fireEvent.click(within(sheet).getByRole('radio', { name: /Rook/ }));
    expect(screen.getByTestId('you')).toHaveTextContent('rook/Rook');
    fireEvent.click(within(sheet).getByRole('radio', { name: /Just a name/ }));
    expect(screen.getByTestId('you')).toHaveTextContent('none/Sam');
    fireEvent.change(within(sheet).getByLabelText('Your name'), { target: { value: 'Sam the Younger' } });
    expect(screen.getByTestId('you')).toHaveTextContent('none/Sam the Younger');
  });

  it('says so when she has no home', () => {
    const w = cafeWorld();
    render(<ChatView chat={chatWith(w)} world={w} connection={connection} settings={DEFAULT_SETTINGS} onChange={() => {}} onBack={() => {}} onDelete={() => {}} onSettings={() => {}} />);
    expect(screen.queryByRole('button', { name: /at home/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'About Mira' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'About Mira' })).getByRole('tab', { name: 'Home' }));
    expect(screen.getByText(/Mira doesn’t live in a home yet/)).toBeInTheDocument();
  });
});

describe('posting', () => {
  function setup(replies: string[], over: { chats?: (w: World) => Chat[]; connected?: boolean; settings?: Partial<Settings> } = {}) {
    const w = cafeWorld();
    const posts: Post[] = [];
    const calls: { messages: { role: string; content: string }[]; options: GenerateOptions }[] = [];
    const impl = vi.fn(async (messages: { role: string; content: string }[], _target: unknown, options: GenerateOptions = {}): Promise<Generated> => {
      calls.push({ messages, options });
      const text = replies[(calls.length - 1) % replies.length]!;
      options.onDelta?.(text);
      return { text, model: 'test/model', usage: null };
    });
    const api = () => postingFor({
      worlds: [w], chats: over.chats?.(w) ?? [], latest: () => posts, connection: { ...connection, connected: over.connected ?? true }, settings: { ...DEFAULT_SETTINGS, userName: 'Sam', ...over.settings },
      lifeOf: (worldId, record) => newLife(worldId, record, Date.now()), worldFor: () => w,
      savePost: (post) => { const at = posts.findIndex((entry) => entry.id === post.id); if (at < 0) posts.unshift(post); else posts[at] = post; },
      removePost: (post) => { posts.splice(posts.findIndex((entry) => entry.id === post.id), 1); },
      generateImpl: impl as never,
    });
    return { w, posts, calls, impl, api };
  }

  it('writes a post about her day with no chat at all, from her own home, and keeps it stamped', async () => {
    const { w, posts, calls, api } = setup([' Slow Tuesday\n====\nMira\nNobody came in.\n  Emotion: bored']);
    expect(api().frame(w, mira(w), 'day')).toContain('This is your first post.');
    const ready = await api().preview(w, mira(w), 'day');
    if (typeof ready === 'string') throw new Error(ready);
    expect(calls).toHaveLength(0);
    expect(ready.chatId).toBeNull();
    expect(ready.chat.scenarioId).toBe(cafe(w).id);
    expect(ready.built.messages.at(-1)!.content).toContain('[ Style: forum thread, posting about your own day ]');
    const seen: string[] = [];
    const post = await api().write(ready, (text) => seen.push(text));
    if (typeof post === 'string') throw new Error(post);
    expect(seen.at(-1)).toContain('Nobody came in.');
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ kind: 'day', title: 'Slow Tuesday', content: 'Nobody came in.', emotion: 'bored', key: `w:${mira(w).id}`, chatId: null, kept: false });
    expect(posts[0]!.at).toBeGreaterThan(0);
    // The next one knows there was a last one.
    expect(api().frame(w, mira(w), 'day').join(' ')).toMatch(/Your last post was/);
  });

  it('writes about a chat only when there is one to write about, and names it', async () => {
    const none = setup(['x']);
    expect(await none.api().preview(none.w, mira(none.w), 'chat')).toBe('There is no chat with Mira to post about yet. Say something to them first.');
    const some = setup([' Sam came by\n====\nHe asked about the loft.\nEmotion: smug'], { chats: (w) => [addUserMessage(chatWith(w), 'What is up in the loft?', 'u1', 5)] });
    const ready = await some.api().preview(some.w, mira(some.w), 'chat');
    if (typeof ready === 'string') throw new Error(ready);
    expect(JSON.stringify(ready.built.messages)).toContain('What is up in the loft?');
    await some.api().write(ready, () => {});
    expect(some.posts[0]).toMatchObject({ kind: 'chat', chatId: 'c1', title: 'Sam came by' });
  });

  it('adds one comment a press, from a housemate or a stranger, then the player\'s own, and asks what she would attach', async () => {
    const { w, posts, calls, api } = setup([' Slow Tuesday\n====\nNobody came in.\nEmotion: bored', 'tidewatcher_9\nCount them a third time.\nEmotion: playful', 'Photo: The empty counter, cups stacked.']);
    const ready = await api().preview(w, mira(w), 'day');
    if (typeof ready === 'string') throw new Error(ready);
    await api().write(ready, () => {});
    const id = posts[0]!.id;
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(await api().comment(id)).toBe('');
    vi.restoreAllMocks();
    expect(posts[0]!.comments).toMatchObject([{ name: 'tidewatcher_9', content: 'Count them a third time.', emotion: 'playful', characterId: null, mine: false }]);
    // The commenter sees the thread, never the private chat.
    expect(calls[1]!.messages.at(-1)!.content).toContain('A forum thread.\nThread: Slow Tuesday\nMira: Nobody came in.');
    api().say(id, '  I would have come in.  ');
    expect(posts[0]!.comments[1]).toMatchObject({ name: 'Sam', mine: true, content: 'I would have come in.' });
    expect(await api().describePhoto(id)).toBe('');
    expect(posts[0]!.photo).toBe('The empty counter, cups stacked.');
    expect(await api().comment('gone')).toBe('That post is gone.');
  });

  it('lets a housemate comment under their own name, with their face', async () => {
    const { w, posts, api } = setup([' Slow Tuesday\n====\nNobody came in.\nEmotion: bored', 'Joss\nYou could have called.\nEmotion: hurt']);
    const ready = await api().preview(w, mira(w), 'day');
    if (typeof ready === 'string') throw new Error(ready);
    await api().write(ready, () => {});
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(await api().comment(posts[0]!.id)).toBe('');
    vi.restoreAllMocks();
    expect(posts[0]!.comments[0]).toMatchObject({ name: 'Joss', characterId: 'joss', content: 'You could have called.', emotion: 'hurt' });
  });

  it('sends nothing without a model, and says what came back empty', async () => {
    const off = setup(['x'], { connected: false });
    expect(await off.api().preview(off.w, mira(off.w), 'day')).toBe('Connect a model first, under Settings.');
    expect(off.impl).not.toHaveBeenCalled();
    const empty = setup(['   ']);
    const ready = await empty.api().preview(empty.w, mira(empty.w), 'day');
    if (typeof ready === 'string') throw new Error(ready);
    expect(await empty.api().write(ready, () => {})).toBe('It came back empty. Try again.');
    await waitFor(() => expect(empty.posts).toHaveLength(0));
  });
});
