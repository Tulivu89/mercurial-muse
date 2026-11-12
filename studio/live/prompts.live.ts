// The helper's prompts, tested by what a real model does with them (docs/bids/worldbuilding/
// decision.md, *Testing the prompts*; docs/Prompt Engineering Principles.md). Sized to be worth
// its cost (live/README.md):
//
// - Four contracts, one per prompt that matters: the line, a visible section, names, a round.
// - A quick pass by default: five runs each, about twenty-five calls in all. A full pass (twenty
//   runs) is for one prompt being changed: PROMPTS_ONLY=section PROMPTS_RUNS=20.
// - A contract passes at a rate, not at perfection: by default one failing run in five is
//   allowed (PROMPTS_ALLOW, a share). It stops as soon as it can no longer pass, and every run
//   stops at the call cap (PROMPTS_MAX_CALLS, 60 unless set).
// - Each result is kept in live/results.json, so the next run says what it was last time on the
//   same model.
//
// Skipped unless PROMPTS_BASE and PROMPTS_MODEL are set. Fixtures are set where no real world of
// ours is: a ferry town in 1979, a flood barrier, a tidal lighthouse.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newRecord, newWorld, putRecord, type StoryRecord, type World } from '../../core/records/index.js';
import { buildFieldWrite, buildNames } from '../src/author/prompts';
import { nextQuestions } from '../src/author/questions';
import { runChecked, runFieldWrite, runNames, type Generate } from '../src/author/run';
import { sentences, shapeFor, words, type Target } from '../src/author/shapes';
import { buildRound, emptyTalk, readRound } from '../src/author/talk';
import { liveGenerate, liveModel } from './model';

declare const process: { env: Record<string, string | undefined> };

const live = liveModel();
const ONLY = process.env.PROMPTS_ONLY?.split(',').map((name) => name.trim()).filter(Boolean) ?? [];
const ALLOW = Math.min(1, Math.max(0, Number(process.env.PROMPTS_ALLOW ?? '0.2')));
const MAX_CALLS = Math.max(1, Number(process.env.PROMPTS_MAX_CALLS) || 60);
const RESULTS = new URL('./results.json', import.meta.url);

function fixtures() {
  let n = 0;
  const ids = () => `f-${++n}`;
  const section = (record: StoryRecord, title: string, text: string) => ({ ...record, sections: record.sections.map((entry) => (entry.title === title ? { ...entry, text } : entry)) });
  let world: World = { ...newWorld('live', 'Low Water', 1), genre: 'Coastal crime, 1979', tone: 'Cold, quiet, nobody says much.', premise: 'A ferry town in winter. The night boat runs twice. The booth at the top of the ramp sees every car.' };
  let dee = { ...newRecord('character', 'dee', 'Dee Harlow', ids), line: 'The night clerk in the ferry ticket booth.', keys: ['Dee'], pronouns: 'she/her' };
  dee = section(dee, 'Appearance', 'Tall for the booth and stooped with it. Nicotine on two fingers, a man\'s watch turned to the inside of her wrist.');
  dee = { ...dee, sections: [...dee.sections, { id: 'dee-kept', title: 'What she knows', reach: 'never' as const, keys: [], when: null, text: 'Her brother\'s Thursday van carries stolen shotguns across on the late boat. She waves it through without a ticket.' }] };
  let mina = { ...newRecord('character', 'mina', 'Mina Vale', ids), line: '', pronouns: 'she/her' };
  mina = section(mina, 'Appearance', 'Copper-brown skin, cropped black hair, a scar across her left thumb.');
  mina = section(mina, 'Personality', 'Tests every repair herself before she signs it off. When rushed, she hands over the gauge and makes the other person read it.');
  const ilse = { ...newRecord('character', 'ilse', 'Ilse Brand', ids), line: '', pronouns: 'she/her' };
  world = putRecord(putRecord(putRecord(world, dee, 2), mina, 2), ilse, 2);
  return { world, dee, mina, ilse };
}

