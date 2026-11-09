import { describe, expect, it } from 'vitest';
import {
  act, actsOn, calendarOf, contextPlan, followRuleFor, loadModule, parseSave, placeCharacter, planCheck, read, sceneActionsFor, setClock, setState, settleCheck,
  stallsHere, startSave, stateDefFor, subjectsHere, weekdayOf, say,
  type PraxisModule, type Save, type Target,
} from '../src/engine';
import { abernys, abernysRaw } from './abernys';

const module = abernys();
const always = (x: number) => () => x;

function must<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error((result as unknown as { reason: string }).reason);
  return result as Extract<T, { ok: true }>;
}

const value = (save: Save, defId: string, owner: string, world: PraxisModule = module) => read(save.values, stateDefFor(world, defId, owner)!, owner);
const coin = (save: Save) => value(save, 'coin', 'traveller');
const at = (placeId: string, save = startSave(module)) => must(placeCharacter(module, save, 'traveller', placeId)).save;

function rollFor(save: Save, target: Target, approach: string, succeed: boolean, world: PraxisModule = module): () => number {
  for (let step = 0; step < 100; step += 1) {
    const random = always(step / 100);
    const settled = settleCheck(world, save, target, { approach, charge: 0 }, random);
    if (settled.ok && settled.outcome.record.succeeded === succeed && !settled.outcome.record.triumph && !settled.outcome.record.despair) return random;
  }
  throw new Error('No roll found.');
}

function withRaw(change: (raw: Record<string, any>) => void): PraxisModule {
  const raw = structuredClone(abernysRaw) as Record<string, any>;
  change(raw);
  const loaded = loadModule(raw);
  if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
  return loaded.module;
}

describe('buying and selling', () => {
  it('buys from someone here at the price, as a turn the rules settle', () => {
    const save = at('pc-tarred-rope');
    expect(coin(save)).toBe(40);
    expect(save.pack).toEqual({ knife: 1 });
    const stall = stallsHere(module, save).find((entry) => entry.seller.id === 'pell')!;
    expect(stall.goods.map((entry) => [entry.good.id, entry.price])).toEqual([['poultice', 1], ['tonic', 1], ['smoke-pot', 1]]);
    const bought = must(act(module, save, 't1', { type: 'buy', from: 'pell', goodId: 'poultice' }));
    expect(coin(bought.save)).toBe(39);
    expect(bought.save.pack).toEqual({ knife: 1, poultice: 1 });
    expect(bought.save.ledger.some((entry) => entry.kind === 'goods' && entry.goodId === 'poultice' && entry.from === 0 && entry.to === 1 && entry.source === 'rule')).toBe(true);
    expect(bought.turn.input).toBe('I buy a poultice from Pell.');
    expect(bought.turn.directive).toBe('You pay Pell 1 coin and get a poultice.');
    // Selling back: full worth for what they sell, half (rounded down) for anything else.
    const sold = must(act(module, bought.save, 't2', { type: 'sell', to: 'pell', goodId: 'poultice' }));
    expect(coin(sold.save)).toBe(40);
    const knife = must(act(module, bought.save, 't2', { type: 'sell', to: 'pell', goodId: 'knife' }));
    expect(knife.turn.directive).toBe('Pell takes a knife off your hands for nothing.');
    expect(act(module, at('pc-landward-gate'), 't1', { type: 'buy', from: 'pell', goodId: 'poultice' })).toEqual({ ok: false, reason: 'They are not here to sell to you.' });
  });

  it('haggles with Flair on sellers only, a quarter off a point, spent on the purchase', () => {
    const world = withRaw((raw) => { raw.characters.find((c: { id: string }) => c.id === 'pell').sells.push('sword'); });
    const save = must(placeCharacter(world, startSave(world), 'traveller', 'pc-tarred-rope')).save;
    const flair = (id: string) => actsOn(world, save, subjectsHere(world, save).find((entry) => entry.id === id)!).find((entry) => entry.approach.id === 'flair')!.acts.map((entry) => (entry.kind === 'state' ? entry.def.id : 'deed'));
    expect(flair('pell')).toEqual(['strain', 'bargain']);
    expect(flair('garrick-hale')).toEqual(['strain']);
    const haggle: Target = { owner: 'pell', defId: 'bargain' };
    const struck = must(act(world, save, 't1', { type: 'check', target: haggle, choice: { approach: 'flair', charge: 0 }, input: 'Ten for the sword is robbery.', random: rollFor(save, haggle, 'flair', true, world) }));
    const points = value(struck.save, 'bargain', 'pell', world);
    expect(points).toBeGreaterThan(0);
    expect(struck.turn.directive).toMatch(/Pell will give you (a quarter|half) off your next purchase\./);
    const price = points === 1 ? 8 : 5;
    expect(stallsHere(world, struck.save).find((entry) => entry.seller.id === 'pell')!.goods.find((entry) => entry.good.id === 'sword')!.price).toBe(price);
    const bought = must(act(world, struck.save, 't2', { type: 'buy', from: 'pell', goodId: 'sword' }));
    expect(coin(bought.save)).toBe(40 - price);
    expect(value(bought.save, 'bargain', 'pell', world)).toBe(0);
  });

  it('refuses for the rest of the day after a haggle goes badly', () => {
    const save = must(setState(module, at('pc-tarred-rope'), 'refusing', 'pell', 1)).save;
    expect(act(module, save, 't1', { type: 'buy', from: 'pell', goodId: 'tonic' })).toEqual({ ok: false, reason: "Pell won't deal with you today." });
    const nextDay = must(act(module, save, 't1', { type: 'wait', minutes: 1440 })).save;
    expect(value(nextDay, 'refusing', 'pell')).toBe(0);
  });
});

