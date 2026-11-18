// The panels under the hood of a chat: what was sent, what is in context, what the character
// remembers, the clock, and this chat's own settings.
import { useState } from 'react';
import {
  CLOCK_STEPS, GENERAL_LENGTHS, PLAN_TURNS, PROFILE_NAMES, generalLengthName, generalLengthOf, type Profile, RESPONSE_LENGTHS, SIDE_NAMES, STYLES, STYLE_HINTS, STYLE_NAMES, addPlan, clockTracks, exportChat, formatDate,
  formatMinutes, formatStamp, hasSchedule, levelReaches, lorePool, minutesOfDay, moveClock, nextMorningMs, pinKey, responseLengthName, roundToHalfHour,
  requestText, setClockMode, setJournalEntry, setMemory, setPlan, setWhyText, statusText, storyActive, timeOfDayMs,
  type Built, type Chat, type MemoryKind, type Scene, type SideEntry, type SideKind, chatToSillyTavern, chatToText, CHAPTER_TRIES, changeChapter, isStale, settleFact } from '../../core/chat/index.js';
import { BOND_CONDITIONS, KIND_NAMES, RELATIONSHIPS, type World } from '../../core/records/index.js';
import { KeysField } from '../../kit/src/Fields';
import { downloadJson, downloadText, fileSafe, newId } from '../../kit/src/util';
import type { Sent } from './store';

const WHY: Record<string, string> = { always: 'Always', here: 'Here', named: 'Named', when: 'When', line: 'Line' };
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
type Change = (chat: Chat) => void;

// What ChatView saves: the chat, the settings, and everything for a test in one file.
export interface ExportApi { chat: () => void; settings: () => void; pack: () => Promise<void> }

// The three files a bad reply gets looked at with, in one place.
export function ExportBar({ api }: { api: ExportApi }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className="block" aria-label="Save for a test">
      <div className="block-head"><span>Save for a test</span></div>
      <div className="row">
        <button type="button" className="btn small" disabled={busy} onClick={() => { setBusy(true); void api.pack().finally(() => setBusy(false)); }}>{busy ? 'Saving…' : 'Everything'}</button>
        <button type="button" className="btn small quiet" onClick={api.chat}>The chat</button>
        <button type="button" className="btn small quiet" onClick={api.settings}>Settings</button>
      </div>
      <p className="hint">Everything is one file: this chat, its world, the settings (never your key), what the next reply would be sent, and the last request with what came back. <code>npm run chat:lab</code> rebuilds and tests it, and another app&rsquo;s model can read it.</p>
    </section>
  );
}

// A whole request as text: copied to paste into another app, or saved as a file.
function RequestButtons({ text, file }: { text: string; file: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => void navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => undefined);
  return (
    <div className="row">
      <button type="button" className="btn small quiet" onClick={copy}>{copied ? 'Copied' : 'Copy as text'}</button>
      <button type="button" className="btn small quiet" onClick={() => downloadText(file, text)}>Save as text</button>
    </div>
  );
}

// The exact request for the last reply, and what came back. This is how a bad reply gets debugged.
export function SentPanel({ sent, exports, charName }: { sent: Sent | null; exports?: ExportApi; charName?: string }) {
  if (!sent) return <>{exports && <ExportBar api={exports} />}<p className="empty">Nothing has been sent in this chat yet. After the next reply, the whole request shows here.</p></>;
  const request = sent.request as { model?: string; messages?: { role: string; content: string }[]; prefill?: string } & Record<string, unknown>;
  const { messages = [], prefill, ...rest } = request;
  const usage = (sent.diagnostics as { usage?: { prompt_tokens?: number } } | null)?.usage?.prompt_tokens;
  const name = charName || 'the character';
  const text = `${requestText({ profile: sent.profile, model: String(request.model ?? ''), messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[], prefill, parts: sent.parts, tokens: sent.tokens }, `What ${name} was sent for the last reply`)}\n## What came back\n\n${sent.reply || '(nothing)'}\n`;
  return (
    <>
      {exports && <ExportBar api={exports} />}
      <RequestButtons text={text} file={`${fileSafe(name)}-sent.md`} />
      <p className="meter">
        {PROFILE_NAMES[sent.profile as keyof typeof PROFILE_NAMES] ?? sent.profile} · {request.model} · {new Date(sent.at).toLocaleTimeString()} · about {sent.tokens.toLocaleString()} tokens{typeof usage === 'number' ? ` (the provider counted ${usage.toLocaleString()})` : ''}
      </p>
      <p className="hint">{sent.parts.map((part) => `${part.label} ${part.tokens.toLocaleString()}`).join(' · ')}</p>
      {sent.error && <p className="status bad">{sent.error}</p>}
      {sent.notes.map((note) => <p key={note} className="status">{note}</p>)}
      <Messages messages={messages} prefill={prefill} />
      <section className="block"><div className="block-head"><span>What came back</span></div><pre className="raw">{sent.reply || '(nothing)'}</pre></section>
      <details className="block">
        <summary>Settings and diagnostics</summary>
        <pre className="raw">{JSON.stringify({ request: rest, diagnostics: sent.diagnostics }, null, 2)}</pre>
      </details>
    </>
  );
}

