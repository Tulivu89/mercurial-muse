import { describe, expect, it } from 'vitest';
import {
  abandonWork, act, contextPlan, undoLastTurn, makeables, parseSave, planCheck, read, say, setState, settleCheck, startSave, startWork, stateDefFor, subjectsHere, worksOf,
  type Save, type Target,
} from '../src/engine';
import { abernys } from './abernys';

const module = abernys();
const always = (x: number) => () => x;

function must<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error((result as unknown as { reason: string }).reason);
  return result as Extract<T, { ok: true }>;
}

const coin = (save: Save) => read(save.values, stateDefFor(module, 'coin', 'traveller')!, 'traveller');

function rollFor(save: Save, target: Target, succeed: boolean, despair = false): () => number {
  for (let step = 0; step < 100; step += 1) {
    const random = always(step / 100);
    const settled = settleCheck(module, save, target, { approach: 'focus', charge: 0 }, random);
    if (settled.ok && settled.outcome.record.succeeded === succeed && !settled.outcome.record.triumph && settled.outcome.record.despair === despair) return random;
  }
  throw new Error('No roll found.');
}

describe('making things', () => {
  it('knows what each thing takes: materials at half its worth, a track and time by its step', () => {
    const by = (id: string) => makeables(module).find((entry) => entry.good.id === id)!;
    expect(by('knife')).toMatchObject({ materials: 1, track: 1, minutes: 60, difficulty: 2 });
    expect(by('sword')).toMatchObject({ materials: 5, track: 2, minutes: 720 });
    expect(by('plate')).toMatchObject({ materials: 50, track: 3, minutes: 1440 });
    expect(by('forged-writ')).toMatchObject({ difficulty: 3 });
  });

  it('pays for materials up front, builds with Focus over time, and puts the thing in your pack', () => {
    let save = must(startWork(module, startSave(module), 'sword')).save;
    expect(coin(save)).toBe(35);
    expect(save.works).toEqual(['sword']);
    expect(startWork(module, save, 'sword')).toEqual({ ok: false, reason: 'You are already making a sword.' });
    const work: Target = { owner: 'work:sword', defId: 'progress' };
    expect(subjectsHere(module, save).find((entry) => entry.id === 'work:sword')).toMatchObject({ kind: 'work', name: 'The sword you are making' });
    expect(must(planCheck(module, save, work, { approach: 'focus', charge: 0 })).difficulty.base).toBe(2);
    expect(contextPlan(module, must(say(module, save, 't0', 'I look at the iron.')).save).messages[1]!.content).toContain('You are making a sword.');
    // Each check takes half a day.
    const start = save.clock;
    const first = must(act(module, save, 't1', { type: 'check', target: work, choice: { approach: 'focus', charge: 0 }, input: 'I work the blade.', random: rollFor(save, work, true) }));
    save = first.save;
    expect(save.clock - start).toBeGreaterThan(719);
    if (save.works.length) {
      expect(first.turn.directive).toMatch(/^It works\.\nThe sword you are making is (under way|half done)\./);
      save = must(act(module, save, 't2', { type: 'check', target: work, choice: { approach: 'focus', charge: 0 }, input: 'I finish it.', random: rollFor(save, work, true) })).save;
    }
    expect(save.works).toEqual([]);
    expect(save.pack.sword).toBe(1);
    expect(save.ledger.some((entry) => entry.kind === 'work' && entry.event === 'finish')).toBe(true);
    expect(read(save.values, stateDefFor(module, 'progress', 'work:sword')!, 'work:sword')).toBe(0);
    // No experience for making things.
    expect(read(save.values, stateDefFor(module, 'experience', 'traveller')!, 'traveller')).toBe(0);
  });

  it('takes as long again on a failure, loses it all on a despair, and can be given up', () => {
    const save = must(startWork(module, startSave(module), 'forged-writ')).save;
    const work: Target = { owner: 'work:forged-writ', defId: 'progress' };
    const failed = must(act(module, save, 't1', { type: 'check', target: work, choice: { approach: 'focus', charge: 0 }, input: 'I copy the seal.', random: rollFor(save, work, false) }));
    expect(failed.save.clock - save.clock).toBe(2 * 720);
    expect(failed.turn.directive).toMatch(/^It fails, and the work goes no further\./);
    // A despair needs a red die: here the rules spend their Story Point.
    const ruled = must(setState(module, save, 'story-points', 'traveller', 0)).save;
    const spoiled = must(act(module, ruled, 't1', { type: 'check', target: work, choice: { approach: 'focus', charge: 0 }, input: 'I copy the seal.', random: rollFor(ruled, work, false, true) }));
    expect(spoiled.save.works).toEqual([]);
    expect(spoiled.turn.directive).toContain('The materials are spoiled, and the work is lost.');
    const dropped = must(abandonWork(module, save, 'forged-writ')).save;
    expect(dropped.works).toEqual([]);
    expect(coin(dropped)).toBe(35);
    expect(startWork(module, must(setState(module, startSave(module), 'coin', 'traveller', 2)).save, 'sword')).toEqual({ ok: false, reason: 'The materials cost 5 coin. You have 2.' });
  });

  it('survives the save file and undo', () => {
    const turned = must(say(module, startSave(module), 't1', 'I set up a bench.')).save;
    const begun = must(startWork(module, turned, 'knife')).save;
    expect(worksOf(module, begun).map((work) => work.id)).toEqual(['work:knife']);
    const reread = parseSave(module, JSON.parse(JSON.stringify(begun)));
    expect(reread.ok && reread.save.works).toEqual(['knife']);
    expect(must(undoLastTurn(begun)).save.works).toEqual([]);
  });
});
