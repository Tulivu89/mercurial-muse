// The state sentences a world would send in a moment. A number reaches the model only as the
// sentence its band writes, and only while it is off its resting band (docs/records.md, Never).
// The Studio's "In context now" shows them under the record they belong to, so an author sees
// what the narrator will see.
//
// Pure: no DOM, no network, no storage.

import { contextFor, roughTokens, type ContextAnswer, type ContextBlock, type ContextPart, type Situation } from '../records/context.js';
import type { StoryRecord, World } from '../records/schema.js';
import { rulesFor } from './for.js';
import { fact, speaks } from './state.js';
import { rulesetOf } from './world-rules.js';

export interface StateSentence { stateId: string; name: string; text: string }

// What a record's states say right now: only those off their resting band.
export function stateSentences(world: World, record: StoryRecord): StateSentence[] {
  const reading = rulesFor(world, record);
  if (!reading) return [];
  return reading.states.filter((state) => state.speaks && state.sentence).map((state) => ({ stateId: state.def.id, name: state.def.name, text: state.sentence }));
}

// The world's own states, such as a war that has started, where they start.
export function worldSentences(world: World): StateSentence[] {
  return rulesetOf(world).states
    .filter((def) => def.scope === 'world' && speaks(def, def.start))
    .map((def) => ({ stateId: def.id, name: def.name, text: fact(def, world.name, def.start) }));
}

// A part written by the rules rather than the author.
export interface StatePart { title: string; reach: 'state'; text: string }
export interface RuledBlock extends Omit<ContextBlock, 'parts'> { parts: (ContextPart | StatePart)[] }
export interface RuledAnswer { blocks: RuledBlock[]; tokens: number }

// contextFor, with each record in the scene followed by what its states say.
export function contextWithRules(world: World, situation: Situation): RuledAnswer {
  const answer: ContextAnswer = contextFor(world, situation);
  const blocks: RuledBlock[] = answer.blocks.map((block) => ({ ...block, parts: [...block.parts] }));
  let tokens = answer.tokens;
  const add = (block: RuledBlock, sentences: StateSentence[]) => {
    for (const sentence of sentences) {
      block.parts.push({ title: sentence.name, reach: 'state', text: sentence.text });
      tokens += roughTokens(sentence.text);
    }
  };

  const fromWorld = worldSentences(world);
  if (fromWorld.length) {
    let block = blocks.find((entry) => entry.recordId === null);
    if (!block) {
      block = { recordId: null, name: world.name, kind: 'world', why: 'always', parts: [] };
      blocks.unshift(block);
      tokens += roughTokens(world.name);
    }
    add(block, fromWorld);
  }

  for (const id of new Set(situation.hereIds)) {
    const record = world.records.find((entry) => entry.id === id);
    if (!record) continue;
    const sentences = stateSentences(world, record);
    if (!sentences.length) continue;
    let block = blocks.find((entry) => entry.recordId === record.id);
    if (!block) {
      block = { recordId: record.id, name: record.name, kind: record.kind, why: 'here', parts: [] };
      blocks.push(block);
      tokens += roughTokens(record.name);
    }
    add(block, sentences);
  }
  return { blocks, tokens };
}

// The answer as plain text, the way a prompt would carry it. State sentences stand on their own.
export function ruledText(answer: RuledAnswer): string {
  return answer.blocks.map((block) => [
    `[${block.name}]`,
    ...block.parts.map((part) => (part.reach === 'line' || part.reach === 'state' ? part.text : `${part.title}: ${part.text}`)),
  ].join('\n')).join('\n\n');
}