function Messages({ messages, prefill }: { messages: { role: string; content: string }[]; prefill?: string }) {
  return (
    <>
      {messages.map((message, index) => (
        <section key={index} className="block" aria-label={`${message.role} message ${index + 1}`}>
          <div className="block-head"><span>{message.role}</span><span className="hint">{index + 1} of {messages.length}</span></div>
          <pre className="raw">{message.content}</pre>
        </section>
      ))}
      {prefill && <section className="block"><div className="block-head"><span>Start of the reply (prefill)</span></div><pre className="raw">{prefill}</pre></section>}
    </>
  );
}

export function ContextPanel({ preview, budget, gone, model = '', charName = '' }: { preview: Built | null; budget: number; gone: boolean; model?: string; charName?: string }) {
  const name = charName || 'the character';
  return (
    <>
      <p className="hint">What the next reply would be sent, by reach. Type in the message box and Named parts come in as their keys appear. Copy as text gives the whole request, exactly as it would go.</p>
      {!preview && <p className="empty">{gone ? 'This chat\'s world is gone.' : 'Working it out…'}</p>}
      {preview && (
        <>
          <RequestButtons text={requestText({ ...preview, model }, `What ${name} would be sent for the next reply`)} file={`${fileSafe(name)}-next.md`} />
          <p className="meter">{PROFILE_NAMES[preview.profile]} · about {preview.tokens.toLocaleString()} of {budget.toLocaleString()} tokens · {preview.parts.map((part) => `${part.label} ${part.tokens.toLocaleString()}`).join(' · ')}</p>
          {preview.notes.map((note) => <p key={note} className="status">{note}</p>)}
          {preview.answer.blocks.map((block) => (
            <section key={block.recordId ?? 'world'} className="block" aria-label={block.name}>
              <div className="block-head"><span>{block.name} <span className="hint">{block.kind === 'world' ? 'world' : KIND_NAMES[block.kind].one.toLowerCase()}</span></span><span className={`chip ${block.why}`}>{WHY[block.why]}</span></div>
              {block.parts.map((part, at) => <p key={at} className="part">{part.reach !== 'line' && <b>{part.title}</b>}{part.text}</p>)}
            </section>
          ))}
        </>
      )}
    </>
  );
}

// What ChatView does for a side generation: work out the request, then send it.
export interface SideApi {
  // `upTo`: the chat as it stood after that many messages; the whole chat when left out.
  preview: (kind: SideKind, upTo?: number) => Promise<{ kind: SideKind; built: Built; maxTokens: number } | string>;
  write: (ready: { kind: SideKind; built: Built; maxTokens: number }, onText: (text: string) => void) => Promise<SideEntry | string>;
}

export interface CarryApi { from: Chat[]; bring: (source: Chat) => void; busy: boolean }

