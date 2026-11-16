// Home: a place with everyone in it (CharacterRoom's Tamagotchi mode). Pick a scenario, see its
// rooms as pictures, and each character who lives there standing where their schedule puts them.
// Tap one to see how they are, do something for them, or drop into a chat. Arrange is where a
// room gets its picture and layers and a figure its spot; that part edits the records.
import { IMAGE_TYPES, MediaImage, animationSlot, posterSlot } from '../../kit/src/media';
import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  CLOCK_STEPS, actionBlocked, careAt, clockTracks, doAction, formatDate, formatStamp, lastEmotion, levelReaches, lifeKey, lifeNow, livesIn, moveClock, needEmotion,
  newLife, nextMorningMs, placeIn, readSchedule, resolvePortrait, setClockMode, stampOf, statusText, storyActive, whileAway,
  type Chat, type Life, type Placement,
} from '../../core/chat/index.js';
import { BOND_CONDITIONS, LAYER_BLENDS, LAYER_MOTIONS, RELATIONSHIPS, putRecord, type Layer, type RecordSet, type Spot, type StoryRecord, type World } from '../../core/records/index.js';
import { newId } from '../../kit/src/util';
import { figureSlot, layerSlot, portraitOwner, roomSlot, type PortraitSet } from './store';
import type { IncludedWorld } from '../../kit/src/included';

const capital = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const DEFAULT_SPOT: Spot = { x: 0.5, y: 0.62, scale: 0.3, pic: '' };
type Member = RecordSet['members'][number];

interface Resident { record: StoryRecord; life: Life; now: number; place: Placement | null; status: string; emotion: string; low: string[]; hidden: boolean }

export interface HouseProps {
  worlds: World[];
  chats: Chat[];
  portraits: Record<string, PortraitSet>;
  lives: Record<string, Life>;
  userName: string;
  onLife: (life: Life) => void;
  onWorld: (world: World) => void;
  onPicture: (owner: string, slot: string, file: File | null) => void;
  onChat: (world: World, record: StoryRecord, scenario: StoryRecord) => void;
  // The worlds that come with the site and aren't in this browser yet, and how to bring one in.
  bringable?: readonly IncludedWorld[];
  onBring?: (id: string) => void;
}

// The scenarios that are places: those with a set of rooms.
const placesOf = (worlds: World[]) => worlds.flatMap((world) => world.records.filter((record) => record.kind === 'scenario' && record.sets.some((set) => set.members.length)).map((scenario) => ({ world, scenario })));

