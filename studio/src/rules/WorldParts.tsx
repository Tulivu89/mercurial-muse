// The parts of World › Rules an adventure needs written: the calendar, travel, and scene actions.
import type { World } from '../../../core/records/index.js';
import { DEFAULT_CALENDAR, type Calendar, type Ruleset, type SceneAction, type WorldRules } from '../../../core/rules/index.js';
import { newId } from '../../../kit/src/util';
import { Num, OptNum, Origin, PutBack, Rule, StatePick, Words } from './bits';

type Put = (patch: Partial<WorldRules>) => void;

export function CalendarPart({ rules, ruleset, put }: { rules: WorldRules | undefined; ruleset: Ruleset; put: Put }) {
  const own = rules?.calendar;
  const calendar: Calendar = own ?? DEFAULT_CALENDAR;
  const set = (patch: Partial<Calendar>) => put({ calendar: { ...calendar, ...patch } });
  const travel = ruleset.travel;
  return (
    <section className="rules-part" aria-label="The calendar and travel">
      <h2 className="sub">The calendar and travel</h2>
      <div className="row">
        <p className="hint grow">The real calendar until you write another. The narrator is told only the time of day, in the words below; days and dates are for you and the player.</p>
        <Origin source={own ? 'world' : 'standard'} />
        {own && <PutBack onClick={() => put({ calendar: undefined })} />}
      </div>
      <label className="field">
        <span>The days of the week, in order, separated by commas</span>
        <Words label="The days of the week" value={calendar.dayNames.join(', ')} max={400} onChange={(text) => set({ dayNames: text.split(',').map((name) => name.trim()).filter(Boolean).slice(0, 20) })} />
      </label>
      <details className="more">
        <summary>Months: {calendar.months.map((month) => month.name).join(', ') || 'none'}</summary>
        {calendar.months.map((month, index) => (
          <div key={index} className="row">
            <Words label={`Month ${index + 1}`} value={month.name} max={80} onChange={(name) => set({ months: calendar.months.map((entry, at) => (at === index ? { ...entry, name } : entry)) })} />
            <Num label={`${month.name}: days`} value={month.days} min={1} max={400} onChange={(days) => set({ months: calendar.months.map((entry, at) => (at === index ? { ...entry, days } : entry)) })} />
            <span className="hint">days</span>
            <button type="button" className="icon-btn" aria-label={`Remove ${month.name}`} onClick={() => set({ months: calendar.months.filter((_, at) => at !== index) })}>×</button>
          </div>
        ))}
        <div className="row"><button type="button" className="btn small quiet" onClick={() => set({ months: [...calendar.months, { name: 'New month', days: 30 }] })}>Add a month</button></div>
      </details>
      <details className="more">
        <summary>Times of day the narrator hears: {calendar.bands.map((band) => band.label).join(', ')}</summary>
        {calendar.bands.map((band, index) => (
          <div key={index} className="row">
            <Words label={`Time of day ${index + 1}`} value={band.label} max={80} onChange={(label) => set({ bands: calendar.bands.map((entry, at) => (at === index ? { ...entry, label } : entry)) })} />
            <span className="hint">from</span><Num label={`${band.label}: from hour`} value={band.from} min={0} max={23} onChange={(from) => set({ bands: calendar.bands.map((entry, at) => (at === index ? { ...entry, from } : entry)) })} />
            <span className="hint">to</span><Num label={`${band.label}: to hour`} value={band.to} min={0} max={23} onChange={(to) => set({ bands: calendar.bands.map((entry, at) => (at === index ? { ...entry, to } : entry)) })} />
            <button type="button" className="icon-btn" aria-label={`Remove ${band.label}`} onClick={() => set({ bands: calendar.bands.filter((_, at) => at !== index) })}>×</button>
          </div>
        ))}
        <div className="row"><button type="button" className="btn small quiet" onClick={() => set({ bands: [...calendar.bands, { label: 'dusk', from: 17, to: 19 }] })}>Add a time of day</button></div>
      </details>
      <Rule label="Walking pace" hint="Kilometres an hour along a route." source={rules?.travel ? 'world' : 'standard'} onPutBack={rules?.travel ? () => put({ travel: undefined }) : false}>
        <Num label="Walking pace" value={travel.walkKph} min={1} max={100} onChange={(walkKph) => put({ travel: { ...travel, walkKph } })} />
      </Rule>
    </section>
  );
}

const blank = (): SceneAction => ({ id: `action-${newId().slice(0, 8)}`, name: 'New action', summary: '', placeIds: [], present: [], when: [], effects: [{ stateId: 'coin', add: 1 }], input: '*I do it.*', outcome: 'It is done.' });

