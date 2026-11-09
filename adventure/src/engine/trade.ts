// Trade: coin, goods, and what changes hands.
//
// Coin is a number for the player and a band for the narrator: what you could afford. Goods
// are kinds of thing on the ten-step scale (a knife 1, a sword 10, a horse 100), and the
// player's pack counts them. Only exchanges are counted: buying, selling, taking what someone
// down carries, using something up. Each is a turn the rules settle, like a scene action.
//
// Goods do one thing each: a help adds a boost die where it fits, a weapon adds harm to a
// Force success against a person, armour takes the first Health a failure costs, and a use
// is spent when used. Bribes and bargains are here too: a bribe makes a check easier and is
// paid only on success; a bargain, built by Flair, takes a quarter off the next purchase from
// that seller per point. See Praxis — Growth, Challenge and Economy.

import { calendarOf } from './world';
import { hourOf, weekdayOf } from './clock';
import { stateDefFor, type Character, type PraxisModule, type SceneAction } from './module';
import { fact, read, write, type StateTerminal, type StateValues } from './state';
import { definite, listOf, midSentence, pronounsOf } from './words';
import { playerOf, type LedgerEntry, type Save } from './session';

export type Good = PraxisModule['ruleset']['goods'][number];

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function goodOf(module: PraxisModule, goodId: string): Good | undefined {
  return module.ruleset.goods.find((good) => good.id === goodId);
}

// "a sword", "two poultices", "12 knives".
export function goodsPhrase(good: Good, count: number): string {
  if (count === 1) return good.name;
  const plural = good.plural ?? `${good.name.replace(/^(a|an) /, '')}s`;
  return `${NUMBERS[count] ?? count} ${plural}`;
}

// What the pack holds, in a sentence's words: "a sword, a mail shirt and two poultices".
export function packWords(module: PraxisModule, pack: Readonly<Record<string, number>>): string {
  return listOf(Object.entries(pack).flatMap(([goodId, count]) => {
    const good = goodOf(module, goodId);
    return good && count > 0 ? [goodsPhrase(good, count)] : [];
  }));
}

export function carried(module: PraxisModule, save: Save): { good: Good; count: number }[] {
  return Object.entries(save.pack).flatMap(([goodId, count]) => {
    const good = goodOf(module, goodId);
    return good && count > 0 ? [{ good, count }] : [];
  });
}

// The weapon or armour that counts: the best one you carry.
export function bestCarried(module: PraxisModule, save: Save, kind: 'weapon' | 'armour'): Good | null {
  const score = (good: Good) => (kind === 'weapon' ? good.harm ?? 0 : good.armour ?? 0);
  const options = carried(module, save).map((entry) => entry.good).filter((good) => good.kind === kind);
  return options.sort((a, b) => score(b) - score(a))[0] ?? null;
}

// The help that fits a check, if you carry one: the approach, and the target's kind or id.
export function helpFor(module: PraxisModule, save: Save, approachId: string, subject: { id: string; kind: 'person' | 'thing' | 'place' | 'work' }): Good | null {
  return carried(module, save).map((entry) => entry.good).find((good) => {
    const helps = good.kind === 'help' ? good.helps : undefined;
    if (!helps || !helps.approaches.includes(approachId)) return false;
    if (helps.ids.length) return helps.ids.includes(subject.id);
    return !helps.kinds.length || (subject.kind !== 'work' && helps.kinds.includes(subject.kind));
  }) ?? null;
}

const tierOf = (person: Character) => person.tier ?? 'minion';

// The bribe that tempts someone, or null when they are not for sale.
export function priceOf(module: PraxisModule, person: Character): number | null {
  const trade = module.ruleset.trade;
  if (!trade || !person.forSale) return null;
  return person.price ?? trade.price[tierOf(person)] * (person.gang ?? 1);
}

// The coin someone carries, for taking when they are down or have given way.
export function purseOf(module: PraxisModule, person: Character): number {
  const trade = module.ruleset.trade;
  if (!trade) return 0;
  return person.purse ?? trade.purse[tierOf(person)] * (person.gang ?? 1);
}

