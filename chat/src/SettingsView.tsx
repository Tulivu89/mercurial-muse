// Settings: the connection (the site's, shared with the adventure), the model, the context
// window, display, each character's portraits, and files.
import { IMAGE_TYPES, MediaImage, animationSlot, posterSlot } from '../../kit/src/media';
import { useState, type ChangeEvent } from 'react';
import { AVATAR_SLOT, EMOTIONS, PROFILE_NAMES, PROMPT_PARTS, SETTINGS_EXPORT_FORMAT, XIALONG, partText, profileFor, resolvePortrait, samplersFor, type PartId, type PromptSetup, type Thinking } from '../../core/chat/index.js';
import { downloadJson } from '../../kit/src/util';
import { ConnectForm, ModelFields } from '../../kit/src/Connect';
import type { Connection } from '../../kit/src/connection';
import { THEME_NAMES, type Theme } from '../../kit/src/theme';
import { LOOK_NAMES, type LookChoice } from '../../kit/src/look';
import { castOf, type Status } from './Home';
import { AUTO_CAP, contextTokensFor, type Layout, type Settings, type TextSize } from './settings';
import { portraitOwner, type PortraitSet } from './store';
import type { World } from '../../core/records/index.js';

export function SettingsView({ connection, onConnection, settings, onSettings, theme, onTheme, look, onLook, worlds, portraits, onPortrait, onBackup, onRestore, onImportChat, status }: {
  connection: Connection;
  onConnection: (connection: Connection) => void;
  settings: Settings;
  onSettings: (settings: Settings) => void;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  look: LookChoice;
  onLook: (look: LookChoice) => void;
  worlds: World[];
  portraits: Record<string, PortraitSet>;
  onPortrait: (owner: string, slot: string, file: File | null) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  onImportChat: (file: File) => void;
  status: Status;
}) {
  const cast = castOf(worlds);
  const [owner, setOwner] = useState(cast[0] ? portraitOwner(cast[0].world.id, cast[0].record.id) : '');
  const set = portraits[owner] ?? {};
  const filled = Object.keys(set);
  const profile = profileFor(connection.model);
  const size = contextTokensFor(settings, connection);
  const file = (handler: (file: File) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (picked) handler(picked);
  };
  const number = (value: string, fallback: number) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; };

  return (
    <main className="home settings">
      <h1>Settings</h1>
      {status && <p className={`status${status.bad ? ' bad' : ''}`} role="status">{status.text}</p>}

      <section className="card" aria-label="Connection">
        <h2>Connection</h2>
        <p className="hint">One connection for the whole site: connect here and the adventure is connected too.</p>
        <ConnectForm connection={connection} onChange={onConnection} />
        {connection.connected && <ModelFields connection={connection} onChange={onConnection} />}
        {connection.connected && (
          <p className="hint">
            {profile === 'aetherroom'
              ? `${connection.model} gets the AetherRoom context, exactly as CharacterRoom sends it, as chat messages with CharacterRoom's own sampling (temperature ${XIALONG.temperature}, top-p ${XIALONG.top_p}, top-k ${XIALONG.top_k}).`
              : `${connection.model || 'This model'} gets the ${PROFILE_NAMES.general} context: rules, character, persona, scenario and examples first, then the journal, the chat and the moment.`}
          </p>
        )}
      </section>

      <section className="card" aria-label="Context">
        <h2>Context</h2>
        <div className="row">
          <label className="field grow">
            <span>Context window, in tokens</span>
            <input type="number" min={0} step={1024} value={settings.contextTokens || ''} placeholder={`Sized to the model (${size.toLocaleString()})`} onChange={(event) => onSettings({ ...settings, contextTokens: Math.max(0, Math.round(number(event.target.value, 0))) })} />
          </label>
          <label className="field grow">
            <span>Longest reply, in tokens</span>
            <input type="number" min={64} max={8192} step={50} value={settings.replyTokens} onChange={(event) => onSettings({ ...settings, replyTokens: Math.min(8192, Math.max(64, Math.round(number(event.target.value, 1000)))) })} />
          </label>
          <label className="field grow">
            <span>Temperature</span>
            <input type="number" min={0} max={2} step={0.05} value={settings.temperature} disabled={profile === 'aetherroom'} onChange={(event) => onSettings({ ...settings, temperature: Math.min(2, Math.max(0, number(event.target.value, 0.8))) })} />
          </label>
        </div>
        <p className="hint">
          Left empty, the window is sized to the model: Xialong's own {XIALONG.contextTokens.toLocaleString()}, or what the provider lists, up to {AUTO_CAP.toLocaleString()}. When a chat outgrows it, the oldest messages leave a piece at a time, so the start of the context stays the same between cuts. A thinking model spends part of the reply allowance thinking; give it more.
        </p>
      </section>

      <section className="card" aria-label="Replies">
        <h2>Replies</h2>
        <label className="check"><input type="checkbox" checked={settings.autoContinue} onChange={(event) => onSettings({ ...settings, autoContinue: event.target.checked })} /> Carry on a reply that reaches its length limit, up to twice, without asking</label>
        <label className="check"><input type="checkbox" checked={settings.trimCut} onChange={(event) => onSettings({ ...settings, trimCut: event.target.checked })} /> Trim the half sentence off a reply that is still cut off</label>
        <label className="check"><input type="checkbox" checked={settings.emotions === 'auto'} onChange={(event) => onSettings({ ...settings, emotions: event.target.checked ? 'auto' : 'off' })} /> Pick each reply's emotion for portraits and moods</label>
        <p className="hint">
          Models other than Xialong write no emotion line. Where a character has emotion portraits, or a chat keeps moods, a short second request after each reply picks the emotion. It costs a few tokens. Xialong writes its own, as in CharacterRoom.
        </p>
      </section>

      <PromptCard setup={settings.prompt} onChange={(prompt) => onSettings({ ...settings, prompt })} aetherRoom={profile === 'aetherroom'} />

      <section className="card" aria-label="Display">
        <h2>Display</h2>
        <div className="row">
          <label className="field grow"><span>Paper or night</span>
            <select value={theme} onChange={(event) => onTheme(event.target.value as Theme)}>{(Object.keys(THEME_NAMES) as Theme[]).map((option) => <option key={option} value={option}>{THEME_NAMES[option]}</option>)}</select>
          </label>
          <label className="field grow"><span>Look</span>
            <select value={look} onChange={(event) => onLook(event.target.value as LookChoice)}>{(Object.keys(LOOK_NAMES) as LookChoice[]).map((option) => <option key={option} value={option}>{LOOK_NAMES[option]}</option>)}</select>
          </label>
          <label className="field grow"><span>Text size</span>
            <select value={settings.textSize} onChange={(event) => onSettings({ ...settings, textSize: event.target.value as TextSize })}>
              <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
            </select>
          </label>
          <label className="field grow"><span>Messages as</span>
            <select value={settings.layout} onChange={(event) => onSettings({ ...settings, layout: event.target.value as Layout })}>
              <option value="bubbles">Bubbles</option><option value="page">A page: no bubbles, full width</option>
            </select>
          </label>
        </div>
        <label className="checks"><input type="checkbox" checked={settings.rail} onChange={(event) => onSettings({ ...settings, rail: event.target.checked })} /> On a wide screen, show the portrait in a column beside the chat</label>
      </section>

      <section className="card" aria-label="Portraits">
        <h2>Portraits</h2>
        {cast.length === 0 ? <p className="hint">No characters yet.</p> : (
          <>
            <label className="field"><span>Character</span>
              <select value={owner} onChange={(event) => setOwner(event.target.value)}>
                {cast.map(({ world, record }) => <option key={portraitOwner(world.id, record.id)} value={portraitOwner(world.id, record.id)}>{record.name} ({world.name})</option>)}
              </select>
            </label>
            <p className="hint">An avatar and up to 24 emotions. A partial set works: an empty slot shows its nearest filled neighbour, then neutral, then the avatar.</p>
            <div className="slots">
              {[AVATAR_SLOT, ...EMOTIONS].map((slot) => {
                const stand = slot === AVATAR_SLOT ? (set[slot] ? slot : null) : resolvePortrait(slot, filled);
                const data = stand ? set[stand] : undefined;
                return (
                  <div key={slot} className={`slot${set[slot] ? ' filled' : ''}`}>
                    <span className="file-btn slot-face">
                      {data ? <MediaImage src={data} poster={stand ? set[posterSlot(stand)] : undefined} animated={stand ? set[animationSlot(stand)] === 'true' : false} alt="" /> : <span aria-hidden="true">+</span>}
                      <input type="file" accept={IMAGE_TYPES} aria-label={`Upload ${slot}`} onChange={file((picked) => onPortrait(owner, slot, picked))} />
                    </span>
                    <b>{slot}</b>
                    {set[slot]
                      ? <button type="button" className="link danger" onClick={() => onPortrait(owner, slot, null)} aria-label={`Remove ${slot}`}>Remove</button>
                      : <span className="hint">{stand && stand !== slot ? `shows ${stand}` : 'empty'}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="card" aria-label="Files">
        <h2>Files</h2>
        <p className="hint">Chats, worlds and portraits are kept in this browser only. Back up everything includes the Chat collection, original images, chats, lives and worlds. Adventure saves and Studio authoring talks have their own exports; restoring it replaces anything with the same id.</p>
        <div className="row">
          <button type="button" className="btn" onClick={onBackup}>Back up everything</button>
          <span className="btn quiet file-btn">Restore a backup<input type="file" accept="application/json,.json" aria-label="Restore a backup" onChange={file(onRestore)} /></span>
          <span className="btn quiet file-btn">Import a chat<input type="file" accept="application/json,.json,.jsonl" aria-label="Import a chat" title="A chat saved here, or a SillyTavern chat file (.jsonl) with a character you have" onChange={file(onImportChat)} /></span>
          <button type="button" className="btn quiet" onClick={() => downloadJson('chat-settings.json', {
            format: SETTINGS_EXPORT_FORMAT, exportedAt: Date.now(),
            request: { provider: connection.provider, model: connection.model, mode: connection.mode, format: connection.format, profile: profileFor(connection.model), contextTokens: contextTokensFor(settings, connection), replyTokens: settings.replyTokens, samplers: samplersFor(connection.model, settings.temperature) },
            chat: settings,
          })}>Save settings</button>
        </div>
        <p className="hint">Save settings writes the model, context size and samplers in a file, never your key. A chat&rsquo;s own Save for a test, under What was sent, puts them in one file with the chat and what it was sent.</p>
      </section>
    </main>
  );
}

// The General prompt's parts, in the order they're sent, each to read, turn off or rewrite.
function PromptCard({ setup, onChange, aetherRoom }: { setup: PromptSetup; onChange: (setup: PromptSetup) => void; aetherRoom: boolean }) {
  const toggle = (id: PartId, on: boolean) => onChange({ ...setup, off: on ? setup.off.filter((entry) => entry !== id) : [...setup.off, id] });
  const write = (id: PartId, text: string) => onChange({ ...setup, texts: { ...setup.texts, [id]: text } });
  const putBack = (id: PartId) => { const { [id]: _was, ...texts } = setup.texts; onChange({ ...setup, texts }); };
  return (
    <section className="card" aria-label="Prompt">
      <h2>Prompt</h2>
      <p className="hint">
        What every model but Xialong is told before the character, in this order. {'{{char}}'} and {'{{user}}'} become the names. Turn a part off, or rewrite it; Put back returns to the site's own words.
        {aetherRoom && ' Xialong, connected now, gets CharacterRoom\'s own prompt instead.'}
      </p>
      {PROMPT_PARTS.map((part) => {
        const on = !setup.off.includes(part.id);
        return (
          <div key={part.id} className="prompt-part">
            <label className="check"><input type="checkbox" checked={on} onChange={(event) => toggle(part.id, event.target.checked)} /> {part.name}</label>
            {on && (
              <>
                <textarea className="input" rows={part.id === 'format' || part.id === 'content' ? 4 : 3} maxLength={4000} value={partText(setup, part.id)} onChange={(event) => write(part.id, event.target.value)} aria-label={part.name} />
                {setup.texts[part.id] !== undefined && <button type="button" className="btn small quiet" onClick={() => putBack(part.id)}>Put back</button>}
              </>
            )}
          </div>
        );
      })}
      <label className="check"><input type="checkbox" checked={setup.cardPrompt} onChange={(event) => onChange({ ...setup, cardPrompt: event.target.checked })} /> The card's own prompt: send a character card's system prompt and post-history line, where it has them</label>
      <label className="field">
        <span>After every turn</span>
        <textarea className="input" rows={2} maxLength={2000} value={setup.after} placeholder="A line added to the note with every turn, last. Empty: nothing." onChange={(event) => onChange({ ...setup, after: event.target.value })} />
      </label>
      <label className="field">
        <span>Thinking</span>
        <select value={setup.thinking} onChange={(event) => onChange({ ...setup, thinking: event.target.value as Thinking })}>
          <option value="default">The model's own</option>
          <option value="low">Less</option>
          <option value="off">As little as it allows</option>
        </select>
      </label>
      <p className="hint">Thinking is set for Gemini through Google AI Studio. Less thinking is quicker and leaves more of the allowance for the reply. If a model refuses the setting, put it back to the model's own.</p>
    </section>
  );
}