// Something a player can do at a place that the rules settle outright: a shift's work for a
// coin, a hire, a signature.
export function SceneActionsPart({ world, rules, ruleset, put }: { world: World; rules: WorldRules | undefined; ruleset: Ruleset; put: Put }) {
  const actions = rules?.actions ?? [];
  const places = world.records.filter((record) => record.kind === 'place');
  const people = world.records.filter((record) => record.kind === 'character');
  const everyone = world.records.filter((record) => record.kind === 'character' || record.kind === 'persona');
  const dayNames = (rules?.calendar ?? DEFAULT_CALENDAR).dayNames;
  const change = (id: string, patch: Partial<SceneAction>) => put({ actions: actions.map((action) => (action.id === id ? { ...action, ...patch } : action)) });
  const toggle = (list: string[], id: string, on: boolean) => (on ? [...list, id] : list.filter((entry) => entry !== id));
  const fits = (who: string | undefined) => (def: { scope: string }) => (who === 'world' ? def.scope === 'world' : who ? ['char', 'npc'].includes(def.scope) : ['char', 'protagonist'].includes(def.scope));
  const Whose = ({ value, onChange, label }: { value: string | undefined; onChange: (value: string | undefined) => void; label: string }) => (
    <select className="input pick" aria-label={label} value={value ?? ''} onChange={(event) => onChange(event.target.value || undefined)}>
      <option value="">The player&rsquo;s</option>
      <option value="world">The world&rsquo;s</option>
      {people.map((person) => <option key={person.id} value={person.id}>{person.name}&rsquo;s</option>)}
    </select>
  );
  return (
    <section className="rules-part" aria-label="Scene actions">
      <h2 className="sub">Scene actions</h2>
      <p className="hint">Things a player can do at a place that the rules settle outright, with no roll: a shift&rsquo;s work for a coin, a hire, a paper signed. Each is offered while its conditions hold, changes what it says, and tells the narrator what to show.</p>
      {actions.length === 0 && <p className="empty">None yet.</p>}
      {actions.map((action) => (
        <details key={action.id} className="card fold">
          <summary><b>{action.name}</b> <span className="hint">{action.placeIds.length ? `at ${action.placeIds.map((id) => world.records.find((record) => record.id === id)?.name ?? id).join(', ')}` : 'anywhere'}{action.present.length ? `, with ${action.present.map((id) => everyone.find((person) => person.id === id)?.name ?? id).join(' and ')} there` : ''}</span></summary>
          <div className="row">
            <label className="field grow"><span>Name</span><Words label="Action name" value={action.name} max={120} onChange={(name) => change(action.id, { name })} /></label>
            <label className="field grow"><span>What it does, for the player</span><Words label={`${action.name}: what it does`} value={action.summary} max={400} allowEmpty onChange={(summary) => change(action.id, { summary })} /></label>
          </div>
          <fieldset className="goods"><legend className="rule-label">Offered at<small>None ticked means anywhere.</small></legend>
            <div className="checks">{places.map((place) => <label key={place.id}><input type="checkbox" checked={action.placeIds.includes(place.id)} onChange={(event) => change(action.id, { placeIds: toggle(action.placeIds, place.id, event.target.checked) })} />{place.name}</label>)}</div>
          </fieldset>
          <fieldset className="goods"><legend className="rule-label">Who must be there</legend>
            <div className="checks">{people.map((person) => <label key={person.id}><input type="checkbox" checked={action.present.includes(person.id)} onChange={(event) => change(action.id, { present: toggle(action.present, person.id, event.target.checked) })} />{person.name}</label>)}</div>
          </fieldset>
          <span className="rule-label">What must hold</span>
          {action.when.map((condition, index) => {
            const edit = (patch: Partial<typeof condition>) => change(action.id, { when: action.when.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)) });
            return (
              <div key={index} className="row">
                <Whose label={`${action.name}: condition ${index + 1}, whose state`} value={condition.characterId} onChange={(characterId) => edit({ characterId, stateId: ruleset.states.find(fits(characterId))?.id ?? condition.stateId })} />
                <StatePick ruleset={ruleset} label={`${action.name}: condition ${index + 1}, state`} value={condition.stateId} only={fits(condition.characterId)} onChange={(stateId) => edit({ stateId })} />
                <span className="hint">at least</span><OptNum label={`${action.name}: condition ${index + 1}, at least`} value={condition.atLeast} onChange={(atLeast) => edit({ atLeast })} />
                <span className="hint">at most</span><OptNum label={`${action.name}: condition ${index + 1}, at most`} value={condition.atMost} onChange={(atMost) => edit({ atMost })} />
                <button type="button" className="icon-btn" aria-label={`${action.name}: remove condition ${index + 1}`} onClick={() => change(action.id, { when: action.when.filter((_, at) => at !== index) })}>×</button>
              </div>
            );
          })}
          <div className="row"><button type="button" className="btn small quiet" onClick={() => change(action.id, { when: [...action.when, { stateId: 'coin', atLeast: 1 }] })}>Add a condition</button></div>
          <fieldset className="goods"><legend className="rule-label">Only on<small>None ticked means every day.</small></legend>
            <div className="checks">
              {dayNames.map((name, index) => <label key={name}><input type="checkbox" checked={action.open?.weekdays.includes(index) ?? false} onChange={(event) => { const weekdays = event.target.checked ? [...(action.open?.weekdays ?? []), index] : (action.open?.weekdays ?? []).filter((day) => day !== index); change(action.id, { open: { ...action.open, weekdays } }); }} />{name}</label>)}
              <label>from hour <OptNum label={`${action.name}: open from hour`} min={0} max={23} value={action.open?.fromHour} onChange={(fromHour) => change(action.id, { open: { weekdays: action.open?.weekdays ?? [], ...action.open, fromHour } })} /></label>
              <label>to hour <OptNum label={`${action.name}: open to hour`} min={1} max={24} value={action.open?.toHour} onChange={(toHour) => change(action.id, { open: { weekdays: action.open?.weekdays ?? [], ...action.open, toHour } })} /></label>
            </div>
          </fieldset>
          <span className="rule-label">What it changes</span>
          {action.effects.map((effect, index) => {
            const edit = (next: typeof effect) => change(action.id, { effects: action.effects.map((entry, at) => (at === index ? next : entry)) });
            const amount = effect.set ?? effect.add ?? 0;
            return (
              <div key={index} className="row">
                {effect.goodId !== undefined ? (
                  <>
                    <span className="hint">Your pack gets</span>
                    <Num label={`${action.name}: effect ${index + 1}, how many`} value={effect.add ?? 1} onChange={(add) => edit({ goodId: effect.goodId, add })} />
                    <select className="input pick" aria-label={`${action.name}: effect ${index + 1}, good`} value={effect.goodId} onChange={(event) => edit({ goodId: event.target.value, add: effect.add ?? 1 })}>
                      {ruleset.goods.map((good) => <option key={good.id} value={good.id}>{good.name}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <Whose label={`${action.name}: effect ${index + 1}, whose state`} value={effect.characterId} onChange={(characterId) => edit({ ...effect, characterId, stateId: ruleset.states.find(fits(characterId))?.id ?? effect.stateId })} />
                    <StatePick ruleset={ruleset} label={`${action.name}: effect ${index + 1}, state`} value={effect.stateId ?? ''} only={fits(effect.characterId)} onChange={(stateId) => edit({ ...effect, stateId })} />
                    <select className="input pick" aria-label={`${action.name}: effect ${index + 1}, how`} value={effect.set !== undefined ? 'set' : 'add'} onChange={(event) => edit({ stateId: effect.stateId, characterId: effect.characterId, ...(event.target.value === 'set' ? { set: amount } : { add: amount }) })}>
                      <option value="add">changes by</option>
                      <option value="set">is set to</option>
                    </select>
                    <Num label={`${action.name}: effect ${index + 1}, amount`} value={amount} onChange={(value) => edit({ stateId: effect.stateId, characterId: effect.characterId, ...(effect.set !== undefined ? { set: value } : { add: value }) })} />
                  </>
                )}
                <button type="button" className="icon-btn" aria-label={`${action.name}: remove effect ${index + 1}`} disabled={action.effects.length === 1} onClick={() => change(action.id, { effects: action.effects.filter((_, at) => at !== index) })}>×</button>
              </div>
            );
          })}
          <div className="row">
            <button type="button" className="btn small quiet" onClick={() => change(action.id, { effects: [...action.effects, { stateId: 'coin', add: -1 }] })}>Change a state</button>
            <button type="button" className="btn small quiet" disabled={!ruleset.goods.length} onClick={() => change(action.id, { effects: [...action.effects, { goodId: ruleset.goods[0]!.id, add: 1 }] })}>Give or take goods</button>
          </div>
          <label className="field"><span>The player&rsquo;s line</span><Words label={`${action.name}: the player's line`} value={action.input} max={400} onChange={(input) => change(action.id, { input })} /></label>
          <label className="field"><span>What the narrator must show: only what happens, plainly</span><Words label={`${action.name}: what the narrator shows`} value={action.outcome} max={1000} onChange={(outcome) => change(action.id, { outcome })} /></label>
          <div className="row"><button type="button" className="btn small danger" onClick={() => { if (window.confirm(`Remove ${action.name}?`)) put({ actions: actions.filter((entry) => entry.id !== action.id) }); }}>Remove {action.name}</button></div>
        </details>
      ))}
      <div className="row"><button type="button" className="btn small" onClick={() => put({ actions: [...actions, blank()] })}>Add a scene action</button></div>
    </section>
  );
}
