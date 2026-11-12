import { useEffect, useMemo, useState } from 'react';
import { type RecordKind, type World } from '../../core/records/index.js';
import { contextWithRules, ruledText, type RuledAnswer } from '../../core/rules/index.js';
import { RecordMulti } from './RecordPick';

const WHY: Record<string, string> = { always: 'Always', here: 'Here', named: 'Named', when: 'When', line: 'Line' };
const HERE_KINDS = new Set<RecordKind>(['character', 'place', 'item', 'persona', 'scenario']);

// The moment being looked at: who and where, what was just said, and what holds. It is kept by
// the world's page, so leaving In context now for a record and coming back finds it as it was.
export interface Moment {
  present: string[];
  recentText: string;
  conditionIds: string[];
  answer: RuledAnswer;
  // The row that leads here says this much: "356 tokens · Morwen here".
  says: string;
  setHere: (ids: string[]) => void;
  setRecentText: (text: string) => void;
  setConditionIds: (ids: string[]) => void;
}

export function useMoment(world: World, focusId: string | null): Moment {
  const [hereIds, setHere] = useState<string[]>([]);
  const [recentText, setRecentText] = useState('');
  const [conditionIds, setConditionIds] = useState<string[]>([]);

  // Whatever you open is put in the scene, so its Here sections show straight away.
  useEffect(() => {
    const focus = world.records.find((record) => record.id === focusId);
    if (focus && HERE_KINDS.has(focus.kind)) setHere((ids) => (ids.includes(focus.id) ? ids : [...ids, focus.id]));
  }, [focusId]);

  const present = hereIds.filter((id) => world.records.some((record) => record.id === id));
  const answer = useMemo(() => contextWithRules(world, { hereIds: present, recentText, conditionIds }), [world, present.join('|'), recentText, conditionIds]);
  const names = present.map((id) => world.records.find((record) => record.id === id)?.name ?? '');
  const who = names.length === 0 ? 'nobody in the scene' : names.length <= 2 ? `${names.join(' and ')} here` : `${names[0]} and ${names.length - 1} more here`;
  return { present, recentText, conditionIds, answer, says: `About ${answer.tokens.toLocaleString()} tokens · ${who}.`, setHere, setRecentText, setConditionIds };
}

// What this world would send the model right now, worked out from each part's reach.
export function ContextPanel({ world, moment }: { world: World; moment: Moment }) {
  const [copied, setCopied] = useState(false);
  const { answer, present, recentText, conditionIds } = moment;
  const candidates = world.records.filter((record) => HERE_KINDS.has(record.kind));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ruledText(answer));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="context" aria-label="In context now">
      <h2>In context now</h2>
      <p className="hint">Set up a moment and see exactly what this world would send the model. A state shows as its sentence, and only while it is off its resting one.</p>

      <fieldset className="card" style={{ margin: 0 }}>
        <legend className="sub">Here in the scene</legend>
        {candidates.length === 0 ? <p className="empty">Add a place or a character first.</p>
          : <RecordMulti world={world} label="Here in the scene" kinds={[...HERE_KINDS]} values={present} empty="Nobody and nowhere yet." onChange={moment.setHere} />}
      </fieldset>

      <label className="field">
        <span>What was just said</span>
        <textarea rows={3} value={recentText} placeholder="Type the player's words or the last few lines. Names and keys in it bring Named parts in." onChange={(event) => moment.setRecentText(event.target.value)} />
      </label>

      {world.conditions.length > 0 && (
        <fieldset className="card" style={{ margin: 0 }}>
          <legend className="sub">Holding right now</legend>
          <div className="checks">
            {world.conditions.map((condition) => (
              <label key={condition.id}>
                <input type="checkbox" checked={conditionIds.includes(condition.id)} onChange={(event) => moment.setConditionIds(event.target.checked ? [...conditionIds, condition.id] : conditionIds.filter((id) => id !== condition.id))} />
                {condition.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="meter">About {answer.tokens.toLocaleString()} tokens</p>
        <button type="button" className="btn small quiet" onClick={() => void copy()} disabled={!answer.blocks.length}>{copied ? 'Copied' : 'Copy as text'}</button>
      </div>

      {answer.blocks.length === 0 && <p className="empty">Nothing yet. Write some sections, or put someone in the scene.</p>}
      {answer.blocks.map((block) => (
        <section key={block.recordId ?? 'world'} className="block" aria-label={block.name}>
          <div className="block-head">
            <span>{block.name}</span>
            <span className={`chip ${block.why}`}>{WHY[block.why]}</span>
          </div>
          {block.parts.map((part, index) => (
            <p key={index} className={`part${part.reach === 'state' ? ' from-rules' : ''}`}>{part.reach === 'state' ? <b>{part.title}, from the rules</b> : part.reach !== 'line' && <b>{part.title}</b>}{part.text}</p>
          ))}
        </section>
      ))}
    </aside>
  );
}
