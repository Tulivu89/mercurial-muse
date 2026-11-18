// Chapters: what leaves the General window, written up once (memory review, C1).
import { describe, expect, it } from 'vitest';
import {
  addReply, addUserMessage, buildRequest, chapterRequest, chapterWritten, chaptersToWrite, changeChapter, coveredUpTo, editMessage, isStale, newChat,
  queueChapters, readChapter, storySoFar, CHAPTER_SPAN_MESSAGES, CHAPTER_TRIES, type BuildOptions, type Chat,
} from '../chat/index.js';
import { newRecord, newWorld, putRecord, type World } from '../records/index.js';

function ids(prefix = 'id') { let n = 0; return () => `${prefix}-${++n}`; }
const NOW = Date.UTC(2026, 10, 18, 12);

function chatWith(turns: number): Chat {
  let c = newChat({ id: 'c', worldId: 'w', characterId: 'ada', characterName: 'Ada Moss', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'stranger', style: 'roleplay', responseLength: 'unspecified', greeting: null }, ids('g'), NOW);
  for (let i = 0; i < turns; i += 1) {
    c = addUserMessage(c, `Sam's line ${i}. ${'word '.repeat(30)}`, `u${i}`, NOW + i * 2);
    c = addReply(c, [{ text: `Ada's line ${i}. ${'word '.repeat(30)}`, emotion: 'neutral' }], `r${i}`, NOW + i * 2 + 1);
  }
  return c;
}

describe('chapters', () => {
  it('queues the messages that left the window, in spans one request can take', () => {
    const c = chatWith(50);
    const queued = queueChapters(c, 90, ids('ch'), NOW);
    expect(queued.chapters).toHaveLength(Math.ceil(90 / CHAPTER_SPAN_MESSAGES));
    expect(queued.chapters[0]).toMatchObject({ fromId: 'u0', state: 'pending' });
    expect(coveredUpTo(queued)).toBe(90);
    // Nothing new when the window hasn't moved past what is covered.
    expect(queueChapters(queued, 90, ids('x'), NOW).chapters).toHaveLength(queued.chapters.length);
    expect(queueChapters(queued, 96, ids('x'), NOW).chapters.at(-1)).toMatchObject({ fromId: 'u45', toId: 'r47' });
  });

  it('asks for a document, not the story, with the chapter before as context only', () => {
    let c = queueChapters(chatWith(10), 20, ids('ch'), NOW);
    c = queueChapters({ ...c, chapters: [{ ...c.chapters[0]!, state: 'written', text: 'Ada met Sam at the booth.' }] }, 20, ids('x'), NOW);
    c = queueChapters(addUserMessage(addReply(c, [{ text: 'More.', emotion: 'neutral' }], 'r-x', NOW), 'And?', 'u-x', NOW), 22, ids('y'), NOW);
    const [system, user] = chapterRequest(c, c.chapters[1]!, 'usual')!;
    expect(system!.content).toContain('do not continue the roleplay');
    expect(system!.content).toContain('3 to 6 sentences');
    expect(system!.content).toContain('Keys:');
    expect(user!.content).toContain('[The chapter before, for context only. Do not write it up again.]\nAda met Sam at the booth.');
    expect(user!.content).toContain('=== Transcript ===');
    expect(chapterRequest(c, c.chapters[0]!, 'short')![0]!.content).toContain('2 or 3 sentences');
  });

  it('reads a chapter and its keys, and counts failures', () => {
    const c = queueChapters(chatWith(5), 10, ids('ch'), NOW);
    expect(readChapter('<think>hm</think>Chapter 1: Ada sized Sam up at the booth and let him stay past two.\nKeys: booth, curfew, Ada Moss', c))
      .toEqual({ text: 'Ada sized Sam up at the booth and let him stay past two.', keys: ['booth', 'curfew'] });
    expect(readChapter('ok', c)).toBeNull();
    let failed = c;
    for (let i = 0; i < CHAPTER_TRIES; i += 1) failed = chapterWritten(failed, c.chapters[0]!.id, null, NOW);
    expect(failed.chapters[0]).toMatchObject({ state: 'failed', tries: CHAPTER_TRIES });
    expect(chaptersToWrite(failed)).toHaveLength(0);
    expect(chaptersToWrite(changeChapter(failed, c.chapters[0]!.id, 'redo', NOW))).toHaveLength(1);
  });

  it('marks a chapter out of date when its messages change, until it is edited or redone', () => {
    let c = queueChapters(chatWith(5), 10, ids('ch'), NOW);
    const id = c.chapters[0]!.id;
    c = chapterWritten(c, id, { text: 'Ada and Sam talked.', keys: [] }, NOW);
    expect(isStale(c, c.chapters[0]!)).toBe(false);
    c = editMessage(c, 'r2', 'Something else entirely.', 'Ada Moss', NOW + 1);
    expect(isStale(c, c.chapters[0]!)).toBe(true);
    c = changeChapter(c, id, { text: 'Ada and Sam talked; she changed her story.' }, NOW + 2);
    expect(isStale(c, c.chapters[0]!)).toBe(false);
  });

  it('sends the story so far above the chat, only for chapters wholly out of view', async () => {
    let c = queueChapters(chatWith(30), 20, ids('ch'), NOW);
    c = chapterWritten(c, c.chapters[0]!.id, { text: 'Ada let Sam into the booth after hours.', keys: ['booth'] }, NOW);
    expect(storySoFar(c, 20)).toContain('Chapter 1. Ada let Sam into the booth after hours.');
    expect(storySoFar(c, 10)).toBe('');
    const next = ids('w');
    let w: World = newWorld('w', 'Low Tide', 1);
    w = putRecord(w, { ...newRecord('character', 'ada', 'Ada Moss', next), sections: [{ id: 's1', title: 'Look', reach: 'here', keys: [], when: null, text: 'Broad shoulders.' }] }, 2);
    const options: BuildOptions = { model: 'glm-4-6', canPrefill: true, contextTokens: 3000, replyTokens: 300, nowMs: NOW, upTo: c.messages.length, continuing: false, firstBuild: false, dryRun: true, rngInt: (min) => min };
    const built = (await buildRequest({ ...c, windowStart: 20 }, w, options))!;
    expect(built.windowStart).toBeGreaterThanOrEqual(20);
    expect(built.messages[1]!.role).toBe('system');
    expect(built.messages[1]!.content).toContain('## The story so far');
    expect(built.parts.map((part) => part.label)).toContain('The story so far');
  });
});

