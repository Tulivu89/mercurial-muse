// The Overview (docs/front-page/): Inkwyrm's front page. On a first visit it shows what comes
// with the site; once someone has made or played anything, the same panels become their
// shortcuts, with one exact Continue.
//
// It reads this browser's stores and nothing else. It makes no model calls, creates no chats,
// saves or Lives, and writes nothing. Each store loads and fails on its own.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Chat, Life } from '../../core/chat/index.js';
import type { World } from '../../core/records/index.js';
import { atlasOf, chainOf, circlesOf, placeMap } from '../../core/map/index.js';
import { loadNavigation, type NavigationV1 } from '../../kit/src/activity';
import { InkMark, type MarkName } from '../../kit/src/Mark';
import { SiteHeader } from '../../kit/src/SiteHeader';
import { applyTheme, readTheme } from '../../kit/src/theme';
import { applyLook, readLook, resolveLook } from '../../kit/src/look';
import { useCollection } from '../../kit/src/collection';
import { ERRATA_ID } from '../../kit/src/included';
import { MediaImage, animationSlot, posterSlot } from '../../kit/src/media';
import '../../kit/src/media.css';
import { portraitSets, type Portrait, type PortraitSet } from '../../chat/src/store';
import { selectOverview, type Authoring, type CharacterCard, type HomeCard, type Read, type SaveSummary, type WorldCard } from './select';

export interface Readers {
  worlds: () => Promise<World[]>;
  chats: () => Promise<Chat[]>;
  saves: () => Promise<SaveSummary[]>;
  authoring: () => Promise<Authoring>;
  house: () => World;
  portraits?: () => Promise<Portrait[]>;
  lives?: () => Promise<Record<string, Life>>;
}

const message = (error: unknown) => (error instanceof Error ? error.message : 'It could not be read.');

function useRead<T>(read: () => Promise<T>, tick: number): Read<T> {
  const [state, setState] = useState<Read<T>>({ state: 'loading' });
  useEffect(() => {
    let live = true;
    read().then((value) => { if (live) setState({ state: 'ready', value }); }, (error) => { if (live) setState({ state: 'error', message: message(error) }); });
    return () => { live = false; };
  }, [tick]);
  return state;
}