describe('what you carry', () => {
  it('adds harm with a weapon, help where it fits, and hindrance from plate', () => {
    const save = startSave(module);
    const hit = must(planCheck(module, save, { owner: 'gate-guard', defId: 'health' }, { approach: 'force', charge: 0 }));
    expect(hit.harm).toBe(1);
    expect(hit.reasons).toContain('A knife: 1 more harm on a success');
    const armed = { ...save, pack: { knife: 1, sword: 1 } };
    expect(must(planCheck(module, armed, { owner: 'gate-guard', defId: 'health' }, { approach: 'force', charge: 0 })).harm).toBe(2);
    expect(must(planCheck(module, armed, { owner: 'gate-guard', defId: 'strain' }, { approach: 'force', charge: 0 })).harm).toBe(0);
    const writ = { ...save, pack: { 'forged-writ': 1 } };
    expect(must(planCheck(module, writ, { owner: 'gate-arbiter', defId: 'strain' }, { approach: 'flair', charge: 0 })).reasons).toContain('A forged Covenant writ: one boost die');
    expect(must(planCheck(module, writ, { owner: 'gate-guard', defId: 'strain' }, { approach: 'flair', charge: 0 })).reasons).not.toContain('A forged Covenant writ: one boost die');
    const plated = { ...save, pack: { plate: 1 } };
    expect(must(planCheck(module, plated, { owner: 'pc-landward-gate', defId: 'alert' }, { approach: 'finesse', charge: 0 })).reasons).toContain('A suit of plate gets in the way: one setback die');
  });

  it('takes what someone down carries, once, and armour takes the first blows until a rest', () => {
    const save = must(setState(module, at('pc-tarred-rope'), 'health', 'garrick-hale', 0)).save;
    const taken = must(act(module, save, 't1', { type: 'loot', from: 'garrick-hale' }));
    expect(taken.turn.directive).toBe('You take 10 coin, a sword and a mail shirt from Garrick Hale.');
    expect(coin(taken.save)).toBe(50);
    expect(taken.save.pack).toEqual({ knife: 1, sword: 1, mail: 1 });
    expect(value(taken.save, 'armour', 'traveller')).toBe(2);
    expect(act(module, taken.save, 't2', { type: 'loot', from: 'garrick-hale' })).toEqual({ ok: false, reason: 'Garrick Hale has nothing for you to take now.' });
    // A failed blow costs armour, not Health.
    const atGate = must(placeCharacter(module, taken.save, 'traveller', 'pc-landward-gate')).save;
    const hit: Target = { owner: 'gate-guard', defId: 'health' };
    const missed = must(act(module, atGate, 't2', { type: 'check', target: hit, choice: { approach: 'force', charge: 0 }, input: 'I swing.', random: rollFor(atGate, hit, 'force', false) }));
    expect(value(missed.save, 'health', 'traveller')).toBe(8);
    expect(value(missed.save, 'armour', 'traveller')).toBe(1);
    expect(missed.turn.directive).toContain('Your armour takes the blow.');
    const rested = must(act(module, missed.save, 't3', { type: 'wait', minutes: 480 })).save;
    expect(value(rested, 'armour', 'traveller')).toBe(2);
    // A gang's purse is theirs together.
    const harbour = must(setState(module, at('pc-harbour'), 'health', 'dock-toughs', 0)).save;
    const gang = must(act(module, harbour, 't1', { type: 'loot', from: 'dock-toughs' }));
    expect(gang.turn.directive).toBe('You take 3 coin, a club and a knife from the dock toughs.');
  });

  it('uses things up', () => {
    let save: Save = { ...must(setState(module, startSave(module), 'health', 'traveller', 4)).save, pack: { poultice: 1, 'smoke-pot': 1 } };
    save = must(setState(module, save, 'alert', 'pc-landward-gate', 2)).save;
    const healed = must(act(module, save, 't1', { type: 'use', goodId: 'poultice' }));
    expect(value(healed.save, 'health', 'traveller')).toBe(6);
    expect(healed.save.pack).toEqual({ 'smoke-pot': 1 });
    expect(healed.turn.directive).toMatch(/^You use a poultice\.\nYou are /);
    const smoked = must(act(module, healed.save, 't2', { type: 'use', goodId: 'smoke-pot' }));
    expect(value(smoked.save, 'alert', 'pc-landward-gate')).toBe(1);
    expect(act(module, smoked.save, 't3', { type: 'use', goodId: 'poultice' })).toEqual({ ok: false, reason: 'You have no poultice left.' });
  });
});

