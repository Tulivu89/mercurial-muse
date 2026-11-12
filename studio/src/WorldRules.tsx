// World › Rules: the ruleset this world plays by, in plain words, with every part open to
// change. What the world leaves alone comes from the standard, and each part says which it is.
import { useState, type ReactNode } from 'react';
import type { World } from '../../core/records/index.js';
import {
  EMPTY_RULES, EXTRA_STATES, TIERS, TIER_NAMES, approachOrigin, changeRules, changedCount, deedKey, deedOrigin, fieldOrigin, goodOrigin, inStandard, listOf,
  pruneRules, readRuleset, stateOrigin, tierOrigin, worthWords,
  type Approach, type Block, type Cost, type Deed, type Ruleset, type StateDef, type Tier, type WorldRules as Rules,
} from '../../core/rules/index.js';
import { newId } from '../../kit/src/util';
import { LevelPick, Num, OptNum, Origin, PutBack, Rule, StatePick, Words, plural } from './rules/bits';
import { StateEditor } from './rules/StateEditor';
import { approachWords, costWords, stateWords } from './rules/words';
import { CalendarPart, SceneActionsPart } from './rules/WorldParts';

const WHO: Record<Cost['who'], string> = { player: 'You', place: 'The place', target: 'The target' };
const fitsWho = (who: Cost['who'] | 'player' | 'place') => (def: StateDef) => (who === 'place' ? def.scope === 'place' : who === 'player' ? def.scope === 'char' || def.scope === 'protagonist' : ['char', 'npc', 'protagonist'].includes(def.scope));
const DEED_KINDS: Record<Deed['kind'], string> = { person: 'a person', thing: 'a thing', place: 'a place' };

