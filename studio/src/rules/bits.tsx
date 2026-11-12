// Small pieces the Rules panel and the world's Rules page share.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DIFFICULTY_NAMES, sourceWords, type Level, type Ruleset, type Source, type StateDef } from '../../../core/rules/index.js';

// Where a rule came from: the standard, the world, a tier, a group, or set here.
export function Origin({ source }: { source: Source | 'standard' | 'world' }) {
  const full: Source = typeof source === 'string' ? { from: source } : source;
  const via = 'via' in full && full.via ? (full.via === 'gang' ? ', by their number' : ', by every approach') : '';
  return <span className={`chip src-${full.from}`}>{sourceWords(full)}{via}</span>;
}

export function PutBack({ onClick, label = 'Put back' }: { onClick: () => void; label?: string }) {
  return <button type="button" className="btn small quiet" onClick={onClick}>{label}</button>;
}

// A whole number. Kept as you type it, sent up once it is one, and put right when you leave.
export function Num({ value, onChange, min, max, label }: { value: number; onChange: (value: number) => void; min?: number; max?: number; label: string }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <input
      type="number" inputMode="numeric" className="input num" aria-label={label} value={draft} min={min} max={max}
      onChange={(event) => {
        setDraft(event.target.value);
        const next = Number(event.target.value);
        if (event.target.value.trim() !== '' && Number.isInteger(next) && (min === undefined || next >= min) && (max === undefined || next <= max) && next !== value) onChange(next);
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}

// A whole number that can be left empty, meaning "not set".
export function OptNum({ value, onChange, min, max, label, placeholder }: { value: number | undefined; onChange: (value: number | undefined) => void; min?: number; max?: number; label: string; placeholder?: string }) {
  const [draft, setDraft] = useState(value === undefined ? '' : String(value));
  useEffect(() => setDraft(value === undefined ? '' : String(value)), [value]);
  return (
    <input
      type="number" inputMode="numeric" className="input num" aria-label={label} value={draft} min={min} max={max} placeholder={placeholder}
      onChange={(event) => {
        setDraft(event.target.value);
        if (event.target.value.trim() === '') { if (value !== undefined) onChange(undefined); return; }
        const next = Number(event.target.value);
        if (Number.isInteger(next) && (min === undefined || next >= min) && (max === undefined || next <= max) && next !== value) onChange(next);
      }}
      onBlur={() => setDraft(value === undefined ? '' : String(value))}
    />
  );
}

// A line of text that can't be left empty: it keeps its last words until there are new ones.
export function Words({ value, onChange, label, max = 200, placeholder, allowEmpty = false }: { value: string; onChange: (value: string) => void; label: string; max?: number; placeholder?: string; allowEmpty?: boolean }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="input" aria-label={label} value={draft} maxLength={max} placeholder={placeholder}
      onChange={(event) => { setDraft(event.target.value); if (allowEmpty || event.target.value.trim()) onChange(event.target.value); }}
      onBlur={() => { if (!allowEmpty && !draft.trim()) setDraft(value); }}
    />
  );
}

export const LEVELS: Level[] = [0, 1, 2, 3, 4, 5];
export const levelName = (level: Level) => (level === 'random' ? 'Random, fixed for each save' : DIFFICULTY_NAMES[level] ?? String(level));

// How hard: Simple to Formidable, or rolled once for each save.
export function LevelPick({ value, onChange, label, random = true, unset }: { value: Level | undefined; onChange: (value: Level | undefined) => void; label: string; random?: boolean; unset?: string }) {
  return (
    <select
      className="input pick" aria-label={label} value={value === undefined ? '' : String(value)}
      onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value === 'random' ? 'random' : Number(event.target.value))}
    >
      {unset !== undefined && <option value="">{unset}</option>}
      {LEVELS.map((level) => <option key={level} value={level}>{levelName(level)}</option>)}
      {random && <option value="random">{levelName('random')}</option>}
    </select>
  );
}

export function StatePick({ ruleset, value, onChange, label, only }: { ruleset: Ruleset; value: string; onChange: (value: string) => void; label: string; only?: (def: StateDef) => boolean }) {
  const states = ruleset.states.filter((def) => !only || only(def) || def.id === value);
  return (
    <select className="input pick" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      {!states.some((def) => def.id === value) && <option value={value}>{value}</option>}
      {states.map((def) => <option key={def.id} value={def.id}>{def.name}{states.filter((other) => other.name === def.name).length > 1 ? ` (${SCOPE_WORDS[def.scope].toLowerCase()})` : ''}</option>)}
    </select>
  );
}

// World › Rules can show only what the world changed. A row that is still the standard's then
// leaves itself out.
export const OnlyChanged = createContext(false);

// One rule on a row: what it is, the control, where it came from, and the way back.
export function Rule({ label, hint, children, source, onPutBack }: { label: string; hint?: string; children: ReactNode; source?: Source | 'standard' | 'world'; onPutBack?: (() => void) | false }) {
  const onlyChanged = useContext(OnlyChanged);
  if (onlyChanged && source === 'standard') return null;
  return (
    <div className="rule">
      <span className="rule-label">{label}{hint && <small>{hint}</small>}</span>
      <span className="rule-control">{children}</span>
      <span className="rule-source">
        {source && <Origin source={source} />}
        {onPutBack && <PutBack onClick={onPutBack} />}
      </span>
    </div>
  );
}

export const SCOPE_WORDS: Record<StateDef['scope'], string> = {
  world: 'The world itself',
  char: 'Everyone',
  protagonist: 'Only the player',
  npc: 'Everyone but the player',
  place: 'Places',
  item: 'Things',
  faction: 'Groups',
  relationship: 'A pair of people',
  work: 'Something being made',
  event: 'An encounter',
};

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// A length of time, written as a number and a unit (minutes, hours or days) and kept in minutes.
// A day is twenty-four hours on the clock.
const UNITS = [{ id: 'min', name: 'minutes', size: 1 }, { id: 'h', name: 'hours', size: 60 }, { id: 'd', name: 'days', size: 1440 }] as const;
export function Minutes({ value, onChange, label, max = 525_600 }: { value: number; onChange: (value: number) => void; label: string; max?: number }) {
  const fit = (minutes: number) => [...UNITS].reverse().find((unit) => minutes >= unit.size && minutes % unit.size === 0) ?? UNITS[0];
  const [unit, setUnit] = useState<(typeof UNITS)[number]>(() => fit(value));
  const [draft, setDraft] = useState(String(value / unit.size));
  useEffect(() => { const next = fit(value); setUnit(next); setDraft(String(value / next.size)); }, [value]);
  const send = (text: string, size: number) => {
    const number = Number(text);
    if (text.trim() === '' || !Number.isFinite(number) || number < 0) return;
    const minutes = Math.round(number * size);
    if (minutes <= max && minutes !== value) onChange(minutes);
  };
  return (
    <span className="row">
      <input type="number" inputMode="decimal" min={0} step="any" className="input num" aria-label={label} value={draft}
        onChange={(event) => { setDraft(event.target.value); send(event.target.value, unit.size); }}
        onBlur={() => setDraft(String(value / unit.size))} />
      <select className="input pick" aria-label={`${label}: unit`} value={unit.id}
        onChange={(event) => { const next = UNITS.find((entry) => entry.id === event.target.value)!; setUnit(next); send(draft, next.size); }}>
        {UNITS.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
      </select>
    </span>
  );
}