describe('memory between chats', () => {
  it('lists the other chats with the same character that have something to carry', async () => {
    const { chatsToCarry } = await import('../chat/index.js');
    const one = { ...chatWith(2), id: 'one', updatedAt: 5 };
    const two = { ...chatWith(3), id: 'two', updatedAt: 9 };
    const other = { ...chatWith(2), id: 'other', characterId: 'someone' };
    const empty = { ...chatWith(0), id: 'empty' };
    const fresh = { ...chatWith(0), id: 'fresh' };
    expect(chatsToCarry(fresh, [one, two, other, empty, fresh]).map((chat) => chat.id)).toEqual(['two', 'one']);
  });

  it('brings journal, diary, feelings and the chapters with how it ended, once each', async () => {
    const { bringMemory, endingRequest, remember } = await import('../chat/index.js');
    let source = queueChapters(chatWith(30), 40, ids('ch'), NOW);
    source = chapterWritten(source, source.chapters[0]!.id, { text: 'Ada let Sam into the booth after hours.', keys: [] }, NOW);
    source = remember({ ...source, id: 'old', diary: [{ id: 'd1', name: 'The booth', content: 'I let him stay.', keys: ['booth'], at: 1 }] }, 'Sam drives nights.', 'j1', NOW);
    // How it ended: the messages after its chapters.
    const ending = endingRequest(source, 'usual')!;
    expect(ending[1]!.content).toContain("Ada's line 29.");
    expect(ending[1]!.content).not.toContain("Ada's line 1.");
    let fresh = { ...chatWith(0), id: 'new' };
    fresh = bringMemory(fresh, source, 'In the end Sam left before dawn.', ids('b'), NOW);
    expect(fresh.journal.map((entry) => entry.text)).toEqual(['Sam drives nights.']);
    expect(fresh.diary.map((entry) => entry.content)).toEqual(['I let him stay.']);
    expect(fresh.earlier).toHaveLength(1);
    expect(fresh.earlier[0]!.text).toBe('Ada let Sam into the booth after hours.\n\nIn the end Sam left before dawn.');
    expect(fresh.earlierAsked).toBe(true);
    // Not twice.
    const again = bringMemory(fresh, source, '', ids('c'), NOW);
    expect(again.journal).toHaveLength(1);
    expect(storySoFar(fresh, 0)).toContain('Before this chat, Ada Moss and Sam talked before:\n\nAda let Sam into the booth after hours.');
  });
});
