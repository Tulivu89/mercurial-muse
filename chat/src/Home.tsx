// The curated Chat collection and explicit new-conversation setup. World NPCs stay in the picker.
import { useEffect, useState } from 'react';
import { CollectionView, type CollectionViewProps } from './CollectionView';
import { Sheet } from '../../kit/src/Sheet';
import {
  RESPONSE_LENGTHS, STYLES, STYLE_HINTS, STYLE_NAMES, newChat, responseLengthName, setClockMode, hasSchedule, livesIn, type Chat, type NewChat,
} from '../../core/chat/index.js';
import { RELATIONSHIPS, type StoryRecord, type World } from '../../core/records/index.js';
import { newId } from '../../kit/src/util';

export type Status = { text: string; bad?: boolean } | null;
export interface Cast { world: World; record: StoryRecord }

export const castOf = (worlds: World[]): Cast[] => worlds.flatMap((world) => world.records.filter((record) => record.kind === 'character').map((record) => ({ world, record })));
const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export function Home({ worlds, chats, portraits, status, userName, persona = '', startWith = null, onStartWithDone, onOpen, onStart, onImport, onRetry, ...collectionProps }: Omit<CollectionViewProps, 'onNewChat'> & {
  status: Status; userName: string; onStart: (chat: Chat) => void;
  // Your usual persona, as "worldId:recordId": who a new chat starts as.
  persona?: string;
  startWith?: { worldId: string; recordId: string } | null;
  onStartWithDone?: (found: boolean) => void; onRetry?: () => void;
}) {
  const [starting, setStarting] = useState<Cast | null>(null);
  useEffect(() => {
    if (!startWith || worlds === null) return;
    const world = worlds.find((entry) => entry.id === startWith.worldId);
    const record = world?.records.find((entry) => entry.id === startWith.recordId && entry.kind === 'character');
    if (world && record) setStarting({ world, record });
    onStartWithDone?.(Boolean(world && record));
  }, [startWith?.worldId, startWith?.recordId, worlds === null]);
  return <>
    {status && <p className={`status${status.bad ? ' bad' : ''}`} style={{ margin: '16px 28px' }} role="status">{status.text}{onRetry && <button type="button" className="btn quiet" onClick={onRetry}>Retry library</button>}</p>}
    <CollectionView worlds={worlds} chats={chats} portraits={portraits} onOpen={onOpen} onNewChat={setStarting} onImport={onImport} {...collectionProps} />
    {starting && worlds && <NewChatSheet cast={starting} worlds={worlds} userName={userName} persona={persona} onCancel={() => setStarting(null)} onStart={(chat) => { setStarting(null); onStart(chat); }} />}
  </>;
}

// A new chat asks what CharacterRoom's chat settings ask: persona, scenario, relationship, style,
// response length and which greeting.
function NewChatSheet({ cast, worlds, userName, persona, onCancel, onStart }: { cast: Cast; worlds: World[]; userName: string; persona: string; onCancel: () => void; onStart: (chat: Chat) => void }) {
  const { world, record } = cast;
  // This character's own world first, then the rest: a persona made once serves every chat.
  const ordered = [world, ...worlds.filter((other) => other.id !== world.id)];
  const of = (kind: 'persona' | 'scenario') => ordered.flatMap((entry) => entry.records.filter((candidate) => candidate.kind === kind).map((candidate) => ({ world: entry, record: candidate })));
  const personas = of('persona');
  const scenarios = of('scenario');
  // Her own card's scenario, else the place in her world where her schedule puts her, else her
  // world's only scenario. Without one she doesn't know where she is or who else lives there.
  const home = scenarios.filter((entry) => entry.world.id === world.id);
  const own = home.find((entry) => entry.record.name === `${record.name}: scenario`)
    ?? home.find((entry) => livesIn(record, entry.record))
    ?? (home.length === 1 ? home[0] : undefined);

  // Your usual persona, if you have set one; else the first one this character's world has.
  const usual = personas.find((entry) => `${entry.world.id}:${entry.record.id}` === persona);
  const [personaId, setPersonaId] = useState((usual ?? personas[0])?.record.id ?? '');
  const [name, setName] = useState(userName);
  const [scenarioId, setScenarioId] = useState(own?.record.id ?? '');
  // The card's own defaults, where it has them.
  const defaults = record.chatDefaults;
  const among = <T extends string>(list: readonly T[], value: string | undefined, fallback: T): T => (list.includes(value as T) ? value as T : fallback);
  const [relationship, setRelationship] = useState<Chat['relationship']>(among(RELATIONSHIPS, defaults?.relationship, 'stranger'));
  const [style, setStyle] = useState<Chat['style']>(among(STYLES, defaults?.style, 'roleplay'));
  const [responseLength, setResponseLength] = useState<Chat['responseLength']>(among(RESPONSE_LENGTHS, defaults?.responseLength, 'unspecified'));
  const scheduled = hasSchedule(record.schedule);
  const [storyTime, setStoryTime] = useState(false);
  const [greetingId, setGreetingId] = useState(record.greetings[0]?.id ?? '');

  const start = () => {
    const greeting = record.greetings.find((entry) => entry.id === greetingId) ?? null;
    const input: NewChat = {
      id: newId(), worldId: world.id, characterId: record.id, characterName: record.name,
      personaId: personaId || null, scenarioId: scenarioId || null,
      userName: personas.find((entry) => entry.record.id === personaId)?.record.name ?? (name.trim() || 'User'),
      relationship, style, responseLength, greeting,
    };
    const chat = newChat(input, newId, Date.now());
    // Story time starts at the device's hour, and the greeting is stamped with it.
    if (!storyTime) { onStart(chat); return; }
    const clock = setClockMode(chat.clock, 'story', Date.now());
    onStart({ ...chat, clock, messages: chat.messages.map((message) => ({ ...message, clock: clock.storyMs })) });
  };

  return (
    <Sheet title={`New chat with ${record.name}`} onClose={onCancel}>
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
      <p className="hint">Personas are made and kept under <a href="#/you" onClick={onCancel}>You</a>.</p>
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
      {scheduled && (
        <label className="checks"><input type="checkbox" checked={storyTime} onChange={(event) => setStoryTime(event.target.checked)} /> Keep story time, so {record.name}'s schedule is live. You can change this later under Time.</label>
      )}
      <div className="row">
        <button type="button" className="btn primary" onClick={start}>Start the chat</button>
        <button type="button" className="btn quiet" onClick={onCancel}>Cancel</button>
      </div>
    </Sheet>
  );
}
