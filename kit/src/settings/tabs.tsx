// The Settings page's tabs. Each shows one part's settings. On its own side a tab is live (the side
// hands in its state); on another side it reads and writes this browser's storage, and that part
// picks the change up the next time it opens.
import { useState, type ReactNode } from 'react';
import { PROFILE_NAMES, PROMPT_PARTS, XIALONG, partText, profileFor, type PartId, type PromptSetup, type Thinking } from '../../../core/chat/index.js';
import { ConnectForm, ModelFields } from '../Connect';
import type { Connection } from '../connection';
import { LOOK_NAMES, type LookChoice } from '../look';
import { THEME_NAMES, type Theme } from '../theme';
import { AUTO_CAP, contextTokensFor, readSettings, writeSettings, type Layout, type Settings as ChatSettings, type TextSize } from './chat-settings';
import { readAdventurePrefs, writeAdventurePrefs, type AdventurePrefs } from './adventure-prefs';
import { readHelperPrefs, saveHelperPrefs, type HelperPrefs } from './helper-prefs';
import { START_NAMES, readStart, saveStart, type StartPlace } from './start';
import { Choice, Field, Group, Toggle } from './parts';

const numberOr = (value: string, fallback: number) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; };

// --- General: how the whole site looks, and where it opens.

export function GeneralTab({ theme, onTheme, look, onLook }: { theme: Theme; onTheme: (theme: Theme) => void; look: LookChoice; onLook: (look: LookChoice) => void }) {
  const [start, setStart] = useState<StartPlace>(readStart);
  return (
    <>
      <Group title="Look">
        <Choice<Theme> label="Paper or night" value={theme} options={[['paper', THEME_NAMES.paper], ['night', THEME_NAMES.night], ['auto', THEME_NAMES.auto]]} onPick={onTheme} hint="Paper by day, ink by night. One choice for the whole site." />
        <Field label="Style" hint="A skin over paper and ink. A world can choose one of its own, such as Live Feed for HOG Wild: follow the world to wear it there, or pick one look for everywhere.">
          <select value={look} onChange={(event) => onLook(event.target.value as LookChoice)}>{(Object.keys(LOOK_NAMES) as LookChoice[]).map((option) => <option key={option} value={option}>{LOOK_NAMES[option]}</option>)}</select>
        </Field>
      </Group>
      <Group title="Start here">
        <Field label="Opening the site takes you to" hint="Coming from outside the site, to its bare address. The Inkwyrm name at the top always reaches the front page.">
          <select value={start} onChange={(event) => { const place = event.target.value as StartPlace; saveStart(place); setStart(place); }}>
            {(Object.keys(START_NAMES) as StartPlace[]).map((place) => <option key={place} value={place}>{START_NAMES[place]}</option>)}
          </select>
        </Field>
      </Group>
    </>
  );
}

// --- Model: the one connection for the whole site.

export function ModelTab({ connection, onConnection }: { connection: Connection; onConnection: (connection: Connection) => void }) {
  return (
    <Group title="Your model" note="One key for Chat, the adventure and the Studio. It goes with each request and the site's server never stores it; it stays on this device only if you ask.">
      <ConnectForm connection={connection} onChange={onConnection} />
      {connection.connected && <ModelFields connection={connection} onChange={onConnection} />}
    </Group>
  );
}

// --- Chat.

function useStored<T>(given: { value: T; onChange: (value: T) => void } | undefined, read: () => T, write: (value: T) => void): [T, (value: T) => void] {
  const [own, setOwn] = useState<T>(read);
  if (given) return [given.value, given.onChange];
  return [own, (value: T) => { write(value); setOwn(value); }];
}

