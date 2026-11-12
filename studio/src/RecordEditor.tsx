// A record's page (docs/bids/ui/decision.md). The page is the writing: the name and one line of
// who this is, the doors to its other jobs, then sections, sets and notes. A section folds to one
// row of its title, its reach and its first words until it is opened.
import { useState, type ReactNode } from 'react';
import {
  GROUP_KINDS, KIND_NAMES, REACHES, REACH_HINTS, REACH_NAMES, hintFor, newSection, wouldLoop,
  type RecordSet, type Section, type StoryRecord, type World,
} from '../../core/records/index.js';
import { KeysField, NameField } from '../../kit/src/Fields';
import { newId } from '../../kit/src/util';
import { RecordMulti, RecordPick, withinOf } from './RecordPick';
import { DraftButton, DraftsFor, NameIdeas, draftWaiting } from './Drafting';
import type { DraftsApi } from './author/useDrafts';

type Change = (record: StoryRecord) => void;

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

// Which sections and sets were left open on each record, for as long as the Studio stays open, so
// coming back to a record finds the part being written still open.
const LEFT_OPEN = new Map<string, Set<string>>();

const firstWords = (text: string) => text.trim().replace(/\s+/g, ' ').slice(0, 160);

export function RecordEditor({ world, record, drafts, onChange, onDelete, doors }: { world: World; record: StoryRecord; drafts: DraftsApi; onChange: Change; onDelete: () => void; doors?: ReactNode }) {
  const update = (patch: Partial<StoryRecord>) => onChange({ ...record, ...patch });
  const hasGroups = world.records.some((entry) => entry.kind === 'group' && entry.id !== record.id);
  const isPerson = record.kind === 'character' || record.kind === 'persona';
  const [open, setOpen] = useState<Set<string>>(() => new Set(LEFT_OPEN.get(record.id)));
  const fold = (id: string, on: boolean) => {
    const next = new Set(open);
    if (on) next.add(id); else next.delete(id);
    LEFT_OPEN.set(record.id, next);
    setOpen(next);
  };
  // A record nobody has written in yet opens on its name.
  const [untouched] = useState(() => !record.line && record.name.startsWith('New ') && record.sections.every((section) => !section.text));

  const groups = record.groupIds.map((id) => world.records.find((entry) => entry.id === id)?.name).filter(Boolean);
  const within = record.kind === 'place' ? withinOf(world, record, 3) : '';
  const facts = [
    isPerson && record.pronouns, isPerson && record.gender,
    record.kind === 'group' && record.groupKind !== 'other' && record.groupKind,
    within && `in ${within}`, ...groups,
  ].filter(Boolean);

  return (
    <>
      <div className="row between">
        <h1 className="ink-write">{record.name}</h1>
        <span className="row">
          {record.kind === 'character' && <a className="btn small quiet" href={`/chat/#/with/${encodeURIComponent(world.id)}/${encodeURIComponent(record.id)}`}>Chat with {record.name}</a>}
          <span className="chip line">{KIND_NAMES[record.kind].one}</span>
        </span>
      </div>
      {record.line && <p className="identity">{record.line}</p>}
      {facts.length > 0 && <p className="hint">{facts.join(' · ')}</p>}

      <details className="card fold names" open={untouched || undefined}>
        <summary><b>Names and keys</b> <span className="hint">{record.keys.length ? record.keys.join(', ') : 'The name, other names, and the line'}</span></summary>
        <NameField label="Name" value={record.name} onChange={(name) => update({ name })} />
        {untouched && <NameIdeas world={world} record={record} onPick={(name) => update({ name })} />}
        <KeysField label="Keys: other names that bring it into the story" value={record.keys} placeholder="Nicknames, titles, short names, separated by commas" onChange={(keys) => update({ keys })} />
        <label className="field">
          <span>Line: who or what this is to a stranger, in one sentence</span>
          <textarea rows={2} maxLength={400} value={record.line} onChange={(event) => update({ line: event.target.value })} />
        </label>
        <DraftButton world={world} record={record} target={{ field: 'line' }} api={drafts} label="the line" />
        <DraftsFor world={world} record={record} target={{ field: 'line' }} api={drafts} onChange={onChange} label="Line" />
        <div className="row">
          {isPerson && (
            <label className="field grow">
              <span>Pronouns</span>
              <input value={record.pronouns} maxLength={40} placeholder="she/her" onChange={(event) => update({ pronouns: event.target.value })} />
            </label>
          )}
          {isPerson && (
            <label className="field grow">
              <span>Gender</span>
              <input value={record.gender} maxLength={80} onChange={(event) => update({ gender: event.target.value })} />
            </label>
          )}
          {record.kind === 'place' && (
            <div className="field grow">
              <span>Inside</span>
              <RecordPick world={world} label="Inside" kinds={['place']} only={(entry) => !wouldLoop(world, record.id, entry.id)} none="Nowhere: it's a top-level place" value={record.parentId ?? ''} onChange={(id) => update({ parentId: id || null })} />
            </div>
          )}
          {record.kind === 'group' && (
            <label className="field grow">
              <span>Kind of group</span>
              <select value={record.groupKind} onChange={(event) => update({ groupKind: event.target.value as StoryRecord['groupKind'] })}>
                {GROUP_KINDS.map((kind) => <option key={kind} value={kind}>{kind[0].toUpperCase() + kind.slice(1)}</option>)}
              </select>
            </label>
          )}
        </div>
        {record.kind !== 'group' && hasGroups && (
          <div className="field">
            <span>Belongs to</span>
            <RecordMulti world={world} label="Belongs to" kinds={['group']} only={(entry) => entry.id !== record.id} values={record.groupIds} empty="No groups." onChange={(groupIds) => update({ groupIds })} />
          </div>
        )}
      </details>

      {doors}

      <div className="row between">
        <h2 className="sub">Sections</h2>
        <button type="button" className="btn small quiet" onClick={() => { const fresh = newSection(newId(), 'New section', 'named'); update({ sections: [...record.sections, fresh] }); fold(fresh.id, true); }}>Add a section</button>
      </div>
      {record.sections.length === 0 && <p className="empty">No sections yet.</p>}
      {record.sections.map((section, index) => (open.has(section.id) ? (
        <SectionCard
          key={section.id}
          world={world}
          record={record}
          section={section}
          drafts={drafts}
          onRecord={onChange}
          onChange={(next) => update({ sections: record.sections.map((existing) => (existing.id === section.id ? next : existing)) })}
          onMove={(by) => update({ sections: move(record.sections, index, index + by) })}
          onRemove={() => update({ sections: record.sections.filter((existing) => existing.id !== section.id) })}
          onFold={() => fold(section.id, false)}
          first={index === 0}
          last={index === record.sections.length - 1}
        />
      ) : (
        <FoldRow key={section.id} title={section.title || 'Untitled'} reach={section.reach} says={firstWords(section.text)} waiting={draftWaiting(drafts, { field: 'section', sectionId: section.id })} onOpen={() => fold(section.id, true)} />
      )))}

      <div className="row between">
        <h2 className="sub">Sets: one in use at a time</h2>
        <button type="button" className="btn small quiet" onClick={() => { const fresh: RecordSet = { id: newId(), title: 'New set', reach: 'here', active: null, members: [] }; update({ sets: [...record.sets, fresh] }); fold(fresh.id, true); }}>Add a set</button>
      </div>
      {record.sets.length === 0 && <p className="empty">None. A set holds things only one of which is true at a time, such as outfits.</p>}
      {record.sets.map((set) => (open.has(set.id) ? (
        <SetCard
          key={set.id}
          set={set}
          conditions={world.conditions}
          onChange={(next) => update({ sets: record.sets.map((existing) => (existing.id === set.id ? next : existing)) })}
          onRemove={() => update({ sets: record.sets.filter((existing) => existing.id !== set.id) })}
          onFold={() => fold(set.id, false)}
        />
      ) : (
        <FoldRow key={set.id} title={set.title || 'Untitled'} reach={set.reach} empty="Nothing in it yet" onOpen={() => fold(set.id, true)}
          says={set.members.length ? `In use: ${set.members.find((entry) => entry.id === set.active)?.name || 'none'} · ${set.members.length} in it` : ''} />
      )))}

      <label className="field">
        <span>Notes · Never sent</span>
        <textarea rows={3} maxLength={20000} value={record.notes} placeholder="Reminders for yourself. The model never sees these." onChange={(event) => update({ notes: event.target.value })} />
      </label>

      <div className="row">
        <button type="button" className="btn danger" onClick={onDelete}>Delete {record.name}</button>
      </div>
    </>
  );
}

