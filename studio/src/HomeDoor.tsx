// The Home door on a scenario: where a home is built. A home is a scenario with rooms, and
// Chat's Home shows each room with whoever is in it. Here an author names the rooms, says what
// each one holds and who may go in, and says who lives in the house. The pictures, their layers
// and where each figure stands are arranged in Chat, where they can be seen; which room an event
// of someone's day happens in is on their Day.
import { useState } from 'react';
import { BOND_CONDITIONS, ensureCondition, newRecord, putRecord, type RecordSet, type StoryRecord, type World } from '../../core/records/index.js';
import { isHome, livesIn, roomsOf } from '../../core/chat/home.js';
import { homeHref } from '../../kit/src/activity';
import { newId } from '../../kit/src/util';

type Room = RecordSet['members'][number];
const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const DEFAULT_PLACE = { x: 0.5, y: 0.62, scale: 0.3, pic: '' };

// How many of a character's events happen in this scenario's rooms.
const eventsHere = (record: StoryRecord, scenario: StoryRecord) => Object.values(record.schedule ?? {}).flat().filter((event) => event.rooms[scenario.id] ?? (scenario.sourceId ? event.rooms[scenario.sourceId] : undefined)).length;

// What the door's row says.
export function homeSummary(world: World, record: StoryRecord): string {
  const rooms = roomsOf(record);
  if (!rooms) return 'Not a home yet. Give it rooms and it shows in Chat’s Home.';
  const living = world.records.filter((entry) => livesIn(entry, record)).length;
  return `${count(rooms.members.length, 'room')} · ${living} living here${record.homeListed === false ? ' · kept out of Home' : ''}`;
}

