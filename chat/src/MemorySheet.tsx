// Memory, from the prompt bar: the brain button. Four things can be kept from a chat, and this
// asks which. A journal entry is yours to write: a fact the character keeps about you, sent with
// every reply. The other three the character writes, from the chat so far: a diary entry, how a
// moment felt, or what they mean to do next. Each shows what it will send before it is sent.
// Opened from a message, the same four read the chat as it stood at that message.
import { useState } from 'react';
import { SIDE_NAMES, addPlan, remember, type Built, type Chat, type SideKind } from '../../core/chat/index.js';
import { newId } from '../../kit/src/util';
import { CloseIcon } from './icons';
import type { SideApi } from './Panels';

type Choice = 'journal' | SideKind;
const KEPT_IN: Record<SideKind, string> = { diary: 'the diary', process: 'feelings', plan: 'plans' };

export function MemorySheet({ chat, onChange, charName, userName, model, side, at, onClose, onAll }: {
  chat: Chat;
  onChange: (chat: Chat) => void;
  charName: string;
  userName: string;
  model: string;
  side: SideApi;
  // Opened from a message: its place in the chat and its whole text.
  at?: { upTo: number; text: string } | null;
  onClose: () => void;
  // Everything the character keeps, under the hood.
  onAll: () => void;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [fact, setFact] = useState(at?.text ?? '');
  const [ready, setReady] = useState<{ kind: SideKind; built: Built; maxTokens: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [kept, setKept] = useState<{ where: string; name: string; content: string } | null>(null);

  const pick = async (next: Choice) => {
    setChoice(next); setNote(''); setKept(null); setReady(null); setText('');
    if (next === 'journal') return;
    const result = await side.preview(next, at?.upTo);
    if (typeof result === 'string') { setNote(result); return; }
    setReady(result);
  };
  const write = async () => {
    if (!ready) return;
    setBusy(true); setText('');
    const result = await side.write(ready, setText);
    setBusy(false);
    if (typeof result === 'string') { setNote(result); return; }
    const now = Date.now();
    if (ready.kind === 'plan') onChange(addPlan(chat, { id: newId(), name: result.name, content: result.content }, now));
    else onChange({ ...chat, [ready.kind]: [...chat[ready.kind], { id: newId(), ...result, at: now }], updatedAt: now });
    setKept({ where: KEPT_IN[ready.kind], name: result.name, content: result.content });
    setReady(null); setText(''); setChoice(null);
  };
  const keepFact = () => {
    if (!fact.trim()) return;
    onChange(remember(chat, fact, newId(), Date.now()));
    setKept({ where: 'the journal', name: '', content: fact.replace(/\s+/g, ' ').trim().slice(0, 2000) });
    setFact(''); setChoice(null);
  };

  const options: { id: Choice; name: string; says: string }[] = [
    { id: 'journal', name: 'A journal entry', says: `You write it: something ${charName} knows about ${userName}. It goes with every reply.` },
    { id: 'diary', name: SIDE_NAMES.diary.button, says: `${charName} writes a diary entry about the chat${at ? ' up to this message' : ' so far'}. It comes back when one of its keys is said.` },
    { id: 'process', name: SIDE_NAMES.process.button, says: `${charName} writes how one moment felt. Recalled by key, like the diary.` },
    { id: 'plan', name: SIDE_NAMES.plan.button, says: `${charName} decides what to do over the next few replies, and acts on it.` },
  ];

  return (
    <div className="sheet memory-sheet" role="dialog" aria-label="Memory">
      <button type="button" className="icon-btn plain close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
      <h2>Memory</h2>
      <p className="hint">{at ? `What ${charName} keeps from the chat as it stood at this message.` : `What ${charName} keeps from this chat.`} Nothing is sent until you say so.</p>

      {kept && (
        <section className="card" aria-label="Kept" role="status">
          <p><b>Kept in {kept.where}.</b>{kept.name ? ` ${kept.name}` : ''}</p>
          <p className="part">{kept.content}</p>
          <button type="button" className="link" onClick={onAll}>Open {charName}&rsquo;s memory to change it</button>
        </section>
      )}
      {note && <p className="status bad" role="status">{note}</p>}

      <div className="doors-list" role="group" aria-label="What to keep">
        {options.map((option) => (
          <button key={option.id} type="button" className="door-row" aria-pressed={choice === option.id} disabled={busy} onClick={() => void pick(option.id)}>
            <b>{option.name}</b>
            <span>{option.says}</span>
          </button>
        ))}
      </div>

      {choice === 'journal' && (
        <section className="card" aria-label="A journal entry">
          <label className="field">
            <span>The entry, said plainly, as {charName} would know it</span>
            <textarea className="input" rows={at ? 6 : 3} maxLength={2000} value={fact} placeholder={`${userName} takes their tea without sugar.`} onChange={(event) => setFact(event.target.value)} autoFocus />
          </label>
          {at && <p className="hint">This is the whole message. Cut it down to the fact worth keeping: it is sent with every reply from now on.</p>}
          <div className="row">
            <button type="button" className="btn primary" disabled={!fact.trim()} onClick={keepFact}>Keep it</button>
            <button type="button" className="btn quiet" onClick={() => setChoice(null)}>Cancel</button>
          </div>
        </section>
      )}

      {ready && (
        <section className="card ask" aria-label={`${SIDE_NAMES[ready.kind].button}: what it will send`}>
          <p><b>{SIDE_NAMES[ready.kind].button}.</b> {charName} writes {SIDE_NAMES[ready.kind].what}. This sends about {ready.built.tokens.toLocaleString()} tokens to {model} and allows up to {ready.maxTokens} back.</p>
          <details>
            <summary>What gets sent</summary>
            {ready.built.messages.map((message, index) => (
              <section key={index} className="block" aria-label={`${message.role} message ${index + 1}`}>
                <div className="block-head"><span>{message.role}</span><span className="hint">{index + 1} of {ready.built.messages.length}</span></div>
                <pre className="raw">{message.content}</pre>
              </section>
            ))}
          </details>
          {text && <pre className="raw">{text}</pre>}
          <div className="row">
            <button type="button" className="btn primary" disabled={busy} onClick={() => void write()}>{busy ? 'Writing…' : 'Write it'}</button>
            <button type="button" className="btn quiet" disabled={busy} onClick={() => { setReady(null); setText(''); setChoice(null); }}>Cancel</button>
          </div>
        </section>
      )}

      <button type="button" className="link" onClick={onAll}>Everything {charName} keeps: journal, diary, feelings, plans</button>
    </div>
  );
}
