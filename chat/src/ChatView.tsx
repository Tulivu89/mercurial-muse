// One chat: the transcript in bubbles, the composer, and the panels that show what the model was
// sent. Mobile first: one column, the composer at the thumb.
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import {
  PROFILE_NAMES, RESPONSE_LENGTHS, STYLES, STYLE_HINTS, STYLE_NAMES, XIALONG, addAlternative, addReply, addUserMessage, buildRequest, deleteMessage, editMessage,
  editableText, exportChat, lastEmotion, lorePool, messageText, pickedAlt, profileFor, readReply, remember, replacePicked, responseLengthName, sceneFor,
  setJournalEntry, stepAlternative, type Built, type Chat, type ChatMessage, type ReplyPart,
} from '../../core/chat/index.js';
import { KIND_NAMES, RELATIONSHIPS, type World } from '../../core/records/index.js';
import { canPrefill, generate, requestFor, type Connection, type GenerateOptions, type NarrationError } from '../../kit/src/connection';
import { clock, downloadJson, fileSafe, newId } from '../../kit/src/util';
import { Portrait } from './Portrait';
import { RichText } from './RichText';
import { contextTokensFor, type Settings } from './settings';
import type { PortraitSet, Sent } from './store';

type Kind = 'reply' | 'regenerate' | 'continue';
type Panel = 'sent' | 'context' | 'journal' | 'details';
interface Busy { kind: Kind; messageId: string | null; text: string; lead: string }

const WHY: Record<string, string> = { always: 'Always', here: 'Here', named: 'Named', when: 'When', line: 'Line' };
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export interface ChatViewProps {
  chat: Chat;
  world: World | null;
  connection: Connection;
  settings: Settings;
  portraits?: PortraitSet;
  sent?: Sent | null;
  onChange: (chat: Chat) => void;
  onSent?: (sent: Sent) => void;
  onBack: () => void;
  onDelete: () => void;
  onSettings: () => void;
  // Swapped out in tests so nothing leaves the machine.
  generateImpl?: typeof generate;
}

