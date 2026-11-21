// Group chat, G1 (core/chat/group.ts), on the dragon's resort: Qiulong, Errata and Echydna.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseWorld, type World } from '../records/index.js';
import {
  addNote, addReply, addUserMessage, answeredSince, buildGroupRequest, buildRequest, cleanGroupReply, groupStops, handoffIn, isGroup,
  membersOf, namedIn, newChat, newGroupChat, nextSpeaker, parseChat, pickerRequest, quietest, readPick, setGroup, setMember, withCast,
  type BuildOptions, type Chat,
} from '../chat/index.js';

const read = parseWorld(JSON.parse(readFileSync(new URL('../../content/dragons-resort/world.json', import.meta.url), 'utf8')));
if (!read.ok) throw new Error(read.errors.join(' '));
const world: World = read.world;
const NOW = Date.UTC(2026, 10, 21, 19, 0);

let n = 0;
const ids = () => `m${++n}`;
const options = (upTo: number, model = 'glm-4-6'): BuildOptions => ({ model, canPrefill: false, contextTokens: 32_000, replyTokens: 800, nowMs: NOW, upTo, continuing: false, firstBuild: false, dryRun: true, rngInt: (min) => min });

function group(): Chat {
  const start = newGroupChat({
    id: 'g', worldId: world.id, characterId: 'qiulong', characterName: 'Qiulong', personaId: null, scenarioId: 'resort-arrival', userName: 'Sam',
    relationship: 'acquaintance', style: 'roleplay', responseLength: 'medium', greeting: null, cast: ['qiulong', 'errata', 'echydna'],
    greetings: { qiulong: { text: 'Tea first, then trouble.', emotion: 'happy' }, errata: { text: 'Mm. Another one.', emotion: 'neutral' }, echydna: null },
  }, ids, NOW);
  let chat = addUserMessage(start, 'Evening, all. Long day.', ids(), NOW);
  chat = addReply(chat, [{ text: 'Sit. The pot is still warm.', emotion: 'happy' }], ids(), NOW, '', 'qiulong');
  chat = addReply(chat, [{ text: '*doesn\'t look up from the draft* Long days make short tempers.', emotion: 'neutral' }], ids(), NOW, '', 'errata');
  return addUserMessage(chat, 'Echydna, what are we watching?', ids(), NOW);
}

describe('a group chat', () => {
  it('is a chat with a cast; greetings open it in the cast’s order, each under its speaker', () => {
    const chat = group();
    expect(isGroup(chat)).toBe(true);
    expect(membersOf(chat, world).map((member) => member.name)).toEqual(['Qiulong', 'Errata', 'Echydna']);
    expect(chat.messages.slice(0, 2).map((message) => message.speaker)).toEqual(['qiulong', 'errata']);
    expect(parseChat(JSON.parse(JSON.stringify(chat)))).toMatchObject({ ok: true });
  });

  it('keeps one-to-one chats as they were, and the cast to four with the chat’s character first', () => {
    const solo = newChat({ id: 's', worldId: world.id, characterId: 'errata', characterName: 'Errata', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'stranger', style: 'chat', responseLength: 'unspecified', greeting: null }, ids, NOW);
    expect(isGroup(solo)).toBe(false);
    expect(solo.cast).toEqual([]);
    const grown = withCast(solo, ['qiulong', 'errata', 'echydna', 'a', 'b'], NOW);
    expect(grown.cast.map((entry) => entry.characterId)).toEqual(['errata', 'qiulong', 'echydna', 'a']);
    expect(withCast(grown, [], NOW).cast).toEqual([]);
    const muted = setMember(grown, 'echydna', { muted: true, talk: 'chatty' }, NOW);
    expect(withCast(muted, ['echydna'], NOW).cast).toEqual([expect.objectContaining({ characterId: 'errata' }), expect.objectContaining({ characterId: 'echydna', muted: true, talk: 'chatty' })]);
  });

  it('builds a one-to-one chat the same with or without the group fields', async () => {
    const solo = addUserMessage(newChat({ id: 's', worldId: world.id, characterId: 'errata', characterName: 'Errata', personaId: null, scenarioId: 'resort-arrival', userName: 'Sam', relationship: 'close', style: 'roleplay', responseLength: 'medium', greeting: world.records.find((record) => record.id === 'errata')!.greetings[0]! }, ids, NOW), 'Hey you.', ids(), NOW);
    const { cast: _cast, group: _group, ...older } = solo;
    const parsed = parseChat(older);
    if (!parsed.ok) throw new Error(parsed.errors.join(' '));
    const before = await buildRequest(parsed.chat, world, options(solo.messages.length));
    const after = await buildRequest(solo, world, options(solo.messages.length));
    expect(after!.messages).toEqual(before!.messages);
    expect(after!.stop).toBeUndefined();
  });
});

