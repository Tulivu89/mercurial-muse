// W2's reading code against canned replies: rounds, talk turns, Settled, questions, and the
// talks file. These test the code, not the prompts (studio/live/ tests the prompts).
import { beforeEach, describe, expect, it } from 'vitest';
import { newRecord, newWorld, putRecord } from '../../core/records/index.js';
import { buildFieldWrite } from '../src/author/prompts';
import { DEFAULT_QUESTIONS, nextQuestions, roundSize } from '../src/author/questions';
import { runChecked, type Generate } from '../src/author/run';
import { exportTalks, forgetDraftsInMemory, importTalks, putTalk } from '../src/author/store';
import { buildRound, buildTalkTurn, emptyTalk, readRound, readTalk, recentTalk, settledFrom, type Talk } from '../src/author/talk';

function setup() {
  let n = 0;
  const ids = () => `s-${++n}`;
  const dee = { ...newRecord('character', 'dee', 'Dee Harlow', ids), line: '' };
  const world = putRecord({ ...newWorld('w', 'Low Water', 1), genre: 'Coastal crime' }, dee, 2);
  return { world, dee: world.records[0] };
}

const ROUND = [
  'READING: Nothing written but her job.',
  'LEAD: Two things, then we write.',
  '### 1',
  '- Keeps the roll under her palm | makes them ask twice',
  '- Tears the wrong ticket | on purpose, and waits',
  '- Other | anything else',
  '### 2',
  '- Her brother\'s van | every Thursday, no ticket',
  '* Nobody, ever',
  '- Off-duty police | and she hates it',
].join('\n');

describe('questions', () => {
  it('asks what is on and still empty, in order, as many as the window allows', () => {
    const { dee } = setup();
    expect(nextQuestions(dee, [], 2).map((question) => question.id)).toEqual(['c-stranger', 'c-notice']);
    expect(nextQuestions(dee, ['c-stranger'], 1).map((question) => question.id)).toEqual(['c-notice']);
    const written = { ...dee, line: 'The night clerk.' };
    expect(nextQuestions(written, [], 1)[0].id).toBe('c-notice');
    expect(DEFAULT_QUESTIONS.thread.map((question) => question.feeds)).toEqual(['Pressure', 'Objective', 'Opposition', 'Cost', 'Consequence', 'Next beat']);
    expect([roundSize(8000), roundSize(16000), roundSize(32000)]).toEqual([1, 2, 3]);
  });
});