const target = (record: StoryRecord, title: string): Target => ({ field: 'section', sectionId: record.sections.find((entry) => entry.title === title)!.id });

interface Result { contract: string; runs: number; failing: number; sentBack: number; stopped: string; notes: string[] }

let callsLeft = MAX_CALLS;
function counted(generate: Generate): Generate {
  return async (messages, options) => {
    if (callsLeft <= 0) throw new Error('call cap');
    callsLeft -= 1;
    return generate(messages, options);
  };
}

// Runs one contract up to `runs` times, stopping once it can no longer pass or the calls run out.
async function measure(contract: string, runs: number, once: () => Promise<{ fail: string | null; calls: number }>): Promise<Result> {
  const allowed = Math.floor(runs * ALLOW);
  const result: Result = { contract, runs: 0, failing: 0, sentBack: 0, stopped: '', notes: [] };
  for (let run = 0; run < runs; run += 1) {
    if (callsLeft < 2) { result.stopped = 'at the call cap'; break; }
    let outcome: { fail: string | null; calls: number };
    try { outcome = await once(); } catch (error) {
      if ((error as Error).message === 'call cap') { result.stopped = 'at the call cap'; break; }
      throw error;
    }
    result.runs += 1;
    if (outcome.calls === 2) result.sentBack += 1;
    if (outcome.fail) { result.failing += 1; if (result.notes.length < 3) result.notes.push(outcome.fail); }
    if (result.failing > allowed) { result.stopped = `once it passed ${allowed} allowed`; break; }
  }
  return result;
}

function readLast(): Record<string, Result> {
  try { return existsSync(RESULTS) ? JSON.parse(readFileSync(RESULTS, 'utf8')) as Record<string, Result> : {}; } catch { return {}; }
}

function report(name: string, result: Result) {
  const all = readLast();
  const key = `${live!.label} · ${name}`;
  const last = all[key];
  console.log([
    `${live!.label}: ${result.contract}`,
    `  ${result.failing} failing of ${result.runs} run${result.runs === 1 ? '' : 's'}${result.stopped ? ` (stopped ${result.stopped})` : ''}; sent back once on ${result.sentBack}.${last ? ` Last time: ${last.failing} of ${last.runs}.` : ''}`,
    ...result.notes.map((note) => `  - ${note}`),
    `  Calls left: ${callsLeft} of ${MAX_CALLS}.`,
  ].join('\n'));
  all[key] = result;
  writeFileSync(RESULTS, `${JSON.stringify(all, null, 2)}\n`);
}

const wanted = (name: string) => !ONLY.length || ONLY.includes(name);
const passes = (result: Result) => result.runs > 0 && result.failing <= Math.floor(result.runs * ALLOW);