export function MemoryPanel({ chat, onChange, charName, userName, model, side, onRemember, carry }: {
  chat: Chat; onChange: Change; charName: string; userName: string; model: string; side: SideApi; onRemember: () => void; carry?: CarryApi;
}) {
  const [ready, setReady] = useState<{ kind: SideKind; built: Built; maxTokens: number } | null>(null);
  const [busy, setBusy] = useState<SideKind | null>(null);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [own, setOwn] = useState('');

  const ask = async (kind: SideKind) => {
    setNote('');
    setText('');
    const result = await side.preview(kind);
    if (typeof result === 'string') { setNote(result); setReady(null); return; }
    setReady(result);
  };
  const write = async () => {
    if (!ready) return;
    setBusy(ready.kind);
    setText('');
    const result = await side.write(ready, setText);
    setBusy(null);
    if (typeof result === 'string') { setNote(result); return; }
    const now = Date.now();
    if (ready.kind === 'plan') onChange(addPlan(chat, { id: newId(), name: result.name, content: result.content }, now));
    else onChange({ ...chat, [ready.kind]: [...chat[ready.kind], { id: newId(), ...result, at: now }], updatedAt: now });
    setReady(null);
    setText('');
  };

  const memories = (kind: MemoryKind, title: string, hint: string, button: SideKind) => (
    <section className="group" aria-label={title}>
      <div className="row between"><h3>{title}</h3><button type="button" className="btn small" onClick={() => void ask(button)} disabled={busy !== null}>{SIDE_NAMES[button].button}</button></div>
      <p className="hint">{hint}</p>
      {chat[kind].map((entry) => (
        <div key={entry.id} className="card">
          <input className="input" aria-label="Title" value={entry.name} maxLength={200} onChange={(event) => onChange(setMemory(chat, kind, entry.id, { name: event.target.value }, Date.now()))} />
          <textarea className="input" aria-label="What it says" rows={3} value={entry.content} onChange={(event) => onChange(setMemory(chat, kind, entry.id, { content: event.target.value }, Date.now()))} />
          <KeysField label="Keys: what brings it back" value={entry.keys} onChange={(keys) => onChange(setMemory(chat, kind, entry.id, { keys }, Date.now()))} />
          <button type="button" className="link danger" onClick={() => onChange(setMemory(chat, kind, entry.id, null, Date.now()))}>Remove</button>
        </div>
      ))}
    </section>
  );

  return (
    <>
      {ready && (
        <section className="card ask" aria-label={`${SIDE_NAMES[ready.kind].button}: what it will send`}>
          <p><b>{SIDE_NAMES[ready.kind].button}.</b> {charName} writes {SIDE_NAMES[ready.kind].what}. This sends about {ready.built.tokens.toLocaleString()} tokens to {model} and allows up to {ready.maxTokens} back.</p>
          <details>
            <summary>What gets sent</summary>
            <Messages messages={ready.built.messages} prefill={ready.built.prefill} />
          </details>
          {text && <pre className="raw">{text}</pre>}
          <div className="row">
            <button type="button" className="btn primary" onClick={() => void write()} disabled={busy !== null}>{busy ? 'Writing…' : 'Write it'}</button>
            <button type="button" className="btn quiet" onClick={() => { setReady(null); setText(''); }} disabled={busy !== null}>Cancel</button>
          </div>
        </section>
      )}
      {note && <p className="status bad" role="status">{note}</p>}

      <Earlier chat={chat} onChange={onChange} charName={charName} carry={carry} />

      <Chapters chat={chat} onChange={onChange} charName={charName} />

      <section className="group" aria-label="Journal">
        <div className="row between"><h3>Journal</h3><button type="button" className="btn small quiet" onClick={onRemember}>Add an entry</button></div>
        <p className="hint">What {charName} knows about {userName}. Active entries go with every reply. The brain button beside the message box adds one.</p>
        {chat.journal.map((entry) => (
          <div key={entry.id} className="card">
            <textarea className="input" aria-label="Journal entry" rows={2} value={entry.text} onChange={(event) => onChange(setJournalEntry(chat, entry.id, { text: event.target.value }, Date.now()))} />
            <div className="row between">
              <label className="checks"><input type="checkbox" checked={entry.active} onChange={(event) => onChange(setJournalEntry(chat, entry.id, { active: event.target.checked }, Date.now()))} /> Sent to {charName}</label>
              <button type="button" className="link danger" onClick={() => onChange(setJournalEntry(chat, entry.id, null, Date.now()))}>Remove</button>
            </div>
          </div>
        ))}
      </section>

      {memories('diary', 'Diary', `${charName}'s own account of the chat so far. An entry comes back into context when one of its keys is said.`, 'diary')}
      {memories('process', 'Feelings', `How one moment made ${charName} feel. Recalled by key, like the diary.`, 'process')}

      <section className="group" aria-label="Plans">
        <div className="row between"><h3>Plans</h3><button type="button" className="btn small" onClick={() => void ask('plan')} disabled={busy !== null}>{SIDE_NAMES.plan.button}</button></div>
        <p className="hint">What {charName} means to do over the next few replies. One limited plan and one ongoing plan ride along with each reply; a limited one counts down by your messages.</p>
        {chat.plans.map((plan) => (
          <div key={plan.id} className="card">
            <textarea className="input" aria-label="The plan" rows={2} value={plan.content} onChange={(event) => onChange(setPlan(chat, plan.id, { content: event.target.value }, Date.now()))} />
            <div className="row">
              <label className="field grow"><span>Whose</span>
                <select value={plan.planType} onChange={(event) => onChange(setPlan(chat, plan.id, { planType: event.target.value as 'AI' | 'User' }, Date.now()))}>
                  <option value="AI">{charName}'s own</option><option value="User">Yours for {charName}</option>
                </select>
              </label>
              <label className="field grow"><span>Lasts</span>
                <select value={plan.durationType} onChange={(event) => onChange(setPlan(chat, plan.id, { durationType: event.target.value as 'Limited' | 'Ongoing' }, Date.now()))}>
                  <option value="Limited">A few turns</option><option value="Ongoing">Ongoing</option>
                </select>
              </label>
              {plan.durationType === 'Limited' && (
                <label className="field" style={{ width: 96 }}><span>Turns</span>
                  <input type="number" min={1} max={99} value={plan.totalTurns} onChange={(event) => { const turns = Math.min(99, Math.max(1, Math.round(Number(event.target.value) || 1))); onChange(setPlan(chat, plan.id, { totalTurns: turns, remainingTurns: turns, running: false, startedAtCount: -1 }, Date.now())); }} />
                </label>
              )}
            </div>
            <div className="row between">
              <span className="hint">{plan.durationType === 'Ongoing' ? 'Stays until you remove it.' : plan.running ? `${Math.max(0, plan.remainingTurns)} of ${plan.totalTurns} turns left` : 'Not started yet.'}</span>
              <button type="button" className="link danger" onClick={() => onChange(setPlan(chat, plan.id, null, Date.now()))}>Remove</button>
            </div>
          </div>
        ))}
        <form className="row" onSubmit={(event) => { event.preventDefault(); if (!own.trim()) return; onChange(addPlan(chat, { id: newId(), name: '', content: own.trim(), planType: 'User', totalTurns: PLAN_TURNS, remainingTurns: PLAN_TURNS }, Date.now())); setOwn(''); }}>
          <label className="field grow"><span>A plan of your own for {charName}</span>
            <input value={own} maxLength={4000} placeholder={`${charName} steers the talk toward the letter.`} onChange={(event) => setOwn(event.target.value)} />
          </label>
          <button type="submit" className="btn small" style={{ alignSelf: 'flex-end' }} disabled={!own.trim()}>Add</button>
        </form>
      </section>
    </>
  );
}

