// Notes in a chat, posts on a character's feed, and which scenarios are Homes.
import { describe, expect, it } from 'vitest';
import {
  addNote, addReply, addUserMessage, buildComment, buildPhotoAsk, buildRequest, buildSide, clauseList, editMessage, elapsedText, forumSheet, homeOf, homesOf, isHome,
  isNoteText, messageText, newChat, newLife, noteText, overflow, parsePost, pickCommenter, postTask, readComment, readPhotoLine, readPost, residentsOf, setPersona, sinceThen,
  threadText, timeFrame, timeFrameLines, whereabouts, POST_FORMAT, type BuildOptions, type Chat, type Post,
} from '../chat/index.js';
import { importCardJson, newRecord, newWorld, parseWorld, putRecord, recordById, type StoryRecord, type World } from '../records/index.js';

function ids() { let n = 0; return () => `id-${++n}`; }
// A Friday, 15:30 in the device's own zone, so the schedule reads the same wherever this runs.
const FRIDAY = new Date(2026, 8, 11, 15, 30).getTime();
const HOUR = 3_600_000;

const contact = {
  cardType: 'contact', id: 'card-mira', name: 'Mira', persona: 'Wry.', appearance: 'Tall.', greeting: 'Hey.', relationship: 'acquaintance', tags: 'cafe, night',
  exampleMessages: [{ name: 'One', userName: 'Caller', messages: [{ isContact: false, text: 'hi' }, { isContact: true, text: 'We\'re closed.\nCome in anyway.', emotion: 'smug' }] }],
  schedule: {
    Daily: [
      { id: 'open', startTime: 540, endTime: 720, text: 'Opens the cafe.', requiredIntimacy: 'none' },
      { id: 'lunch', startTime: 720, endTime: 780, text: 'Lunch at the counter', requiredIntimacy: 'none' },
      { id: 'private', startTime: 780, endTime: 840, text: 'Reads her letters.', requiredIntimacy: 'close' },
      { id: 'counter', startTime: 840, endTime: 1200, text: 'Minding the counter for {{user}}.', requiredIntimacy: 'none' },
    ],
  },
  cr: { lineHome: { counter: { 'card-cafe': { room: 'vFloor', x: 0.25, y: 0.6, scale: 0.3 } } }, homeIdle: { 'card-cafe': { room: 'vLoft', x: 0.2, y: 0.7, scale: 0.3 } } },
};
const scenario = { cardType: 'scenario', id: 'card-cafe', name: 'Cafe', scene: 'Late.', cr: { sets: [{ id: 'sRooms', name: 'Location', variants: [{ id: 'vFloor', name: 'The floor', content: 'Tables.' }, { id: 'vLoft', name: 'The loft', content: 'A bed.', lock: 'close' }] }] } };

function world(): World {
  const next = ids();
  const a = importCardJson(newWorld('w', 'Imported', 1), contact, next, 2);
  if (!a.ok) throw new Error('contact');
  const b = importCardJson(a.result.world, scenario, next, 3);
  if (!b.ok) throw new Error('scenario');
  const joss: StoryRecord = { ...newRecord('character', 'joss', 'Joss', next), sections: [{ id: 'j1', title: 'Personality', reach: 'here', keys: [], when: null, text: 'Loud.' }] };
  return putRecord(b.result.world, joss, 4);
}
const mira = (w: World) => w.records.find((record) => record.name === 'Mira')!;
const cafe = (w: World) => w.records.find((record) => record.kind === 'scenario')!;

function chat(w: World): Chat {
  return newChat({ id: 'c', worldId: 'w', characterId: mira(w).id, characterName: 'Mira', personaId: null, scenarioId: cafe(w).id, userName: 'Sam', relationship: 'acquaintance', style: 'roleplay', responseLength: 'unspecified', greeting: { text: 'Hey.', emotion: 'bored' } }, ids(), FRIDAY);
}
const options = (model: string, over: Partial<BuildOptions> = {}): BuildOptions => ({ model, canPrefill: true, contextTokens: 16_000, replyTokens: 1000, nowMs: FRIDAY, upTo: 1, continuing: false, firstBuild: true, dryRun: true, rngInt: (min) => min, ...over });

