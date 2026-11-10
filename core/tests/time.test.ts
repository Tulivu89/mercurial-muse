// Phase B: the clock, schedules, sets that choose themselves, moods, memories, plans and the
// side generations, through both context profiles.
import { describe, expect, it } from 'vitest';
import {
  addMemory, addPlan, addReply, addUserMessage, aetherroom, buildRequest, buildSide, clockNow, clockTracks, deleteMessage, hoursApart, kernelSchedule, lastContactMs,
  levelReaches, moodFor, moveClock, newChat, nextMorningMs, pickPlans, readSchedule, readSide, recentEmotions, resolveSet, roundToHalfHour, sceneFor, setClockMode,
  sideTask, statusText, timeOfDayMs, type BuildOptions, type Chat, type Plan,
} from '../chat/index.js';
import { importCardJson, newWorld, parseWorld, recordById, type World } from '../records/index.js';

function ids() { let n = 0; return () => `id-${++n}`; }
// Friday 11 September 2026, 15:30 UTC (the tests run in UTC).
const FRIDAY = Date.UTC(2026, 8, 11, 15, 30);
const HOUR = 3_600_000;

const contact = {
  cardType: 'contact', id: 'card-mira', name: 'Mira', gndr: 'female', persona: 'Wry.', appearance: 'Silver hair.', greeting: 'Hey.', greetingEmotion: 'happy',
  relationship: 'close', style: 'roleplay, novel style', responseLength: 'long',
  brainsConditional: [{ name: 'Water', content: 'Cannot swim.', keys: ['swim'], requiredIntimacy: 'none' }],
  schedule: {
    Daily: [{ id: 'd1', startTime: 1380, endTime: 120, text: 'Asleep. {{char}} snores.', requiredIntimacy: 'none' }],
    Friday: [
      { id: 'f1', startTime: 900, endTime: 960, text: 'Coffee with {{user}} at 3.', requiredIntimacy: 'none' },
      { id: 'f2', startTime: 930, endTime: 990, text: 'A private call.', requiredIntimacy: 'romantic' },
      { id: 'f3', startTime: 900, endTime: 960, text: 'Watching the boats.', requiredIntimacy: 'acquaintance' },
    ],
  },
  cr: {
    sets: [{ id: 'sOutfits', name: 'Clothes', wear: true, variants: [{ id: 'o1', name: 'Work', content: 'An apron.' }, { id: 'o2', name: 'Pajamas', content: 'Flannel.' }, { id: 'o3', name: 'Coat', content: 'A long coat.' }] }],
    schedLinks: { d1: { sOutfits: 'o2' }, f1: { sOutfits: 'o3' }, 'bad id!': { sOutfits: 'o1' } },
    lineHome: { d1: { 'card-cafe': { room: 'vLoft', x: 0.5 } }, f1: { 'card-cafe': { room: 'vFloor' } } },
  },
};
const scenario = {
  cardType: 'scenario', id: 'card-cafe', name: 'Cafe', environment: 'A small cafe.', scene: 'Late afternoon.',
  cr: { sets: [{ id: 'sRooms', name: 'Location', rooms: true, variants: [{ id: 'vFloor', name: 'The floor', content: 'Tables and steam.' }, { id: 'vLoft', name: 'The loft', content: 'A bed under the eaves.', lock: 'close' }] }] },
};

function setup(): { world: World; miraId: string; cafeId: string } {
  const next = ids();
  const a = importCardJson(newWorld('w', 'Imported', 1), contact, next, 2);
  if (!a.ok) throw new Error(a.errors.join(' '));
  const b = importCardJson(a.result.world, scenario, next, 3);
  if (!b.ok) throw new Error(b.errors.join(' '));
  return { world: b.result.world, miraId: a.result.recordId, cafeId: b.result.recordId };
}

