import { useState } from 'react';
import type { World } from '../../core/records/index.js';
import { NameField } from '../../kit/src/Fields';
import { downloadJson, fileSafe, newId, readJsonFile } from '../../kit/src/util';
import { exportTalks, importTalks } from './author/store';
import { go } from './go';
import { LAUNCH_KEY, readLaunches, withLaunch, worldToModule } from '../../core/convert/index.js';
import { homesOf } from '../../core/chat/home.js';
import { homeHref } from '../../kit/src/activity';

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
  const household = world.use === 'household';
  const going = household ? [] : worldToModule(world).notes;
  const homes = homesOf([world]);
  const people = world.records.filter((record) => record.kind === 'character').length;
  const [talkNote, setTalkNote] = useState<{ text: string; bad?: boolean } | null>(null);
  // Talks with Errata and the drafts waiting go in a file of their own (the owner's answer,
  // Nov 12); the world's file never carries them.
  const saveTalks = async () => {
    const file = await exportTalks(world.id, world.name);
    if (!file.talks.length && !file.drafts.length) { setTalkNote({ text: 'No talks or waiting drafts in this world yet.' }); return; }
    downloadJson(`${fileSafe(world.name)}.talks.json`, file);
    setTalkNote({ text: `Saved ${file.talks.length} talk${file.talks.length === 1 ? '' : 's'} and ${file.drafts.length} waiting draft${file.drafts.length === 1 ? '' : 's'}.` });
  };
  const openTalks = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const done = await importTalks(await readJsonFile(file), world.id);
      setTalkNote(done.ok ? { text: `Brought back ${done.talks} talk${done.talks === 1 ? '' : 's'} and ${done.drafts} draft${done.drafts === 1 ? '' : 's'}. Any already here were kept as they were.` } : { text: done.reason, bad: true });
    } catch (error) {
      setTalkNote({ text: (error as Error).message, bad: true });
    }
  };

  return (
    <>
      <h1 className="ink-write">{world.name}</h1>
      <fieldset className="card" aria-label="What this world is for">
        <legend className="sub">What this world is for</legend>
        <label className="check">
          <input type="radio" name="world-use" checked={!household} onChange={() => { const { use: _use, ...rest } = world; onChange(rest); }} />
          <span><b>A world.</b> Places, people and rules, played as an adventure. Its characters can be chatted with too.</span>
        </label>
        <label className="check">
          <input type="radio" name="world-use" checked={household} onChange={() => onChange({ ...world, use: 'household' })} />
          <span><b>A household.</b> People to chat with and the home they live in. It is for Chat, and isn&rsquo;t offered as an adventure.</span>
        </label>
      </fieldset>
      {household ? (
        <section className="card" aria-label="In Chat">
          <div className="row">
            {homes.map((home) => <a key={home.scenario.id} className="btn primary" href={homeHref(world.id, home.scenario.id)}>Open {home.scenario.name} in Home</a>)}
            <a className={`btn${homes.length ? ' quiet' : ' primary'}`} href="/chat/">Open Chat</a>
          </div>
          <p className="hint">{homes.length ? `${homes.length === 1 ? 'Its home is' : 'Its homes are'} in Chat, under Homes.` : 'No home yet. A home is a scenario with rooms: add a scenario and open its Home door.'} {people ? `Its ${people === 1 ? 'person is' : `${people} people are`} met in Chat.` : 'Add a character and they can be met in Chat.'}</p>
        </section>
      ) : (
        <section className="card" aria-label="Play">
          <div className="row">
            <button type="button" className="btn primary" onClick={play}>Play in the adventure</button>
            <button type="button" className="btn quiet" onClick={exportModule}>Export as a module</button>
          </div>
          <p className="hint">Everything in this world plays by its rules as it stands. The adventure gets a copy; what happens there never changes the world.</p>
          {going.map((line) => <p key={line} className="hint">{line}</p>)}
          {note.map((line) => <p key={line} className="status" role="status">{line}</p>)}
        </section>
      )}
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

      <section className="card" aria-label="Talks">
        <h2 className="sub" style={{ marginTop: 0 }}>Talks with Errata</h2>
        <p className="hint">Kept in this browser beside the world, with the drafts waiting under fields. The world&rsquo;s own file never carries them, so a shared world doesn&rsquo;t bring your working notes. Save them to keep a copy or move them to another device.</p>
        <div className="row">
          <button type="button" className="btn quiet" onClick={() => void saveTalks()}>Export talks</button>
          <span className="btn quiet file-btn">
            Open a talks file
            <input type="file" accept="application/json,.json" aria-label="Open a talks file" onChange={(event) => void openTalks(event.target)} />
          </span>
        </div>
        {talkNote && <p className={`status${talkNote.bad ? ' bad' : ''}`} role="status">{talkNote.text}</p>}
      </section>

      <div className="row">
        <button type="button" className="btn danger" onClick={onDelete}>Delete this world</button>
      </div>
    </>
  );
}
