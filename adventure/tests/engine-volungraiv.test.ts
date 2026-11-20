import { describe, expect, it } from 'vitest';
import { act, contextPlan, loadModule, read, say, sceneActionsFor, startSave, stateDefFor, threadsOf, type PraxisModule, type Save } from '../src/engine';
import { worldToModule } from '../../core/convert';
import { parseWorld } from '../../core/records';
import file from '../../content/volungraiv/world.json';

// Volungraiv's first slice, Lowgate (content/volungraiv/world.json), played through the engine as
// the Studio hands it over: the opening agrees with the schedules, and its scene actions, world
// states and milestones do what the frame says (docs/content/volungraiv/slice/5-fill.md).
const read0 = parseWorld(file);
if (!read0.ok) throw new Error(read0.errors.join('\n'));
const loaded = loadModule(worldToModule(read0.world).module);
if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
const module: PraxisModule = loaded.module;
const PLAYER = 'the-newcomer';

function must<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error((result as unknown as { reason: string }).reason);
  return result as Extract<T, { ok: true }>;
}
const value = (save: Save, stateId: string, owner = PLAYER) => read(save.values, stateDefFor(module, stateId, owner)!, owner);
const offered = (save: Save) => sceneActionsFor(module, save).map((action) => action.id);
const statusOf = (save: Save, threadId: string) => Object.fromEntries(threadsOf(module, save).find((view) => view.thread.id === threadId)!.milestones.map((entry) => [entry.milestone.id, entry.status]));

describe('Lowgate in the adventure', () => {
  it('opens at the Gate before the bell, with Hollis at the toll house and the newcomer able to pay', () => {
    const save = startSave(module);
    expect(module.scenario.playerCharacterId).toBe(PLAYER);
    expect(save.positions[PLAYER]).toBe('the-gate');
    expect(save.clock).toBe(17 * 60);
    expect(save.positions.hollis).toBe('the-gate');
    expect(save.positions.tamsin).toBe('the-pit');
    expect(value(save, 'coin')).toBe(14);
    expect(offered(save)).toEqual(['pay-for-the-peace']);
  });

  it('keeps the evidence where the thread needs it: the Peace book, the change-book, and the Golkin\'s string', () => {
    const where = (id: string) => module.items.find((item) => item.id === id);
    expect(where('the-peace-book')?.locationId).toBe('the-counting-house');
    expect(where('the-change-book')?.locationId).toBe('koriars-floor');
    expect(where('gilded-crown')?.heldBy).toBe('sela');
    expect(module.characters.find((person) => person.id === 'marrow-golkin')?.carries).toContain('golkins-string');
  });

  it('tells the narrator what the Peace cost, so it never names a price of its own', () => {
    const turn = must(act(module, startSave(module), 'pay', { type: 'scene', actionId: 'pay-for-the-peace' })).turn;
    expect(turn.directive).toContain('You pay 1 coin.');
  });

  it('says what a place is the first time it comes up: the Lee is the caravanserai inside the Gate', () => {
    expect(module.world.places.find((place) => place.id === 'the-lee')?.summary).toMatch(/^The caravanserai inside the Gate/);
    const save = must(say(module, startSave(module), 't1', 'Any place good for a drink and a bed? Is the Lee any good?')).save;
    const lore = contextPlan(module, save).messages[1]!.content;
    expect(lore).toContain('The Lee, a building in Lowgate: The caravanserai inside the Gate');
    expect(lore).toContain('The Peace: Pay at the gate, and harm done to you inside the walls is answered');
  });

  it('gives the narrator a person in front of it before their past: Looks, Manner, Speech, then the rest', () => {
    const save = must(say(module, startSave(module), 't1', '*I look Hollis over.*')).save;
    const lore = contextPlan(module, save).messages[1]!.content;
    const hollis = lore.split('\n').find((line) => line.startsWith('[ Hollis Crane,') && line.includes('Looks:'))!;
    expect(hollis).not.toContain('Gate.,');
    const at = (words: string) => hollis.indexOf(words);
    expect(at('Looks:')).toBeLessThan(at('Manner:'));
    expect(at('Manner:')).toBeLessThan(at('Speech:'));
    expect(at('Speech:')).toBeLessThan(at('He came up the Old Road as a caravan cook'));
  });

  it('sells the Peace at the toll house: the coin, the token, and the Peace held', () => {
    const paid = must(act(module, startSave(module), 'pay', { type: 'scene', actionId: 'pay-for-the-peace' })).save;
    expect(value(paid, 'coin')).toBe(13);
    expect(value(paid, 'peace')).toBe(1);
    expect(paid.pack['peace-token']).toBe(1);
    expect(offered(paid)).not.toContain('pay-for-the-peace');
  });

  it('ends Bought Out by buying out Ansel at the Counting-House, with Wenna there', () => {
    let save = must(act(module, startSave(module), 'pay', { type: 'scene', actionId: 'pay-for-the-peace' })).save;
    save = must(act(module, save, 'go', { type: 'travel', to: 'the-counting-house' })).save;
    expect(save.positions.wenna).toBe('the-counting-house');
    expect(value(save, 'peace', 'ansel')).toBe(1);
    expect(offered(save)).toContain('buy-out-ansel');
    save = must(act(module, save, 'buy', { type: 'scene', actionId: 'buy-out-ansel' })).save;
    expect(value(save, 'peace', 'ansel')).toBe(2);
    expect(value(save, 'bought-out', 'world')).toBe(3);
    expect(value(save, 'coin')).toBe(3);
    expect(statusOf(save, 'bought-out')).toMatchObject({ 'stand-down': 'open', ending: 'reached', envoy: 'open' });
  });

  it('keeps Vigga\'s book out of reach until someone has a contract\'s worth of coin', () => {
    const save = must(act(module, startSave(module), 'go', { type: 'travel', to: 'the-pit' })).save;
    expect(save.positions.vigga).toBe('the-pit');
    expect(offered(save)).not.toContain('buy-viggas-book');
  });

  it('brings the envoy in on day 3, whatever the Peace is worth by then', () => {
    let save = startSave(module);
    save = must(act(module, save, 'w1', { type: 'wait', minutes: 2 * 1440 })).save;
    expect(statusOf(save, 'the-envoy').arrives).toBe('open');
    save = must(act(module, save, 'w2', { type: 'wait', minutes: 1440 })).save;
    expect(statusOf(save, 'the-envoy').arrives).toBe('reached');
    expect(statusOf(save, 'bought-out').envoy).toBe('reached');
  });
});