function chatWith(world: World, miraId: string, cafeId: string | null, over: Partial<Chat> = {}): Chat {
  const base = newChat({ id: 'c', worldId: world.id, characterId: miraId, characterName: 'Mira', personaId: null, scenarioId: cafeId, userName: 'Sam', relationship: 'close', style: 'chat', responseLength: 'unspecified', greeting: { text: 'Hey.', emotion: 'happy' } }, ids(), FRIDAY - 5 * HOUR);
  return { ...base, ...over };
}
const story = (ms: number) => ({ mode: 'story' as const, storyMs: ms, stepMin: 0, trackReal: false });
const options = (model: string, over: Partial<BuildOptions> = {}): BuildOptions => ({ model, canPrefill: true, contextTokens: 16_000, replyTokens: 1000, nowMs: FRIDAY, upTo: 1, continuing: false, firstBuild: true, dryRun: false, rngInt: (min) => min, ...over });

describe('importing what CharacterRoom adds to a card', () => {
  it('brings in sets, folds the schedule links into the events, and keeps the card\'s defaults', () => {
    const { world, miraId, cafeId } = setup();
    expect(parseWorld(JSON.parse(JSON.stringify(world))).ok).toBe(true);
    const mira = recordById(world, miraId)!;
    expect(mira.sourceId).toBe('card-mira');
    expect(mira.chatDefaults).toEqual({ relationship: 'close', style: 'novel', responseLength: 'long' });
    expect(mira.sets).toEqual([{ id: 'sOutfits', title: 'Clothes', reach: 'here', active: 'o1', members: [
      { id: 'o1', name: 'Work', text: 'An apron.', lock: null, layers: [] }, { id: 'o2', name: 'Pajamas', text: 'Flannel.', lock: null, layers: [] }, { id: 'o3', name: 'Coat', text: 'A long coat.', lock: null, layers: [] },
    ] }]);
    expect(mira.schedule!.Daily![0]).toMatchObject({ id: 'd1', sets: { sOutfits: 'o2' }, rooms: { 'card-cafe': 'vLoft' } });
    expect(mira.schedule!.Friday![1]).toMatchObject({ id: 'f2', sets: {}, rooms: {} });
    const cafe = recordById(world, cafeId)!;
    expect(cafe.sourceId).toBe('card-cafe');
    expect(cafe.sets[0]).toMatchObject({ id: 'sRooms', title: 'Location', reach: 'always', active: 'vFloor' });
    expect(cafe.sets[0]!.members[1]).toMatchObject({ id: 'vLoft', lock: 'bond-close' });
    expect(world.conditions.map((condition) => condition.id)).toContain('bond-close');
  });
});

describe('the clock', () => {
  it('reads real time until story time is on, and then only moves when told to', () => {
    const real = { mode: 'real' as const, storyMs: 0, stepMin: 0, trackReal: false };
    expect(clockNow(real, FRIDAY)).toBe(FRIDAY);
    expect(clockTracks(real)).toBe(false);
    expect(clockTracks({ ...real, trackReal: true })).toBe(true);
    const on = setClockMode(real, 'story', FRIDAY + 7 * 60_000);
    expect(on.storyMs).toBe(FRIDAY);
    expect(clockNow(on, FRIDAY + 9 * HOUR)).toBe(FRIDAY);
    expect(clockTracks(on)).toBe(true);
    expect(moveClock(on, 90).storyMs).toBe(FRIDAY + 90 * 60_000);
    expect(moveClock(real, 90)).toBe(real);
    expect(roundToHalfHour(FRIDAY + 14 * 60_000)).toBe(FRIDAY);
    expect(nextMorningMs(FRIDAY)).toBe(Date.UTC(2026, 8, 12, 8, 0));
    expect(nextMorningMs(Date.UTC(2026, 8, 11, 6, 0))).toBe(Date.UTC(2026, 8, 11, 8, 0));
    expect(timeOfDayMs(FRIDAY, 22 * 60)).toBe(Date.UTC(2026, 8, 11, 22, 0));
  });

  it('stamps a reply with story time, steps the clock, and puts it back when the reply is deleted', () => {
    const { world, miraId } = setup();
    let chat = chatWith(world, miraId, null, { clock: { ...story(FRIDAY), stepMin: 30 } });
    chat = addUserMessage(chat, 'Hi.', 'u1', 1);
    chat = addReply(chat, [{ text: 'Hi.', emotion: 'happy' }], 'a1', 2);
    expect(chat.messages.at(-1)!.clock).toBe(FRIDAY);
    expect(chat.clock.storyMs).toBe(FRIDAY + 30 * 60_000);
    expect(lastContactMs(chat)).toBe(FRIDAY);
    chat = deleteMessage(chat, 'a1', 3);
    expect(chat.clock.storyMs).toBe(FRIDAY);
    // A chat on real time is not stamped, and reads the reply's own time.
    const real = addReply(chatWith(world, miraId, null), [{ text: 'Hi.', emotion: 'happy' }], 'a1', FRIDAY);
    expect(real.messages.at(-1)!.clock).toBeUndefined();
    expect(lastContactMs(real)).toBe(FRIDAY);
  });
});

