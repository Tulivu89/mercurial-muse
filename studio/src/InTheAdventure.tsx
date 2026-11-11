// Where a record stands in the adventure: where someone lives and spends each part of their
// day, where a thing lies, where play starts, and the ways out of a place.
import { useEffect, useState, type ReactNode } from 'react';
import type { ScheduleEvent, StoryRecord, World } from '../../core/records/index.js';
import { formatMinutes } from '../../core/chat/time.js';
import { AREA_KINDS, DEFAULT_CALENDAR, THREAD_KINDS, rulesetOf, type Milestone, type Route, type ScheduleWhen, type ThreadRules } from '../../core/rules/index.js';
import { newId } from '../../kit/src/util';
import { Num, OptNum, Rule, StatePick, Words } from './rules/bits';
import { RecordMulti, RecordPick, WhosePick, pickOptions } from './RecordPick';

type Raw = Record<string, unknown>;

// Somewhere a person can stand: any place but a region and larger.
const standable = (record: StoryRecord) => !AREA_KINDS.includes(record.rules?.placeKind ?? 'other');

function PlacePick({ world, value, onChange, label, none }: { world: World; value: string; onChange: (value: string) => void; label: string; none: string }) {
  return <RecordPick world={world} label={label} kinds={['place']} only={standable} none={none} value={value} onChange={onChange} className="pick" />;
}

export function InTheAdventure({ world, record, onChange, onWorld }: { world: World; record: StoryRecord; onChange: (record: StoryRecord) => void; onWorld?: (world: World) => void }) {
  const carried = (record.carried ?? {}) as Raw;
  const carry = (key: string, value: unknown) => {
    const next = { ...carried };
    if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) delete next[key]; else next[key] = value;
    onChange({ ...record, carried: Object.keys(next).length ? next : undefined });
  };
  const text = (key: string) => (typeof carried[key] === 'string' ? carried[key] as string : '');
  let body: ReactNode = null;

  if (record.kind === 'character') {
    const days = Object.entries(record.schedule ?? {}).filter(([, events]) => events.length);
    const change = (day: string, id: string, patch: Partial<ScheduleEvent>) => onChange({ ...record, schedule: { ...record.schedule, [day]: record.schedule![day]!.map((event) => (event.id === id ? { ...event, ...patch } : event)) } });
    body = (
      <>
        <Rule label="Lives at" hint="Where they are when their day says nothing.">
          <PlacePick world={world} label="Lives at" none="Nowhere set" value={text('homeLocationId')} onChange={(value) => carry('homeLocationId', value)} />
        </Rule>
        <p className="hint">Their day is the schedule below. Give an event a place and they are there in the adventure while it is on; an event with no place moves nobody. Keep to the four times of day, and no more than four people in a place at once.</p>
        {days.length === 0 && <p className="empty">No events yet. Add them in the Schedule below, then come back to say where each one is.</p>}
        {days.map(([day, events]) => events.map((event) => (
          <div key={`${day}-${event.id}`} className="stop">
            <span className="rule-label">{day === 'Daily' ? 'Every day' : day}, from {formatMinutes(event.startTime)}<small>{event.text || 'Nothing written.'}</small></span>
            <PlacePick world={world} label={`${day} ${formatMinutes(event.startTime)}: where`} none="No place" value={event.place ?? ''} onChange={(value) => change(day, event.id, { place: value || undefined })} />
            <WhenPick world={world} when={event.when} label={`${day} ${formatMinutes(event.startTime)}`} onChange={(when) => change(day, event.id, { when })} />
          </div>
        )))}
      </>
    );
  } else if (record.kind === 'item') {
    body = (
      <>
        <Rule label="Lies at" hint="The place it is found in.">
          <PlacePick world={world} label="Lies at" none="Nowhere set" value={text('locationId')} onChange={(value) => carry('locationId', value)} />
        </Rule>
        <Rule label="Carried by">
          <RecordPick world={world} label="Carried by" kinds={['character', 'persona']} none="Nobody" value={text('heldBy')} onChange={(value) => carry('heldBy', value)} className="pick" />
        </Rule>
      </>
    );
  } else if (record.kind === 'scenario') {
    const startAt = typeof carried.startAt === 'number' ? carried.startAt : 480;
    const present = Array.isArray(carried.presentCharacterIds) ? carried.presentCharacterIds as string[] : [];
    body = (
      <>
        <Rule label="Play starts at" hint="Left empty, the first place in the world.">
          <PlacePick world={world} label="Play starts at" none="The first place" value={text('startPlaceId')} onChange={(value) => carry('startPlaceId', value)} />
        </Rule>
        <Rule label="On day" hint="Day 1 is the first day of the world's calendar.">
          <Num label="Starts on day" value={Math.floor(startAt / 1440) + 1} min={1} onChange={(day) => carry('startAt', (day - 1) * 1440 + (startAt % 1440))} />
        </Rule>
        <Rule label="At hour" hint="0 to 23. Morning is from 6, afternoon 12, evening 18, night 22.">
          <Num label="Starts at hour" value={Math.floor((startAt % 1440) / 60)} min={0} max={23} onChange={(hour) => carry('startAt', Math.floor(startAt / 1440) * 1440 + hour * 60 + (startAt % 60))} />
        </Rule>
        <fieldset className="goods">
          <legend className="rule-label">Who is there<small>Everyone else is where their day puts them.</small></legend>
          <RecordMulti world={world} label="Who is there" kinds={['character']} values={present} empty="Nobody but the player." onChange={(ids) => carry('presentCharacterIds', ids)} />
        </fieldset>
      </>
    );
  } else if (record.kind === 'thread') {
    body = <Milestones world={world} record={record} onChange={onChange} />;
  } else if (record.kind === 'place' && onWorld) {
    body = <Routes world={world} place={record} onWorld={onWorld} />;
  }
  if (!body) return null;
  return (
    <details className="card rules">
      <summary><span className="rules-title">In the adventure</span><span className="rules-summary">{summary(world, record)}</span></summary>
      {body}
    </details>
  );
}

