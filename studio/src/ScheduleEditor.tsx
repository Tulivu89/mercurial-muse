// A character's week: CharacterRoom's week view. Eight strips, one for every day and one for
// Daily, with each event drawn where it falls and overlapping events in lanes; under them, the
// picked day's events to edit. Times are stored in minutes; the presets are the times of day
// the writing rules use.
import { useState } from 'react';
import { TIMES_OF_DAY, formatMinutes } from '../../core/chat/time.js';
import { BOND_CONDITIONS, SCHEDULE_DAYS, type Schedule, type ScheduleEvent, type StoryRecord, type World } from '../../core/records/index.js';
import { newId } from '../../kit/src/util';

const DAY = 1440;
const HALF_HOURS = Array.from({ length: 49 }, (_, index) => index * 30);
const emptyWeek = (): Schedule => Object.fromEntries(SCHEDULE_DAYS.map((day) => [day, []]));

// Each event's lane, so two that overlap sit one above the other. A range that wraps past
// midnight is drawn as two pieces.
function lanes(events: ScheduleEvent[]): { event: ScheduleEvent; lane: number; pieces: [number, number][] }[] {
  const ends: number[] = [];
  return [...events].sort((a, b) => a.startTime - b.startTime).map((event) => {
    const wraps = event.endTime < event.startTime;
    const reach = wraps ? DAY : event.endTime;
    let lane = ends.findIndex((end) => end <= event.startTime);
    if (lane < 0) lane = ends.length;
    ends[lane] = reach;
    return { event, lane, pieces: wraps ? [[event.startTime, DAY], [0, event.endTime]] : [[event.startTime, Math.max(event.endTime, event.startTime + 20)]] };
  });
}

