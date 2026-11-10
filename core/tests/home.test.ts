// Home: a character's day worked out from the clock.
import { describe, expect, it } from 'vitest';
import { actionBlocked, addUserMessage, buildRequest, careAt, doAction, livesIn, needEmotion, needsText, newChat, newLife, parseLife, placeIn, readSchedule, whileAway, type BuildOptions, type Life } from '../chat/index.js';
import { importCardJson, newWorld, parseWorld, recordById } from '../records/index.js';

function ids() { let n = 0; return () => `id-${++n}`; }
const FRIDAY = Date.UTC(2026, 8, 11, 15, 30);
const HOUR = 3_600_000;

const contact = {
  cardType: 'contact', id: 'card-mira', name: 'Mira', persona: 'Wry.', greeting: 'Hey.', relationship: 'acquaintance',
  schedule: {
    Daily: [{ id: 'sleep', startTime: 1380, endTime: 420, text: 'Asleep.', requiredIntimacy: 'none' }, { id: 'lunch', startTime: 720, endTime: 780, text: 'Lunch at the counter.', requiredIntimacy: 'none' }],
    Friday: [{ id: 'coffee', startTime: 900, endTime: 960, text: 'Coffee with {{user}}.', requiredIntimacy: 'none' }],
  },
  cr: {
    lineHome: { sleep: { 'card-cafe': { room: 'vLoft', x: 0.44, y: 0.4, scale: 0.23, pic: 'pSleep' } }, coffee: { 'card-cafe': { room: 'vFloor', x: 0.9, y: 0.6, scale: 0.25 } } },
    homeIdle: { 'card-cafe': { room: 'vFloor', x: 0.2, y: 0.7, scale: 0.3, pic: 'pEase' } },
    pics: [{ id: 'pSleep', name: 'Curled asleep', prompt: 'sleeping' }, { id: 'pEase', name: 'At ease' }],
    needs: [
      { id: 'hunger', name: 'Hunger', max: 100, decay: 6, low: 25, lowEmotion: 'irritated', note: 'eats off {{user}}\'s plate' },
      { id: 'energy', name: 'Energy', max: 100, decay: 4, low: 20, lowEmotion: 'tired' },
    ],
    lineNeeds: { sleep: { energy: 8, hunger: -2 }, lunch: { hunger: 60 } },
    homeActions: [
      { id: 'feed', name: 'Feed', effects: { hunger: 40 }, say: '{{user}} puts food in front of {{char}}.' },
      { id: 'outing', name: 'Go out', effects: { energy: -10 }, level: 'close', cooldown: 48, bond: 10 },
      { id: 'gift', name: 'Give a gift', effects: {}, cooldown: 24, bond: 15 },
    ],
    bond: { name: 'Hers', max: 100, up: 4, down: 4, upAt: 60, downWhen: 'all' },
  },
};
const scenario = {
  cardType: 'scenario', id: 'card-cafe', name: 'Cafe', scene: 'Late.',
  cr: { sets: [{ id: 'sRooms', name: 'Location', rooms: true, variants: [
    { id: 'vFloor', name: 'The floor', content: 'Tables.', layers: [{ id: 'l1', name: 'Candlelight', above: true, fill: false, x: 0.5, y: 0.23, scale: 1, opacity: 0.71, blend: 'soft-light', shown: true }, { name: 'bad', blend: 'nonsense', opacity: 9 }] },
    { id: 'vLoft', name: 'The loft', content: 'A bed.', lock: 'close' },
  ] }] },
};

function setup() {
  const next = ids();
  const a = importCardJson(newWorld('w', 'Imported', 1), contact, next, 2);
  if (!a.ok) throw new Error(a.errors.join(' '));
  const b = importCardJson(a.result.world, scenario, next, 3);
  if (!b.ok) throw new Error(b.errors.join(' '));
  const world = b.result.world;
  return { world, mira: recordById(world, a.result.recordId)!, cafe: recordById(world, b.result.recordId)! };
}
const at = (life: Life, patch: Partial<Life>): Life => ({ ...life, ...patch });

