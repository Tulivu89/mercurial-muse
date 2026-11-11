// Studio worlds and adventure modules, both ways. This lives only until the adventure reads
// records directly (roadmap step 6); then it retires, and the module's Orbis field names with it.
//
// A module's text becomes lines and sections, its links become groups and parents, its numbers
// become rules blocks, and its ruleset becomes the world's own rules. What the record model has
// no place for yet (routes, relationships, a day's stops, where an item lies, the scenario's
// start) is carried in the module's own names and goes back out unchanged.
//
// The module is handled as plain data: the adventure checks it when it loads it.
// Pure: no DOM, no network, no storage.

import { WORLD_FORMAT, parseWorld, type GroupKind, type Reach, type RecordKind, type Section, type StoryRecord, type World } from '../records/schema.js';
import type { MemberRules, RecordRules } from '../rules/record-rules.js';
import { rulesFor } from '../rules/for.js';
import { AREA_KINDS } from '../rules/ruleset.js';
import { STANDARD_RULESET_ID } from '../rules/standard.js';
import { BLOCKS, rulesetOf, worldRulesSchema } from '../rules/world-rules.js';
import { DEFAULT_CALENDAR } from '../rules/clock.js';
import { eventsFromPlans, plansFromEvents, sameDays, type PlanSchedule } from './schedule.js';
import { THREAD_QUESTIONS, type Milestone } from '../rules/threads.js';

export const MODULE_FORMAT = 'adventure-module/1';
const MODULE_FORMATS = [MODULE_FORMAT, 'praxis-module/1'];

type Raw = Record<string, unknown>;
const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): Raw[] => (Array.isArray(value) ? value.filter(isObject) : []);
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []);

// Splits a module record into the fields that have a home in the record model and the rest.
function split(source: Raw, typed: readonly string[]): { rest: Raw | undefined } {
  const rest = Object.fromEntries(Object.entries(source).filter(([key]) => !typed.includes(key)));
  return { rest: Object.keys(rest).length ? rest : undefined };
}

function record(kind: RecordKind, id: string, name: string, patch: Partial<StoryRecord>): StoryRecord {
  return {
    id, kind, name, keys: [], line: '', sections: [], sets: [], groupIds: [], tags: [], notes: '', parentId: null, groupKind: 'other',
    pronouns: '', gender: '', schedule: null, chatDefaults: null, sourceId: '', greetings: [], examples: [],
    figures: [], idle: {}, needs: [], homeActions: [], bond: null, ...patch,
  };
}

// Sections made from a module field keep a fixed id, so the field is found again whatever the
// author calls the section.
const section = (id: string, title: string, reach: Reach, body: unknown): Section => ({ id: `m-${id}`, title, reach, keys: [], when: null, text: text(body) });

const MEMBER_FIELDS = ['tier', 'rank', 'gang', 'charges', 'states', 'maxima', 'difficulty', 'purse', 'price', 'forSale', 'sells', 'carries'] as const;
const emptyMap = (value: unknown) => isObject(value) && Object.keys(value).length === 0;

function rulesFrom(source: Raw, fields: readonly string[]): RecordRules | undefined {
  const rules = Object.fromEntries(fields.flatMap((field) => (source[field] === undefined || emptyMap(source[field]) ? [] : [[field, source[field]]])));
  return Object.keys(rules).length ? (rules as RecordRules) : undefined;
}

export type ImportResult = { ok: true; world: World; notes: string[] } | { ok: false; errors: string[] };

export function isModule(raw: unknown): boolean {
  return isObject(raw) && MODULE_FORMATS.includes(text(raw.format));
}

