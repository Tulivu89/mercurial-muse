// One chat. The screen is the reading: the transcript takes all the room there is, the header
// tucks away while you read down, and a message's controls show only when you touch it. The
// composer sits at the thumb. Everything else (what was sent, memory, the clock) is one tap away
// under the hood.
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import {
  PROFILE_NAMES, XIALONG, addAlternative, addReply, addUserMessage, buildRequest, buildSide, clockNow, clockTracks, deleteMessage, editMessage, editableText, formatMinutes,
  hasSchedule, lastEmotion, messageText, pickedAlt, profileFor, readReply, readSide, recentEmotions, remember, replacePicked, sceneFor, setWhyText, sideTask,
  SETTINGS_EXPORT_FORMAT, exportChat, makeTestPack, samplersFor, statusText, stepAlternative, type Built, type Chat, type ChatMessage, type PackSettings, type ReplyPart, type SideKind,
} from '../../core/chat/index.js';
import type { World } from '../../core/records/index.js';
import { canPrefill, generate, requestFor, type Connection, type GenerateOptions, type NarrationError } from '../../kit/src/connection';
import { clock as clockText, downloadJson, fileSafe, newId } from '../../kit/src/util';
import { AgainIcon, BackIcon, BinIcon, CloseIcon, ContinueIcon, CopyIcon, EditIcon, KeepIcon, NextIcon, SendIcon, StopIcon } from './icons';
import { ContextPanel, DetailsPanel, MemoryPanel, SentPanel, TimePanel, type ExportApi, type SideApi } from './Panels';
import { Portrait } from './Portrait';
import { InkMark } from '../../kit/src/Mark';
import { RichText } from './RichText';
import { contextTokensFor, type Settings } from './settings';
import type { PortraitSet, Sent } from './store';

type Kind = 'reply' | 'regenerate' | 'continue';
type Panel = 'sent' | 'context' | 'memory' | 'time' | 'details';
const PANELS: Record<Panel, string> = { sent: 'What was sent', context: 'In context now', memory: 'Memory', time: 'Time', details: 'This chat' };
// Short enough for all five to fit across a phone.
const PANEL_TABS: Record<Panel, string> = { sent: 'Sent', context: 'Context', memory: 'Memory', time: 'Time', details: 'Chat' };
interface Busy { kind: Kind; messageId: string | null; text: string; lead: string }

const compact = (tokens: number) => (tokens >= 1000 ? `${(tokens / 1000).toFixed(tokens >= 10_000 ? 0 : 1)}k` : String(tokens));
const rng = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export interface ChatViewProps {
  chat: Chat;
  world: World | null;
  connection: Connection;
  settings: Settings;
  portraits?: PortraitSet;
  sent?: Sent | null;
  // Home: how the character's needs stand, when they are being kept.
  needs?: string;
  onChange: (chat: Chat) => void;
  onSent?: (sent: Sent) => void;
  onBack: () => void;
  onOverview?: () => void | Promise<void>;
  onDelete: () => void;
  onSettings: () => void;
  // Swapped out in tests so nothing leaves the machine.
  generateImpl?: typeof generate;
}

