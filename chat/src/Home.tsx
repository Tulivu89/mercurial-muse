// The start: recent chats on top, then every character in the Studio's worlds, and import.
import { useState, type ChangeEvent } from 'react';
import {
  RESPONSE_LENGTHS, STYLES, STYLE_HINTS, STYLE_NAMES, lastEmotion, lastLine, newChat, responseLengthName, type Chat, type NewChat,
} from '../../core/chat/index.js';
import { RELATIONSHIPS, type StoryRecord, type World } from '../../core/records/index.js';
import { Drop } from '../../kit/src/Mark';
import { clock, newId } from '../../kit/src/util';
import { Portrait } from './Portrait';
import { portraitOwner, type PortraitSet } from './store';

export type Status = { text: string; bad?: boolean } | null;
export interface Cast { world: World; record: StoryRecord }

export const castOf = (worlds: World[]): Cast[] => worlds.flatMap((world) => world.records.filter((record) => record.kind === 'character').map((record) => ({ world, record })));
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export function Home({ worlds, chats, portraits, status, userName, onOpen, onStart, onImport }: {
  worlds: World[] | null;
  chats: Chat[] | null;
  portraits: Record<string, PortraitSet>;
  status: Status;
  userName: string;
  onOpen: (id: string) => void;
  onStart: (chat: Chat) => void;
  onImport: (file: File) => void;
}) {
  const [starting, setStarting] = useState<Cast | null>(null);
  const cast = castOf(worlds ?? []);
  const now = Date.now();
  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onImport(file);
  };

  return (
    <main className="home">
      <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
        <Drop size={64} title="Inkwyrm" chat />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 260px' }}>
          <h1>Your chats</h1>
          <p className="lede">Characters who remember you. Pick one, or bring your own.</p>
        </div>
      </div>
      {status && <p className={`status${status.bad ? ' bad' : ''}`} role="status">{status.text}</p>}

      {!!chats?.length && (
        <section aria-label="Recent chats" className="recent">
          <h2>Recent</h2>
          {chats.map((chat) => (
            <button type="button" key={chat.id} className="chat-row" onClick={() => onOpen(chat.id)}>
              <Portrait name={chat.characterName} emotion={lastEmotion(chat)} set={portraits[portraitOwner(chat.worldId, chat.characterId)]} size={52} />
              <span className="chat-row-text">
                <span className="chat-row-top"><b>{chat.characterName || 'Character'}</b><time>{clock(chat.updatedAt, now)}</time></span>
                <span className="chat-row-line">{lastLine(chat) || 'No messages yet.'}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      <section aria-label="Characters" className="cast">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Characters</h2>
          <span className="btn small quiet file-btn">
            Import a character
            <input type="file" accept="application/json,.json,image/png,.png" aria-label="Import a character" onChange={pick} />
          </span>
        </div>
        {worlds === null && <p className="hint">Opening your worlds…</p>}
        {worlds !== null && cast.length === 0 && <p className="hint">No characters yet. Import a card, or make one in the Studio.</p>}
        <div className="cards">
          {cast.map(({ world, record }) => (
            <button type="button" key={`${world.id}:${record.id}`} className="char-card" onClick={() => setStarting({ world, record })}>
              <Portrait name={record.name} set={portraits[portraitOwner(world.id, record.id)]} size={64} />
              <span>
                <b>{record.name}</b>
                {record.line && <span className="line">{record.line}</span>}
                <span className="hint">{world.name}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="hint">Imports take CharacterRoom cards (contact, user and scenario) and Character Card V1, V2 and V3 files, as JSON or PNG. Characters, personas and scenarios are edited in the <a href="/studio/">Studio</a>.</p>
      </section>

      {starting && worlds && <NewChatSheet cast={starting} worlds={worlds} userName={userName} onCancel={() => setStarting(null)} onStart={(chat) => { setStarting(null); onStart(chat); }} />}
    </main>
  );
}

// A new chat asks what CharacterRoom's chat settings ask: persona, scenario, relationship, style,
// response length and which greeting.
function NewChatSheet({ cast, worlds, userName, onCancel, onStart }: { cast: Cast; worlds: World[]; userName: string; onCancel: () => void; onStart: (chat: Chat) => void }) {
  const { world, record } = cast;
  // This character's own world first, then the rest: a persona made once serves every chat.
  const ordered = [world, ...worlds.filter((other) => other.id !== world.id)];
  const of = (kind: 'persona' | 'scenario') => ordered.flatMap((entry) => entry.records.filter((candidate) => candidate.kind === kind).map((candidate) => ({ world: entry, record: candidate })));
  const personas = of('persona');
  const scenarios = of('scenario');
  const own = scenarios.find((entry) => entry.world.id === world.id && entry.record.name === `${record.name}: scenario`);

  const [personaId, setPersonaId] = useState(personas[0]?.record.id ?? '');
  const [name, setName] = useState(userName);
  const [scenarioId, setScenarioId] = useState(own?.record.id ?? '');
  const [relationship, setRelationship] = useState<Chat['relationship']>('stranger');
  const [style, setStyle] = useState<Chat['style']>('roleplay');
  const [responseLength, setResponseLength] = useState<Chat['responseLength']>('unspecified');
  const [greetingId, setGreetingId] = useState(record.greetings[0]?.id ?? '');

  const start = () => {
    const greeting = record.greetings.find((entry) => entry.id === greetingId) ?? null;
    const input: NewChat = {
      id: newId(), worldId: world.id, characterId: record.id, characterName: record.name,
      personaId: personaId || null, scenarioId: scenarioId || null,
      userName: personas.find((entry) => entry.record.id === personaId)?.record.name ?? (name.trim() || 'User'),
      relationship, style, responseLength, greeting,
    };
    onStart(newChat(input, newId, Date.now()));
  };

  return (
    <div className="sheet" role="dialog" aria-label={`New chat with ${record.name}`}>
      <h2>New chat with {record.name}</h2>
      <div className="row">
        <label className="field grow">
          <span>You are</span>
          <select value={personaId} onChange={(event) => setPersonaId(event.target.value)}>
            <option value="">Just a name</option>
            {personas.map((entry) => <option key={entry.record.id} value={entry.record.id}>{entry.record.name}{entry.world.id === world.id ? '' : ` (${entry.world.name})`}</option>)}
          </select>
        </label>
        {!personaId && (
          <label className="field grow">
            <span>Your name</span>
            <input value={name} maxLength={120} placeholder="What they call you" onChange={(event) => setName(event.target.value)} />
          </label>
        )}
      </div>
      <label className="field">
        <span>Scenario</span>
        <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>
          <option value="">None</option>
          {scenarios.map((entry) => <option key={entry.record.id} value={entry.record.id}>{entry.record.name}{entry.world.id === world.id ? '' : ` (${entry.world.name})`}</option>)}
        </select>
      </label>
      <div className="row">
        <label className="field grow"><span>Relationship</span>
          <select value={relationship} onChange={(event) => setRelationship(event.target.value as Chat['relationship'])}>{RELATIONSHIPS.map((value) => <option key={value} value={value}>{capital(value)}</option>)}</select>
        </label>
        <label className="field grow"><span>Style</span>
          <select value={style} onChange={(event) => setStyle(event.target.value as Chat['style'])}>{STYLES.map((value) => <option key={value} value={value}>{STYLE_NAMES[value]}</option>)}</select>
        </label>
        <label className="field grow"><span>Response length</span>
          <select value={responseLength} onChange={(event) => setResponseLength(event.target.value as Chat['responseLength'])}>{RESPONSE_LENGTHS.map((value) => <option key={value} value={value}>{responseLengthName(value)}</option>)}</select>
        </label>
      </div>
      <p className="hint">{STYLE_HINTS[style]}</p>
      <label className="field">
        <span>Greeting</span>
        <select value={greetingId} onChange={(event) => setGreetingId(event.target.value)}>
          {record.greetings.map((greeting, index) => <option key={greeting.id} value={greeting.id}>{`${index + 1}. ${greeting.text.replace(/\s+/g, ' ').slice(0, 70)}`}</option>)}
          <option value="">None: start with an empty chat</option>
        </select>
      </label>
      <div className="row">
        <button type="button" className="btn primary" onClick={start}>Start the chat</button>
        <button type="button" className="btn quiet" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