// An adventure module as a Studio world.
export function moduleToWorld(raw: unknown, now: number): ImportResult {
  if (!isModule(raw) || !isObject((raw as Raw).world) || !isObject((raw as Raw).scenario)) return { ok: false, errors: ['This is not an adventure module.'] };
  const module = raw as Raw;
  const ruleset = isObject(module.ruleset) ? module.ruleset : {};
  if (ruleset.extends !== STANDARD_RULESET_ID) return { ok: false, errors: ['This module keeps a ruleset all of its own. The Studio opens modules that build on the standard one.'] };
  const world = module.world as Raw;
  const scenario = module.scenario as Raw;
  const playerId = text(scenario.playerCharacterId);
  const identity = isObject(world.identity) ? world.identity : {};
  const records: StoryRecord[] = [];
  const fits = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;

  for (const place of list(world.places)) {
    const kind = text(place.kind);
    records.push(record('place', text(place.id), text(place.name), {
      parentId: text(place.parentLocationId) || null,
      sections: [section('entry', 'Entry', 'here', place.description), section('atmosphere', 'Atmosphere', 'here', '')],
      rules: rulesFrom({ placeKind: kind && kind !== 'other' ? kind : undefined, difficulty: place.difficulty }, ['placeKind', 'difficulty']),
      carried: split(place, ['id', 'name', 'description', 'kind', 'parentLocationId', 'difficulty']).rest,
    }));
  }
  const groups: [string, GroupKind][] = [['species', 'species'], ['factions', 'faction'], ['societies', 'other'], ['families', 'family']];
  for (const [collection, groupKind] of groups) {
    for (const group of list(world[collection])) {
      records.push(record('group', text(group.id), text(group.name), {
        groupKind,
        sections: [section('entry', 'Entry', 'named', group.description)],
        carried: split(group, ['id', 'name', 'description']).rest,
      }));
    }
  }
  for (const memory of list(world.memories)) {
    records.push(record('lore', text(memory.id), text(memory.title), {
      sections: [section('entry', 'Entry', 'named', memory.description)],
      carried: split(memory, ['id', 'title', 'description']).rest,
    }));
  }
  for (const person of list(module.characters)) {
    const species = text(person.speciesId);
    records.push(record(person.id === playerId ? 'persona' : 'character', text(person.id), text(person.name), {
      line: fits(person.role, 400) ? person.role : '',
      pronouns: fits(person.pronouns, 40) ? person.pronouns : '',
      notes: text(person.draftNote),
      groupIds: [...(species ? [species] : []), ...strings(person.factionIds)],
      sections: [
        section('appearance', 'Appearance', 'here', person.appearance),
        section('personality', 'Personality', 'here', person.personality),
        section('speech', 'Speech', 'here', person.speech),
        section('description', 'Background', 'named', person.description),
      ],
      rules: rulesFrom(person, MEMBER_FIELDS),
      schedule: isObject(person.schedule) && Array.isArray(person.schedule.plans) ? eventsFromPlans(person.schedule as unknown as PlanSchedule) : null,
      carried: split(person, ['id', 'name', 'role', 'pronouns', 'draftNote', 'speciesId', 'factionIds', 'appearance', 'personality', 'speech', 'description', ...MEMBER_FIELDS]).rest,
    }));
  }
  for (const item of list(module.items)) {
    records.push(record('item', text(item.id), text(item.name), {
      sections: [section('entry', 'Entry', 'here', item.description)],
      rules: rulesFrom(item, ['difficulty']),
      carried: split(item, ['id', 'name', 'description', 'difficulty']).rest,
    }));
  }
  // A thread's five questions are its sections, for the author only; its kind and milestones are
  // its rules.
  for (const thread of list(module.threads)) {
    const kind = text(thread.kind);
    const milestones = list(thread.milestones);
    const rules = { ...(kind && kind !== 'custom' ? { kind } : {}), ...(milestones.length ? { milestones: milestones as unknown as Milestone[] } : {}) };
    records.push(record('thread', text(thread.id), text(thread.name), {
      sections: THREAD_QUESTIONS.map((question) => section(question, question.charAt(0).toUpperCase() + question.slice(1), 'never', thread[question])),
      rules: Object.keys(rules).length ? { thread: rules } : undefined,
      carried: split(thread, ['id', 'name', 'kind', 'milestones', ...THREAD_QUESTIONS]).rest,
    }));
  }
  const taken = new Set(records.map((entry) => entry.id));
  let scenarioId = 'scenario';
  while (taken.has(scenarioId)) scenarioId = `${scenarioId}-start`;
  records.push(record('scenario', scenarioId, text(scenario.title) || text(module.name), {
    sections: [section('opening', 'Situation', 'always', scenario.opening)],
    carried: split(scenario, ['title', 'opening']).rest,
  }));

  const mapped: string[] = [];
  const premise = fits(identity.description, 4000) ? (mapped.push('description'), identity.description) : '';
  const genre = fits(identity.genre, 80) ? (mapped.push('genre'), identity.genre) : '';
  const tone = fits(identity.tone, 200) ? (mapped.push('tone'), identity.tone) : '';
  const collections = ['places', 'routes', 'species', 'factions', 'societies', 'families', 'memories'];
  const rules = worldRulesSchema.safeParse({ ...ruleset, tiers: ruleset.tiers ?? {} });
  if (!rules.success) return { ok: false, errors: rules.error.issues.slice(0, 12).map((issue) => `ruleset.${issue.path.join('.')}: ${issue.message}`) };

  const built = {
    format: WORLD_FORMAT, id: text(module.id), name: text(module.name), premise, genre, tone, conditions: [], records, updatedAt: now,
    rules: rules.data,
    routes: world.routes ?? [],
    carried: {
      id: module.id, version: module.version, notes: module.notes, source: module.source,
      world: { ...split(world, collections).rest, identity: split(identity, mapped).rest ?? {} },
      relationships: module.relationships ?? [],
    },
  };
  const read = parseWorld(JSON.parse(JSON.stringify(built)));
  if (!read.ok) return { ok: false, errors: read.errors };
  const count = (kind: RecordKind) => records.filter((entry) => entry.kind === kind).length;
  return {
    ok: true, world: read.world,
    notes: [`${count('place')} places, ${count('character') + count('persona')} people, ${count('group')} groups, ${count('item')} things and ${count('lore')} pieces of lore.`],
  };
}