export function HomeDoor({ world, record, onChange, onWorld }: { world: World; record: StoryRecord; onChange: (record: StoryRecord) => void; onWorld: (world: World) => void }) {
  const rooms = roomsOf(record);
  const [name, setName] = useState('');
  const saveRooms = (next: RecordSet) => onChange({ ...record, sets: record.sets.map((set) => (set.id === next.id ? next : set)) });
  const start = () => {
    const first: Room = { id: newId(), name: 'Main room', text: '', lock: null, layers: [] };
    // An empty set already on the scenario becomes the rooms; otherwise a new one.
    const empty = record.sets.find((set) => !set.members.length);
    onChange({ ...record, homeListed: undefined, sets: empty ? record.sets.map((set) => (set === empty ? { ...set, members: [first], active: first.id } : set)) : [...record.sets, { id: newId(), title: 'Rooms', reach: 'here', active: first.id, members: [first] }] });
  };

  if (!rooms) {
    return (
      <>
        <p className="lede">A home is a scenario with rooms. Give this one rooms and it appears in Chat&rsquo;s Home, with the people who live in it going about their day.</p>
        <div className="row"><button type="button" className="btn primary" onClick={start}>Give it rooms</button></div>
        <p className="hint">The rooms are a set on this scenario: one room is in use at a time, and its words are what the model is told about where a chat is.</p>
      </>
    );
  }

  const room = (roomId: string, patch: Partial<Room>) => saveRooms({ ...rooms, members: rooms.members.map((member) => (member.id === roomId ? { ...member, ...patch } : member)) });
  const move = (at: number, by: number) => {
    const to = at + by;
    if (to < 0 || to >= rooms.members.length) return;
    const members = [...rooms.members];
    const [item] = members.splice(at, 1);
    members.splice(to, 0, item!);
    saveRooms({ ...rooms, members });
  };
  // A lock names one of the bond conditions Chat reads; the world gets the condition when a room first uses it.
  const lock = (roomId: string, conditionId: string) => {
    const condition = BOND_CONDITIONS.find((entry) => entry.id === conditionId);
    const next = { ...record, sets: record.sets.map((set) => (set.id === rooms.id ? { ...rooms, members: rooms.members.map((member) => (member.id === roomId ? { ...member, lock: condition?.id ?? null } : member)) } : set)) };
    onWorld(putRecord(condition ? ensureCondition(world, { id: condition.id, label: condition.label }) : world, next, Date.now()));
  };
  const people = world.records.filter((entry) => entry.kind === 'character');
  const live = (person: StoryRecord, on: boolean) => {
    const { [record.id]: _gone, ...rest } = person.idle;
    onWorld(putRecord(world, { ...person, idle: on ? { ...person.idle, [record.id]: { room: rooms.members[0]!.id, ...DEFAULT_PLACE } } : rest }, Date.now()));
  };
  // Someone new, made here: a character people can chat with, already living in the first room.
  const moveIn = () => {
    if (!name.trim()) return;
    const fresh = { ...newRecord('character', newId(), name.trim(), newId), chatListed: true, idle: { [record.id]: { room: rooms.members[0]!.id, ...DEFAULT_PLACE } } };
    onWorld(putRecord(world, fresh, Date.now()));
    setName('');
  };
  const idleRoom = (person: StoryRecord, roomId: string) => onWorld(putRecord(world, { ...person, idle: { ...person.idle, [record.id]: { ...DEFAULT_PLACE, ...person.idle[record.id], room: roomId } } }, Date.now()));

  return (
    <>
      <p className="lede">{homeSummary(world, record)}</p>
      <div className="row">
        <a className="btn small" href={homeHref(world.id, record.id)}>Open in Home</a>
        <label className="check"><input type="checkbox" checked={isHome(record)} onChange={(event) => onChange({ ...record, homeListed: event.target.checked ? undefined : false })} /> <span>Shown in Chat&rsquo;s Home</span></label>
      </div>
      <p className="hint">Room pictures, their layers, and where each figure stands are arranged in Home, under Arrange.</p>

      <h3 className="sub">Rooms</h3>
      {rooms.members.map((member, index) => (
        <div key={member.id} className="card">
          <div className="card-head">
            <label className="sr" htmlFor={`room-${member.id}-name`}>Room name</label>
            <input id={`room-${member.id}-name`} className="title" value={member.name} maxLength={120} placeholder="The kitchen, the roof, her room" onChange={(event) => room(member.id, { name: event.target.value })} />
            <button type="button" className="icon-btn" aria-label={`Remove ${member.name || 'this room'}`} disabled={rooms.members.length === 1} onClick={() => saveRooms({ ...rooms, members: rooms.members.filter((entry) => entry.id !== member.id), active: rooms.active === member.id ? rooms.members.find((entry) => entry.id !== member.id)?.id ?? null : rooms.active })}>×</button>
          </div>
          <label className="sr" htmlFor={`room-${member.id}-text`}>What {member.name || 'this room'} is like</label>
          <textarea id={`room-${member.id}-text`} rows={3} maxLength={20000} value={member.text} placeholder="What is in it and what it is like: sent while a chat is in this room." onChange={(event) => room(member.id, { text: event.target.value })} />
          <div className="row">
            <label className="field grow">
              <span>Who can go in</span>
              <select value={member.lock ?? ''} onChange={(event) => lock(member.id, event.target.value)}>
                <option value="">Anyone</option>
                {BOND_CONDITIONS.map((condition) => <option key={condition.id} value={condition.id}>Once you are: {condition.tier}</option>)}
                {member.lock && !BOND_CONDITIONS.some((condition) => condition.id === member.lock) && <option value={member.lock}>{world.conditions.find((condition) => condition.id === member.lock)?.label ?? member.lock}</option>}
              </select>
            </label>
            <button type="button" className="btn small quiet" style={{ alignSelf: 'flex-end' }} disabled={index === 0} onClick={() => move(index, -1)}>Move up</button>
            <button type="button" className="btn small quiet" style={{ alignSelf: 'flex-end' }} disabled={index === rooms.members.length - 1} onClick={() => move(index, 1)}>Move down</button>
          </div>
          {member.lock && <p className="hint">Until then the room is closed, and whoever is in it is somewhere private.</p>}
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" disabled={rooms.members.length >= 60} onClick={() => saveRooms({ ...rooms, members: [...rooms.members, { id: newId(), name: '', text: '', lock: null, layers: [] }] })}>Add a room</button>
      </div>

      <h3 className="sub">Who lives here</h3>
      {people.length === 0 && <p className="empty">Nobody in {world.name} yet.</p>}
      {people.map((person) => {
        const here = eventsHere(person, record);
        const idle = person.idle[record.id] ?? (record.sourceId ? person.idle[record.sourceId] : undefined);
        return (
          <div key={person.id} className="card">
            <div className="row between">
              <label className="check"><input type="checkbox" checked={!!idle} onChange={(event) => live(person, event.target.checked)} /> <span><b>{person.name}</b> lives here</span></label>
              {idle && (
                <label className="field">
                  <span className="sr">Where {person.name} is when nothing is on</span>
                  <select aria-label={`Where ${person.name} is when nothing is on`} value={idle.room} onChange={(event) => idleRoom(person, event.target.value)}>
                    {rooms.members.map((member) => <option key={member.id} value={member.id}>{member.name || 'Unnamed room'}</option>)}
                  </select>
                </label>
              )}
            </div>
            <p className="hint">
              {here > 0 ? `${count(here, 'event')} of their day ${here === 1 ? 'happens' : 'happen'} in these rooms.` : idle ? 'Their day doesn’t use these rooms yet: give an event a room on their Day and they move about.' : 'Not here.'}
              {!idle && here > 0 && ' With nothing on, they are out.'}
            </p>
          </div>
        );
      })}
      <form className="row" onSubmit={(event) => { event.preventDefault(); moveIn(); }}>
        <label className="field grow">
          <span>Someone new who lives here</span>
          <input value={name} maxLength={120} placeholder="Their name" onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit" className="btn small" style={{ alignSelf: 'flex-end' }} disabled={!name.trim()}>Add them</button>
      </form>
      <p className="hint">They are added to this world as a character and shown in Chat. Open them from the list to write who they are and give them a day.</p>
    </>
  );
}