export function ChatTab({ connection, live, extra }: { connection: Connection; live?: { settings: ChatSettings; onSettings: (settings: ChatSettings) => void }; extra?: ReactNode }) {
  const [settings, onSettings] = useStored(live && { value: live.settings, onChange: live.onSettings }, readSettings, writeSettings);
  const profile = profileFor(connection.model);
  const size = contextTokensFor(settings, connection);
  return (
    <>
      {connection.connected && (
        <p className="ks-note">
          {profile === 'aetherroom'
            ? `${connection.model} gets the Xialong context, as CharacterRoom built it, with its own sampling (temperature ${XIALONG.temperature}, top-p ${XIALONG.top_p}, top-k ${XIALONG.top_k}).`
            : `${connection.model || 'This model'} gets the ${PROFILE_NAMES.general} context: rules, character, persona, scenario and examples first, then the journal, the chat and the moment.`}
        </p>
      )}
      <Group title="Context">
        <div className="ks-row">
          <Field label="Context window, in tokens">
            <input type="number" min={0} step={1024} value={settings.contextTokens || ''} placeholder={`Sized to the model (${size.toLocaleString('en-US')})`} onChange={(event) => onSettings({ ...settings, contextTokens: Math.max(0, Math.round(numberOr(event.target.value, 0))) })} />
          </Field>
          <Field label="Longest reply, in tokens">
            <input type="number" min={64} max={8192} step={50} value={settings.replyTokens} onChange={(event) => onSettings({ ...settings, replyTokens: Math.min(8192, Math.max(64, Math.round(numberOr(event.target.value, 1000)))) })} />
          </Field>
          <Field label="Temperature">
            <input type="number" min={0} max={2} step={0.05} value={settings.temperature} disabled={profile === 'aetherroom'} onChange={(event) => onSettings({ ...settings, temperature: Math.min(2, Math.max(0, numberOr(event.target.value, 0.8))) })} />
          </Field>
        </div>
        <p className="ks-note">Left empty, the window is sized to the model: Xialong&rsquo;s own {XIALONG.contextTokens.toLocaleString('en-US')}, or what the provider lists, up to {AUTO_CAP.toLocaleString('en-US')}. When a chat outgrows it, the oldest messages leave a piece at a time, so the start of the context stays the same between cuts. A thinking model spends part of the reply allowance thinking; give it more.</p>
      </Group>
      <Group title="Replies">
        <Toggle label="Carry on a reply that reaches its length limit" hint="Up to twice, without asking." on={settings.autoContinue} onToggle={(autoContinue) => onSettings({ ...settings, autoContinue })} />
        <Toggle label="Trim the half sentence off a reply that is still cut off" on={settings.trimCut} onToggle={(trimCut) => onSettings({ ...settings, trimCut })} />
        <Toggle label="Read each new reply aloud" hint="In the character's voice, set in a chat's details." on={settings.readAloud} onToggle={(readAloud) => onSettings({ ...settings, readAloud })} />
        <Toggle label="Write older messages up as chapters" hint="When they leave what the model is sent." on={settings.chapters} onToggle={(chapters) => onSettings({ ...settings, chapters })} />
        {settings.chapters && (
          <Choice<ChatSettings['chapterLength']> label="Chapter length" value={settings.chapterLength} options={[['short', 'Short'], ['usual', 'The usual'], ['full', 'Full']]} onPick={(chapterLength) => onSettings({ ...settings, chapterLength })} hint="Short is 2 or 3 sentences, the usual 3 to 6, full 6 to 10." />
        )}
        <Toggle label="Pick each reply's emotion for portraits and moods" hint="Models other than Xialong write no emotion line. Where a character has emotion portraits, or a chat keeps moods, a short second request after each reply picks one. It costs a few tokens." on={settings.emotions === 'auto'} onToggle={(on) => onSettings({ ...settings, emotions: on ? 'auto' : 'off' })} />
      </Group>
      <PromptGroup setup={settings.prompt} onChange={(prompt) => onSettings({ ...settings, prompt })} xialong={profile === 'aetherroom'} />
      <Group title="Reading">
        <div className="ks-row">
          <Field label="Text size">
            <select value={settings.textSize} onChange={(event) => onSettings({ ...settings, textSize: event.target.value as TextSize })}>
              <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
            </select>
          </Field>
          <Field label="Messages as">
            <select value={settings.layout} onChange={(event) => onSettings({ ...settings, layout: event.target.value as Layout })}>
              <option value="bubbles">Bubbles</option><option value="page">A page: no bubbles, full width</option>
            </select>
          </Field>
        </div>
        <Toggle label="On a wide screen, show the portrait in a column beside the chat" on={settings.rail} onToggle={(rail) => onSettings({ ...settings, rail })} />
      </Group>
      {extra}
    </>
  );
}

// The General prompt's parts, in the order they're sent, each to read, turn off or rewrite.
function PromptGroup({ setup, onChange, xialong }: { setup: PromptSetup; onChange: (setup: PromptSetup) => void; xialong: boolean }) {
  const toggle = (id: PartId, on: boolean) => onChange({ ...setup, off: on ? setup.off.filter((entry) => entry !== id) : [...setup.off, id] });
  const write = (id: PartId, text: string) => onChange({ ...setup, texts: { ...setup.texts, [id]: text } });
  const putBack = (id: PartId) => { const { [id]: _was, ...texts } = setup.texts; onChange({ ...setup, texts }); };
  return (
    <Group title="Prompt" note={<>What every model but Xialong is told before the character, in this order. {'{{char}}'} and {'{{user}}'} become the names. Turn a part off, or rewrite it; Put back returns to the site&rsquo;s own words.{xialong && ' Xialong, connected now, gets its own prompt instead.'}</>}>
      {PROMPT_PARTS.map((part) => {
        const on = !setup.off.includes(part.id);
        return (
          <div key={part.id} className="ks-prompt-part">
            <label className="ks-check"><input type="checkbox" checked={on} onChange={(event) => toggle(part.id, event.target.checked)} /> {part.name}</label>
            {on && (
              <>
                <textarea className="ks-input" rows={part.id === 'format' || part.id === 'content' ? 4 : 3} maxLength={4000} value={partText(setup, part.id)} onChange={(event) => write(part.id, event.target.value)} aria-label={part.name} />
                {setup.texts[part.id] !== undefined && <div><button type="button" className="ks-btn small quiet" onClick={() => putBack(part.id)}>Put back</button></div>}
              </>
            )}
          </div>
        );
      })}
      <Toggle label="The card's own prompt" hint="Send a character card's system prompt and post-history line, where it has them." on={setup.cardPrompt} onToggle={(cardPrompt) => onChange({ ...setup, cardPrompt })} />
      <Field label="After every turn">
        <textarea rows={2} maxLength={2000} value={setup.after} placeholder="A line added to the note with every turn, last. Empty: nothing." onChange={(event) => onChange({ ...setup, after: event.target.value })} />
      </Field>
      <Field label="Thinking" hint="Set for Gemini through Google AI Studio. Less thinking is quicker and leaves more of the allowance for the reply. If a model refuses the setting, put it back to the model's own.">
        <select value={setup.thinking} onChange={(event) => onChange({ ...setup, thinking: event.target.value as Thinking })}>
          <option value="default">The model's own</option>
          <option value="low">Less</option>
          <option value="off">As little as it allows</option>
        </select>
      </Field>
    </Group>
  );
}

