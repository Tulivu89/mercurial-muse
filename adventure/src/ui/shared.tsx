// Pieces several screens share: how a state, a ledger line or a record is shown.
import {
  LADDER_NAMES, band, durationWords, forYou, inSentence, labelFor, shortLabel, pairName, read, render, stateDefFor, type Character, type Good, type LedgerEntry, type PraxisModule, type StateDef, type StateValues,
} from '../engine';
import { Diamond } from './icons';

export const APPROACH_COLORS: Record<string, string> = {
  force: 'var(--force)', finesse: 'var(--finesse)', focus: 'var(--focus)', flair: 'var(--flair)',
};

// A state's colour: its own if it is an approach, else the approach that owns it, else none.
export function stateColor(def: StateDef): string {
  return APPROACH_COLORS[def.id] ?? (def.approach ? APPROACH_COLORS[def.approach.owner] : undefined) ?? 'var(--text-2)';
}

export function initials(name: string): string {
  const words = name.replace(/^(The|A|An) /, '').split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase() + words[0]!.slice(1, 2);
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

// Records keep fields this app does not name (Orbis documents are free-form), so these read
// them loosely.
const field = (record: object | null | undefined, key: string): unknown => (record ? (record as Record<string, unknown>)[key] : undefined);

export function isDraft(record: object | null | undefined): boolean {
  return field(record, 'canonStatus') === 'draft';
}

export function DraftTag({ record, show }: { record: object | null | undefined; show: boolean }) {
  return show && isDraft(record) ? <span className="tag draft">Draft</span> : null;
}

export function isLocalRecord(record: object | null | undefined): boolean {
  return field(record, 'origin') === 'local';
}

export function YoursTag({ record }: { record: object | null | undefined }) {
  return isLocalRecord(record) ? <span className="tag yours">Yours</span> : null;
}

// "has not signed the Covenant" said of "you".
export const bandForYou = forYou;

// A bounded value as a row of segments, or one bar when the range is long.
export function StateBar({ def, value }: { def: StateDef; value: number }) {
  const lo = Math.min(def.min, def.max);
  const hi = Math.max(def.min, def.max);
  const span = hi - lo;
  const color = stateColor(def);
  if (span > 0 && span <= 12) {
    return (
      <span className="bar" aria-hidden="true">
        {Array.from({ length: span }, (_, index) => <span key={index} style={index < value - lo ? { background: color } : undefined} />)}
      </span>
    );
  }
  const share = span > 0 ? Math.max(0, Math.min(1, (value - lo) / span)) : 0;
  return (
    <span className="bar continuous" aria-hidden="true">
      <span style={{ background: `linear-gradient(90deg, ${color} ${share * 100}%, var(--rule) ${share * 100}%)` }} />
    </span>
  );
}

export function Pips({ def, value }: { def: StateDef; value: number }) {
  const max = Math.max(def.min, def.max);
  const color = APPROACH_COLORS[def.id] ?? 'var(--text-2)';
  return (
    <span className="pips" role="img" aria-label={`${def.name} ${value} of ${max}`}>
      {Array.from({ length: max }, (_, index) => <Diamond key={index} color={color} filled={index < value} />)}
    </span>
  );
}

export interface StateReading {
  def: StateDef;
  value: number;
  word: string;
  atRest: boolean;
}

export function readState(module: PraxisModule, values: StateValues, defId: string, owner: string): StateReading | null {
  const def = stateDefFor(module, defId, owner);
  if (!def) return null;
  const value = read(values, def, owner);
  const reading = band(def, value);
  return { def, value, word: reading.banded ? reading.short : String(value), atRest: reading.atRest };
}

// The states one character holds that a player would look at, in catalog order.
export function characterStates(module: PraxisModule, character: Character, isPlayer: boolean): StateDef[] {
  return module.ruleset.states
    .filter((def) => def.display !== 'hidden')
    .filter((def) => def.scope === 'char' || (def.scope === 'protagonist' && isPlayer) || (def.scope === 'npc' && !isPlayer))
    .map((def) => stateDefFor(module, def.id, character.id) ?? def);
}

export function SourceTag({ source }: { source: 'rule' | 'player' }) {
  return source === 'player' ? <span className="src you">Yours</span> : <span className="src">Rule</span>;
}

// One ledger line in the player's words. The player's own character is "You".
export function describeEntry(module: PraxisModule, entry: LedgerEntry): string {
  const playerId = module.scenario.playerCharacterId;
  const placeName = (id: string | null) => (id === null ? 'nowhere' : module.world.places.find((place) => place.id === id)?.name ?? id);
  const personName = (id: string) => (id === playerId ? 'You' : module.characters.find((character) => character.id === id)?.name
    ?? module.items.find((item) => item.id === id)?.name
    ?? module.world.places.find((place) => place.id === id)?.name
    ?? module.world.factions.find((group) => group.id === id)?.name
    ?? id);
  switch (entry.kind) {
    case 'move':
      if (entry.to === null) return `${personName(entry.characterId)} left the story`;
      return `${personName(entry.characterId)} · ${entry.from === null ? 'arrived at' : `${placeName(entry.from)} to`} ${inSentence(placeName(entry.to))}${entry.minutes ? ` · ${durationWords(entry.minutes)}` : ''}`;
    case 'clock':
      return entry.to >= entry.from ? `${durationWords(entry.to - entry.from)} passed${entry.reason === 'set by hand' ? '' : ` (${entry.reason})`}` : `Clock turned back ${durationWords(entry.from - entry.to)}`;
    case 'state': {
      const def = stateDefFor(module, entry.defId, entry.owner);
      const word = def ? band(def, entry.to) : null;
      if (entry.owner.includes('|')) {
        const pair = pairName(module, entry.owner, playerId);
        return `${pair.charAt(0).toUpperCase()}${pair.slice(1)}${word?.banded ? `: ${word.label}` : ` · ${def?.name ?? entry.defId}`} · ${entry.from} → ${entry.to}`;
      }
      const who = personName(entry.owner);
      // Your purse in numbers, as you see it.
      if (entry.defId === module.ruleset.trade?.coin) return `Coin · ${entry.from} → ${entry.to}`;
      // A state with its own sentence ("You have studied the door.") reads best as that.
      if (def?.line && word?.banded) return `${render(def, who, entry.to, true).replace(/^\[|\]$/g, '')} · ${entry.from} → ${entry.to}`;
      // Someone else's in their own terms, up to any explanation: "A garrison guard has given way".
      if (word?.banded) return `${who} ${entry.owner === playerId ? bandForYou(word.short) : shortLabel(def!, labelFor(def!, entry.to, false))} · ${entry.from} → ${entry.to}`;
      return `${who} · ${def?.name ?? entry.defId} ${entry.from} → ${entry.to}`;
    }
    case 'follow':
      return entry.as === null ? `${personName(entry.characterId)} stops coming with you` : `${personName(entry.characterId)} comes with you`;
    case 'goods': {
      const good = module.ruleset.goods.find((entry2) => entry2.id === entry.goodId);
      return `You · ${good?.name.replace(/^(a|an) /, '') ?? entry.goodId} ${entry.from} → ${entry.to}`;
    }
    case 'work': {
      const good = module.ruleset.goods.find((entry2) => entry2.id === entry.goodId);
      const what = good?.name ?? entry.goodId;
      return { start: `You begin making ${what}`, finish: `You finish ${what}`, spoil: `${what.charAt(0).toUpperCase()}${what.slice(1)} is spoiled`, abandon: `You give up making ${what}` }[entry.event];
    }
    case 'grow': {
      const approach = module.ruleset.approaches.find((entry2) => entry2.id === entry.approach)?.name ?? entry.approach;
      return `${personName(entry.characterId)} · ${approach} ${entry.from ? LADDER_NAMES[entry.from] : 'no charges'} → ${entry.to ? LADDER_NAMES[entry.to] : 'no charges'}`;
    }
  }
}

export function speciesOf(module: PraxisModule, character: Character): string {
  return character.speciesId ? module.world.species.find((species) => species.id === character.speciesId)?.name ?? '' : '';
}

export function groupsOf(module: PraxisModule, character: Character): string[] {
  const groups = [...module.world.factions, ...module.world.societies];
  return character.factionIds.map((id) => groups.find((group) => group.id === id)?.name).filter((name): name is string => Boolean(name));
}

export function roleOf(character: Character): string {
  return typeof character.role === 'string' ? character.role : '';
}

export function newId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

// What a good does, in a few words.
export function goodWords(good: Good): string {
  switch (good.kind) {
    case 'weapon': return `+${good.harm ?? 0} harm${good.hidden ? ', can be hidden' : ''}`;
    case 'armour': return `armour ${good.armour ?? 0}${good.hinders.length ? `, hinders ${good.hinders.join(', ')}` : ''}`;
    case 'help': return `a boost die for ${good.helps?.approaches.join(', ') ?? 'something'}`;
    case 'use': return [...good.restores.map((effect) => `${effect.add > 0 ? '+' : '−'}${Math.abs(effect.add)} ${effect.stateId}${effect.who === 'place' ? ' here' : ''}`), 'used up'].join(', ');
    default: return 'goods';
  }
}
