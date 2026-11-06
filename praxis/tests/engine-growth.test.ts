import { describe, expect, it } from 'vitest';
import {
  act, chargesOf, grow, growthFor, parseSave, placeCharacter, planCheck, read, setState, settleCheck, startSave, stateDefFor, undoLastTurn, say,
  type Save, type Target,
} from '../src/engine';
import { abernys } from './abernys';

const module = abernys();
const always = (x: number) => () => x;

function must<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error((result as unknown as { reason: string }).reason);
  return result as Extract<T, { ok: true }>;
}

const value = (save: Save, defId: string, owner: string) => read(save.values, stateDefFor(module, defId, owner)!, owner);
const xp = (save: Save) => value(save, 'experience', 'traveller');

// A constant roll that makes this check come out the way the test needs.
function rollFor(save: Save, target: Target, approach: string, succeed: boolean, charge = 0): () => number {
  for (let step = 0; step < 100; step += 1) {
    const random = always(step / 100);
    const settled = settleCheck(module, save, target, { approach, charge }, random);
    if (settled.ok && settled.outcome.record.succeeded === succeed && !settled.outcome.record.triumph && !settled.outcome.record.despair) return random;
  }
  throw new Error('No roll found.');
}

const check = (save: Save, id: string, target: Target, approach: string, succeed: boolean) =>
  must(act(module, save, id, { type: 'check', target, choice: { approach, charge: 0 }, input: 'I try.', random: rollFor(save, target, approach, succeed) }));

describe('experience', () => {
  it('comes from overcoming someone the first time, by tier, and never from settling by hand', () => {
    const start = startSave(module);
    expect(xp(start)).toBe(0);
    const guard: Target = { owner: 'gate-guard', defId: 'health' };
    const down = check(start, 't1', guard, 'force', true);
    expect(xp(down.save)).toBe(1);
    expect(down.save.earned).toEqual(['overcome:gate-guard:health']);
    expect(down.turn.directive).not.toMatch(/xperience/);
    // Brought back up and beaten again: nothing more.
    const again = must(setState(module, down.save, 'health', 'gate-guard', 1)).save;
    expect(xp(check(again, 't2', guard, 'force', true).save)).toBe(1);
    // A rival is worth four.
    let save = start;
    const arbiter: Target = { owner: 'gate-arbiter', defId: 'strain' };
    save = must(setState(module, save, 'strain', 'gate-arbiter', 1)).save;
    expect(xp(check(save, 't1', arbiter, 'flair', true).save)).toBe(4);
    // Letting it succeed is the player's choice, not a deed.
    const byHand = must(act(module, start, 't1', { type: 'check', target: guard, choice: { approach: 'force', charge: 0 }, input: 'I win.', random: null })).save;
    expect(xp(byHand)).toBe(0);
  });

  it('teaches a lesson for failing against a rival, once a scene', () => {
    const start = startSave(module);
    const arbiter: Target = { owner: 'gate-arbiter', defId: 'strain' };
    const once = check(start, 't1', arbiter, 'flair', false).save;
    expect(xp(once)).toBe(1);
    expect(xp(check(once, 't2', arbiter, 'flair', false).save)).toBe(1);
    // Failing against a minion teaches nothing.
    expect(xp(check(start, 't1', { owner: 'gate-guard', defId: 'strain' }, 'flair', false).save)).toBe(0);
    // A new scene: leave and come back.
    const out = must(act(module, once, 't2', { type: 'travel', to: 'pc-outside-walls' })).save;
    const back = must(act(module, out, 't3', { type: 'travel', to: 'pc-landward-gate' })).save;
    expect(xp(check(back, 't4', arbiter, 'flair', false).save)).toBe(2);
  });

  it('comes from obstacles by difficulty, gangs by their number, and milestones', () => {
    const atRegistry = must(placeCharacter(module, startSave(module), 'traveller', 'pc-registry')).save;
    const door: Target = { owner: 'registry-strongroom', defId: 'security' };
    const opened = must(setState(module, atRegistry, 'security', 'registry-strongroom', 1)).save;
    expect(xp(check(opened, 't1', door, 'finesse', true).save)).toBe(2);
    // Three dock toughs are one target worth three minions.
    const harbour = must(placeCharacter(module, startSave(module), 'traveller', 'pc-harbour')).save;
    const toughs: Target = { owner: 'dock-toughs', defId: 'health' };
    expect(stateDefFor(module, 'health', 'dock-toughs')!.max).toBe(3);
    const plan = must(planCheck(module, harbour, toughs, { approach: 'force', charge: 0 }));
    expect(plan.difficulty.base).toBe(3);
    const beaten = must(setState(module, harbour, 'health', 'dock-toughs', 1)).save;
    expect(xp(check(beaten, 't1', toughs, 'force', true).save)).toBe(3);
    // Signing the Covenant is a milestone.
    const signed = must(act(module, startSave(module), 't1', { type: 'scene', actionId: 'sign-the-covenant' }));
    expect(xp(signed.save)).toBe(5);
    expect(signed.turn.directive).not.toMatch(/xperience/);
  });
});

