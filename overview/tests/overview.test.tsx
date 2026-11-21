// What the Overview picks from this browser's stores, and that showing it changes nothing.
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { newChat, type Chat } from '../../core/chat/index.js';
import { newRecord, newWorld, putRecord, type World } from '../../core/records/index.js';
import { NAVIGATION_KEY, withActivity, type NavigationV1 } from '../../kit/src/activity';
import { resortFrom } from '../../kit/src/included';
import resortFile from '../../content/dragons-resort/world.json';
import { App, type Readers } from '../src/App';
import { selectOverview, type Library, type SaveSummary } from '../src/select';
import { EMPTY_COLLECTION, patchMember } from '../../kit/src/collection';

// The house that comes with the site: the dragon's resort.
const houseWorld = (now: number) => resortFrom(resortFile, now);
const included = (id: string, name: string) => [name, 'Included', `/chat/#/with/dragons-resort/${id}`];
// Errata leads the house's three; the others follow as Chat orders them (A to Z).
const THREE = [included('errata', 'Errata'), included('echydna', 'Echydna'), included('qiulong', 'Qiulong')];

const none: NavigationV1 = { version: 1, recent: [] };
const ok = <T,>(value: T) => ({ state: 'ready' as const, value });

function lowWater(): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  const booth = { ...newRecord('place', 'booth', 'The Booth', ids) };
  const dee = { ...newRecord('character', 'dee', 'Dee Harlow', ids), line: 'The night clerk.' };
  return { ...putRecord(putRecord({ ...newWorld('low', 'Low Water', 1), premise: 'A ferry town in winter.' }, booth, 5), dee, 5), updatedAt: 5 };
}
const chatWith = (world: World, id: string, at: number): Chat => ({ ...newChat({ id, worldId: world.id, characterId: 'dee', characterName: 'Dee Harlow', personaId: null, scenarioId: null, userName: 'Ama', relationship: 'stranger', style: 'roleplay', responseLength: 'unspecified', greeting: null }, () => `m-${id}`, at), updatedAt: at });
const save: SaveSummary = { id: 'save-1', name: 'Abernys: Bogwater', moduleName: 'Abernys: Bogwater', place: 'The long fence', stamp: 'Day 2, morning', turns: 14, updatedAt: 9 };

function library(patch: Partial<Library> = {}): Library {
  return { worlds: ok([houseWorld(0)]), chats: ok([]), saves: ok([]), authoring: ok({}), navigation: none, house: houseWorld(0), ...patch };
}