describe('importing Home from a CharacterRoom card', () => {
  it('keeps figures, where she stands, needs, actions, the bond and a room\'s layers', () => {
    const { world, mira, cafe } = setup();
    expect(parseWorld(JSON.parse(JSON.stringify(world))).ok).toBe(true);
    expect(mira.figures).toEqual([{ id: 'pSleep', name: 'Curled asleep' }, { id: 'pEase', name: 'At ease' }]);
    expect(mira.idle).toEqual({ 'card-cafe': { room: 'vFloor', x: 0.2, y: 0.7, scale: 0.3, pic: 'pEase' } });
    expect(mira.schedule!.Daily![0]).toMatchObject({ spots: { 'card-cafe': { x: 0.44, y: 0.4, scale: 0.23, pic: 'pSleep' } }, needs: { energy: 8, hunger: -2 } });
    expect(mira.needs.map((need) => [need.id, need.decay, need.low])).toEqual([['hunger', 6, 25], ['energy', 4, 20]]);
    expect(mira.homeActions.map((action) => action.id)).toEqual(['feed', 'outing', 'gift']);
    expect(mira.bond).toMatchObject({ name: 'Hers', upAt: 60 });
    expect(cafe.sets[0]!.members[0]!.layers).toEqual([{ id: 'l1', name: 'Candlelight', above: true, fill: false, x: 0.5, y: 0.23, scale: 1, opacity: 0.71, blend: 'soft-light', shown: true, motion: 'none' }]);
  });
});

describe('a life', () => {
  it('starts from the card and survives a round trip', () => {
    const { mira } = setup();
    const life = newLife('w', mira, FRIDAY);
    expect(life).toMatchObject({ key: `w:${mira.id}`, relationship: 'acquaintance', clock: { mode: 'real' } });
    expect(parseLife(JSON.parse(JSON.stringify(life)))).toEqual(life);
    expect(parseLife({ nope: true })).toBeNull();
  });

  it('keeps needs full until something sets them, then lets them fall, with the schedule deciding the rate', () => {
    const { mira } = setup();
    let life = newLife('w', mira, FRIDAY);
    expect(careAt(mira, life, FRIDAY + 100 * HOUR).needs).toEqual({ hunger: 100, energy: 100 });
    // Set at 15:30 on Friday; by 19:30 hunger has fallen 6 an hour and energy 4.
    life = at(life, { levels: { hunger: { v: 60, at: FRIDAY }, energy: { v: 50, at: FRIDAY } } });
    expect(careAt(mira, life, FRIDAY + 4 * HOUR).needs).toEqual({ hunger: 36, energy: 34 });
    // Asleep from 23:00 to 07:00: energy rises 8 an hour, hunger falls 2.
    const morning = careAt(mira, life, Date.UTC(2026, 8, 12, 7, 0)).needs;
    expect(morning.energy).toBe(50 - 7.5 * 4 + 8 * 8);
    expect(morning.hunger).toBe(Math.max(0, 60 - 7.5 * 6 - 8 * 2));
    // Lunch fills her up, to the top and no further.
    expect(careAt(mira, life, Date.UTC(2026, 8, 12, 13, 0)).needs.hunger).toBe(60);
    expect(careAt(mira, at(life, { levels: { hunger: { v: 90, at: Date.UTC(2026, 8, 12, 12, 0) } } }), Date.UTC(2026, 8, 12, 13, 0)).needs.hunger).toBe(100);
  });

  it('tells the model how the needs stand, and shows the first low one on her face', () => {
    const { mira } = setup();
    const life = at(newLife('w', mira, FRIDAY), { levels: { hunger: { v: 20, at: FRIDAY }, energy: { v: 90, at: FRIDAY } } });
    const care = careAt(mira, life, FRIDAY);
    expect(needsText(mira, care, 'Sam', FRIDAY)).toBe('Mira\'s needs right now: Hunger 20/100 (low — eats off Sam\'s plate), Energy 90/100.');
    expect(needEmotion(mira, care)).toBe('irritated');
    expect(needEmotion(mira, careAt(mira, newLife('w', mira, FRIDAY), FRIDAY))).toBe('');
  });

  it('does an action: needs move, the bond moves, the log says so, and a cooldown or a level holds it back', () => {
    const { mira } = setup();
    let life = at(newLife('w', mira, FRIDAY), { levels: { hunger: { v: 30, at: FRIDAY } } });
    life = doAction(mira, life, 'feed', FRIDAY + HOUR, 'Sam');
    expect(life.levels.hunger).toEqual({ v: 64, at: FRIDAY + HOUR });
    expect(life.levels.energy).toEqual({ v: 100, at: FRIDAY + HOUR });
    expect(life.log.at(-1)).toEqual({ at: FRIDAY + HOUR, text: 'Sam puts food in front of Mira.' });
    expect(life.bond).toEqual({ v: 50, at: FRIDAY + HOUR });
    const gifted = doAction(mira, life, 'gift', FRIDAY + 2 * HOUR, 'Sam');
    expect(gifted.bond!.v).toBeGreaterThan(60);
    expect(actionBlocked(gifted, mira.homeActions[2]!, FRIDAY + 3 * HOUR)).toBe('Again in 23 hours.');
    expect(doAction(mira, gifted, 'gift', FRIDAY + 3 * HOUR, 'Sam')).toBe(gifted);
    expect(actionBlocked(life, mira.homeActions[1]!, FRIDAY)).toBe('Once you\'re close.');
    expect(actionBlocked(at(life, { relationship: 'romantic' }), mira.homeActions[1]!, FRIDAY)).toBe('');
  });

  it('lets the bond rise while she is kept well and fall while every need is low', () => {
    const { mira } = setup();
    const kept = at(newLife('w', mira, FRIDAY), { levels: { hunger: { v: 100, at: FRIDAY }, energy: { v: 100, at: FRIDAY } }, bond: { v: 50, at: FRIDAY } });
    expect(careAt(mira, kept, FRIDAY + 2 * HOUR).bond).toBe(58);
    const neglected = at(kept, { levels: { hunger: { v: 0, at: FRIDAY }, energy: { v: 0, at: FRIDAY } } });
    expect(careAt(mira, neglected, FRIDAY + 2 * HOUR).bond).toBe(42);
  });
});