function summary(world: World, record: StoryRecord): string {
  const carried = (record.carried ?? {}) as Raw;
  const name = (id: unknown) => world.records.find((entry) => entry.id === id)?.name ?? 'somewhere gone';
  if (record.kind === 'character') {
    const stops = Object.values(record.schedule ?? {}).flat().filter((event) => event.place).length;
    return `${carried.homeLocationId ? `Lives at ${name(carried.homeLocationId)}` : 'No home set'} · ${stops ? `${stops} ${stops === 1 ? 'stop' : 'stops'} in their day` : 'stays put'}.`;
  }
  if (record.kind === 'item') return carried.heldBy ? `Carried by ${name(carried.heldBy)}.` : carried.locationId ? `Lies at ${name(carried.locationId)}.` : 'Not placed anywhere.';
  if (record.kind === 'scenario') return carried.startPlaceId ? `Play starts at ${name(carried.startPlaceId)}.` : 'Play starts at the first place.';
  if (record.kind === 'thread') {
    const milestones = record.rules?.thread?.milestones ?? [];
    const experience = milestones.reduce((sum, milestone) => sum + milestone.experience, 0);
    return milestones.length ? `${milestones.length} ${milestones.length === 1 ? 'milestone' : 'milestones'}${experience ? `, ${experience} experience` : ''}.` : 'No milestones: its next beat goes as one, for the player to mark.';
  }
  const routes = (world.routes ?? []).filter((route) => route.from === record.id || route.to === record.id);
  return routes.length ? `${routes.length} ${routes.length === 1 ? 'way' : 'ways'} out: ${routes.map((route) => name(route.from === record.id ? route.to : route.from)).join(', ')}.` : 'No routes. Places inside one another need none.';
}