describe('who answers', () => {
  it('is whoever the player names, then the author of the message they answer', () => {
    const chat = group();
    const members = membersOf(chat, world);
    expect(namedIn('Echydna, what are we watching? @errata too', members).map((member) => member.name)).toEqual(['Echydna', 'Errata']);
    expect(namedIn('the errata sheet', members).map((member) => member.name)).toEqual(['Errata']);
    expect(namedIn('Qiulongs', members)).toEqual([]);
    expect(nextSpeaker(chat, members)).toMatchObject({ member: { id: 'echydna' }, why: 'named' });
    const replying = addUserMessage(chat, 'Fair.', 'reply-1', NOW);
    const withReply = { ...replying, messages: replying.messages.map((message) => (message.id === 'reply-1' ? { ...message, replyTo: chat.messages[4]!.id } : message)) };
    expect(nextSpeaker(withReply, members)).toMatchObject({ member: { id: 'errata' }, why: 'reply' });
  });

  it('asks the agent when nobody is named, with the quietest as the fallback; the quietest answers when the agent is off', () => {
    const chat = addUserMessage(group(), 'So.', ids(), NOW);
    const members = membersOf(chat, world);
    expect(quietest(chat, members)?.id).toBe('echydna');
    expect(nextSpeaker(chat, members)).toMatchObject({ ask: expect.any(Array), fallback: { id: 'echydna' } });
    const off = setGroup(chat, { picker: 'quietest' }, NOW);
    expect(nextSpeaker(off, members)).toMatchObject({ member: { id: 'echydna' }, why: 'quietest' });
  });

  it('weighs talkativeness, never picks a muted member unless named, and stops after one answer by default', () => {
    let chat = addReply(group(), [{ text: 'Old films.', emotion: 'neutral' }], ids(), NOW, '', 'echydna');
    chat = addUserMessage(setGroup(chat, { picker: 'quietest' }, NOW), 'Hm.', ids(), NOW);
    expect(quietest(chat, membersOf(chat, world))?.id).toBe('qiulong');
    const chatty = setMember(setMember(chat, 'errata', { talk: 'chatty' }, NOW), 'qiulong', { talk: 'quiet' }, NOW);
    expect(quietest(chatty, membersOf(chatty, world))?.id).toBe('errata');
    const muted = setMember(chatty, 'errata', { muted: true }, NOW);
    expect(quietest(muted, membersOf(muted, world))?.id).toBe('qiulong');
    const named = addUserMessage(muted, 'Errata?', ids(), NOW);
    expect(nextSpeaker(named, membersOf(named, world))).toMatchObject({ member: { id: 'errata' }, why: 'named' });
    const answered = addReply(named, [{ text: 'What.', emotion: 'neutral' }], ids(), NOW, '', 'errata');
    expect(answeredSince(answered)).toEqual(['errata']);
    expect(nextSpeaker(answered, membersOf(answered, world))).toBeNull();
  });

  it('lets up to three answer in "whoever has something to say", each once', () => {
    let chat = setGroup(addUserMessage(group(), 'Anyone hungry?', ids(), NOW), { answers: 'several', picker: 'quietest' }, NOW);
    const members = membersOf(chat, world);
    const seen: string[] = [];
    for (let turn = 0; turn < 4; turn += 1) {
      const next = nextSpeaker(chat, members);
      if (!next || !('member' in next)) break;
      seen.push(next.member.id);
      chat = addReply(chat, [{ text: '...', emotion: 'neutral' }], ids(), NOW, '', next.member.id);
    }
    expect(seen).toHaveLength(3);
    expect(new Set(seen).size).toBe(3);
  });

  it('hands the turn on by @name or a question by name, once each', () => {
    const members = membersOf(group(), world);
    expect(handoffIn('*nods* Ask @Errata, she keeps the books.', 'qiulong', members, [])?.id).toBe('errata');
    expect(handoffIn('It was a long day. What do you think, Echydna?', 'qiulong', members, [])?.id).toBe('echydna');
    expect(handoffIn('It was a long day. What do you think, Echydna?', 'qiulong', members, ['echydna'])).toBeNull();
    expect(handoffIn('Echydna laughed. Then the kettle went.', 'qiulong', members, [])).toBeNull();
  });

  it('asks the agent one question and reads one name back', () => {
    const chat = addUserMessage(group(), 'So.', ids(), NOW);
    const members = membersOf(chat, world);
    const request = pickerRequest(chat, members, members);
    expect(request[0]!.content).toContain('{"speaker": "<name>"}');
    expect(request[1]!.content).toContain('Errata: *doesn\'t look up');
    expect(readPick('{"speaker": "Errata"}', members)).toMatchObject({ id: 'errata' });
    expect(readPick('Echydna.', members)).toMatchObject({ id: 'echydna' });
    expect(readPick('{"speaker": null}', members)).toBe('nobody');
    expect(readPick('I cannot say.', members)).toBeNull();
  });
});