export function ScheduleEditor({ record, world, onChange }: { record: StoryRecord; world: World; onChange: (schedule: Schedule | null) => void }) {
  const week = { ...emptyWeek(), ...(record.schedule ?? {}) };
  const [day, setDay] = useState<string>('Daily');
  const [openId, setOpenId] = useState<string | null>(null);
  const events = [...(week[day] ?? [])].sort((a, b) => a.startTime - b.startTime);
  const scenarios = world.records.filter((entry) => entry.kind === 'scenario' && entry.sets.some((set) => set.members.length));

  const save = (next: Schedule) => onChange(Object.values(next).some((list) => list.length) ? next : null);
  const patch = (eventId: string, change: Partial<ScheduleEvent>) => save({ ...week, [day]: (week[day] ?? []).map((event) => (event.id === eventId ? { ...event, ...change } : event)) });
  const add = (startTime: number, endTime: number) => {
    const fresh: ScheduleEvent = { id: newId(), startTime, endTime, text: '', requiredIntimacy: 'none', sets: {}, rooms: {}, spots: {}, needs: {} };
    save({ ...week, [day]: [...(week[day] ?? []), fresh] });
    setOpenId(fresh.id);
  };
  const moveTo = (event: ScheduleEvent, to: string) => {
    if (to === day) return;
    save({ ...week, [day]: (week[day] ?? []).filter((entry) => entry.id !== event.id), [to]: [...(week[to] ?? []), event] });
    setDay(to);
  };
  const link = (event: ScheduleEvent, field: 'sets' | 'rooms', key: string, value: string) => {
    const { [key]: _gone, ...rest } = event[field];
    patch(event.id, { [field]: value ? { ...event[field], [key]: value } : rest });
  };

  return (
    <section aria-label="Schedule" className="schedule">
      <p className="hint">What they are doing, hour by hour. A stop says what they're doing, never how they arrive, because chat sends the current one with every reply. Daily runs every day; a weekday's own lines come first.</p>
      <div className="week" role="tablist" aria-label="Days">
        {SCHEDULE_DAYS.map((name) => {
          const drawn = lanes(week[name] ?? []);
          const depth = Math.max(1, ...drawn.map((entry) => entry.lane + 1));
          return (
            <button key={name} type="button" role="tab" aria-selected={day === name} className={`strip${day === name ? ' on' : ''}`} onClick={() => { setDay(name); setOpenId(null); }}>
              <span className="strip-day">{name === 'Daily' ? 'Daily' : name.slice(0, 3)}</span>
              <span className="band" style={{ height: depth * 12 + 4 }}>
                {[6, 12, 18].map((hour) => <span key={hour} className="tick" style={{ left: `${(hour / 24) * 100}%` }} />)}
                {drawn.flatMap(({ event, lane, pieces }) => pieces.map(([start, end], at) => (
                  <span key={`${event.id}-${at}`} className={`block-bar${event.requiredIntimacy !== 'none' ? ' gated' : ''}`} style={{ left: `${(start / DAY) * 100}%`, width: `${((end - start) / DAY) * 100}%`, top: lane * 12 + 2 }} title={`${formatMinutes(event.startTime)} to ${formatMinutes(event.endTime)}: ${event.text}`} />
                )))}
              </span>
              <span className="sr">{(week[name] ?? []).length} events</span>
            </button>
          );
        })}
        <div className="ruler" aria-hidden="true"><span /><span className="band">{[0, 6, 12, 18].map((hour) => <span key={hour} style={{ left: `${(hour / 24) * 100}%` }}>{String(hour).padStart(2, '0')}</span>)}</span></div>
      </div>

      <div className="row between">
        <h3 className="label">{day === 'Daily' ? 'Every day' : day}</h3>
        <span className="row">
          <span className="hint">Add:</span>
          {TIMES_OF_DAY.map((time) => <button key={time.name} type="button" className="btn small quiet" onClick={() => add(time.start, time.end)}>{time.name}</button>)}
        </span>
      </div>
      {events.length === 0 && <p className="empty">Nothing on {day === 'Daily' ? 'the daily round' : day} yet.</p>}
      {events.map((event) => (openId === event.id ? (
        <div key={event.id} className="card">
          <label className="field">
            <span>What they're doing</span>
            <textarea rows={2} maxLength={2000} value={event.text} placeholder="At the counter, taking orders and arguing with the cook." onChange={(change) => patch(event.id, { text: change.target.value })} />
          </label>
          <div className="row">
            <label className="field grow"><span>From</span>
              <select value={event.startTime} onChange={(change) => patch(event.id, { startTime: Number(change.target.value) })}>
                {[...new Set([...HALF_HOURS.slice(0, 48), event.startTime])].sort((a, b) => a - b).map((minute) => <option key={minute} value={minute}>{formatMinutes(minute)}</option>)}
              </select>
            </label>
            <label className="field grow"><span>To</span>
              <select value={event.endTime} onChange={(change) => patch(event.id, { endTime: Number(change.target.value) })}>
                {[...new Set([...HALF_HOURS, event.endTime])].sort((a, b) => a - b).map((minute) => <option key={minute} value={minute}>{formatMinutes(minute)}{minute < event.startTime ? ' the next day' : ''}</option>)}
              </select>
            </label>
            <label className="field grow"><span>Day</span>
              <select value={day} onChange={(change) => moveTo(event, change.target.value)}>{SCHEDULE_DAYS.map((name) => <option key={name} value={name}>{name}</option>)}</select>
            </label>
            <label className="field grow"><span>Who gets told</span>
              <select value={event.requiredIntimacy} onChange={(change) => patch(event.id, { requiredIntimacy: change.target.value })}>
                <option value="none">Anyone</option>
                {BOND_CONDITIONS.map((bond) => <option key={bond.tier} value={bond.tier}>{bond.label}</option>)}
              </select>
            </label>
          </div>
          {(record.sets.some((set) => set.members.length) || scenarios.length > 0) && (
            <fieldset className="card" style={{ margin: 0 }}>
              <legend className="sub">While this is on</legend>
              <div className="row">
                {record.sets.filter((set) => set.members.length).map((set) => (
                  <label key={set.id} className="field grow"><span>{set.title}</span>
                    <select value={event.sets[set.id] ?? ''} onChange={(change) => link(event, 'sets', set.id, change.target.value)}>
                      <option value="">No change</option>
                      {set.members.map((member) => <option key={member.id} value={member.id}>{member.name || 'Unnamed'}</option>)}
                    </select>
                  </label>
                ))}
                {scenarios.map((scenario) => (
                  <label key={scenario.id} className="field grow"><span>Where, in {scenario.name}</span>
                    <select value={event.rooms[scenario.id] ?? (scenario.sourceId ? event.rooms[scenario.sourceId] : undefined) ?? ''} onChange={(change) => link(event, 'rooms', scenario.id, change.target.value)}>
                      <option value="">No change</option>
                      {scenario.sets.flatMap((set) => set.members.map((member) => <option key={member.id} value={member.id}>{member.name || 'Unnamed'}</option>))}
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="row between">
            <button type="button" className="btn small quiet" onClick={() => setOpenId(null)}>Done</button>
            <button type="button" className="btn small danger" onClick={() => { if (window.confirm('Delete this event?')) save({ ...week, [day]: (week[day] ?? []).filter((entry) => entry.id !== event.id) }); }}>Delete</button>
          </div>
        </div>
      ) : (
        <button key={event.id} type="button" className="item line-row" onClick={() => setOpenId(event.id)}>
          <b>{formatMinutes(event.startTime)} to {formatMinutes(event.endTime)}</b>
          <span>{event.text.trim() || 'No text yet'}</span>
          {event.requiredIntimacy !== 'none' && <small>{event.requiredIntimacy} and up</small>}
        </button>
      )))}
    </section>
  );
}
