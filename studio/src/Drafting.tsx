// Drafts on a record's page (docs/bids/worldbuilding/decision.md, phase W1): the Draft button on
// a field, the drafts waiting under it with Keep, Again and Drop, Undo after a Keep, name ideas,
// and What this sends.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Message } from '../../core/narration/formats.js';
import type { StoryRecord, World } from '../../core/records/index.js';
import { useAuthor } from './author/context';
import { buildFieldWrite, buildNames, type PartTally } from './author/prompts';
import { flagsIn, type NameIdea } from './author/reading';
import { runNames } from './author/run';
import { currentText, targetKey, withText, type Target } from './author/shapes';
import type { Draft } from './author/store';
import { MOST_DRAFTS, type DraftsApi } from './author/useDrafts';

// What a Keep replaced, per field, for as long as the Studio stays open. Undo shows while the
// field still holds what was kept.
const KEPT = new Map<string, { before: string; after: string }>();
const keptKey = (world: World, record: StoryRecord, target: Target) => `${world.id}/${record.id}/${targetKey(target)}`;

// The Draft button, its cost, and what went wrong last time.
export function DraftButton({ world, record, target, api, label }: { world: World; record: StoryRecord; target: Target; api: DraftsApi; label: string }) {
  const author = useAuthor();
  if (!author) return null;
  const key = targetKey(target);
  const running = api.running.get(key);
  const error = api.errors.get(key);
  const waiting = api.drafts.filter((draft) => targetKey(draft.target) === key && draft.state !== 'needs').length;
  if (!author.connection.connected) {
    return (
      <p className="draft-bar hint">
        <button type="button" className="btn small quiet" onClick={author.openSettings}>Draft</button> Connect a model in Settings to draft {label}.
      </p>
    );
  }
  const built = running ? null : buildFieldWrite({ world, record, target, window: author.window, prefill: author.prefill });
  const full = waiting >= MOST_DRAFTS;
  return (
    <div className="draft-bar">
      {running
        ? <button type="button" className="btn small" onClick={running.stop}>Stop</button>
        : <button type="button" className="btn small quiet" disabled={full || (built !== null && !built.ok)} aria-label={`Draft ${label}`} onClick={() => void api.write(target)}>{waiting ? 'Draft again' : 'Draft'}</button>}
      <span className="hint">
        {running ? `Writing ${label}…`
          : full ? `${MOST_DRAFTS} drafts wait below. Drop one to ask again.`
            : built?.ok ? `About ${built.built.tokens.toLocaleString()} tokens · 1 call, 2 if the first is sent back`
              : built ? built.reason : ''}
      </span>
      {running?.text && <p className="draft-stream" aria-live="polite">{running.text}</p>}
      {error && <p className="status bad" role="status">{error}</p>}
    </div>
  );
}

// The drafts waiting under one field, and Undo after a Keep.
export function DraftsFor({ world, record, target, api, onChange, label }: { world: World; record: StoryRecord; target: Target; api: DraftsApi; onChange: (record: StoryRecord) => void; label: string }) {
  const key = targetKey(target);
  const mine = api.drafts.filter((draft) => targetKey(draft.target) === key);
  const now = currentText(record, target) ?? '';
  const kept = KEPT.get(keptKey(world, record, target));
  const undo = kept && kept.after === now ? kept : null;
  const keep = (draft: Draft) => {
    KEPT.set(keptKey(world, record, target), { before: now, after: draft.text });
    onChange(withText(record, target, draft.text));
    api.drop(draft);
  };
  return (
    <>
      {undo && (
        <p className="draft-undo hint">
          Kept a draft. <button type="button" className="btn small quiet" onClick={() => { KEPT.delete(keptKey(world, record, target)); onChange(withText(record, target, undo.before)); }}>Undo</button>
        </p>
      )}
      {mine.map((draft) => (draft.state === 'needs'
        ? <NeedsCard key={draft.id} draft={draft} label={label} onAnswer={(answer) => { api.drop(draft); void api.write(target, { settled: [`${draft.question} ${answer}`] }); }} onDrop={() => api.drop(draft)} />
        : <DraftCard key={draft.id} draft={draft} now={now} label={label} onEdit={(text) => api.edit(draft, text)} onKeep={() => keep(draft)} onDrop={() => api.drop(draft)} />))}
    </>
  );
}

