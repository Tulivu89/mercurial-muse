// The Rules panel on a character, place, item or group: what a player can do here, how its
// states read to the narrator, and where every value came from. Folded until opened, with one
// plain line. Only what is changed here is stored on the record.
import { useMemo, useState } from 'react';
import type { StoryRecord, World } from '../../core/records/index.js';
import {
  LADDER, PLACE_KINDS, TIERS, TIER_NAMES, clearRule, goodsOf, rulesFor, setRule, summaryOf, worthWords,
  type ActReading, type GoodDef, type Level, type MemberRules, type RulesReading, type Source, type Sourced, type StateReading, type Tier,
} from '../../core/rules/index.js';
import { LevelPick, Num, OptNum, Origin, Rule, StatePick, Words, plural } from './rules/bits';

const OPEN_KEY = 'inkwyrm.studio.rules.open';
const wasOpen = () => { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch { return false; } };
const keepOpen = (open: boolean) => { try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* private mode: it just won't be remembered */ } };

// Set on this record itself, so it can be put back from here.
const isHere = (source: Source) => source.from === 'record' && !source.via;

const LADDER_NAMES: Record<(typeof LADDER)[number], string> = { raw: 'Raw', practiced: 'Practiced', trained: 'Trained', expert: 'Expert', master: 'Master' };
const GOOD_KINDS: Record<GoodDef['kind'], string> = {
  goods: 'Worth something, and nothing more',
  weapon: 'A weapon: more harm on a Force success',
  armour: 'Armour: takes the first harm',
  help: 'A help: a boost die where it fits',
  use: 'Used up when used',
};
const TARGET_KINDS = [['person', 'People'], ['thing', 'Things'], ['place', 'Places']] as const;

function actWords(act: ActReading): string {
  const what = act.effect === 'deed' ? 'it works or it fails' : act.effect === 'builds' ? `builds ${act.stateName}` : `wears down ${act.stateName}`;
  return act.claim === 'secondary' ? `${what}, off its home ground, with a setback die` : what;
}

type Path = readonly string[];

export function RulesPanel({ world, record, onChange }: { world: World; record: StoryRecord; onChange: (record: StoryRecord) => void }) {
  const reading = useMemo(() => rulesFor(world, record), [world, record]);
  const [open, setOpen] = useState(wasOpen);
  if (!reading) return null;

  const set = (path: Path, value: unknown) => onChange({ ...record, rules: setRule(record.rules, path, value) });
  const back = (path: Path) => onChange({ ...record, rules: clearRule(record.rules, path) });
  const groupGives = (field: keyof MemberRules) => record.groupIds.some((groupId) => world.records.find((entry) => entry.id === groupId)?.rules?.members?.[field] !== undefined);

  return (
    <details className="card rules" open={open} onToggle={(event) => { const next = (event.target as HTMLDetailsElement).open; setOpen(next); keepOpen(next); }}>
      <summary>
        <span className="rules-title">Rules</span>
        <span className="rules-summary">{summaryOf(reading)}</span>
      </summary>

      {reading.deeds.length > 0 && <Deeds reading={reading} record={record} set={set} back={back} />}
      {reading.subject === 'person' && <Person reading={reading} world={world} record={record} set={set} back={back} groupGives={groupGives} />}
      {reading.subject === 'place' && reading.placeKind && (
        <>
          <h3 className="sub">What kind of place</h3>
          <Rule label="Kind" hint="Regions and territories hold places. Nobody stands in one, and no road ends at one." source={reading.placeKind.source} onPutBack={isHere(reading.placeKind.source) && (() => back(['placeKind']))}>
            <select className="input pick" aria-label="Kind of place" value={reading.placeKind.value} onChange={(event) => set(['placeKind'], event.target.value)}>
              {PLACE_KINDS.map((kind) => <option key={kind} value={kind}>{kind === 'other' ? 'Somewhere to stand' : kind[0]!.toUpperCase() + kind.slice(1)}</option>)}
            </select>
          </Rule>
        </>
      )}
      {reading.subject === 'thing' && reading.good && <Good reading={reading} good={reading.good} record={record} set={set} back={back} />}
      {reading.subject === 'group' && <Members reading={reading} record={record} set={set} back={back} />}
      <States reading={reading} set={set} back={back} />
    </details>
  );
}

type Edit = { set: (path: Path, value: unknown) => void; back: (path: Path) => void };

function Deeds({ reading, record, set, back }: { reading: RulesReading; record: StoryRecord } & Edit) {
  const all = record.rules?.difficulty?.all;
  return (
    <>
      <h3 className="sub">What a player can do here</h3>
      <p className="hint">None of this needs writing. Change how hard it is only if this one should be harder or easier than most.</p>
      <Rule label="Every approach" hint="One difficulty for whatever is tried." onPutBack={all !== undefined && (() => back(['difficulty', 'all']))}>
        <LevelPick label="Difficulty for every approach" value={all} unset="Each as it comes" onChange={(level) => (level === undefined ? back(['difficulty', 'all']) : set(['difficulty', 'all'], level))} />
      </Rule>
      {reading.deeds.map((deed) => (
        <div key={deed.approach.id} className={`deed approach-${deed.approach.id}`}>
          <Rule label={deed.approach.name} source={deed.difficulty.source} onPutBack={isHere(deed.difficulty.source) && (() => back(['difficulty', deed.approach.id]))}>
            <LevelPick label={`Difficulty by ${deed.approach.name}`} value={deed.difficulty.value} onChange={(level) => level !== undefined && set(['difficulty', deed.approach.id], level as Level)} />
          </Rule>
          {deed.acts.length === 0
            ? <p className="hint">Nothing here for {deed.approach.name} to move.</p>
            : <ul className="acts">{deed.acts.map((act, index) => <li key={index}><b>{act.label}</b> <span className="hint">{actWords(act)}</span></li>)}</ul>}
        </div>
      ))}
    </>
  );
}

function States({ reading, set, back }: { reading: RulesReading } & Edit) {
  // Up front: what a check here can move, what is speaking, and what was set here. The rest
  // (a bargain with someone who sells nothing, the bare numbers) is folded away.
  const moved = new Set(reading.deeds.flatMap((deed) => deed.acts.map((act) => act.stateId)));
  const matters = (state: StateReading) => !reading.deeds.length || state.speaks || moved.has(state.def.id) || isHere(state.value.source) || isHere(state.max.source);
  const spoken = reading.states.filter((state) => state.sentence && matters(state));
  const silent = reading.states.filter((state) => !state.sentence || !matters(state));
  const row = (state: StateReading) => {
    const { def } = state;
    const lo = Math.min(def.min, def.max);
    return (
      <div className="rule-pair">
        <Rule label="Starts at" source={state.value.source} onPutBack={isHere(state.value.source) && (() => back(['states', def.id]))}>
          <Num label={`${def.name} starts at`} value={state.value.value} min={lo} max={Math.max(def.min, def.max)} onChange={(value) => set(['states', def.id], value)} />
        </Rule>
        <Rule label="At most" source={state.max.source} onPutBack={isHere(state.max.source) && (() => back(['maxima', def.id]))}>
          <Num label={`${def.name} at most`} value={state.max.value} min={lo + 1} onChange={(value) => set(['maxima', def.id], value)} />
        </Rule>
      </div>
    );
  };
  if (!reading.states.length) return reading.subject === 'group' ? <p className="hint">This world&rsquo;s rules keep no states for groups. Add Standing or Resources on the world&rsquo;s Rules page and every group gets them.</p> : null;
  return (
    <>
      {spoken.length > 0 && (
        <>
          <h3 className="sub">How it reads to the narrator</h3>
          <p className="hint">The model never sees a number. It gets the sentence, and only while the state is off its resting one.</p>
          {spoken.map((state) => (
            <div key={state.def.id} className="state">
              <div className="state-head">
                <b>{state.def.name}</b>
                <span className="hint">{state.value.value} of {state.max.value}</span>
                <span className={`chip ${state.speaks ? 'src-record' : 'src-standard'}`}>{state.speaks ? 'Sent now' : 'At rest: not sent'}</span>
              </div>
              <p className="part">{state.sentence}</p>
              {row(state)}
            </div>
          ))}
        </>
      )}
      {silent.length > 0 && (
        <details className="more">
          <summary>The rest of its numbers ({silent.map((state) => state.def.name).join(', ')})</summary>
          {silent.map((state) => (
            <div key={state.def.id} className="state">
              <div className="state-head"><b>{state.def.name}</b>{!state.sentence && <span className="hint">The narrator never reads this one.</span>}</div>
              {state.sentence && <p className="part">{state.sentence}</p>}
              {row(state)}
            </div>
          ))}
        </details>
      )}
    </>
  );
}

function Person({ reading, world, record, set, back, groupGives }: { reading: RulesReading; world: World; record: StoryRecord; groupGives: (field: keyof MemberRules) => boolean } & Edit) {
  const { tier, gang, rank, charges, forSale, price, purse, sells, carries } = reading;
  const goods = useMemo(() => goodsOf(world), [world]);
  if (!tier || !gang || !rank || !charges) return null;
  const tierHint = tier.value ? { minion: 'Falls to one success.', rival: 'A fair match.', nemesis: 'As hard as they come.' }[tier.value] : 'As hard as the dice say by default.';
  return (
    <>
      <h3 className="sub">{reading.isPlayer ? 'What the player starts with' : 'How much of a match they are'}</h3>
      {!reading.isPlayer && (
        <>
          <Rule label="Tier" hint={tierHint} source={tier.source} onPutBack={isHere(tier.source) && (() => back(['tier']))}>
            <select className="input pick" aria-label="Tier" value={tier.value ?? ''} onChange={(event) => { const next = event.target.value as Tier | ''; if (next) set(['tier'], next); else if (groupGives('tier')) set(['tier'], null); else back(['tier']); }}>
              <option value="">No tier</option>
              {TIERS.map((name) => <option key={name} value={name}>{TIER_NAMES[name]}</option>)}
            </select>
          </Rule>
          <Rule label="Rank" hint="Each rank makes one of their dice a worse one." source={rank.source} onPutBack={isHere(rank.source) && (() => back(['rank']))}>
            <select className="input pick" aria-label="Rank" value={rank.value} onChange={(event) => set(['rank'], Number(event.target.value))}>
              {[0, 1, 2].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </Rule>
          <Rule label="Acts as" hint="A gang's number is its Health, its Strain and its dice." source={gang.source} onPutBack={isHere(gang.source) && (() => back(['gang']))}>
            <select className="input pick" aria-label="Acts as" value={gang.value ?? ''} onChange={(event) => { const next = Number(event.target.value); if (next) set(['gang'], next); else if (groupGives('gang')) set(['gang'], null); else back(['gang']); }}>
              <option value="">One person</option>
              {[2, 3, 4, 5, 6, 7, 8].map((value) => <option key={value} value={value}>A gang of {value}</option>)}
            </select>
          </Rule>
        </>
      )}
      <details className="more">
        <summary>Charges: {reading.ruleset.approaches.filter((approach) => charges[approach.id]?.value).map((approach) => `${approach.name} ${LADDER_NAMES[charges[approach.id]!.value!].toLowerCase()}`).join(', ') || 'none'}</summary>
        <p className="hint">One-use bonuses by approach, a step on the ladder from raw to master.</p>
        {reading.ruleset.approaches.map((approach) => {
          const charge = charges[approach.id] as Sourced<(typeof LADDER)[number] | null>;
          return (
            <Rule key={approach.id} label={approach.name} source={charge.source} onPutBack={isHere(charge.source) && (() => back(['charges', approach.id]))}>
              <select className="input pick" aria-label={`${approach.name} charges`} value={charge.value ?? ''} onChange={(event) => (event.target.value ? set(['charges', approach.id], event.target.value) : back(['charges', approach.id]))}>
                <option value="">None</option>
                {LADDER.map((step) => <option key={step} value={step}>{LADDER_NAMES[step]}</option>)}
              </select>
            </Rule>
          );
        })}
      </details>
      {!reading.isPlayer && forSale && price && purse && (
        <details className="more">
          <summary>Trade: {forSale.value ? `takes a bribe of ${price.value}` : 'cannot be bought'}, carries {purse.value} coin{sells?.value.length ? `, sells ${plural(sells.value.length, 'thing')}` : ''}</summary>
          <Rule label="Can be bought" hint="A bribe is paid only if taken." source={forSale.source} onPutBack={isHere(forSale.source) && (() => back(['forSale']))}>
            <input type="checkbox" aria-label="Can be bought" checked={forSale.value} onChange={(event) => set(['forSale'], event.target.checked)} />
          </Rule>
          <Rule label="The bribe that tempts them" hint={`Buys ${worthWords(reading.ruleset, price.value)}.`} source={price.source} onPutBack={isHere(price.source) && (() => back(['price']))}>
            <Num label="The bribe that tempts them" value={price.value} min={0} onChange={(value) => set(['price'], value)} />
          </Rule>
          <Rule label="Coin they carry" hint="Yours once they are down or have given way." source={purse.source} onPutBack={isHere(purse.source) && (() => back(['purse']))}>
            <Num label="Coin they carry" value={purse.value} min={0} onChange={(value) => set(['purse'], value)} />
          </Rule>
          {sells && <GoodsList label="Sells" hint="At its worth. A seller can be haggled with." goods={goods} skip={record.id} picked={sells} onSet={(ids) => (ids.length ? set(['sells'], ids) : back(['sells']))} onPutBack={() => back(['sells'])} />}
          {carries && <GoodsList label="Carries" hint="Yours to take once they are down or have given way." goods={goods} skip={record.id} picked={carries} onSet={(ids) => (ids.length ? set(['carries'], ids) : back(['carries']))} onPutBack={() => back(['carries'])} />}
        </details>
      )}
    </>
  );
}

function GoodsList({ label, hint, goods, skip, picked, onSet, onPutBack }: { label: string; hint: string; goods: GoodDef[]; skip: string; picked: Sourced<string[]>; onSet: (ids: string[]) => void; onPutBack: () => void }) {
  return (
    <fieldset className="goods">
      <legend className="rule-label">{label}<small>{hint}</small> {picked.value.length > 0 && <Origin source={picked.source} />} {isHere(picked.source) && <button type="button" className="btn small quiet" onClick={onPutBack}>Put back</button>}</legend>
      <div className="checks">
        {goods.filter((good) => good.id !== skip).map((good) => (
          <label key={good.id}>
            <input type="checkbox" checked={picked.value.includes(good.id)} onChange={(event) => onSet(event.target.checked ? [...picked.value, good.id] : picked.value.filter((id) => id !== good.id))} />
            {good.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Good({ reading, good, record, set, back }: { reading: RulesReading; good: NonNullable<RulesReading['good']>; record: StoryRecord } & Edit) {
  const { value } = good;
  const source = (field: string): Source => (good.set.includes(field) ? { from: 'record' } : { from: 'standard' });
  const way = (field: string) => good.set.includes(field) && (() => back(['good', field]));
  const helps = value.helps ?? { approaches: [], kinds: [], ids: [] };
  const setHelps = (next: typeof helps) => (next.approaches.length ? set(['good', 'helps'], next) : back(['good', 'helps']));
  const toggle = <T,>(list: T[], entry: T, on: boolean) => (on ? [...list, entry] : list.filter((existing) => existing !== entry));
  return (
    <>
      <h3 className="sub">What it is to buy, carry or use</h3>
      <Rule label="What it does" source={source('kind')} onPutBack={way('kind')}>
        <select className="input pick" aria-label="What it does" value={value.kind} onChange={(event) => set(['good', 'kind'], event.target.value)}>
          {(Object.keys(GOOD_KINDS) as GoodDef['kind'][]).map((kind) => <option key={kind} value={kind}>{GOOD_KINDS[kind]}</option>)}
        </select>
      </Rule>
      <Rule label="Worth" hint={`Buys ${worthWords(reading.ruleset, value.worth)}.`} source={source('worth')} onPutBack={way('worth')}>
        <Num label="Worth" value={value.worth} min={0} max={1_000_000} onChange={(worth) => set(['good', 'worth'], worth)} />
      </Rule>
      <Rule label="More than one is called" hint={`One is "${record.name}".`} source={source('plural')} onPutBack={way('plural')}>
        <Words label="More than one is called" value={value.plural ?? ''} max={80} allowEmpty placeholder="knives, suits of plate" onChange={(text) => (text.trim() ? set(['good', 'plural'], text) : back(['good', 'plural']))} />
      </Rule>
      {value.kind === 'weapon' && (
        <>
          <Rule label="Harm" hint="Added to a Force success against a person." source={source('harm')} onPutBack={way('harm')}>
            <Num label="Harm" value={value.harm ?? 0} min={0} max={5} onChange={(harm) => set(['good', 'harm'], harm)} />
          </Rule>
          <Rule label="Can be carried unseen" source={source('hidden')} onPutBack={way('hidden')}>
            <input type="checkbox" aria-label="Can be carried unseen" checked={value.hidden} onChange={(event) => set(['good', 'hidden'], event.target.checked)} />
          </Rule>
        </>
      )}
      {value.kind === 'armour' && (
        <Rule label="Armour" hint="The harm it takes before you do, renewed on a rest." source={source('armour')} onPutBack={way('armour')}>
          <Num label="Armour" value={value.armour ?? 0} min={0} max={5} onChange={(armour) => set(['good', 'armour'], armour)} />
        </Rule>
      )}
      {value.kind === 'help' && (
        <Rule label="Helps" hint="A boost die on checks by these approaches, against these." source={source('helps')} onPutBack={way('helps')}>
          <span className="checks">
            {reading.ruleset.approaches.map((approach) => (
              <label key={approach.id}><input type="checkbox" checked={helps.approaches.includes(approach.id)} onChange={(event) => setHelps({ ...helps, approaches: toggle(helps.approaches, approach.id, event.target.checked) })} />{approach.name}</label>
            ))}
            {TARGET_KINDS.map(([kind, name]) => (
              <label key={kind}><input type="checkbox" checked={helps.kinds.includes(kind)} disabled={!helps.approaches.length} onChange={(event) => setHelps({ ...helps, kinds: toggle(helps.kinds, kind, event.target.checked) })} />{name}</label>
            ))}
          </span>
        </Rule>
      )}
      {value.kind === 'use' && (
        <Rule label="Using it" hint="What it gives back, to you or to the place." source={source('restores')} onPutBack={way('restores')}>
          <span className="stack">
            {value.restores.map((effect, index) => {
              const change = (patch: Partial<typeof effect>) => set(['good', 'restores'], value.restores.map((existing, at) => (at === index ? { ...existing, ...patch } : existing)));
              return (
                <span key={index} className="row">
                  <StatePick ruleset={reading.ruleset} label="State it changes" value={effect.stateId} only={(def) => (effect.who === 'place' ? def.scope === 'place' : def.scope === 'char' || def.scope === 'protagonist')} onChange={(stateId) => change({ stateId })} />
                  <Num label="By how much" value={effect.add} onChange={(add) => change({ add })} />
                  <button type="button" className="icon-btn" aria-label="Remove this" onClick={() => { const next = value.restores.filter((_, at) => at !== index); if (next.length) set(['good', 'restores'], next); else back(['good', 'restores']); }}>×</button>
                </span>
              );
            })}
            <span className="row">
              <button type="button" className="btn small quiet" onClick={() => set(['good', 'restores'], [...value.restores, { stateId: 'health', who: 'player', add: 2 }])}>Gives back to you</button>
              <button type="button" className="btn small quiet" onClick={() => set(['good', 'restores'], [...value.restores, { stateId: 'alert', who: 'place', add: -1 }])}>Changes the place</button>
            </span>
          </span>
        </Rule>
      )}
    </>
  );
}

// What a group gives its members unless they set their own.
function Members({ reading, record, set, back }: { reading: RulesReading; record: StoryRecord } & Edit) {
  const given = record.rules?.members ?? {};
  const people = reading.ruleset.states.filter((def) => def.scope === 'char');
  const here: Source = { from: 'record' };
  return (
    <>
      <h3 className="sub">What its members get</h3>
      <p className="hint">{plural(reading.members?.count ?? 0, 'member')} {reading.members?.count === 1 ? 'follows' : 'follow'} these unless their own page says otherwise. Leave a thing empty and the group has no say in it.</p>
      <Rule label="Tier" source={given.tier != null ? here : undefined} onPutBack={given.tier != null && (() => back(['members', 'tier']))}>
        <select className="input pick" aria-label="Members' tier" value={given.tier ?? ''} onChange={(event) => (event.target.value ? set(['members', 'tier'], event.target.value) : back(['members', 'tier']))}>
          <option value="">No say</option>
          {TIERS.map((name) => <option key={name} value={name}>{TIER_NAMES[name]}</option>)}
        </select>
      </Rule>
      <Rule label="Every approach" hint="How hard members are to act on." source={given.difficulty?.all !== undefined ? here : undefined} onPutBack={given.difficulty?.all !== undefined && (() => back(['members', 'difficulty', 'all']))}>
        <LevelPick label="Members' difficulty for every approach" value={given.difficulty?.all} unset="No say" onChange={(level) => (level === undefined ? back(['members', 'difficulty', 'all']) : set(['members', 'difficulty', 'all'], level))} />
      </Rule>
      {people.map((def) => {
        const banded = def.bands.length > 0;
        const field = banded ? 'maxima' : 'states';
        const value = given[field]?.[def.id];
        return (
          <Rule key={def.id} label={banded ? `${def.name}, at most` : `${def.name}, starts at`} hint={`The rules say ${banded ? def.max : def.start}.`} source={value !== undefined ? here : undefined} onPutBack={value !== undefined && (() => back(['members', field, def.id]))}>
            <OptNum label={`Members' ${def.name}`} value={value} min={Math.min(def.min, def.max) + (banded ? 1 : 0)} max={banded ? undefined : Math.max(def.min, def.max)} placeholder="No say" onChange={(next) => (next === undefined ? back(['members', field, def.id]) : set(['members', field, def.id], next))} />
          </Rule>
        );
      })}
    </>
  );
}
