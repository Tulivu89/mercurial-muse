// World › Map (docs/bids/maps/decision.md, phases M1 and M3): the world laid out from its place
// tree with no setup, as circles nested from the whole world down to the rooms, or one place's hex
// ground. On the ground an author refines what laid itself out: moves a place, makes it bigger or
// smaller, paints cells, lays roads, says what a cell is worth. Only what changed is kept, on the
// world's map. Pick a place to see how long it takes from the place you measure from, leg by leg.
import { useMemo, useRef, useState } from 'react';
import { newRecord, putRecord, type World } from '../../core/records/index.js';
import {
  atlasOf, cellKey, cellWorth, cellWorthWords, chainOf, childrenOf, circlesOf, isArea, isArranged, keepLayout, legWords, midName, moveTo, paint, placeMap,
  reroll, resetSheet, resize, road, timeWords, travelOf, TOP, type Brush, type WorldMap,
} from '../../core/map/index.js';
import { LEVEL_NAMES, LEVEL_OF, type PlaceKind, type TravelLevel } from '../../core/rules/index.js';
import { MapView, type MapTool } from '../../kit/src/MapView';
import { newId } from '../../kit/src/util';
import { Minutes } from './rules/bits';
import type { Route } from './route';

const TOOL_SAYS: Record<MapTool, string> = {
  look: 'Drag to look around. Tap a place to pick it; tap it twice to open what it holds.',
  move: 'Drag a place to move it; its cells grow back around it. The first change keeps this sheet as it is, so nothing else shifts.',
  paint: 'Drag across cells to give them to the place chosen below, or to the ground. Fill gives a whole patch at once.',
  road: 'Drag across cells to lay a road; a step along it is quicker. Start on a road to take it up.',
};
// A new place on a sheet is the kind of place that sheet's level usually holds.
const NEW_KIND: Record<TravelLevel, PlaceKind> = { land: 'region', region: 'village', open: 'landmark', settlement: 'building', building: 'building' };

