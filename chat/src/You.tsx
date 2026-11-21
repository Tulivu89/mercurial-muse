// You: the personas you chat as. A persona is a record like any other (docs/records.md), so it
// can be edited in the Studio too; here are the parts a chat reads: the name they call you, your
// pronouns, who you are and how you look. One is the default a new chat starts with, and any
// chat can change who you are in it.
import { PageHead } from '../../kit/src/PageHead';
import { useState, type ChangeEvent } from 'react';
import { newSection, type StoryRecord, type World } from '../../core/records/index.js';
import { NameField } from '../../kit/src/Fields';
import { IMAGE_TYPES } from '../../kit/src/media';
import { Sheet } from '../../kit/src/Sheet';
import { newId } from '../../kit/src/util';
import { Portrait } from './Portrait';
import type { Settings } from './settings';
import { portraitOwner, type PortraitSet } from './store';

export interface PersonaRef { world: World; record: StoryRecord }
export const personasOf = (worlds: readonly World[]): PersonaRef[] => worlds.flatMap((world) => world.records.filter((record) => record.kind === 'persona').map((record) => ({ world, record })));
export const personaKey = (worldId: string, recordId: string) => `${worldId}:${recordId}`;
export const defaultPersona = (worlds: readonly World[], settings: Pick<Settings, 'persona'>): PersonaRef | null => personasOf(worlds).find((entry) => personaKey(entry.world.id, entry.record.id) === settings.persona) ?? null;

// The two parts of a persona a chat sends: who you are, and how you look. Each is a section, so
// the Studio shows the same text.
const WHO = /^(who you are|personality)$/i;
const LOOK = /^appearance$/i;
const textOf = (record: StoryRecord, pattern: RegExp) => record.sections.find((section) => pattern.test(section.title.trim()))?.text ?? '';
function withText(record: StoryRecord, pattern: RegExp, title: string, text: string): StoryRecord {
  const found = record.sections.find((section) => pattern.test(section.title.trim()));
  if (found) return { ...record, sections: record.sections.map((section) => (section === found ? { ...section, text } : section)) };
  return text.trim() ? { ...record, sections: [...record.sections, { ...newSection(newId(), title, 'always'), text }] } : record;
}

export function You({ worlds, portraits, settings, status, onSettings, onCreate, onSave, onDelete, onPicture, onImport }: {
  worlds: World[] | null;
  portraits: Record<string, PortraitSet>;
  settings: Settings;
  status?: { text: string; bad?: boolean } | null;
  onSettings: (settings: Settings) => void;
  onCreate: (name: string) => Promise<PersonaRef>;
  onSave: (worldId: string, record: StoryRecord) => void;
  onDelete: (worldId: string, record: StoryRecord) => void;
  onPicture: (owner: string, slot: string, file: File | null) => void;
  onImport: (file: File) => void;
}) {
  const personas = personasOf(worlds ?? []);
  const [name, setName] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const open = personas.find((entry) => personaKey(entry.world.id, entry.record.id) === openKey) ?? null;

  const create = async () => {
    if (!name.trim()) return;
    try {
      const made = await onCreate(name.trim());
      setName(''); setNote('');
      setOpenKey(personaKey(made.world.id, made.record.id));
      // The first persona made is who you are until you say otherwise.
      if (!personas.length) onSettings({ ...settings, persona: personaKey(made.world.id, made.record.id) });
    } catch (error) { setNote(error instanceof Error ? error.message : 'The persona could not be made.'); }
  };
  const upload = (owner: string) => (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onPicture(owner, 'avatar', file); };

  return (
    <main className="home you">
      <PageHead eyebrow="Chat" title="You" lede="Who you are to the people you talk to. A persona is the name they call you, and what they can see and know about you. Keep one, or one for every story." />
      {status && <p className={`status${status.bad ? ' bad' : ''}`} role="status">{status.text}</p>}
      {note && <p className="status bad" role="status">{note}</p>}
      {worlds === null && <p className="status" role="status">Opening your library…</p>}

      <div className="persona-list">
        {personas.map((entry) => {
          const key = personaKey(entry.world.id, entry.record.id);
          const usual = settings.persona === key;
          const says = entry.record.line || textOf(entry.record, WHO).replace(/\s+/g, ' ').slice(0, 160);
          return (
            <article key={key} className={`persona-card${usual ? ' usual' : ''}`} aria-label={entry.record.name}>
              <Portrait name={entry.record.name} set={portraits[portraitOwner(entry.world.id, entry.record.id)]} size={64} />
              <div className="persona-text">
                <span className="row"><b className="persona-name">{entry.record.name}</b>{usual && <span className="chip">Your usual</span>}</span>
                <span className="hint">{[entry.record.pronouns, entry.world.name].filter(Boolean).join(' · ')}</span>
                <span className="persona-says">{says || 'Nothing written yet. They will know your name and nothing else.'}</span>
                <span className="row">
                  <button type="button" className="btn small" onClick={() => setOpenKey(key)}>Edit</button>
                  {!usual && <button type="button" className="btn small quiet" onClick={() => onSettings({ ...settings, persona: key })}>Make this your usual</button>}
                  {usual && <button type="button" className="btn small quiet" onClick={() => onSettings({ ...settings, persona: '' })}>Stop using by default</button>}
                </span>
              </div>
            </article>
          );
        })}
        {worlds !== null && personas.length === 0 && <p className="empty">No personas yet. Without one, a chat knows only the name below.</p>}
      </div>

      <form className="row" onSubmit={(event) => { event.preventDefault(); void create(); }}>
        <label className="field grow">
          <span>A new persona</span>
          <input value={name} maxLength={120} placeholder="The name they call you" onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" className="btn primary" style={{ alignSelf: 'flex-end' }} disabled={!name.trim() || worlds === null}>Make it</button>
        <span className="btn file-btn" style={{ alignSelf: 'flex-end' }}>
          Import a user card
          <input type="file" accept="application/json,.json,image/png,.png" aria-label="Import a user card" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onImport(file); }} />
        </span>
      </form>

      <section className="card" aria-label="With no persona">
        <label className="field">
          <span>With no persona, they call you</span>
          <input value={settings.userName} maxLength={120} placeholder="User" onChange={(event) => onSettings({ ...settings, userName: event.target.value })} />
        </label>
        <p className="hint">A chat started as just a name sends nothing else about you. A new chat asks who you are, and you can change it later from the character's sheet in the chat.</p>
      </section>

      {open && (
        <PersonaSheet
          key={openKey}
          entry={open}
          set={portraits[portraitOwner(open.world.id, open.record.id)]}
          onClose={() => setOpenKey(null)}
          onSave={(record) => onSave(open.world.id, record)}
          onDelete={() => {
            if (!window.confirm(`Delete ${open.record.name}? Chats that used this persona keep the name and lose the rest.`)) return;
            if (settings.persona === openKey) onSettings({ ...settings, persona: '' });
            onDelete(open.world.id, open.record);
            setOpenKey(null);
          }}
          onUpload={upload(portraitOwner(open.world.id, open.record.id))}
          onRemovePicture={() => onPicture(portraitOwner(open.world.id, open.record.id), 'avatar', null)}
        />
      )}
    </main>
  );
}