export function App({ readers }: { readers: Readers }) {
  // The site's one look, applied; the Overview never changes it, so it writes nothing.
  useEffect(() => { applyTheme(readTheme()); applyLook(resolveLook(readLook())); }, []);
  // Read again on coming back to the tab: a game saved in another tab shows up.
  const [tick, setTick] = useState(0);
  const [navigation, setNavigation] = useState<NavigationV1>(loadNavigation);
  const refresh = useCallback(() => { setTick((n) => n + 1); setNavigation(loadNavigation()); }, []);
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onShow);
    return () => document.removeEventListener('visibilitychange', onShow);
  }, [refresh]);

  const worlds = useRead(readers.worlds, tick);
  const chats = useRead(readers.chats, tick);
  const saves = useRead(readers.saves, tick);
  const authoring = useRead(readers.authoring, tick);
  const portraits = useRead(readers.portraits ?? (async () => []), tick);
  const pictures = useMemo(() => portraits.state === 'ready' ? portraitSets(portraits.value) : {}, [portraits]);
  const lives = useRead(readers.lives ?? (async () => ({})), tick);
  const collection = useCollection();
  const house = useMemo(() => readers.house(), [readers]);
  const view = selectOverview({ worlds, chats, saves, authoring, navigation, house, collection, lives });

  return (
    <>
      <SiteHeader side="overview" homeLabel="Inkwyrm, the front page" />
      <main className="overview">
        {view.first || view.loading ? <Welcome loading={view.loading} meet={view.characters.find((card) => card.tag === 'Included' && card.owner?.endsWith(`:${ERRATA_ID}`)) ?? view.characters.find((card) => card.tag === 'Included') ?? null} /> : <Returning />}
        {view.failed.length > 0 && (
          <p className="status bad" role="status">
            This browser couldn&rsquo;t read your {view.failed.join(' or ')}. Nothing has been lost; the rest of the page is as it stands.
            {' '}<button type="button" className="btn small quiet" onClick={refresh}>Try again</button>
          </p>
        )}
        {view.continueWith && (
          <section className="continue" aria-label="Continue">
            <span className="continue-label">{view.continueWith.label}</span>
            <span className="continue-text">
              <b className="continue-title">{view.continueWith.title}</b>
              {view.continueWith.detail && <span className="continue-detail">{view.continueWith.detail}</span>}
            </span>
            <a className="btn primary continue-go" href={view.continueWith.href}>{view.continueWith.action} <span aria-hidden="true">→</span></a>
          </section>
        )}

        <div className="panels">
          <Panel mark="bubble" title="Characters" more={{ label: 'All chats', href: '/chat/' }} loading={chats.state === 'loading'}>
            <div className={`cast${view.characters.length === 1 ? ' solo' : ''}`}>{view.characters.map((card, index) => <Character key={card.key} card={card} lead={index === 0} set={card.owner ? pictures[card.owner] : undefined} />)}</div>
            <p className="panel-lede">{view.characters.length ? 'Your curated Chat collection, ready to meet or continue.' : 'Choose the people you want to see here in your Chat collection.'}</p>
            <div className="row">
              {view.characters[0] && <a className="btn" href={view.characters[0].href}>{view.characters[0].action} <span aria-hidden="true">→</span></a>}
              <a className="link-btn" href="/chat/">Import a character</a>
            </div>
          </Panel>

          <Panel mark="main" title="Homes" more={{ label: 'All homes', href: '/chat/#/home' }} loading={worlds.state === 'loading'}>
            <div className="home-list">{view.homes.map((card) => <HomeItem key={card.key} card={card} set={card.owner ? pictures[card.owner] : undefined} />)}</div>
            <p className="panel-lede">A home is where the people you chat with live, each going about their day by their own clock. Look in, do something for them, read what they have posted.</p>
            <div className="row panel-foot">
              <a className="link-btn" href="/studio/">Build a home</a>
              <span className="hint">In the Studio: a household, its rooms, and who lives there.</span>
            </div>
          </Panel>

          <Panel mark="nib" title="Worlds" more={{ label: 'Your library', href: '/studio/' }} loading={worlds.state === 'loading'}>
            <div className="world-cards">{view.worlds.map((card, index) => <WorldItem key={card.key} card={card} lead={index === 0} />)}</div>
            {view.worlds.length === 0 && <p className="panel-lede">A world is places, people and the rules they keep, written once and played as an adventure. You have none yet.</p>}
            <div className="row panel-foot">
              <a className="link-btn" href="/studio/">Make a world</a>
              <span className="hint">Errata helps you build it, with your own model.</span>
            </div>
          </Panel>

          <Panel mark="dragon" title="Adventure" more={{ label: 'All adventures', href: '/' }} loading={saves.state === 'loading'}>
            {view.adventure?.kind === 'save' && (
              <div className="adventure">
                <p className="eyebrow">{view.adventure.tag}</p>
                <h3 className="card-title">{view.adventure.name}</h3>
                <p className="facts">{[view.adventure.place, view.adventure.stamp, `${view.adventure.turns} turn${view.adventure.turns === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</p>
                <div className="row">
                  <a className="btn" href={view.adventure.href}>Continue adventure <span aria-hidden="true">→</span></a>
                  <span className="hint">Opens your save as you left it.</span>
                </div>
              </div>
            )}
            {view.adventure?.kind === 'example' && (
              <div className="adventure">
                <div className="scene" role="img" aria-label={`The opening of ${view.adventure.example.name}`}>
                  <p className="scene-line">{view.adventure.example.opening}</p>
                </div>
                <p className="eyebrow">Included adventure</p>
                <h3 className="card-title">{view.adventure.example.name}</h3>
                <p className="facts">{view.adventure.example.title}</p>
                <div className="row">
                  <a className="btn" href={view.adventure.example.href}>Enter the story <span aria-hidden="true">→</span></a>
                  <span className="hint">{view.adventure.example.note}</span>
                </div>
              </div>
            )}
            {!view.adventure && <p className="hint">Saved games couldn&rsquo;t be read just now. <a href="/">Open the Adventure</a> to see them.</p>}
          </Panel>
        </div>

        <footer className="overview-foot">
          <p className="hint">One library, in this browser: your characters, worlds and games, across Inkwyrm. Nothing leaves it unless you export it.</p>
          <p className="hint">Backups: Chat&rsquo;s Settings saves worlds, chats and portraits; the Adventure exports each game; the Studio exports each world, and its talks with Errata on the world&rsquo;s About page.</p>
        </footer>
      </main>
    </>
  );
}

function Welcome({ loading, meet }: { loading: boolean; meet: CharacterCard | null }) {
  return (
    <section className={`hero${loading ? ' quiet' : ''}`} aria-label="Inkwyrm">
      <p className="eyebrow">A place for your stories to live</p>
      <h1 className="hero-title ink-write">Characters who remember you. <span className="nowrap">Worlds that <em>keep their rules.</em></span></h1>
      <p className="hero-sub">Meet someone. Make a world. See what happens next.</p>
      {meet && (
        <div className="row hero-act">
          <a className="btn primary" href={meet.href}>{meet.action} <span aria-hidden="true">→</span></a>
        </div>
      )}
      <ul className="hero-notes">
        <li>Use your own model.</li>
        <li>Keep your stories in this browser.</li>
        <li>Look around before connecting anything.</li>
      </ul>
    </section>
  );
}

function Returning() {
  return (
    <section className="hero returning" aria-label="Inkwyrm">
      <h1 className="hero-title ink-write">Pick up the thread.</h1>
      <p className="hero-sub">Your people, your places, and the story where you left it.</p>
    </section>
  );
}

function Panel({ mark, title, more, loading, wide = false, children }: { mark: MarkName; title: string; more: { label: string; href: string }; loading: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <section className={`panel${wide ? ' wide' : ''}`} aria-label={title} aria-busy={loading || undefined}>
      <div className="panel-head">
        <InkMark name={mark} size={34} />
        <h2 className="panel-title">{title}</h2>
        <a className="panel-more" href={more.href}>{more.label} <span aria-hidden="true">→</span></a>
      </div>
      {loading ? <div className="placeholder" aria-hidden="true" /> : children}
    </section>
  );
}

function Character({ card, lead, set }: { card: CharacterCard; lead: boolean; set?: PortraitSet }) {
  const slot = set?.cover ? 'cover' : set?.avatar ? 'avatar' : set?.neutral ? 'neutral' : null;
  return (
    <a className={`character${lead ? ' lead' : ''}`} href={card.href}>
      <span className="tag">{card.tag}</span>
      {slot && set?.[slot] ? <MediaImage frameClassName="overview-character-image" src={set[slot]!} poster={set[posterSlot(slot)]} animated={set[animationSlot(slot)] === 'true'} alt="" style={{ objectFit: card.member?.fit ?? 'cover', objectPosition: `${card.member?.x ?? 50}% ${card.member?.y ?? 35}%` }} /> : <span className="character-initial" aria-hidden="true">{card.name.slice(0, 1)}</span>}
      <span className="character-name">{card.name}</span>
      {card.line && <span className="character-line">{card.line}</span>}
      {card.excerpt && <span className="character-excerpt">&ldquo;{card.excerpt}&rdquo;</span>}
      {card.world && <span className="character-world">{card.world}</span>}
    </a>
  );
}

function HomeItem({ card, set }: { card: HomeCard; set?: PortraitSet }) {
  const slot = card.slots?.find((entry) => set?.[entry]);
  return (
    <article className="home-item">
      <a className={`home-item-cover${slot ? '' : ' bare'}`} href={card.href} aria-hidden="true" tabIndex={-1}>
        {slot && set?.[slot] ? <MediaImage src={set[slot]!} poster={set[posterSlot(slot)]} animated={set[animationSlot(slot)] === 'true'} alt="" /> : <span>{card.name.replace(/^The /, '').charAt(0)}</span>}
      </a>
      <div className="world-text">
        <p className="eyebrow">{card.tag === 'Included' ? 'Included home' : card.tag} · {card.world}</p>
        <h3 className="card-title">{card.name}</h3>
        <ul className="home-people">
          {card.people.map((person) => <li key={person.name}><b>{person.name}</b> <span>{person.says}</span></li>)}
          {card.more > 0 && <li><span>and {card.more} more</span></li>}
        </ul>
        <a className="btn" href={card.href}>{card.action} <span aria-hidden="true">→</span></a>
      </div>
    </article>
  );
}

function WorldItem({ card, lead }: { card: WorldCard; lead: boolean }) {
  return (
    <article className={`world-card${lead ? ' lead' : ''}`}>
      <a className="cover" href={card.href} aria-hidden="true" tabIndex={-1}>
        {card.world && hasPlaces(card.world) ? <MapCover world={card.world} /> : <TextCover over={card.example?.cover.over ?? 'A world'} title={card.example?.cover.title ?? card.name} />}
      </a>
      <div className="world-text">
        <p className="eyebrow">{card.tag === 'Included' ? 'Included world' : card.tag}</p>
        <h3 className="card-title">{card.name}</h3>
        {card.premise && <p className="world-premise">{card.premise}</p>}
        {card.detail && <p className="facts">{card.detail}</p>}
        <a className="btn" href={card.href}>{card.action} <span aria-hidden="true">→</span></a>
      </div>
    </article>
  );
}

const hasPlaces = (world: World) => world.records.some((record) => record.kind === 'place');

// A world's own circles, from its place tree and the author's changes to its sheets: the cover
// a world has before anyone draws one.
function MapCover({ world }: { world: World }) {
  const circles = useMemo(() => {
    const map = placeMap(world);
    const atlas = atlasOf(map, world.map?.sheets);
    // The whole world is one circle of radius 100 around the origin.
    return [...circlesOf(atlas, 100).entries()].map(([id, circle]) => ({ id, ...circle, depth: chainOf(map, id).length }));
  }, [world]);
  return (
    <svg className="map-cover" viewBox="-104 -140 208 280" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${world.name}: its places, drawn from the world`}>
      <rect x="-104" y="-140" width="208" height="280" className="map-ground" />
      {circles.map((circle) => <circle key={circle.id} cx={circle.x} cy={circle.y} r={circle.r} className={`map-c d${Math.min(circle.depth, 4)}`} />)}
    </svg>
  );
}

function TextCover({ over, title }: { over: string; title: string }) {
  return (
    <span className="text-cover">
      <span className="text-cover-over">{over}</span>
      <span className="text-cover-title">{title}</span>
    </span>
  );
}