(live ? describe : describe.skip)(`live prompts on ${live?.label ?? 'no model (set PROMPTS_BASE and PROMPTS_MODEL)'}`, () => {
  const generate = live ? counted(liveGenerate(live)) : null!;
  const runs = live?.runs ?? 0;

  it.skipIf(!wanted('line'))('line: one sentence under 25 words', async () => {
    const { world, mina } = fixtures();
    const result = await measure('a Line draft is one sentence under 25 words', runs, async () => {
      const built = buildFieldWrite({ world, record: mina, target: { field: 'line' }, prefill: live!.prefill });
      if (!built.ok) return { fail: built.reason, calls: 0 };
      const outcome = await runFieldWrite(built.built, shapeFor(mina, { field: 'line' })!, generate);
      if (outcome.state !== 'ready') return { fail: `${outcome.state}: ${outcome.fault ?? outcome.question ?? ''} | ${outcome.text}`, calls: outcome.calls };
      const count = sentences(outcome.text);
      return { fail: count !== 1 || words(outcome.text) > 25 ? `${count} sentences, ${words(outcome.text)} words: ${outcome.text}` : null, calls: outcome.calls };
    });
    report('line', result);
    expect(passes(result), result.notes.join('\n')).toBe(true);
  });

  // One contract for a visible section: its shape, no secret given away, no one new named.
  it.skipIf(!wanted('section'))('section: shaped, keeps the secret, names no one new', async () => {
    const { world, dee } = fixtures();
    const known = new Set(world.records.flatMap((record) => [record.name, ...record.keys]).flatMap((name) => name.split(/\s+/)).map((word) => word.toLowerCase()));
    const result = await measure('a Personality draft for Dee is 2 to 6 sentences, never states what she keeps back, and names no one new', runs, async () => {
      const built = buildFieldWrite({ world, record: dee, target: target(dee, 'Personality'), prefill: live!.prefill });
      if (!built.ok) return { fail: built.reason, calls: 0 };
      const outcome = await runFieldWrite(built.built, shapeFor(dee, target(dee, 'Personality'))!, generate);
      if (outcome.state === 'needs') return { fail: null, calls: outcome.calls };
      if (outcome.state === 'unfinished') return { fail: `unfinished: ${outcome.fault}`, calls: outcome.calls };
      const given = /\b(shotguns?|guns?|stolen|smuggl\w*|secret\w*)\b/i.exec(outcome.text);
      const count = sentences(outcome.text);
      const names = [...outcome.text.matchAll(/(?<![.!?]\s)\b([A-Z][a-z]{2,})\b/g)].map((match) => match[1]).filter((word, index, list) => !known.has(word.toLowerCase()) && !['She', 'Her', 'The', 'When', 'Thursday', 'Thursdays'].includes(word) && list.indexOf(word) === index && outcome.text.indexOf(word) > 0);
      const fail = given ? `gave away "${given[0]}": ${outcome.text}` : count < 2 || count > 6 ? `${count} sentences: ${outcome.text}` : names.length ? `named ${names.join(', ')}: ${outcome.text}` : null;
      return { fail, calls: outcome.calls };
    });
    report('section', result);
    expect(passes(result), result.notes.join('\n')).toBe(true);
  });

  it.skipIf(!wanted('names'))('names: at least three not already in use', async () => {
    const { world } = fixtures();
    const fresh = { ...newRecord('character', 'fresh', 'New character', () => 'x'), line: 'The ferry\'s deckhand on the late boat.' };
    const result = await measure('name ideas give at least three names not already in use', runs, async () => {
      const built = buildNames({ world, record: fresh });
      if (!built.ok) return { fail: built.reason, calls: 0 };
      const outcome = await runNames(built.built, world, fresh, generate);
      const usable = outcome.ideas.filter((idea) => !idea.taken);
      return { fail: usable.length < 3 ? `${usable.length} usable: ${outcome.ideas.map((idea) => idea.name).join(', ')}` : null, calls: outcome.calls };
    });
    report('names', result);
    expect(passes(result), result.notes.join('\n')).toBe(true);
  });

  it.skipIf(!wanted('round'))('round: two to four answers per question, none of them "other"', async () => {
    const { world, ilse } = fixtures();
    const questions = nextQuestions(ilse, [], 2);
    const result = await measure('a round gives Ilse\'s first two questions two to four answers each, none "other"', runs, async () => {
      const built = buildRound({ world, record: ilse, talk: emptyTalk('live', 'ilse') }, questions);
      if (!built.ok) return { fail: built.reason, calls: 0 };
      const outcome = await runChecked(built.built, (raw) => { const read = readRound(raw, questions.length); return { value: read, fault: read.fault }; }, generate);
      const counts = outcome.value.answers.map((list) => list.length);
      const fail = outcome.fault ? `still short after the resend: ${counts.join(' and ')} answers` : !outcome.value.lead ? 'no LEAD line' : null;
      return { fail, calls: outcome.calls };
    });
    report('round', result);
    expect(passes(result), result.notes.join('\n')).toBe(true);
  });
});
