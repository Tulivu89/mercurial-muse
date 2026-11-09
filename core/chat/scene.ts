// Who and what a chat has in it: the character, the player's persona, the scenario, and the part
// of the world that can reach this chat. Both context profiles start from this.
import { bondConditionsFor } from '../records/charactercard.js';
import { recordById } from '../records/world.js';
import type { StoryRecord, World } from '../records/schema.js';
import { messageText, type Chat } from './chat.js';

export interface Scene {
  // The world as this chat sees it. The character, persona and scenario are whole. Lore the chat
  // has switched off is gone, other scenarios and personas are gone, and every other record
  // keeps only what a key or a condition brings in, so someone else's Always text stays out.
  view: World;
  character: StoryRecord;
  persona: StoryRecord | null;
  scenario: StoryRecord | null;
  charName: string;
  userName: string;
  hereIds: string[];
  conditionIds: string[];
}

export function sceneFor(world: World, chat: Chat): Scene | null {
  const character = recordById(world, chat.characterId);
  if (!character || character.kind !== 'character') return null;
  const persona = recordById(world, chat.personaId) ?? null;
  const scenario = recordById(world, chat.scenarioId) ?? null;
  const core = new Set([character.id, persona?.id, scenario?.id].filter(Boolean) as string[]);
  const off = new Set(chat.loreOff);
  const records = world.records.flatMap((record): StoryRecord[] => {
    if (core.has(record.id)) return [record];
    if (record.kind === 'scenario' || record.kind === 'persona') return [];
    if (record.kind === 'lore') return off.has(record.id) ? [] : [record];
    if (record.kind === 'group') return [record];
    return [{ ...record, sections: record.sections.filter((section) => section.reach === 'named' || section.reach === 'when'), sets: [] }];
  });
  return {
    // A chat has no premise of its own to send: the scenario carries the situation.
    view: { ...world, premise: '', records },
    character, persona, scenario,
    charName: character.name,
    userName: persona?.name ?? chat.userName,
    hereIds: [...core],
    conditionIds: bondConditionsFor(chat.relationship),
  };
}

// What was just said, for Named keys: the last few messages and what the player is typing.
export function recentText(chat: Chat, upTo: number, draft = '', turns = 6): string {
  return [...chat.messages.slice(Math.max(0, upTo - turns), upTo).map(messageText), draft].join('\n');
}

export function lorePool(world: World): StoryRecord[] {
  return world.records.filter((record) => record.kind === 'lore');
}
