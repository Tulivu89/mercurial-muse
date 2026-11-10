// The panels under the hood of a chat: what was sent, what is in context, what the character
// remembers, the clock, and this chat's own settings.
import { useState } from 'react';
import {
  CLOCK_STEPS, PLAN_TURNS, PROFILE_NAMES, RESPONSE_LENGTHS, SIDE_NAMES, STYLES, STYLE_HINTS, STYLE_NAMES, addPlan, clockTracks, exportChat, formatDate,
  formatMinutes, formatStamp, hasSchedule, levelReaches, lorePool, minutesOfDay, moveClock, nextMorningMs, pinKey, responseLengthName, roundToHalfHour,
  setClockMode, setJournalEntry, setMemory, setPlan, setWhyText, statusText, storyActive, timeOfDayMs,
  type Built, type Chat, type MemoryKind, type Scene, type SideEntry, type SideKind,
} from '../../core/chat/index.js';
import { BOND_CONDITIONS, KIND_NAMES, RELATIONSHIPS, type World } from '../../core/records/index.js';
import { KeysField } from '../../kit/src/Fields';
import { downloadJson, fileSafe, newId } from '../../kit/src/util';
import type { Sent } from './store';

const WHY: Record<string, string> = { always: 'Always', here: 'Here', named: 'Named', when: 'When', line: 'Line' };
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
type Change = (chat: Chat) => void;

// The exact request for the last reply, and what came back. This is how a bad reply gets debugged.
export function SentPanel({ sent }: { sent: Sent | null }) {
  if (!sent) return <p className="empty">Nothing has been sent in this chat yet. After the next reply, the whole request shows here.</p>;
  const request = sent.request as { model?: string; messages?: { role: string; content: string }[]; prefill?: string } & Record<string, unknown>;
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

export function ContextPanel({ preview, budget, gone }: { preview: Built | null; budget: number; gone: boolean }) {
  return (
    <>
      <p className="hint">What the next reply would be sent, by reach. Type in the message box and Named parts come in as their keys appear.</p>
      {!preview && <p className="empty">{gone ? 'This chat\'s world is gone.' : 'Working it out…'}</p>}
      {preview && (
        <>
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
  preview: (kind: SideKind) => Promise<{ kind: SideKind; built: Built; maxTokens: number } | string>;
  write: (ready: { kind: SideKind; built: Built; maxTokens: number }, onText: (text: string) => void) => Promise<SideEntry | string>;
}

export function MemoryPanel({ chat, onChange, charName, userName, model, side, onRemember }: {
  chat: Chat; onChange: Change; charName: string; userName: string; model: string; side: SideApi; onRemember: () => void;
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

      <section className="group" aria-label="Journal">
        <div className="row between"><h3>Journal</h3><button type="button" className="btn small quiet" onClick={onRemember}>Add an entry</button></div>
        <p className="hint">What {charName} knows about {userName}. Active entries go with every reply. Remember this, on any message, adds one.</p>
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

export function DetailsPanel({ chat, onChange, scene, world, charName, onDelete }: { chat: Chat; onChange: Change; scene: Scene | null; world: World | null; charName: string; onDelete: () => void }) {
  const lore = world ? lorePool(world) : [];
  const owners = scene ? [scene.character, scene.persona, scene.scenario].filter(Boolean) : [];
  const tier = (lock: string | null) => BOND_CONDITIONS.find((condition) => condition.id === lock)?.tier;
  return (
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
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => downloadJson(`${fileSafe(charName)}.chat.json`, exportChat(chat, Date.now()))}>Export this chat</button>
        <button type="button" className="btn small danger" onClick={onDelete}>Delete this chat</button>
      </div>
    </>
  );
}