function DraftCard({ draft, now, label, onEdit, onKeep, onDrop }: { draft: Draft; now: string; label: string; onEdit: (text: string) => void; onKeep: () => void; onDrop: () => void }) {
  const [comparing, setComparing] = useState(false);
  // The box grows to its text, so a draft is read whole without scrolling inside it.
  const box = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const area = box.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight + 2}px`;
  }, [draft.text]);
  const changed = draft.base !== now;
  const flags = [...new Set(flagsIn(draft.text).map((flag) => flag.word))];
  const unfinished = draft.state === 'unfinished';
  return (
    <section className="draft-card" aria-label={`Draft for ${label}`}>
      <div className="row between">
        <b>Draft</b>
        <span className="hint">{draft.calls === 2 ? 'Sent back once' : '1 call'} · {draft.model}</span>
      </div>
      {unfinished && <p className="status bad">Unfinished: {draft.fault} Edit it to keep it.</p>}
      <label className="sr" htmlFor={`draft-${draft.id}`}>Draft for {label}</label>
      <textarea ref={box} id={`draft-${draft.id}`} value={draft.text} rows={3} onChange={(event) => onEdit(event.target.value)} />
      {flags.length > 0 && <p className="hint">A second look: {flags.map((word) => <mark key={word} className="flag">{word}</mark>)}</p>}
      {comparing ? (
        <div className="draft-compare">
          <p className="hint">{label} changed after this draft was made. As it is now:</p>
          <p className="draft-now">{now || 'Empty.'}</p>
          <div className="row">
            <button type="button" className="btn small primary" onClick={onKeep}>Keep the draft anyway</button>
            <button type="button" className="btn small quiet" onClick={() => setComparing(false)}>Leave it as it is</button>
          </div>
        </div>
      ) : (
        <div className="row">
          <button type="button" className="btn small primary" disabled={unfinished || !draft.text.trim()} onClick={() => (changed ? setComparing(true) : onKeep())}>Keep</button>
          <button type="button" className="btn small quiet" onClick={onDrop}>Drop</button>
        </div>
      )}
      <Sent parts={draft.parts} messages={draft.sent} tokens={draft.tokens} />
    </section>
  );
}

function NeedsCard({ draft, label, onAnswer, onDrop }: { draft: Draft; label: string; onAnswer: (answer: string) => void; onDrop: () => void }) {
  const [answer, setAnswer] = useState('');
  return (
    <section className="draft-card needs" aria-label={`A question about ${label}`}>
      <p><b>Before writing {label}:</b> {draft.question}</p>
      <label className="field">
        <span>Your answer</span>
        <input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && answer.trim()) onAnswer(answer.trim()); }} />
      </label>
      <div className="row">
        <button type="button" className="btn small primary" disabled={!answer.trim()} onClick={() => onAnswer(answer.trim())}>Draft with this</button>
        <button type="button" className="btn small quiet" onClick={onDrop}>Drop</button>
      </div>
      <Sent parts={draft.parts} messages={draft.sent} tokens={draft.tokens} />
    </section>
  );
}

// What a call sent: each part with its tokens and what was left out, then the messages.
export function Sent({ parts, messages, tokens }: { parts: PartTally[]; messages: Message[]; tokens: number }) {
  return (
    <details className="sent">
      <summary>What this sent · about {tokens.toLocaleString()} tokens</summary>
      <ul className="sent-parts">
        {parts.map((part) => (
          <li key={part.label} className={part.left ? 'left' : undefined}>
            {part.label} · {part.left ? 'left out to fit' : `${part.tokens.toLocaleString()} tokens`}{part.note ? ` · ${part.note}` : ''}
          </li>
        ))}
      </ul>
      {messages.map((message, index) => (
        <section key={index} className="block">
          <div className="block-head"><span>{message.role === 'system' ? 'The job' : message.role === 'user' ? 'Sent' : 'Its first answer'}</span></div>
          <pre className="raw">{message.content}</pre>
        </section>
      ))}
    </details>
  );
}

// Six names for a new record, offered first. Names already in the world are shown as taken.
export function NameIdeas({ world, record, onPick }: { world: World; record: StoryRecord; onPick: (name: string) => void }) {
  const author = useAuthor();
  const [ideas, setIdeas] = useState<NameIdea[] | null>(null);
  const [busy, setBusy] = useState<AbortController | null>(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ parts: PartTally[]; messages: Message[]; tokens: number } | null>(null);
  if (!author?.connection.connected) return null;
  const ask = async () => {
    const built = buildNames({ world, record, window: author.window });
    if (!built.ok) { setError(built.reason); return; }
    const controller = new AbortController();
    setBusy(controller);
    setError('');
    try {
      const outcome = await runNames(built.built, world, record, author.generate, controller.signal);
      setIdeas(outcome.ideas);
      setSent({ parts: built.built.parts, messages: outcome.sent, tokens: built.built.tokens });
      if (!outcome.ideas.length) setError('No names came back that could be read. Ask again, or type one.');
    } catch (failure) {
      setError((failure as Error).name === 'AbortError' ? 'Stopped.' : (failure as Error).message);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="name-ideas">
      <div className="row">
        {busy
          ? <button type="button" className="btn small" onClick={() => busy.abort()}>Stop</button>
          : <button type="button" className="btn small quiet" onClick={() => void ask()}>{ideas ? 'More name ideas' : 'Name ideas'}</button>}
        {busy && <span className="hint">Thinking of names…</span>}
      </div>
      {ideas && ideas.length > 0 && (
        <div className="row chips" role="group" aria-label="Name ideas">
          {ideas.map((idea) => (idea.taken
            ? <span key={idea.name} className="chip line taken" title="Already used in this world">{idea.name} · taken</span>
            : <button key={idea.name} type="button" className="btn small quiet" onClick={() => onPick(idea.name)}>{idea.name}</button>))}
        </div>
      )}
      {error && <p className="status bad" role="status">{error}</p>}
      {sent && <Sent {...sent} />}
    </div>
  );
}

export function draftWaiting(api: DraftsApi | null, target: Target): boolean {
  if (!api) return false;
  const key = targetKey(target);
  return api.drafts.some((draft) => targetKey(draft.target) === key);
}
