// The W1 prompts, tested by what a real model does with them (docs/bids/worldbuilding/decision.md,
// *Testing the prompts*; docs/Prompt Engineering Principles.md). Each contract runs `runs` times
// (20 unless PROMPTS_RUNS says otherwise) at the temperature the Studio ships with, and the
// result is the count of failing runs. Fixtures are set where no real world of ours is: a ferry
// town in 1979, a flood barrier, a tidal lighthouse.
//
// Skipped unless PROMPTS_BASE and PROMPTS_MODEL are set. See live/README.md.
import { describe, expect, it } from 'vitest';
import { newRecord, newWorld, putRecord, type StoryRecord, type World } from '../../core/records/index.js';
import { buildFieldWrite, buildNames } from '../src/author/prompts';
import { runFieldWrite, runNames, type Outcome } from '../src/author/run';
import { sentences, shapeFor, words, type Target } from '../src/author/shapes';
import { liveGenerate, liveModel } from './model';

const live = liveModel();

function fixtures(): { world: World; dee: StoryRecord; mina: StoryRecord; ilse: StoryRecord } {
  let n = 0;
  const ids = () => `f-${++n}`;
  const section = (record: StoryRecord, title: string, text: string) => ({ ...record, sections: record.sections.map((entry) => (entry.title === title ? { ...entry, text } : entry)) });
  let world = { ...newWorld('live', 'Low Water', 1), genre: 'Coastal crime, 1979', tone: 'Cold, quiet, nobody says much.', premise: 'A ferry town in winter. The night boat runs twice. The booth at the top of the ramp sees every car.' };
  let dee = { ...newRecord('character', 'dee', 'Dee Harlow', ids), line: 'The night clerk in the ferry ticket booth.', keys: ['Dee'], pronouns: 'she/her' };
  dee = section(dee, 'Appearance', 'Tall for the booth and stooped with it. Nicotine on two fingers, a man\'s watch turned to the inside of her wrist.');
  dee = { ...dee, sections: [...dee.sections, { id: 'dee-kept', title: 'What she knows', reach: 'never' as const, keys: [], when: null, text: 'Her brother\'s Thursday van carries stolen shotguns across on the late boat. She waves it through without a ticket.' }] };
  let mina = { ...newRecord('character', 'mina', 'Mina Vale', ids), line: 'Pump mechanic at the flood barrier.', pronouns: 'she/her' };
  mina = section(mina, 'Appearance', 'Copper-brown skin, cropped black hair, a scar across her left thumb.');
  mina = section(mina, 'Personality', 'Tests every repair herself before she signs it off. When rushed, she hands over the gauge and makes the other person read it.');
  let ilse = { ...newRecord('character', 'ilse', 'Ilse Brand', ids), line: '', pronouns: 'she/her' };
  ilse = section(ilse, 'Background', 'Keeps the light on a tidal island off a northern coast, as her father did.');
  world = putRecord(putRecord(putRecord(world, dee, 2), mina, 2), ilse, 2);
  return { world, dee, mina, ilse };
}

const target = (record: StoryRecord, title: string): Target => ({ field: 'section', sectionId: record.sections.find((entry) => entry.title === title)!.id });

interface Tally { failing: number; sentBack: number; needs: number; notes: string[] }

async function repeat(runs: number, once: () => Promise<{ fail: string | null; outcome?: Outcome }>): Promise<Tally> {
  const tally: Tally = { failing: 0, sentBack: 0, needs: 0, notes: [] };
  for (let run = 0; run < runs; run += 1) {
    const { fail, outcome } = await once();
    if (outcome?.calls === 2) tally.sentBack += 1;
    if (outcome?.state === 'needs') tally.needs += 1;
    if (fail) { tally.failing += 1; if (tally.notes.length < 5) tally.notes.push(fail); }
  }
  return tally;
}

function report(contract: string, runs: number, tally: Tally) {
  console.log([
    `${live!.label}: ${contract}`,
    `  ${tally.failing} failing runs of ${runs}; sent back once on ${tally.sentBack}; asked a question on ${tally.needs}.`,
    ...tally.notes.map((note) => `  - ${note}`),
  ].join('\n'));
}

