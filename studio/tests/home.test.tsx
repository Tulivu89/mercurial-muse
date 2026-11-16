// Building a home in the Studio: a household, a scenario's Home door, and what a household's
// world page offers in place of the adventure.
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { homesOf, isHome, livesIn, residentsOf } from '../../core/chat/home.js';
import { newRecord, newWorld, parseWorld, putRecord, type World } from '../../core/records/index.js';
import { WorldView } from '../src/WorldView';
import { NOWHERE, formatRoute, parseRoute } from '../src/route';

vi.mock('../src/go', () => ({ go: vi.fn() }));

function world(use?: World['use']): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  let next: World = { ...newWorld('w', 'Number Nine', 1), ...(use ? { use } : {}) };
  next = putRecord(next, newRecord('scenario', 'house', 'The house', ids), 2);
  next = putRecord(next, { ...newRecord('character', 'ada', 'Ada Moss', ids), line: 'The voice of KXRT after midnight.' }, 2);
  return putRecord(next, newRecord('character', 'bo', 'Bo', ids), 2);
}

let latest: World;
function View({ start }: { start: World }) {
  const [state, setState] = useState(start);
  latest = state;
  return <WorldView world={state} onChange={setState} onDelete={() => {}} onStatus={() => {}} status={null} />;
}
const at = (hash: string) => { window.history.replaceState(null, '', `/studio/${hash}`); };
const scenario = () => latest.records.find((record) => record.id === 'house')!;

describe('a home, built in the Studio', () => {
  it('has an address for the Home door', () => {
    const route = { ...NOWHERE, worldId: 'w', rec: 'house', door: 'home' as const };
    expect(formatRoute(route)).toBe('#/w/w?rec=house&door=home');
    expect(parseRoute('#/w/w?rec=house&door=home')).toEqual(route);
  });

  it('turns a scenario into a home: rooms, who may go in, who lives there, and the way to see it', () => {
    at('#/w/w?rec=house&door=home');
    render(<View start={world('household')} />);
    const doors = within(screen.getByRole('navigation', { name: 'More of The house' }));
    expect(doors.getByRole('button', { name: 'Home' })).toHaveAccessibleDescription('Not a home yet. Give it rooms and it shows in Chat’s Home.');
    // A household has no part in the adventure, so its scenario doesn't offer one.
    expect(doors.queryByRole('button', { name: 'In the adventure' })).toBeNull();
    expect(isHome(scenario())).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Give it rooms' }));
    expect(isHome(scenario())).toBe(true);
    fireEvent.change(screen.getByLabelText('Room name'), { target: { value: 'The kitchen' } });
    fireEvent.change(screen.getByLabelText('What The kitchen is like'), { target: { value: 'A long table and a stove that is never off.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add a room' }));
    fireEvent.change(screen.getAllByLabelText('Room name')[1]!, { target: { value: 'The roof' } });
    // A lock is one of the bond conditions Chat reads, and the world gains it when first used.
    fireEvent.change(screen.getAllByLabelText('Who can go in')[1]!, { target: { value: 'bond-close' } });
    const rooms = scenario().sets[0]!;
    expect(rooms.members.map((member) => [member.name, member.lock])).toEqual([['The kitchen', null], ['The roof', 'bond-close']]);
    expect(rooms.members[0]!.text).toBe('A long table and a stove that is never off.');
    expect(latest.conditions).toEqual([{ id: 'bond-close', label: 'Close or closer' }]);
    expect(parseWorld(JSON.parse(JSON.stringify(latest))).ok).toBe(true);

    // Who lives here: Ada moves in, and idles on the roof.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ada Moss lives here' }));
    fireEvent.change(screen.getByLabelText('Where Ada Moss is when nothing is on'), { target: { value: rooms.members[1]!.id } });
    const home = homesOf([latest])[0]!;
    expect(residentsOf(home).map((record) => record.name)).toEqual(['Ada Moss']);
    expect(latest.records.find((record) => record.id === 'ada')!.idle.house).toMatchObject({ room: rooms.members[1]!.id, x: 0.5 });
    expect(doors.getByRole('button', { name: 'Home' })).toHaveAccessibleDescription('2 rooms · 1 living here');
    expect(screen.getByRole('link', { name: 'Open in Home' })).toHaveAttribute('href', '/chat/#/home/w/house');

    // Someone new can be made right here, already living in the first room and listed in Chat.
    fireEvent.change(screen.getByLabelText('Someone new who lives here'), { target: { value: 'Cass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add them' }));
    const cass = latest.records.find((record) => record.name === 'Cass')!;
    expect(cass).toMatchObject({ kind: 'character', chatListed: true });
    expect(cass.idle.house!.room).toBe(rooms.members[0]!.id);
    expect(residentsOf(homesOf([latest])[0]!).map((record) => record.name)).toEqual(['Ada Moss', 'Cass']);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cass lives here' }));

    // And out again; a home can be kept off Chat's list without losing its rooms.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Ada Moss lives here' }));
    expect(livesIn(latest.records.find((record) => record.id === 'ada')!, scenario())).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Shown in Chat’s Home' }));
    expect(scenario().homeListed).toBe(false);
    expect(homesOf([latest])).toEqual([]);
    expect(doors.getByRole('button', { name: 'Home' })).toHaveAccessibleDescription('2 rooms · 0 living here · kept out of Home');
  });

  it('offers a household to Chat, not to the adventure, and lets its author say which it is', () => {
    at('#/w/w?page=about');
    let n = 0;
    const withHome = putRecord(world('household'), { ...newRecord('scenario', 'flat', 'The flat', () => `x-${++n}`), sets: [{ id: 'rooms', title: 'Rooms', reach: 'here', active: 'r1', members: [{ id: 'r1', name: 'Main room', text: '', lock: null, layers: [] }] }] }, 3);
    render(<View start={withHome} />);
    expect(screen.queryByRole('button', { name: 'Play in the adventure' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export as a module' })).toBeNull();
    const inChat = screen.getByRole('region', { name: 'In Chat' });
    expect(within(inChat).getByRole('link', { name: 'Open The flat in Home' })).toHaveAttribute('href', '/chat/#/home/w/flat');
    expect(inChat).toHaveTextContent('Its home is in Chat, under Homes. Its 2 people are met in Chat.');
    expect(screen.getByRole('radio', { name: /^A household\./ })).toBeChecked();

    // Saying it is a world brings the adventure back, and the file no longer says household.
    fireEvent.click(screen.getByRole('radio', { name: /^A world\./ }));
    expect(screen.getByRole('button', { name: 'Play in the adventure' })).toBeInTheDocument();
    expect('use' in latest).toBe(false);
    fireEvent.click(screen.getByRole('radio', { name: /^A household\./ }));
    expect(latest.use).toBe('household');
  });

  it('keeps the adventure\'s part on a scenario in a world that is played', () => {
    at('#/w/w?rec=house');
    render(<View start={world()} />);
    const doors = within(screen.getByRole('navigation', { name: 'More of The house' }));
    expect(doors.getByRole('button', { name: 'In the adventure' })).toBeInTheDocument();
    expect(doors.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});
