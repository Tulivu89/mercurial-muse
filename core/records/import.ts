// One way in for any card file: a CharacterRoom contact, user or scenario card, or a Character
// Card V1, V2 or V3 as JSON or PNG.
import type { World } from './schema.js';
import { importRoomCard, type ImportResult } from './charactercard.js';
import { cardFromPng, importTavernCard, isPng, isTavernCard } from './tavern.js';

type Ids = () => string;

export function importCardJson(world: World, raw: unknown, ids: Ids, now: number): ImportResult {
  const type = raw && typeof raw === 'object' ? (raw as { cardType?: unknown }).cardType : undefined;
  if (type === 'contact' || type === 'user' || type === 'scenario') return importRoomCard(world, raw, ids, now);
  if (isTavernCard(raw)) return importTavernCard(world, raw, ids, now);
  return { ok: false, errors: ['This file is not a card Inkwyrm knows: a CharacterRoom card, or a Character Card V1, V2 or V3.'] };
}

// A file's bytes: a PNG with a card inside, or JSON.
export function importCardFile(world: World, bytes: Uint8Array, ids: Ids, now: number): ImportResult & { fromPng?: boolean } {
  if (isPng(bytes)) {
    const read = cardFromPng(bytes);
    if (!read.ok) return { ok: false, errors: [read.error] };
    return { ...importCardJson(world, read.card, ids, now), fromPng: true };
  }
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder().decode(bytes)); } catch { return { ok: false, errors: ['This file is neither JSON nor a PNG card.'] }; }
  return importCardJson(world, raw, ids, now);
}
