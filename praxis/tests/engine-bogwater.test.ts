import { describe, expect, it } from 'vitest';
import {
  act, atlasOf, calendarOf, isArea, loadModule, placeCharacter, read, sceneActionsFor, setState, startSave, stateDefFor,
  stateTestFor, whereabouts, WORLD_OWNER, type PraxisModule, type Save,
} from '../src/engine';
import raw from '../modules/abernys-bogwater.json';

function load(change?: (raw: Record<string, any>) => void): ReturnType<typeof loadModule> {
  const copy = structuredClone(raw) as Record<string, any>;
  change?.(copy);
  return loadModule(copy);
}

const loaded = load();
if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
const module: PraxisModule = loaded.module;

function must<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error((result as unknown as { reason: string }).reason);
  return result as Extract<T, { ok: true }>;
}

// The module's day 1 is day 243 of the calendar, Friday 1 September.
const DAY1 = 243;
const minuteOf = (day: number, hour: number) => (DAY1 + day - 1) * 1440 + hour * 60;
const waitUntil = (save: Save, day: number, hour: number) => must(act(module, save, `w${day}-${hour}`, { type: 'wait', minutes: minuteOf(day, hour) - save.clock })).save;
const value = (save: Save, defId: string, owner: string) => read(save.values, stateDefFor(module, defId, owner)!, owner);

describe('Bogwater', () => {
  it('loads, and opens in the net at the long fence with Ellis and his cousins', () => {
    const save = startSave(module);
    expect(save.positions['the-runaway']).toBe('traps-long-fence');
    expect(save.positions['ellis']).toBe('traps-long-fence');
    expect(save.positions['long-fence-crew']).toBe('traps-long-fence');
    expect(calendarOf(module).dayNames[(DAY1) % 7]).toBe('Friday');
    expect(value(save, 'rabitis', 'lowri')).toBe(8);
  });

  it('keeps every schedule on real places, with no more than four people in one place at a time', () => {
    const places = atlasOf(module).places;
    const test = stateTestFor(module, startSave(module).values);
    for (let day = 1; day <= 40; day += 1) {
      for (const hour of [0, 6, 12, 18, 22]) {
        const counts = new Map<string, string[]>();
        for (const person of module.characters) {
          const where = whereabouts(calendarOf(module), person, minuteOf(day, hour), test);
          if (!where) continue;
          const place = places.get(where.row.locationId);
          expect(Boolean(place) && !isArea(place)).toBe(true);
          counts.set(where.row.locationId, [...(counts.get(where.row.locationId) ?? []), person.id]);
        }
        for (const [placeId, people] of counts) {
          if (people.length > 4) throw new Error(`Day ${day}, ${hour}:00, ${placeId}: ${people.join(', ')}`);
        }
      }
    }
  });

  it('lets Lowri loose into the reeds after day 8, unless she was cured', () => {
    const loose = waitUntil(startSave(module), 9, 20);
    expect(value(loose, 'rabitis', 'lowri')).toBe(0);
    expect(loose.positions['lowri']).toBe('fen-reed-beds');

    const cured = waitUntil(must(setState(module, startSave(module), 'rabitis', 'lowri', 1000)).save, 9, 20);
    expect(cured.positions['lowri']).toBe('morwens-door');
  });

  it('sends the patrol onto Nest\'s island on day 13, unless Corran\'s game is known', () => {
    const raided = waitUntil(startSave(module), 13, 23);
    expect(raided.positions['mattias-reyne']).toBe('nests-jetty');
    expect(raided.positions['ellis']).toBe('nests-jetty');

    const known = must(setState(module, startSave(module), 'the-spark', WORLD_OWNER, 1)).save;
    const quiet = waitUntil(known, 13, 23);
    expect(quiet.positions['mattias-reyne']).toBe('grey-water');
    expect(quiet.positions['ellis']).not.toBe('nests-jetty');
  });

  it('sends Orlo home once the Pact has no claim on the runaway', () => {
    expect(waitUntil(startSave(module), 11, 9).positions['bastien-orlo']).toBe('landing-dock');
    const freed = must(setState(module, startSave(module), 'ink-claim', 'the-runaway', 1)).save;
    expect(waitUntil(freed, 11, 9).positions['bastien-orlo']).toBe('port-covenant');
  });

  it('settles Corran\'s game with a scene action on a world state', () => {
    let save = must(placeCharacter(module, startSave(module), 'the-runaway', 'meyricks-room')).save;
    save = must(setState(module, save, 'leverage', 'corran', 1)).save;
    expect(save.positions['meyrick']).toBe('meyricks-room');
    expect(sceneActionsFor(module, save).map((action) => action.id)).toContain('expose-corran');
    const done = must(act(module, save, 't1', { type: 'scene', actionId: 'expose-corran' })).save;
    expect(value(done, 'the-spark', WORLD_OWNER)).toBe(1);
    expect(value(done, 'experience', 'the-runaway')).toBe(15);
    expect(sceneActionsFor(module, done).map((action) => action.id)).not.toContain('expose-corran');
  });

  it('offers the cure only with tamecap in your pack, and only while it can still work', () => {
    let save = waitUntil(startSave(module), 1, 8);
    save = must(placeCharacter(module, save, 'the-runaway', 'morwens-door')).save;
    expect(save.positions['morwen']).toBe('morwens-door');
    expect(sceneActionsFor(module, save).map((action) => action.id)).not.toContain('give-tamecap');
    const stocked: Save = { ...save, pack: { ...save.pack, tamecap: 1 } };
    expect(sceneActionsFor(module, stocked).map((action) => action.id)).toContain('give-tamecap');
    const cured = must(act(module, stocked, 't1', { type: 'scene', actionId: 'give-tamecap' })).save;
    expect(value(cured, 'rabitis', 'lowri')).toBe(1000);
    expect(cured.pack.tamecap ?? 0).toBe(0);
  });

  it('needs a boat for Nest\'s island', () => {
    const save = must(placeCharacter(module, startSave(module), 'the-runaway', 'landing-dock')).save;
    expect(act(module, save, 't1', { type: 'travel', to: 'nests-longhouse' }).ok).toBe(false);
    const afloat = must(setState(module, save, 'afloat', 'the-runaway', 1)).save;
    expect(act(module, afloat, 't1', { type: 'travel', to: 'nests-longhouse' }).ok).toBe(true);
  });

  it('refuses a schedule that waits on a state its owner cannot hold', () => {
    const result = load((copy) => {
      const lowri = copy.characters.find((entry: { id: string }) => entry.id === 'lowri');
      lowri.schedule.rules[0].when.state = { stateId: 'the-spark', atMost: 0 };
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toMatch(/"the-spark" is not a state lowri holds/);
  });
});