export function WorldRules({ world, onChange }: { world: World; onChange: (world: World) => void }) {
  const [refused, setRefused] = useState<string[]>([]);
  const rules = world.rules;
  const stored = readRuleset(rules);
  const ruleset = stored.ruleset;
  const changed = changedCount(rules);

  // A change is kept only if the rules still hold together; otherwise the page says why.
  const apply = (next: Rules | undefined) => {
    const check = readRuleset(next);
    if (check.problems.length) { setRefused(check.problems); return; }
    setRefused([]);
    onChange({ ...world, rules: next });
  };
  const field = (block: Block, name: string, value: unknown) => apply(changeRules.field(rules, block, name, value));
  const fieldBack = (block: Block, name: string) => fieldOrigin(rules, block, name) === 'world' && (() => apply(changeRules.withoutField(rules, block, name)));
  const from = (block: Block, name: string) => fieldOrigin(rules, block, name);
  const put = (patch: Partial<Rules>) => apply(pruneRules({ ...(rules ?? EMPTY_RULES), ...patch }));

  const categories = [...new Set(ruleset.states.map((def) => def.category ?? 'Other'))];
  const dice = ruleset.dice!;
  const rest = ruleset.rest!;
  const growth = ruleset.growth!;
  const trade = ruleset.trade!;
  const craft = ruleset.craft!;
  const people = ruleset.states.filter((def) => def.scope === 'char' && def.bands.length > 0);
  const freeDeeds = (['person', 'thing', 'place'] as const).flatMap((kind) => ruleset.approaches.filter((approach) => !ruleset.deeds.some((deed) => deedKey(deed) === `${kind}:${approach.id}`)).map((approach) => ({ kind, approach })));

  return (
    <>
      <h1 className="ink-write">Rules</h1>
      <p className="lede">{world.name} plays by the Four Approaches. Everything on this page is the standard until you change it, and every record that set nothing of its own follows what this page says.</p>
      <div className="row">
        <span className={`chip ${changed ? 'src-world' : 'src-standard'}`}>{changed ? `${plural(changed, 'part')} changed in this world` : 'All standard'}</span>
        {changed > 0 && <button type="button" className="btn small quiet" onClick={() => { if (window.confirm(`Put every rule in ${world.name} back to the standard? What is set on single records stays.`)) apply(undefined); }}>Put everything back</button>}
      </div>
      {stored.problems.length > 0 && <p className="status bad" role="status">These rules don&rsquo;t hold together, so the standard is in use until they do. {stored.problems.join(' ')}</p>}
      {refused.length > 0 && <p className="status bad" role="status">Not kept, because the rules would stop holding together. {refused.join(' ')}</p>}

      <section className="rules-part" aria-label="The approaches">
        <h2 className="sub">The approaches</h2>
        <p className="hint">Every check is made with one of these. Each owns the states it can move, so how a player acts decides what can change and what it costs.</p>
        {ruleset.approaches.map((approach) => (
          <ApproachCard
            key={approach.id} approach={approach} ruleset={ruleset} origin={approachOrigin(rules, approach.id)}
            onChange={(next) => apply(changeRules.approach(rules, next))}
            onPutBack={() => apply(changeRules.withoutApproach(rules, approach.id))}
          />
        ))}
      </section>

      <section className="rules-part" aria-label="States">
        <h2 className="sub">States</h2>
        <p className="hint">Every value the rules keep is one bounded number. The narrator reads a state only through the words of its bands.</p>
        {categories.map((category) => (
          <div key={category} className="stack">
            <h3 className="category">{category}</h3>
            {ruleset.states.filter((def) => (def.category ?? 'Other') === category).map((def) => {
              const origin = stateOrigin(rules, def.id);
              return (
                <details key={def.id} className="card fold">
                  <summary><b>{def.name}</b> <span className="hint">{stateWords(ruleset, def)}</span> <Origin source={origin} /></summary>
                  {def.bands.length > 0 && <p className="part">{def.bands.map((entry, index) => `${index === def.restBand ? '(resting) ' : ''}${entry.label}`).join(' · ')}</p>}
                  <StateEditor def={def} ruleset={ruleset} onChange={(next) => apply(changeRules.state(rules, next))} />
                  {origin === 'world' && (
                    <div className="row">
                      {inStandard.state(def.id)
                        ? <PutBack label={`Put ${def.name} back to the standard`} onClick={() => apply(changeRules.withoutState(rules, def.id))} />
                        : <button type="button" className="btn small danger" onClick={() => { if (window.confirm(`Remove ${def.name} from this world's rules?`)) apply(changeRules.withoutState(rules, def.id)); }}>Remove {def.name}</button>}
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        ))}
        <div className="row">
          <button type="button" className="btn small" onClick={() => apply(changeRules.state(rules, { id: `state-${newId().slice(0, 8)}`, name: 'New state', scope: 'char', min: 0, max: 3, start: 0, bands: [], bandBasis: 'value', restBand: 0, terminals: [], display: 'value', grows: false, category: 'This world' }))}>Add a state</button>
          {EXTRA_STATES.filter((extra) => !ruleset.states.some((def) => def.id === extra.id)).map((extra) => (
            <button key={extra.id} type="button" className="btn small quiet" onClick={() => apply(changeRules.state(rules, extra))}>Add {extra.name} for groups</button>
          ))}
        </div>
      </section>

      <section className="rules-part" aria-label="Tiers">
        <h2 className="sub">Tiers</h2>
        <p className="hint">How much of a match someone is. A tier sets how hard they are to act on and the most they have of each state, unless their own page says otherwise.</p>
        {TIERS.map((tier) => <TierCard key={tier} tier={tier} ruleset={ruleset} people={people} origin={tierOrigin(rules, tier)} onChange={(value) => apply(changeRules.tier(rules, tier, value))} onPutBack={() => apply(changeRules.withoutTier(rules, tier))} />)}
      </section>

      <section className="rules-part" aria-label="The dice">
        <h2 className="sub">The dice</h2>
        <Rule label="How hard, when nothing else says" hint="The difficulty of anyone and anything with no tier and nothing set." source={from('dice', 'difficulty')} onPutBack={fieldBack('dice', 'difficulty')}>
          <LevelPick label="How hard, when nothing else says" random={false} value={dice.difficulty} onChange={(level) => level !== undefined && field('dice', 'difficulty', level)} />
        </Rule>
        {dice.push && (
          <Rule label="Pushing costs" hint="Using a spent charge again." source={from('dice', 'push')} onPutBack={fieldBack('dice', 'push')}>
            <StatePick ruleset={ruleset} label="The state pushing costs" value={dice.push.stateId} only={fitsWho('player')} onChange={(stateId) => field('dice', 'push', { ...dice.push, stateId })} />
            <Num label="How much pushing costs" value={dice.push.add} onChange={(add) => field('dice', 'push', { ...dice.push, add })} />
          </Rule>
        )}
        <div className="card">
          <div className="card-head"><b className="grow">A setback die is added when</b><Origin source={from('dice', 'setbacks')} />{fieldBack('dice', 'setbacks') && <PutBack onClick={fieldBack('dice', 'setbacks') as () => void} />}</div>
          {dice.setbacks.map((setback, index) => {
            const change = (patch: Partial<typeof setback>) => field('dice', 'setbacks', dice.setbacks.map((existing, at) => (at === index ? { ...existing, ...patch } : existing)));
            return (
              <div key={index} className="band-row">
                <label className="field grow"><span>The player is told</span><Words label={`Setback ${index + 1}, what the player is told`} value={setback.reason} max={200} onChange={(reason) => change({ reason })} /></label>
                <label className="field">
                  <span>Whose</span>
                  <select value={setback.who} onChange={(event) => { const who = event.target.value as 'player' | 'place'; change({ who, stateId: ruleset.states.find(fitsWho(who))?.id ?? setback.stateId }); }}>
                    <option value="player">The player&rsquo;s</option>
                    <option value="place">The place&rsquo;s</option>
                  </select>
                </label>
                <label className="field"><span>State</span><StatePick ruleset={ruleset} label={`Setback ${index + 1} state`} value={setback.stateId} only={fitsWho(setback.who)} onChange={(stateId) => change({ stateId })} /></label>
                <label className="field"><span>Is at least</span><OptNum label={`Setback ${index + 1}, at least`} value={setback.atLeast} onChange={(atLeast) => change({ atLeast })} /></label>
                <label className="field"><span>Is at most</span><OptNum label={`Setback ${index + 1}, at most`} value={setback.atMost} onChange={(atMost) => change({ atMost })} /></label>
                <button type="button" className="icon-btn" aria-label={`Remove setback ${index + 1}`} onClick={() => field('dice', 'setbacks', dice.setbacks.filter((_, at) => at !== index))}>×</button>
                <div className="checks wide">
                  <span className="hint">Only for:</span>
                  {ruleset.approaches.map((approach) => (
                    <label key={approach.id}><input type="checkbox" checked={setback.approaches.includes(approach.id)} onChange={(event) => change({ approaches: event.target.checked ? [...setback.approaches, approach.id] : setback.approaches.filter((id) => id !== approach.id) })} />{approach.name}</label>
                  ))}
                  <span className="hint">{setback.approaches.length ? '' : '(every approach)'}</span>
                </div>
              </div>
            );
          })}
          <div className="row"><button type="button" className="btn small quiet" onClick={() => field('dice', 'setbacks', [...dice.setbacks, { stateId: 'health', who: 'player', atMost: 2, approaches: [], reason: 'You are badly hurt' }])}>Add a setback</button></div>
        </div>
        <Rule label="A full rest takes" hint="Minutes. Waiting this long restores what is listed below." source={from('rest', 'minutes')} onPutBack={fieldBack('rest', 'minutes')}>
          <Num label="A full rest takes, in minutes" value={rest.minutes} min={1} onChange={(minutes) => field('rest', 'minutes', minutes)} />
        </Rule>
        <div className="card">
          <div className="card-head"><b className="grow">A full rest gives back</b><Origin source={from('rest', 'effects')} />{fieldBack('rest', 'effects') && <PutBack onClick={fieldBack('rest', 'effects') as () => void} />}</div>
          {rest.effects.map((effect, index) => {
            const change = (next: typeof effect) => field('rest', 'effects', rest.effects.map((existing, at) => (at === index ? next : existing)));
            return (
              <div key={index} className="row">
                <StatePick ruleset={ruleset} label={`Rest ${index + 1} state`} value={effect.stateId} only={fitsWho('player')} onChange={(stateId) => change({ ...effect, stateId })} />
                <select className="input pick" aria-label={`Rest ${index + 1} amount`} value={effect.toMax ? 'all' : 'some'} onChange={(event) => change(event.target.value === 'all' ? { stateId: effect.stateId, toMax: true } : { stateId: effect.stateId, add: 1 })}>
                  <option value="all">All of it</option>
                  <option value="some">Some of it</option>
                </select>
                {!effect.toMax && <Num label={`Rest ${index + 1}, how much`} value={effect.add ?? 1} onChange={(add) => change({ stateId: effect.stateId, add })} />}
                <button type="button" className="icon-btn" aria-label={`Remove rest ${index + 1}`} onClick={() => field('rest', 'effects', rest.effects.filter((_, at) => at !== index))}>×</button>
              </div>
            );
          })}
          <div className="row">
            <button type="button" className="btn small quiet" onClick={() => field('rest', 'effects', [...rest.effects, { stateId: 'health', add: 1 }])}>Add something</button>
            <label className="check"><input type="checkbox" checked={rest.resetCharges} onChange={(event) => field('rest', 'resetCharges', event.target.checked)} />And every spent charge comes back</label>
          </div>
        </div>
      </section>

      <section className="rules-part" aria-label="Deeds">
        <h2 className="sub">Deeds</h2>
        <p className="hint">Acts with no state to wear down. They work or they fail, and fail at the approach&rsquo;s cost.</p>
        {ruleset.deeds.map((deed) => {
          const origin = deedOrigin(rules, deed);
          const approach = ruleset.approaches.find((entry) => entry.id === deed.approach);
          return (
            <Rule key={deedKey(deed)} label={`${approach?.name ?? deed.approach} against ${DEED_KINDS[deed.kind]}`} source={origin} onPutBack={origin === 'world' && inStandard.deed(deed) && (() => apply(changeRules.withoutDeed(rules, deed)))}>
              <Words label={`${approach?.name ?? deed.approach} against ${DEED_KINDS[deed.kind]}`} value={deed.label} max={120} onChange={(label) => apply(changeRules.deed(rules, { ...deed, label }))} />
              {origin === 'world' && !inStandard.deed(deed) && <button type="button" className="icon-btn" aria-label={`Remove ${deed.label}`} onClick={() => apply(changeRules.withoutDeed(rules, deed))}>×</button>}
            </Rule>
          );
        })}
        {freeDeeds.length > 0 && (
          <label className="field">
            <span>Add a deed</span>
            <select value="" onChange={(event) => { const [kind, approach] = event.target.value.split(':'); if (kind && approach) apply(changeRules.deed(rules, { kind: kind as Deed['kind'], approach, label: 'New deed' })); }}>
              <option value="">Pick an approach and what it is tried on</option>
              {freeDeeds.map(({ kind, approach }) => <option key={`${kind}:${approach.id}`} value={`${kind}:${approach.id}`}>{approach.name} against {DEED_KINDS[kind]}</option>)}
            </select>
          </label>
        )}
      </section>

      <section className="rules-part" aria-label="Growth">
        <h2 className="sub">Growth</h2>
        <p className="hint">Experience is earned from what the rules see, and spent on ratings and charges.</p>
        <Triple label="Overcoming someone earns" value={growth.overcome} source={from('growth', 'overcome')} onPutBack={fieldBack('growth', 'overcome')} onChange={(value) => field('growth', 'overcome', value)} />
        <NumberRule label="An obstacle earns" value={growth.obstacle} block="growth" name="obstacle" from={from} back={fieldBack} set={field} />
        <NumberRule label="A hard obstacle earns" value={growth.hardObstacle} block="growth" name="hardObstacle" from={from} back={fieldBack} set={field} />
        <Rule label="An obstacle is hard from" source={from('growth', 'hardFrom')} onPutBack={fieldBack('growth', 'hardFrom')}>
          <LevelPick label="An obstacle is hard from" random={false} value={growth.hardFrom} onChange={(level) => level !== undefined && field('growth', 'hardFrom', level)} />
        </Rule>
        <NumberRule label="Failing against a rival or nemesis earns" hint="Once a scene." value={growth.lesson} block="growth" name="lesson" from={from} back={fieldBack} set={field} />
        <NumberRule label="A rating step costs" hint="Times the new rating." value={growth.ratingCost} min={1} block="growth" name="ratingCost" from={from} back={fieldBack} set={field} />
        <NumberRule label="The highest a rating goes" value={growth.ratingMax} min={1} max={10} block="growth" name="ratingMax" from={from} back={fieldBack} set={field} />
        <NumberRule label="A charge step costs" hint="Times the new top charge." value={growth.chargeCost} min={1} block="growth" name="chargeCost" from={from} back={fieldBack} set={field} />
      </section>

      <section className="rules-part" aria-label="Trade and making">
        <h2 className="sub">Trade and making</h2>
        <p className="hint">Prices go up in steps of ten, and the narrator reads only what the purse could buy. Change those words on the {ruleset.states.find((def) => def.id === trade.coin)?.name ?? 'purse'} state above, so a modern world&rsquo;s hundred buys a car, not a horse.</p>
        <Triple label="The bribe that tempts someone" value={trade.price} source={from('trade', 'price')} onPutBack={fieldBack('trade', 'price')} onChange={(value) => field('trade', 'price', value)} />
        <Triple label="The coin someone carries" value={trade.purse} source={from('trade', 'purse')} onPutBack={fieldBack('trade', 'purse')} onChange={(value) => field('trade', 'purse', value)} />
        <Rule label="Sold back, a thing fetches" hint="To someone who doesn't sell such things." source={from('trade', 'sellBack')} onPutBack={fieldBack('trade', 'sellBack')}>
          <Share label="Sold back, a thing fetches" value={trade.sellBack} onChange={(value) => field('trade', 'sellBack', value)} />
        </Rule>
        <Rule label="Materials cost" hint="Of the worth of what is being made." source={from('craft', 'materials')} onPutBack={fieldBack('craft', 'materials')}>
          <Share label="Materials cost" value={craft.materials} onChange={(value) => field('craft', 'materials', value)} />
        </Rule>
        <Rule label="Making something is" source={from('craft', 'difficulty')} onPutBack={fieldBack('craft', 'difficulty')}>
          <LevelPick label="Making something is" random={false} value={craft.difficulty} onChange={(level) => level !== undefined && field('craft', 'difficulty', level)} />
        </Rule>
        <Rule label="Fine or secret work is" source={from('craft', 'fineDifficulty')} onPutBack={fieldBack('craft', 'fineDifficulty')}>
          <LevelPick label="Fine or secret work is" random={false} value={craft.fineDifficulty} onChange={(level) => level !== undefined && field('craft', 'fineDifficulty', level)} />
        </Rule>
        <p className="hint">How long making takes: {craft.steps.map((step) => `worth up to ${step.upTo}, ${plural(step.track, 'check')} of ${step.minutes >= 1440 ? plural(Math.round(step.minutes / 1440), 'day') : plural(Math.round(step.minutes / 60), 'hour')}`).join('; ')}.</p>
      </section>

      <section className="rules-part" aria-label="Goods">
        <h2 className="sub">Goods anyone can sell</h2>
        <p className="hint">A plain catalog every world starts with. Rename them to suit the world and add its own: each good does one job. An item you make in this world is a good too, and people can sell and carry it.</p>
        {ruleset.goods.map((good) => {
          const origin = goodOrigin(rules, good.id);
          const does = good.kind === 'weapon' ? `weapon, harm ${good.harm ?? 0}` : good.kind === 'armour' ? `armour ${good.armour ?? 0}` : good.kind === 'help' ? `helps ${listOf((good.helps?.approaches ?? []).map((id) => ruleset.approaches.find((approach) => approach.id === id)?.name ?? id))}` : good.kind === 'use' ? 'used up when used' : 'goods';
          return (
            <div key={good.id} className="band-row">
              <label className="field grow"><span>One</span><Words label={`${good.name}, one`} value={good.name} max={80} onChange={(name) => apply(changeRules.good(rules, { ...good, name }))} /></label>
              <label className="field grow"><span>More than one</span><Words label={`${good.name}, more than one`} value={good.plural ?? ''} max={80} allowEmpty placeholder={`${good.name.replace(/^an? /, '')}s`} onChange={(text) => apply(changeRules.good(rules, { ...good, plural: text.trim() ? text : undefined }))} /></label>
              <label className="field"><span>Worth</span><Num label={`${good.name}, worth`} value={good.worth} min={0} max={1_000_000} onChange={(worth) => apply(changeRules.good(rules, { ...good, worth }))} /></label>
              <label className="field"><span>What it does</span>
                <select value={good.kind} onChange={(event) => apply(changeRules.good(rules, { ...good, kind: event.target.value as typeof good.kind, ...(event.target.value === 'help' && !good.helps ? { helps: { approaches: [ruleset.approaches[0]!.id], kinds: [], ids: [] } } : {}) }))}>
                  <option value="goods">Worth only</option><option value="weapon">A weapon</option><option value="armour">Armour</option><option value="help">A help</option><option value="use">Used up</option>
                </select>
              </label>
              {good.kind === 'weapon' && <label className="field"><span>Harm</span><Num label={`${good.name}, harm`} value={good.harm ?? 0} min={0} max={5} onChange={(harm) => apply(changeRules.good(rules, { ...good, harm }))} /></label>}
              {good.kind === 'armour' && <label className="field"><span>Armour</span><Num label={`${good.name}, armour`} value={good.armour ?? 0} min={0} max={5} onChange={(armour) => apply(changeRules.good(rules, { ...good, armour }))} /></label>}
              <span className="rule-source"><span className="hint">{does} · buys {worthWords(ruleset, good.worth)}</span><Origin source={origin} />{origin === 'world' && inStandard.good(good.id) && <PutBack onClick={() => apply(changeRules.withoutGood(rules, good.id))} />}{origin === 'world' && !inStandard.good(good.id) && <button type="button" className="icon-btn" aria-label={`Remove ${good.name}`} onClick={() => apply(changeRules.withoutGood(rules, good.id))}>×</button>}</span>
            </div>
          );
        })}
      </section>

      <div className="row"><button type="button" className="btn small" onClick={() => apply(changeRules.good(rules, { id: `good-${newId().slice(0, 8)}`, name: 'a new thing', description: '', worth: 1, kind: 'goods', hidden: false, hinders: [], makeable: true, fine: false, restores: [] }))}>Add a good</button></div>

      <CalendarPart rules={rules} ruleset={ruleset} put={put} />
      <SceneActionsPart world={world} rules={rules} ruleset={ruleset} put={put} />

      <section className="rules-part" aria-label="Not yet changed from here">
        <h2 className="sub">Fixed for now</h2>
        <p className="hint">A fight is over when someone is down or yields to Force and no one else here is still in it, and the place settles to uneasy. Someone travels with you as a companion by your bond, as your captive once they are down, or because you won them over. These two come to this page later. Routes are on each place&rsquo;s page, under In the adventure.</p>
      </section>
    </>
  );
}

function ApproachCard({ approach, ruleset, origin, onChange, onPutBack }: { approach: Approach; ruleset: Ruleset; origin: 'standard' | 'world'; onChange: (approach: Approach) => void; onPutBack: () => void }) {
  return (
    <div className={`card approach-${approach.id}`}>
      <div className="card-head">
        <Words label={`${approach.name}: its name`} value={approach.name} max={60} onChange={(name) => onChange({ ...approach, name })} />
        <Origin source={origin} />
        {origin === 'world' && <PutBack onClick={onPutBack} />}
      </div>
      <p className="part">{approachWords(ruleset, approach)}</p>
      <details className="more">
        <summary>Change what going wrong costs</summary>
        <Costs title="When it fails" name={approach.name} ruleset={ruleset} costs={approach.failure} minutes={approach.failureMinutes} onChange={(failure, failureMinutes) => onChange({ ...approach, failure, failureMinutes })} />
        <Costs title="On two or more threat" name={approach.name} ruleset={ruleset} costs={approach.threat} minutes={approach.threatMinutes} onChange={(threat, threatMinutes) => onChange({ ...approach, threat, threatMinutes })} />
      </details>
    </div>
  );
}

function Costs({ title, name, ruleset, costs, minutes, onChange }: { title: string; name: string; ruleset: Ruleset; costs: Cost[]; minutes: number; onChange: (costs: Cost[], minutes: number) => void }) {
  const change = (index: number, patch: Partial<Cost>) => onChange(costs.map((cost, at) => (at === index ? { ...cost, ...patch } : cost)), minutes);
  return (
    <div className="stack">
      <span className="rule-label">{title}<small>{costs.length ? listOf(costs.map((cost) => costWords(ruleset, cost))) : 'nothing changes'}</small></span>
      {costs.map((cost, index) => (
        <div key={index} className="row">
          <select className="input pick" aria-label={`${name}, ${title}, cost ${index + 1}: who pays`} value={cost.who} onChange={(event) => { const who = event.target.value as Cost['who']; change(index, { who, stateId: fitsWho(who)(ruleset.states.find((def) => def.id === cost.stateId)!) ? cost.stateId : ruleset.states.find(fitsWho(who))?.id ?? cost.stateId }); }}>
            {(Object.keys(WHO) as Cost['who'][]).map((who) => <option key={who} value={who}>{WHO[who]}</option>)}
          </select>
          <StatePick ruleset={ruleset} label={`${name}, ${title}, cost ${index + 1}: state`} value={cost.stateId} only={fitsWho(cost.who)} onChange={(stateId) => change(index, { stateId })} />
          <Num label={`${name}, ${title}, cost ${index + 1}: by how much`} value={cost.add} onChange={(add) => change(index, { add })} />
          <button type="button" className="icon-btn" aria-label={`${name}, ${title}: remove cost ${index + 1}`} onClick={() => onChange(costs.filter((_, at) => at !== index), minutes)}>×</button>
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => onChange([...costs, { stateId: 'strain', who: 'player', add: -1 }], minutes)}>Add a cost</button>
        <label className="check">and it takes <Num label={`${name}, ${title}: minutes lost`} value={minutes} min={0} onChange={(next) => onChange(costs, next)} /> more minutes</label>
      </div>
    </div>
  );
}

function TierCard({ tier, ruleset, people, origin, onChange, onPutBack }: { tier: Tier; ruleset: Ruleset; people: StateDef[]; origin: 'standard' | 'world'; onChange: (value: { difficulty: number; maxima: Record<string, number> }) => void; onPutBack: () => void }) {
  const value = ruleset.tiers?.[tier] ?? { difficulty: 2, maxima: {} };
  return (
    <div className="card">
      <div className="card-head"><b className="grow">{TIER_NAMES[tier]}</b><Origin source={origin} />{origin === 'world' && <PutBack onClick={onPutBack} />}</div>
      <div className="row">
        <label className="field">
          <span>How hard to act on</span>
          <LevelPick label={`${TIER_NAMES[tier]}: how hard to act on`} random={false} value={value.difficulty} onChange={(level) => typeof level === 'number' && onChange({ ...value, difficulty: level })} />
        </label>
        {people.map((def) => (
          <label key={def.id} className="field">
            <span>{def.name}, at most</span>
            <OptNum
              label={`${TIER_NAMES[tier]}: ${def.name} at most`} value={value.maxima[def.id]} min={Math.min(def.min, def.max) + 1} placeholder={String(def.max)}
              onChange={(next) => { const maxima = { ...value.maxima }; if (next === undefined) delete maxima[def.id]; else maxima[def.id] = next; onChange({ ...value, maxima }); }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

type FromFn = (block: Block, name: string) => 'standard' | 'world';
type BackFn = (block: Block, name: string) => false | (() => void);

function NumberRule({ label, hint, value, min = 0, max, block, name, from, back, set }: { label: string; hint?: string; value: number; min?: number; max?: number; block: Block; name: string; from: FromFn; back: BackFn; set: (block: Block, name: string, value: unknown) => void }) {
  return (
    <Rule label={label} hint={hint} source={from(block, name)} onPutBack={back(block, name)}>
      <Num label={label} value={value} min={min} max={max} onChange={(next) => set(block, name, next)} />
    </Rule>
  );
}

// One number for each tier.
function Triple({ label, value, source, onPutBack, onChange }: { label: string; value: Record<Tier, number>; source: 'standard' | 'world'; onPutBack: false | (() => void); onChange: (value: Record<Tier, number>) => void }): ReactNode {
  return (
    <Rule label={label} hint="By tier: minion, rival, nemesis." source={source} onPutBack={onPutBack}>
      {TIERS.map((tier) => <Num key={tier} label={`${label}: ${tier}`} value={value[tier]} min={0} onChange={(next) => onChange({ ...value, [tier]: next })} />)}
    </Rule>
  );
}

function Share({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  return (
    <select className="input pick" aria-label={label} value={String(value)} onChange={(event) => onChange(Number(event.target.value))}>
      {!steps.includes(value) && <option value={String(value)}>{Math.round(value * 100)}%</option>}
      {steps.map((step) => <option key={step} value={String(step)}>{step === 0 ? 'Nothing' : step === 1 ? 'All of its worth' : step === 0.5 ? 'Half its worth' : step === 0.25 ? 'A quarter of its worth' : 'Three quarters of its worth'}</option>)}
    </select>
  );
}