const lower = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

// A Studio world as a module the adventure plays. `notes` says what could not go with it.
export function worldToModule(world: World): { module: Raw; notes: string[] } {
  const notes: string[] = [];
  const carried = (world.carried ?? {}) as Raw;
  const carriedWorld = isObject(carried.world) ? carried.world : {};
  const byId = new Map(world.records.map((entry) => [entry.id, entry]));
  const of = (kind: RecordKind) => world.records.filter((entry) => entry.kind === kind);
  const extra = (entry: StoryRecord): Raw => (entry.carried ?? {}) as Raw;

  // A module field's text: the section made from it, or the section an author would have
  // written it in. Other sections the narrator may read go after it.
  const mappedIds = new Set(['m-entry', 'm-atmosphere', 'm-appearance', 'm-personality', 'm-speech', 'm-description', 'm-opening', ...THREAD_QUESTIONS.map((question) => `m-${question}`)]);
  const find = (entry: StoryRecord, id: string, titles: string[]) =>
    entry.sections.find((part) => part.id === `m-${id}`) ?? entry.sections.find((part) => !mappedIds.has(part.id) && titles.includes(part.title.trim().toLowerCase()));
  const body = (entry: StoryRecord, id: string, titles: string[], alsoRest = false) => {
    const main = find(entry, id, titles);
    if (!alsoRest) return main?.text ?? '';
    const used = new Set([main, ...(entry.kind === 'character' || entry.kind === 'persona' ? [find(entry, 'appearance', ['appearance']), find(entry, 'personality', ['personality']), find(entry, 'speech', ['speech'])] : [])]);
    const rest = entry.sections.filter((part) => !used.has(part) && part.text.trim() && part.reach !== 'never' && part.reach !== 'when');
    return [main?.text ?? '', ...rest.map((part) => `${part.title}: ${part.text.trim()}`)].filter((part) => part.trim()).join('\n').slice(0, 8000);
  };
  const optional = (fields: Raw) => Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined && value !== '' && !emptyMap(value)));

  const places = of('place').map((place) => ({
    ...extra(place), id: place.id, name: place.name, description: body(place, 'entry', ['entry'], true),
    kind: place.rules?.placeKind ?? 'other', parentLocationId: place.parentId && byId.get(place.parentId)?.kind === 'place' ? place.parentId : null,
    ...optional({ difficulty: place.rules?.difficulty }),
  }));

  const groupEntry = (group: StoryRecord) => ({ ...extra(group), id: group.id, name: group.name, description: body(group, 'entry', ['entry'], true) });
  const groupsOf = (...kinds: GroupKind[]) => of('group').filter((group) => kinds.includes(group.groupKind)).map(groupEntry);

  // A group's defaults are written out on each member, since a module knows nothing of them.
  const flat = (person: StoryRecord): MemberRules => {
    const givers = person.groupIds.flatMap((groupId) => { const rules = byId.get(groupId)?.rules?.members; return rules ? [rules] : []; });
    const own = person.rules ?? {};
    const out: Raw = {};
    for (const field of MEMBER_FIELDS) {
      const maps = field === 'charges' || field === 'states' || field === 'maxima' || field === 'difficulty';
      const value = maps
        ? Object.assign({}, ...[...givers].reverse().map((rules) => rules[field] ?? {}), own[field] ?? {})
        : own[field] ?? givers.map((rules) => rules[field]).find((given) => given !== undefined);
      if (value !== undefined && value !== null && !emptyMap(value)) out[field] = value;
    }
    return out as MemberRules;
  };
  const people = world.records.filter((entry) => entry.kind === 'character' || entry.kind === 'persona');
  const dayNames = (world.rules?.calendar ?? DEFAULT_CALENDAR).dayNames;
  const scenarioRecord = of('scenario')[0];
  const start = scenarioRecord ? extra(scenarioRecord) : {};
  const personas = of('persona');
  const player = personas.find((persona) => persona.id === start.playerCharacterId) ?? personas[0];
  if (personas.length > 1) notes.push(`${player!.name} is the one played; the other personas go along as people.`);

  const characters: Raw[] = people.map((person) => {
    const groups = person.groupIds.map((groupId) => byId.get(groupId)).filter((group): group is StoryRecord => group?.kind === 'group');
    // Their day: the events that name a place. Untouched since it came from a module, it goes
    // back as it came, plan names and all.
    const carriedDay = isObject(extra(person).schedule) ? extra(person).schedule as unknown as PlanSchedule : null;
    const day = person.kind === 'persona' ? null : plansFromEvents(person.schedule, dayNames);
    const schedule = day && carriedDay && sameDays(day, carriedDay) ? carriedDay : day;
    const { schedule: _was, ...kept } = extra(person);
    return {
      ...kept, ...(schedule ? { schedule } : {}), id: person.id, name: person.name, description: body(person, 'description', ['background', 'description'], true),
      ...optional({
        role: person.line.slice(0, 200), pronouns: person.pronouns, draftNote: person.notes,
        appearance: body(person, 'appearance', ['appearance']), personality: body(person, 'personality', ['personality']), speech: body(person, 'speech', ['speech']),
        speciesId: groups.find((group) => group.groupKind === 'species')?.id,
      }),
      factionIds: groups.filter((group) => group.groupKind === 'faction').map((group) => group.id),
      ...flat(person),
    };
  });
  let playerId = player?.id;
  if (!playerId) {
    // A world with no persona still plays: a plain traveller on the proposal's starting budget.
    playerId = 'the-player';
    while (byId.has(playerId)) playerId = `${playerId}-1`;
    characters.push({ id: playerId, name: 'The traveller', description: '', factionIds: [], states: { force: 2, finesse: 2, focus: 2, flair: 2 }, charges: { flair: 'trained', force: 'practiced', finesse: 'practiced', focus: 'raw' } });
    notes.push('This world has no persona, so the player is a plain traveller. Add a persona to say who they are.');
  }

  const ruleset = rulesetOf(world);
  const goodIds = new Set(ruleset.goods.map((good) => good.id));
  const traded = new Set(characters.flatMap((person) => [...strings(person.sells), ...strings(person.carries)]));
  const itemGoods = of('item').filter((item) => !goodIds.has(item.id) && (item.rules?.good || traded.has(item.id))).map((item) => {
    const good = rulesFor(world, item)!.good!.value;
    return { ...good, name: lower(item.name), description: body(item, 'entry', ['entry']).slice(0, 1000) };
  });
  const items = of('item').map((item) => ({ ...extra(item), id: item.id, name: item.name, description: body(item, 'entry', ['entry'], true), ...optional({ difficulty: item.rules?.difficulty }) }));

  const own = world.rules;
  const outRuleset: Raw = {
    extends: STANDARD_RULESET_ID,
    travel: own?.travel ?? { walkKph: 4, tiers: [] },
    states: own?.states ?? [],
    actions: own?.actions ?? [],
    ...optional({ approaches: own?.approaches.length ? own.approaches : undefined, deeds: own?.deeds.length ? own.deeds : undefined, calendar: own?.calendar }),
    follow: own?.follow ?? [],
    goods: [...(own?.goods ?? []), ...itemGoods],
    // A module replaces these blocks whole, so a changed one goes out in full.
    ...Object.fromEntries(BLOCKS.flatMap((block) => (own?.[block] ? [[block, ruleset[block]]] : []))),
    ...(own && Object.keys(own.tiers).length ? { tiers: ruleset.tiers } : {}),
  };

  const standable = places.filter((place) => !AREA_KINDS.includes(place.kind));
  const startPlaceId = typeof start.startPlaceId === 'string' && byId.get(start.startPlaceId)?.kind === 'place' ? start.startPlaceId : standable[0]?.id;
  if (!startPlaceId) notes.push('This world has no place to start in. Add a place.');
  else if (startPlaceId !== start.startPlaceId) notes.push(`Play starts at ${byId.get(startPlaceId)?.name}, the first place in the world.`);
  const present = strings(start.presentCharacterIds).filter((id) => id !== playerId && people.some((person) => person.id === id));

  const moreScenarios = of('scenario').length - 1;
  if (moreScenarios > 0) notes.push(`Only the first scenario starts the game (${moreScenarios} more).`);

  // Threads: the five questions from their sections, and the milestones. A thread made in the
  // Studio with none still reaches the adventure through its Next beat, as one milestone the
  // player marks.
  const threads = of('thread').flatMap((thread) => {
    const authored = thread.rules?.thread?.milestones ?? [];
    const beat = body(thread, 'next-beat', ['next beat']).trim().slice(0, 400);
    const milestones = authored.length ? authored : beat ? [{ id: 'next-beat', text: beat, when: [], experience: 0 }] : [];
    if (!milestones.length) {
      notes.push(`${thread.name} has no milestones or next beat, so it stays in the Studio.`);
      return [];
    }
    return [{
      ...extra(thread), id: thread.id, name: thread.name, kind: thread.rules?.thread?.kind ?? 'custom',
      ...Object.fromEntries(THREAD_QUESTIONS.map((question) => [question, body(thread, question, [question]).slice(0, 2000)])),
      milestones,
    }];
  });
  if (world.records.some((entry) => (entry.kind === 'place' || entry.kind === 'group') && (entry.rules?.states || entry.rules?.maxima))) notes.push('Where a place or a group starts its states stays in the Studio for now; the adventure starts them at rest.');

  const identity = { ...(isObject(carriedWorld.identity) ? carriedWorld.identity : {}), ...optional({ description: world.premise, genre: world.genre, tone: world.tone }) };
  const module: Raw = {
    format: MODULE_FORMAT,
    id: text(carried.id) || world.id,
    name: world.name,
    version: text(carried.version) || '0.1.0',
    notes: text(carried.notes),
    source: isObject(carried.source) ? carried.source : { kind: 'local' },
    world: {
      id: world.id, name: world.name, ...carriedWorld, identity,
      places, routes: world.routes ?? (Array.isArray(carried.routes) ? carried.routes : []),
      species: groupsOf('species'), factions: groupsOf('faction'), societies: groupsOf('other', 'crew', 'profession'), families: groupsOf('family'),
      memories: of('lore').map((lore) => ({ ...extra(lore), id: lore.id, title: lore.name, description: body(lore, 'entry', ['entry'], true) })),
    },
    characters,
    relationships: Array.isArray(carried.relationships) ? carried.relationships : [],
    items,
    ruleset: outRuleset,
    ...(threads.length ? { threads } : {}),
    scenario: {
      ...start,
      title: scenarioRecord?.name ?? world.name,
      startPlaceId: startPlaceId ?? '',
      startAt: typeof start.startAt === 'number' ? start.startAt : 8 * 60,
      playerCharacterId: playerId,
      presentCharacterIds: present,
      opening: scenarioRecord ? body(scenarioRecord, 'opening', ['situation'], true).slice(0, 20000) : '',
    },
  };
  return { module, notes };
}