describe('a reply kept to its speaker', () => {
  it('stops at everyone else’s label and the player’s', () => {
    expect(groupStops(membersOf(group(), world), 'errata', 'Sam')).toEqual(['\nQiulong:', '\nEchydna:', '\nSam:']);
  });

  it('cuts where someone else’s line starts, keeps the speaker’s after someone else’s, and drops a reply that is only someone else’s', () => {
    expect(cleanGroupReply('Errata: Fine.\n*taps the page*\nQiulong: More tea?\nErrata: No.', 'Errata', ['Qiulong', 'Echydna'], 'Sam'))
      .toEqual({ text: 'Errata: Fine.\n*taps the page*', cut: ['Qiulong'], dropped: false, skipped: [] });
    expect(cleanGroupReply('Qiulong: More tea?\nErrata: No.', 'Errata', ['Qiulong'], 'Sam')).toEqual({ text: 'Errata: No.', cut: [], dropped: false, skipped: ['Qiulong'] });
    expect(cleanGroupReply('**Echydna:** Shh, it\'s starting.', 'Errata', ['Echydna'], 'Sam')).toMatchObject({ text: '', dropped: true });
    expect(cleanGroupReply('Fine.\nSam: okay', 'Errata', ['Echydna'], 'Sam')).toMatchObject({ text: 'Fine.', cut: ['Sam'] });
  });
});

