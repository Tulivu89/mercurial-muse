// Who and what a chat has in it: the character, the player's persona, the scenario, and the part
// of the world that can reach this chat. Both context profiles start from this.
import { bondConditionsFor } from '../records/charactercard.js';
import { recordById } from '../records/world.js';
import type { StoryRecord, World } from '../records/schema.js';
import { messageText, type Chat } from './chat.js';
import { readSchedule, resolveSet, type SetPick, type StatusRead } from './time.js';

export interface Scene {
  // The world as this chat sees it. The character, persona and scenario are whole, each set
  // showing the member this moment calls for. Lore the chat has switched off is gone, other
  // scenarios and personas are gone, other chat characters bring nothing, and every other record
  // keeps only what a key or a condition brings in, so someone else's Always text stays out.
  view: World;
  character: StoryRecord;
  persona: StoryRecord | null;
  scenario: StoryRecord | null;
  charName: string;
  userName: string;
  hereIds: string[];
  conditionIds: string[];
  relationship: Chat['relationship'];
  // The moment on the chat's clock, and what the character's schedule has on.
  nowMs: number;
  status: StatusRead;
  // Which member each set is showing, and why.
  picks: SetPick[];
}

export function sceneFor(world: World, chat: Chat, nowMs: number): Scene | null {
  const found = recordById(world, chat.characterId);
  if (!found || found.kind !== 'character') return null;
  const status = readSchedule(found.schedule, chat.relationship, nowMs);
  const picks: SetPick[] = [];
  // A set follows the pin, then the schedule, then its own usual member.
  const dressed = (record: StoryRecord | undefined): StoryRecord | null => {
    if (!record) return null;
    if (!record.sets.length) return record;
    return { ...record, sets: record.sets.map((set) => { const pick = resolveSet(record, set, chat.pins, status.live); picks.push(pick); return { ...set, active: pick.memberId }; }) };
  };
  const character = dressed(found)!;
  const persona = dressed(recordById(world, chat.personaId));
  const scenario = dressed(recordById(world, chat.scenarioId));
  const core = new Map([character, persona, scenario].filter(Boolean).map((record) => [record!.id, record!]));
  const off = new Set(chat.loreOff);
  const records = world.records.flatMap((record): StoryRecord[] => {
    if (core.has(record.id)) return [core.get(record.id)!];
    if (record.kind === 'scenario' || record.kind === 'persona') return [];
    if (record.kind === 'lore') return off.has(record.id) ? [] : [record];
    if (record.kind === 'group') return [record];
    // Another character's sections are their own brains, written for chats with them: keys like
    // *where are you from* or *kiss* would bring in every resident's at once. Someone people chat
    // with brings nothing into anyone else's chat; who they are to others lives in groups and lore.
    // Anyone else keeps what their name brings in, but never a bond-gated section, since the bond
    // in this chat is with someone else.
    if (record.kind === 'character') return record.chatListed ? [{ ...record, sections: [], sets: [] }] : [{ ...record, sections: record.sections.filter((section) => section.reach === 'named'), sets: [] }];
    return [{ ...record, sections: record.sections.filter((section) => section.reach === 'named' || section.reach === 'when'), sets: [] }];
  });
  return {
    // A chat has no premise of its own to send: the scenario carries the situation.
    view: { ...world, premise: '', records },
    character, persona, scenario,
    charName: character.name,
    userName: persona?.name ?? chat.userName,
    hereIds: [...core.keys()],
    conditionIds: bondConditionsFor(chat.relationship),
    relationship: chat.relationship,
    nowMs, status, picks,
  };
}

// What was just said, for Named keys: the last few messages and what the player is typing.
export function recentText(chat: Chat, upTo: number, draft = '', turns = 6): string {
  return [...chat.messages.slice(Math.max(0, upTo - turns), upTo).map(messageText), draft].join('\n');
}

export function lorePool(world: World): StoryRecord[] {
  return world.records.filter((record) => record.kind === 'lore');
}