export function TimePanel({ chat, onChange, scene, charName }: { chat: Chat; onChange: Change; scene: Scene | null; charName: string }) {
  const clock = chat.clock;
  const set = (next: Chat['clock']) => onChange({ ...chat, clock: next });
  const story = storyActive(clock);
  const scheduled = hasSchedule(scene?.character.schedule);
  const move = (minutes: number) => set(moveClock(clock, minutes));
  return (
    <>
      <fieldset className="card" style={{ margin: 0 }}>
        <legend className="sub">This chat's clock</legend>
        <div className="checks">
          <label><input type="radio" name="clock" checked={clock.mode === 'real'} onChange={() => set(setClockMode(clock, 'real', Date.now()))} /> Real time</label>
          <label><input type="radio" name="clock" checked={clock.mode === 'story'} onChange={() => set(setClockMode(clock, 'story', Date.now()))} /> Story time</label>
        </div>
        {clock.mode === 'real'
          ? <label className="checks"><input type="checkbox" checked={clock.trackReal} onChange={(event) => set({ ...clock, trackReal: event.target.checked })} /> Tell {charName} the time: how long you've been apart, and what the schedule has on</label>
          : <p className="hint">Story time stands still until you move it. Time apart and the schedule are read from it, and deleting the latest reply puts it back.</p>}
      </fieldset>

      {story && (
        <section className="card" aria-label="Story time">
          <p className="stamp">{formatStamp(clock.storyMs)} <span className="hint">{formatDate(clock.storyMs)}</span></p>
          <div className="row">
            {([['−1 day', -1440], ['−1 h', -60], ['−30 min', -30], ['+30 min', 30], ['+1 h', 60], ['+8 h', 480], ['+1 day', 1440]] as const).map(([label, minutes]) => (
              <button key={label} type="button" className="btn small quiet" onClick={() => move(minutes)}>{label}</button>
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn small quiet" onClick={() => set({ ...clock, storyMs: nextMorningMs(clock.storyMs) })}>Next morning</button>
            <button type="button" className="btn small quiet" onClick={() => set({ ...clock, storyMs: roundToHalfHour(Date.now()) })}>Match this device</button>
            <label className="field"><span className="sr">Set the time of day</span>
              <input type="time" step={1800} aria-label="Set the time of day" value={formatMinutes(minutesOfDay(clock.storyMs))} onChange={(event) => { const [hours, minutes] = event.target.value.split(':').map(Number); if (Number.isFinite(hours) && Number.isFinite(minutes)) set({ ...clock, storyMs: timeOfDayMs(clock.storyMs, hours! * 60 + minutes!) }); }} />
            </label>
          </div>
          <label className="field"><span>With each reply, time moves on</span>
            <select value={clock.stepMin} onChange={(event) => set({ ...clock, stepMin: Number(event.target.value) })}>
              {CLOCK_STEPS.map((step) => <option key={step} value={step}>{step ? `${step} minutes` : 'Not at all'}</option>)}
            </select>
          </label>
        </section>
      )}

      <section className="group" aria-label="On now">
        <h3>On now</h3>
        {!scheduled && <p className="hint">{charName} has no schedule. Give them one in the Studio and it shows here.</p>}
        {scheduled && scene && (
          <>
            <p className="hint">{scene.status.day} {formatMinutes(scene.status.minutes)}. {clockTracks(clock) ? `${charName} is told this with every reply.` : `Not sent: turn on story time, or tell ${charName} the time above.`}</p>
            {scene.status.live.map((event) => <p key={event.id} className="part"><b>{formatMinutes(event.startTime)} to {formatMinutes(event.endTime)}</b>{event.text}</p>)}
            {!scene.status.live.length && <p className="empty">{statusText(scene.status)}</p>}
            {scene.status.live.length > 0 && scene.status.gated.length > 0 && <p className="hint">{scene.status.gated.length} more held back by the relationship.</p>}
          </>
        )}
      </section>
    </>
  );
}

export function DetailsPanel({ chat, onChange, scene, world, charName, onDelete, exports, profile = 'general' }: { chat: Chat; onChange: Change; scene: Scene | null; world: World | null; charName: string; onDelete: () => void; exports?: ExportApi; profile?: Profile }) {
  const lore = world ? lorePool(world) : [];
  const owners = scene ? [scene.character, scene.persona, scene.scenario].filter(Boolean) : [];
  const tier = (lock: string | null) => BOND_CONDITIONS.find((condition) => condition.id === lock)?.tier;
  // The character is a record in one of the Studio's worlds; a chat never writes to it.
  const source = world?.id === chat.worldId && world.records.some((record) => record.id === chat.characterId);
  return (
    <>
      {source && (
        <p className="hint">
          <a href={`/studio/#/w/${encodeURIComponent(chat.worldId)}?rec=${encodeURIComponent(chat.characterId)}`}>Edit {charName} in the Studio</a>. What you change there reaches the next reply; what has been said stays as it was.
        </p>
      )}
      <div className="row">
        <label className="field grow"><span>Relationship</span>
          <select value={chat.relationship} onChange={(event) => onChange({ ...chat, relationship: event.target.value as Chat['relationship'] })}>{RELATIONSHIPS.map((value) => <option key={value} value={value}>{capital(value)}</option>)}</select>
        </label>
        <label className="field grow"><span>Style</span>
          <select value={chat.style} onChange={(event) => onChange({ ...chat, style: event.target.value as Chat['style'] })}>{STYLES.map((value) => <option key={value} value={value}>{STYLE_NAMES[value]}</option>)}</select>
        </label>
        <label className="field grow"><span>Response length</span>
          {profile === 'aetherroom'
            ? <select value={chat.responseLength} onChange={(event) => onChange({ ...chat, responseLength: event.target.value as Chat['responseLength'] })}>{RESPONSE_LENGTHS.map((value) => <option key={value} value={value}>{responseLengthName(value)}</option>)}</select>
            : <select value={generalLengthOf(chat.responseLength)} onChange={(event) => onChange({ ...chat, responseLength: event.target.value as Chat['responseLength'] })}>{GENERAL_LENGTHS.map((value) => <option key={value} value={value}>{generalLengthName(value)}</option>)}</select>}
        </label>
      </div>
      <p className="hint">{STYLE_HINTS[chat.style]} The relationship decides which of {charName}'s sections and schedule lines behind a bond are in.</p>
      <label className="checks"><input type="checkbox" checked={chat.moods} onChange={(event) => onChange({ ...chat, moods: event.target.checked })} /> Moods: {charName}'s last few emotions, or time away, put them in a state of mind</label>

      {scene && scene.picks.length > 0 && (
        <fieldset className="card" style={{ margin: 0 }}>
          <legend className="sub">One in use at a time</legend>
          {scene.picks.map((pick) => {
            const owner = owners.find((record) => record!.id === pick.ownerId)!;
            const set = owner.sets.find((entry) => entry.id === pick.setId)!;
            if (!set.members.length) return null;
            const key = pinKey(owner.id, set.id);
            const { [key]: _gone, ...rest } = chat.pins;
            return (
              <label key={key} className="field">
                <span>{owner.name} · {set.title}</span>
                <select value={chat.pins[key] ?? ''} onChange={(event) => onChange({ ...chat, pins: event.target.value ? { ...chat.pins, [key]: event.target.value } : rest })}>
                  <option value="">Let it follow the schedule</option>
                  {set.members.map((member) => {
                    const need = tier(member.lock);
                    const locked = !!need && !levelReaches(chat.relationship, need);
                    return <option key={member.id} value={member.id} disabled={locked}>{member.name || 'Unnamed'}{locked ? ` (once you're ${need})` : ''}</option>;
                  })}
                </select>
                <span className="hint">Now: {set.members.find((member) => member.id === pick.memberId)?.name ?? 'none'}, {setWhyText(pick)}.</span>
              </label>
            );
          })}
        </fieldset>
      )}

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
      {exports ? <ExportBar api={exports} /> : (
        <div className="row"><button type="button" className="btn small quiet" onClick={() => downloadJson(`${fileSafe(charName)}.chat.json`, exportChat(chat, Date.now()))}>Export this chat</button></div>
      )}
      <div className="row">
        <button type="button" className="btn small quiet" title="A chat file SillyTavern, Agnai and RisuAI read, every alternative reply kept" onClick={() => downloadText(`${fileSafe(charName)}.jsonl`, chatToSillyTavern(chat), 'application/jsonl')}>Save for SillyTavern</button>
        <button type="button" className="btn small quiet" onClick={() => downloadText(`${fileSafe(charName)}.txt`, chatToText(chat), 'text/plain')}>Save as text</button>
      </div>
      <div className="row">
        <button type="button" className="btn small danger" onClick={onDelete}>Delete this chat</button>
      </div>
    </>
  );
}

// What left the window, written up (core/chat/chapters.ts): each chapter with the messages it
// covers, to read, edit, pin, redo or remove. The chat itself keeps every message.
function Chapters({ chat, onChange, charName }: { chat: Chat; onChange: Change; charName: string }) {
  const indexOf = (id: string) => chat.messages.findIndex((message) => message.id === id);
  return (
    <section className="group" aria-label="Chapters">
      <h3>Chapters</h3>
      <p className="hint">
        When older messages leave what {charName} is sent, they are written up here as chapters, and the chapters go with every reply as the story so far. The chat keeps every message. Edit a chapter to set it straight; Redo writes it again from its messages.
      </p>
      {chat.chapters.length === 0 && <p className="hint">No chapters yet: everything still fits.</p>}
      {(chat.fold.text || chat.chapters.some((chapter) => chapter.folded)) && (
        <div className="card">
          <b>Earlier</b>
          <p className="hint">The oldest chapters, folded into one summary when the chapters outgrew their share of what {charName} is sent. A folded chapter still comes back on its own when one of its keys comes up.</p>
          <textarea className="input" aria-label="Earlier" rows={5} value={chat.fold.text} onChange={(event) => onChange({ ...chat, fold: { ...chat.fold, text: event.target.value }, updatedAt: Date.now() })} />
        </div>
      )}
      {chat.chapters.map((chapter, index) => {
        const from = indexOf(chapter.fromId);
        const to = indexOf(chapter.toId);
        const stale = isStale(chat, chapter);
        const state = chapter.state === 'pending' ? 'Waiting to be written after the next reply.'
          : chapter.state === 'failed' ? (chapter.tries >= CHAPTER_TRIES ? 'It could not be written. Redo to try again.' : 'It could not be written yet; it will be tried again.')
            : stale ? 'Out of date: its messages have changed since. Redo, or edit it by hand.' : '';
        return (
          <div key={chapter.id} className={`card chapter${stale ? ' stale' : ''}`}>
            <div className="row between">
              <b>Chapter {index + 1}</b>
              <span className="hint">{from >= 0 && to >= 0 ? `Messages ${from + 1} to ${to + 1}` : 'Its messages are gone'}</span>
            </div>
            {state && <p className="hint">{state}</p>}
            {chapter.folded && !chapter.pinned && <p className="hint">Folded into Earlier; it comes back on its own when one of its keys comes up.</p>}
            {chapter.facts.map((fact) => (
              <div key={fact} className="row between fact">
                <span>{fact}</span>
                <span className="row">
                  <button type="button" className="btn small" onClick={() => onChange(settleFact(chat, chapter.id, fact, true, newId(), Date.now()))}>Keep in the journal</button>
                  <button type="button" className="link" onClick={() => onChange(settleFact(chat, chapter.id, fact, false, '', Date.now()))}>Dismiss</button>
                </span>
              </div>
            ))}
            {chapter.state === 'written' && (
              <>
                <textarea className="input" aria-label={`Chapter ${index + 1}`} rows={4} value={chapter.text} onChange={(event) => onChange(changeChapter(chat, chapter.id, { text: event.target.value }, Date.now()))} />
                <KeysField label="Keys" value={chapter.keys} onChange={(keys) => onChange(changeChapter(chat, chapter.id, { keys }, Date.now()))} />
              </>
            )}
            <div className="row between">
              <label className="checks"><input type="checkbox" checked={chapter.pinned} onChange={(event) => onChange(changeChapter(chat, chapter.id, { pinned: event.target.checked }, Date.now()))} /> Keep as written, never folded</label>
              <span className="row">
                {(chapter.state !== 'pending') && <button type="button" className="link" onClick={() => onChange(changeChapter(chat, chapter.id, 'redo', Date.now()))}>Redo</button>}
                <button type="button" className="link danger" onClick={() => { if (window.confirm(`Remove chapter ${index + 1}? Its messages stay in the chat; ${charName} stops being sent this chapter.`)) onChange(changeChapter(chat, chapter.id, null, Date.now())); }}>Remove</button>
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// Memory brought in from other chats with the same character, and the way to bring more.
function Earlier({ chat, onChange, charName, carry }: { chat: Chat; onChange: Change; charName: string; carry?: CarryApi }) {
  const [pick, setPick] = useState('');
  const chosen = carry?.from.find((other) => other.id === pick) ?? carry?.from[0];
  const set = (id: string, text: string | null) => onChange({ ...chat, earlier: text === null ? chat.earlier.filter((entry) => entry.id !== id) : chat.earlier.map((entry) => (entry.id === id ? { ...entry, text } : entry)), updatedAt: Date.now() });
  return (
    <section className="group" aria-label="Before this chat">
      <h3>Before this chat</h3>
      <p className="hint">What {charName} remembers from other chats with you: each one's chapters and how it ended, sent first in the story so far. Bringing one in also copies its journal, diary and feelings.</p>
      {chat.earlier.map((entry) => (
        <div key={entry.id} className="card">
          <b>{entry.title}</b>
          <textarea className="input" aria-label={entry.title} rows={4} value={entry.text} onChange={(event) => set(entry.id, event.target.value)} />
          <button type="button" className="link danger" onClick={() => set(entry.id, null)}>Remove</button>
        </div>
      ))}
      {carry && carry.from.length > 0 ? (
        <div className="row">
          <label className="field grow"><span>Another chat with {charName}</span>
            <select value={chosen?.id ?? ''} onChange={(event) => setPick(event.target.value)}>
              {carry.from.map((other) => <option key={other.id} value={other.id}>{new Date(other.updatedAt).toLocaleDateString()} · {other.messages.length} messages{other.userName !== chat.userName ? ` · as ${other.userName}` : ''}</option>)}
            </select>
          </label>
          <button type="button" className="btn small" style={{ alignSelf: 'flex-end' }} disabled={carry.busy || !chosen} onClick={() => chosen && carry.bring(chosen)}>{carry.busy ? 'Bringing it in…' : 'Bring it in'}</button>
        </div>
      ) : <p className="hint">No other chats with {charName} to bring in.</p>}
    </section>
  );
}
