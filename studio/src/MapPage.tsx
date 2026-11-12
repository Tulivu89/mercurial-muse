// World › Map (docs/bids/maps/decision.md, phase M1): the world laid out from its place tree with
// no setup, as circles nested from the whole world down to the rooms, or one place's hex ground.
// Read-only for now. Pick a place to see how long it takes to reach from the place you measure
// from, leg by leg, by the levels on World › Rules and the map.
import { useMemo, useState } from 'react';
import type { World } from '../../core/records/index.js';
import { atlasOf, chainOf, childrenOf, circlesOf, isArea, legWords, midName, placeMap, timeWords, travelOf, cellWorthWords, TOP } from '../../core/map/index.js';
import { LEVEL_NAMES, LEVEL_OF } from '../../core/rules/index.js';
import { MapView } from '../../kit/src/MapView';
import type { Route } from './route';

export function MapPage({ world, route, go }: { world: World; route: Route; go: (patch: Partial<Route>) => void }) {
  const map = useMemo(() => placeMap(world), [world.records, world.name]);
  const atlas = useMemo(() => atlasOf(map), [map]);
  const circles = useMemo(() => circlesOf(atlas), [atlas]);
  const travel = useMemo(() => travelOf(atlas, world.rules?.levels), [atlas, world.rules?.levels]);
  const standable = useMemo(() => [...map.places.values()].filter((place) => place.id !== TOP && !isArea(place.kind)), [map]);

  const [picked, setPicked] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [fromAsked, setFrom] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const from = fromAsked && map.places.has(fromAsked) ? fromAsked : standable[0]?.id ?? null;
  const selected = picked && map.places.has(picked) ? picked : null;
  const sheet = route.sheet && map.places.has(route.sheet) && childrenOf(map, route.sheet).length ? route.sheet : null;
  const look = sheet ? 'ground' : 'circles';
  const focusId = focus && map.places.has(focus) ? focus : (from ? map.places.get(from)!.parentId : null) ?? map.root;

  const times = useMemo(() => (from ? standable.filter((place) => place.id !== from).map((place) => ({ id: place.id, minutes: travel.journey(from, place.id).minutes })).sort((a, b) => a.minutes - b.minutes || map.places.get(a.id)!.name.localeCompare(map.places.get(b.id)!.name)) : []), [from, standable, travel, map]);

  if (!map.root) {
    return (
      <>
        <h1 className="ink-write">Map</h1>
        <p className="lede">No places yet. Add a place, and places inside it, and the map lays itself out from them.</p>
      </>
    );
  }

  const name = (id: string) => map.places.get(id)!.name;
  const where = (id: string) => { const chain = chainOf(map, id).slice(1).filter((at) => at !== TOP).map(name); return chain.length ? `in ${chain.join(' › ')}` : 'the whole world'; };
  const openGround = (id: string) => go({ sheet: id });
  const trip = selected && from && selected !== from && !isArea(map.places.get(selected)!.kind) ? travel.journey(from, selected) : null;
  const sheets = [...map.places.keys()].filter((id) => childrenOf(map, id).length).length;
  const place = selected ? map.places.get(selected)! : null;

  return (
    <>
      <h1 className="ink-write">Map</h1>
      <p className="lede">{map.places.size - (map.places.has(TOP) ? 1 : 0)} places on {sheets} {sheets === 1 ? 'sheet' : 'sheets'}, laid out from what holds what. Nothing here was placed by hand. Times come from the levels on World › Rules and the cells between places.</p>

      <div className="row map-bar">
        <div className="seg" role="group" aria-label="How the map is drawn">
          <button type="button" aria-pressed={look === 'circles'} onClick={() => go({ sheet: null })}>Circles</button>
          <button type="button" aria-pressed={look === 'ground'} onClick={() => openGround(selected && childrenOf(map, selected).length ? selected : (selected && map.places.get(selected)!.parentId) || focusId || map.root!)}>Ground</button>
        </div>
        {sheet ? (
          <nav className="trail" aria-label="Where this sheet sits">
            {chainOf(map, sheet).reverse().map((id, index, list) => (
              <span key={id}>{index ? <span aria-hidden="true"> › </span> : null}{index === list.length - 1 ? <b>{name(id)}</b> : <button type="button" onClick={() => openGround(id)}>{name(id)}</button>}</span>
            ))}
          </nav>
        ) : (
          <span className="row">
            <button type="button" className="btn small quiet" onClick={() => setFocus(map.root)}>The whole world</button>
            {from && <button type="button" className="btn small quiet" onClick={() => setFocus(map.places.get(from)!.parentId ?? from)}>Around {name(from)}</button>}
          </span>
        )}
      </div>

      <MapView
        atlas={atlas} circles={circles} look={look} sheet={sheet ?? ''} focus={focusId ?? map.root} here={from} hereSays={{ at: 'Measured from here', inside: 'Measured from inside' }} selected={selected}
        note={(id) => (from && id !== from && !isArea(map.places.get(id)!.kind) ? timeWords(travel.journey(from, id).minutes) : undefined)}
        onSelect={setPicked} onFocus={setFocus} onOpen={openGround}
        label={sheet ? `${name(sheet)}: what is inside it, as hex ground` : `${world.name}: every place as circles`}
      />
      <p className="hint">
        {sheet
          ? `${atlas.sheet(sheet).area ? `The pale cells are ${midName(map, sheet)}'s land; nobody stops there.` : atlas.sheet(sheet).bordered ? `One cell is ${midName(map, sheet)} itself, for being inside but in no room.` : `The pale cells are ${midName(map, sheet)} itself.`} One cell here is ${cellWorthWords(travel.cellMinutes(sheet))}. Tap a place twice to open what it holds. Moving, painting and roads come in the next phase.`
          : 'Pinch or drag to look around. Tap a place to pick it; tap it again to look inside. The red ring is where times are measured from.'}
      </p>

      {place && (
        <section className="card" aria-label={place.name}>
          <div className="card-head">
            <b className="grow">{place.name}</b>
            <span className="hint">{place.kind} · {LEVEL_NAMES[LEVEL_OF[place.kind]].name.toLowerCase()}</span>
          </div>
          <p className="hint">{where(place.id)}</p>
          {selected === from && <p className="part">Times are measured from here.</p>}
          {isArea(place.kind) && <p className="part">An area: you travel across it, never to it.</p>}
          {trip && (
            <>
              <p className="part"><b>{timeWords(trip.minutes)}</b> from {midName(map, from!)}</p>
              <ul className="legs">
                {trip.legs.map((leg, index) => {
                  const words = legWords(map, leg);
                  return (
                    <li key={index} className={`${leg.minutes ? '' : 'free'}${leg.kind === 'across' ? ' across' : ''}`}>
                      <span>{words.text}</span><span className="t">{timeWords(leg.minutes)}</span>
                      {words.note && <span className="n">{words.note}</span>}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <div className="row">
            {place.id !== TOP && <button type="button" className="btn small quiet" onClick={() => go({ rec: place.id, page: null, sheet: null })}>Open its page</button>}
            {childrenOf(map, place.id).length > 0 && sheet !== place.id && <button type="button" className="btn small quiet" onClick={() => openGround(place.id)}>Open its ground</button>}
            {place.parentId && sheet !== place.parentId && <button type="button" className="btn small quiet" onClick={() => openGround(place.parentId!)}>See it on the ground</button>}
            {!isArea(place.kind) && place.id !== from && <button type="button" className="btn small quiet" onClick={() => setFrom(place.id)}>Measure from here</button>}
          </div>
        </section>
      )}

      {from && (
        <section className="card" aria-label={`From ${name(from)}`}>
          <div className="card-head"><b className="grow">From {name(from)}</b></div>
          <div className="times">
            {(all ? times : times.slice(0, 10)).map((row) => (
              <button type="button" key={row.id} className="item" aria-current={row.id === selected || undefined} onClick={() => setPicked(row.id)}>
                <span className="item-text"><span className="item-name">{name(row.id)}</span><small>{where(row.id)}</small></span>
                <small className="num">{timeWords(row.minutes)}</small>
              </button>
            ))}
          </div>
          {times.length > 10 && <div className="row"><button type="button" className="btn small quiet" onClick={() => setAll(!all)}>{all ? 'The nearest ten' : `Every place (${times.length})`}</button></div>}
        </section>
      )}
    </>
  );
}
