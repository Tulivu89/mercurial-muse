import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { newRecord, newWorld, putRecord, type World } from '../../core/records/index.js';
import { WorldView } from '../src/WorldView';
import { NOWHERE, formatRoute, parseRoute } from '../src/route';

vi.mock('../src/go', () => ({ go: vi.fn() }));

function world(): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  let next = { ...newWorld('w', 'Low Tide', 1), premise: 'A harbour town after midnight.' };
  const booth = { ...newRecord('place', 'booth', 'Booth B', ids), line: 'The night booth.' };
  const ada = { ...newRecord('character', 'ada', 'Ada Moss', ids), line: 'The voice of KXRT after midnight.' };
  ada.sections = ada.sections.map((section) => ({ ...section, text: section.title === 'Appearance' ? 'Forty, broad in the shoulders.' : section.title === 'Background' ? 'She left a morning show.' : '' }));
  next = putRecord(next, booth, 2);
  return putRecord(next, ada, 2);
}

// The list goes one level at a time: the world's own page, then a kind, then inside a place.
const rail = () => within(screen.getAllByRole('navigation', { name: 'Low Tide: records' }).at(-1)!);
const toWorld = () => {
  for (let up = rail().queryByRole('button', { name: /^‹ / }); up; up = rail().queryByRole('button', { name: /^‹ / })) fireEvent.click(up);
};
const toKind = (many: string) => {
  toWorld();
  fireEvent.click(rail().getByRole('button', { name: new RegExp(`^${many}: `) }));
};
const openRecord = (many: string, name: string) => {
  toKind(many);
  fireEvent.click(rail().getByRole('button', { name }));
};
// A record's other jobs are doors on its page.
const door = (name: string) => fireEvent.click(within(screen.getByRole('navigation', { name: /^More of / })).getByRole('button', { name }));

describe('addresses', () => {
  it('reads back what it wrote, and reads nonsense as the front door', () => {
    const route = { ...NOWHERE, worldId: 'low tide/1', kind: 'place' as const, inside: 'booth', rec: 'room-0', door: 'adventure' as const };
    expect(formatRoute(route)).toBe('#/w/low%20tide%2F1?kind=place&in=booth&rec=room-0&door=adventure');
    expect(parseRoute(formatRoute(route))).toEqual(route);
    // A part belongs to the Rules page, and a record's page outranks a world's.
    expect(parseRoute('#/w/w?page=rules&part=states')).toMatchObject({ page: 'rules', part: 'states', rec: null });
    expect(parseRoute('#/w/w?page=rules&rec=ada').page).toBeNull();
    expect(parseRoute('#/w/w?kind=dragons&door=cellar')).toEqual({ ...NOWHERE, worldId: 'w' });
    expect(parseRoute('#/somewhere')).toEqual(NOWHERE);
    expect(formatRoute(NOWHERE)).toBe('');
  });
});

