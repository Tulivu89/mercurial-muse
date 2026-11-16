import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { POST_FORMAT, lifeKey, type Life, type Post } from '../../core/chat/index.js';
import { importCardJson, newWorld, type World } from '../../core/records/index.js';
import { House, type HouseAt } from '../src/House';
import type { PostApi } from '../src/posting';
import { INCLUDED_WORLDS } from '../../kit/src/included';

const contact = {
  cardType: 'contact', id: 'card-mira', name: 'Mira', persona: 'Wry.', greeting: 'Hey.', relationship: 'acquaintance',
  schedule: { Daily: [{ id: 'all', startTime: 0, endTime: 1439, text: 'Minding the counter.', requiredIntimacy: 'none' }] },
  cr: {
    lineHome: { all: { 'card-cafe': { room: 'vFloor', x: 0.25, y: 0.6, scale: 0.3 } } },
    needs: [{ id: 'hunger', name: 'Hunger', max: 100, decay: 6, low: 25, lowEmotion: 'irritated' }],
    homeActions: [{ id: 'feed', name: 'Feed', effects: { hunger: -80 }, say: '{{user}} takes {{char}}\'s plate away.' }, { id: 'out', name: 'Go out', effects: {}, level: 'close' }],
  },
};
const scenario = { cardType: 'scenario', id: 'card-cafe', name: 'Cafe', cr: { sets: [{ id: 'sRooms', name: 'Location', variants: [{ id: 'vFloor', name: 'The floor', content: 'Tables and steam.' }, { id: 'vLoft', name: 'The loft', content: 'A bed.', lock: 'close' }] }] } };

function world(): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  const a = importCardJson(newWorld('w', 'Imported', 1), contact, ids, 2);
  if (!a.ok) throw new Error('contact');
  const b = importCardJson(a.result.world, scenario, ids, 3);
  if (!b.ok) throw new Error('scenario');
  return b.result.world;
}

const cafeOf = (w: World) => w.records.find((record) => record.kind === 'scenario')!;
const miraOf = (w: World) => w.records.find((record) => record.kind === 'character')!;

// `open`: start inside the cafe, as most of these tests want; without it, on the list of homes.
function Harness({ onChat = () => {}, open = true, posting }: { onChat?: () => void; open?: boolean; posting?: (w: World) => PostApi }) {
  const [state, setState] = useState(world);
  const [lives, setLives] = useState<Record<string, Life>>({});
  const [at, setAt] = useState<HouseAt | null>(open ? { worldId: 'w', scenarioId: cafeOf(state).id } : null);
  return <House worlds={[state]} chats={[]} portraits={{}} lives={lives} userName="Sam" onLife={(life) => setLives((all) => ({ ...all, [life.key]: life }))} onWorld={setState} onPicture={() => {}} onChat={onChat} at={at} onGo={setAt} posting={posting?.(state)} />;
}