export function MapPage({ world, route, go, onChange }: { world: World; route: Route; go: (patch: Partial<Route>) => void; onChange: (world: World) => void }) {
  const map = useMemo(() => placeMap(world), [world.records, world.name]);
  const atlas = useMemo(() => atlasOf(map, world.map?.sheets), [map, world.map]);
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

  // A drag sends many changes between two renders; each builds on the last one sent.
  const latest = useRef(world);
  latest.current = world;
  const [tool, setTool] = useState<MapTool>('look');
  const [brush, setBrush] = useState<Brush>(1);
  const [brushTo, setBrushTo] = useState<string | null>(null);
  const laying = useRef(true);
  const ground = sheet ? atlas.sheet(sheet) : null;
  const setMap = (next: WorldMap | undefined) => {
    const { map: _was, ...rest } = latest.current;
    const changed: World = next ? { ...rest, map: next } : rest;
    latest.current = changed;
    onChange(changed);
  };
  const liveSheet = () => (sheet ? atlasOf(map, latest.current.map?.sheets).sheet(sheet) : null);
  const target = ground && (brushTo === '' || (brushTo && ground.byId.has(brushTo))) ? brushTo! : ground && selected && ground.byId.has(selected) ? selected : ground?.blobs[0]?.id ?? '';
  const addPlace = () => {
    if (!sheet || sheet === TOP) return;
    const fresh = newRecord('place', newId(), 'New place', newId);
    fresh.parentId = sheet;
    fresh.rules = { placeKind: NEW_KIND[LEVEL_OF[map.places.get(sheet)!.kind]] };
    onChange(putRecord(latest.current, fresh, Date.now()));
    setPicked(fresh.id);
  };

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
  const arranged = Object.keys(world.map?.sheets ?? {}).length;
  const place = selected ? map.places.get(selected)! : null;

  return (
    <>
      <h1 className="ink-write">Map</h1>
      <p className="lede">{map.places.size - (map.places.has(TOP) ? 1 : 0)} places on {sheets} {sheets === 1 ? 'sheet' : 'sheets'}, laid out from what holds what{arranged ? `, ${arranged} of them changed by hand` : ''}. Times come from the levels on World › Rules and the cells between places.</p>

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
        tool={sheet ? tool : 'look'}
        onMove={(id, cell) => { const live = liveSheet(); if (live) setMap(moveTo(latest.current.map, live, id, cell)); }}
        onCell={(cell, first) => {
          const live = liveSheet();
          if (!live) return;
          if (tool === 'road') { if (first) laying.current = !live.roads.has(cellKey(cell[0], cell[1])); setMap(road(latest.current.map, live, cell, laying.current)); }
          else if (brush !== 0 || first) setMap(paint(latest.current.map, live, cell, target, brush));
        }}
      />
      <p className="hint">
        {sheet
          ? `${atlas.sheet(sheet).area ? `The pale cells are ${midName(map, sheet)}'s land; nobody stops there.` : atlas.sheet(sheet).bordered ? `One cell is ${midName(map, sheet)} itself, for being inside but in no room.` : `The pale cells are ${midName(map, sheet)} itself.`} One cell here is ${cellWorthWords(travel.cellMinutes(sheet))}. ${TOOL_SAYS[tool]}`
          : 'Pinch or drag to look around. Tap a place to pick it; tap it again to look inside. The red ring is where times are measured from.'}
      </p>

      {ground && sheet && (
        <section className="card" aria-label="Refine this ground">
          <div className="seg" role="group" aria-label="What a drag does">
            {(['look', 'move', 'paint', 'road'] as const).map((entry) => <button key={entry} type="button" aria-pressed={tool === entry} onClick={() => setTool(entry)}>{entry[0]!.toUpperCase() + entry.slice(1)}</button>)}
          </div>
          {tool === 'paint' && (
            <div className="row">
              <select className="input pick" aria-label="Paint cells as" value={target} onChange={(event) => setBrushTo(event.target.value)}>
                <option value="">{ground.area ? 'Open land' : `${name(sheet)}'s ground`}</option>
                {ground.blobs.map((blob) => <option key={blob.id} value={blob.id}>{blob.own ? `${name(blob.id)} itself` : name(blob.id)}</option>)}
              </select>
              <div className="seg" role="group" aria-label="Brush">
                {([[1, 'One cell'], [7, 'Seven'], [0, 'Fill']] as const).map(([size, label]) => <button key={size} type="button" aria-pressed={brush === size} onClick={() => setBrush(size)}>{label}</button>)}
              </div>
            </div>
          )}
          <div className="rule">
            <span className="rule-label">One cell here is worth<small>{world.map?.sheets?.[sheet]?.cellMinutes !== undefined ? 'Set for this place.' : `${LEVEL_NAMES[LEVEL_OF[map.places.get(sheet)!.kind]].name}: a quarter of its typical trip.`}</small></span>
            <span className="rule-control"><Minutes label="One cell here is worth" value={Math.round(travel.cellMinutes(sheet))} onChange={(minutes) => setMap(cellWorth(latest.current.map, sheet, minutes))} /></span>
            <span className="rule-source">{world.map?.sheets?.[sheet]?.cellMinutes !== undefined && <button type="button" className="btn small quiet" onClick={() => setMap(cellWorth(latest.current.map, sheet, undefined))}>Put back</button>}</span>
          </div>
          <p className="hint">{isArranged(world.map, sheet) ? 'This sheet is kept as you left it: a new place finds a gap and moves nobody.' : 'Nothing on this sheet is kept yet; it lays itself out from what it holds.'}</p>
          <div className="row">
            <button type="button" className="btn small quiet" disabled={isArranged(world.map, sheet)} onClick={() => setMap(keepLayout(latest.current.map, ground))}>Keep this layout</button>
            <button type="button" className="btn small quiet" onClick={() => setMap(reroll(latest.current.map, sheet))}>Reroll</button>
            <button type="button" className="btn small quiet" disabled={!world.map?.sheets?.[sheet]} onClick={() => setMap(resetSheet(latest.current.map, sheet))}>Reset this sheet</button>
            {sheet !== TOP && <button type="button" className="btn small quiet" onClick={addPlace}>Add a place here</button>}
          </div>
        </section>
      )}

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
            {ground && ground.byId.has(place.id) && !ground.byId.get(place.id)!.own && (
              <>
                <button type="button" className="btn small quiet" onClick={() => { const live = liveSheet(); if (live) setMap(resize(latest.current.map, live, place.id, true)); }}>Bigger</button>
                <button type="button" className="btn small quiet" onClick={() => { const live = liveSheet(); if (live) setMap(resize(latest.current.map, live, place.id, false)); }}>Smaller</button>
              </>
            )}
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