describe('choosing what to show', () => {
  it('shows a first visit what comes with the site, and no Continue', () => {
    const view = selectOverview(library());
    expect(view.first).toBe(true);
    expect(view.continueWith).toBeNull();
    expect(view.characters.map((card) => [card.name, card.tag, card.href])).toEqual(THREE);
    // The households that come with the site are homes, never worlds to play.
    expect(view.worlds).toEqual([]);
    expect(view.homes.map((card) => [card.name, card.tag, card.href])).toEqual([
      ['Autumn\'s Leaves', 'Included', '/chat/#/home/dragons-resort/resort-arrival'],
      ['The House', 'Included', '/chat/#/home'],
    ]);
    expect(view.adventure).toMatchObject({ kind: 'example' });
  });

  it('says who is home and what they are doing, by each one\'s own clock, and keeps a household out of Worlds', () => {
    // Half past ten on a Friday morning, in the device's own zone.
    const now = new Date(2026, 8, 11, 10, 30).getTime();
    const view = selectOverview(library({ now }));
    const [resort] = view.homes;
    expect(resort!.people.map((person) => person.name)).toEqual(['Qiulong', 'Errata', 'Echydna']);
    for (const person of resort!.people) expect(person.says).not.toMatch(/\{\{|\$u\b/);
    expect(resort!.owner).toBe('dragons-resort:resort-arrival');
    expect(resort!.slots!.length).toBeGreaterThan(1);
    // A household the author made is a home of theirs, and is not listed as a world.
    let n = 0;
    const flat = putRecord({ ...newWorld('nine', 'Number Nine', 9), use: 'household' as const }, { ...newRecord('scenario', 'flat', 'The flat', () => `f-${++n}`), sets: [{ id: 'rooms', title: 'Rooms', reach: 'here' as const, active: 'r1', members: [{ id: 'r1', name: 'Main room', text: '', lock: null, layers: [] }] }] }, 9);
    const mine = selectOverview(library({ worlds: ok([houseWorld(0), flat]), now }));
    expect(mine.worlds).toEqual([]);
    expect(mine.homes.map((card) => [card.name, card.tag])).toEqual([['The flat', 'Your home'], ['Autumn\'s Leaves', 'Included']]);
    expect(mine.homes[0]).toMatchObject({ world: 'Number Nine', people: [], href: '/chat/#/home/nine/flat' });
    expect(mine.first).toBe(true);
  });

  it('continues a home that was opened, and puts it first', () => {
    const now = new Date(2026, 8, 11, 10, 30).getTime();
    const navigation = withActivity(none, { kind: 'home', worldId: 'dragons-resort', scenarioId: 'resort-arrival' }, 4);
    const view = selectOverview(library({ navigation, now }));
    expect(view.continueWith).toMatchObject({ label: 'Continue', title: 'Autumn\'s Leaves', href: '/chat/#/home/dragons-resort/resort-arrival', action: 'Open home' });
    expect(view.homes[0]).toMatchObject({ tag: 'Last visited' });
    // A home that is gone is not offered.
    expect(selectOverview(library({ worlds: ok([]), navigation: withActivity(none, { kind: 'home', worldId: 'gone', scenarioId: 'x' }, 4) })).continueWith).toBeNull();
  });

  it('offers a home that is not here from Chat\'s own list once the collection has been set up', () => {
    const collection = { ...EMPTY_COLLECTION, initialized: true };
    const view = selectOverview(library({ worlds: ok([]), collection }));
    expect(view.homes.map((card) => [card.name, card.href, card.action])).toEqual([
      ['Autumn\'s Leaves', '/chat/#/home', 'Bring it in from Homes'],
      ['The House', '/chat/#/home', 'Bring it in from Homes'],
    ]);
  });

  it('continues the newest place opened that still exists, skipping one since deleted', () => {
    const world = lowWater();
    let navigation = withActivity(none, { kind: 'adventure', saveId: 'save-1' }, 1);
    navigation = withActivity(navigation, { kind: 'studio', worldId: 'low', recordId: 'dee', door: 'errata' }, 2);
    navigation = withActivity(navigation, { kind: 'chat', chatId: 'deleted' }, 3);
    const view = selectOverview(library({ worlds: ok([houseWorld(0), world]), saves: ok([save]), navigation, authoring: ok({ low: { dee: { drafts: 2, settled: 3 } } }) }));
    expect(view.first).toBe(false);
    expect(view.continueWith).toEqual({ label: 'Continue', title: 'Dee Harlow', detail: 'Character in Low Water · 2 drafts waiting · 3 settled', href: '/studio/#/w/low?rec=dee&door=errata', action: 'Continue writing' });
    expect(view.worlds[0]).toMatchObject({ name: 'Low Water', tag: 'Last worked on', action: 'Continue writing', detail: 'Dee Harlow · 2 drafts waiting · 3 settled' });
    expect(view.adventure).toMatchObject({ kind: 'save', tag: 'Your last adventure', href: '/adventure/?save=save-1' });
  });

  it('sends a world with drafts waiting back to Errata\'s door on that record', () => {
    const view = selectOverview(library({ worlds: ok([lowWater()]), authoring: ok({ low: { dee: { drafts: 1, settled: 0 } } }) }));
    expect(view.worlds[0].href).toBe('/studio/#/w/low?rec=dee&door=errata');
    // Only the author's own: no household is put beside it as a world.
    expect(view.worlds.map((card) => card.tag)).toEqual(['Your world']);
  });

  it('puts recent conversations first, one card per character, then the house', () => {
    const world = lowWater();
    const view = selectOverview(library({ worlds: ok([houseWorld(0), world]), chats: ok([chatWith(world, 'a', 4), chatWith(world, 'b', 8)]) }));
    expect(view.characters.map((card) => [card.name, card.tag, card.href])).toEqual([
      ['Dee Harlow', 'Recent chat', '/chat/#/chat/b'],
      ...THREE.slice(0, 2),
    ]);
  });

  it('never calls a failed read an empty library', () => {
    const navigation = withActivity(none, { kind: 'chat', chatId: 'a' }, 1);
    const view = selectOverview(library({ chats: { state: 'error', message: 'blocked' }, saves: { state: 'error', message: 'blocked' }, navigation }));
    expect(view.failed).toEqual(['chats', 'saved games']);
    expect(view.continueWith).toBeNull();
    expect(view.adventure).toBeNull();
  });
  it('respects hidden and archived collection members in recommendations and Continue', () => {
    const world = lowWater(); const saved = chatWith(world, 'a', 4);
    let collection = patchMember(EMPTY_COLLECTION, world.id, 'dee', { state: 'hidden' });
    for (const id of ['qiulong', 'errata', 'echydna']) collection = patchMember(collection, 'dragons-resort', id, { state: 'archived' });
    const view = selectOverview(library({ worlds: ok([houseWorld(0), world]), chats: ok([saved]), collection, navigation: withActivity(none, { kind: 'chat', chatId: saved.id }, 5) }));
    expect(view.characters).toHaveLength(0);
    expect(view.continueWith).toBeNull();
  });
  it('does not resurrect a deleted bundled world after collection initialization', () => {
    const collection = { ...patchMember(EMPTY_COLLECTION, 'dragons-resort', 'errata', { state: 'active' }), initialized: true };
    expect(selectOverview(library({ worlds: ok([]), collection })).characters).toHaveLength(0);
  });
});

describe('the page', () => {
  const readers = (patch: Partial<Readers> = {}): Readers => ({
    worlds: async () => [houseWorld(0)], chats: async () => [], saves: async () => [], authoring: async () => ({}), house: () => houseWorld(0), ...patch,
  });

  it('greets a first visit and offers Errata, the homes that come with the site and the included adventure', async () => {
    render(<App readers={readers()} />);
    expect(await screen.findByRole('heading', { level: 1, name: /Characters who remember you/ })).toBeInTheDocument();
    const characters = within(await screen.findByRole('region', { name: 'Characters' }));
    expect(await characters.findByRole('link', { name: 'Meet Errata' })).toHaveAttribute('href', '/chat/#/with/dragons-resort/errata');
    const homes = within(screen.getByRole('region', { name: 'Homes' }));
    expect(homes.getByRole('link', { name: 'Open home' })).toHaveAttribute('href', '/chat/#/home/dragons-resort/resort-arrival');
    expect(homes.getByRole('link', { name: 'Bring it in from Homes' })).toHaveAttribute('href', '/chat/#/home');
    expect(homes.getByText(/A home is where the people you chat with live/)).toBeInTheDocument();
    expect(homes.getByText('Qiulong')).toBeInTheDocument();
    // Nothing that is a home is offered as a world, and the page says what a world is.
    const worlds = within(screen.getByRole('region', { name: 'Worlds' }));
    expect(worlds.queryByRole('link', { name: 'Look inside' })).toBeNull();
    expect(worlds.getByText(/played as an adventure\. You have none yet\./)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Continue' })).toBeNull();
  });

  it('offers one Continue to a returning visit, and writes nothing by being shown', async () => {
    window.localStorage.setItem(NAVIGATION_KEY, JSON.stringify(withActivity(none, { kind: 'adventure', saveId: 'save-1' }, 1)));
    const before = JSON.stringify({ ...window.localStorage });
    render(<App readers={readers({ saves: async () => [save] })} />);
    const strip = within(await screen.findByRole('region', { name: 'Continue' }));
    expect(strip.getByRole('link', { name: 'Continue adventure' })).toHaveAttribute('href', '/adventure/?save=save-1');
    expect(screen.getByRole('heading', { level: 1, name: 'Pick up the thread.' })).toBeInTheDocument();
    expect(JSON.stringify({ ...window.localStorage })).toBe(before);
  });

  it('says which store failed, and keeps the rest', async () => {
    render(<App readers={readers({ chats: async () => { throw new Error('blocked'); } })} />);
    expect(await screen.findByText(/couldn.t read your chats/)).toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Homes' })).getByRole('link', { name: 'Open home' })).toBeInTheDocument());
  });
});
