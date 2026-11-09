import {
  GROUP_KINDS, KIND_NAMES, REACHES, REACH_HINTS, REACH_NAMES, hintFor, newSection, wouldLoop,
  type ExampleChat, type RecordSet, type Section, type StoryRecord, type World,
} from '../../core/records/index.js';
import { KeysField, NameField } from '../../kit/src/Fields';
import { newId } from '../../kit/src/util';

type Change = (record: StoryRecord) => void;

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export function RecordEditor({ world, record, onChange, onDelete }: { world: World; record: StoryRecord; onChange: Change; onDelete: () => void }) {
  const update = (patch: Partial<StoryRecord>) => onChange({ ...record, ...patch });
  const groups = world.records.filter((entry) => entry.kind === 'group' && entry.id !== record.id);
  const places = world.records.filter((entry) => entry.kind === 'place' && !wouldLoop(world, record.id, entry.id));
  const isPerson = record.kind === 'character' || record.kind === 'persona';

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>{record.name}</h1>
        <span className="chip line">{KIND_NAMES[record.kind].one}</span>
      </div>

      <NameField label="Name" value={record.name} onChange={(name) => update({ name })} />
      <KeysField label="Keys: other names that bring it into the story" value={record.keys} placeholder="Nicknames, titles, short names, separated by commas" onChange={(keys) => update({ keys })} />
      <label className="field">
        <span>Line: who or what this is to a stranger, in one sentence</span>
        <textarea rows={2} maxLength={400} value={record.line} onChange={(event) => update({ line: event.target.value })} />
      </label>

      <div className="row">
        {isPerson && (
          <label className="field grow">
            <span>Pronouns</span>
            <input value={record.pronouns} maxLength={40} placeholder="she/her" onChange={(event) => update({ pronouns: event.target.value })} />
          </label>
        )}
        {record.kind === 'place' && (
          <label className="field grow">
            <span>Inside</span>
            <select value={record.parentId ?? ''} onChange={(event) => update({ parentId: event.target.value || null })}>
              <option value="">Nowhere: it's a top-level place</option>
              {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
            </select>
          </label>
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

      {record.kind !== 'group' && groups.length > 0 && (
        <fieldset className="card" style={{ margin: 0 }}>
          <legend className="sub">Belongs to</legend>
          <div className="checks">
            {groups.map((group) => (
              <label key={group.id}>
                <input
                  type="checkbox"
                  checked={record.groupIds.includes(group.id)}
                  onChange={(event) => update({ groupIds: event.target.checked ? [...record.groupIds, group.id] : record.groupIds.filter((id) => id !== group.id) })}
                />
                {group.name}{group.groupKind !== 'other' ? ` (${group.groupKind})` : ''}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <h2 className="sub">Sections</h2>
      {record.sections.map((section, index) => (
        <SectionCard
          key={section.id}
          world={world}
          record={record}
          section={section}
          onChange={(next) => update({ sections: record.sections.map((existing) => (existing.id === section.id ? next : existing)) })}
          onMove={(by) => update({ sections: move(record.sections, index, index + by) })}
          onRemove={() => update({ sections: record.sections.filter((existing) => existing.id !== section.id) })}
          first={index === 0}
          last={index === record.sections.length - 1}
        />
      ))}
      <div className="row">
        <button type="button" className="btn small" onClick={() => update({ sections: [...record.sections, newSection(newId(), 'New section', 'named')] })}>Add a section</button>
      </div>

      <h2 className="sub">Sets: one in use at a time</h2>
      {record.sets.map((set) => (
        <SetCard
          key={set.id}
          set={set}
          onChange={(next) => update({ sets: record.sets.map((existing) => (existing.id === set.id ? next : existing)) })}
          onRemove={() => update({ sets: record.sets.filter((existing) => existing.id !== set.id) })}
        />
      ))}
      <div className="row">
        <button type="button" className="btn small" onClick={() => update({ sets: [...record.sets, { id: newId(), title: 'New set', reach: 'here', active: null, members: [] }] })}>Add a set</button>
      </div>

      {record.kind === 'character' && <ChatParts record={record} update={update} />}

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

function SectionCard({ world, record, section, onChange, onMove, onRemove, first, last }: {
  world: World;
  record: StoryRecord;
  section: Section;
  onChange: (section: Section) => void;
  onMove: (by: number) => void;
  onRemove: () => void;
  first: boolean;
  last: boolean;
}) {
  const id = `section-${section.id}`;
  const hint = hintFor(record.kind, section.title);
  return (
    <section className={`card ${section.reach}`} aria-labelledby={`${id}-title`}>
      <div className="card-head">
        <label className="sr" htmlFor={`${id}-title`}>Section title</label>
        <input id={`${id}-title`} className="title" value={section.title} maxLength={120} onChange={(event) => onChange({ ...section, title: event.target.value })} />
        <label className="sr" htmlFor={`${id}-reach`}>When it reaches the model</label>
        <select id={`${id}-reach`} value={section.reach} onChange={(event) => onChange({ ...section, reach: event.target.value as Section['reach'] })}>
          {REACHES.map((reach) => <option key={reach} value={reach}>{REACH_NAMES[reach]}</option>)}
        </select>
        <button type="button" className="icon-btn" aria-label="Move up" disabled={first} onClick={() => onMove(-1)}>↑</button>
        <button type="button" className="icon-btn" aria-label="Move down" disabled={last} onClick={() => onMove(1)}>↓</button>
        <button type="button" className="icon-btn" aria-label={`Remove ${section.title || 'this section'}`} onClick={onRemove}>×</button>
      </div>
      <p className="hint">{REACH_HINTS[section.reach]}</p>
      {section.reach === 'when' && (
        <label className="field">
          <span>Only while</span>
          <select value={section.when ?? ''} onChange={(event) => onChange({ ...section, when: event.target.value || null })}>
            <option value="">Pick a condition</option>
            {world.conditions.map((condition) => <option key={condition.id} value={condition.id}>{condition.label}</option>)}
          </select>
          {world.conditions.length === 0 && <span className="hint">This world has no conditions yet. Add them on the world's page.</span>}
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
    </section>
  );
}

function SetCard({ set, onChange, onRemove }: { set: RecordSet; onChange: (set: RecordSet) => void; onRemove: () => void }) {
  const id = `set-${set.id}`;
  const member = (memberId: string, patch: Partial<RecordSet['members'][number]>) =>
    onChange({ ...set, members: set.members.map((existing) => (existing.id === memberId ? { ...existing, ...patch } : existing)) });
  return (
    <section className="card" aria-labelledby={`${id}-title`}>
      <div className="card-head">
        <label className="sr" htmlFor={`${id}-title`}>Set title</label>
        <input id={`${id}-title`} className="title" value={set.title} maxLength={120} onChange={(event) => onChange({ ...set, title: event.target.value })} />
        <label className="sr" htmlFor={`${id}-reach`}>When the one in use reaches the model</label>
        <select id={`${id}-reach`} value={set.reach} onChange={(event) => onChange({ ...set, reach: event.target.value as RecordSet['reach'] })}>
          {REACHES.filter((reach) => reach !== 'when').map((reach) => <option key={reach} value={reach}>{REACH_NAMES[reach]}</option>)}
        </select>
        <button type="button" className="icon-btn" aria-label={`Remove ${set.title || 'this set'}`} onClick={onRemove}>×</button>
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
          </div>
          <button type="button" className="icon-btn" aria-label={`Remove ${entry.name || 'this one'}`} onClick={() => onChange({ ...set, members: set.members.filter((existing) => existing.id !== entry.id), active: set.active === entry.id ? null : set.active })}>×</button>
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => {
          const fresh = { id: newId(), name: '', text: '' };
          onChange({ ...set, members: [...set.members, fresh], active: set.active ?? fresh.id });
        }}>Add one</button>
      </div>
    </section>
  );
}

function ChatParts({ record, update }: { record: StoryRecord; update: (patch: Partial<StoryRecord>) => void }) {
  const chat = (chatId: string, patch: Partial<ExampleChat>) =>
    update({ examples: record.examples.map((existing) => (existing.id === chatId ? { ...existing, ...patch } : existing)) });
  return (
    <>
      <h2 className="sub">Chat only: greetings and example chats</h2>
      <p className="hint">The examples steer a character more than any section does. The adventure's narrator never gets them.</p>
      {record.greetings.map((greeting, index) => (
        <div key={greeting.id} className="card">
          <div className="card-head">
            <span className="label" style={{ flex: 1 }}>Greeting {index + 1}</span>
            <button type="button" className="icon-btn" aria-label={`Remove greeting ${index + 1}`} onClick={() => update({ greetings: record.greetings.filter((existing) => existing.id !== greeting.id) })}>×</button>
          </div>
          <label className="sr" htmlFor={`greeting-${greeting.id}`}>Greeting {index + 1}</label>
          <textarea id={`greeting-${greeting.id}`} maxLength={8000} value={greeting.text} placeholder="The first scene: where they are, what is in their hands, one line in their voice." onChange={(event) => update({ greetings: record.greetings.map((existing) => (existing.id === greeting.id ? { ...existing, text: event.target.value } : existing)) })} />
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => update({ greetings: [...record.greetings, { id: newId(), text: '', emotion: '' }] })}>Add a greeting</button>
      </div>

      {record.examples.map((example) => (
        <details key={example.id} className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 32 }}>{example.name || 'Example'} <span className="hint">· {example.messages.length} messages</span></summary>
          <div className="row">
            <label className="field grow"><span>Name</span><input value={example.name} maxLength={120} onChange={(event) => chat(example.id, { name: event.target.value })} /></label>
            <label className="field grow"><span>The other speaker</span><input value={example.userName} maxLength={60} onChange={(event) => chat(example.id, { userName: event.target.value })} /></label>
          </div>
          {example.messages.map((message, index) => (
            <div key={index} className="message">
              <label className="sr" htmlFor={`m-${example.id}-${index}-who`}>Who speaks</label>
              <select id={`m-${example.id}-${index}-who`} className="input" value={message.fromCharacter ? 'character' : 'user'} onChange={(event) => chat(example.id, { messages: example.messages.map((existing, at) => (at === index ? { ...existing, fromCharacter: event.target.value === 'character' } : existing)) })}>
                <option value="user">{example.userName || 'User'}</option>
                <option value="character">{record.name}</option>
              </select>
              <label className="sr" htmlFor={`m-${example.id}-${index}-text`}>Message {index + 1}</label>
              <textarea id={`m-${example.id}-${index}-text`} className="input" style={{ minHeight: 64 }} maxLength={8000} value={message.text} onChange={(event) => chat(example.id, { messages: example.messages.map((existing, at) => (at === index ? { ...existing, text: event.target.value } : existing)) })} />
              <button type="button" className="icon-btn" aria-label={`Remove message ${index + 1}`} onClick={() => chat(example.id, { messages: example.messages.filter((_, at) => at !== index) })}>×</button>
            </div>
          ))}
          <div className="row">
            <button type="button" className="btn small quiet" onClick={() => chat(example.id, { messages: [...example.messages, { fromCharacter: example.messages.at(-1)?.fromCharacter === false, text: '', emotion: '' }] })}>Add a message</button>
            <button type="button" className="btn small quiet" onClick={() => update({ examples: record.examples.filter((existing) => existing.id !== example.id) })}>Remove this example</button>
          </div>
        </details>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => update({ examples: [...record.examples, { id: newId(), name: 'New example', userName: 'User', messages: [] }] })}>Add an example chat</button>
      </div>
    </>
  );
}
