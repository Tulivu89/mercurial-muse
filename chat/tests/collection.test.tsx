import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { newChat } from '../../core/chat/index.js';
import { newRecord, newWorld, putRecord } from '../../core/records/index.js';
import {
  characterKey,
  collectionCharacters,
  EMPTY_COLLECTION,
  initializeCollection,
  latestChat,
  loadCollection,
  memberFor,
  parseCollection,
  patchMember,
  saveCollection,
} from '../../kit/src/collection';
import { animatedBytes, MediaImage } from '../../kit/src/media';
import { houseWorld } from '../src/errata';
import { Home } from '../src/Home';

const house = houseWorld(1);
const bog = putRecord(
  putRecord(
    newWorld('bog', 'Bogwater', 1),
    newRecord('character', 'morwen', 'Morwen', () => 's'),
    2,
  ),
  newRecord('character', 'ellis', 'Ellis', () => 's'),
  2,
);
const chat = (id: string, characterId: string, at: number) =>
  newChat(
    {
      id,
      worldId: bog.id,
      characterId,
      characterName: characterId,
      personaId: null,
      scenarioId: null,
      userName: 'Reader',
      relationship: 'stranger',
      style: 'roleplay',
      responseLength: 'unspecified',
      greeting: null,
    },
    () => 'm',
    at,
  );
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

describe('personal collection membership', () => {
  it('migrates individual imports and established chats, without enrolling a world cast', () => {
    const imported = { ...bog, id: 'inkwyrm-imports' };
    const saved = initializeCollection(EMPTY_COLLECTION, [house, bog, imported], [chat('c1', 'morwen', 1)]);
    expect(
      collectionCharacters([house, bog], [], saved)
        .map((c) => c.record.name)
        .sort(),
    ).toEqual(['Errata', 'Morwen']);
    expect(memberFor(saved, bog, bog.records[1]!, [chat('new', 'ellis', 2)])).toBeNull();
    expect(memberFor(saved, imported, imported.records[1]!)?.state).toBe('active');
    expect(bog.records.every((record) => record.chatListed === undefined)).toBe(true);
  });
  it('respects removal and archive even when an author lists a character or another chat opens', () => {
    const record = { ...bog.records[0]!, chatListed: true };
    let saved = patchMember(EMPTY_COLLECTION, bog.id, record.id, { state: 'hidden' });
    saved = initializeCollection(saved, [bog], [chat('old', record.id, 1)]);
    expect(memberFor(saved, bog, record)?.state).toBe('hidden');
    expect(collectionCharacters([bog], [chat('new', record.id, 2)], saved)).toHaveLength(0);
    saved = patchMember(saved, bog.id, record.id, { state: 'archived' });
    expect(collectionCharacters([bog], [], saved)).toHaveLength(0);
  });
  it('uses world and record identity, preserves chosen conversations, and validates personal data', () => {
    const other = { ...bog, id: 'other' };
    const saved = patchMember(EMPTY_COLLECTION, bog.id, 'morwen', {
      state: 'active',
      lastChatId: 'chosen',
      x: 500,
      y: -20,
    });
    expect(characterKey(bog.id, 'morwen')).not.toBe(characterKey(other.id, 'morwen'));
    const read = parseCollection(saved);
    expect(read.members[characterKey(bog.id, 'morwen')]).toMatchObject({ x: 100, y: 0 });
    expect(
      latestChat(
        [chat('chosen', 'morwen', 1), chat('autosaved', 'morwen', 20)],
        bog.id,
        'morwen',
        read.members[characterKey(bog.id, 'morwen')],
      )?.id,
    ).toBe('chosen');
    expect(parseCollection({ version: 400, members: {} })).toEqual(EMPTY_COLLECTION);
  });
});

function gallery() {
  const onStart = vi.fn();
  const onOpen = vi.fn();
  const view = render(
    <Home
      worlds={[house, bog]}
      chats={[]}
      portraits={{}}
      status={null}
      userName="Reader"
      onOpen={onOpen}
      onStart={onStart}
      onImport={() => {}}
    />,
  );
  return { ...view, onStart, onOpen };
}