describe('where she is', () => {
  it('follows the schedule into a room and a spot, and idles where the card says otherwise', () => {
    const { mira, cafe } = setup();
    expect(livesIn(mira, cafe)).toBe(true);
    expect(livesIn(cafe, cafe)).toBe(false);
    expect(placeIn(mira, cafe, readSchedule(mira.schedule, 'acquaintance', FRIDAY))).toEqual({ room: 'vFloor', spot: { x: 0.9, y: 0.6, scale: 0.25, pic: '' }, event: 'Coffee with {{user}}.', idle: false });
    expect(placeIn(mira, cafe, readSchedule(mira.schedule, 'acquaintance', Date.UTC(2026, 8, 12, 2, 0)))).toMatchObject({ room: 'vLoft', spot: { pic: 'pSleep' }, idle: false });
    expect(placeIn(mira, cafe, readSchedule(mira.schedule, 'acquaintance', Date.UTC(2026, 8, 12, 9, 0)))).toEqual({ room: 'vFloor', spot: { x: 0.2, y: 0.7, scale: 0.3, pic: 'pEase' }, event: '', idle: true });
    expect(placeIn({ ...mira, idle: {} }, cafe, readSchedule(mira.schedule, 'acquaintance', Date.UTC(2026, 8, 12, 9, 0)))).toBeNull();
  });

  it('replays what happened while you were away, the same way every time', () => {
    const { mira } = setup();
    const life = at(newLife('w', mira, FRIDAY), { levels: { hunger: { v: 40, at: FRIDAY }, energy: { v: 100, at: FRIDAY } } });
    const until = Date.UTC(2026, 8, 12, 12, 30);
    const log = whileAway(mira, life, FRIDAY, until, 'Sam');
    expect(log.map((entry) => entry.text)).toEqual(['Hunger ran low.', 'Asleep.', 'Lunch at the counter.']);
    expect(log[0]!.at).toBe(FRIDAY + 2.5 * HOUR);
    expect(whileAway(mira, life, FRIDAY, until, 'Sam')).toEqual(log);
    expect(whileAway(mira, life, FRIDAY, FRIDAY + 60_000, 'Sam')).toEqual([]);
  });
});

describe('needs in the context', () => {
  const options = (model: string): BuildOptions => ({ model, canPrefill: true, contextTokens: 16_000, replyTokens: 1000, nowMs: FRIDAY, upTo: 2, continuing: false, firstBuild: true, dryRun: true, rngInt: (min) => min, needs: 'Mira\'s needs right now: Hunger 20/100 (low).' });
  it('reaches xialong as CharacterRoom\'s Needs brain and other models as a line in the moment', async () => {
    const { world, mira } = setup();
    const chat = addUserMessage(newChat({ id: 'c', worldId: 'w', characterId: mira.id, characterName: 'Mira', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'acquaintance', style: 'chat', responseLength: 'unspecified', greeting: { text: 'Hey.', emotion: 'happy' } }, ids(), 1), 'Hi.', 'u1', 2);
    const xialong = (await buildRequest(chat, world, options('xialong-v1')))!;
    expect(xialong.messages[0]!.content.endsWith('----\nNeeds\nMira\'s needs right now: Hunger 20/100 (low).\n')).toBe(true);
    const general = (await buildRequest(chat, world, options('glm-4-6')))!;
    expect(general.messages[0]!.content).not.toContain('needs right now');
    expect(general.messages.at(-1)!.content).toContain('Mira\'s needs right now: Hunger 20/100 (low).');
  });
});