describe('Home', () => {
  it('says what a home is, and how to get one, when there is none yet', () => {
    render(<House worlds={[newWorld('w', 'Empty', 1)]} chats={[]} portraits={{}} lives={{}} userName="" onLife={() => {}} onWorld={() => {}} onPicture={() => {}} onChat={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Homes' })).toBeInTheDocument();
    expect(screen.getByText(/A home is a place your characters live in/)).toBeInTheDocument();
    expect(screen.getByText('No homes in this browser yet.')).toBeInTheDocument();
    expect(screen.getByText(/make a household, give its house rooms/)).toBeInTheDocument();
  });

  it('lists each home as a card that says who is in and what they are doing, with no dropdown, and opens one', () => {
    render(<Harness open={false} />);
    const card = screen.getByRole('link', { name: 'Open Cafe' });
    expect(within(card).getByText('Imported')).toBeInTheDocument();
    expect(card).toHaveTextContent('Mira · The floor · Minding the counter.');
    expect(card).toHaveTextContent('2 rooms · 1 living here');
    expect(card).toHaveAttribute('href', `#/home/w/${encodeURIComponent(cafeOf(world()).id)}`);
    expect(screen.queryByRole('combobox', { name: 'Place' })).toBeNull();
    fireEvent.click(card);
    expect(screen.getByRole('heading', { name: 'Cafe' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Rooms' })).toBeInTheDocument();
    // And back out to the list.
    fireEvent.click(screen.getByRole('button', { name: 'Homes' }));
    expect(screen.getByRole('link', { name: 'Open Cafe' })).toBeInTheDocument();
  });

  it('keeps a scenario its author took out of Home off the list, and says so for an address that is gone', () => {
    const w = world();
    const hidden = { ...w, records: w.records.map((record) => (record.kind === 'scenario' ? { ...record, homeListed: false } : record)) };
    render(<House worlds={[hidden]} chats={[]} portraits={{}} lives={{}} userName="" onLife={() => {}} onWorld={() => {}} onPicture={() => {}} onChat={() => {}} at={{ worldId: 'w', scenarioId: cafeOf(w).id }} />);
    expect(screen.queryByRole('link', { name: 'Open Cafe' })).toBeNull();
    expect(screen.getByText('That home is not in this browser.')).toBeInTheDocument();
  });

  it('offers each world that comes with the site and isn\'t here yet', () => {
    const onBring = vi.fn();
    render(<House worlds={[]} chats={[]} portraits={{}} lives={{}} userName="" onLife={() => {}} onWorld={() => {}} onPicture={() => {}} onChat={() => {}} bringable={INCLUDED_WORLDS} onBring={onBring} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bring in HOG Wild' }));
    expect(onBring).toHaveBeenCalledWith('hog-wild');
    expect(screen.getByRole('button', { name: 'Bring in The dragon\'s resort' })).toBeInTheDocument();
  });

  it('shows the room a character is in, with them standing where the schedule puts them', () => {
    render(<Harness />);
    const rooms = screen.getByRole('tablist', { name: 'Rooms' });
    expect(within(rooms).getByRole('tab', { name: /The floor/ })).toHaveAttribute('aria-selected', 'true');
    expect(within(rooms).getByLabelText('1 here')).toBeInTheDocument();
    const figure = within(screen.getByRole('region', { name: 'The floor' })).getByRole('button', { name: 'Mira: Minding the counter.' });
    expect(figure).toHaveStyle({ left: '25%', top: '60%', width: '30%' });
    fireEvent.click(within(rooms).getByRole('tab', { name: 'The loft' }));
    expect(screen.getByText(/Nobody is in The loft right now/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Follow Mira' }));
    expect(screen.getByRole('region', { name: 'The floor' })).toBeInTheDocument();
  });

  it('keeps needs once asked, moves them with an action, and holds back what the relationship has not reached', () => {
    render(<Harness />);
    const keeper = screen.getByRole('region', { name: 'Mira' });
    expect(within(keeper).getByRole('meter', { name: 'Hunger' })).toHaveAttribute('aria-valuenow', '100');
    expect(within(keeper).getByRole('button', { name: 'Go out' })).toBeDisabled();
    fireEvent.click(within(keeper).getByRole('button', { name: 'Start keeping them' }));
    expect(within(keeper).queryByRole('button', { name: 'Start keeping them' })).toBeNull();
    fireEvent.click(within(keeper).getByRole('button', { name: 'Feed' }));
    expect(within(keeper).getByRole('meter', { name: 'Hunger' })).toHaveAttribute('aria-valuenow', '20');
    expect(within(keeper).getByText('Sam takes Mira\'s plate away.')).toBeInTheDocument();
    // Hungry now, so her figure looks it.
    expect(within(keeper).getByText(/Looking irritated/)).toBeInTheDocument();
    fireEvent.change(within(keeper).getByLabelText('You are to them'), { target: { value: 'close' } });
    expect(within(keeper).getByRole('button', { name: 'Go out' })).toBeEnabled();
  });

  it('arranges a figure and a room\'s layers, and opens a chat', () => {
    const onChat = vi.fn();
    render(<Harness onChat={onChat} />);
    fireEvent.click(screen.getByRole('button', { name: 'Arrange' }));
    const where = screen.getByRole('region', { name: 'Where Mira stands' });
    fireEvent.change(within(where).getByLabelText('Across'), { target: { value: '0.8' } });
    expect(screen.getByRole('button', { name: 'Mira: Minding the counter.' })).toHaveStyle({ left: '80%' });
    const picture = screen.getByRole('region', { name: 'This room\'s picture' });
    fireEvent.click(within(picture).getByRole('button', { name: 'Add a layer' }));
    fireEvent.change(within(picture).getByLabelText('Movement'), { target: { value: 'flicker' } });
    expect(within(picture).getByLabelText('Movement')).toHaveValue('flicker');
    fireEvent.click(within(screen.getByRole('region', { name: 'Mira' })).getByRole('button', { name: 'Chat' }));
    expect(onChat.mock.calls[0]![1].name).toBe('Mira');
    expect(onChat.mock.calls[0]![2].name).toBe('Cafe');
  });

  it('has a feed: a post is shown what it will send before it is written, and takes comments', async () => {
    const posts: Post[] = [];
    const calls: string[] = [];
    function Posting() {
      const [, redraw] = useState(0);
      const api = (w: World): PostApi => ({
        posts: [...posts], model: 'test-model',
        frame: () => ['It is Friday at 15:30.', 'This is your first post.'],
        preview: async (pw, record, kind) => { calls.push(`preview:${kind}`); return { kind, world: pw, record, chat: null as never, chatId: null, maxTokens: 250, built: { profile: 'general', messages: [{ role: 'system', content: 'THE SHEET' }], prefill: 'Thread:', lead: 'Thread:', roll: { startIndex: 0, pathIdList: [], trimmed: false }, windowStart: 0, plans: [], firstSent: 0, answer: { blocks: [], tokens: 0 } as never, parts: [], tokens: 321, notes: [] } }; },
        write: async (ready) => {
          const post: Post = { format: POST_FORMAT, id: 'p1', key: lifeKey('w', ready.record.id), worldId: 'w', characterId: ready.record.id, kind: ready.kind, chatId: null, title: 'Slow Tuesday', content: 'Nobody came in.', emotion: 'bored', at: 1, madeAt: 1, photo: '', kept: false, comments: [] };
          posts.unshift(post); redraw((n) => n + 1);
          return post;
        },
        comment: async (id) => { const post = posts.find((entry) => entry.id === id)!; post.comments = [...post.comments, { id: `c${post.comments.length}`, name: 'tidewatcher_9', characterId: null, mine: false, content: 'Count them again.', emotion: 'playful', at: 2 }]; redraw((n) => n + 1); return ''; },
        say: (id, text) => { const post = posts.find((entry) => entry.id === id)!; post.comments = [...post.comments, { id: `c${post.comments.length}`, name: 'Sam', characterId: null, mine: true, content: text, emotion: 'neutral', at: 3 }]; redraw((n) => n + 1); },
        describePhoto: async (id) => { posts.find((entry) => entry.id === id)!.photo = 'The empty counter.'; redraw((n) => n + 1); return ''; },
        save: (post) => { posts.splice(posts.findIndex((entry) => entry.id === post.id), 1, post); redraw((n) => n + 1); },
        remove: (post) => { posts.splice(posts.findIndex((entry) => entry.id === post.id), 1); redraw((n) => n + 1); },
      });
      void miraOf;
      return <Harness posting={api} />;
    }
    render(<Posting />);
    fireEvent.click(screen.getByRole('button', { name: /^Posts/ }));
    const feed = screen.getByRole('region', { name: 'Posts' });
    expect(within(feed).getByText(/No posts yet\. A post is written when you ask for one/)).toBeInTheDocument();
    expect(within(feed).getByText('Hasn\u2019t posted yet')).toBeInTheDocument();

    fireEvent.click(within(feed).getByRole('button', { name: 'Mira: post about their day' }));
    const ask = await screen.findByRole('region', { name: 'A new post: what it will send' });
    expect(ask).toHaveTextContent('Mira writes a post about their own day, away from you. This sends about 321 tokens to test-model and allows up to 250 back.');
    expect(ask).toHaveTextContent('It is Friday at 15:30. · This is your first post.');
    expect(posts).toHaveLength(0);
    fireEvent.click(within(ask).getByRole('button', { name: 'Write it' }));

    const post = await screen.findByRole('article', { name: 'Mira: Slow Tuesday' });
    expect(within(post).getByText('Nobody came in.')).toBeInTheDocument();
    fireEvent.click(within(post).getByRole('button', { name: /A comment/ }));
    expect(await within(post).findByText('tidewatcher_9')).toBeInTheDocument();
    fireEvent.change(within(post).getByLabelText('Your comment on Slow Tuesday'), { target: { value: 'I would have come in.' } });
    fireEvent.click(within(post).getByRole('button', { name: 'Post' }));
    expect(within(within(post).getByRole('list', { name: 'Comments' })).getAllByRole('listitem')).toHaveLength(2);
    expect(within(post).getByText('I would have come in.')).toBeInTheDocument();

    // What they'd attach is asked in words and kept, for an image later; and the post can be kept.
    fireEvent.click(within(post).getByRole('button', { name: 'Ask what Mira would attach' }));
    expect(await within(post).findByText('Would attach: The empty counter.')).toBeInTheDocument();
    fireEvent.click(within(post).getByRole('button', { name: 'More for Slow Tuesday' }));
    fireEvent.click(within(post).getByRole('button', { name: /Keep on the profile/ }));
    expect(posts[0]!.kept).toBe(true);
    expect(calls).toEqual(['preview:day']);
  });
});