describe('notes', () => {
  it('reads bracketed lines as a note, and puts brackets on text that has none', () => {
    expect(isNoteText('[SYS: Eyes: light grey → violet]')).toBe(true);
    expect(isNoteText('[Chat: she\'s lying] [Bid: the red dress]')).toBe(true);
    expect(isNoteText('[Later.]\n[The lamps are lit.]')).toBe(true);
    expect(isNoteText('Hello [aside]')).toBe(false);
    expect(isNoteText('   ')).toBe(false);
    expect(noteText('Later that night')).toBe('[Later that night]');
    expect(noteText('[Already one]')).toBe('[Already one]');
    expect(noteText('one\n\n[two]')).toBe('[one]\n[two]');
    expect(noteText('  ')).toBe('');
  });

  it('goes into the transcript as nobody\'s turn, and edits as a note', () => {
    const w = world();
    let c = addNote(chat(w), 'Later that night', 'n1', FRIDAY + 1);
    expect(c.messages.at(-1)).toMatchObject({ id: 'n1', from: 'note' });
    expect(messageText(c.messages.at(-1)!)).toBe('[Later that night]');
    expect(addNote(c, '   ', 'n2', FRIDAY + 2)).toBe(c);
    c = editMessage(c, 'n1', 'The next morning', 'Mira', FRIDAY + 3);
    expect(messageText(c.messages.at(-1)!)).toBe('[The next morning]');
    // A note is not the character speaking: the last emotion and the time apart ignore it.
    expect(c.messages.filter((message) => message.from === 'character')).toHaveLength(1);
  });

  it('reaches xialong as a system message in the chat, and counts as nobody\'s turn', async () => {
    const w = world();
    let c = addUserMessage(chat(w), 'Evening.', 'u1', FRIDAY + 1);
    c = addNote(c, '[SYS: The power is out]', 'n1', FRIDAY + 2);
    const built = (await buildRequest(c, w, options('xialong-v1', { upTo: 3 })))!;
    const at = built.messages.findIndex((message) => message.content === '[SYS: The power is out]');
    expect(built.messages[at]).toEqual({ role: 'system', content: '[SYS: The power is out]' });
    expect(built.messages[at - 1]).toEqual({ role: 'user', content: 'Sam: Evening.' });
    expect(built.messages[at + 1]!.content).toMatch(/^\[ Style:/);
  });

  it('reaches other models in the player\'s turn, in its brackets, with the moment after it', async () => {
    const w = world();
    let c = addUserMessage(chat(w), 'Evening.', 'u1', FRIDAY + 1);
    c = addNote(c, 'The power is out', 'n1', FRIDAY + 2);
    const built = (await buildRequest(c, w, options('glm-4-6', { upTo: 3 })))!;
    const last = built.messages.at(-1)!;
    expect(last.role).toBe('user');
    expect(last.content).toMatch(/^Evening\.\n\[The power is out\]\n\n\[Style: roleplay/);
    expect(built.messages[0]!.content).toContain('A bracketed line on its own in the chat is a directive');
    // A chat that opens on a note needs no "[The chat begins.]".
    const opened = addNote({ ...chat(w), messages: [] }, 'A storm', 'n0', FRIDAY);
    const first = (await buildRequest(opened, w, options('glm-4-6', { upTo: 1 })))!;
    expect(first.messages.at(-1)!.content).toMatch(/^\[A storm\]\n\n\[Style/);
  });

  it('changes who the player is in a chat', () => {
    const c = setPersona(chat(world()), 'p1', 'Rook', FRIDAY + 5);
    expect(c).toMatchObject({ personaId: 'p1', userName: 'Rook', updatedAt: FRIDAY + 5 });
    expect(setPersona(c, null, '  ', FRIDAY + 6)).toMatchObject({ personaId: null, userName: 'Rook' });
  });
});

describe('a post\'s time frame', () => {
  it('says how long, in the largest two units', () => {
    expect(elapsedText(0, 30_000)).toBe('moments');
    expect(elapsedText(0, 60_000)).toBe('1 minute');
    expect(elapsedText(0, HOUR * 4 + 10 * 60_000)).toBe('4 hours and 10 minutes');
    expect(elapsedText(0, HOUR * 51)).toBe('2 days and 3 hours');
    expect(elapsedText(0, HOUR * 48)).toBe('2 days');
    expect(elapsedText(HOUR, 0)).toBe('moments');
  });

  it('joins schedule lines without doubling their stops', () => {
    expect(clauseList(['Walks around the kitchen.', 'Sits in the toaster to warm up.'])).toBe('Walks around the kitchen; Sits in the toaster to warm up.');
    expect(clauseList(['Sleeps!', ''])).toBe('Sleeps!');
    expect(clauseList(['Waits…'])).toBe('Waits…');
    expect(clauseList([])).toBe('');
  });

  it('lists what the schedule put in a gap once each, leaves out what the relationship hides, and gives up past a fortnight', () => {
    const m = mira(world());
    const nine = new Date(2026, 8, 11, 8, 0).getTime();
    expect(sinceThen(m, 'acquaintance', nine, FRIDAY, 'Sam')).toEqual(['Opens the cafe.', 'Lunch at the counter', 'Minding the counter for Sam.']);
    expect(sinceThen(m, 'close', nine, FRIDAY, 'Sam')).toContain('Reads her letters.');
    // Three days of the same Daily events count once.
    expect(sinceThen(m, 'acquaintance', FRIDAY - 72 * HOUR, FRIDAY, 'Sam')).toHaveLength(3);
    expect(sinceThen(m, 'acquaintance', FRIDAY - 15 * 24 * HOUR, FRIDAY)).toEqual([]);
    expect(sinceThen(m, 'acquaintance', FRIDAY, FRIDAY - HOUR)).toEqual([]);
  });

  it('measures a day post from when they last spoke and a chat post from the last post, and says which', () => {
    const m = mira(world());
    const moment = { nowMs: FRIDAY, relationship: 'acquaintance', userName: 'Sam', lastSpokeMs: FRIDAY - 3 * 24 * HOUR, lastPostMs: FRIDAY - 2 * HOUR };
    const day = timeFrameLines(m, { ...moment, kind: 'day' });
    expect(day[0]).toBe('It is Friday at 15:30.');
    expect(day[1]).toBe('You last spoke with Sam on Tuesday at 15:30 — 3 days ago.');
    expect(day[2]).toBe('You last posted 2 hours ago.');
    expect(day.at(-1)).toBe('Right now you are: Minding the counter for Sam.');
    const about = timeFrameLines(m, { ...moment, kind: 'chat' });
    expect(about[1]).toBe('Your last post was Friday at 13:30 — 2 hours ago.');
    expect(about.join('\n')).not.toContain('You last spoke');
    // No stamp to measure from: a day post falls back to the last post; with neither, it says so.
    expect(timeFrameLines(m, { ...moment, kind: 'day', lastSpokeMs: 0 })[1]).toMatch(/^Your last post was/);
    expect(timeFrameLines(m, { kind: 'day', nowMs: FRIDAY, relationship: 'acquaintance', userName: 'Sam' })[1]).toBe('This is your first post.');
    // A stamp from the future is no stamp; a long gap carries the date.
    expect(timeFrameLines(m, { ...moment, kind: 'chat', lastPostMs: FRIDAY + HOUR })[1]).toBe('This is your first post.');
    expect(timeFrameLines(m, { ...moment, kind: 'chat', lastPostMs: FRIDAY - 9 * 24 * HOUR })[1]).toContain('(2026-09-02)');
    expect(timeFrame(m, { ...moment, kind: 'day' })).toMatch(/^----\nTime\nIt is Friday/);
  });
});

describe('writing a post', () => {
  it('asks xialong the way CharacterRoom does: the story, the thread\'s shape, the time, the style and a primer', async () => {
    const w = world();
    const frame = timeFrame(mira(w), { kind: 'day', nowMs: FRIDAY, relationship: 'acquaintance', userName: 'Sam' });
    const task = postTask('day', 'Mira', frame);
    const built = (await buildSide(task, chat(w), w, options('xialong-v1')))!;
    const tail = built.messages.slice(-5);
    expect(tail[0]!.content).toMatch(/^The author of the forum thread is Mira\. The format is as follows\.\n {18}Thread: Thread Name\n {18}====/);
    expect(tail[1]!.content).toBe(frame);
    expect(tail[2]!.content).toContain('It is NOT about the conversation you have been having');
    expect(tail[3]).toEqual({ role: 'system', content: '[ Style: forum thread, posting about your own day ]' });
    expect(tail[4]).toEqual({ role: 'assistant', content: 'Thread:' });
    expect(built.lead).toBe('Thread:');
    expect(built.messages.some((message) => /^\[ Style: roleplay/.test(message.content))).toBe(false);
    const about = postTask('chat', 'Mira', frame);
    expect(about.frame).toEqual([frame]);
    expect(about.style).toBe('[ Style: forum thread, discussing recent chat ]');
  });

  it('asks any other model for the same layout in a sentence, started on Thread', async () => {
    const w = world();
    const task = postTask('chat', 'Mira', '----\nTime\nIt is Friday at 15:30.');
    const built = (await buildSide(task, chat(w), w, options('glm-4-6')))!;
    expect(built.prefill).toBe('Thread:');
    const ask = built.messages.at(-1)!.content;
    expect(ask).toContain('[ Style: forum thread, discussing recent chat ]');
    expect(ask).toContain('Start with "Thread:" and a short title, then a line of ====');
    expect(ask).toContain('It is Friday at 15:30.');
  });

  it('writes from the chat as it stood at a message, when asked to', async () => {
    const w = world();
    let c = addUserMessage(chat(w), 'About the harbour.', 'u1', FRIDAY + 1);
    c = addReply(c, [{ text: 'It floods.', emotion: 'neutral' }], 'r1', FRIDAY + 2);
    c = addUserMessage(c, 'And the pier?', 'u2', FRIDAY + 3);
    const task = postTask('chat', 'Mira', 'frame');
    const early = (await buildSide(task, c, w, options('glm-4-6'), 2))!;
    expect(JSON.stringify(early.messages)).toContain('About the harbour.');
    expect(JSON.stringify(early.messages)).not.toContain('And the pier?');
    const whole = (await buildSide(task, c, w, options('glm-4-6')))!;
    expect(JSON.stringify(whole.messages)).toContain('And the pier?');
  });

  it('reads a thread back: the title, the body after the rule, less the author line, and the emotion', () => {
    expect(readPost(' Slow Tuesday\n====\nMira\nNobody came in.\nI counted the cups twice.\n  Emotion: bored', 'Thread:', 'Mira')).toEqual({ title: 'Slow Tuesday', content: 'Nobody came in.\nI counted the cups twice.', emotion: 'bored' });
    expect(readPost('Thread: "Rain"\n====\nMira: It rained.\nEmotion: happy', 'Thread:', 'Mira')).toEqual({ title: 'Rain', content: 'It rained.', emotion: 'happy' });
    // No rule line: everything after the title line. An emotion the house doesn't have is neutral.
    expect(readPost('Thread: Rain\nIt rained all day.\n  Emotion: gleeful', 'Thread:', 'Mira')).toEqual({ title: 'Rain', content: 'It rained all day.', emotion: 'neutral' });
    expect(readPost(' Empty\n====\n', 'Thread:', 'Mira')).toBeNull();
  });
});

const post = (over: Partial<Post> = {}): Post => parsePost({ format: POST_FORMAT, id: 'p1', key: 'w:mira', worldId: 'w', characterId: 'mira', kind: 'day', title: 'Slow Tuesday', content: 'Nobody came in.', emotion: 'bored', at: FRIDAY, madeAt: FRIDAY, ...over })!;

describe('comments', () => {
  it('picks who is talking by the dice: sometimes a housemate, rarely the author, otherwise a stranger', () => {
    const w = world();
    const author = mira(w);
    const joss = recordById(w, 'joss')!;
    const rolls = (...values: number[]) => { let at = 0; return () => values[at++] ?? 1; };
    expect(pickCommenter(post(), author, [joss], rolls(1, 0))).toEqual({ record: joss, asAuthor: false });
    expect(pickCommenter(post(), author, [joss], rolls(2, 1))).toEqual({ asAuthor: false });
    const busy = post({ comments: [1, 2, 3].map((n) => ({ id: `c${n}`, name: 'x', content: 'y' })) as Post['comments'] });
    expect(pickCommenter(busy, author, [], rolls(1))).toEqual({ record: author, asAuthor: true });
    expect(pickCommenter(busy, author, [], rolls(2))).toEqual({ asAuthor: false });
  });

  it('shows a commenter the post and the last six comments', () => {
    const many = post({ comments: Array.from({ length: 8 }, (_, n) => ({ id: `c${n}`, name: `user${n}`, content: `comment ${n}` })) as Post['comments'] });
    const text = threadText(many, 'Mira');
    expect(text).toMatch(/^Thread: Slow Tuesday\nMira: Nobody came in\./);
    expect(text).not.toContain('comment 1');
    expect(text).toContain('user7: comment 7');
  });

  it('gives a housemate their own short sheet, with their examples as quotes', () => {
    const sheet = forumSheet(mira(world()));
    expect(sheet).toMatch(/^Mira\nType: contact\n/);
    expect(sheet).toContain('Personality: Wry.');
    expect(sheet).toContain('Appearance: Tall.');
    expect(sheet).toContain('Categories: cafe, night');
    expect(sheet).toContain('Example quotes:\n1.\n Caller: hi\n Mira: We\'re closed.\n     Come in anyway.\n   Emotion: smug\n');
  });

  it('asks xialong in CharacterRoom\'s messages and other models in one instruction', () => {
    const w = world();
    const joss = recordById(w, 'joss')!;
    const forXialong = buildComment(post(), mira(w), { record: joss, asAuthor: false }, 'aetherroom', false, FRIDAY);
    expect(forXialong.messages.map((message) => message.role)).toEqual(['system', 'system', 'system', 'system', 'system', 'assistant']);
    expect(forXialong.messages[0]!.content).toMatch(/^A forum thread\.\nThread: Slow Tuesday/);
    expect(forXialong.messages[2]!.content).toBe('You are Joss. You are replying to someone else\'s post on a forum you both use.');
    expect(forXialong.messages[4]!.content).toBe('[ Style: forum comment, one reply ]');
    expect(forXialong.messages.at(-1)).toEqual({ role: 'assistant', content: 'Joss' });
    expect(forXialong).toMatchObject({ lead: 'Joss', maxTokens: 220, temperature: 1 });

    const stranger = buildComment(post(), mira(w), { asAuthor: false }, 'aetherroom', false, FRIDAY);
    expect(stranger.messages.at(-1)!.role).toBe('system');
    expect(stranger.messages[1]!.content).toContain('Invent a screen name for yourself');
    expect(stranger.lead).toBe('');

    const general = buildComment(post(), mira(w), { record: mira(w), asAuthor: true }, 'general', true, FRIDAY);
    expect(general.messages).toHaveLength(2);
    expect(general.messages[0]!.content).toContain('## Who you are\nMira\nType: contact');
    expect(general.messages[1]!.content).toContain('You are Mira, the author of this thread, replying to the comments under it.');
    expect(general.prefill).toBe('Mira\n');
    expect(buildComment(post(), mira(w), { asAuthor: false }, 'general', true, FRIDAY).prefill).toBe('');
  });

  it('reads a comment back: a stranger\'s screen name from the first line, a known name never left in the body', () => {
    expect(readComment('tidewatcher_9\nCount them a third time.\nEmotion: playful', '')).toEqual({ name: 'tidewatcher_9', content: 'Count them a third time.', emotion: 'playful' });
    expect(readComment('\nYou could have called.\n  Emotion: hurt', 'Joss')).toEqual({ name: 'Joss', content: 'You could have called.', emotion: 'hurt' });
    expect(readComment('Joss\nJoss: You could have called.', 'Joss')).toEqual({ name: 'Joss', content: 'You could have called.', emotion: 'neutral' });
    // A known name doesn't eat the first line of what they said.
    expect(readComment('Typical.\nEvery Tuesday.', 'Joss')!.content).toBe('Typical.\nEvery Tuesday.');
    expect(readComment('lonely_name\n', '')).toBeNull();
  });
});

describe('a post\'s photo, and the feed', () => {
  it('asks what they would attach, in plain words, and keeps the first line of the answer', () => {
    const ask = buildPhotoAsk(post(), 'Mira', 'aetherroom', false);
    expect(ask.messages.at(-1)).toEqual({ role: 'assistant', content: 'Photo:' });
    expect(ask.messages[1]!.content).toContain('Do not describe your own face or body.');
    expect(buildPhotoAsk(post(), 'Mira', 'general', true).prefill).toBe('Photo:');
    expect(readPhotoLine('\n - Photo: The empty counter, cups stacked, from behind the till.\nSecond line.')).toBe('The empty counter, cups stacked, from behind the till.');
    expect(readPhotoLine('  \n')).toBe('');
  });

  it('drops the oldest posts past the limit, and never a kept one', () => {
    const feed = [1, 2, 3, 4].map((n) => post({ id: `p${n}`, madeAt: n, kept: n === 1 }));
    expect(overflow(feed, 'w:mira', 3).map((entry) => entry.id)).toEqual(['p2']);
    expect(overflow(feed, 'w:mira', 4)).toEqual([]);
    expect(overflow(feed, 'w:other', 1)).toEqual([]);
    expect(parsePost({ nonsense: true })).toBeNull();
  });
});

describe('homes', () => {
  it('takes a scenario with rooms as a Home, unless its author keeps it out', () => {
    const w = world();
    const home = cafe(w);
    expect(isHome(home)).toBe(true);
    expect(isHome({ ...home, homeListed: false })).toBe(false);
    expect(isHome({ ...home, sets: [] })).toBe(false);
    expect(isHome(mira(w))).toBe(false);
    expect(homesOf([w]).map((entry) => entry.scenario.name)).toEqual(['Cafe']);
    expect(residentsOf(homesOf([w])[0]!).map((record) => record.name)).toEqual(['Mira']);
    expect(homeOf(w, mira(w))?.scenario.name).toBe('Cafe');
    expect(homeOf(w, recordById(w, 'joss')!)).toBeNull();
  });

  it('says who is where, and keeps a locked room\'s name to itself', () => {
    const w = world();
    const home = homesOf([w])[0]!;
    const [there] = whereabouts(home, {}, FRIDAY);
    expect(there).toMatchObject({ room: 'The floor', doing: 'Minding the counter for {{user}}.', hidden: false });
    // At night nothing is on, so she idles in the loft, which opens once you're close.
    const night = new Date(2026, 8, 11, 23, 0).getTime();
    expect(whereabouts(home, {}, night)[0]).toMatchObject({ room: '', doing: '', hidden: true });
    const life = { ...newLife('w', mira(w), night), relationship: 'close' as const };
    expect(whereabouts(home, { [life.key]: life }, night)[0]).toMatchObject({ room: 'The loft', hidden: false });
  });

  it('keeps what a world is for, and reads a world without it as before', () => {
    const w = world();
    const read = parseWorld({ ...w, use: 'household' });
    expect(read.ok && read.world.use).toBe('household');
    const plain = parseWorld(JSON.parse(JSON.stringify(w)));
    expect(plain.ok && plain.world.use).toBeUndefined();
    expect(parseWorld({ ...w, use: 'theme park' }).ok).toBe(false);
  });
});