describe('a round', () => {
  it('reads answers under their numbers, past bullets and missing bars, and drops "other"', () => {
    const read = readRound(ROUND, 2);
    expect(read.reading).toBe('Nothing written but her job.');
    expect(read.lead).toBe('Two things, then we write.');
    expect(read.answers[0]).toEqual([{ text: 'Keeps the roll under her palm', note: 'makes them ask twice' }, { text: 'Tears the wrong ticket', note: 'on purpose, and waits' }]);
    expect(read.answers[1].map((answer) => answer.text)).toEqual(['Her brother\'s van', 'Nobody, ever', 'Off-duty police']);
    expect(read.fault).toBeNull();
  });

  it('sends a round back once when a question came back with too few answers', async () => {
    let calls = 0;
    const replies = ['### 1\n- Only one | answer', ROUND];
    const generate: Generate = async () => ({ text: replies[calls++], model: 'canned' });
    const { world, dee } = setup();
    const built = buildRound({ world, record: dee, talk: emptyTalk('w', 'dee') }, nextQuestions(dee, [], 2));
    if (!built.ok) throw new Error(built.reason);
    const result = await runChecked(built.built, (raw) => { const read = readRound(raw, 2); return { value: read, fault: read.fault }; }, generate);
    expect(result.calls).toBe(2);
    expect(result.sent.at(-1)!.content).toMatch(/^Questions 1 and 2 had fewer than two answers/);
    expect(result.value.answers[1]).toHaveLength(3);
  });

  it('asks the Studio\'s questions in the author\'s words, and says what was passed over', () => {
    const { world, dee } = setup();
    const questions = nextQuestions(dee, [], 1);
    const built = buildRound({ world, record: dee, talk: emptyTalk('w', 'dee'), plain: true }, questions, { 'c-stranger': ['The night clerk'] });
    if (!built.ok) throw new Error(built.reason);
    expect(built.built.messages[0].content).toMatch(/^You are the helper in Inkwyrm's Studio/);
    expect(built.built.messages[1].content).toContain('Questions:\n1. Who are they to a stranger, in one sentence?');
    expect(built.built.messages[1].content).toContain('Don\'t offer these again for 1: The night clerk');
  });

  it('settles a pick in the question\'s words and the answer\'s', () => {
    expect(settledFrom('Who would they lie for?', { text: 'Her brother', note: 'every Thursday' })).toBe('Who would they lie for: Her brother (every Thursday)');
  });
});

describe('a talk turn', () => {
  it('alternates the talk, newest kept, with the record and Settled in front', () => {
    const { world, dee } = setup();
    const talk: Talk = { ...emptyTalk('w', 'dee'), settled: [{ id: '1', text: 'She makes drivers ask twice.' }], turns: [
      { id: 'a', from: 'author', text: 'She works nights.', at: 1 },
      { id: 'b', from: 'errata', text: 'Who does she let through?', at: 2 },
    ] };
    const built = buildTalkTurn({ world, record: dee, talk }, 'Her brother.');
    if (!built.ok) throw new Error(built.reason);
    const roles = built.built.messages.map((message) => message.role);
    expect(roles).toEqual(['system', 'user', 'assistant', 'user']);
    expect(built.built.messages[1].content).toContain('Settled:\n- She makes drivers ask twice.');
    expect(built.built.messages[1].content.endsWith('She works nights.')).toBe(true);
    expect(built.built.messages[3].content).toBe('Her brother.');
    expect(built.built.messages[0].content).toMatch(/^You are Errata/);
  });

  it('keeps Settled lines out of the reply and offers them', () => {
    expect(readTalk('Good. That\'s her.\nSettled: She waves her brother\'s van through on Thursdays.\n- Settled: She never looks in the back.'))
      .toEqual({ text: 'Good. That\'s her.', offers: ['She waves her brother\'s van through on Thursdays.', 'She never looks in the back.'] });
  });

  it('gives a field write the recent talk only when the window has room', () => {
    const { world, dee } = setup();
    const talk = { ...emptyTalk('w', 'dee'), turns: [{ id: 'a', from: 'author' as const, text: 'She makes them ask twice.', at: 1 }] };
    const wide = buildFieldWrite({ world, record: dee, target: { field: 'line' }, prefill: false, window: 32000, settled: ['She works nights.'], talk: recentTalk(talk, 2000) });
    const small = buildFieldWrite({ world, record: dee, target: { field: 'line' }, prefill: false, window: 8000, settled: ['She works nights.'], talk: recentTalk(talk, 2000) });
    expect(wide.ok && wide.built.messages[1].content).toContain('The talk so far:\nAuthor: She makes them ask twice.');
    expect(small.ok && small.built.messages[1].content).not.toContain('The talk so far');
    expect(small.ok && small.built.messages[1].content).toContain('Settled:\nShe works nights.');
  });
});

describe('the talks file', () => {
  beforeEach(forgetDraftsInMemory);

  it('saves a world\'s talks and brings them back beside the same world, keeping what is there', async () => {
    const talk = { ...emptyTalk('w', 'dee'), settled: [{ id: '1', text: 'Nights.' }], updatedAt: 5 };
    await putTalk(talk);
    const file = await exportTalks('w', 'Low Water');
    expect(file).toMatchObject({ format: 'inkwyrm-talks/1', worldId: 'w', talks: [talk], drafts: [] });
    expect(await importTalks(file, 'w')).toEqual({ ok: true, talks: 0, drafts: 0 });
    forgetDraftsInMemory();
    expect(await importTalks(file, 'w')).toEqual({ ok: true, talks: 1, drafts: 0 });
    expect(await importTalks(file, 'other')).toMatchObject({ ok: false });
    expect(await importTalks({ format: 'studio-world/1' }, 'w')).toMatchObject({ ok: false, reason: 'This is not a talks file from the Studio.' });
  });
});