describe('gallery controls', () => {
  it('adds one NPC without copying a world or creating a conversation, and archives reversibly', () => {
    const { onStart, onOpen } = gallery();
    expect(screen.queryByRole('article', { name: 'Morwen' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add characters' }));
    const picker = screen.getByRole('dialog', { name: 'Add characters' });
    fireEvent.change(within(picker).getByLabelText('Find in world cast'), { target: { value: 'Morwen' } });
    fireEvent.click(within(picker).getByRole('button', { name: 'Add to Chat' }));
    fireEvent.click(within(picker).getByRole('button', { name: 'Close' }));
    const card = screen.getByRole('article', { name: 'Morwen' });
    expect(screen.getByRole('article', { name: 'Errata' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Ellis' })).toBeNull();
    expect(onStart).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(within(card).getByRole('button', { name: 'Favorite Morwen' }));
    expect(loadCollection().members[characterKey(bog.id, 'morwen')]?.favorite).toBe(true);
    fireEvent.click(within(card).getByRole('button', { name: 'Manage Morwen' }));
    const manage = screen.getByRole('dialog');
    fireEvent.click(within(manage).getByRole('button', { name: 'Archive' }));
    fireEvent.click(within(manage).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('article', { name: 'Morwen' })).toBeNull();
    fireEvent.change(screen.getByLabelText('Shelf'), { target: { value: 'archived' } });
    fireEvent.click(screen.getByRole('button', { name: 'Manage Morwen' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Unarchive' }));
    expect(loadCollection().members[characterKey(bog.id, 'morwen')]?.state).toBe('active');
  });
  it('saves collection names and shelves, framing and display preferences', () => {
    const { container } = gallery();
    fireEvent.click(screen.getByRole('button', { name: 'Organize' }));
    const organize = screen.getByRole('dialog');
    fireEvent.change(within(organize).getByLabelText('Collection name'), {
      target: { value: 'The Menagerie' },
    });
    fireEvent.click(within(organize).getByRole('button', { name: 'Save name' }));
    fireEvent.change(within(organize).getByLabelText('New shelf'), { target: { value: 'Companions' } });
    fireEvent.click(within(organize).getByRole('button', { name: 'Add shelf' }));
    fireEvent.click(within(organize).getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('heading', { level: 1, name: 'The Menagerie' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Manage Errata' }));
    const manage = screen.getByRole('dialog');
    fireEvent.click(within(manage).getByLabelText('Companions'));
    fireEvent.change(within(manage).getByLabelText('Image fit'), { target: { value: 'contain' } });
    fireEvent.click(within(manage).getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Display options' }));
    const options = screen.getByRole('dialog');
    fireEvent.change(within(options).getByLabelText('Card size'), { target: { value: 'large' } });
    fireEvent.change(within(options).getByLabelText('Animated images'), { target: { value: 'still' } });
    fireEvent.click(within(options).getByLabelText('Show character descriptions'));
    fireEvent.click(within(options).getByRole('button', { name: 'Close' }));
    expect(container.querySelector('.character-gallery')).toHaveAttribute('data-size', 'large');
    expect(container.querySelector('.card-description')).toBeNull();
    const saved = loadCollection();
    expect(saved.display.motion).toBe('still');
    expect(saved.members[characterKey(house.id, 'errata')]).toMatchObject({
      fit: 'contain',
      shelves: [saved.shelves[0]!.id],
    });
  });
});

describe('animation preservation and playback', () => {
  it('keeps automatic playback off for reduced motion, with an explicit play control', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    saveCollection({ ...EMPTY_COLLECTION, display: { ...EMPTY_COLLECTION.display, motion: 'visible' } });
    const src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    const poster = 'data:image/webp;base64,poster';
    const { container } = render(
      <MediaImage src={src} poster={poster} animated active controls alt="Errata" />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', poster);
    fireEvent.pointerEnter(container.querySelector('.media-image')!);
    expect(container.querySelector('img')).toHaveAttribute('src', poster);
    fireEvent.click(screen.getByRole('button', { name: 'Play animation' }));
    expect(container.querySelector('img')).toHaveAttribute('src', src);
  });
  it('recognizes APNG and WebP animation chunks without confusing ordinary still images', () => {
    const png = new Uint8Array(28);
    png.set([97, 99, 84, 76], 12);
    const webp = new Uint8Array(24);
    webp.set([65, 78, 73, 77], 12);
    expect(animatedBytes(png, 'image/png')).toBe(true);
    expect(animatedBytes(webp, 'image/webp')).toBe(true);
    expect(animatedBytes(new Uint8Array(5), 'image/png')).toBe(false);
    expect(animatedBytes(new Uint8Array(5), 'image/jpeg')).toBe(false);
  });
  it('uses a poster in Still mode and supports explicit play and pause', () => {
    saveCollection({ ...EMPTY_COLLECTION, display: { ...EMPTY_COLLECTION.display, motion: 'still' } });
    const src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    const poster = 'data:image/webp;base64,poster';
    const { container } = render(
      <MediaImage src={src} poster={poster} animated active controls alt="Errata" />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', poster);
    fireEvent.click(screen.getByRole('button', { name: 'Play animation' }));
    expect(container.querySelector('img')).toHaveAttribute('src', src);
    fireEvent.click(screen.getByRole('button', { name: 'Pause animation' }));
    expect(container.querySelector('img')).toHaveAttribute('src', poster);
  });
});
