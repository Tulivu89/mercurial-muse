import { useLayoutEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { EMOTIONS, lastLine, type Chat } from '../../core/chat/index.js';
import type { StoryRecord, World } from '../../core/records/index.js';
import {
  characterKey,
  freshMember,
  latestChat,
  loadCollection,
  memberFor,
  patchMember,
  saveCollection,
  useCollection,
  type Collection,
  type Member,
} from '../../kit/src/collection';
import { IMAGE_TYPES, MediaImage, animationSlot, posterSlot } from '../../kit/src/media';
import '../../kit/src/media.css';
import { Sheet } from '../../kit/src/Sheet';
import { clock, newId } from '../../kit/src/util';
import { InkMark } from '../../kit/src/Mark';
import { loadNavigation } from '../../kit/src/activity';
import { portraitOwner, type PortraitSet } from './store';
import { Portrait } from './Portrait';
import type { Cast } from './Home';
import './collection.css';

export const characterHref = (worldId: string, recordId: string) =>
  `#/character/${encodeURIComponent(worldId)}/${encodeURIComponent(recordId)}`;
const studioHref = ({ world, record }: Cast) =>
  `/studio/#/w/${encodeURIComponent(world.id)}?rec=${encodeURIComponent(record.id)}`;
const keyOf = ({ world, record }: Cast) => characterKey(world.id, record.id);
const positions = new Map<string, number>();
const searches = new Map<string, string>();
const animatedArtwork = (set: PortraitSet = {}) => {
  const slot = set.cover ? 'cover' : set.avatar ? 'avatar' : 'neutral';
  return set[animationSlot(slot)] === 'true' || /^data:image\/gif[;,]/i.test(set[slot] ?? '');
};

export interface CollectionViewProps {
  worlds: World[] | null;
  chats: Chat[] | null;
  portraits: Record<string, PortraitSet>;
  mode?: 'collection' | 'conversations';
  profile?: { worldId: string; recordId: string };
  onOpen: (id: string) => void;
  onNewChat: (cast: Cast) => void;
  onImport: (file: File) => void;
  onPortrait?: (owner: string, slot: string, file: File | null) => void;
  onCreate?: (name: string) => Promise<void>;
  onBackup?: () => void;
}

export function CollectionView({
  worlds,
  chats,
  portraits,
  mode = 'collection',
  profile,
  onOpen,
  onNewChat,
  onImport,
  onPortrait,
  onCreate,
  onBackup,
}: CollectionViewProps) {
  const collection = useCollection();
  const cast = useMemo(
    () =>
      (worlds ?? []).flatMap((world) =>
        world.records.filter((record) => record.kind === 'character').map((record) => ({ world, record })),
      ),
    [worlds],
  );
  const [query, setQuery] = useState(() => searches.get(mode) ?? '');
  const search = (value: string) => {
    setQuery(value);
    searches.set(mode, value);
  };
  const viewKey = profile ? characterKey(profile.worldId, profile.recordId) : mode;
  useLayoutEffect(() => {
    if (!profile) setQuery(searches.get(mode) ?? '');
    const top = profile ? 0 : positions.get(mode) ?? 0;
    let restored = false;
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, top);
      restored = true;
    });
    return () => {
      cancelAnimationFrame(frame);
      if (!profile && restored) positions.set(mode, window.scrollY);
    };
  }, [viewKey]);
  const [castQuery, setCastQuery] = useState('');
  const [sheet, setSheet] = useState<'add' | 'display' | 'organize' | 'create' | null>(null);
  const [manage, setManage] = useState<Cast | null>(null);
  const [chooseChats, setChooseChats] = useState<Cast | null>(null);
  const [worldFilter, setWorldFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState(collection.title);
  const [shelfName, setShelfName] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [profileTab, setProfileTab] = useState<'about' | 'chats' | 'images'>('about');
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<Record<string, boolean>>({});
  const change = (edit: (current: Collection) => Collection) => {
    try {
      saveCollection(edit(loadCollection()));
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The collection could not be saved.');
    }
  };
  const member = (entry: Cast) => memberFor(collection, entry.world, entry.record, chats ?? []);
  const patch = (entry: Cast, value: Partial<Member>) =>
    change((current) =>
      patchMember(current, entry.world.id, entry.record.id, {
        ...(member(entry) ?? freshMember(Object.keys(current.members).length)),
        ...value,
      }),
    );
  const ownChats = (entry: Cast) =>
    (chats ?? []).filter((chat) => chat.worldId === entry.world.id && chat.characterId === entry.record.id);
  const recent = (entry: Cast) => latestChat(chats ?? [], entry.world.id, entry.record.id, member(entry));
  const searchMatch = (entry: Cast, value: string) =>
    !value.trim() ||
    [entry.record.name, entry.record.line, entry.world.name, ...entry.record.tags]
      .join(' ')
      .toLocaleLowerCase()
      .includes(value.trim().toLocaleLowerCase());
  const matches = (entry: Cast) => searchMatch(entry, query);
  const ordered = [...cast].sort((a, b) => {
    const am = member(a);
    const bm = member(b);
    if (collection.display.sort === 'name') return a.record.name.localeCompare(b.record.name);
    if (collection.display.sort === 'recent')
      return (
        (recent(b)?.updatedAt ?? 0) - (recent(a)?.updatedAt ?? 0) ||
        a.record.name.localeCompare(b.record.name)
      );
    return (
      Number(bm?.favorite ?? false) - Number(am?.favorite ?? false) ||
      (am?.order ?? 0) - (bm?.order ?? 0) ||
      a.record.name.localeCompare(b.record.name)
    );
  });
  const active = ordered.filter((entry) => member(entry)?.state === 'active');
  const visible = ordered.filter((entry) => {
    const m = member(entry);
    const shelf = collection.display.shelf;
    return (
      m &&
      (shelf === 'archived'
        ? m.state === 'archived'
        : m.state === 'active' &&
          (shelf === 'all' || (shelf === 'favorites' ? m.favorite : m.shelves.includes(shelf)))) &&
      matches(entry)
    );
  });
  const profileCast = profile
    ? cast.find((entry) => entry.world.id === profile.worldId && entry.record.id === profile.recordId)
    : undefined;
  const moveGroup = (entry: Cast) =>
    active.filter((item) => member(item)?.favorite === member(entry)?.favorite);
  const movePosition = (entry: Cast) => moveGroup(entry).findIndex((item) => keyOf(item) === keyOf(entry));
  const move = (entry: Cast, direction: number) => {
    const group = moveGroup(entry);
    const at = movePosition(entry);
    const next = at + direction;
    if (at < 0 || next < 0 || next >= group.length) return;
    const reordered = [...group];
    reordered.splice(next, 0, reordered.splice(at, 1)[0]!);
    change((current) =>
      reordered.reduce<Collection>(
        (value, item, order) =>
          patchMember(value, item.world.id, item.record.id, { ...(member(item) ?? freshMember()), order }),
        { ...current, display: { ...current.display, sort: 'manual' } },
      ),
    );
  };
  const returnFocus = () => {
    const key = manage ? encodeURIComponent(keyOf(manage)) : '';
    setManage(null);
    requestAnimationFrame(() => document.getElementById(`manage-${key}`)?.focus());
  };
  const upload = (owner: string, slot: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onPortrait?.(owner, slot, file);
  };
  const selected = manage ?? profileCast;
  const artwork = (entry: Cast) => {
    const owner = portraitOwner(entry.world.id, entry.record.id);
    const set = portraits[owner] ?? {};
    return (
      <section className="character-artwork" aria-label="Character images">
        <h2>Images</h2>
        <p className="hint">
          GIF, animated WebP and APNG originals keep their animation. Gallery cover and avatar can be
          different pictures.
        </p>
        <div className="art-slots">
          {['cover', 'avatar', ...EMOTIONS].map((slot) => (
            <div className="art-slot" key={slot}>
              {set[slot] ? (
                <MediaImage
                  src={set[slot]!}
                  poster={set[posterSlot(slot)]}
                  animated={set[animationSlot(slot)] === 'true'}
                  alt={`${entry.record.name}: ${slot}`}
                  controls
                />
              ) : (
                <span className="art-empty" aria-hidden="true">
                  {entry.record.name[0]}
                </span>
              )}
              <label className="btn quiet file-btn">
                {slot === 'cover' ? 'Gallery cover' : slot}
                <input
                  type="file"
                  accept={IMAGE_TYPES}
                  aria-label={`Upload ${slot} for ${entry.record.name}`}
                  onChange={upload(owner, slot)}
                  disabled={!onPortrait}
                />
              </label>
              {set[slot] && (
                <button
                  className="text-control"
                  type="button"
                  onClick={() => onPortrait?.(owner, slot, null)}
                >
                  Remove {slot}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };
  const framing = (entry: Cast) => {
    const m = member(entry) ?? freshMember();
    return (
      <fieldset className="card-framing">
        <legend>Gallery framing</legend>
        <label className="field">
          <span>Image fit</span>
          <select
            aria-label="Image fit"
            value={m.fit}
            onChange={(e) => patch(entry, { fit: e.target.value as Member['fit'] })}
          >
            <option value="cover">Fill the frame</option>
            <option value="contain">Show the full image</option>
          </select>
        </label>
        <label className="field">
          <span>Horizontal focal point</span>
          <input
            type="range"
            min="0"
            max="100"
            value={m.x}
            onChange={(e) => patch(entry, { x: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Vertical focal point</span>
          <input
            type="range"
            min="0"
            max="100"
            value={m.y}
            onChange={(e) => patch(entry, { y: Number(e.target.value) })}
          />
        </label>
        <CharacterArtwork
          entry={entry}
          set={portraits[portraitOwner(entry.world.id, entry.record.id)]}
          member={m}
        />
      </fieldset>
    );
  };
  const membershipControls = (entry: Cast) => {
    const m = member(entry);
    return (
      <div className="member-controls">
        <button
          type="button"
          className="btn"
          onClick={() => patch(entry, { state: m?.state === 'active' ? 'hidden' : 'active' })}
        >
          {m?.state === 'active' ? 'Remove from Chat' : 'Add to Chat'}
        </button>
        {m && m.state !== 'hidden' && (
          <button
            type="button"
            className="btn quiet"
            onClick={() => patch(entry, { state: m.state === 'archived' ? 'active' : 'archived' })}
          >
            {m.state === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
        )}
        <button
          type="button"
          className="btn quiet"
          aria-pressed={m?.favorite ?? false}
          onClick={() =>
            patch(entry, { favorite: !m?.favorite, state: m?.state === 'hidden' || !m ? 'active' : m.state })
          }
        >
          {m?.favorite ? 'Unfavorite' : 'Favorite'}
        </button>
        <a className="btn quiet" href={studioHref(entry)}>
          Edit in Studio
        </a>
        <p className="hint">
          Removing or archiving changes this collection. The character and conversations stay intact.
        </p>
        {collection.shelves.length > 0 && (
          <fieldset>
            <legend>Shelves</legend>
            {collection.shelves.map((shelf) => (
              <label className="shelf-check" key={shelf.id}>
                <input
                  type="checkbox"
                  checked={m?.shelves.includes(shelf.id) ?? false}
                  onChange={(event) =>
                    patch(entry, {
                      shelves: event.target.checked
                        ? [...(m?.shelves ?? []), shelf.id]
                        : (m?.shelves ?? []).filter((id) => id !== shelf.id),
                    })
                  }
                />
                {shelf.name}
              </label>
            ))}
          </fieldset>
        )}
      </div>
    );
  };
  const conversations = (items: Chat[]) => (
    <div className="conversation-list">
      {items.length ? (
        [...items]
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((chat) => (
            <button type="button" className="chat-row" key={chat.id} onClick={() => onOpen(chat.id)}>
              <Portrait
                name={chat.characterName}
                set={portraits[portraitOwner(chat.worldId, chat.characterId)]}
                size={52}
              />
              <span className="chat-row-text">
                <span className="chat-row-top">
                  <b>{chat.characterName}</b>
                  <time>{clock(chat.updatedAt, Date.now())}</time>
                </span>
                <span className="chat-row-line">{lastLine(chat) || 'No messages yet.'}</span>
                <span className="hint">
                  {worlds
                    ?.find((world) => world.id === chat.worldId)
                    ?.records.find((record) => record.id === chat.scenarioId)?.name ||
                    'Open conversation'}{' '}
                  · {chat.userName}
                </span>
              </span>
            </button>
          ))
      ) : (
        <p className="empty-collection">No conversations here yet.</p>
      )}
    </div>
  );
  const continuable = [...(chats ?? [])]
    .filter((chat) =>
      cast.some(
        (entry) =>
          entry.world.id === chat.worldId &&
          entry.record.id === chat.characterId &&
          member(entry)?.state === 'active',
      ),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const openedChatId = loadNavigation()
    .recent.flatMap((entry) => (entry.target.kind === 'chat' ? [entry.target.chatId] : []))
    .find((id) => continuable.some((chat) => chat.id === id));
  const continueChat = continuable.find((chat) => chat.id === openedChatId) ?? continuable[0];

  return (
    <main className={`collection-page ${profile ? 'character-page' : ''}`}>
      {notice && (
        <p className="status bad" role="status">
          {notice}
        </p>
      )}
      {profile ? (
        profileCast ? (
          <>
            <a className="text-control back-collection" href="#/">
              ‹ Back to collection
            </a>
            <section className="character-hero">
              <CharacterArtwork
                entry={profileCast}
                set={portraits[portraitOwner(profileCast.world.id, profileCast.record.id)]}
                member={member(profileCast)}
                controls
              />
              <div>
                <p className="sub">{profileCast.world.name}</p>
                <h1>{profileCast.record.name}</h1>
                <p className="collection-lede">{profileCast.record.line}</p>
                <div className="row">
                  {recent(profileCast) && (
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => onOpen(recent(profileCast)!.id)}
                    >
                      Continue chat
                    </button>
                  )}
                  <button
                    type="button"
                    className={`btn ${recent(profileCast) ? '' : 'primary'}`}
                    onClick={() => onNewChat(profileCast)}
                  >
                    New chat
                  </button>
                  <button type="button" className="btn quiet" onClick={() => setManage(profileCast)}>
                    Manage character
                  </button>
                </div>
              </div>
            </section>
            <div className="collection-tabs" role="group" aria-label="Character details">
              {(['about', 'chats', 'images'] as const).map((tab) => (
                <button
                  type="button"
                  key={tab}
                  aria-pressed={profileTab === tab}
                  onClick={() => setProfileTab(tab)}
                >
                  {tab === 'about'
                    ? 'About'
                    : tab === 'chats'
                      ? `Conversations (${ownChats(profileCast).length})`
                      : 'Images'}
                </button>
              ))}
            </div>
            {profileTab === 'about' && (
              <section className="character-about">
                <h2>In your collection</h2>
                {membershipControls(profileCast)}
                <p className="hint">Character writing, rules and schedules live in Studio.</p>
              </section>
            )}
            {profileTab === 'chats' && conversations(ownChats(profileCast))}
            {profileTab === 'images' && (
              <>
                {framing(profileCast)}
                {artwork(profileCast)}
              </>
            )}
          </>
        ) : (
          <>
            <h1>{worlds === null ? 'Opening character…' : 'Character unavailable'}</h1>
            <p>This character could not be found in this browser.</p>
            <a className="btn" href="#/">
              Back to collection
            </a>
          </>
        )
      ) : (
        <>
          <div className="collection-heading">
            <div>
              <p className="sub">Inkwyrm Chat</p>
              <h1>{mode === 'conversations' ? 'Your conversations' : collection.title}</h1>
              <p className="collection-lede">
                {mode === 'conversations'
                  ? 'Every conversation, including people outside your collection.'
                  : 'Your people. Your stories.'}
              </p>
            </div>
            <div className="row">
              {mode === 'collection' && (
                <>
                  <button
                    type="button"
                    className="btn primary"
                    disabled={worlds === null || chats === null}
                    onClick={() => setSheet('add')}
                  >
                    Add characters
                  </button>
                  <button
                    type="button"
                    className="btn quiet"
                    onClick={() => {
                      setTitle(collection.title);
                      setSheet('organize');
                    }}
                  >
                    Organize
                  </button>
                </>
              )}
              <button type="button" className="btn quiet" onClick={() => setSheet('display')}>
                Display options
              </button>
              {onBackup && (
                <button type="button" className="btn quiet" onClick={onBackup}>
                  Back up collection
                </button>
              )}
            </div>
          </div>
          {mode === 'collection' && continueChat && (
            <section className="collection-continue" aria-label="Continue">
              <span>
                <b>{continueChat.characterName}</b>
                <small>{lastLine(continueChat) || 'Your latest conversation'}</small>
              </span>
              <button type="button" className="btn" onClick={() => onOpen(continueChat.id)}>
                Continue chat →
              </button>
            </section>
          )}
          <div className="collection-toolbar">
            <label className="field search">
              <span className="sr">{mode === 'collection' ? 'Find a character' : 'Find a conversation'}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => search(e.target.value)}
                placeholder={mode === 'collection' ? 'Find someone…' : 'Find a conversation…'}
              />
            </label>
            {mode === 'collection' && (
              <label className="field">
                <span className="sr">Shelf</span>
                <select
                  aria-label="Shelf"
                  value={collection.display.shelf}
                  onChange={(e) =>
                    change((c) => ({ ...c, display: { ...c.display, shelf: e.target.value } }))
                  }
                >
                  <option value="all">All characters ({active.length})</option>
                  <option value="favorites">Favorites</option>
                  {collection.shelves.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value="archived">Archived</option>
                </select>
              </label>
            )}
            <span className="hint">
              {mode === 'collection' ? `${visible.length} shown` : `${chats?.length ?? 0} conversations`}
            </span>
          </div>
          {(worlds === null || chats === null) && (
            <p className="status" role="status">
              Opening your local library…
            </p>
          )}
          {mode === 'conversations' ? (
            conversations(
              (chats ?? []).filter((chat) =>
                [chat.characterName, chat.userName, lastLine(chat)]
                  .join(' ')
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase()),
              ),
            )
          ) : (
            <>
              <div
                className="character-gallery"
                data-size={collection.display.size}
                data-layout={collection.display.layout}
              >
                {visible.map((entry) => {
                  const m = member(entry)!;
                  const chat = recent(entry);
                  return (
                    <article
                      className="collection-card"
                      key={keyOf(entry)}
                      aria-label={entry.record.name}
                      onPointerEnter={() => setActiveImage(keyOf(entry))}
                      onPointerLeave={() => setActiveImage(null)}
                      onFocus={() => setActiveImage(keyOf(entry))}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setActiveImage(null);
                      }}
                    >
                      <a
                        className="card-picture"
                        href={characterHref(entry.world.id, entry.record.id)}
                        aria-label={`About ${entry.record.name}`}
                      >
                        <CharacterArtwork
                          entry={entry}
                          set={portraits[portraitOwner(entry.world.id, entry.record.id)]}
                          member={m}
                          active={activeImage === keyOf(entry)}
                          play={imagePreviews[keyOf(entry)]}
                        />
                      </a>
                      <div className="collection-card-body">
                        <div className="card-name-row">
                          <a className="card-name" href={characterHref(entry.world.id, entry.record.id)}>
                            {entry.record.name}
                          </a>
                          <button
                            type="button"
                            className="favorite-control"
                            aria-label={`${m.favorite ? 'Unfavorite' : 'Favorite'} ${entry.record.name}`}
                            aria-pressed={m.favorite}
                            onClick={() => patch(entry, { favorite: !m.favorite })}
                          >
                            {m.favorite ? '★' : '☆'}
                          </button>
                        </div>
                        {collection.display.descriptions && (
                          <p className="card-description">{entry.record.line}</p>
                        )}
                        {collection.display.worlds && <p className="card-source">{entry.world.name}</p>}
                        <div className="card-actions">
                          {animatedArtwork(portraits[portraitOwner(entry.world.id, entry.record.id)]) && (
                            <button
                              type="button"
                              className="text-control"
                              aria-pressed={imagePreviews[keyOf(entry)] === true}
                              onClick={() =>
                                setImagePreviews((current) => ({
                                  ...current,
                                  [keyOf(entry)]: !current[keyOf(entry)],
                                }))
                              }
                            >
                              {imagePreviews[keyOf(entry)] ? 'Stop preview' : 'Play animation'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn quiet"
                            onClick={() => (chat ? onOpen(chat.id) : onNewChat(entry))}
                          >
                            {chat ? 'Continue' : 'Start chat'}
                          </button>
                          {chat && (
                            <button type="button" className="text-control" onClick={() => onNewChat(entry)}>
                              New chat
                            </button>
                          )}
                          {ownChats(entry).length > 1 && (
                            <button
                              type="button"
                              className="text-control"
                              onClick={() => setChooseChats(entry)}
                            >
                              Conversations ({ownChats(entry).length})
                            </button>
                          )}
                          <button
                            type="button"
                            className="card-manage"
                            id={`manage-${encodeURIComponent(keyOf(entry))}`}
                            onClick={() => setManage(entry)}
                            aria-label={`Manage ${entry.record.name}`}
                          >
                            •••
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {worlds !== null && chats !== null && !visible.length && (
                <div className="empty-collection">
                  <InkMark name="bubble" size={64} />
                  <h2>
                    {query
                      ? 'Nobody matched that search.'
                      : collection.display.shelf === 'archived'
                        ? 'No archived characters.'
                        : 'Make room for someone.'}
                  </h2>
                  <p>
                    {query
                      ? 'Try another name or clear the search.'
                      : 'Import a character card, choose someone from your worlds, or make a character in Studio.'}
                  </p>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => (query ? search('') : setSheet('add'))}
                  >
                    {query ? 'Clear search' : 'Add characters'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
      {chooseChats && (
        <Sheet title={`Conversations with ${chooseChats.record.name}`} onClose={() => setChooseChats(null)}>
          {conversations(ownChats(chooseChats))}
        </Sheet>
      )}
      {sheet === 'add' && (
        <Sheet title="Add characters" onClose={() => setSheet(null)}>
          <div className="row">
            <label className="btn file-btn">
              Import a character
              <input
                type="file"
                accept="application/json,.json,image/png,.png"
                aria-label="Import a character card"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) {
                    onImport(file);
                    setSheet(null);
                  }
                }}
              />
            </label>
            <button type="button" className="btn" disabled={!onCreate} onClick={() => setSheet('create')}>
              Make a character
            </button>
          </div>
          <h2>From your worlds</h2>
          <p className="hint">
            Choose people individually. Their source worlds and adventures stay unchanged.
          </p>
          <label className="field">
            <span>World</span>
            <select aria-label="World" value={worldFilter} onChange={(e) => setWorldFilter(e.target.value)}>
              <option value="">Every world</option>
              {worlds?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Find in world cast</span>
            <input type="search" value={castQuery} onChange={(e) => setCastQuery(e.target.value)} />
          </label>
          <div className="cast-picker">
            {cast
              .filter((e) => (!worldFilter || e.world.id === worldFilter) && searchMatch(e, castQuery))
              .map((entry) => (
                <div className="cast-pick" key={keyOf(entry)}>
                  <Portrait
                    name={entry.record.name}
                    set={portraits[portraitOwner(entry.world.id, entry.record.id)]}
                    size={48}
                  />
                  <span>
                    <b>{entry.record.name}</b>
                    <small>{entry.world.name}</small>
                  </span>
                  <button
                    type="button"
                    className="btn quiet"
                    disabled={member(entry)?.state === 'active'}
                    onClick={() => patch(entry, { state: 'active' })}
                  >
                    {member(entry)?.state === 'active' ? 'Added' : 'Add to Chat'}
                  </button>
                  <a
                    className="text-control"
                    href={characterHref(entry.world.id, entry.record.id)}
                    onClick={() => setSheet(null)}
                  >
                    Preview
                  </a>
                </div>
              ))}
          </div>
        </Sheet>
      )}
      {sheet === 'create' && (
        <Sheet title="Make a character" onClose={() => setSheet(null)}>
          <form
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              if (!newName.trim() || creating) return;
              setCreating(true);
              try {
                await onCreate?.(newName.trim());
                setSheet(null);
                setNewName('');
              } catch (error) {
                setNotice(error instanceof Error ? error.message : 'Could not create the character.');
              } finally {
                setCreating(false);
              }
            }}
          >
            <label className="field">
              <span>Character name</span>
              <input value={newName} maxLength={120} onChange={(e) => setNewName(e.target.value)} required />
            </label>
            <p className="hint">Added to your Chat collection, then opened in Studio for writing.</p>
            <button className="btn primary" type="submit" disabled={creating || !newName.trim()}>
              {creating ? 'Creating…' : 'Create and write'}
            </button>
          </form>
        </Sheet>
      )}
      {sheet === 'display' && (
        <Sheet title="Display options" onClose={() => setSheet(null)}>
          <label className="field">
            <span>Layout</span>
            <select
              aria-label="Layout"
              value={collection.display.layout}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  display: { ...c.display, layout: e.target.value as Collection['display']['layout'] },
                }))
              }
            >
              <option value="gallery">Portrait gallery</option>
              <option value="list">Compact list</option>
            </select>
          </label>
          <label className="field">
            <span>Card size</span>
            <select
              aria-label="Card size"
              value={collection.display.size}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  display: { ...c.display, size: e.target.value as Collection['display']['size'] },
                }))
              }
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
              <option value="large">Large artwork</option>
            </select>
          </label>
          <label className="field">
            <span>Sort characters</span>
            <select
              aria-label="Sort characters"
              value={collection.display.sort}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  display: { ...c.display, sort: e.target.value as Collection['display']['sort'] },
                }))
              }
            >
              <option value="manual">Your order, favorites first</option>
              <option value="name">Name</option>
              <option value="recent">Recent conversation</option>
            </select>
          </label>
          <label className="field">
            <span>Animated images</span>
            <select
              aria-label="Animated images"
              value={collection.display.motion}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  display: { ...c.display, motion: e.target.value as Collection['display']['motion'] },
                }))
              }
            >
              <option value="selected">Animate selected or hovered images</option>
              <option value="still">Still posters</option>
              <option value="visible">Animate visible images</option>
            </select>
          </label>
          <label className="shelf-check">
            <input
              type="checkbox"
              checked={collection.display.descriptions}
              onChange={(e) =>
                change((c) => ({ ...c, display: { ...c.display, descriptions: e.target.checked } }))
              }
            />{' '}
            Show character descriptions
          </label>
          <label className="shelf-check">
            <input
              type="checkbox"
              checked={collection.display.worlds}
              onChange={(e) => change((c) => ({ ...c, display: { ...c.display, worlds: e.target.checked } }))}
            />{' '}
            Show source worlds
          </label>
          <p className="hint">
            Automatic animation respects reduced motion and stops offscreen or when this tab is hidden. Image
            controls can play a picture explicitly.
          </p>
        </Sheet>
      )}
      {sheet === 'organize' && (
        <Sheet title="Organize collection" onClose={() => setSheet(null)}>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) change((c) => ({ ...c, title: title.trim() }));
            }}
          >
            <label className="field grow">
              <span>Collection name</span>
              <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <button type="submit" className="btn">
              Save name
            </button>
          </form>
          <h2>Shelves</h2>
          <p className="hint">
            A character can belong to several shelves. Shelves never change their in-story relationships.
          </p>
          {collection.shelves.map((shelf) => (
            <div className="row" key={shelf.id}>
              <label className="field grow">
                <span>Shelf name</span>
                <input
                  key={shelf.name}
                  defaultValue={shelf.name}
                  maxLength={80}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== shelf.name)
                      change((c) => ({
                        ...c,
                        shelves: c.shelves.map((s) => (s.id === shelf.id ? { ...s, name } : s)),
                      }));
                  }}
                />
              </label>
              <button
                type="button"
                className="btn quiet"
                aria-label={`Move ${shelf.name} shelf earlier`}
                disabled={collection.shelves[0]?.id === shelf.id}
                onClick={() =>
                  change((c) => {
                    const shelves = [...c.shelves];
                    const at = shelves.findIndex((s) => s.id === shelf.id);
                    if (at > 0) [shelves[at - 1], shelves[at]] = [shelves[at]!, shelves[at - 1]!];
                    return { ...c, shelves };
                  })
                }
              >
                ↑
              </button>
              <button
                type="button"
                className="btn quiet"
                aria-label={`Move ${shelf.name} shelf later`}
                disabled={collection.shelves.at(-1)?.id === shelf.id}
                onClick={() =>
                  change((c) => {
                    const shelves = [...c.shelves];
                    const at = shelves.findIndex((s) => s.id === shelf.id);
                    if (at >= 0 && at < shelves.length - 1)
                      [shelves[at], shelves[at + 1]] = [shelves[at + 1]!, shelves[at]!];
                    return { ...c, shelves };
                  })
                }
              >
                ↓
              </button>
              <button
                className="btn quiet"
                type="button"
                onClick={() =>
                  change((c) => ({
                    ...c,
                    shelves: c.shelves.filter((s) => s.id !== shelf.id),
                    members: Object.fromEntries(
                      Object.entries(c.members).map(([key, m]) => [
                        key,
                        { ...m, shelves: m.shelves.filter((id) => id !== shelf.id) },
                      ]),
                    ),
                    display: { ...c.display, shelf: c.display.shelf === shelf.id ? 'all' : c.display.shelf },
                  }))
                }
              >
                Remove shelf
              </button>
            </div>
          ))}
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!shelfName.trim()) return;
              change((c) => ({ ...c, shelves: [...c.shelves, { id: newId(), name: shelfName.trim() }] }));
              setShelfName('');
            }}
          >
            <label className="field grow">
              <span>New shelf</span>
              <input
                value={shelfName}
                maxLength={80}
                onChange={(e) => setShelfName(e.target.value)}
                placeholder="Companions, Menagerie, Bogwater…"
              />
            </label>
            <button type="submit" className="btn" disabled={!shelfName.trim()}>
              Add shelf
            </button>
          </form>
        </Sheet>
      )}
      {manage && selected && (
        <Sheet title={`Manage ${selected.record.name}`} onClose={returnFocus}>
          {membershipControls(selected)}
          <div className="row">
            <button
              type="button"
              className="btn quiet"
              disabled={movePosition(selected) <= 0}
              onClick={() => move(selected, -1)}
            >
              Move earlier
            </button>
            <button
              type="button"
              className="btn quiet"
              disabled={
                movePosition(selected) < 0 || movePosition(selected) === moveGroup(selected).length - 1
              }
              onClick={() => move(selected, 1)}
            >
              Move later
            </button>
            <a
              className="btn"
              href={characterHref(selected.world.id, selected.record.id)}
              onClick={() => setManage(null)}
            >
              Character page
            </a>
          </div>
          {framing(selected)}
          <details>
            <summary>Change images and emotion portraits</summary>
            {artwork(selected)}
          </details>
        </Sheet>
      )}
    </main>
  );
}

function CharacterArtwork({
  entry,
  set,
  member,
  active = false,
  controls = false,
  play,
}: {
  entry: Cast;
  set?: PortraitSet;
  member?: Member | null;
  active?: boolean;
  controls?: boolean;
  play?: boolean;
}) {
  // Gallery artwork stays stable; a chat's latest mood never replaces the chosen cover.
  const slot = set?.cover ? 'cover' : set?.avatar ? 'avatar' : set?.neutral ? 'neutral' : null;
  return (
    <span
      className="character-art"
      style={{ objectFit: member?.fit ?? 'cover', objectPosition: `${member?.x ?? 50}% ${member?.y ?? 35}%` }}
    >
      {slot && set?.[slot] ? (
        <MediaImage
          src={set[slot]!}
          poster={set[posterSlot(slot)]}
          animated={set[animationSlot(slot)] === 'true'}
          alt={entry.record.name}
          active={active}
          play={play}
          controls={controls}
        />
      ) : (
        <span className="character-monogram" aria-hidden="true">
          <span>{entry.record.name[0]}</span>
          <small>{entry.record.name}</small>
        </span>
      )}
    </span>
  );
}