// --- The adventure.

// A model picked from the connected provider's list, or typed when it lists none.
function ModelChoice({ label, value, connection, sameAs, onPick, hint }: { label: string; value: string; connection: Connection; sameAs: string; onPick: (model: string) => void; hint?: ReactNode }) {
  const others = connection.models.filter((model) => model !== connection.model);
  return (
    <Field label={label} hint={hint}>
      {others.length ? (
        <select value={others.includes(value) ? value : ''} onChange={(event) => onPick(event.target.value)}>
          <option value="">{sameAs}{connection.model ? ` (${connection.model})` : ''}</option>
          {others.map((model) => <option key={model} value={model}>{model}</option>)}
        </select>
      ) : <input className="mono" value={value} placeholder={connection.model ? `${sameAs} (${connection.model})` : sameAs} onChange={(event) => onPick(event.target.value.trim())} />}
    </Field>
  );
}

export function AdventureTab({ connection, live, extra }: { connection: Connection; live?: { prefs: AdventurePrefs; onPrefs: (changes: Partial<AdventurePrefs>) => void }; extra?: ReactNode }) {
  const [own, setOwn] = useState<AdventurePrefs>(readAdventurePrefs);
  const prefs = live?.prefs ?? own;
  const change = (changes: Partial<AdventurePrefs>) => {
    if (live) { live.onPrefs(changes); return; }
    const next = { ...own, ...changes };
    writeAdventurePrefs(next);
    setOwn(next);
  };
  return (
    <>
      {extra}
      <Group title="Reading">
        <Choice label="Text size" value={prefs.textSize} options={[['small', 'Smaller'], ['standard', 'Standard'], ['large', 'Larger']]} onPick={(textSize) => change({ textSize })} />
        <Choice label="Story typeface" value={prefs.storyFace} options={[['serif', 'Book serif'], ['sans', 'Plain sans']]} onPick={(storyFace) => change({ storyFace })} />
      </Group>
      <Group title="Checks and suggestions">
        <Toggle label="Propose a check from what you write" hint="When your turn tries something uncertain, the suggestions model names a check from what's here. You roll it, change it or set it aside; it never rolls by itself." on={prefs.evaluator} onToggle={(evaluator) => change({ evaluator })} />
        <ModelChoice label="Journal suggestions and checks written by" value={prefs.helperModel} connection={connection} sameAs="The narrator's model" onPick={(helperModel) => change({ helperModel })} hint="A small quick model is enough. It uses the same provider and key as the narrator." />
      </Group>
      <Group title="Testing">
        <Toggle label="Show draft markers" hint="On records the module marks unfinished." on={prefs.showDrafts} onToggle={(showDrafts) => change({ showDrafts })} />
        <Toggle label="Show numbers beside bands" on={prefs.showNumbers} onToggle={(showNumbers) => change({ showNumbers })} />
      </Group>
    </>
  );
}

// --- The Studio.

export function StudioTab({ connection, live }: { connection: Connection; live?: { helper: HelperPrefs; onHelper: (helper: HelperPrefs) => void } }) {
  const [helper, onHelper] = useStored(live && { value: live.helper, onChange: live.onHelper }, readHelperPrefs, saveHelperPrefs);
  return (
    <Group title="The Studio's helper" note="Errata drafts fields and talks through a world with your own model. Nothing it writes changes a record until you keep it.">
      <ModelChoice label="Model for drafts and Errata" value={helper.model} connection={connection} sameAs="The same as play" onPick={(model) => onHelper({ ...helper, model })} hint="A strong instruction model can help you build while a favourite story model plays. It uses the same provider and key." />
      <Toggle label="Plain voice" hint="The helper without Errata's manner." on={helper.plain} onToggle={(plain) => onHelper({ ...helper, plain })} />
    </Group>
  );
}
