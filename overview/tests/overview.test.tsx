// What the Overview picks from this browser's stores, and that showing it changes nothing.
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { newChat, type Chat } from '../../core/chat/index.js';
import { newRecord, newWorld, putRecord, type World } from '../../core/records/index.js';
import { NAVIGATION_KEY, withActivity, type NavigationV1 } from '../../kit/src/activity';
import { houseWorld } from '../../chat/src/errata';
import { App, type Readers } from '../src/App';
import { selectOverview, type Library, type SaveSummary } from '../src/select';
import { EMPTY_COLLECTION, patchMember } from '../../kit/src/collection';

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
    expect(view.characters.map((card) => [card.name, card.tag, card.href])).toEqual([['Errata', 'Included', '/chat/#/with/inkwyrm-house/errata']]);
    expect(view.worlds.map((card) => [card.name, card.tag])).toEqual([['Abernys: Bogwater', 'Included'], ['Abernys: Port Covenant', 'Included']]);
    expect(view.adventure).toMatchObject({ kind: 'example' });
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
    expect(view.adventure).toMatchObject({ kind: 'save', tag: 'Your last adventure', href: '/?save=save-1' });
  });

  it('sends a world with drafts waiting back to Errata\'s door on that record', () => {
    const view = selectOverview(library({ worlds: ok([lowWater()]), authoring: ok({ low: { dee: { drafts: 1, settled: 0 } } }) }));
    expect(view.worlds[0].href).toBe('/studio/#/w/low?rec=dee&door=errata');
    // One personal world, then one example to fill the panel.
    expect(view.worlds.map((card) => card.tag)).toEqual(['Your world', 'Included']);
  });

  it('puts recent conversations first, one card per character, then Errata', () => {
    const world = lowWater();
    const view = selectOverview(library({ worlds: ok([houseWorld(0), world]), chats: ok([chatWith(world, 'a', 4), chatWith(world, 'b', 8)]) }));
    expect(view.characters.map((card) => [card.name, card.tag, card.href])).toEqual([
      ['Dee Harlow', 'Recent chat', '/chat/#/chat/b'],
      ['Errata', 'Included', '/chat/#/with/inkwyrm-house/errata'],
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
    collection = patchMember(collection, 'inkwyrm-house', 'errata', { state: 'archived' });
    const view = selectOverview(library({ worlds: ok([houseWorld(0), world]), chats: ok([saved]), collection, navigation: withActivity(none, { kind: 'chat', chatId: saved.id }, 5) }));
    expect(view.characters).toHaveLength(0);
    expect(view.continueWith).toBeNull();
  });
  it('does not resurrect a deleted bundled world after collection initialization', () => {
    const collection = { ...patchMember(EMPTY_COLLECTION, 'inkwyrm-house', 'errata', { state: 'active' }), initialized: true };
    expect(selectOverview(library({ worlds: ok([]), collection })).characters).toHaveLength(0);
  });
});

describe('the page', () => {
  const readers = (patch: Partial<Readers> = {}): Readers => ({
    worlds: async () => [houseWorld(0)], chats: async () => [], saves: async () => [], authoring: async () => ({}), house: () => houseWorld(0), ...patch,
  });

  it('greets a first visit and offers Errata, the examples and the included adventure', async () => {
    render(<App readers={readers()} />);
    expect(await screen.findByRole('heading', { level: 1, name: /Characters who remember you/ })).toBeInTheDocument();
    const characters = within(await screen.findByRole('region', { name: 'Characters' }));
    expect(await characters.findByRole('link', { name: 'Meet Errata' })).toHaveAttribute('href', '/chat/#/with/inkwyrm-house/errata');
    expect(within(screen.getByRole('region', { name: 'Worlds' })).getAllByRole('link', { name: 'Look inside' })[0]).toHaveAttribute('href', '/studio/#/bring/bogwater');
    expect(screen.queryByRole('region', { name: 'Continue' })).toBeNull();
  });

  it('offers one Continue to a returning visit, and writes nothing by being shown', async () => {
    window.localStorage.setItem(NAVIGATION_KEY, JSON.stringify(withActivity(none, { kind: 'adventure', saveId: 'save-1' }, 1)));
    const before = JSON.stringify({ ...window.localStorage });
    render(<App readers={readers({ saves: async () => [save] })} />);
    const strip = within(await screen.findByRole('region', { name: 'Continue' }));
    expect(strip.getByRole('link', { name: 'Continue adventure' })).toHaveAttribute('href', '/?save=save-1');
    expect(screen.getByRole('heading', { level: 1, name: 'Pick up the thread.' })).toBeInTheDocument();
    expect(JSON.stringify({ ...window.localStorage })).toBe(before);
  });

  it('says which store failed, and keeps the rest', async () => {
    render(<App readers={readers({ chats: async () => { throw new Error('blocked'); } })} />);
    expect(await screen.findByText(/couldn.t read your chats/)).toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Worlds' })).getAllByRole('link', { name: 'Look inside' })).toHaveLength(2));
  });
});
