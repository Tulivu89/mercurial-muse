// Records, read as the CharacterRoom cards the AetherRoom kernel takes. A record's Personality
// and Appearance sections fill the sheet's own fields; its other standing sections become
// always-on brains; Named sections become keyed brains; a section behind a bond condition is in
// when the chat's relationship reaches it (CharacterRoom's ladder, D-126) and gone when not.
import { ownTerms } from '../records/context.js';
import type { Section, StoryRecord } from '../records/schema.js';
import { recordById } from '../records/world.js';
import type { KernelBrain, KernelCard, KernelFloaty, KernelKeyedBrain } from './aetherroom.js';
import type { Scene } from './scene.js';
import { kernelSchedule } from './time.js';

const titled = (record: StoryRecord, pattern: RegExp) => record.sections.filter((section) => pattern.test(section.title.trim()) && (section.reach === 'here' || section.reach === 'always') && section.text.trim());
const joined = (sections: Section[]) => sections.map((section) => section.text.trim()).join('\n');

const PERSONA = /^(personality|who you are)$/i;
const APPEARANCE = /^appearance$/i;
const ENVIRONMENT = /^environment$/i;
const SCENE = /^(scene|situation)$/i;

function card(record: StoryRecord, scene: Scene, fields: RegExp[]): KernelCard {
  const held = new Set(scene.conditionIds);
  const brains: KernelBrain[] = [];
  for (const section of record.sections) {
    if (!section.text.trim() || fields.some((pattern) => pattern.test(section.title.trim()))) continue;
    const standing = section.reach === 'here' || section.reach === 'always' || (section.reach === 'when' && !section.keys.length && !!section.when && held.has(section.when));
    if (standing) brains.push({ name: section.title.trim() || 'Brain', content: section.text });
  }
  for (const set of record.sets) {
    const member = set.members.find((candidate) => candidate.id === set.active);
    if (member?.text.trim() && (set.reach === 'here' || set.reach === 'always')) brains.push({ name: `${set.title}: ${member.name}`, content: member.text });
  }
  const species = record.groupIds.map((id) => recordById(scene.view, id)).find((group) => group?.groupKind === 'species');
  return {
    id: record.id,
    name: record.name,
    gender: record.gender,
    pronouns: record.pronouns,
    species: species?.name ?? '',
    tags: record.tags.join(', '),
    brains,
    brainsConditional: [],
  };
}

const entryName = (record: StoryRecord, section: Section, own: boolean) => {
  const title = section.title.trim();
  if (own) return title || record.name;
  return !title || /^entry$/i.test(title) || title === record.name ? record.name : `${record.name}: ${title}`;
};

export interface Sheet { char: KernelCard; user: KernelCard; scenario?: KernelCard; floaty: KernelFloaty[] }

// CharacterRoom's kernel matches keys case-sensitively, so a key written "echydna" never fires on
// "Echydna", and "what do you want" never fires at the start of a sentence. Authors write keys in
// lower case (the General profile matches without case), so each key also goes in capitalised.
export function keyVariants(keys: readonly string[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    for (const form of [key, key.charAt(0).toUpperCase() + key.slice(1)]) if (form.trim() && !out.includes(form)) out.push(form);
  }
  return out;
}

export function sheetFor(scene: Scene): Sheet {
  const { character, persona, scenario } = scene;
  const held = new Set(scene.conditionIds);
  const core = new Set(scene.hereIds);

  const char: KernelCard = {
    ...card(character, scene, [PERSONA, APPEARANCE]),
    persona: joined(titled(character, PERSONA)),
    appearance: joined(titled(character, APPEARANCE)),
    schedule: kernelSchedule(character.schedule, scene.relationship),
    exampleChats: character.examples.filter((chat) => chat.messages.length).map((chat) => ({
      name: chat.name,
      userName: chat.userName || scene.userName,
      messages: chat.messages.map((message) => ({ isContact: message.fromCharacter, text: message.text, emotion: message.emotion })),
    })),
  };
  const user: KernelCard = persona
    ? { ...card(persona, scene, [PERSONA, APPEARANCE]), persona: joined(titled(persona, PERSONA)), appearance: joined(titled(persona, APPEARANCE)) }
    : { id: 'user', name: scene.userName, brains: [], brainsConditional: [] };
  const scenarioCard: KernelCard | undefined = scenario
    ? { ...card(scenario, scene, [ENVIRONMENT, SCENE]), environment: joined(titled(scenario, ENVIRONMENT)), scene: joined(titled(scenario, SCENE)) }
    : undefined;

  // Everything a key can bring in rides on the contact card, which is where the kernel looks.
  const keyed: KernelKeyedBrain[] = [];
  const floaty: KernelFloaty[] = [];
  const order = [character, persona, scenario, ...scene.view.records.filter((record) => !core.has(record.id))].filter(Boolean) as StoryRecord[];
  for (const record of order) {
    const own = core.has(record.id);
    for (const section of record.sections) {
      if (!section.text.trim()) continue;
      const name = entryName(record, section, own);
      const keys = keyVariants(section.keys.length ? section.keys : ownTerms(record));
      if (section.reach === 'named') keyed.push({ name, content: section.text, keys, requiredIntimacy: 'none' });
      else if (section.reach === 'when' && section.when && held.has(section.when) && (section.keys.length || !own)) keyed.push({ name, content: section.text, keys, requiredIntimacy: 'none' });
      else if (!own && section.reach === 'always') floaty.push({ id: `${record.id}:${section.id}`, active: true, entry: { name, content: section.text } });
    }
  }
  char.brainsConditional = keyed;
  return { char, user, scenario: scenarioCard, floaty };
}