// What a record carried from its module, in plain words, for the Studio to show.
export function carriedWords(world: World, entry: StoryRecord): string[] {
  const carried = (entry.carried ?? {}) as Raw;
  const name = (id: unknown) => world.records.find((other) => other.id === id)?.name ?? String(id);
  const out: string[] = [];
  if (typeof carried.homeLocationId === 'string') out.push(`Lives at ${name(carried.homeLocationId)}.`);
  const work = strings(carried.workplaceLocationIds);
  if (work.length) out.push(`Works at ${work.map(name).join(', ')}.`);
  if (isObject(carried.schedule)) {
    const plans = list(carried.schedule.plans);
    const stops = plans.reduce((sum, plan) => sum + list(plan.rows).length, 0);
    out.push(`Keeps a day of ${stops} ${stops === 1 ? 'stop' : 'stops'}${plans.length > 1 ? ` over ${plans.length} plans` : ''}.`);
  }
  if (typeof carried.locationId === 'string') out.push(`Lies at ${name(carried.locationId)}.`);
  if (typeof carried.heldBy === 'string') out.push(`Carried by ${name(carried.heldBy)}.`);
  if (typeof carried.startPlaceId === 'string') out.push(`Play starts at ${name(carried.startPlaceId)}${strings(carried.presentCharacterIds).length ? `, with ${strings(carried.presentCharacterIds).map(name).join(' and ')} there` : ''}.`);
  if (carried.canonStatus === 'draft') out.push('Marked as a draft.');
  return out;
}