describe('bribes', () => {
  it('buy a minion outright at their price, with no roll and no experience', () => {
    const save = startSave(module);
    const guard: Target = { owner: 'gate-guard', defId: 'strain' };
    const bought = must(act(module, save, 't1', { type: 'check', target: guard, choice: { approach: 'flair', charge: 0, bribe: 'price' }, input: 'A coin for your trouble.', random: always(0.99) }));
    expect(value(bought.save, 'strain', 'gate-guard')).toBe(0);
    expect(coin(bought.save)).toBe(39);
    expect(bought.turn.check).toMatchObject({ bought: true, bribe: 1, good: [] });
    expect(bought.turn.directive).toMatch(/^It works\.\nThe garrison guard has given way\. .*\nThe garrison guard takes your 1 coin\./);
    expect(value(bought.save, 'experience', 'traveller')).toBe(0);
  });

  it('make a rival easier and are paid only if taken; some people are not for sale', () => {
    const save = at('pc-contract-hall');
    const odile: Target = { owner: 'odile-fenn', defId: 'strain' };
    const plan = must(planCheck(module, save, odile, { approach: 'flair', charge: 0, bribe: 'price' }));
    expect(plan.difficulty).toMatchObject({ base: 2, final: 1 });
    expect(plan.reasons).toContain('Your bribe of 10 coin: one step easier');
    expect(planCheck(module, save, odile, { approach: 'flair', charge: 0, bribe: 'above' })).toEqual({ ok: false, reason: 'That bribe takes 100 coin. You have 40.' });
    expect(planCheck(module, save, odile, { approach: 'force', charge: 0, bribe: 'price' })).toEqual({ ok: false, reason: 'A bribe does not help Force here.' });
    const refused = must(act(module, save, 't1', { type: 'check', target: odile, choice: { approach: 'flair', charge: 0, bribe: 'price' }, input: 'For your trouble.', random: rollFor(save, odile, 'flair', false) }));
    expect(coin(refused.save)).toBe(40);
    expect(refused.turn.directive).toContain('Odile Fenn turns your money down.');
    const arbiter = must(planCheck(module, startSave(module), { owner: 'gate-arbiter', defId: 'strain' }, { approach: 'flair', charge: 0, bribe: 'price' }));
    expect(arbiter.reasons).toContain('The gate Arbiter is not for sale: one setback die');
    expect(arbiter.bribe).toMatchObject({ notForSale: true });
  });
});

describe('terms, deals and the narrator', () => {
  it('runs a hire out by the day, and then they stay behind', () => {
    const hired = must(act(module, at('pc-tarred-rope'), 't1', { type: 'scene', actionId: 'hire-garrick' })).save;
    expect(value(hired, 'hired', 'garrick-hale')).toBe(30);
    expect(followRuleFor(module, hired, 'garrick-hale')?.id).toBe('hired');
    const later = must(setClock(module, hired, hired.clock + 29 * 1440)).save;
    expect(value(later, 'hired', 'garrick-hale')).toBe(1);
    expect(contextPlan(module, must(say(module, later, 't2', 'Well?')).save).prefill).toContain('Garrick Hale is in your pay for a day or two more.');
    const done = must(setClock(module, later, later.clock + 1440)).save;
    expect(value(done, 'hired', 'garrick-hale')).toBe(0);
    expect(followRuleFor(module, done, 'garrick-hale')).toBe(null);
  });

  it('offers a writ once you have something on Pell, and a market-day deal', () => {
    const save = at('pc-tarred-rope');
    const offered = (s: Save) => sceneActionsFor(module, s).map((action) => action.id);
    expect(offered(save)).not.toContain('buy-forged-writ');
    const leaned = must(setState(module, save, 'leverage', 'pell', 1)).save;
    expect(offered(leaned)).toContain('buy-forged-writ');
    const writ = must(act(module, leaned, 't1', { type: 'scene', actionId: 'buy-forged-writ' })).save;
    expect(writ.pack['forged-writ']).toBe(1);
    expect(coin(writ)).toBe(30);
    // Thursday at the Caerwyn market.
    const calendar = calendarOf(module);
    const thursday = [0, 1, 2, 3, 4, 5, 6].find((day) => weekdayOf(calendar, day * 1440 + 600) === 4)!;
    let market = must(setClock(module, startSave(module), thursday * 1440 + 600 + (thursday === 0 ? 1440 * 7 : 0))).save;
    market = must(placeCharacter(module, market, 'traveller', 'caerwyn')).save;
    expect(market.positions.cadfan).toBe('caerwyn');
    expect(offered(market)).toContain('buy-dead-mans-mail');
    const otherDay = must(setClock(module, market, market.clock + 1440)).save;
    expect(offered(must(placeCharacter(module, otherDay, 'cadfan', 'caerwyn')).save)).not.toContain('buy-dead-mans-mail');
  });

  it('keeps the pack in the save file', () => {
    const save = { ...startSave(module), pack: { knife: 2, poultice: 1 } };
    const reread = parseSave(module, JSON.parse(JSON.stringify(save)));
    expect(reread.ok && reread.save.pack).toEqual({ knife: 2, poultice: 1 });
  });
});
