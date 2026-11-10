// Every part of one state: who holds it, its range, the words its bands write, what moves it,
// and where it ends.
import { DEFAULT_STATE_LINE, STATE_SCOPES, type Ruleset, type StateDef } from '../../../core/rules/index.js';
import { Num, SCOPE_WORDS, Words } from './bits';

export function StateEditor({ def, ruleset, onChange }: { def: StateDef; ruleset: Ruleset; onChange: (def: StateDef) => void }) {
  const update = (patch: Partial<StateDef>) => onChange({ ...def, ...patch });
  const others = def.npcLabels !== undefined;
  const forPeople = def.scope === 'char' || def.scope === 'npc';
  const owner = def.approach?.owner ?? '';

  const band = (index: number, patch: Partial<StateDef['bands'][number]>) => update({ bands: def.bands.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)) });
  const addBand = () => {
    const last = def.bands.at(-1);
    update({
      bands: [...def.bands, { at: last ? last.at + 1 : def.min, label: '' }],
      ...(others ? { npcLabels: [...def.npcLabels!, ''] } : {}),
      // The first band turns the state into one the narrator can read.
      ...(def.bands.length === 0 && def.display === 'value' ? { display: 'band' as const } : {}),
    });
  };
  const removeBand = (index: number) => {
    const bands = def.bands.filter((_, at) => at !== index);
    update({
      bands,
      ...(others ? { npcLabels: def.npcLabels!.filter((_, at) => at !== index) } : {}),
      restBand: Math.max(0, Math.min(bands.length - 1, def.restBand > index ? def.restBand - 1 : def.restBand)),
      terminals: def.terminals.filter((terminal) => terminal.at !== 'band' || (terminal.band ?? 0) < bands.length),
    });
  };
  const terminal = (index: number, patch: Partial<StateDef['terminals'][number]>) => update({ terminals: def.terminals.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)) });

  return (
    <div className="state-editor">
      <div className="row">
        <label className="field grow"><span>Name</span><Words label="Name" value={def.name} max={120} onChange={(name) => update({ name })} /></label>
        <label className="field grow">
          <span>Who holds it</span>
          <select value={def.scope} onChange={(event) => update({ scope: event.target.value as StateDef['scope'] })}>
            {STATE_SCOPES.map((scope) => <option key={scope} value={scope}>{SCOPE_WORDS[scope]}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label className="field"><span>Lowest</span><Num label="Lowest" value={def.min} onChange={(min) => update({ min })} /></label>
        <label className="field"><span>Highest</span><Num label="Highest" value={def.max} onChange={(max) => update({ max })} /></label>
        <label className="field"><span>Starts at</span><Num label="Starts at" value={def.start} onChange={(start) => update({ start })} /></label>
        <label className="field grow">
          <span>On the play screen</span>
          <select value={def.display} onChange={(event) => update({ display: event.target.value as StateDef['display'] })}>
            <option value="value">Its number</option>
            <option value="band">Its words</option>
            <option value="hidden">Nothing: it is hidden</option>
          </select>
        </label>
      </div>

      <h4 className="sub">The words it writes</h4>
      <p className="hint">Each band starts at a value and gives the sentence its ending: &ldquo;is bruised&rdquo;, &ldquo;is hurt, and it slows you&rdquo;. The narrator reads the band&rsquo;s words, never the number, and only while the state is off its resting band. With no bands it never reaches the narrator at all.</p>
      {def.bands.map((entry, index) => (
        <div key={index} className="band-row">
          <label className="field"><span>From</span><Num label={`Band ${index + 1} starts at`} value={entry.at} onChange={(at) => band(index, { at })} /></label>
          <label className="field grow"><span>{others ? 'Words for the player' : 'Words'}</span><Words label={`Band ${index + 1} words`} value={entry.label} max={200} allowEmpty onChange={(label) => band(index, { label })} /></label>
          {others && (
            <label className="field grow"><span>Words for anyone else</span><Words label={`Band ${index + 1} words for anyone else`} value={def.npcLabels![index] ?? ''} max={200} allowEmpty onChange={(label) => update({ npcLabels: def.npcLabels!.map((existing, at) => (at === index ? label : existing)) })} /></label>
          )}
          <label className="rest"><input type="radio" name={`rest-${def.id}`} checked={def.restBand === index} onChange={() => update({ restBand: index })} />Rests here</label>
          <button type="button" className="icon-btn" aria-label={`Remove band ${index + 1}`} onClick={() => removeBand(index)}>×</button>
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={addBand}>Add a band</button>
        {def.bands.length > 0 && (
          <label className="check"><input type="checkbox" checked={def.bandBasis === 'share'} onChange={(event) => update({ bandBasis: event.target.checked ? 'share' : 'value' })} />&ldquo;From&rdquo; is a percentage of the way up, so one set of words fits anyone&rsquo;s most</label>
        )}
        {def.bands.length > 0 && forPeople && (
          <label className="check"><input type="checkbox" checked={others} onChange={(event) => update({ npcLabels: event.target.checked ? def.bands.map((entry) => entry.label) : undefined })} />Other people get their own words</label>
        )}
      </div>
      {def.bands.length > 0 && (
        <label className="field">
          <span>The sentence it is put in</span>
          <Words label="The sentence it is put in" value={def.line ?? ''} max={400} allowEmpty placeholder={DEFAULT_STATE_LINE} onChange={(line) => update({ line: line.trim() ? line : undefined })} />
          <span className="hint">|name| or |nameMid| is who holds it, |bandLabel| the band&rsquo;s words. Empty uses {DEFAULT_STATE_LINE}</span>
        </label>
      )}

      <h4 className="sub">What moves it</h4>
      <div className="row">
        <label className="field grow">
          <span>The approach that owns it</span>
          <select value={owner} onChange={(event) => update({ approach: event.target.value ? { owner: event.target.value, secondary: (def.approach?.secondary ?? []).filter((id) => id !== event.target.value) } : undefined })}>
            <option value="">None: no check moves it</option>
            {ruleset.approaches.map((approach) => <option key={approach.id} value={approach.id}>{approach.name}</option>)}
          </select>
        </label>
        {def.approach && (
          <label className="field grow"><span>What acting on it is, in a few words</span><Words label="What acting on it is" value={def.verb ?? ''} max={80} allowEmpty placeholder="Hurt or overpower" onChange={(verb) => update({ verb: verb.trim() ? verb : undefined })} /></label>
        )}
      </div>
      {def.approach && (
        <>
          <fieldset className="goods">
            <legend className="rule-label">Approaches that can also move it, off their home ground<small>They roll with a setback die and pay the owner&rsquo;s costs.</small></legend>
            <div className="checks">
              {ruleset.approaches.filter((approach) => approach.id !== owner).map((approach) => (
                <label key={approach.id}>
                  <input type="checkbox" checked={def.approach!.secondary.includes(approach.id)} onChange={(event) => update({ approach: { owner, secondary: event.target.checked ? [...def.approach!.secondary, approach.id] : def.approach!.secondary.filter((id) => id !== approach.id) } })} />
                  {approach.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="row">
            <label className="check"><input type="checkbox" checked={def.grows} onChange={(event) => update({ grows: event.target.checked })} />A check builds it up instead of wearing it down</label>
            <label className="field grow">
              <span>Built up, it helps a later check by another approach</span>
              <select value={def.aids ?? ''} onChange={(event) => update({ aids: (event.target.value || undefined) as StateDef['aids'] })}>
                <option value="">It doesn&rsquo;t</option>
                <option value="easier">Each point makes it a step easier</option>
                <option value="boost">Each point adds a boost die</option>
              </select>
            </label>
          </div>
        </>
      )}

      <h4 className="sub">Where it ends</h4>
      <p className="hint">An ending fires when the state arrives there, and the narrator is told what it means.</p>
      {def.terminals.map((entry, index) => (
        <div key={index} className="band-row">
          <label className="field">
            <span>At</span>
            <select value={entry.at === 'band' ? `band:${entry.band ?? 0}` : entry.at} onChange={(event) => { const [at, bandIndex] = event.target.value.split(':'); terminal(index, at === 'band' ? { at: 'band', band: Number(bandIndex) } : { at: at as 'min' | 'max', band: undefined }); }}>
              <option value="min">Its lowest</option>
              <option value="max">Its highest</option>
              {def.bands.map((bandEntry, at) => <option key={at} value={`band:${at}`}>Band {at + 1}{bandEntry.label ? `: ${bandEntry.label.slice(0, 24)}` : ''}</option>)}
            </select>
          </label>
          <label className="field grow"><span>What it means for them</span><Words label={`Ending ${index + 1}, for them`} value={entry.note} max={2000} onChange={(note) => terminal(index, { note })} /></label>
          <label className="field grow"><span>For the player, if different</span><Words label={`Ending ${index + 1}, for the player`} value={entry.playerNote ?? ''} max={2000} allowEmpty onChange={(playerNote) => terminal(index, { playerNote: playerNote.trim() ? playerNote : undefined })} /></label>
          <button type="button" className="icon-btn" aria-label={`Remove ending ${index + 1}`} onClick={() => update({ terminals: def.terminals.filter((_, at) => at !== index) })}>×</button>
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => update({ terminals: [...def.terminals, { at: 'min', note: 'They take no further part in this scene.' }] })}>Add an ending</button>
        <label className="field grow">
          <span>Runs out by itself</span>
          <select value={def.countdown ?? ''} onChange={(event) => update({ countdown: (event.target.value || undefined) as StateDef['countdown'] })}>
            <option value="">No</option>
            <option value="day">Falls by one each midnight</option>
            <option value="hour">Falls by one each hour</option>
          </select>
        </label>
        <label className="field grow"><span>Shown under</span><Words label="Shown under" value={def.category ?? ''} max={80} allowEmpty placeholder="Condition, Trade…" onChange={(category) => update({ category: category.trim() ? category : undefined })} /></label>
      </div>
    </div>
  );
}