describe('schedules', () => {
  it('reads what is on now, the day\'s own lines first, with the relationship as a ladder', () => {
    const { world, miraId } = setup();
    const schedule = recordById(world, miraId)!.schedule;
    const close = readSchedule(schedule, 'close', FRIDAY);
    expect(close.live.map((event) => event.id)).toEqual(['f1', 'f3']);
    expect(close.gated.map((event) => event.id)).toEqual(['f2']);
    expect(statusText(close)).toBe('Coffee with {{user}} at 3.  ·  Watching the boats.');
    expect(readSchedule(schedule, 'stranger', FRIDAY).live.map((event) => event.id)).toEqual(['f1']);
    // A range that wraps past midnight.
    expect(readSchedule(schedule, 'close', Date.UTC(2026, 8, 12, 0, 30)).live.map((event) => event.id)).toEqual(['d1']);
    expect(statusText(readSchedule(schedule, 'close', Date.UTC(2026, 8, 12, 5, 0)))).toBe('Nothing scheduled right now.');
    expect(levelReaches('close', 'acquaintance')).toBe(true);
    expect(levelReaches('acquaintance', 'close')).toBe(false);
    expect(levelReaches('stranger', 'none')).toBe(true);
    // For the kernel, which gates on an exact match: reached events ungated, the rest left out.
    const forKernel = kernelSchedule(schedule, 'close')!;
    expect(forKernel.Friday!.map((event) => [event.id, event.requiredIntimacy])).toEqual([['f1', 'none'], ['f3', 'none']]);
    expect(Object.keys(forKernel)).toEqual(['Daily', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
    expect(kernelSchedule(null, 'close')).toBeUndefined();
  });

  it('lets a set follow the schedule, a scenario\'s set follow the room, and a pin beat both', () => {
    const { world, miraId, cafeId } = setup();
    const mira = recordById(world, miraId)!;
    const cafe = recordById(world, cafeId)!;
    const live = readSchedule(mira.schedule, 'close', FRIDAY).live;
    expect(resolveSet(mira, mira.sets[0]!, {}, live)).toMatchObject({ memberId: 'o3', why: 'schedule', event: 'Coffee with {{user}} at 3.' });
    expect(resolveSet(cafe, cafe.sets[0]!, {}, live)).toMatchObject({ memberId: 'vFloor', why: 'schedule' });
    const night = readSchedule(mira.schedule, 'close', Date.UTC(2026, 8, 12, 0, 30)).live;
    expect(resolveSet(cafe, cafe.sets[0]!, {}, night)).toMatchObject({ memberId: 'vLoft', why: 'schedule' });
    expect(resolveSet(mira, mira.sets[0]!, { [`${miraId}:sOutfits`]: 'o1' }, night)).toMatchObject({ memberId: 'o1', why: 'pinned' });
    expect(resolveSet(mira, mira.sets[0]!, { [`${miraId}:sOutfits`]: 'gone' }, [])).toMatchObject({ memberId: 'o1', why: 'default' });
    const scene = sceneFor(world, chatWith(world, miraId, cafeId), Date.UTC(2026, 8, 12, 0, 30))!;
    expect(scene.character.sets[0]!.active).toBe('o2');
    expect(scene.scenario!.sets[0]!.active).toBe('vLoft');
    expect(scene.picks.map((pick) => pick.why)).toEqual(['schedule', 'schedule']);
  });
});

describe('time in the AetherRoom context', () => {
  it('sends Time Apart, Current Events and the outfit and room the schedule calls for, in CharacterRoom\'s words', async () => {
    const { world, miraId, cafeId } = setup();
    let chat = chatWith(world, miraId, cafeId, { clock: story(FRIDAY) });
    chat = { ...chat, messages: chat.messages.map((message) => ({ ...message, clock: FRIDAY - 3 * HOUR })) };
    chat = addUserMessage(chat, 'Can you swim?', 'u1', 1);
    const built = (await buildRequest(chat, world, options('xialong-v1', { upTo: 2 })))!;
    const sheet = built.messages[0]!.content;
    expect(sheet).toContain('----\nClothes: Coat\nA long coat.\n');
    expect(sheet).toContain('----\nLocation: The floor\nTables and steam.\n');
    expect(built.messages.slice(-4).map((message) => [message.role, message.content])).toEqual([
      ['assistant', 'Mira: Hey.\n  Emotion: happy\n'],
      ['user', 'Sam: Can you swim?'],
      ['system', [
        '----\nTime Apart\nIt\'s been 3 hours since Mira last messaged Sam.',
        '----\nCurrent Events\nToday is Friday at 15:30 (24-hour clock). Current scheduled events for Mira:\n- Time Range: 15:00 - 16:00, Event: Coffee with Sam at 3.\n- Time Range: 15:00 - 16:00, Event: Watching the boats.\nAn event can be something Mira is currently doing or planning to do during this time.',
      ].join('\n')],
      ['system', '[ Style: chat ]'],
    ]);
    expect(built.messages.some((message) => message.content === '----\nWater\nCannot swim.')).toBe(true);
    // On real time with tracking off, none of it is sent.
    const quiet = (await buildRequest({ ...chat, clock: { mode: 'real', storyMs: 0, stepMin: 0, trackReal: false } }, world, options('xialong-v1', { upTo: 2 })))!;
    expect(quiet.messages.some((message) => message.content.includes('Current Events') || message.content.includes('Time Apart'))).toBe(false);
  });

  it('rewrites a turn at the story time it was first written', async () => {
    const { world, miraId } = setup();
    let chat = chatWith(world, miraId, null, { clock: { ...story(FRIDAY), stepMin: 60 } });
    chat = addUserMessage(chat, 'Hi.', 'u1', 1);
    chat = addReply(chat, [{ text: 'Hi.', emotion: 'happy' }], 'a1', 2);
    expect(chat.clock.storyMs).toBe(FRIDAY + HOUR);
    const again = (await buildRequest(chat, world, options('xialong-v1', { upTo: 2 })))!;
    expect(again.messages.find((message) => message.content.includes('Current Events'))!.content).toContain('Today is Friday at 15:30');
    const next = (await buildRequest(chat, world, options('xialong-v1', { upTo: 3 })))!;
    expect(next.messages.some((message) => message.content.includes('Current Events'))).toBe(false);
    expect(next.messages.find((message) => message.content.includes('Time Apart'))!.content).toContain('1 hour since');
  });

  it('puts a plan in a think block on the reply, counts it down and drops it when it runs out', async () => {
    const { world, miraId } = setup();
    let chat = chatWith(world, miraId, null);
    chat = addPlan(chat, { id: 'p1', name: 'Tease', content: 'Tease {{user}} about the rain.', totalTurns: 2, remainingTurns: 2 }, 1);
    chat = addPlan(chat, { id: 'p2', name: 'Curious', content: 'Stay curious.', durationType: 'Ongoing' }, 1);
    chat = addUserMessage(chat, 'Hi.', 'u1', 1);
    const look = (await buildRequest(chat, world, options('xialong-v1', { upTo: 2, dryRun: true })))!;
    expect(look.messages.at(-1)).toEqual({ role: 'assistant', content: '<think>Stay curious.\nTease {{user}} about the rain.</think>\n' });
    expect(look.plans).toEqual(chat.plans);
    const first = (await buildRequest(chat, world, options('xialong-v1', { upTo: 2 })))!;
    expect(first.plans.find((plan) => plan.id === 'p1')).toMatchObject({ running: true, startedAtCount: 1, remainingTurns: 2 });
    chat = { ...chat, plans: first.plans };
    for (const turn of [2, 3]) {
      chat = addUserMessage(addReply(chat, [{ text: 'Mm.', emotion: 'neutral' }], `a${turn}`, turn), 'And?', `u${turn}`, turn);
      chat = { ...chat, plans: (await buildRequest(chat, world, options('xialong-v1', { upTo: chat.messages.length })))!.plans };
    }
    expect(chat.plans.map((plan) => plan.id)).toEqual(['p2']);
  });

  it('counts plans down the same way for other models as the kernel does for xialong', async () => {
    const plans: Plan[] = [
      { id: 'a', name: 'A', content: 'One.', planType: 'AI', durationType: 'Limited', totalTurns: 3, remainingTurns: 3, running: false, startedAtCount: -1 },
      { id: 'b', name: 'B', content: 'Two.', planType: 'User', durationType: 'Limited', totalTurns: 2, remainingTurns: 2, running: false, startedAtCount: -1 },
      { id: 'c', name: 'C', content: 'Three.', planType: 'AI', durationType: 'Ongoing', totalTurns: 3, remainingTurns: 3, running: false, startedAtCount: -1 },
      { id: 'd', name: 'D', content: '', planType: 'AI', durationType: 'Limited', totalTurns: 3, remainingTurns: 3, running: false, startedAtCount: -1 },
    ];
    const rngs = [(min: number) => min, (_min: number, max: number) => max];
    for (const rng of rngs) {
      let mine = plans.map((plan) => ({ ...plan }));
      let theirs = plans.map((plan) => ({ ...plan }));
      for (let users = 1; users <= 7; users += 1) {
        const messages: aetherroom.KernelMessage[] = [];
        for (let turn = 0; turn < users; turn += 1) messages.push({ role: 'user', content: `u${turn}` }, { role: 'assistant', content: turn === users - 1 ? '' : `Mira: a${turn}\n` });
        const result = await aetherroom.contextBuilt(messages, 'xialong-v1', false, {
          char: { id: 'c', name: 'Mira', exampleChats: [] }, user: { id: 'u', name: 'Sam' }, chat: { intimacy: 'close', style: 'chat', responseLength: 'unspecified' },
          includeGameStats: false, gameRecord: {}, floaty: [], plans: theirs as aetherroom.KernelPlan[], trackRealTime: false, useEmotionalModes: false, nowMs: FRIDAY,
        }, { rngInt: rng, encode: (text) => new Array<number>(Math.ceil(text.length / 4)).fill(0), maxTokens: () => 8192, rolloverTokens: () => 1024, naiSystemPrompt: () => 'x', recentEmotions: () => ['neutral'], log: () => {} }, aetherroom.rollDefault());
        theirs = result.plans as Plan[];
        const picked = pickPlans(mine, rng, users, false);
        mine = picked.plans;
        expect(mine, `after ${users} turns`).toEqual(theirs);
        const think = /<think>([\s\S]*)<\/think>/.exec(result.messages!.at(-1)!.content ?? '')?.[1] ?? '';
        expect(picked.contents.join('\n')).toBe(think);
      }
    }
  });

  it('recalls a diary entry or a memory when one of its keys is said, and reads the mood from recent emotions', async () => {
    const { world, miraId } = setup();
    let chat = chatWith(world, miraId, null, { moods: true });
    chat = addMemory(chat, 'diary', { id: 'd1', name: 'Diary: Storm', content: 'The storm scared me.', keys: ['storm'] }, 1);
    chat = addMemory(chat, 'process', { id: 'm1', name: 'Memory: Tea', content: 'Warm.', keys: ['honey tea'] }, 1);
    for (const [index, emotion] of (['bored', 'bored'] as const).entries()) chat = addReply(chat, [{ text: 'Mm.', emotion }], `a${index}`, 2);
    chat = { ...chat, messages: chat.messages.map((message, index) => (index === 0 ? { ...message, alts: [{ ...message.alts[0]!, parts: [{ text: 'Hey.', emotion: 'bored' as const }] }] } : message)) };
    chat = addUserMessage(chat, 'We had honey tea after the storm.', 'u1', 3);
    expect(recentEmotions(chat, 3)).toEqual(['bored', 'bored', 'bored']);
    const built = (await buildRequest(chat, world, options('xialong-v1', { upTo: chat.messages.length })))!;
    const contents = built.messages.map((message) => message.content);
    expect(contents).toContain('----\nDiary: Storm\nType: diary entry\nThe storm scared me.');
    expect(contents).toContain('----\nMemory: Tea\nType: emotional memory\nWarm.');
    expect(contents).toContain('----\nMira\'s Mood\nMira\'s recent emotions have put them in the following state of mind.\nVulnerable: They may share their internal world more, including things like hopes, dreams, and insecurities.');
  });
});

describe('time in the General context', () => {
  it('puts time apart, the schedule, the mood, memories and plans in the moment, and nothing in a think block', async () => {
    const { world, miraId, cafeId } = setup();
    let chat = chatWith(world, miraId, cafeId, { clock: story(FRIDAY), moods: true });
    chat = { ...chat, messages: chat.messages.map((message) => ({ ...message, clock: FRIDAY - 2 * HOUR })) };
    chat = addMemory(chat, 'diary', { id: 'd1', name: 'Storm', content: 'The storm scared me.', keys: ['Storm'] }, 1);
    chat = addPlan(chat, { id: 'p1', name: 'Tease', content: 'Tease {{user}} about the rain.' }, 1);
    chat = addUserMessage(chat, 'Some storm last night.', 'u1', 1);
    const built = (await buildRequest(chat, world, options('glm-4-6', { upTo: 2 })))!;
    const system = built.messages[0]!.content;
    expect(system).toContain('Clothes: Coat: A long coat.');
    expect(system).toContain('Location: The floor: Tables and steam.');
    const moment = built.messages.at(-1)!.content;
    for (const line of [
      'It\'s been 2 hours since Mira last messaged Sam.',
      'Today is Friday at 15:30 (24-hour clock). Current scheduled events for Mira:\n- Time Range: 15:00 - 16:00, Event: Coffee with Sam at 3.',
      'Mira\'s mood. While away from the chat, Mira experienced emotions that put them in the following state of mind.\nClosed:',
      'From Mira\'s diary, Storm: The storm scared me.',
      'What Mira means to do next (act on it, don\'t announce it): Tease Sam about the rain.',
    ]) expect(moment, line).toContain(line);
    expect(JSON.stringify(built.messages)).not.toContain('<think>');
    expect(built.plans[0]).toMatchObject({ running: true, startedAtCount: 1 });
  });

  it('picks a mood, or none', () => {
    expect(moodFor(['bored', 'bored', 'bored'], false, (min) => min)).toEqual({ mode: 'Vulnerable', away: false });
    expect(moodFor(['happy', 'sad', 'tired'], false, (min) => min)).toBeNull();
    expect(moodFor(['angry', 'hurt', 'irritated'], false, (_min, max) => max)).toEqual({ mode: 'Critical', away: false });
    expect(moodFor(['happy'], true, () => 4)).toEqual({ mode: 'Recharging', away: true });
    expect(hoursApart(FRIDAY, FRIDAY - 59 * 60_000)).toBe(0);
    expect(hoursApart(FRIDAY, undefined)).toBe(0);
  });
});

describe('side generations', () => {
  it('asks xialong the way CharacterRoom does: the sheet, the story, the shape, the style and a primer', async () => {
    const { world, miraId } = setup();
    let chat = chatWith(world, miraId, null, { clock: story(FRIDAY), moods: true });
    chat = addPlan(chat, { id: 'p1', name: 'Tease', content: 'Tease.' }, 1);
    chat = addUserMessage(chat, 'Rough day?', 'u1', 1);
    const task = sideTask('diary', ['happy'], (min) => min);
    const built = (await buildSide(task, chat, world, options('xialong-v1')))!;
    expect(built.messages[0]!.content.startsWith('AetherRoom\n----\nMira\n')).toBe(true);
    expect(built.messages.slice(-5).map((message) => [message.role, message.content])).toEqual([
      ['assistant', 'Mira: Hey.\n  Emotion: happy\n'],
      ['user', 'Sam: Rough day?'],
      ['system', 'A diary entry consists of a Title:, Content:, and Activation Keys:'],
      ['system', '[ Style: diary entry, reflection on events ]'],
      ['assistant', 'Mira: Title:'],
    ]);
    // No chat style line, no clock, no mood, no plan, and the plan is not counted down.
    const all = JSON.stringify(built.messages);
    for (const absent of ['[ Style: chat', 'Current Events', 'Mood', '<think>']) expect(all).not.toContain(absent);
    expect(built.plans).toEqual(chat.plans);
    expect(sideTask('process', ['tired', 'happy'], (min) => min).style).toBe('[ Style: emotional memory, brief, wearied feelings ]');
    expect(sideTask('plan', [], (min) => min)).toMatchObject({ maxTokens: 300, style: '[ Style: action plan, authentic expression ]' });
  });

  it('asks any other model in its own format, started on Title', async () => {
    const { world, miraId } = setup();
    const chat = addUserMessage(chatWith(world, miraId, null), 'Rough day?', 'u1', 1);
    const built = (await buildSide(sideTask('plan', [], (min) => min), chat, world, options('glm-4-6')))!;
    expect(built.messages[0]!.content.startsWith('You are Mira. Below is who you are')).toBe(true);
    expect(built.messages[0]!.content).not.toContain('Write every reply in this shape');
    const ask = built.messages.at(-1)!.content;
    expect(ask).toContain('Rough day?');
    expect(ask).toContain('An action plan consists of a Title: and Content:');
    expect(ask).not.toContain('Activation Keys');
    expect(built.prefill).toBe('Title:');
  });

  it('reads what comes back, with or without the primer in front', () => {
    expect(readSide(' The Storm\nContent: It scared me, and I said so.\nActivation Keys: storm, Sam, "thunder", Mira', 'Mira: Title:', 'Mira', 'Sam'))
      .toEqual({ name: 'The Storm', content: 'It scared me, and I said so.', keys: ['storm', 'thunder'] });
    expect(readSide('Mira: Title: Tea\nContent: Warm.\nStill warm.\n  Emotion: happy', 'Mira: Title:', 'Mira', 'Sam')).toEqual({ name: 'Tea', content: 'Warm.\nStill warm.', keys: [] });
    expect(readSide(' Nothing here', 'Title:', 'Mira', 'Sam')).toBeNull();
  });
});
