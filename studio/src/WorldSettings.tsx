import { useState } from 'react';
import type { World } from '../../core/records/index.js';
import { NameField } from '../../kit/src/Fields';
import { downloadJson, fileSafe, newId } from '../../kit/src/util';
import { go } from './go';
import { LAUNCH_KEY, readLaunches, withLaunch, worldToModule } from '../../core/convert/index.js';

export function WorldSettings({ world, onChange, onDelete }: { world: World; onChange: (world: World) => void; onDelete: () => void }) {
  const [label, setLabel] = useState('');
  const used = (id: string) => world.records.some((record) => record.sections.some((section) => section.when === id));
  const [note, setNote] = useState<string[]>([]);

  // Hands the world to the adventure as a module, in this browser, and opens it there.
  const play = () => {
    const { module } = worldToModule(world);
    const entry = { id: world.id, name: world.name, at: Date.now(), module };
    try {
      try {
        window.localStorage.setItem(LAUNCH_KEY, JSON.stringify(withLaunch(readLaunches(window.localStorage.getItem(LAUNCH_KEY)), entry)));
      } catch {
        // Out of room: keep only this one.
        window.localStorage.setItem(LAUNCH_KEY, JSON.stringify([entry]));
      }
    } catch {
      setNote(['This browser would not keep the world for the adventure. Export it as a module and open that file there instead.']);
      return;
    }
    go(`/?launch=${encodeURIComponent(world.id)}`);
  };
  const exportModule = () => {
    const { module, notes } = worldToModule(world);
    downloadJson(`${fileSafe(world.name)}.module.json`, module);
    setNote(notes.length ? notes : ['Saved as a module the adventure opens under New game.']);
  };
  const going = worldToModule(world).notes;

  return (
    <>
      <h1 className="ink-write">{world.name}</h1>
      <section className="card" aria-label="Play">
        <div className="row">
          <button type="button" className="btn primary" onClick={play}>Play in the adventure</button>
          <button type="button" className="btn quiet" onClick={exportModule}>Export as a module</button>
        </div>
        <p className="hint">Everything in this world plays by its rules as it stands. The adventure gets a copy; what happens there never changes the world.</p>
        {going.map((line) => <p key={line} className="hint">{line}</p>)}
        {note.map((line) => <p key={line} className="status" role="status">{line}</p>)}
      </section>
      <NameField label="Name" value={world.name} onChange={(name) => onChange({ ...world, name })} />
      <label className="field">
        <span>Premise · Always</span>
        <textarea rows={4} maxLength={4000} value={world.premise} placeholder="What this world is, in a few plain sentences. It goes with every turn." onChange={(event) => onChange({ ...world, premise: event.target.value })} />
      </label>
      <div className="row">
        <label className="field grow">
          <span>Genre</span>
          <input value={world.genre} maxLength={80} placeholder="Fantasy, crime, slice of life…" onChange={(event) => onChange({ ...world, genre: event.target.value })} />
        </label>
        <label className="field grow">
          <span>Tone</span>
          <input value={world.tone} maxLength={200} placeholder="Grim, warm, pulp…" onChange={(event) => onChange({ ...world, tone: event.target.value })} />
        </label>
      </div>

      <section className="card" aria-label="Conditions">
        <h2 className="sub" style={{ marginTop: 0 }}>Conditions</h2>
        <p className="hint">Shared by every record in this world. A When section names one, and its text is sent only while the condition holds.</p>
        {world.conditions.length === 0 && <p className="empty">None yet.</p>}
        {world.conditions.map((condition) => (
          <div key={condition.id} className="row">
            <NameField label="Condition" hideLabel className="grow" value={condition.label} onChange={(text) => onChange({ ...world, conditions: world.conditions.map((existing) => (existing.id === condition.id ? { ...existing, label: text } : existing)) })} />
            <button type="button" className="btn small quiet" disabled={used(condition.id)} title={used(condition.id) ? 'A section uses it' : undefined} onClick={() => onChange({ ...world, conditions: world.conditions.filter((existing) => existing.id !== condition.id) })}>Remove</button>
          </div>
        ))}
        <form className="row" onSubmit={(event) => { event.preventDefault(); if (!label.trim()) return; onChange({ ...world, conditions: [...world.conditions, { id: newId(), label: label.trim() }] }); setLabel(''); }}>
          <label className="sr" htmlFor="new-condition">New condition</label>
          <input id="new-condition" className="input grow" value={label} maxLength={120} placeholder="Such as: Night, Close friends, After the raid" onChange={(event) => setLabel(event.target.value)} />
          <button type="submit" className="btn small" disabled={!label.trim()}>Add</button>
        </form>
      </section>

      <div className="row">
        <button type="button" className="btn danger" onClick={onDelete}>Delete this world</button>
      </div>
    </>
  );
}