describe('the world view', () => {
  it('lists records a level at a time and opens one into the page and the context panel', () => {
    render(<WorldView world={world()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    expect(rail().getByRole('button', { name: 'Characters: 1' })).toBeInTheDocument();
    toKind('Places');
    // Every row carries the record's line.
    expect(rail().getByRole('button', { name: 'Booth B' })).toHaveAccessibleDescription('The night booth.');
    openRecord('Characters', 'Ada Moss');
    expect(screen.getByRole('heading', { level: 1, name: 'Ada Moss' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/w/w?kind=character&rec=ada');

    const context = screen.getByRole('complementary', { name: 'In context now' });
    expect(within(context).getByText('Forty, broad in the shoulders.')).toBeInTheDocument();
    expect(within(context).queryByText('She left a morning show.')).toBeNull();
    fireEvent.change(within(context).getByLabelText('What was just said'), { target: { value: 'Tell me about Ada Moss.' } });
    expect(within(context).getByText('She left a morning show.')).toBeInTheDocument();
    // The moment is still set up after a visit to another door.
    door('Rules');
    expect(screen.queryByRole('complementary', { name: 'In context now' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Ada Moss' }));
    expect(within(screen.getByRole('complementary', { name: 'In context now' })).getByLabelText('What was just said')).toHaveValue('Tell me about Ada Moss.');
    // What was opened is kept for the world's own page.
    toWorld();
    expect(within(rail().getByRole('region', { name: 'Lately' })).getByRole('button', { name: 'Ada Moss' })).toBeInTheDocument();
  });

  it('opens on the record and the door its address names', () => {
    window.history.replaceState(null, '', '/#/w/w?kind=character&rec=ada&door=rules');
    render(<WorldView world={world()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Ada Moss' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Rules' })).getByText('Ada Moss is unhurt.')).toBeInTheDocument();
  });

  it('folds each section to a row of its title, its reach and its first words', () => {
    const onChange = vi.fn();
    render(<WorldView world={world()} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    openRecord('Characters', 'Ada Moss');
    const row = screen.getByRole('button', { name: 'Appearance, Here: open to write' });
    expect(row).toHaveTextContent('Forty, broad in the shoulders.');
    expect(screen.queryByLabelText('Appearance text')).toBeNull();
    fireEvent.click(row);
    fireEvent.change(screen.getByLabelText('Appearance text'), { target: { value: 'Forty, and tired.' } });
    const changed = onChange.mock.calls.at(-1)?.[0] as World;
    expect(changed.records.find((record) => record.id === 'ada')!.sections.find((section) => section.title === 'Appearance')!.text).toBe('Forty, and tired.');
    fireEvent.click(screen.getByRole('button', { name: 'Fold Appearance' }));
    expect(screen.queryByLabelText('Appearance text')).toBeNull();
  });

  it('sends edits up as a changed world', () => {
    const onChange = vi.fn();
    render(<WorldView world={world()} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    openRecord('Characters', 'Ada Moss');
    fireEvent.click(screen.getByText('Names and keys'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada Marsh' } });
    const changed = onChange.mock.calls.at(-1)?.[0] as World;
    expect(changed.records.find((record) => record.id === 'ada')?.name).toBe('Ada Marsh');
  });

  it('adds a schedule event from a time of day and draws it on the week', () => {
    const onChange = vi.fn();
    const { rerender } = render(<WorldView world={world()} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    openRecord('Characters', 'Ada Moss');
    door('Day');
    const schedule = screen.getByRole('region', { name: 'Schedule' });
    fireEvent.click(within(schedule).getByRole('tab', { name: /Fri/ }));
    fireEvent.click(within(schedule).getByRole('button', { name: 'Night' }));
    const changed = onChange.mock.calls.at(-1)?.[0] as World;
    const events = changed.records.find((record) => record.id === 'ada')!.schedule!.Friday!;
    expect(events).toMatchObject([{ startTime: 1320, endTime: 360, requiredIntimacy: 'none', sets: {}, rooms: {}, spots: {}, needs: {} }]);
    rerender(<WorldView world={changed} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    // It wraps past midnight, so it is drawn as two pieces.
    expect(screen.getByRole('region', { name: 'Schedule' }).querySelectorAll('.strip.on .block-bar')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("What they're doing"), { target: { value: 'On the air.' } });
    expect((onChange.mock.calls.at(-1)?.[0] as World).records.find((record) => record.id === 'ada')!.schedule!.Friday![0]!.text).toBe('On the air.');
  });
});

describe('rules on every record', () => {
  const open = (many: string, name: string) => {
    openRecord(many, name);
    door('Rules');
    return screen.getByRole('region', { name: 'Rules' });
  };

  it('shows what a player can do and how the states read, with nothing authored', () => {
    render(<WorldView world={world()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    const panel = open('Characters', 'Ada Moss');
    expect(within(panel).getByText('No tier · Average to act on · nothing set here.')).toBeInTheDocument();
    expect(within(panel).getByText('Lift, slip past or plant something')).toBeInTheDocument();
    expect(within(panel).getByText('Read them, find the pressure point')).toBeInTheDocument();
    expect(within(panel).getByText('Ada Moss is unhurt.')).toBeInTheDocument();
    expect(within(panel).getByLabelText('Difficulty by Force')).toHaveValue('2');
    // A place has its own: Alert, moved by Finesse, and by Flair off its home ground.
    expect(within(open('Places', 'Booth B')).getAllByText('Lie low, cover your tracks')).toHaveLength(2);
  });

  it('changes one value, sends its sentence to the context, and puts it back', () => {
    let current = world();
    const onChange = vi.fn((next: World) => { current = next; });
    const { rerender } = render(<WorldView world={current} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    const again = () => rerender(<WorldView world={current} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    let panel = open('Characters', 'Ada Moss');
    fireEvent.change(within(panel).getByLabelText('Health starts at'), { target: { value: '3' } });
    expect(current.records.find((record) => record.id === 'ada')!.rules).toEqual({ states: { health: 3 } });
    again();
    panel = screen.getByRole('region', { name: 'Rules' });
    expect(within(panel).getByText('Sent now')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Ada Moss' }));
    const context = screen.getByRole('complementary', { name: 'In context now' });
    expect(within(context).getByText('Ada Moss is hurt, bleeding and slowed, but still fighting.')).toBeInTheDocument();

    door('Rules');
    fireEvent.click(within(screen.getByRole('region', { name: 'Rules' })).getByRole('button', { name: 'Put back' }));
    expect(current.records.find((record) => record.id === 'ada')!.rules).toBeUndefined();
    again();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Ada Moss' }));
    expect(within(screen.getByRole('complementary', { name: 'In context now' })).queryByText(/Ada Moss is hurt/)).toBeNull();
  });

  it('changes the world\'s ruleset from its Rules page, and every record follows', () => {
    let current = world();
    const onChange = vi.fn((next: World) => { current = next; });
    const { rerender } = render(<WorldView world={current} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    const again = () => rerender(<WorldView world={current} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    const parts = () => within(screen.getByRole('navigation', { name: 'The parts of the rules' }));
    fireEvent.click(rail().getByRole('button', { name: /^Rules/ }));
    expect(screen.getByText('All standard')).toBeInTheDocument();
    // The page is a list of its parts; one opens on its own.
    expect(parts().getAllByRole('button')).toHaveLength(11);
    fireEvent.click(parts().getByRole('button', { name: /^The dice and rest/ }));
    fireEvent.change(screen.getByLabelText('How hard, when nothing else says'), { target: { value: '3' } });
    expect(current.rules?.dice).toEqual({ difficulty: 3 });
    again();
    // Only what's changed leaves the one changed line of this part, and the one changed part.
    expect(screen.getByLabelText('A full rest takes, in minutes')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Only what’s changed'));
    expect(screen.queryByLabelText('A full rest takes, in minutes')).toBeNull();
    expect(screen.getByLabelText('How hard, when nothing else says')).toHaveValue('3');
    fireEvent.click(screen.getByRole('button', { name: '‹ Rules' }));
    expect(screen.getByText('1 part changed in this world')).toBeInTheDocument();
    expect(parts().getAllByRole('button').map((button) => button.textContent)).toEqual([expect.stringMatching(/^The dice and rest.*1 changed$/)]);
    fireEvent.click(screen.getByLabelText('Only what’s changed'));
    fireEvent.click(parts().getByRole('button', { name: /^The approaches/ }));
    fireEvent.change(screen.getByLabelText('Force: its name'), { target: { value: 'Muscle' } });
    again();
    expect(current.rules?.approaches.map((approach) => approach.name)).toEqual(['Muscle']);
    const panel = open('Characters', 'Ada Moss');
    expect(within(panel).getByText('No tier · Hard to act on · nothing set here.')).toBeInTheDocument();
    expect(within(panel).getByLabelText('Difficulty by Muscle')).toHaveValue('3');
    expect(within(panel).getAllByText('This world').length).toBeGreaterThan(0);
  });
});

describe('the launchpad', () => {
  it('hands a world to the adventure as a module and opens it there', async () => {
    const { go } = await import('../src/go');
    render(<WorldView world={world()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    fireEvent.click(rail().getByRole('button', { name: /^About/ }));
    // No persona yet, and the page says what the adventure will do about it.
    expect(screen.getByText(/no persona, so the player is a plain traveller/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play in the adventure' }));
    const sent = JSON.parse(window.localStorage.getItem('inkwyrm.launch')!) as { id: string; name: string; module: { format: string; characters: { id: string }[]; scenario: { startPlaceId: string } } }[];
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ id: 'w', name: 'Low Tide', module: { format: 'adventure-module/1', scenario: { startPlaceId: 'booth' } } });
    expect(sent[0]!.module.characters.map((person) => person.id)).toEqual(['ada', 'the-player']);
    expect(go).toHaveBeenCalledWith('/?launch=w');
  });

  it('links a character to Chat', () => {
    render(<WorldView world={world()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    openRecord('Characters', 'Ada Moss');
    expect(screen.getByRole('link', { name: 'Chat with Ada Moss' })).toHaveAttribute('href', '/chat/#/with/w/ada');
    // The same link is behind the Chat door, with the greetings.
    door('Chat');
    expect(screen.getAllByRole('link', { name: 'Chat with Ada Moss' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Add a greeting' })).toBeInTheDocument();
  });
});

describe('what the adventure needs', () => {
  const view = () => {
    let current = world();
    const onChange = vi.fn((next: World) => { current = next; });
    const { rerender } = render(<WorldView world={current} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    return { get: () => current, again: () => rerender(<WorldView world={current} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />) };
  };

  it('puts a part of someone\'s day at a place, behind a condition', () => {
    const { get, again } = view();
    openRecord('Characters', 'Ada Moss');
    door('Day');
    fireEvent.click(within(screen.getByRole('region', { name: 'Schedule' })).getByRole('button', { name: 'Night' }));
    again();
    // The picker: a button, then a sheet to search and choose from.
    fireEvent.click(screen.getByRole('button', { name: /^\w+ [\d:]+.*: where: No place$/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: /: where: search$/ }), { target: { value: 'boo' } });
    fireEvent.click(screen.getByRole('option', { name: /Booth B/ }));
    again();
    fireEvent.change(screen.getByLabelText(/^\w+ [\d:]+.*: weekday$/), { target: { value: '5' } });
    expect(Object.values(get().records.find((record) => record.id === 'ada')!.schedule!).flat()[0]).toMatchObject({ startTime: 1320, place: 'booth', when: { weekday: 5 } });
    again();
    expect(screen.getByText('Only on Friday')).toBeInTheDocument();
    // The door's row says it, and so does the top of what is behind the door.
    expect(screen.getAllByText(/1 stop in their day/)).toHaveLength(2);
  });

  it('joins two places with a route, and finds one that ends nowhere', () => {
    const { get, again } = view();
    toKind('Places');
    fireEvent.click(rail().getByRole('button', { name: 'Add a place' }));
    again();
    fireEvent.click(rail().getByRole('button', { name: 'Booth B' }));
    door('In the adventure');
    fireEvent.click(screen.getByRole('button', { name: 'Add a route from here' }));
    expect(get().routes).toMatchObject([{ from: 'booth', distanceKm: 1, requires: [] }]);
    again();
    expect(screen.getAllByText(/1 way out: New place/)).toHaveLength(2);
    toWorld();
    expect(rail().getByRole('button', { name: /^Checks/ })).toHaveTextContent('All clear');
    // The other end is deleted: the Checks page says so.
    const far = get().routes![0]!.to;
    const without = { ...get(), records: get().records.filter((record) => record.id !== far) };
    render(<WorldView world={without} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    const checks = rail().getByRole('button', { name: /^Checks/ });
    expect(checks).toHaveTextContent('1 to look at');
    fireEvent.click(checks);
    expect(screen.getByText(/A route ends at a place that is gone/)).toBeInTheDocument();
  });

  it('marks the record a finding is about, in the list', () => {
    const base = world();
    const flawed = { ...base, records: base.records.map((record) => (record.id === 'ada' ? { ...record, sections: record.sections.map((section, index) => (index === 0 ? { ...section, reach: 'when' as const, when: null } : section)) } : record)) };
    render(<WorldView world={flawed} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    expect(rail().getByRole('button', { name: /^Checks/ })).toHaveTextContent('1 to look at');
    toKind('Characters');
    expect(rail().getByRole('button', { name: 'Ada Moss' })).toHaveTextContent('to check');
  });

  it('writes a scene action and a calendar on the Rules page', () => {
    const { get, again } = view();
    fireEvent.click(rail().getByRole('button', { name: /^Rules/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Scene actions/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Add a scene action' }));
    again();
    fireEvent.change(screen.getByLabelText('Action name'), { target: { value: 'Work a shift' } });
    again();
    fireEvent.click(within(screen.getByRole('group', { name: /offered at/i })).getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('option', { name: /Booth B/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(get().rules?.actions).toMatchObject([{ name: 'Work a shift', placeIds: ['booth'], effects: [{ stateId: 'coin', add: 1 }] }]);
    again();
    fireEvent.click(screen.getByRole('button', { name: '‹ Rules' }));
    fireEvent.click(screen.getByRole('button', { name: /^The calendar and travel/ }));
    fireEvent.change(screen.getByLabelText('The days of the week'), { target: { value: 'Oneday, Twoday, Restday' } });
    expect(get().rules?.calendar?.dayNames).toEqual(['Oneday', 'Twoday', 'Restday']);
  });
});

describe('a world with many records', () => {
  const crowd = (): World => {
    const base = world();
    const rooms = ['Zinc room', 'The archive', 'Back room', 'attic'].map((name, index) => ({ ...base.records.find((record) => record.id === 'booth')!, id: `room-${index}`, name, parentId: 'booth' }));
    return { ...base, records: [...base.records, ...rooms] };
  };

  it('goes into a place for what is inside it, A to Z, and finds a record by name, key or line', () => {
    render(<WorldView world={crowd()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    toKind('Places');
    const names = (label: string) => within(rail().getByRole('region', { name: label })).getAllByRole('button').map((button) => button.querySelector('.item-name')?.textContent).filter(Boolean);
    // Only the top places, each saying how many it holds.
    expect(names('Places')).toEqual(['Booth B']);
    fireEvent.click(rail().getByRole('button', { name: 'Inside Booth B: 4 places' }));
    // "The" doesn't count, and case doesn't either.
    expect(names('Inside Booth B')).toEqual(['The archive', 'attic', 'Back room', 'Zinc room']);
    expect(window.location.hash).toBe('#/w/w?kind=place&in=booth');
    // The trail leads back out.
    fireEvent.click(within(rail().getByRole('navigation', { name: 'Where Booth B is' })).getByRole('button', { name: 'Places' }));
    expect(names('Places')).toEqual(['Booth B']);

    fireEvent.change(rail().getByRole('searchbox', { name: 'Find a record' }), { target: { value: 'room' } });
    const found = () => within(rail().getByRole('region', { name: 'Found' })).getAllByRole('button').map((button) => button.textContent);
    expect(found()).toEqual(['Back roomPlace · in Booth B', 'Zinc roomPlace · in Booth B']);
    // Every kind at once, and by the words of the line when the name doesn't have them.
    fireEvent.change(rail().getByRole('searchbox', { name: 'Find a record' }), { target: { value: 'kxrt' } });
    expect(found()).toEqual(['Ada MossCharacter · The voice of KXRT after midnight.']);
    // Clearing it puts the list back where it was.
    fireEvent.change(rail().getByRole('searchbox', { name: 'Find a record' }), { target: { value: '' } });
    expect(names('Places')).toEqual(['Booth B']);
  });

  it('picks a place from a sheet that searches, shows where each place is, and says when nothing matches', () => {
    let current = crowd();
    render(<WorldView world={current} onChange={(next) => { current = next; }} onDelete={() => {}} onStatus={() => {}} status={null} />);
    toKind('Places');
    fireEvent.click(rail().getByRole('button', { name: 'Inside Booth B: 4 places' }));
    fireEvent.click(rail().getByRole('button', { name: 'Zinc room' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inside: Booth B' }));
    const sheet = within(screen.getByRole('dialog', { name: 'Inside' }));
    expect(sheet.getByRole('option', { name: /The archive in Booth B/ })).toBeInTheDocument();
    fireEvent.change(sheet.getByRole('searchbox'), { target: { value: 'nothing like it' } });
    expect(sheet.getByText('Nothing called that.')).toBeInTheDocument();
    fireEvent.change(sheet.getByRole('searchbox'), { target: { value: 'arch' } });
    fireEvent.keyDown(sheet.getByRole('searchbox'), { key: 'Enter' });
    expect(current.records.find((record) => record.id === 'room-0')!.parentId).toBe('room-1');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('the map', () => {
  // A small town: a region holding two villages, one of them with an inn of two rooms.
  const town = (): World => {
    let n = 0;
    const ids = () => `m-${++n}`;
    const place = (id: string, name: string, kind: string, parentId: string | null) => ({ ...newRecord('place', id, name, ids), parentId, rules: { placeKind: kind as never } });
    let next = newWorld('t', 'Saltmarsh', 1);
    for (const record of [
      place('marsh', 'The marsh', 'region', null),
      place('ferry', 'Ferry End', 'village', 'marsh'),
      place('inn', 'The Lamp', 'building', 'ferry'),
      place('tap', 'The taproom', 'building', 'inn'),
      place('loft', 'The loft', 'building', 'inn'),
      place('reach', 'Long Reach', 'village', 'marsh'),
    ]) next = putRecord(next, record, 2);
    return next;
  };

  it('lays the world out with no setup, opens a place\'s ground, and times a trip leg by leg', () => {
    window.location.hash = '#/w/t?page=map';
    render(<WorldView world={town()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Map' })).toBeInTheDocument();
    expect(screen.getByText(/6 places on 3 sheets/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Saltmarsh: every place as circles' })).toBeInTheDocument();
    // Times are measured from the first place you can stand in, and listed nearest first.
    const from = within(screen.getByRole('region', { name: /^From / }));
    fireEvent.click(from.getByRole('button', { name: /^Long Reach/ }));
    expect(within(screen.getByRole('region', { name: 'Long Reach' })).getByText('Across the marsh: Ferry End to Long Reach')).toBeInTheDocument();
    fireEvent.click(from.getByRole('button', { name: /^The taproom/ }));
    const card = within(screen.getByRole('region', { name: 'The taproom' }));
    expect(card.getByText('From Ferry End into the Lamp')).toBeInTheDocument();
    fireEvent.click(card.getByRole('button', { name: 'See it on the ground' }));
    expect(window.location.hash).toBe('#/w/t?page=map&sheet=inn');
    expect(screen.getByRole('img', { name: 'The Lamp: what is inside it, as hex ground' })).toBeInTheDocument();
    expect(screen.getByText(/One cell is the Lamp itself/)).toBeInTheDocument();
  });

  it('sets a level\'s typical trip on the Rules page, and only that is stored', () => {
    let current = town();
    window.location.hash = '#/w/t?page=rules&part=travel';
    const view = render(<WorldView world={current} onChange={(next) => { current = next; }} onDelete={() => {}} onStatus={() => {}} status={null} />);
    fireEvent.change(screen.getByLabelText('A region: a typical trip across'), { target: { value: '2' } });
    expect(current.rules?.levels).toEqual({ region: { across: 120 } });
    view.rerender(<WorldView world={current} onChange={(next) => { current = next; }} onDelete={() => {}} onStatus={() => {}} status={null} />);
    expect(screen.getByLabelText('A region: a typical trip across: unit')).toHaveValue('h');
  });
});