export function House({ worlds, chats, portraits, lives, userName, onLife, onWorld, onPicture, onChat, bringable = [], onBring }: HouseProps) {
  const bring = onBring ? bringable : [];
  const places = placesOf(worlds);
  const [placeKey, setPlaceKey] = useState('');
  const [looking, setLooking] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [arranging, setArranging] = useState(false);
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setTick(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const at = places.find((entry) => `${entry.world.id}:${entry.scenario.id}` === placeKey) ?? places[0];
  if (!at) {
    return (
      <main className="home">
        <h1>Home</h1>
        <p className="lede">A place, with everyone in it, going about their day.</p>
        {bring.map((entry) => (
          <div key={entry.id} className="row">
            <button type="button" className="btn primary" onClick={() => onBring!(entry.id)}>Bring in {entry.name}</button>
            <span className="hint">{entry.who}</span>
          </div>
        ))}
        <p className="hint">Home needs a scenario with rooms: a set on the scenario, one member a room. Import a CharacterRoom scenario card with locations, or add a set to a scenario in the <a href="/studio/">Studio</a>. A character lives there once a schedule event happens in one of its rooms, or you bring them in here.</p>
      </main>
    );
  }
  const { world, scenario } = at;
  const rooms = scenario.sets.find((set) => set.members.length)!;
  const owner = portraitOwner(world.id, scenario.id);
  const pictures = portraits[owner] ?? {};
  // Actions name the player; with no name set, the one their latest chat here used.
  const name = userName || chats.find((chat) => chat.worldId === world.id)?.userName || 'Someone';

  const residents: Resident[] = world.records.filter((record) => livesIn(record, scenario)).map((record) => {
    const life = lives[lifeKey(world.id, record.id)] ?? newLife(world.id, record, tick);
    const now = lifeNow(life, tick);
    const read = readSchedule(record.schedule, life.relationship, now);
    const place = placeIn(record, scenario, read);
    const care = careAt(record, life, now);
    const lock = BOND_CONDITIONS.find((condition) => condition.id === rooms.members.find((member) => member.id === place?.room)?.lock)?.tier;
    const latest = chats.find((chat) => chat.worldId === world.id && chat.characterId === record.id);
    return {
      record, life, now, place, status: statusText(read), low: record.needs.filter((need) => (care.needs[need.id] ?? need.max) <= need.low).map((need) => need.name),
      emotion: needEmotion(record, care) || (latest ? lastEmotion(latest) : 'neutral'),
      hidden: !!lock && !levelReaches(life.relationship, lock),
    };
  });
  const selected = residents.find((resident) => resident.record.id === selectedId) ?? residents[0] ?? null;
  // The camera follows the picked character unless you look at another room.
  const roomId = looking ?? (selected?.hidden ? null : selected?.place?.room) ?? rooms.members[0]!.id;
  const room = rooms.members.find((member) => member.id === roomId) ?? rooms.members[0]!;
  const here = residents.filter((resident) => resident.place?.room === room.id && !resident.hidden);
  const strangers = world.records.filter((record) => record.kind === 'character' && !livesIn(record, scenario));

  const saveRecord = (record: StoryRecord) => onWorld(putRecord(world, record, Date.now()));
  const saveRoom = (member: Member) => saveRecord({ ...scenario, sets: scenario.sets.map((set) => (set.id === rooms.id ? { ...set, members: set.members.map((entry) => (entry.id === member.id ? member : entry)) } : set)) });
  // A figure's spot belongs to whatever put them here: the schedule event on now, or their idle place.
  const saveSpot = (resident: Resident, spot: Spot) => {
    const { record } = resident;
    const live = readSchedule(record.schedule, resident.life.relationship, resident.now).live.find((event) => event.rooms[scenario.id] ?? (scenario.sourceId ? event.rooms[scenario.sourceId] : undefined));
    if (live && !resident.place?.idle) {
      const schedule = Object.fromEntries(Object.entries(record.schedule ?? {}).map(([day, events]) => [day, events.map((event) => (event.id === live.id ? { ...event, rooms: { ...event.rooms, [scenario.id]: room.id }, spots: { ...event.spots, [scenario.id]: spot } } : event))]));
      saveRecord({ ...record, schedule });
    } else {
      saveRecord({ ...record, idle: { ...record.idle, [scenario.id]: { room: resident.place?.room ?? room.id, ...spot } } });
    }
  };
  const drag = (event: ReactPointerEvent, resident: Resident) => {
    const rect = box.current?.getBoundingClientRect();
    if (!arranging || !dragging.current || !rect || !resident.place) return;
    const fraction = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 200) / 200;
    saveSpot(resident, { ...resident.place.spot, x: fraction((event.clientX - rect.left) / rect.width), y: fraction((event.clientY - rect.top) / rect.height) });
  };
  const file = (handler: (picked: File) => void) => (event: ChangeEvent<HTMLInputElement>) => { const picked = event.target.files?.[0]; event.target.value = ''; if (picked) handler(picked); };
  const layerStyle = (layer: Layer) => ({
    opacity: layer.opacity, mixBlendMode: layer.blend,
    ...(layer.fill ? { inset: 0, width: '100%', height: '100%' } : { left: `${layer.x * 100}%`, top: `${layer.y * 100}%`, width: `${layer.scale * 100}%`, translate: '-50% -50%' }),
  } as const);
  const layers = (above: boolean) => room.layers.filter((layer) => layer.shown && layer.above === above && pictures[layerSlot(room.id, layer.id)]).map((layer) => (
    <MediaImage key={layer.id} frameClassName={`layer motion-${layer.motion}`} src={pictures[layerSlot(room.id, layer.id)]!} poster={pictures[posterSlot(layerSlot(room.id, layer.id))]} animated={pictures[animationSlot(layerSlot(room.id, layer.id))] === 'true'} active alt="" frameStyle={layerStyle(layer)} />
  ));

  return (
    <main className="house">
      <div className="row between">
        <label className="field grow" style={{ maxWidth: 360 }}>
          <span className="sr">Place</span>
          <select aria-label="Place" value={`${world.id}:${scenario.id}`} onChange={(event) => { setPlaceKey(event.target.value); setLooking(null); setSelectedId(null); }}>
            {places.map((entry) => <option key={`${entry.world.id}:${entry.scenario.id}`} value={`${entry.world.id}:${entry.scenario.id}`}>{entry.scenario.name}</option>)}
          </select>
        </label>
        {bring.map((entry) => <button key={entry.id} type="button" className="btn small quiet" onClick={() => onBring!(entry.id)} title={entry.who}>Bring in {entry.name}</button>)}
        <button type="button" className={`btn small ${arranging ? '' : 'quiet'}`} aria-pressed={arranging} onClick={() => setArranging(!arranging)}>{arranging ? 'Done arranging' : 'Arrange'}</button>
      </div>

      <div className="rooms" role="tablist" aria-label="Rooms">
        {rooms.members.map((member) => {
          // Someone in a room you can't yet enter isn't given away by its count.
          const inside = residents.filter((resident) => resident.place?.room === member.id && !resident.hidden);
          return (
            <button key={member.id} type="button" role="tab" aria-selected={member.id === room.id} className={`tab${member.id === room.id ? ' on' : ''}`} onClick={() => setLooking(member.id)}>
              {member.name || 'Room'}{inside.length > 0 && <span className="count" aria-label={`${inside.length} here`}>{inside.length}</span>}
            </button>
          );
        })}
        {looking && selected?.place && <button type="button" className="link" onClick={() => setLooking(null)}>Follow {selected.record.name}</button>}
      </div>

      <div className="house-main">
        <section className="stage" aria-label={room.name || 'Room'}>
          <div className={`room${pictures[roomSlot(room.id)] ? '' : ' bare'}${arranging ? ' arranging' : ''}`} ref={box}>
            {pictures[roomSlot(room.id)]
              ? <MediaImage frameClassName="room-backdrop" className="backdrop" src={pictures[roomSlot(room.id)]!} poster={pictures[posterSlot(roomSlot(room.id))]} animated={pictures[animationSlot(roomSlot(room.id))] === 'true'} active alt="" />
              : <p className="bare-text"><b>{room.name}</b>{room.text}</p>}
            {layers(false)}
            {here.map((resident) => {
              const spot = resident.place!.spot;
              const set = portraits[portraitOwner(world.id, resident.record.id)] ?? {};
              const face = resolvePortrait(resident.emotion, Object.keys(set).filter((slot) => !slot.includes(':')));
              const pictureSlot = spot.pic && set[figureSlot(spot.pic)] ? figureSlot(spot.pic) : face;
              const picture = pictureSlot ? set[pictureSlot] : undefined;
              return (
                <button
                  key={resident.record.id} type="button" className={`figure${resident.record.id === selected?.record.id ? ' on' : ''}${picture ? '' : ' plain'}`}
                  style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%`, width: `${spot.scale * 100}%` }}
                  aria-label={`${resident.record.name}: ${resident.place!.event || resident.status}`}
                  onClick={() => setSelectedId(resident.record.id)}
                  onPointerDown={(event) => { if (!arranging) return; setSelectedId(resident.record.id); dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); }}
                  onPointerMove={(event) => drag(event, resident)}
                  onPointerUp={() => { dragging.current = false; }}
                >
                  {picture ? <MediaImage src={picture} poster={pictureSlot ? set[posterSlot(pictureSlot)] : undefined} animated={pictureSlot ? set[animationSlot(pictureSlot)] === 'true' : false} active={resident.record.id === selected?.record.id} alt="" draggable={false} /> : <span className="initial">{resident.record.name.charAt(0)}</span>}
                  <span className="tag">{resident.record.name}{resident.low.length > 0 && <span className="dot on" title={`Low: ${resident.low.join(', ')}`} />}</span>
                </button>
              );
            })}
            {layers(true)}
          </div>
          {here.length === 0 && <p className="hint">Nobody is in {room.name || 'this room'} right now.</p>}
          {arranging && <Arranger room={room} pictures={pictures} owner={owner} onPicture={onPicture} onRoom={saveRoom} resident={selected && here.includes(selected) ? selected : null} set={selected ? portraits[portraitOwner(world.id, selected.record.id)] ?? {} : {}} worldId={world.id} onSpot={saveSpot} onRecord={saveRecord} file={file} />}
        </section>

        <aside className="keeper" aria-label="Who lives here">
          <div className="people">
            {residents.map((resident) => (
              <button key={resident.record.id} type="button" className={`person${resident.record.id === selected?.record.id ? ' on' : ''}`} aria-current={resident.record.id === selected?.record.id} onClick={() => { setSelectedId(resident.record.id); setLooking(null); }}>
                <b>{resident.record.name}</b>
                <small>{resident.hidden ? 'Somewhere private' : rooms.members.find((member) => member.id === resident.place?.room)?.name ?? 'Out'}</small>
              </button>
            ))}
          </div>
          {strangers.length > 0 && (
            <label className="field">
              <span>Bring someone to live here</span>
              <select value="" onChange={(event) => { const record = world.records.find((entry) => entry.id === event.target.value); if (record) { saveRecord({ ...record, idle: { ...record.idle, [scenario.id]: { room: room.id, ...DEFAULT_SPOT } } }); setSelectedId(record.id); } }}>
                <option value="">Pick a character</option>
                {strangers.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}
              </select>
            </label>
          )}
          {selected && <Keeper key={selected.record.id} resident={selected} userName={name} onLife={onLife} onChat={() => onChat(world, selected.record, scenario)} />}
          {!residents.length && <p className="hint">Nobody lives here yet. Bring someone in, or give a character's schedule events a room here in the Studio.</p>}
        </aside>
      </div>
    </main>
  );
}

// One character: what they're doing, how they are, what you can do for them, and the way into a chat.
function Keeper({ resident, userName, onLife, onChat }: { resident: Resident; userName: string; onLife: (life: Life) => void; onChat: () => void }) {
  const { record, life, now } = resident;
  const care = careAt(record, life, now);
  const keeping = Object.keys(life.levels).length > 0;
  const away = whileAway(record, life, life.seenAt || now, now, userName);
  const start = () => onLife({ ...life, levels: Object.fromEntries(record.needs.map((need) => [need.id, { v: care.needs[need.id] ?? need.max, at: now }])), bond: record.bond ? { v: care.bond ?? record.bond.max / 2, at: now } : null, seenAt: now });
  const clock = life.clock;
  return (
    <section className="card" aria-label={record.name}>
      <div className="row between">
        <h2>{record.name}</h2>
        <button type="button" className="btn small primary" onClick={onChat}>Chat</button>
      </div>
      <p className="now"><span className={`dot${resident.place && !resident.place.idle ? ' on' : ''}`} />{resident.hidden ? 'Somewhere private.' : resident.place?.event || resident.status} <span className="hint">{stampOf(now)}</span></p>
      <p className="hint">Looking {resident.emotion}.{clockTracks(clock) ? '' : ' In chat, the time is not sent: turn on story time, or tell them the time under Time.'}</p>

      <div className="row">
        <label className="field grow"><span>You are to them</span>
          <select value={life.relationship} onChange={(event) => onLife({ ...life, relationship: event.target.value as Life['relationship'] })}>{RELATIONSHIPS.map((value) => <option key={value} value={value}>{capital(value)}</option>)}</select>
        </label>
        <label className="field grow"><span>Their clock</span>
          <select value={clock.mode} onChange={(event) => onLife({ ...life, clock: setClockMode(clock, event.target.value as 'real' | 'story', Date.now()) })}>
            <option value="real">Real time</option><option value="story">Story time</option>
          </select>
        </label>
      </div>
      {storyActive(clock) && (
        <div className="row">
          <span className="hint">{formatStamp(clock.storyMs)} · {formatDate(clock.storyMs)}</span>
          {([['+30 min', 30], ['+1 h', 60], ['+8 h', 480]] as const).map(([label, minutes]) => <button key={label} type="button" className="btn small quiet" onClick={() => onLife({ ...life, clock: moveClock(clock, minutes) })}>{label}</button>)}
          <button type="button" className="btn small quiet" onClick={() => onLife({ ...life, clock: { ...clock, storyMs: nextMorningMs(clock.storyMs) } })}>Next morning</button>
          <label className="field"><span className="sr">Step with each reply</span>
            <select aria-label="Step with each reply" value={clock.stepMin} onChange={(event) => onLife({ ...life, clock: { ...clock, stepMin: Number(event.target.value) } })}>{CLOCK_STEPS.map((step) => <option key={step} value={step}>{step ? `${step} min a reply` : 'No step'}</option>)}</select>
          </label>
        </div>
      )}

      {record.needs.length > 0 && (
        <div className="needs" aria-label="Needs">
          {record.needs.map((need) => {
            const value = care.needs[need.id] ?? need.max;
            return (
              <div key={need.id} className={`meter-row${value <= need.low ? ' low' : ''}`}>
                <span>{need.name}</span>
                <span className="gauge" role="meter" aria-label={need.name} aria-valuemin={0} aria-valuemax={need.max} aria-valuenow={Math.round(value)}><span style={{ width: `${(value / need.max) * 100}%` }} /></span>
                <small>{Math.round(value)}</small>
              </div>
            );
          })}
          {record.bond && care.bond !== null && (
            <div className="meter-row bond">
              <span>{record.bond.name}</span>
              <span className="gauge" role="meter" aria-label={record.bond.name} aria-valuemin={0} aria-valuemax={record.bond.max} aria-valuenow={Math.round(care.bond)}><span style={{ width: `${(care.bond / record.bond.max) * 100}%` }} /></span>
              <small>{Math.round(care.bond)}</small>
            </div>
          )}
          {!keeping && <p className="hint">Their needs stand still until you start keeping them. Once kept, they fall with the clock, the schedule moves them, and chat is told how they stand. <button type="button" className="link" onClick={start}>Start keeping them</button></p>}
        </div>
      )}

      {record.homeActions.length > 0 && (
        <div className="row" aria-label="Actions">
          {record.homeActions.map((action) => {
            const blocked = actionBlocked(life, action, now);
            return <button key={action.id} type="button" className="btn small" disabled={!!blocked} title={blocked || action.say} onClick={() => onLife({ ...doAction(record, life, action.id, now, userName), seenAt: now })}>{action.name}</button>;
          })}
        </div>
      )}

      {away.length > 0 && (
        <div className="group">
          <div className="row between"><h3>While you were away</h3><button type="button" className="link" onClick={() => onLife({ ...life, seenAt: now })}>Seen</button></div>
          {away.map((entry, index) => <p key={index} className="part"><b>{stampOf(entry.at)}</b>{entry.text}</p>)}
        </div>
      )}
      {life.log.length > 0 && (
        <div className="group">
          <h3>What you did</h3>
          {life.log.slice(-5).reverse().map((entry, index) => <p key={index} className="part"><b>{stampOf(entry.at)}</b>{entry.text}</p>)}
        </div>
      )}
    </section>
  );
}

// Arrange: the room's picture and its layers, and where the picked figure stands.
function Arranger({ room, pictures, owner, onPicture, onRoom, resident, set, worldId, onSpot, onRecord, file }: {
  room: Member; pictures: PortraitSet; owner: string; onPicture: HouseProps['onPicture']; onRoom: (member: Member) => void;
  resident: Resident | null; set: PortraitSet; worldId: string; onSpot: (resident: Resident, spot: Spot) => void; onRecord: (record: StoryRecord) => void;
  file: (handler: (picked: File) => void) => (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const layer = (layerId: string, patch: Partial<Layer>) => onRoom({ ...room, layers: room.layers.map((entry) => (entry.id === layerId ? { ...entry, ...patch } : entry)) });
  const slider = (label: string, value: number, min: number, max: number, onValue: (value: number) => void) => (
    <label className="field grow"><span>{label}</span><input type="range" min={min} max={max} step={0.01} value={value} onChange={(event) => onValue(Number(event.target.value))} /></label>
  );
  const spot = resident?.place?.spot;
  return (
    <div className="arranger">
      <section className="card" aria-label="This room's picture">
        <div className="row between">
          <h3>{room.name || 'Room'}</h3>
          <span className="row">
            <span className="btn small file-btn">{pictures[roomSlot(room.id)] ? 'Change the picture' : 'Add a picture'}<input type="file" accept={IMAGE_TYPES} aria-label="Room picture" onChange={file((picked) => onPicture(owner, roomSlot(room.id), picked))} /></span>
            {pictures[roomSlot(room.id)] && <button type="button" className="link danger" onClick={() => onPicture(owner, roomSlot(room.id), null)}>Remove</button>}
          </span>
        </div>
        <p className="hint">Any shape works: the room takes the picture's own. Figures and layers are placed as fractions of it, so they stay put at any size.</p>
        {room.layers.map((entry) => (
          <div key={entry.id} className="card">
            <div className="row">
              <input className="input grow" aria-label="Layer name" value={entry.name} placeholder="Lantern light, steam, rain" maxLength={80} onChange={(event) => layer(entry.id, { name: event.target.value })} />
              <span className="btn small quiet file-btn">{pictures[layerSlot(room.id, entry.id)] ? 'Change' : 'Picture'}<input type="file" accept={IMAGE_TYPES} aria-label={`Picture for ${entry.name || 'this layer'}`} onChange={file((picked) => onPicture(owner, layerSlot(room.id, entry.id), picked))} /></span>
              <button type="button" className="link danger" onClick={() => { onPicture(owner, layerSlot(room.id, entry.id), null); onRoom({ ...room, layers: room.layers.filter((other) => other.id !== entry.id) }); }}>Remove</button>
            </div>
            <div className="checks">
              <label><input type="checkbox" checked={entry.shown} onChange={(event) => layer(entry.id, { shown: event.target.checked })} /> Shown</label>
              <label><input type="checkbox" checked={entry.above} onChange={(event) => layer(entry.id, { above: event.target.checked })} /> Over the figures</label>
              <label><input type="checkbox" checked={entry.fill} onChange={(event) => layer(entry.id, { fill: event.target.checked })} /> Fills the room</label>
            </div>
            <div className="row">
              {!entry.fill && slider('Across', entry.x, 0, 1, (x) => layer(entry.id, { x }))}
              {!entry.fill && slider('Down', entry.y, 0, 1, (y) => layer(entry.id, { y }))}
              {!entry.fill && slider('Size', entry.scale, 0.05, 2, (scale) => layer(entry.id, { scale }))}
              {slider('Strength', entry.opacity, 0, 1, (opacity) => layer(entry.id, { opacity }))}
            </div>
            <div className="row">
              <label className="field grow"><span>Blend</span><select value={entry.blend} onChange={(event) => layer(entry.id, { blend: event.target.value as Layer['blend'] })}>{LAYER_BLENDS.map((blend) => <option key={blend} value={blend}>{capital(blend)}</option>)}</select></label>
              <label className="field grow"><span>Movement</span><select value={entry.motion} onChange={(event) => layer(entry.id, { motion: event.target.value as Layer['motion'] })}>{LAYER_MOTIONS.map((motion) => <option key={motion} value={motion}>{capital(motion)}</option>)}</select></label>
            </div>
          </div>
        ))}
        {room.layers.length < 12 && <button type="button" className="btn small quiet" onClick={() => onRoom({ ...room, layers: [...room.layers, { id: newId(), name: '', above: true, fill: true, x: 0.5, y: 0.5, scale: 1, opacity: 0.6, blend: 'normal', shown: true, motion: 'none' }] })}>Add a layer</button>}
      </section>

      {resident && spot && (
        <section className="card" aria-label={`Where ${resident.record.name} stands`}>
          <h3>{resident.record.name}, {resident.place!.idle ? 'when nothing is on' : `during: ${resident.place!.event}`}</h3>
          <p className="hint">Drag the figure in the room, or use the sliders. The spot is kept for this part of their day.</p>
          <div className="row">
            {slider('Across', spot.x, 0, 1, (x) => onSpot(resident, { ...spot, x }))}
            {slider('Down', spot.y, 0, 1, (y) => onSpot(resident, { ...spot, y }))}
            {slider('Size', spot.scale, 0.05, 1, (scale) => onSpot(resident, { ...spot, scale }))}
          </div>
          <div className="row">
            <label className="field grow"><span>Picture</span>
              <select value={spot.pic} onChange={(event) => onSpot(resident, { ...spot, pic: event.target.value })}>
                <option value="">Their portrait, by how they feel</option>
                {resident.record.figures.map((figure) => <option key={figure.id} value={figure.id}>{figure.name || 'Unnamed'}{set[figureSlot(figure.id)] ? '' : ' (no picture yet)'}</option>)}
              </select>
            </label>
            {spot.pic && <span className="btn small quiet file-btn" style={{ alignSelf: 'flex-end' }}>Upload it<input type="file" accept={IMAGE_TYPES} aria-label="Figure picture" onChange={file((picked) => onPicture(portraitOwner(worldId, resident.record.id), figureSlot(spot.pic), picked))} /></span>}
            <button type="button" className="btn small quiet" style={{ alignSelf: 'flex-end' }} onClick={() => { const fresh = { id: newId(), name: resident.place!.event.slice(0, 40) || 'At ease' }; onRecord({ ...resident.record, figures: [...resident.record.figures, fresh] }); }}>New picture slot</button>
          </div>
          <p className="hint">A cut-out with a clear background sits best in a room. Uploads keep their transparency.</p>
        </section>
      )}
    </div>
  );
}