const valueOf = (module: PraxisModule, save: Save, stateId: string | undefined, owner: string): number => {
  if (!stateId) return 0;
  const def = stateDefFor(module, stateId, owner);
  return def ? read(save.values, def, owner) : 0;
};

export function coinOf(module: PraxisModule, save: Save): number {
  return valueOf(module, save, module.ruleset.trade?.coin, playerOf(module));
}

// What a seller asks for a good now: its worth, less a quarter for each point of bargain.
export function askingPrice(module: PraxisModule, save: Save, sellerId: string, good: Good): number {
  const bargain = Math.min(2, valueOf(module, save, module.ruleset.trade?.bargain, sellerId));
  return Math.max(0, Math.round(good.worth * (1 - bargain / 4)));
}

// What someone pays you for a good: its worth if they sell such things, less otherwise.
export function offerFor(module: PraxisModule, sellerId: string, good: Good): number {
  const seller = module.characters.find((entry) => entry.id === sellerId);
  const back = module.ruleset.trade?.sellBack ?? 0.5;
  return seller?.sells.includes(good.id) ? good.worth : Math.floor(good.worth * back);
}

export interface Stall {
  seller: Character;
  refusing: boolean;
  bargain: number;
  goods: { good: Good; price: number }[];
}

// Everyone here who sells, with their prices now.
export function stallsHere(module: PraxisModule, save: Save): Stall[] {
  const playerId = playerOf(module);
  const here = save.positions[playerId];
  const trade = module.ruleset.trade;
  return module.characters
    .filter((person) => person.id !== playerId && person.sells.length && here && save.positions[person.id] === here)
    .map((seller) => ({
      seller,
      refusing: valueOf(module, save, trade?.refusing, seller.id) > 0,
      bargain: valueOf(module, save, trade?.bargain, seller.id),
      goods: seller.sells.flatMap((goodId) => {
        const good = goodOf(module, goodId);
        return good ? [{ good, price: askingPrice(module, save, seller.id, good) }] : [];
      }),
    }));
}

// Someone you can take from: here, down or given way, and not taken from yet.
export function canLoot(module: PraxisModule, save: Save, personId: string): boolean {
  const playerId = playerOf(module);
  const person = module.characters.find((entry) => entry.id === personId);
  const fight = module.ruleset.fight;
  if (!person || personId === playerId || !fight || save.positions[personId] !== save.positions[playerId]) return false;
  if (save.earned.includes(`looted:${personId}`)) return false;
  if (!purseOf(module, person) && !person.carries.length) return false;
  const ended = [fight.harm, ...fight.yields.map((rule) => rule.stateId)].some((stateId) => {
    const def = stateDefFor(module, stateId, personId);
    return def ? read(save.values, def, personId) <= def.min : false;
  });
  return ended;
}

