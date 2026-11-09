import { useState, type ChangeEvent } from 'react';
import {
  KIND_NAMES, RECORD_KINDS, importCardFile, newRecord, placeTree, putRecord, recordById, removeRecord,
  type RecordKind, type StoryRecord, type World,
} from '../../core/records/index.js';
import { ContextPanel } from './ContextPanel';
import { RecordEditor } from './RecordEditor';
import { WorldSettings } from './WorldSettings';
import { downloadJson, fileSafe, newId, readFileBytes } from '../../kit/src/util';

type Status = { text: string; bad?: boolean } | null;

export function WorldView({ world, onChange, onDelete, onStatus, status }: {
  world: World;
  onChange: (world: World) => void;
  onDelete: () => void;
  onStatus: (status: Status) => void;
  status: Status;
}) {
  const [selected, setSelected] = useState<string | 'world' | null>(world.records.length ? null : 'world');
  const record = selected && selected !== 'world' ? recordById(world, selected) : undefined;

  const add = (kind: RecordKind) => {
    const fresh = newRecord(kind, newId(), `New ${KIND_NAMES[kind].one.toLowerCase()}`, newId);
    if (kind === 'place' && record?.kind === 'place') fresh.parentId = record.id;
    onChange(putRecord(world, fresh, Date.now()));
    setSelected(fresh.id);
  };

  const importCard = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = importCardFile(world, await readFileBytes(file), newId, Date.now());
      if (!imported.ok) { onStatus({ text: imported.errors.join(' '), bad: true }); return; }
      onChange(imported.result.world);
      setSelected(imported.result.recordId);
      const name = recordById(imported.result.world, imported.result.recordId)?.name ?? 'the character';
      onStatus({ text: [`Brought in ${name}.`, ...imported.result.notes].join(' ') });
    } catch (error) {
      onStatus({ text: (error as Error).message, bad: true });
    }
  };

  const listFor = (kind: RecordKind): { record: StoryRecord; depth: number }[] =>
    kind === 'place' ? placeTree(world) : world.records.filter((entry) => entry.kind === kind).map((entry) => ({ record: entry, depth: 0 }));

  return (
    <div className={`world${selected ? ' open' : ''}`}>
      <nav className="rail" aria-label={`${world.name}: records`}>
        <button type="button" className="item" aria-current={selected === 'world'} onClick={() => setSelected('world')}>
          <h2>{world.name}</h2>
        </button>
        <div className="row">
          <button type="button" className="btn small quiet" onClick={() => downloadJson(`${fileSafe(world.name)}.world.json`, world)}>Export</button>
          <span className="btn small quiet file-btn">
            Import a card
            <input type="file" accept="application/json,.json,image/png,.png" aria-label="Import a card" onChange={(event) => void importCard(event)} />
          </span>
        </div>
        {status && <p className={`status${status.bad ? ' bad' : ''}`} role="status">{status.text}</p>}
        {RECORD_KINDS.map((kind) => {
          const entries = listFor(kind);
          return (
            <section key={kind} className="kind" aria-label={KIND_NAMES[kind].many}>
              <div className="kind-head">
                <h3>{KIND_NAMES[kind].many}</h3>
                <button type="button" className="btn small quiet" onClick={() => add(kind)} aria-label={`Add a ${KIND_NAMES[kind].one.toLowerCase()}`}>Add</button>
              </div>
              {entries.length === 0 && <p className="empty">None yet.</p>}
              {entries.map(({ record: entry, depth }) => (
                <button type="button" key={entry.id} className="item" aria-current={selected === entry.id} style={{ paddingLeft: 10 + depth * 16 }} onClick={() => setSelected(entry.id)}>
                  <span>{entry.name}</span>
                  {kind === 'group' && entry.groupKind !== 'other' && <small>{entry.groupKind}</small>}
                </button>
              ))}
            </section>
          );
        })}
      </nav>

      <main className="editor">
        <button type="button" className="btn small quiet back" onClick={() => setSelected(null)}>Back to {world.name}</button>
        {selected === 'world' && <WorldSettings world={world} onChange={onChange} onDelete={onDelete} />}
        {record && (
          <RecordEditor
            key={record.id}
            world={world}
            record={record}
            onChange={(next) => onChange(putRecord(world, next, Date.now()))}
            onDelete={() => {
              if (!window.confirm(`Delete ${record.name}?`)) return;
              onChange(removeRecord(world, record.id, Date.now()));
              setSelected(null);
            }}
          />
        )}
        {!selected && <p className="hint">Pick something on the left, or add a place or a character to start.</p>}
      </main>

      <ContextPanel world={world} focusId={record?.id ?? null} />
    </div>
  );
}