export function ChatView({ chat, world, connection, settings, portraits, sent = null, needs, onChange, onSent, onBack, onOverview, onDelete, onSettings, generateImpl = generate }: ChatViewProps) {
  // The status line follows the clock without a reply having to happen.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setTick(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const scene = useMemo(() => (world ? sceneFor(world, chat, clockNow(chat.clock, tick)) : null), [world, chat, tick]);
  const charName = scene?.charName ?? (chat.characterName || 'Character');
  const userName = scene?.userName ?? chat.userName;
  const profile = profileFor(connection.model);

  const [busy, setBusy] = useState<Busy | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [face, setFace] = useState(false);
  const [remembering, setRemembering] = useState<string | null>(null);
  const [asAction, setAsAction] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<Sent | null>(sent);
  const [preview, setPreview] = useState<Built | null>(null);
  const [tucked, setTucked] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const leaving = useRef(false);
  const firstBuild = useRef(true);
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const thread = useRef<HTMLElement>(null);
  const scroll = useRef({ top: 0, stick: true, auto: false });
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setLastSent(sent), [sent]);
  useEffect(() => () => abort.current?.abort(), []);
  // New text keeps the view at the bottom, unless the reader has scrolled up to read back.
  useEffect(() => {
    const node = thread.current;
    if (node && scroll.current.stick) { scroll.current.auto = true; node.scrollTop = node.scrollHeight; }
  }, [chat.messages.length, busy?.text, openId]);

  // The header tucks away while reading down and comes back on the way up.
  const onScroll = () => {
    const node = thread.current;
    if (!node) return;
    const top = node.scrollTop;
    const moved = top - scroll.current.top;
    const auto = scroll.current.auto;
    scroll.current = { top, stick: node.scrollHeight - top - node.clientHeight < 120, auto: false };
    // Only the reader's own scrolling moves the header; following a reply down doesn't.
    if (auto) return;
    if (moved > 8 && top > 80) setTucked(true);
    else if (moved < -8 || top < 40) setTucked(false);
  };

  const target = profile === 'aetherroom' ? { ...connection, mode: 'chat' as const } : connection;
  const buildOptions = (upTo: number, continuing: boolean, dryRun: boolean, draft?: string) => ({
    model: connection.model,
    canPrefill: profile === 'general' && canPrefill(connection),
    contextTokens: contextTokensFor(settings, connection),
    replyTokens: settings.replyTokens,
    nowMs: Date.now(),
    upTo, continuing, draft, dryRun, needs,
    firstBuild: firstBuild.current,
    rngInt: rng,
  });
  const samplers = (maxTokens: number): GenerateOptions => (profile === 'aetherroom'
    ? { maxTokens, temperature: XIALONG.temperature, top_p: XIALONG.top_p, top_k: XIALONG.top_k, min_p: XIALONG.min_p }
    : { maxTokens, temperature: settings.temperature });
  const ready = (): string => {
    if (!world || !scene) return `${charName} is no longer in your worlds, so this chat can be read but not continued.`;
    if (!connection.connected || !connection.model) return 'Connect a model first, under Settings.';
    return '';
  };

  // The three files for a test: the chat, the settings, and everything in one pack.
  const packSettings = (): PackSettings => ({
    provider: connection.provider, model: connection.model, mode: target.mode, format: target.format, profile,
    contextTokens: contextTokensFor(settings, connection), replyTokens: settings.replyTokens, samplers: samplersFor(connection.model, settings.temperature),
  });
  const exports: ExportApi = {
    chat: () => downloadJson(`${fileSafe(charName)}.chat.json`, exportChat(chat, Date.now())),
    settings: () => downloadJson('chat-settings.json', { format: SETTINGS_EXPORT_FORMAT, exportedAt: Date.now(), request: packSettings(), chat: settings }),
    pack: async () => {
      const next = world ? await buildRequest(chat, world, { ...buildOptions(chat.messages.length, false, true, chat.draft), firstBuild: false }) : null;
      const last = lastSent ? { at: lastSent.at, profile: lastSent.profile, request: lastSent.request, reply: lastSent.reply, tokens: lastSent.tokens, ...(lastSent.error ? { error: lastSent.error } : {}) } : null;
      if (!world) return;
      downloadJson(`${fileSafe(charName)}-test.json`, makeTestPack({ chat, world, settings: packSettings(), needs, next, last, now: Date.now() }));
    },
  };

  // What the next reply would be sent, for the In context now panel.
  useEffect(() => {
    if (panel !== 'context' || !world) { setPreview(null); return; }
    let live = true;
    void buildRequest(chat, world, { ...buildOptions(chat.messages.length, false, true, chat.draft), firstBuild: false }).then((built) => { if (live) setPreview(built); });
    return () => { live = false; };
  }, [panel, chat, world, connection.model, settings]);

  function run(kind: Kind, targetId?: string, base: Chat = chatRef.current): Promise<void> {
    if (inFlight.current) return inFlight.current;
    const task = runTurn(kind, targetId, base).catch((error: unknown) => { setBusy(null); setError(error instanceof Error ? error.message : 'The reply failed.'); });
    inFlight.current = task;
    void task.finally(() => { if (inFlight.current === task) inFlight.current = null; });
    return task;
  }

  async function runTurn(kind: Kind, targetId?: string, base: Chat = chatRef.current) {
    if (busy) return;
    const blocked = ready();
    if (blocked) { setError(blocked); return; }
    const index = targetId ? base.messages.findIndex((message) => message.id === targetId) : -1;
    if (kind !== 'reply' && index < 0) return;
    const upTo = kind === 'reply' ? base.messages.length : kind === 'regenerate' ? index : index + 1;
    const built = await buildRequest(base, world!, buildOptions(upTo, kind === 'continue', false));
    if (!built || leaving.current) return;

    const options: GenerateOptions = { ...samplers(settings.replyTokens), ...(built.profile === 'general' ? { stop: [`\n${userName}:`] } : {}), ...(built.prefill ? { prefill: built.prefill } : {}) };
    const controller = new AbortController();
    abort.current = controller;
    setError('');
    setOpenId(null);
    scroll.current.stick = true;
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
      onChange({ ...next, roll: built.roll, windowStart: built.windowStart, plans: built.plans });
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
    if (busy || inFlight.current) return;
    const text = chat.draft.trim();
    let base: Chat = { ...chatRef.current, draft: '' };
    if (text) base = { ...addUserMessage(base, asAction && !/^\*.*\*$/s.test(text) ? `*${text}*` : text, newId(), Date.now()), draft: '' };
    onChange(base);
    void run('reply', undefined, base);
  }

  // A diary entry, a feeling or a plan: shown before it is sent, and sent only when asked.
  const side: SideApi = {
    preview: async (kind: SideKind) => {
      const blocked = ready();
      if (blocked) return blocked;
      const task = sideTask(kind, recentEmotions(chat, 10), rng);
      const built = await buildSide(task, chat, world!, buildOptions(chat.messages.length, false, true));
      // Models that think before they write need room for it on top of CharacterRoom's budget.
      return built ? { kind, built, maxTokens: profile === 'aetherroom' ? task.maxTokens : Math.max(task.maxTokens * 2, 600) } : 'This chat\'s world is gone.';
    },
    write: async ({ built, maxTokens }, onText) => {
      let text = '';
      try {
        const result = await generateImpl(built.messages, target, { ...samplers(maxTokens), ...(built.prefill ? { prefill: built.prefill } : {}), onDelta: (piece) => { text += piece; onText(text); } });
        text = result.text;
      } catch (caught) {
        return caught instanceof Error ? caught.message : 'It could not be written.';
      }
      return readSide(text, built.lead, charName, userName) ?? 'It came back empty. Try again; there may not be enough chat to work from yet.';
    },
  };

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
  const windowStart = profile === 'aetherroom' ? 0 : chat.windowStart;
  const scheduled = hasSchedule(scene?.character.schedule);
  const stamp = scene ? `${scene.status.day.slice(0, 3)} ${formatMinutes(scene.status.minutes)}` : '';
  const status = scheduled && scene ? statusText(scene.status) : '';
  const wearing = scene?.picks.map((pick) => {
    const owner = [scene.character, scene.persona, scene.scenario].find((record) => record?.id === pick.ownerId);
    const set = owner?.sets.find((entry) => entry.id === pick.setId);
    const member = set?.members.find((entry) => entry.id === pick.memberId);
    return set && member ? { key: `${pick.ownerId}:${pick.setId}`, title: set.title, name: member.name, why: setWhyText(pick) } : null;
  }).filter(Boolean) ?? [];

  // Who they are right now: the portrait at full size, what they are doing, what they have on.
  const about = (
    <>
      {/* With no pictures yet, a small initial; the large frame is for a portrait. */}
      <Portrait name={charName} emotion={emotion} set={portraits} size={Object.keys(portraits ?? {}).length ? 0 : 72} />
      <div className="about-text">
        <h2>{charName}</h2>
        <p className="hint">Looking {emotion}</p>
        {scene?.character.line && <p className="line">{scene.character.line}</p>}
        {scheduled && <p className="now"><span className={`dot${scene!.status.live.length ? ' on' : ''}`} />{status} <span className="hint">{stamp}{clockTracks(chat.clock) ? '' : ' · not sent'}</span></p>}
        {wearing.map((entry) => <p key={entry!.key} className="hint"><b>{entry!.title}:</b> {entry!.name}, {entry!.why}</p>)}
      </div>
    </>
  );

  return (
    <div className={`chat${panel ? ' paneled' : ''}${settings.rail ? ' railed' : ''}`} data-size={settings.textSize} data-layout={settings.layout}>
      {settings.rail && <aside className="rail" aria-label={`About ${charName}`}>{about}</aside>}

      <div className="column">
        <header className={`chat-head${tucked && !panel ? ' tucked' : ''}`}>
          <button type="button" className="icon-btn plain" onClick={onBack} aria-label="Back to your chats"><BackIcon /></button>
          <a className="icon-btn plain" href="/overview/" aria-label="Inkwyrm, the front page" onClick={async (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); leaving.current = true; abort.current?.abort();
            try { await inFlight.current; await onOverview?.(); window.location.assign('/overview/'); }
            catch { leaving.current = false; /* the app reports the save failure */ }
          }}><InkMark size={28} /></a>
          <button type="button" className="who" onClick={() => setFace(true)} aria-label={`About ${charName}`}>
            <Portrait name={charName} emotion={emotion} set={portraits} size={40} />
            <span className="chat-who">
              <b>{charName}</b>
              <span className="hint">{scheduled ? <><span className={`dot${scene!.status.live.length ? ' on' : ''}`} />{status} · {stamp}</> : connection.connected ? `${connection.model} · ${PROFILE_NAMES[profile]}` : 'Not connected'}</span>
            </span>
          </button>
          <button type="button" className="meter-chip" onClick={() => setPanel(panel ? null : 'sent')} aria-expanded={panel !== null} aria-label="Under the hood" title="Under the hood: what was sent, memory, time">
            {lastSent ? compact(lastSent.tokens) : '···'}
          </button>
        </header>

        <main className="thread" ref={thread} onScroll={onScroll} aria-label={`Chat with ${charName}`}>
          {chat.messages.length === 0 && !busy && <p className="hint center">Say something, or press Send with nothing typed and {charName} speaks first.</p>}
          {chat.messages.map((message, index) => {
            const alt = pickedAlt(message);
            const mine = message.from === 'user';
            const replaced = busy?.messageId === message.id;
            const isLast = message.id === lastId;
            const open = openId === message.id;
            if (editing?.id === message.id) {
              return (
                <div key={message.id} className={`turn ${message.from} editing`}>
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
            const swipe = !mine && (message.alts.length > 1 || isLast) && (
              <span className="swipe">
                <button type="button" className="chip-btn" onClick={() => step(message, -1)} disabled={message.pick === 0} aria-label="Earlier reply"><BackIcon size={16} /></button>
                <span aria-label={`Reply ${message.pick + 1} of ${message.alts.length}`}>{message.pick + 1}/{message.alts.length}</span>
                <button type="button" className="chip-btn" onClick={() => step(message, 1)} disabled={message.pick >= message.alts.length - 1 && !isLast} aria-label={message.pick >= message.alts.length - 1 ? 'Another reply' : 'Later reply'}><NextIcon size={16} /></button>
              </span>
            );
            return (
              <div key={message.id} className={`turn ${message.from}${index < windowStart ? ' out' : ''}${open ? ' open' : ''}`} onTouchStart={(event) => { const point = event.touches[0]; touch.current = point ? { x: point.clientX, y: point.clientY } : null; }} onTouchEnd={onTouchEnd(message)}>
                <span className="speaker">{mine ? userName : charName}</span>
                <div className="bubbles" role="group" aria-label={`${mine ? userName : charName}, ${clockText(message.at, Date.now())}`} onClick={() => setOpenId(open ? null : message.id)}>
                  {replaced && busy.kind === 'regenerate' ? (streaming.length ? bubbles(streaming, 'character') : typing)
                    : replaced ? bubbles(streaming.length ? streaming : alt.parts, 'character')
                      : bubbles(alt.parts, message.from)}
                </div>
                {!busy && (open || (isLast && !mine)) && (
                  <div className="actions">
                    {swipe}
                    {!mine && isLast && <button type="button" className="chip-btn" onClick={() => void run('regenerate', message.id)} aria-label="Regenerate" title="Regenerate"><AgainIcon size={16} /></button>}
                    {open && (
                      <>
                        {!mine && isLast && <button type="button" className="chip-btn" onClick={() => void run('continue', message.id)} aria-label="Continue" title="Continue this reply"><ContinueIcon size={16} /></button>}
                        <button type="button" className="chip-btn" onClick={() => setEditing({ id: message.id, text: editableText(message, charName) })} aria-label="Edit" title="Edit"><EditIcon size={16} /></button>
                        <button type="button" className="chip-btn" onClick={() => void copy(message)} aria-label="Copy" title="Copy">{copied === message.id ? <span className="done">Copied</span> : <CopyIcon size={16} />}</button>
                        <button type="button" className="chip-btn" onClick={() => setRemembering(messageText(message).replace(/\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 300))} aria-label="Remember this" title="Remember this"><KeepIcon size={16} /></button>
                        <button type="button" className="chip-btn danger" onClick={() => { if (window.confirm('Delete this message? The model stops seeing it too.')) onChange(deleteMessage(chat, message.id, Date.now())); }} aria-label="Delete" title="Delete"><BinIcon size={16} /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {busy?.kind === 'reply' && <div className="turn character"><span className="speaker">{charName}</span><div className="bubbles">{streaming.length ? bubbles(streaming, 'character') : typing}</div></div>}
          {error && <p className="status bad" role="alert">{error} {!connection.connected && <button type="button" className="link" onClick={onSettings}>Open Settings</button>}</p>}
        </main>

        <form className="composer" onSubmit={(event) => { event.preventDefault(); send(); }}>
          <button type="button" className={`mode${asAction ? ' on' : ''}`} aria-pressed={asAction} aria-label={asAction ? '*Action*' : 'Speech'} onClick={() => setAsAction(!asAction)} title={asAction ? 'Sent as an action, in asterisks. Tap for speech.' : 'Sent as speech. Tap to send an action.'}>{asAction ? '*do*' : 'say'}</button>
          <label className="sr" htmlFor="draft">Your message</label>
          <textarea
            id="draft" rows={1} value={chat.draft} placeholder={asAction ? 'What you do' : `Message ${charName}`}
            onChange={(event) => onChange({ ...chat, draft: event.target.value })}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }}
          />
          {busy
            ? <button type="button" className="send" onClick={() => abort.current?.abort()} aria-label="Stop"><StopIcon /></button>
            : <button type="submit" className="send" aria-label="Send"><SendIcon /></button>}
        </form>
      </div>

      {face && (
        <div className="sheet face" role="dialog" aria-label={`About ${charName}`}>
          <button type="button" className="icon-btn plain close" onClick={() => setFace(false)} aria-label="Close"><CloseIcon /></button>
          {about}
        </div>
      )}

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
          <div className="tabs" role="tablist">
            {(Object.keys(PANELS) as Panel[]).map((name) => (
              <button key={name} type="button" role="tab" aria-selected={panel === name} aria-label={PANELS[name]} title={PANELS[name]} className={`tab${panel === name ? ' on' : ''}`} onClick={() => setPanel(name)}>{PANEL_TABS[name]}</button>
            ))}
            <button type="button" className="icon-btn plain" style={{ marginLeft: 'auto' }} onClick={() => setPanel(null)} aria-label="Close"><CloseIcon /></button>
          </div>
          {panel === 'sent' && <SentPanel sent={lastSent} exports={world ? exports : undefined} charName={charName} />}
          {panel === 'context' && <ContextPanel preview={preview} budget={contextTokensFor(settings, connection)} gone={!world} model={connection.model} charName={charName} />}
          {panel === 'memory' && <MemoryPanel chat={chat} onChange={onChange} charName={charName} userName={userName} model={connection.model} side={side} onRemember={() => setRemembering('')} />}
          {panel === 'time' && <TimePanel chat={chat} onChange={onChange} scene={scene} charName={charName} />}
          {panel === 'details' && <DetailsPanel chat={chat} onChange={onChange} scene={scene} world={world} charName={charName} onDelete={onDelete} exports={world ? exports : undefined} />}
        </aside>
      )}
    </div>
  );
}