export function ChatView({ chat, world, connection, settings, portraits, sent = null, onChange, onSent, onBack, onDelete, onSettings, generateImpl = generate }: ChatViewProps) {
  const scene = useMemo(() => (world ? sceneFor(world, chat) : null), [world, chat]);
  const charName = scene?.charName ?? (chat.characterName || 'Character');
  const userName = scene?.userName ?? chat.userName;
  const profile = profileFor(connection.model);

  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [remembering, setRemembering] = useState<string | null>(null);
  const [asAction, setAsAction] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<Sent | null>(sent);
  const [preview, setPreview] = useState<Built | null>(null);
  const abort = useRef<AbortController | null>(null);
  const firstBuild = useRef(true);
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const end = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setLastSent(sent), [sent]);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }); }, [chat.messages.length, busy?.text]);
  useEffect(() => () => abort.current?.abort(), []);

  const buildOptions = (upTo: number, continuing: boolean, draft?: string) => ({
    model: connection.model,
    canPrefill: profile === 'general' && canPrefill(connection),
    contextTokens: contextTokensFor(settings, connection),
    replyTokens: settings.replyTokens,
    nowMs: Date.now(),
    upTo, continuing, draft,
    firstBuild: firstBuild.current,
    rngInt: (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1)),
  });

  // What the next reply would be sent, for the In context now panel.
  useEffect(() => {
    if (panel !== 'context' || !world) { setPreview(null); return; }
    let live = true;
    void buildRequest(chat, world, { ...buildOptions(chat.messages.length, false, chat.draft), firstBuild: false }).then((built) => { if (live) setPreview(built); });
    return () => { live = false; };
  }, [panel, chat, world, connection.model, settings]);

  async function run(kind: Kind, targetId?: string, base: Chat = chatRef.current) {
    if (busy) return;
    if (!world || !scene) { setError(`${charName} is no longer in your worlds, so this chat can be read but not continued.`); return; }
    if (!connection.connected || !connection.model) { setError('Connect a model first, under Settings.'); return; }
    const index = targetId ? base.messages.findIndex((message) => message.id === targetId) : -1;
    if (kind !== 'reply' && index < 0) return;
    const upTo = kind === 'reply' ? base.messages.length : kind === 'regenerate' ? index : index + 1;
    const built = await buildRequest(base, world, buildOptions(upTo, kind === 'continue'));
    if (!built) return;

    const target = built.profile === 'aetherroom' ? { ...connection, mode: 'chat' as const } : connection;
    const options: GenerateOptions = built.profile === 'aetherroom'
      ? { maxTokens: settings.replyTokens, temperature: XIALONG.temperature, top_p: XIALONG.top_p, top_k: XIALONG.top_k, min_p: XIALONG.min_p }
      : { maxTokens: settings.replyTokens, temperature: settings.temperature, stop: [`\n${userName}:`], ...(built.prefill ? { prefill: built.prefill } : {}) };
    const controller = new AbortController();
    abort.current = controller;
    setError('');
    setOpenId(null);
    setBusy({ kind, messageId: targetId ?? null, text: '', lead: built.lead });

    let text = '';
    let diagnostics: unknown = null;
    let failure = '';
    try {
      const result = await generateImpl(built.messages, target, {
        ...options,
        signal: controller.signal,
        onDelta: (piece) => { text += piece; setBusy((now) => (now ? { ...now, text } : now)); },
      });
      text = result.text;
      diagnostics = result.diagnostics ?? null;
    } catch (caught) {
      // Stopping keeps what had arrived; anything else is a failure to show.
      if (!controller.signal.aborted) {
        failure = caught instanceof Error ? caught.message : 'The reply failed.';
        diagnostics = (caught as NarrationError).diagnostics ?? null;
      }
    }
    firstBuild.current = false;

    const parts = text.trim() ? readReply(text, built.lead, charName, userName) : [];
    if (parts.length && !failure) {
      const now = Date.now();
      const next = kind === 'reply' ? addReply(base, parts, newId(), now, connection.model)
        : kind === 'regenerate' ? addAlternative(base, targetId!, parts, now, connection.model)
          : replacePicked(base, targetId!, parts, now);
      onChange({ ...next, roll: built.roll, windowStart: built.windowStart });
    } else if (!failure && !controller.signal.aborted) {
      failure = 'The model wrote nothing that reads as a reply. What was sent shows what came back.';
    }
    const record: Sent = {
      chatId: base.id, at: Date.now(), profile: built.profile, request: requestFor(built.messages, target, options),
      parts: built.parts, tokens: built.tokens, notes: built.notes, reply: text, diagnostics, ...(failure ? { error: failure } : {}),
    };
    setLastSent(record);
    onSent?.(record);
    setBusy(null);
    setError(failure);
  }

  function send() {
    if (busy) return;
    const text = chat.draft.trim();
    let base: Chat = { ...chatRef.current, draft: '' };
    if (text) base = { ...addUserMessage(base, asAction && !/^\*.*\*$/s.test(text) ? `*${text}*` : text, newId(), Date.now()), draft: '' };
    onChange(base);
    void run('reply', undefined, base);
  }

  const lastId = chat.messages.at(-1)?.id;
  const step = (message: ChatMessage, by: number) => {
    if (busy) return;
    // Past the newest reply on the last turn, stepping forward asks for another.
    if (by > 0 && message.pick >= message.alts.length - 1) { if (message.id === lastId && message.from === 'character') void run('regenerate', message.id); return; }
    onChange(stepAlternative(chat, message.id, by, Date.now()));
  };
  const onTouchEnd = (message: ChatMessage) => (event: TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    const to = event.changedTouches[0];
    if (!from || !to || message.id !== lastId || message.from !== 'character') return;
    const dx = to.clientX - from.x;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(to.clientY - from.y) * 2) step(message, dx < 0 ? 1 : -1);
  };

  const copy = async (message: ChatMessage) => {
    try { await navigator.clipboard.writeText(messageText(message)); setCopied(message.id); setTimeout(() => setCopied(null), 1500); } catch { setError('This browser would not copy the text.'); }
  };

  const bubbles = (parts: readonly ReplyPart[], from: 'user' | 'character') => parts.map((part, at) => (
    <div key={at} className={`bubble ${from}`}><RichText text={part.text} /></div>
  ));

  const streaming = busy ? readReply(busy.text, busy.lead, charName, userName) : [];
  const typing = <div className="bubble character typing" aria-label={`${charName} is writing`}><span /><span /><span /></div>;
  const emotion = busy && streaming.length ? streaming.at(-1)!.emotion : lastEmotion(chat);
  const lore = world ? lorePool(world) : [];
  const windowStart = profile === 'aetherroom' ? 0 : chat.windowStart;

  return (
    <div className={`chat${panel ? ' paneled' : ''}`} data-size={settings.textSize}>
      <header className="chat-head">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back to your chats">‹</button>
        <Portrait name={charName} emotion={emotion} set={portraits} size={48} />
        <div className="chat-who">
          <h1>{charName}</h1>
          <p className="hint">{connection.connected ? `${connection.model} · ${PROFILE_NAMES[profile]}` : 'Not connected'}</p>
        </div>
        <button type="button" className="btn small quiet" onClick={() => setPanel(panel ? null : 'sent')} aria-expanded={panel !== null}>Under the hood</button>
      </header>

      <main className="thread" aria-label={`Chat with ${charName}`}>
        {chat.messages.length === 0 && !busy && <p className="hint center">Say something, or press Send with nothing typed and {charName} speaks first.</p>}
        {chat.messages.map((message, index) => {
          const alt = pickedAlt(message);
          const mine = message.from === 'user';
          const replaced = busy?.messageId === message.id;
          const isLast = message.id === lastId;
          const open = openId === message.id || (isLast && !mine);
          if (editing?.id === message.id) {
            return (
              <div key={message.id} className={`turn ${message.from}`}>
                <label className="sr" htmlFor={`edit-${message.id}`}>Edit this message</label>
                <textarea id={`edit-${message.id}`} className="input edit" rows={Math.min(14, editing.text.split('\n').length + 2)} value={editing.text} onChange={(event) => setEditing({ id: message.id, text: event.target.value })} autoFocus />
                {!mine && <p className="hint">The last line is the emotion {charName} shows: one of the 24, or neutral.</p>}
                <div className="row">
                  <button type="button" className="btn small primary" onClick={() => { onChange(editMessage(chat, message.id, editing.text, charName, Date.now())); setEditing(null); }}>Save</button>
                  <button type="button" className="btn small quiet" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            );
          }
          return (
            <div key={message.id} className={`turn ${message.from}${index < windowStart ? ' out' : ''}`} onTouchStart={(event) => { const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY } : null; }} onTouchEnd={onTouchEnd(message)}>
              <div className="bubbles" role="group" aria-label={`${mine ? userName : charName}, ${clock(message.at, Date.now())}`} onClick={() => setOpenId(openId === message.id ? null : message.id)}>
                {replaced && busy.kind === 'regenerate' ? (streaming.length ? bubbles(streaming, 'character') : typing)
                  : replaced ? bubbles(streaming.length ? streaming : alt.parts, 'character')
                    : bubbles(alt.parts, message.from)}
              </div>
              {open && !busy && (
                <div className="actions">
                  {!mine && (message.alts.length > 1 || isLast) && (
                    <span className="swipe">
                      <button type="button" className="icon-btn small" onClick={() => step(message, -1)} disabled={message.pick === 0} aria-label="Earlier reply">‹</button>
                      <span aria-label={`Reply ${message.pick + 1} of ${message.alts.length}`}>{message.pick + 1} / {message.alts.length}</span>
                      <button type="button" className="icon-btn small" onClick={() => step(message, 1)} disabled={message.pick >= message.alts.length - 1 && !isLast} aria-label={message.pick >= message.alts.length - 1 ? 'Another reply' : 'Later reply'}>›</button>
                    </span>
                  )}
                  {!mine && isLast && <button type="button" className="link" onClick={() => void run('regenerate', message.id)}>Regenerate</button>}
                  {!mine && isLast && <button type="button" className="link" onClick={() => void run('continue', message.id)}>Continue</button>}
                  <button type="button" className="link" onClick={() => setEditing({ id: message.id, text: editableText(message, charName) })}>Edit</button>
                  <button type="button" className="link" onClick={() => void copy(message)}>{copied === message.id ? 'Copied' : 'Copy'}</button>
                  <button type="button" className="link" onClick={() => setRemembering(messageText(message).replace(/\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 300))}>Remember this</button>
                  <button type="button" className="link danger" onClick={() => { if (window.confirm('Delete this message? The model stops seeing it too.')) onChange(deleteMessage(chat, message.id, Date.now())); }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
        {busy?.kind === 'reply' && <div className="turn character"><div className="bubbles">{streaming.length ? bubbles(streaming, 'character') : typing}</div></div>}
        {error && <p className="status bad" role="alert">{error} {!connection.connected && <button type="button" className="link" onClick={onSettings}>Open Settings</button>}</p>}
        <div ref={end} />
      </main>

      <form className="composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
        <button type="button" className={`btn small quiet toggle${asAction ? ' on' : ''}`} aria-pressed={asAction} onClick={() => setAsAction(!asAction)} title="Send what you type as an action, wrapped in asterisks">{asAction ? '*Action*' : 'Speech'}</button>
        <label className="sr" htmlFor="draft">Your message</label>
        <textarea
          id="draft" rows={1} value={chat.draft} placeholder={asAction ? 'What you do' : `Message ${charName}`}
          onChange={(event) => onChange({ ...chat, draft: event.target.value })}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }}
        />
        {busy
          ? <button type="button" className="btn primary" onClick={() => abort.current?.abort()}>Stop</button>
          : <button type="submit" className="btn primary">Send</button>}
      </form>

      {remembering !== null && (
        <div className="sheet" role="dialog" aria-label="Remember this">
          <h2>Remember this</h2>
          <p className="hint">A fact for {charName}'s journal about {userName}. It goes with every reply from now on, so say it plainly, as {charName} would know it.</p>
          <label className="sr" htmlFor="fact">The fact</label>
          <textarea id="fact" className="input" rows={3} value={remembering} onChange={(event) => setRemembering(event.target.value)} autoFocus />
          <div className="row">
            <button type="button" className="btn primary" disabled={!remembering.trim()} onClick={() => { onChange(remember(chat, remembering, newId(), Date.now())); setRemembering(null); }}>Keep it</button>
            <button type="button" className="btn quiet" onClick={() => setRemembering(null)}>Cancel</button>
          </div>
        </div>
      )}

      {panel && (
        <aside className="sheet tall" aria-label="Under the hood">
          <div className="row tabs" role="tablist">
            {(['sent', 'context', 'journal', 'details'] as Panel[]).map((name) => (
              <button key={name} type="button" role="tab" aria-selected={panel === name} className={`btn small ${panel === name ? '' : 'quiet'}`} onClick={() => setPanel(name)}>
                {{ sent: 'What was sent', context: 'In context now', journal: 'Journal', details: 'This chat' }[name]}
              </button>
            ))}
            <button type="button" className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setPanel(null)} aria-label="Close">×</button>
          </div>

          {panel === 'sent' && <SentView sent={lastSent} />}

          {panel === 'context' && (
            <>
              <p className="hint">What the next reply would be sent, by reach. Type in the message box and Named parts come in as their keys appear.</p>
              {preview && (
                <>
                  <p className="meter">{PROFILE_NAMES[preview.profile]} · about {preview.tokens.toLocaleString()} of {contextTokensFor(settings, connection).toLocaleString()} tokens · {preview.parts.map((part) => `${part.label} ${part.tokens.toLocaleString()}`).join(' · ')}</p>
                  {preview.notes.map((note) => <p key={note} className="status">{note}</p>)}
                  {preview.answer.blocks.map((block) => (
                    <section key={block.recordId ?? 'world'} className="block" aria-label={block.name}>
                      <div className="block-head"><span>{block.name} <span className="hint">{block.kind === 'world' ? 'world' : KIND_NAMES[block.kind].one.toLowerCase()}</span></span><span className={`chip ${block.why}`}>{WHY[block.why]}</span></div>
                      {block.parts.map((part, at) => <p key={at} className="part">{part.reach !== 'line' && <b>{part.title}</b>}{part.text}</p>)}
                    </section>
                  ))}
                </>
              )}
              {!preview && <p className="empty">{world ? 'Working it out…' : 'This chat\'s world is gone.'}</p>}
            </>
          )}

          {panel === 'journal' && (
            <>
              <p className="hint">What {charName} keeps about {userName}. Active entries go with every reply. Use Remember this on any message to add one.</p>
              {chat.journal.length === 0 && <p className="empty">Nothing kept yet.</p>}
              {chat.journal.map((entry) => (
                <div key={entry.id} className="card">
                  <label className="sr" htmlFor={`fact-${entry.id}`}>Journal entry</label>
                  <textarea id={`fact-${entry.id}`} className="input" rows={2} value={entry.text} onChange={(event) => onChange(setJournalEntry(chat, entry.id, { text: event.target.value }, Date.now()))} />
                  <div className="row">
                    <label className="checks"><input type="checkbox" checked={entry.active} onChange={(event) => onChange(setJournalEntry(chat, entry.id, { active: event.target.checked }, Date.now()))} /> Sent to {charName}</label>
                    <button type="button" className="link danger" style={{ marginLeft: 'auto' }} onClick={() => onChange(setJournalEntry(chat, entry.id, null, Date.now()))}>Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn small quiet" onClick={() => setRemembering('')}>Add an entry</button>
            </>
          )}

          {panel === 'details' && (
            <>
              <div className="row">
                <label className="field grow"><span>Relationship</span>
                  <select value={chat.relationship} onChange={(event) => onChange({ ...chat, relationship: event.target.value as Chat['relationship'] })}>{RELATIONSHIPS.map((value) => <option key={value} value={value}>{capital(value)}</option>)}</select>
                </label>
                <label className="field grow"><span>Style</span>
                  <select value={chat.style} onChange={(event) => onChange({ ...chat, style: event.target.value as Chat['style'] })}>{STYLES.map((value) => <option key={value} value={value}>{STYLE_NAMES[value]}</option>)}</select>
                </label>
                <label className="field grow"><span>Response length</span>
                  <select value={chat.responseLength} onChange={(event) => onChange({ ...chat, responseLength: event.target.value as Chat['responseLength'] })}>{RESPONSE_LENGTHS.map((value) => <option key={value} value={value}>{responseLengthName(value)}</option>)}</select>
                </label>
              </div>
              <p className="hint">{STYLE_HINTS[chat.style]} The relationship decides which of {charName}'s sections behind a bond are in.</p>
              {lore.length > 0 && (
                <fieldset className="card" style={{ margin: 0 }}>
                  <legend className="sub">Lore in this chat</legend>
                  <div className="checks">
                    {lore.map((record) => (
                      <label key={record.id}>
                        <input type="checkbox" checked={!chat.loreOff.includes(record.id)} onChange={(event) => onChange({ ...chat, loreOff: event.target.checked ? chat.loreOff.filter((id) => id !== record.id) : [...chat.loreOff, record.id] })} />
                        {record.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="row">
                <button type="button" className="btn small quiet" onClick={() => downloadJson(`${fileSafe(charName)}.chat.json`, exportChat(chat, Date.now()))}>Export this chat</button>
                <button type="button" className="btn small danger" onClick={onDelete}>Delete this chat</button>
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}

// The exact request for the last reply, and what came back. This is how a bad reply gets debugged.
function SentView({ sent }: { sent: Sent | null }) {
  if (!sent) return <p className="empty">Nothing has been sent in this chat yet. After the next reply, the whole request shows here.</p>;
  const request = sent.request as { model?: string; provider?: string; mode?: string; messages?: { role: string; content: string }[]; prefill?: string } & Record<string, unknown>;
  const { messages = [], prefill, ...rest } = request;
  const usage = (sent.diagnostics as { usage?: { prompt_tokens?: number } } | null)?.usage?.prompt_tokens;
  return (
    <>
      <p className="meter">
        {PROFILE_NAMES[sent.profile as keyof typeof PROFILE_NAMES] ?? sent.profile} · {request.model} · {new Date(sent.at).toLocaleTimeString()} · about {sent.tokens.toLocaleString()} tokens{typeof usage === 'number' ? ` (the provider counted ${usage.toLocaleString()})` : ''}
      </p>
      <p className="hint">{sent.parts.map((part) => `${part.label} ${part.tokens.toLocaleString()}`).join(' · ')}</p>
      {sent.error && <p className="status bad">{sent.error}</p>}
      {sent.notes.map((note) => <p key={note} className="status">{note}</p>)}
      {messages.map((message, index) => (
        <section key={index} className="block" aria-label={`${message.role} message ${index + 1}`}>
          <div className="block-head"><span>{message.role}</span><span className="hint">{index + 1} of {messages.length}</span></div>
          <pre className="raw">{message.content}</pre>
        </section>
      ))}
      {prefill && <section className="block"><div className="block-head"><span>Start of the reply (prefill)</span></div><pre className="raw">{prefill}</pre></section>}
      <section className="block"><div className="block-head"><span>What came back</span></div><pre className="raw">{sent.reply || '(nothing)'}</pre></section>
      <details className="block">
        <summary>Settings and diagnostics</summary>
        <pre className="raw">{JSON.stringify({ request: rest, diagnostics: sent.diagnostics }, null, 2)}</pre>
      </details>
    </>
  );
}