describe('spending experience', () => {
  it('raises a rating at ten times the new rating and climbs a ladder at five times the new charge', () => {
    let save = must(setState(module, startSave(module), 'experience', 'traveller', 70)).save;
    const view = growthFor(module, save)!;
    expect(view.steps.find((step) => step.approach === 'flair')).toMatchObject({ rating: 3, raise: { to: 4, cost: 40 }, training: 'trained', train: { to: 'expert', cost: 20 } });
    expect(view.steps.find((step) => step.approach === 'focus')).toMatchObject({ rating: 1, raise: { to: 2, cost: 20 }, training: 'raw', train: { to: 'practiced', cost: 10 } });
    save = must(grow(module, save, 'flair', 'ladder')).save;
    expect(xp(save)).toBe(50);
    expect(chargesOf(module, save, 'traveller').find((entry) => entry.approach === 'flair')).toMatchObject({ training: 'expert', slots: [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }] });
    expect(save.ledger.at(-1)).toMatchObject({ kind: 'grow', approach: 'flair', from: 'trained', to: 'expert', source: 'rule' });
    save = must(grow(module, save, 'flair', 'rating')).save;
    expect(value(save, 'flair', 'traveller')).toBe(4);
    expect(xp(save)).toBe(10);
    expect(grow(module, save, 'flair', 'rating')).toEqual({ ok: false, reason: 'Flair is as high as it goes.' });
    expect(grow(module, save, 'force', 'ladder')).toEqual({ ok: false, reason: 'That takes 15 experience. You have 10.' });
    // Flair 4 with a +4 charge rolls four dice, all upgraded.
    const plan = must(planCheck(module, save, { owner: 'gate-arbiter', defId: 'strain' }, { approach: 'flair', charge: 4 }));
    expect(plan.pool.good.filter((die) => die.startsWith('pro')).length).toBe(4);
  });

  it('is undone with the turn before it and survives a save file', () => {
    const turned = must(say(module, must(setState(module, startSave(module), 'experience', 'traveller', 20)).save, 't1', 'I look around.')).save;
    const grown = must(grow(module, turned, 'force', 'ladder')).save;
    expect(grown.ladders).toEqual({ traveller: { force: 'trained' } });
    expect(must(undoLastTurn(grown)).save.ladders).toEqual({});
    const reread = parseSave(module, JSON.parse(JSON.stringify(grown)));
    expect(reread.ok && reread.save.ladders).toEqual({ traveller: { force: 'trained' } });
  });
});

describe('challenge', () => {
  it('upgrades difficulty dice by rank', () => {
    const save = must(placeCharacter(module, startSave(module), 'traveller', 'aurochs-downs')).save;
    const plan = must(planCheck(module, save, { owner: 'brond', defId: 'strain' }, { approach: 'flair', charge: 0 }));
    expect(plan.pool.bad).toEqual(['challenge', 'difficulty', 'difficulty']);
    expect(plan.reasons).toContain('Rank 1: one difficulty die upgraded');
  });

  it('gives every approach one lane onto another\'s ground, at a setback and the owner\'s cost', () => {
    const save = startSave(module);
    const stab = must(planCheck(module, save, { owner: 'gate-guard', defId: 'health' }, { approach: 'finesse', charge: 0 }));
    expect(stab.claim).toBe('secondary');
    expect(stab.pool.bad).toContain('setback');
    expect(stab.stakes.failure.join(' ')).toMatch(/Health/);
    const story = must(planCheck(module, save, { owner: 'pc-landward-gate', defId: 'alert' }, { approach: 'flair', charge: 0 }));
    expect(story.claim).toBe('secondary');
  });
});