(live ? describe : describe.skip)(`live prompts on ${live?.label ?? 'no model (set PROMPTS_BASE and PROMPTS_MODEL)'}`, () => {
  const generate = live ? liveGenerate(live) : null!;
  const runs = live?.runs ?? 0;

  it('a Line draft is one sentence under 25 words', async () => {
    const { world, mina } = fixtures();
    const contract = 'a Line draft is one sentence under 25 words';
    const tally = await repeat(runs, async () => {
      const built = buildFieldWrite({ world, record: mina, target: { field: 'line' }, prefill: live!.prefill });
      if (!built.ok) return { fail: built.reason };
      const outcome = await runFieldWrite(built.built, shapeFor(mina, { field: 'line' })!, generate);
      if (outcome.state !== 'ready') return { fail: `${outcome.state}: ${outcome.fault ?? outcome.question ?? ''} | ${outcome.text}`, outcome };
      const count = sentences(outcome.text);
      return { fail: count !== 1 || words(outcome.text) > 25 ? `${count} sentences, ${words(outcome.text)} words: ${outcome.text}` : null, outcome };
    });
    report(contract, runs, tally);
    expect(tally.failing, contract).toBe(0);
  });

  it('a visible section written from a record with a secret never states the secret', async () => {
    const { world, dee } = fixtures();
    const contract = 'a Personality draft for Dee never states what she keeps back (guns, stolen, secret)';
    const tally = await repeat(runs, async () => {
      const built = buildFieldWrite({ world, record: dee, target: target(dee, 'Personality'), prefill: live!.prefill });
      if (!built.ok) return { fail: built.reason };
      const outcome = await runFieldWrite(built.built, shapeFor(dee, target(dee, 'Personality'))!, generate);
      if (outcome.state === 'needs') return { fail: null, outcome };
      const given = /\b(shotguns?|guns?|stolen|smuggl\w*|secret\w*)\b/i.exec(outcome.text);
      return { fail: given ? `said "${given[0]}": ${outcome.text}` : outcome.state === 'unfinished' ? `unfinished: ${outcome.fault}` : null, outcome };
    });
    report(contract, runs, tally);
    expect(tally.failing, contract).toBe(0);
  });

  it('a Here section draft is two to six sentences and names no one the record does not', async () => {
    const { world, ilse } = fixtures();
    const contract = 'an Appearance draft for Ilse is two to six sentences and names no new person or place';
    const known = new Set(world.records.flatMap((record) => [record.name, ...record.keys]).flatMap((name) => name.split(/\s+/)).map((word) => word.toLowerCase()));
    const tally = await repeat(runs, async () => {
      const built = buildFieldWrite({ world, record: ilse, target: target(ilse, 'Appearance'), prefill: live!.prefill });
      if (!built.ok) return { fail: built.reason };
      const outcome = await runFieldWrite(built.built, shapeFor(ilse, target(ilse, 'Appearance'))!, generate);
      if (outcome.state !== 'ready') return { fail: outcome.state === 'needs' ? null : `unfinished: ${outcome.fault}`, outcome };
      const count = sentences(outcome.text);
      // A capitalised word that doesn't start a sentence and isn't a name the world already has.
      const names = [...outcome.text.matchAll(/(?<![.!?]\s|^)\b([A-Z][a-z]{2,})\b/g)].map((match) => match[1]).filter((word) => !known.has(word.toLowerCase()) && !['She', 'Her', 'Hers', 'The', 'Ilse'].includes(word));
      const fail = count < 2 || count > 6 ? `${count} sentences: ${outcome.text}` : names.length ? `names ${names.join(', ')}: ${outcome.text}` : null;
      return { fail, outcome };
    });
    report(contract, runs, tally);
    expect(tally.failing, contract).toBe(0);
  });

  it('name ideas give at least three names not already in use', async () => {
    const { world } = fixtures();
    const fresh = { ...newRecord('character', 'fresh', 'New character', () => 'x'), line: 'The ferry\'s deckhand on the late boat.' };
    const contract = 'name ideas give at least three names not already in use';
    const tally = await repeat(runs, async () => {
      const built = buildNames({ world, record: fresh });
      if (!built.ok) return { fail: built.reason };
      const outcome = await runNames(built.built, world, fresh, generate);
      const usable = outcome.ideas.filter((idea) => !idea.taken);
      return { fail: usable.length < 3 ? `${usable.length} usable: ${outcome.ideas.map((idea) => idea.name).join(', ')}` : null, outcome: { state: 'ready', text: '', calls: outcome.calls, model: outcome.model, sent: [] } };
    });
    report(contract, runs, tally);
    expect(tally.failing, contract).toBe(0);
  });
});
