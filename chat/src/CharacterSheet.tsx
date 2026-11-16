// A chat's character sheet: what opens when the header is pressed. Now is who they are this
// minute and what is in use: an outfit, a room, any set where one thing is true at a time, and
// the lore this chat carries. Home is their day in the house they live in, the same card Home
// shows, so needs and actions are one tap from the conversation. Posts is their feed. You is who
// you are in this chat.
import { useEffect, useState, type ReactNode } from 'react';
import {
  careAt, levelReaches, lifeNow, lastEmotion, lorePool, needEmotion, pinKey, setPersona, statusText, readSchedule, whereabouts,
  type Chat, type HomeRef, type Life, type Scene,
} from '../../core/chat/index.js';
import { BOND_CONDITIONS, type World } from '../../core/records/index.js';
import { Keeper, type HouseAt } from './House';
import { CloseIcon, HouseIcon } from './icons';
import { Portrait } from './Portrait';
import { Feed } from './Posts';
import type { PostApi } from './posting';
import { portraitOwner, type PortraitSet } from './store';
import type { PersonaRef } from './You';

export type SheetTab = 'now' | 'home' | 'posts' | 'you';
const TABS: Record<SheetTab, string> = { now: 'Now', home: 'Home', posts: 'Posts', you: 'You' };

export interface CharacterSheetProps {
  chat: Chat;
  onChange: (chat: Chat) => void;
  scene: Scene | null;
  world: World | null;
  charName: string;
  userName: string;
  // The portrait and the lines about them, as the chat already draws them, less the sets, which
  // this sheet shows as choices. Each thing is said once.
  about: ReactNode;
  portraits: Record<string, PortraitSet>;
  life: Life | null;
  onLife?: (life: Life) => void;
  // The house they live in, if any, and the way there.
  home: HomeRef | null;
  onHome?: (at: HouseAt) => void;
  posting?: PostApi;
  onPicture?: (owner: string, slot: string, file: File | null) => void;
  personas: PersonaRef[];
  tab?: SheetTab;
  onClose: () => void;
}