// A section or a set, folded: its title, when it reaches the model, and its first words.
function FoldRow({ title, reach, says, empty = 'Empty', waiting = false, onOpen }: { title: string; reach: Section['reach']; says: string; empty?: string; waiting?: boolean; onOpen: () => void }) {
  return (
    <button type="button" className={`fold-row ${reach}`} aria-expanded={false} aria-label={`${title}, ${REACH_NAMES[reach]}: open to write`} onClick={onOpen}>
      <span className="fold-title">{title}</span>
      <span className={`chip ${reach}`}>{REACH_NAMES[reach]}</span>
      <span className={`fold-says${says ? '' : ' none'}`}>{says || empty}</span>
      {waiting && <span className="chip draft-chip">Draft waiting</span>}
      <span className="chev" aria-hidden="true">▸</span>
    </button>
  );
}

function SectionCard({ world, record, section, drafts, onRecord, onChange, onMove, onRemove, onFold, first, last }: {
  world: World;
  record: StoryRecord;
  section: Section;
  drafts: DraftsApi;
  onRecord: (record: StoryRecord) => void;
  onChange: (section: Section) => void;
  onMove: (by: number) => void;
  onRemove: () => void;
  onFold: () => void;
  first: boolean;
  last: boolean;
}) {
  const id = `section-${section.id}`;
  const hint = hintFor(record.kind, section.title);
  return (
    <section className={`card ${section.reach}`} aria-labelledby={`${id}-title`}>
      <div className="card-head">
        <button type="button" className="icon-btn" aria-expanded aria-label={`Fold ${section.title || 'this section'}`} onClick={onFold}>▾</button>
        <label className="sr" htmlFor={`${id}-title`}>Section title</label>
        <input id={`${id}-title`} className="title" value={section.title} maxLength={120} onChange={(event) => onChange({ ...section, title: event.target.value })} />
        <label className="sr" htmlFor={`${id}-reach`}>When it reaches the model</label>
        <select id={`${id}-reach`} value={section.reach} onChange={(event) => onChange({ ...section, reach: event.target.value as Section['reach'] })}>
          {REACHES.map((reach) => <option key={reach} value={reach}>{REACH_NAMES[reach]}</option>)}
        </select>
      </div>
      <p className="hint">{REACH_HINTS[section.reach]}</p>
      {section.reach === 'when' && (
        <label className="field">
          <span>Only while</span>
          <select value={section.when ?? ''} onChange={(event) => onChange({ ...section, when: event.target.value || null })}>
            <option value="">Pick a condition</option>
            {world.conditions.map((condition) => <option key={condition.id} value={condition.id}>{condition.label}</option>)}
          </select>
          {world.conditions.length === 0 && <span className="hint">This world has no conditions yet. Add them on the world's About page.</span>}
        </label>
      )}
      {(section.reach === 'named' || section.reach === 'when') && (
        <KeysField
          label={section.reach === 'named' ? 'Keys that bring it in' : 'Keys, if it should also wait to be named'}
          value={section.keys}
          placeholder={section.reach === 'named' ? `Empty means ${record.name}'s own name and keys` : 'Empty: sent while the condition holds and they are here or named'}
          onChange={(keys) => onChange({ ...section, keys })}
        />
      )}
      <label className="sr" htmlFor={`${id}-text`}>{section.title} text</label>
      <textarea id={`${id}-text`} maxLength={20000} value={section.text} placeholder={hint || 'Plain, concrete prose. The model copies its voice.'} onChange={(event) => onChange({ ...section, text: event.target.value })} />
      <DraftButton world={world} record={record} target={{ field: 'section', sectionId: section.id }} api={drafts} label={section.title || 'this section'} />
      <DraftsFor world={world} record={record} target={{ field: 'section', sectionId: section.id }} api={drafts} onChange={onRecord} label={section.title || 'This section'} />
      <div className="row">
        <button type="button" className="btn small quiet" disabled={first} onClick={() => onMove(-1)}>Move up</button>
        <button type="button" className="btn small quiet" disabled={last} onClick={() => onMove(1)}>Move down</button>
        <button type="button" className="btn small quiet" aria-label={`Remove ${section.title || 'this section'}`} onClick={onRemove}>Remove</button>
      </div>
    </section>
  );
}

function SetCard({ set, conditions, onChange, onRemove, onFold }: { set: RecordSet; conditions: World['conditions']; onChange: (set: RecordSet) => void; onRemove: () => void; onFold: () => void }) {
  const id = `set-${set.id}`;
  const member = (memberId: string, patch: Partial<RecordSet['members'][number]>) =>
    onChange({ ...set, members: set.members.map((existing) => (existing.id === memberId ? { ...existing, ...patch } : existing)) });
  return (
    <section className="card" aria-labelledby={`${id}-title`}>
      <div className="card-head">
        <button type="button" className="icon-btn" aria-expanded aria-label={`Fold ${set.title || 'this set'}`} onClick={onFold}>▾</button>
        <label className="sr" htmlFor={`${id}-title`}>Set title</label>
        <input id={`${id}-title`} className="title" value={set.title} maxLength={120} onChange={(event) => onChange({ ...set, title: event.target.value })} />
        <label className="sr" htmlFor={`${id}-reach`}>When the one in use reaches the model</label>
        <select id={`${id}-reach`} value={set.reach} onChange={(event) => onChange({ ...set, reach: event.target.value as RecordSet['reach'] })}>
          {REACHES.filter((reach) => reach !== 'when').map((reach) => <option key={reach} value={reach}>{REACH_NAMES[reach]}</option>)}
        </select>
      </div>
      <p className="hint">Only the one picked is sent. {REACH_HINTS[set.reach]}</p>
      {set.members.length === 0 && <p className="empty">Nothing in it yet.</p>}
      {set.members.map((entry) => (
        <div key={entry.id} className="member">
          <input type="radio" name={`${id}-active`} aria-label={`Use ${entry.name || 'this one'}`} checked={set.active === entry.id} onChange={() => onChange({ ...set, active: entry.id })} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="sr" htmlFor={`${id}-${entry.id}-name`}>Name</label>
            <input id={`${id}-${entry.id}-name`} className="input" value={entry.name} maxLength={120} placeholder="Everyday, Work, Formal…" onChange={(event) => member(entry.id, { name: event.target.value })} />
            <label className="sr" htmlFor={`${id}-${entry.id}-text`}>{entry.name} text</label>
            <textarea id={`${id}-${entry.id}-text`} maxLength={20000} value={entry.text} onChange={(event) => member(entry.id, { text: event.target.value })} />
            {(conditions.length > 0 || entry.lock) && (
              <label className="field">
                <span>A player can pick it</span>
                <select value={entry.lock ?? ''} onChange={(event) => member(entry.id, { lock: event.target.value || null })}>
                  <option value="">Any time</option>
                  {conditions.map((condition) => <option key={condition.id} value={condition.id}>Once: {condition.label}</option>)}
                </select>
              </label>
            )}
          </div>
          <button type="button" className="icon-btn" aria-label={`Remove ${entry.name || 'this one'}`} onClick={() => onChange({ ...set, members: set.members.filter((existing) => existing.id !== entry.id), active: set.active === entry.id ? null : set.active })}>×</button>
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => {
          const fresh = { id: newId(), name: '', text: '', lock: null, layers: [] };
          onChange({ ...set, members: [...set.members, fresh], active: set.active ?? fresh.id });
        }}>Add one</button>
        <button type="button" className="btn small quiet" aria-label={`Remove ${set.title || 'this set'}`} onClick={onRemove}>Remove the set</button>
      </div>
    </section>
  );
}
