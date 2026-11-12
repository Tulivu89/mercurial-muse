// Map: where you stand on the world's map (docs/bids/maps/decision.md, 0.27.0), as circles that
// pinch out from your room to the whole world or as one place's hex ground; the ways out and the
// journeys further afield, quickest first; and putting yourself anywhere by hand.
import { useMemo, useState } from 'react';
import { atlasOf, destinationsFrom, durationWords, findPath, isArea, playerOf, sceneOf } from '../engine';
import { childrenOf, circlesOf, legWords } from '../../../core/map/index';
import { MapView, type MapLook } from '../../../kit/src/MapView';
import type { PlayApi } from './Play';
import { ChevronRight, LockIcon, SkipIcon } from './icons';

export function MapSection({ api }: { api: PlayApi }) {
  const { world, save, busy } = api;
  const scene = sceneOf(world, save);
  const playerId = playerOf(world);
  const atlas = atlasOf(world);
  const layout = atlas.travel.atlas;
  const circles = useMemo(() => circlesOf(layout), [layout]);
  const [selected, setSelected] = useState<string | null>(null);
  const [handPlace, setHandPlace] = useState('');
  const [look, setLook] = useState<MapLook>('circles');
  const [focus, setFocus] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const here = scene.place.id;
  // The circles open close in, on the place that holds where you stand; the ground opens on the
  // sheet you stand on, or on your own place's if it holds others.
  const near = atlas.map.places.get(here)?.parentId ?? here;
  const focusId = focus && atlas.map.places.has(focus) ? focus : near;
  const ownSheet = childrenOf(atlas.map, here).length ? here : near;
  const sheetId = sheet && atlas.map.places.has(sheet) && childrenOf(atlas.map, sheet).length ? sheet : ownSheet;
  const picked = selected && atlas.places.has(selected) ? atlas.places.get(selected)! : null;
  const trip = picked && picked.id !== here && !isArea(picked) ? findPath(world, save.values, playerId, here, picked.id) : null;

  const further = useMemo(() => {
    const nearIds = new Set(scene.exits.map((exit) => exit.place.id));
    return destinationsFrom(world, save.values, playerId, here)
      .filter((entry) => !nearIds.has(entry.place.id))
      .map((entry) => ({ ...entry, minutes: entry.result.ok ? entry.result.minutes : Infinity }))
      .sort((a, b) => a.minutes - b.minutes || a.place.name.localeCompare(b.place.name));
  }, [world, save.values, playerId, here, scene.exits]);
  const reachable = further.filter((entry) => entry.result.ok);
  const unreachable = further.length - reachable.length;
  const everywhere = world.world.places.filter((place) => !isArea(place) && place.id !== here).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="sub">
        <span className="seg" role="group" aria-label="How the map is drawn">
          <button type="button" aria-pressed={look === 'circles'} onClick={() => setLook('circles')}>Circles</button>
          <button type="button" aria-pressed={look === 'ground'} onClick={() => setLook('ground')}>Ground</button>
        </span>
        <button type="button" className="link" onClick={() => { setFocus(null); setSheet(null); }}>Where I am</button>
      </div>
      <MapView
        atlas={layout} circles={circles} look={look} sheet={sheetId} focus={focusId} here={here} selected={picked?.id ?? null}
        note={(id) => { if (id === here || isArea(atlas.places.get(id))) return undefined; const path = findPath(world, save.values, playerId, here, id); return path.ok ? durationWords(path.minutes) : 'closed'; }}
        onSelect={setSelected} onFocus={setFocus} onOpen={(id) => { setSheet(id); setLook('ground'); }}
        label={look === 'ground' ? `${atlas.map.places.get(sheetId)?.name ?? ''}: what is inside it, as hex ground` : 'The world as circles, around where you stand'}
      />
      <p className="hint">Pinch or drag to look around. Tap a place to pick it; tap it again to look inside. The red ring is where you stand.</p>

      {picked && (
        <div className="card pad" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="name" style={{ flex: 1 }}>{picked.name}</span>
            {trip?.ok && <span className="mono meta">{durationWords(trip.minutes)}</span>}
          </div>
          {picked.description && <p className="prose">{picked.description}</p>}
          {picked.id === here && <p className="meta">You are here.</p>}
          {isArea(picked) && <p className="meta">An area: you travel across it, never to it.</p>}
          {trip?.ok && trip.legs.length > 0 && (
            <ul className="legs">
              {trip.legs.map((leg, index) => {
                const words = legWords(atlas.map, leg);
                return <li key={index} className={leg.minutes ? '' : 'free'}><span>{words.text}</span><span className="mono">{durationWords(leg.minutes)}</span>{words.note && <span className="n">{words.note}</span>}</li>;
              })}
            </ul>
          )}
          {trip && !trip.ok && (
            <>
              <p style={{ fontSize: 14, color: 'var(--bad)' }}>{trip.reason}</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button type="button" className="btn" onClick={() => api.putSelf(picked.id)}>Go anyway</button>
                <span className="meta" style={{ lineHeight: 1.35 }}>Recorded as yours, not the rules’. No time passes.</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {trip?.ok && <button type="button" className="btn primary" disabled={busy} onClick={() => api.perform({ type: 'travel', to: picked.id })}>Go</button>}
            {trip?.ok && <button type="button" className="btn" disabled={busy} onClick={() => api.performQuietly({ type: 'travel', to: picked.id })}><SkipIcon />Go quietly</button>}
            {childrenOf(atlas.map, picked.id).length > 0 && <button type="button" className="btn quiet" onClick={() => { setSheet(picked.id); setLook('ground'); }}>Open its ground</button>}
            {look === 'circles' && <button type="button" className="btn quiet" onClick={() => setFocus(picked.id)}>Look at it</button>}
          </div>
        </div>
      )}

      <div className="sub"><p className="label">From here</p><span className="meta">quickest first</span></div>
      <div className="card">
        {scene.exits.length === 0 && <div className="lr"><span className="meta">No known way out.</span></div>}
        {scene.exits.map((exit) => (
          <div key={exit.place.id} className="lr" style={{ alignItems: exit.blocked ? 'flex-start' : 'center' }}>
            <span className="grow">
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {exit.blocked && <span style={{ color: 'var(--bad)' }}><LockIcon /></span>}
                <span className="name">{exit.place.name}</span>
              </span>
              <span className="meta" style={{ display: 'block', marginTop: 2 }}>{[exit.place.kind !== 'other' ? capitalise(exit.place.kind) : '', exit.edge.kind === 'inside' ? (exit.place.id === atlas.map.places.get(here)?.parentId ? 'out' : 'in') : 'across'].filter(Boolean).join(' · ')}</span>
              {exit.blocked && (
                <>
                  <span style={{ display: 'block', marginTop: 8, fontSize: 14, lineHeight: 1.4, color: 'var(--bad)' }}>{exit.blocked}</span>
                  <span style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                    <button type="button" className="btn" onClick={() => api.putSelf(exit.place.id)}>Go anyway</button>
                    <span className="meta" style={{ lineHeight: 1.35 }}>Recorded as yours,<br />not the rules’.</span>
                  </span>
                </>
              )}
            </span>
            <span className="mono meta" style={{ textAlign: 'right' }}>{durationWords(exit.edge.minutes)}</span>
            {!exit.blocked && <button type="button" className="btn quiet square" aria-label={`Go quietly to ${exit.place.name}`} title="Go quietly: you move, nothing is written" disabled={busy} onClick={() => api.performQuietly({ type: 'travel', to: exit.place.id })}><SkipIcon /></button>}
            {!exit.blocked && <button type="button" className="btn" disabled={busy} onClick={() => api.perform({ type: 'travel', to: exit.place.id })}>Go</button>}
          </div>
        ))}
      </div>

      {further.length > 0 && (
        <details className="card clip" style={{ marginTop: 12 }}>
          <summary className="row" style={{ minHeight: 56 }}>
            <span className="row-text">
              <span className="name">Further away</span>
              <span className="meta">{[reachable.length ? `${reachable.length} you can reach` : '', unreachable ? `${unreachable} closed for now` : ''].filter(Boolean).join(', ')}</span>
            </span>
            <ChevronRight />
          </summary>
          <div>
            {further.map(({ place, result }) => (
              <div key={place.id} className="lr">
                <span className="grow">
                  <span className="name" style={{ display: 'block' }}>{place.name}</span>
                  {!result.ok && <span className="meta" style={{ display: 'block', marginTop: 2 }}>{result.reason}</span>}
                </span>
                {result.ok && <span className="mono meta">{durationWords(result.minutes)}</span>}
                {result.ok && <button type="button" className="btn quiet square" aria-label={`Go quietly to ${place.name}`} title="Go quietly: you move, nothing is written" disabled={busy} onClick={() => api.performQuietly({ type: 'travel', to: place.id })}><SkipIcon /></button>}
                {result.ok && <button type="button" className="btn" disabled={busy} onClick={() => api.perform({ type: 'travel', to: place.id })}>Go</button>}
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="card clip" style={{ marginTop: 12 }}>
        <summary className="row" style={{ minHeight: 56 }}>
          <span className="row-text">
            <span className="name">Put yourself somewhere by hand</span>
            <span className="meta">No travel and no time. Recorded as yours.</span>
          </span>
          <ChevronRight />
        </summary>
        <div className="row-body">
          <label htmlFor="hand-place" className="sr">Place</label>
          <select id="hand-place" className="select" value={handPlace} onChange={(event) => setHandPlace(event.target.value)}>
            <option value="">Choose a place…</option>
            {everywhere.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
          </select>
          <button type="button" className="btn" disabled={!handPlace} onClick={() => { api.putSelf(handPlace); setHandPlace(''); }}>Move there</button>
        </div>
      </details>
    </>
  );
}

function capitalise(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