function PersonaSheet({ entry, set, onClose, onSave, onDelete, onUpload, onRemovePicture }: {
  entry: PersonaRef; set?: PortraitSet; onClose: () => void; onSave: (record: StoryRecord) => void; onDelete: () => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onRemovePicture: () => void;
}) {
  const { world, record } = entry;
  const update = (patch: Partial<StoryRecord>) => onSave({ ...record, ...patch });
  return (
    <Sheet title={`You, as ${record.name}`} onClose={onClose} closeLabel="Done">
      <div className="row">
        <Portrait name={record.name} set={set} size={72} />
        <span className="row">
          <span className="btn small file-btn">{set?.avatar ? 'Change your picture' : 'Add your picture'}<input type="file" accept={IMAGE_TYPES} aria-label={`Picture for ${record.name}`} onChange={onUpload} /></span>
          {set?.avatar && <button type="button" className="link danger" onClick={onRemovePicture}>Remove</button>}
        </span>
      </div>
      <div className="row">
        <NameField label="Name" className="field grow" value={record.name} onChange={(name) => update({ name })} />
        <label className="field grow"><span>Pronouns</span><input value={record.pronouns} maxLength={40} placeholder="she/her, he/him, they/them" onChange={(event) => update({ pronouns: event.target.value })} /></label>
      </div>
      <label className="field">
        <span>Who you are</span>
        <textarea rows={4} maxLength={20000} value={textOf(record, WHO)} placeholder="What they would know or notice about you: what you do, how you carry yourself, what you are to them." onChange={(event) => onSave(withText(record, WHO, 'Who you are', event.target.value))} />
      </label>
      <label className="field">
        <span>How you look</span>
        <textarea rows={3} maxLength={20000} value={textOf(record, LOOK)} placeholder="Build, face, colouring, what you usually wear." onChange={(event) => onSave(withText(record, LOOK, 'Appearance', event.target.value))} />
      </label>
      <label className="field">
        <span>In one sentence, to a stranger</span>
        <input value={record.line} maxLength={400} placeholder="A night-shift cabbie who knows every back street." onChange={(event) => update({ line: event.target.value })} />
      </label>
      <p className="hint">Both go with every reply in a chat you are {record.name} in. Outfits, anything keyed to a word, and the rest are in the <a href={`/studio/#/w/${encodeURIComponent(world.id)}?rec=${encodeURIComponent(record.id)}`}>Studio</a>.</p>
      <div className="row">
        <button type="button" className="btn small danger" onClick={onDelete}>Delete this persona</button>
      </div>
    </Sheet>
  );
}