describe('the layouts', () => {
  const ask = (built: Awaited<ReturnType<typeof buildGroupRequest>>) => built!.messages.map((message) => `${message.role}: ${message.content}`).join('\n---\n');

  it('B: the speaker’s own sheet and examples, the others by their line, every reply under its writer’s name', async () => {
    const chat = group();
    const built = await buildGroupRequest(chat, world, 'echydna', options(chat.messages.length), { layout: 'b' });
    const text = ask(built);
    expect(built!.speaker).toBe('echydna');
    expect(built!.lead).toBe('Echydna:');
    expect(built!.stop).toEqual(['\nQiulong:', '\nErrata:', '\nSam:']);
    expect(text).toContain('in a group chat with Sam and Qiulong and Errata');
    expect(text).toContain('## Also here, with Echydna\nQiulong: An autumn dragon');
    expect(text).toContain('## How Echydna writes');
    expect(text).not.toContain('## How Errata writes');
    expect(text).toContain('assistant: Qiulong: Sit. The pot is still warm.\nErrata: *doesn\'t look up');
    expect(text).toContain('Reply as Echydna only.');
  });

  it('B with the others as the player’s turns: named, in the user role', async () => {
    const chat = group();
    const built = await buildGroupRequest(chat, world, 'echydna', options(chat.messages.length), { layout: 'b', others: 'user' });
    const turns = built!.messages.filter((message) => message.role !== 'system');
    expect(turns.every((message) => message.role === 'user')).toBe(true);
    expect(turns.at(-1)!.content).toContain('Qiulong: Sit. The pot is still warm.');
  });

  it('C: two speakers on the same turn get the same request up to the end of the transcript', async () => {
    const chat = group();
    const one = await buildGroupRequest(chat, world, 'echydna', options(chat.messages.length), { layout: 'c' });
    const two = await buildGroupRequest(chat, world, 'errata', options(chat.messages.length), { layout: 'c' });
    expect(one!.messages.slice(0, -1)).toEqual(two!.messages.slice(0, -1));
    const [lastOne, lastTwo] = [one!.messages.at(-1)!.content, two!.messages.at(-1)!.content];
    const transcript = lastOne.slice(0, lastOne.lastIndexOf('\n\n['));
    expect(lastTwo.startsWith(`${transcript}\n\n[`)).toBe(true);
    expect(lastOne).toContain('## Echydna, who you write as now');
    expect(lastOne).toContain("Write Echydna's next message only.");
    expect(lastTwo).toContain('## Errata, who you write as now');
    expect(one!.messages[0]!.content).toContain('## Who is here');
    expect(one!.messages[0]!.content).not.toContain('Echydna writes');
    expect(one!.parts.map((part) => part.label)).toEqual(expect.arrayContaining(['Transcript', "Echydna's block"]));
  });

  it('C with the anchor names the speaker straight after the transcript', async () => {
    const chat = group();
    const built = await buildGroupRequest(chat, world, 'errata', options(chat.messages.length), { layout: 'c', anchor: true });
    expect(built!.messages.at(-1)!.content).toMatch(/\n\n\[You are writing as Errata\.\n## Errata, who you write as now/);
  });

  it('sends a memory or a plan only with its owner', async () => {
    const chat: Chat = {
      ...group(),
      diary: [{ id: 'd1', name: 'The ledger', content: 'ERRATA-SECRET', keys: ['watching'], at: 0, owner: 'errata' }],
      plans: [{ id: 'p1', name: 'Snacks', content: 'ECHYDNA-PLAN', planType: 'User', durationType: 'Ongoing', totalTurns: 3, remainingTurns: 3, running: true, startedAtCount: 0, owner: 'echydna' }],
    };
    for (const layout of ['b', 'c'] as const) {
      const asEchydna = ask(await buildGroupRequest(chat, world, 'echydna', options(chat.messages.length), { layout }));
      const asErrata = ask(await buildGroupRequest(chat, world, 'errata', options(chat.messages.length), { layout }));
      expect(asEchydna).toContain('ECHYDNA-PLAN');
      expect(asEchydna).not.toContain('ERRATA-SECRET');
      expect(asErrata).toContain('ERRATA-SECRET');
      expect(asErrata).not.toContain('ECHYDNA-PLAN');
    }
  });

  it('Xialong takes B through CharacterRoom’s kernel, the others’ lines as named player turns', async () => {
    const chat = addNote(group(), '[The film starts.]', ids(), NOW);
    const built = await buildGroupRequest(chat, world, 'echydna', options(chat.messages.length, 'xialong-v1'), { layout: 'c' });
    expect(built!.profile).toBe('aetherroom');
    const text = ask(built);
    expect(text).toContain('user: Qiulong: Sit. The pot is still warm.');
    expect(text).not.toContain('Sam: Qiulong:');
    expect(text).toContain('Also here, with Echydna');
    expect(built!.stop).toContain('\nErrata:');
  });
});