// Whether an authored action's opening hours hold now.
export function openNow(module: PraxisModule, save: Save, action: SceneAction): boolean {
  const open = action.open;
  if (!open) return true;
  const calendar = calendarOf(module);
  if (open.weekdays.length && !open.weekdays.includes(weekdayOf(calendar, save.clock))) return false;
  const hour = hourOf(save.clock);
  const from = open.fromHour ?? 0;
  const to = open.toHour ?? 24;
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

export type Exchange =
  | { ok: true; save: Save; entries: LedgerEntry[]; terminals: StateTerminal[]; input: string; outcome: string }
  | { ok: false; reason: string };

// A small ledger-writing helper for one exchange.
function writer(module: PraxisModule, save: Save) {
  let values: StateValues = save.values;
  let pack: Record<string, number> = { ...save.pack };
  const entries: LedgerEntry[] = [];
  const terminals: StateTerminal[] = [];
  return {
    set(stateId: string, owner: string, next: (current: number) => number) {
      const def = stateDefFor(module, stateId, owner);
      if (!def) return;
      const result = write(values, def, owner, next(read(values, def, owner)), 'rule');
      values = result.values;
      if (result.change) entries.push({ kind: 'state', at: save.clock, ...result.change });
      if (result.terminal) terminals.push(result.terminal);
    },
    pack(goodId: string, add: number) {
      const from = pack[goodId] ?? 0;
      const next = Math.max(0, from + add);
      if (next) pack[goodId] = next;
      else delete pack[goodId];
      if (next !== from) entries.push({ kind: 'goods', at: save.clock, goodId, from, to: next, source: 'rule' });
    },
    done(extra: Partial<Save> = {}): { save: Save; entries: LedgerEntry[]; terminals: StateTerminal[] } {
      let out: Save = { ...save, values, pack, ...extra, ledger: [...save.ledger, ...entries] };
      const armour = renewArmour(module, save, out);
      out = armour.save;
      return { save: out, entries: [...entries, ...armour.entries], terminals };
    },
  };
}

// When the armour you carry changes, what it will take is set afresh.
export function renewArmour(module: PraxisModule, before: Save, after: Save, always = false): { save: Save; entries: LedgerEntry[] } {
  const stateId = module.ruleset.trade?.armour;
  if (!stateId) return { save: after, entries: [] };
  const was = bestCarried(module, before, 'armour')?.armour ?? 0;
  const now = bestCarried(module, after, 'armour')?.armour ?? 0;
  if (!always && was === now) return { save: after, entries: [] };
  const playerId = playerOf(module);
  const def = stateDefFor(module, stateId, playerId);
  if (!def) return { save: after, entries: [] };
  const result = write(after.values, def, playerId, now, 'rule');
  if (!result.change) return { save: after, entries: [] };
  const entry: LedgerEntry = { kind: 'state', at: after.clock, ...result.change };
  return { save: { ...after, values: result.values, ledger: [...after.ledger, entry] }, entries: [entry] };
}

const nameOf = (person: Character) => definite(person.name);

export function buy(module: PraxisModule, save: Save, sellerId: string, goodId: string): Exchange {
  const trade = module.ruleset.trade;
  if (!trade) return { ok: false, reason: 'This world has no trade.' };
  const stall = stallsHere(module, save).find((entry) => entry.seller.id === sellerId);
  if (!stall) return { ok: false, reason: 'They are not here to sell to you.' };
  const offer = stall.goods.find((entry) => entry.good.id === goodId);
  if (!offer) return { ok: false, reason: `${nameOf(stall.seller)} does not sell that.` };
  if (stall.refusing) return { ok: false, reason: `${nameOf(stall.seller)} won't deal with you today.` };
  const coin = coinOf(module, save);
  if (coin < offer.price) return { ok: false, reason: `That costs ${offer.price} coin. You have ${coin}.` };
  const w = writer(module, save);
  w.set(trade.coin, playerOf(module), (current) => current - offer.price);
  if (trade.bargain && stall.bargain) w.set(trade.bargain, sellerId, () => 0);
  w.pack(goodId, 1);
  const done = w.done();
  const seller = midSentence(nameOf(stall.seller));
  return {
    ok: true,
    ...done,
    input: `I buy ${offer.good.name} from ${seller}.`,
    outcome: `You pay ${seller} ${offer.price} coin${stall.bargain ? ', the price you bargained for,' : ''} and get ${offer.good.name}.`,
  };
}

export function sell(module: PraxisModule, save: Save, buyerId: string, goodId: string): Exchange {
  const trade = module.ruleset.trade;
  if (!trade) return { ok: false, reason: 'This world has no trade.' };
  const stall = stallsHere(module, save).find((entry) => entry.seller.id === buyerId);
  if (!stall) return { ok: false, reason: 'They are not here to buy from you.' };
  if (stall.refusing) return { ok: false, reason: `${nameOf(stall.seller)} won't deal with you today.` };
  const good = goodOf(module, goodId);
  if (!good || !(save.pack[goodId] ?? 0)) return { ok: false, reason: 'You do not have that.' };
  const paid = offerFor(module, buyerId, good);
  const w = writer(module, save);
  w.set(trade.coin, playerOf(module), (current) => current + paid);
  w.pack(goodId, -1);
  const done = w.done();
  const buyer = midSentence(nameOf(stall.seller));
  return {
    ok: true,
    ...done,
    input: `I sell ${good.name} to ${buyer}.`,
    outcome: paid ? `${capitalFirst(buyer)} takes ${good.name} and pays you ${paid} coin.` : `${capitalFirst(buyer)} takes ${good.name} off your hands for nothing.`,
  };
}

const capitalFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function loot(module: PraxisModule, save: Save, personId: string): Exchange {
  const trade = module.ruleset.trade;
  const person = module.characters.find((entry) => entry.id === personId);
  if (!trade || !person) return { ok: false, reason: 'There is no one to take from.' };
  if (!canLoot(module, save, personId)) return { ok: false, reason: `${nameOf(person)} has nothing for you to take now.` };
  const w = writer(module, save);
  const coin = purseOf(module, person);
  if (coin) w.set(trade.coin, playerOf(module), (current) => current + coin);
  for (const goodId of person.carries) w.pack(goodId, 1);
  const done = w.done({ earned: [...save.earned, `looted:${personId}`] });
  const goods = person.carries.flatMap((goodId) => goodOf(module, goodId)?.name ?? []);
  const what = listOf([...(coin ? [`${coin} coin`] : []), ...goods]);
  const them = midSentence(nameOf(person));
  return { ok: true, ...done, input: `I take what ${them} carries.`, outcome: `You take ${what} from ${them}.` };
}

export function useGood(module: PraxisModule, save: Save, goodId: string): Exchange {
  const good = goodOf(module, goodId);
  if (!good || good.kind !== 'use') return { ok: false, reason: 'That is not something you use up.' };
  if (!(save.pack[goodId] ?? 0)) return { ok: false, reason: `You have no ${good.name.replace(/^(a|an) /, '')} left.` };
  const playerId = playerOf(module);
  const placeId = save.positions[playerId] ?? '';
  const w = writer(module, save);
  for (const effect of good.restores) w.set(effect.stateId, effect.who === 'place' ? placeId : playerId, (current) => current + effect.add);
  w.pack(goodId, -1);
  const done = w.done();
  // What it changed, in each state's own words.
  const player = module.characters.find((entry) => entry.id === playerId);
  const place = module.world.places.find((entry) => entry.id === placeId);
  const changed = done.entries.flatMap((entry) => {
    if (entry.kind !== 'state') return [];
    const def = stateDefFor(module, entry.defId, entry.owner);
    if (!def) return [];
    const said = entry.owner === playerId
      ? fact(def, player?.name ?? 'You', entry.to, true, true)
      : fact(def, place?.name ?? entry.owner, entry.to, false, true, pronounsOf('it'));
    return said ? [said] : [];
  });
  return { ok: true, ...done, input: `I use ${good.name}.`, outcome: [`You use ${good.name}.`, ...changed].join('\n') };
}

// Terms that run out: each state marked `countdown` falls by one for every midnight, or every
// hour, that passes, down to its minimum.
export function countDown(module: PraxisModule, save: Save, from: number, to: number): { save: Save; entries: LedgerEntry[] } {
  if (to <= from) return { save, entries: [] };
  const days = Math.floor(to / 1440) - Math.floor(from / 1440);
  const hours = Math.floor(to / 60) - Math.floor(from / 60);
  let values = save.values;
  const entries: LedgerEntry[] = [];
  for (const base of module.ruleset.states) {
    if (!base.countdown) continue;
    const steps = base.countdown === 'day' ? days : hours;
    if (!steps) continue;
    for (const [owner, held] of Object.entries(values)) {
      if (held[base.id] === undefined) continue;
      const def = stateDefFor(module, base.id, owner) ?? base;
      const current = read(values, def, owner);
      if (current <= def.min) continue;
      const result = write(values, def, owner, current - steps, 'rule');
      values = result.values;
      if (result.change) entries.push({ kind: 'state', at: to, ...result.change });
    }
  }
  if (!entries.length) return { save, entries };
  return { save: { ...save, values, ledger: [...save.ledger, ...entries] }, entries };
}