export function CharacterSheet({ chat, onChange, scene, world, charName, userName, about, portraits, life, onLife, home, onHome, posting, onPicture, personas, tab: startTab = 'now', onClose }: CharacterSheetProps) {
  const [tab, setTab] = useState<SheetTab>(startTab);
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setTick(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const [name, setName] = useState(chat.userName);
  const character = scene?.character;
  const owners = scene ? [scene.character, scene.persona, scene.scenario].filter(Boolean) : [];
  const tier = (lock: string | null) => BOND_CONDITIONS.find((condition) => condition.id === lock)?.tier;
  const lore = world ? lorePool(world) : [];
  const source = world?.id === chat.worldId && world.records.some((record) => record.id === chat.characterId);

  const now = life ? lifeNow(life, tick) : tick;
  const where = home && life ? whereabouts(home, { [life.key]: life }, tick).find((entry) => entry.record.id === chat.characterId) : undefined;
  const read = character && life ? readSchedule(character.schedule, life.relationship, now) : null;

  return (
    <aside className="sheet tall character-sheet" role="dialog" aria-label={`About ${charName}`}>
      <div className="tabs" role="tablist">
        {(Object.keys(TABS) as SheetTab[]).map((entry) => (
          <button key={entry} type="button" role="tab" aria-selected={tab === entry} className={`tab${tab === entry ? ' on' : ''}`} onClick={() => setTab(entry)}>{TABS[entry]}</button>
        ))}
        <button type="button" className="icon-btn plain" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Close"><CloseIcon /></button>
      </div>

      {tab === 'now' && (
        <>
          <div className="sheet-about">{about}</div>
          {scene && scene.picks.some((pick) => owners.find((record) => record!.id === pick.ownerId)?.sets.find((set) => set.id === pick.setId)?.members.length) && (
            <section className="group" aria-label="In use now">
              <h3>In use now</h3>
              <p className="hint">One of each is true at a time. Pick one to hold it for this chat, or let it follow {charName}&rsquo;s day.</p>
              {scene.picks.map((pick) => {
                const owner = owners.find((record) => record!.id === pick.ownerId);
                const set = owner?.sets.find((entry) => entry.id === pick.setId);
                if (!owner || !set || !set.members.length) return null;
                const key = pinKey(owner.id, set.id);
                const { [key]: _gone, ...rest } = chat.pins;
                const pinned = chat.pins[key];
                return (
                  <div key={key} className="set-pick" role="group" aria-label={`${owner.name}: ${set.title}`}>
                    <span className="set-pick-title"><b>{set.title}</b> <span className="hint">{owner.name} · {set.members.find((member) => member.id === pick.memberId)?.name ?? 'none'}{pinned ? ', held for this chat' : ''}</span></span>
                    <span className="choice-chips">
                      <button type="button" className="choice" aria-pressed={!pinned} onClick={() => onChange({ ...chat, pins: rest })}>Follow the day</button>
                      {set.members.map((member) => {
                        const need = tier(member.lock);
                        const locked = !!need && !levelReaches(chat.relationship, need);
                        return <button key={member.id} type="button" className={`choice${member.id === pick.memberId ? ' live' : ''}`} aria-pressed={pinned === member.id} disabled={locked} title={locked ? `Once you're ${need}` : member.text.replace(/\s+/g, ' ').slice(0, 200)} onClick={() => onChange({ ...chat, pins: { ...chat.pins, [key]: member.id } })}>{member.name || 'Unnamed'}{locked ? ` · once you're ${need}` : ''}</button>;
                      })}
                    </span>
                  </div>
                );
              })}
            </section>
          )}
          {lore.length > 0 && (
            <section className="group" aria-label="Lore in this chat">
              <h3>Lore in this chat</h3>
              <p className="hint">What this chat can call on. Switch one off and its words stop coming in.</p>
              <span className="choice-chips">
                {lore.map((record) => {
                  const on = !chat.loreOff.includes(record.id);
                  return <button key={record.id} type="button" className="choice" aria-pressed={on} title={record.line} onClick={() => onChange({ ...chat, loreOff: on ? [...chat.loreOff, record.id] : chat.loreOff.filter((id) => id !== record.id) })}>{record.name}</button>;
                })}
              </span>
            </section>
          )}
          {source && <p className="hint"><a href={`/studio/#/w/${encodeURIComponent(chat.worldId)}?rec=${encodeURIComponent(chat.characterId)}`}>Edit {charName} in the Studio</a>. What you change there reaches the next reply.</p>}
        </>
      )}

      {tab === 'home' && (
        <>
          {home && character && life ? (
            <>
              <section className="card" aria-label={home.scenario.name}>
                <div className="row between">
                  <span><span className="sub">{home.world.name}</span><br /><b className="home-name">{home.scenario.name}</b></span>
                  {onHome && <button type="button" className="btn small" onClick={() => onHome({ worldId: home.world.id, scenarioId: home.scenario.id, who: character.id })}><HouseIcon size={16} /> Go to the house</button>}
                </div>
                <p className="hint">{where?.hidden ? `${charName} is somewhere private.` : where?.room ? `${charName} is in ${where.room}.` : `${charName} is out.`}</p>
              </section>
              <Keeper
                record={character} life={life} now={now} userName={userName}
                doing={where?.hidden ? 'Somewhere private.' : where?.doing || (read ? statusText(read) : '')}
                busy={!!read?.live.length}
                emotion={needEmotion(character, careAt(character, life, now)) || lastEmotion(chat)}
                onLife={(next) => onLife?.(next)}
              />
            </>
          ) : (
            <p className="hint">{charName} doesn&rsquo;t live in a home yet. A home is a house with rooms that its people keep their day in. Build one in the <a href="/studio/">Studio</a>, or bring someone into a home from <a href="#/home">Homes</a>.</p>
          )}
        </>
      )}

      {tab === 'posts' && (posting && world && character && life && onPicture
        ? <Feed api={posting} portraits={portraits} onPicture={onPicture} subjects={[{ world, record: character, life, chat }]} heading={`${charName}'s posts`} />
        : <p className="hint">Posts need {charName}&rsquo;s record, which is no longer in your worlds.</p>)}

      {tab === 'you' && (
        <section className="group" aria-label="Who you are in this chat" style={{ borderTop: 0, paddingTop: 0 }}>
          <h3>Who you are in this chat</h3>
          <p className="hint">{charName} is told this with the next reply. What has been said stays as it was.</p>
          <div className="doors-list" role="radiogroup" aria-label="You are">
            <button type="button" className="door-row" role="radio" aria-checked={!chat.personaId} onClick={() => onChange(setPersona(chat, null, name || chat.userName, Date.now()))}>
              <b>Just a name</b>
              <span>{charName} knows what to call you and nothing else.</span>
            </button>
            {personas.map((entry) => (
              <button key={`${entry.world.id}:${entry.record.id}`} type="button" className="door-row with-face" role="radio" aria-checked={chat.personaId === entry.record.id} onClick={() => onChange(setPersona(chat, entry.record.id, entry.record.name, Date.now()))}>
                <Portrait name={entry.record.name} set={portraits[portraitOwner(entry.world.id, entry.record.id)]} size={36} />
                <b>{entry.record.name}</b>
                <span>{entry.record.line || entry.record.pronouns || entry.world.name}</span>
              </button>
            ))}
          </div>
          {!chat.personaId && (
            <label className="field">
              <span>Your name</span>
              <input value={name} maxLength={120} onChange={(event) => { setName(event.target.value); if (event.target.value.trim()) onChange(setPersona(chat, null, event.target.value, Date.now())); }} />
            </label>
          )}
          <p className="hint"><a href="#/you">Make or change a persona</a>.</p>
        </section>
      )}
    </aside>
  );
}