// The condition part of a day waits on. Empty means the ordinary day.
function WhenPick({ world, when, label, onChange }: { world: World; when: ScheduleWhen | undefined; label: string; onChange: (when: ScheduleWhen | undefined) => void }) {
  const ruleset = rulesetOf(world);
  const dayNames = (world.rules?.calendar ?? DEFAULT_CALENDAR).dayNames;
  const set = (patch: Partial<ScheduleWhen>) => {
    const next = Object.fromEntries(Object.entries({ ...(when ?? {}), ...patch }).filter(([, value]) => value !== undefined));
    onChange(Object.keys(next).length ? (next as ScheduleWhen) : undefined);
  };
  const words: string[] = [];
  if (when?.weekday !== undefined) words.push(`on ${dayNames[when.weekday] ?? `weekday ${when.weekday + 1}`}`);
  if (when?.monthDay !== undefined) words.push(`on day ${when.monthDay + 1} of the month`);
  if (when?.fromDay !== undefined || when?.toDay !== undefined) words.push(when?.fromDay === when?.toDay ? `on day ${(when?.fromDay ?? 0) + 1}` : `from day ${(when?.fromDay ?? 0) + 1}${when?.toDay !== undefined ? ` to day ${when.toDay + 1}` : ' on'}`);
  if (when?.state) words.push(`while ${ruleset.states.find((def) => def.id === when.state!.stateId)?.name ?? when.state.stateId}${when.state.atLeast !== undefined ? ` is at least ${when.state.atLeast}` : ''}${when.state.atMost !== undefined ? ` is at most ${when.state.atMost}` : ''}`);
  const whose = when?.state?.characterId ?? '';
  return (
    <details className="more when">
      <summary>{words.length ? `Only ${words.join(', ')}` : 'On an ordinary day'}</summary>
      <p className="hint">A day with a condition that holds takes the place of the ordinary day.</p>
      <div className="row">
        <label className="field"><span>Weekday</span>
          <select aria-label={`${label}: weekday`} value={when?.weekday ?? ''} onChange={(event) => set({ weekday: event.target.value === '' ? undefined : Number(event.target.value) })}>
            <option value="">Any</option>
            {dayNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
        </label>
        <label className="field"><span>Day of the month</span><OptNum label={`${label}: day of the month`} min={1} value={when?.monthDay === undefined ? undefined : when.monthDay + 1} onChange={(value) => set({ monthDay: value === undefined ? undefined : value - 1 })} /></label>
        <label className="field"><span>From day</span><OptNum label={`${label}: from day`} min={1} value={when?.fromDay === undefined ? undefined : when.fromDay + 1} onChange={(value) => set({ fromDay: value === undefined ? undefined : value - 1 })} /></label>
        <label className="field"><span>To day</span><OptNum label={`${label}: to day`} min={1} value={when?.toDay === undefined ? undefined : when.toDay + 1} onChange={(value) => set({ toDay: value === undefined ? undefined : value - 1 })} /></label>
      </div>
      <div className="row">
        <label className="field"><span>While a state of</span>
          <select aria-label={`${label}: whose state`} value={when?.state ? (whose === 'world' ? 'world' : whose ? 'person' : 'self') : ''} onChange={(event) => {
            const who = event.target.value;
            if (!who) { set({ state: undefined }); return; }
            const person = who === 'person' ? pickOptions(world, ['character', 'persona'])[0]?.id : undefined;
            const scope = who === 'world' ? ['world'] : ['char', 'npc'];
            const stateId = ruleset.states.find((def) => scope.includes(def.scope))?.id ?? 'health';
            set({ state: { stateId, atLeast: 1, ...(who === 'world' ? { characterId: 'world' } : person ? { characterId: person } : {}) } });
          }}>
            <option value="">Nothing</option>
            <option value="self">Their own</option>
            <option value="world">The world&rsquo;s</option>
            <option value="person">Someone else&rsquo;s</option>
          </select>
        </label>
        {when?.state && whose && whose !== 'world' && (
          <label className="field"><span>Whose</span><RecordPick world={world} label={`${label}: whose state`} kinds={['character', 'persona']} value={whose} onChange={(characterId) => set({ state: { ...when.state!, characterId: characterId || undefined } })} /></label>
        )}
        {when?.state && (
          <>
            <label className="field"><span>State</span><StatePick ruleset={ruleset} label={`${label}: state`} value={when.state.stateId} only={(def) => (whose === 'world' ? def.scope === 'world' : ['char', 'npc', 'protagonist'].includes(def.scope))} onChange={(stateId) => set({ state: { ...when.state!, stateId } })} /></label>
            <label className="field"><span>Is at least</span><OptNum label={`${label}: at least`} value={when.state.atLeast} onChange={(atLeast) => set({ state: { ...when.state!, atLeast } })} /></label>
            <label className="field"><span>Is at most</span><OptNum label={`${label}: at most`} value={when.state.atMost} onChange={(atMost) => set({ state: { ...when.state!, atMost } })} /></label>
          </>
        )}
      </div>
    </details>
  );
}

function Routes({ world, place, onWorld }: { world: World; place: StoryRecord; onWorld: (world: World) => void }) {
  const ruleset = rulesetOf(world);
  const routes = world.routes ?? [];
  const mine = routes.filter((route) => route.from === place.id || route.to === place.id);
  const put = (next: Route[]) => onWorld({ ...world, routes: next.length ? next : undefined });
  const change = (id: string, patch: Partial<Route>) => put(routes.map((route) => (route.id === id ? { ...route, ...patch } : route)));
  const others = world.records.filter((record) => record.kind === 'place' && record.id !== place.id && !AREA_KINDS.includes(record.rules?.placeKind ?? 'other'));
  return (
    <>
      <p className="hint">A route joins two places that are not inside one another. It costs its distance at walking pace, and can ask something of whoever takes it. Stepping into a room or out of a building needs no route.</p>
      {mine.map((route) => {
        const far = route.from === place.id ? route.to : route.from;
        return (
          <div key={route.id} className="stop">
            <div className="row">
              <label className="field grow"><span>To</span>
                <RecordPick world={world} label={`A route from ${place.name}: to`} kinds={['place']} only={(other) => other.id !== place.id && standable(other)} value={far} onChange={(id) => { if (id) change(route.id, route.from === place.id ? { to: id } : { from: id }); }} />
              </label>
              <label className="field"><span>Kilometres</span>
                <input className="input num" type="number" min={0} step="0.1" aria-label={`Kilometres to ${far}`} value={route.distanceKm} onChange={(event) => { const km = Number(event.target.value); if (event.target.value !== '' && km >= 0) change(route.id, { distanceKm: km }); }} />
              </label>
              <button type="button" className="icon-btn" aria-label={`Remove the route to ${far}`} onClick={() => put(routes.filter((entry) => entry.id !== route.id))}>×</button>
            </div>
            <label className="field"><span>What the way is like</span><Words label={`The way to ${far}`} value={route.terrain} max={200} allowEmpty placeholder="a causeway of split logs over the reeds" onChange={(terrain) => change(route.id, { terrain })} /></label>
            {route.requires.map((need, index) => {
              const edit = (patch: Partial<typeof need>) => change(route.id, { requires: route.requires.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)) });
              return (
                <div key={index} className="row">
                  <span className="hint">Needs</span>
                  <StatePick ruleset={ruleset} label="State the route needs" value={need.stateId} only={(def) => def.scope === 'char' || def.scope === 'protagonist'} onChange={(stateId) => edit({ stateId })} />
                  <span className="hint">at least</span>
                  <Num label="At least" value={need.atLeast} onChange={(atLeast) => edit({ atLeast })} />
                  <select className="input pick" aria-label="Which way it is needed" value={need.toward ?? ''} onChange={(event) => edit({ toward: event.target.value || undefined })}>
                    <option value="">Both ways</option>
                    <option value={route.to}>Going to {world.records.find((entry) => entry.id === route.to)?.name ?? route.to}</option>
                    <option value={route.from}>Going to {world.records.find((entry) => entry.id === route.from)?.name ?? route.from}</option>
                  </select>
                  <Words label="What the player is told" value={need.reason} max={400} onChange={(reason) => edit({ reason })} />
                  <button type="button" className="icon-btn" aria-label="Remove this need" onClick={() => change(route.id, { requires: route.requires.filter((_, at) => at !== index) })}>×</button>
                </div>
              );
            })}
            <div className="row"><button type="button" className="btn small quiet" onClick={() => change(route.id, { requires: [...route.requires, { stateId: 'coin', atLeast: 1, reason: 'You need a coin for the ferry.' }] })}>It needs something</button></div>
          </div>
        );
      })}
      <div className="row">
        <button type="button" className="btn small" disabled={!others.length} onClick={() => put([...routes, { id: `route-${newId().slice(0, 8)}`, from: place.id, to: others[0]!.id, distanceKm: 1, terrain: '', routeClass: '', requires: [] }])}>Add a route from here</button>
      </div>
    </>
  );
}

// A thread's kind and milestones. The rules see a milestone reached when its conditions hold, on
// or after its first day, and miss it once its last day is over. The narrator hears only the next
// beat of the thread the player follows.
function Milestones({ world, record, onChange }: { world: World; record: StoryRecord; onChange: (record: StoryRecord) => void }) {
  const ruleset = rulesetOf(world);
  const own: ThreadRules = record.rules?.thread ?? {};
  const milestones = own.milestones ?? [];
  const put = (patch: Partial<ThreadRules>) => {
    const next = Object.fromEntries(Object.entries({ ...own, ...patch }).filter(([, value]) => value !== undefined && !(Array.isArray(value) && !value.length))) as ThreadRules;
    const { thread: _was, ...rest } = record.rules ?? {};
    const rules = Object.keys(next).length ? { ...rest, thread: next } : rest;
    onChange({ ...record, rules: Object.keys(rules).length ? rules : undefined });
  };
  const change = (id: string, patch: Partial<Milestone>) => put({ milestones: milestones.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) });
  const kind = THREAD_KINDS.find((entry) => entry.id === (own.kind ?? 'custom')) ?? THREAD_KINDS[THREAD_KINDS.length - 1]!;
  return (
    <>
      <Rule label="Kind" hint={kind.blurb}>
        <select className="input pick" aria-label="Kind of thread" value={kind.id} onChange={(event) => put({ kind: event.target.value === 'custom' ? undefined : event.target.value })}>
          {THREAD_KINDS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        </select>
      </Rule>
      <p className="hint">Milestones are the next things the story can reach, in order. The narrator hears only the first one still open, of the thread the player follows. A milestone is reached when its conditions hold, and pays its experience; one with no condition is for the player to mark. Days are the calendar&rsquo;s, as on the scenario.</p>
      {milestones.length === 0 && <p className="empty">None yet. Without them, the Next beat section goes to the adventure as the one milestone, for the player to mark.</p>}
      {milestones.map((milestone, index) => {
        const label = `Milestone ${index + 1}`;
        const editTest = (at: number, patch: Partial<Milestone['when'][number]>) => change(milestone.id, { when: milestone.when.map((test, where) => (where === at ? { ...test, ...patch } : test)) });
        return (
          <div key={milestone.id} className="stop">
            <div className="row">
              <span className="rule-label grow">{label}</span>
              {index > 0 && <button type="button" className="icon-btn" aria-label={`Move ${label.toLowerCase()} up`} onClick={() => { const next = [...milestones]; [next[index - 1], next[index]] = [next[index]!, next[index - 1]!]; put({ milestones: next }); }}>↑</button>}
              <button type="button" className="icon-btn" aria-label={`Remove ${label.toLowerCase()}`} onClick={() => put({ milestones: milestones.filter((entry) => entry.id !== milestone.id) })}>×</button>
            </div>
            <Beat label={`${label}: the beat`} value={milestone.text} onChange={(text) => change(milestone.id, { text })} />
            <div className="row">
              <label className="field grow"><span>Turns on</span>
                <RecordPick world={world} label={`${label}: turns on`} kinds={['place', 'character', 'item']} none="Nothing in particular" value={milestone.targetId ?? ''} onChange={(id) => change(milestone.id, { targetId: id || undefined })} />
              </label>
              <label className="field"><span>From day</span><OptNum label={`${label}: from day`} min={1} value={milestone.fromDay === undefined ? undefined : milestone.fromDay + 1} onChange={(value) => change(milestone.id, { fromDay: value === undefined ? undefined : value - 1 })} /></label>
              <label className="field"><span>Missed after day</span><OptNum label={`${label}: missed after day`} min={1} value={milestone.byDay === undefined ? undefined : milestone.byDay + 1} onChange={(value) => change(milestone.id, { byDay: value === undefined ? undefined : value - 1 })} /></label>
              <label className="field"><span>Experience</span><Num label={`${label}: experience`} min={0} max={1000} value={milestone.experience} onChange={(experience) => change(milestone.id, { experience })} /></label>
            </div>
            {milestone.when.map((test, at) => (
              <div key={at} className="row">
                <span className="hint">When</span>
                <WhosePick world={world} label={`${label}: whose state`} value={test.characterId} onChange={(characterId) => editTest(at, { characterId })} />
                <StatePick ruleset={ruleset} label={`${label}: state`} value={test.stateId} only={(def) => (test.characterId === 'world' ? def.scope === 'world' : test.characterId ? ['char', 'npc'].includes(def.scope) : ['char', 'protagonist'].includes(def.scope))} onChange={(stateId) => editTest(at, { stateId })} />
                <span className="hint">at least</span>
                <OptNum label={`${label}: at least`} value={test.atLeast} onChange={(atLeast) => editTest(at, { atLeast })} />
                <span className="hint">at most</span>
                <OptNum label={`${label}: at most`} value={test.atMost} onChange={(atMost) => editTest(at, { atMost })} />
                <button type="button" className="icon-btn" aria-label={`${label}: remove this condition`} onClick={() => change(milestone.id, { when: milestone.when.filter((_, where) => where !== at) })}>×</button>
              </div>
            ))}
            <div className="row"><button type="button" className="btn small quiet" onClick={() => change(milestone.id, { when: [...milestone.when, { stateId: ruleset.states.find((def) => def.scope === 'protagonist' || def.scope === 'char')?.id ?? 'health', atLeast: 1 }] })}>It waits on a state</button></div>
          </div>
        );
      })}
      <div className="row">
        <button type="button" className="btn small" onClick={() => put({ milestones: [...milestones, { id: `milestone-${newId().slice(0, 8)}`, text: 'What happens next.', when: [], experience: 5 }] })}>Add a milestone</button>
      </div>
    </>
  );
}

// A milestone's beat: a sentence or two, as the narrator will hear it. Never left empty.
function Beat({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <textarea
      className="input" rows={2} aria-label={label} value={draft} maxLength={400} placeholder="Bring tamecap from the Woed's edge to Morwen while it can still cure Lowri."
      onChange={(event) => { setDraft(event.target.value); if (event.target.value.trim()) onChange(event.target.value); }}
      onBlur={() => { if (!draft.trim()) setDraft(value); }}
    />
  );
}
