// The map, drawn (docs/bids/maps/decision.md): the circles, every sheet nested at the hexes'
// centres, or one sheet's hex ground. One finger pans, two pinch, a tap picks a place and a
// second tap looks inside it. The circles follow Character Engine's legibility rules: names for
// the place in focus, what is in it, the chain above it (dimmed) and the land's top places; rooms
// only once their building is on the focus chain; a building at rest drawn as its icon. Labels
// are placed largest first and dropped, never drawn over each other. Shared by every side; it
// reads the map and never changes it.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactElement } from 'react';
import { DIRS, SQ3, cellKey, chainOf, childrenOf, inDisc, toCell, toPixel, type Atlas, type Cell, type Circle } from '../../core/map/index.js';
import type { PlaceKind } from '../../core/rules/index.js';
import { MAP_ICONS, MAP_PAINT, iconFor, type IconSet } from './map-icons';

export type MapLook = 'circles' | 'ground';
export type MapTool = 'look' | 'move' | 'paint' | 'road';

const AREAS: readonly string[] = ['continent', 'major region', 'region', 'subregion', 'territory'];
export const tintOf = (kind: PlaceKind) => (AREAS.includes(kind) ? 'area' : kind === 'wilderness' ? 'open' : kind === 'lake' || kind === 'river' || kind === 'sea or ocean' ? 'water'
  : kind === 'settlement' || kind === 'town' || kind === 'village' || kind === 'district' ? 'settle' : kind === 'building' ? 'build' : 'mark');

interface Line { t: string; cls?: string; small?: boolean }
const HERE_SAYS = { at: 'You are here', inside: 'You are inside' };
const MAX_ICONS = 60;
const MAX_LABELS = 60;
const f = (n: number) => String(Math.round(n * 100) / 100);

// A name in at most three lines that fit a width, breaking between words and never inside one: a
// word longer than the line stays whole (Character Engine's rule). Past three, an ellipsis.
export function wrap(name: string, width: number, perChar = 6.6): string[] {
  const most = Math.max(4, Math.floor(width / perChar)), lines: string[] = [];
  for (const word of name.split(/\s+/).filter(Boolean)) {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= most) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  if (lines.length > 3) return [...lines.slice(0, 2), `${lines[2]}…`];
  return lines.length ? lines : [name];
}

interface Camera { k: number; x: number; y: number }
interface Target { k: number; cx: number; cy: number }

function corner(x: number, y: number, i: number): [number, number] { const a = (Math.PI / 180) * (30 + 60 * i); return [x + Math.cos(a), y + Math.sin(a)]; }
function hexPath(q: number, r: number) { const [x, y] = toPixel(q, r); let d = ''; for (let i = 0; i < 6; i++) { const [cx, cy] = corner(x, y, i); d += `${i ? 'L' : 'M'}${f(cx)} ${f(cy)}`; } return `${d}Z`; }
function edgesPath(cells: readonly Cell[], inside: (q: number, r: number) => boolean) {
  let d = '';
  for (const [q, r] of cells) {
    const [x, y] = toPixel(q, r);
    for (let i = 0; i < 6; i++) {
      if (inside(q + DIRS[i]![0], r + DIRS[i]![1])) continue;
      const a = corner(x, y, i), b = corner(x, y, (i + 1) % 6);
      d += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
    }
  }
  return d;
}

export function MapView({ atlas, circles, look, sheet: sheetId, focus, here = null, hereSays = HERE_SAYS, selected = null, note, onSelect, onFocus, onOpen, label, tool = 'look', onMove, onCell, onDone, iconSet = 'old' }: {
  atlas: Atlas;
  circles: ReadonlyMap<string, Circle>;
  look: MapLook;
  sheet: string;
  focus: string;
  // Where the player stands, ringed in the seal colour, and what its label says.
  here?: string | null;
  hereSays?: { at: string; inside: string };
  selected?: string | null;
  // A second line under a picked place's name, such as how long it takes to get there.
  note?: (id: string) => string | undefined;
  onSelect: (id: string | null) => void;
  // A second tap on a circle looks at it; on the ground it opens what the place holds.
  onFocus: (id: string) => void;
  onOpen: (id: string) => void;
  label: string;
  // On the ground, what a finger does besides looking: drag a place (Move), or act on each cell it
  // crosses (Paint, Road). Only the Studio passes these; a pan never paints.
  tool?: MapTool;
  onMove?: (placeId: string, cell: Cell) => void;
  onCell?: (cell: Cell, first: boolean) => void;
  onDone?: () => void;
  // The world's icon set, to suit its genre.
  iconSet?: IconSet;
}) {
  const uid = useId().replace(/:/g, '');
  const { map } = atlas;
  const svg = useRef<SVGSVGElement>(null);
  const group = useRef<SVGGElement>(null);
  const cam = useRef<Camera>({ k: 1, x: 0, y: 0 });
  const size = useRef({ w: 360, h: 400 });
  const [, setTick] = useState(0);
  const frame = useRef(0);
  const anim = useRef(0);
  const redraw = () => {
    group.current?.setAttribute('transform', `translate(${f(cam.current.x)} ${f(cam.current.y)}) scale(${cam.current.k})`);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setTick((n) => n + 1));
  };
  const setCam = (t: Target) => { const { w, h } = size.current; cam.current = { k: t.k, x: w / 2 - t.cx * t.k, y: h / 2 - t.cy * t.k }; redraw(); };
  const fly = (t: Target) => {
    cancelAnimationFrame(anim.current);
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { w, h } = size.current, c = cam.current, k0 = c.k, cx0 = (w / 2 - c.x) / c.k, cy0 = (h / 2 - c.y) / c.k, t0 = performance.now();
    if (reduce) { setCam(t); return; }
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / 420), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      setCam({ k: k0 * Math.pow(t.k / k0, e), cx: cx0 + (t.cx - cx0) * e, cy: cy0 + (t.cy - cy0) * e });
      if (u < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };

  const sheet = look === 'ground' && map.places.has(sheetId) && childrenOf(map, sheetId).length ? atlas.sheet(sheetId) : null;

  // Character Engine's bands.
  const bands = useMemo(() => {
    const focusChain = new Set(chainOf(map, focus));
    const band = new Map<string, 'focus' | 'ancestor' | 'child' | 'outline'>();
    for (const id of focusChain) band.set(id, id === focus ? 'focus' : 'ancestor');
    for (const kid of childrenOf(map, focus)) band.set(kid.id, 'child');
    if (map.root) for (const kid of childrenOf(map, map.root)) if (!band.has(kid.id)) band.set(kid.id, 'outline');
    const shown = (id: string) => { for (let at = map.places.get(id)?.parentId; at; at = map.places.get(at)?.parentId ?? null) if (map.places.get(at)!.kind === 'building' && !focusChain.has(at)) return false; return true; };
    return { band, shown, focusChain };
  }, [map, focus]);
  const bare = (id: string) => map.places.get(id)?.kind === 'building' && !bands.focusChain.has(id) && id !== selected && id !== here;

  const target = (): Target => {
    const { w, h } = size.current;
    if (sheet) return { k: Math.min(w / (2 * (SQ3 * sheet.radius + 1.3)), h / (2 * (1.5 * sheet.radius + 1.4))) * 0.94, cx: 0, cy: 0 };
    const c = circles.get(focus) ?? (map.root ? circles.get(map.root) : undefined);
    return c ? { k: (Math.min(w, h) * 0.45) / c.r, cx: c.x, cy: c.y } : { k: 1, cx: 0, cy: 0 };
  };
  // The ground fits its sheet when it opens; the circles fly to the focus when it moves.
  const fitted = useRef('');
  useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return undefined;
    const measure = () => { const box = el.getBoundingClientRect(); if (box.width) size.current = { w: box.width, h: box.height }; };
    measure();
    const key = sheet ? `ground:${sheet.id}` : 'circles';
    if (fitted.current.split('|')[0] !== key) { setCam(target()); fitted.current = `${key}|${focus}`; }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { measure(); redraw(); }) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [sheet?.id, look]);
  useEffect(() => {
    if (sheet) return;
    const key = `circles|${focus}`;
    if (fitted.current === key) return;
    fitted.current = key;
    fly(target());
  }, [focus, sheet?.id]);
  useEffect(() => () => { cancelAnimationFrame(frame.current); cancelAnimationFrame(anim.current); }, []);

  // ---- What is drawn under the camera; it doesn't change as you pan ----
  const shapes = useMemo(() => {
    if (sheet) {
      const ownerOf = (q: number, r: number) => sheet.owner.get(cellKey(q, r)) ?? null;
      let ground = '', grid = '', borders = '';
      for (const [q, r] of sheet.cells) {
        const d = hexPath(q, r);
        grid += d;
        if (!ownerOf(q, r)) ground += d;
        const o = ownerOf(q, r), [x, y] = toPixel(q, r);
        for (let i = 0; i < 6; i++) {
          const nq = q + DIRS[i]![0], nr = r + DIRS[i]![1];
          if (!inDisc(nq, nr, sheet.radius) || ownerOf(nq, nr) === o || cellKey(q, r) > cellKey(nq, nr)) continue;
          const a = corner(x, y, i), c = corner(x, y, (i + 1) % 6);
          borders += `M${f(a[0])} ${f(a[1])}L${f(c[0])} ${f(c[1])}`;
        }
      }
      let roads = '';
      for (const key of sheet.roads) {
        const [q, r] = key.split(',').map(Number) as [number, number], [x, y] = toPixel(q, r);
        let joined = false;
        for (const [dq, dr] of DIRS) {
          const next = cellKey(q + dq, r + dr);
          if (!sheet.roads.has(next)) continue;
          joined = true;
          if (key < next) { const [x2, y2] = toPixel(q + dq, r + dr); roads += `M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}`; }
        }
        if (!joined) roads += `M${f(x - 0.15)} ${f(y)}L${f(x + 0.15)} ${f(y)}`;
      }
      const blobEdge = (id: string | null | undefined) => {
        const blob = id ? sheet.byId.get(id) : undefined;
        return blob && blob.cells.length ? edgesPath(blob.cells, (q, r) => ownerOf(q, r) === blob) : '';
      };
      const onSheet = (id: string | null) => (id ? chainOf(map, id).find((at) => map.places.get(at)?.parentId === sheet.id) ?? null : null);
      const hereBlob = here && here !== sheet.id ? onSheet(here) : null;
      return (
        <>
          <path className={`t-${sheet.area ? 'land' : 'pg'}`} d={ground} />
          {sheet.blobs.map((blob) => (blob.cells.length ? <path key={blob.id} className={`t-${blob.own ? 'pg' : tintOf(blob.kind)}`} d={blob.cells.map(([q, r]) => hexPath(q, r)).join('')} /> : null))}
          {MAP_PAINT.map((_, index) => { const cells = [...sheet.paint].filter(([, value]) => value === index); return cells.length ? <path key={`p${index}`} className={`paint p${index}`} d={cells.map(([key]) => { const [q, r] = key.split(",").map(Number) as [number, number]; return hexPath(q, r); }).join("")} /> : null; })}
          <path className="grid" d={grid} vectorEffect="non-scaling-stroke" />
          <path className="edges" d={borders} vectorEffect="non-scaling-stroke" />
          <path className="rim" d={edgesPath(sheet.cells, (q, r) => inDisc(q, r, sheet.radius))} vectorEffect="non-scaling-stroke" />
          {roads && <path className="road" d={roads} vectorEffect="non-scaling-stroke" />}
          {selected && selected !== here && <path className="sel-edge" d={blobEdge(onSheet(selected) ?? selected)} vectorEffect="non-scaling-stroke" />}
          {hereBlob && <path className="here-edge" d={blobEdge(hereBlob)} vectorEffect="non-scaling-stroke" />}
          {here === sheet.id && <path className="here-edge" d={edgesPath(sheet.cells, (q, r) => inDisc(q, r, sheet.radius))} vectorEffect="non-scaling-stroke" />}
        </>
      );
    }
    const list = [...circles.entries()].filter(([id]) => bands.shown(id)).sort((a, b) => b[1].r - a[1].r);
    const ring = (id: string | null, cls: string) => { const c = id ? circles.get(id) : undefined; return c ? <circle className={cls} cx={c.x} cy={c.y} r={c.r} vectorEffect="non-scaling-stroke" /> : null; };
    return (
      <>
        {list.map(([id, c]) => <circle key={id} className={`c t-${tintOf(map.places.get(id)!.kind)}${bare(id) ? ' bare' : ''}`} cx={c.x} cy={c.y} r={c.r} vectorEffect="non-scaling-stroke" />)}
        {selected && selected !== here && bands.shown(selected) && ring(selected, 'sel-ring')}
        {here && ring(here, 'here-ring')}
      </>
    );
  }, [sheet, circles, bands, selected, here, map]);

  // ---- Names and icons, in screen pixels, placed after every move of the camera ----
  const marks = (() => {
    const c = cam.current, { w, h } = size.current, boxes: { x0: number; y0: number; x1: number; y1: number }[] = [], out: ReactElement[] = [];
    let icons = 0;
    const put = (key: string, x: number, y0: number, lines: Line[], force: boolean, cls = '') => {
      const wd = Math.max(...lines.map((line, i) => line.t.length * (line.small ? 5.8 : 6.6) + 6)), ht = lines.length * 14.5;
      for (const dy of force ? [0] : [0, 16, -16]) {
        const y = y0 + dy, box = { x0: x - wd / 2, y0: y - 11, x1: x + wd / 2, y1: y - 11 + ht };
        if (box.x1 < 0 || box.x0 > w || box.y1 < 0 || box.y0 > h) continue;
        if (!force && boxes.some((o) => o.x0 < box.x1 && box.x0 < o.x1 && o.y0 < box.y1 && box.y0 < o.y1)) continue;
        boxes.push(box);
        lines.forEach((line, i) => out.push(<text key={`${key}:${i}`} className={`${line.small ? 'lb2' : 'lb'} ${line.cls ?? cls}`} x={f(x)} y={f(y + i * 14.5)} textAnchor="middle">{line.t}</text>));
        // An icon goes with its name only where the name sat down: nudged, it would sit on another.
        return dy === 0;
      }
      return false;
    };
    const icon = (id: string, x: number, y: number, s: number, dim: boolean) => {
      const name = iconFor(map.places.get(id), iconSet);
      if (!name || icons >= MAX_ICONS) return;
      icons++;
      out.push(<use key={`i:${id}`} href={`#${uid}-${name}`} className={`ic${dim ? ' dim' : ''}`} x={f(x - s / 2)} y={f(y - s / 2)} width={f(s)} height={f(s)} />);
    };
    const second = (id: string) => {
      if (id === here) return { t: hereSays.at, cls: 'here', small: true };
      if (here && chainOf(map, here).includes(id)) return { t: hereSays.inside, cls: 'here', small: true };
      const said = note?.(id);
      return said ? { t: said, small: true } : null;
    };
    const special = (id: string) => id === here || id === selected;
    if (sheet) {
      const k = c.k, iconSize = Math.max(16, Math.min(34, k * 1.2));
      const onSheet = (id: string | null) => (id ? chainOf(map, id).find((at) => map.places.get(at)?.parentId === sheet.id) ?? null : null);
      const hereId = onSheet(here), selId = onSheet(selected);
      const cand = sheet.blobs.filter((blob) => !blob.own && blob.cells.length)
        .map((blob) => ({ id: blob.id, sx: blob.cx * k + c.x, sy: blob.cy * k + c.y, n: blob.cells.length }))
        .sort((a, b) => Number(b.id === hereId) - Number(a.id === hereId) || Number(b.id === selId) - Number(a.id === selId) || b.n - a.n)
        .slice(0, MAX_LABELS);
      for (const p of cand) {
        const lines: Line[] = [{ t: map.places.get(p.id)!.name, cls: p.id === selId ? 'sel' : '' }];
        const extra = second(p.id) ?? (p.id === hereId && here ? { t: hereSays.inside, cls: 'here', small: true } : null);
        if (extra) lines.push(extra);
        const withIcon = k >= 8 && Boolean(iconFor(map.places.get(p.id), iconSet));
        const ok = put(p.id, p.sx, withIcon ? p.sy + iconSize / 2 + 8 : p.sy - 2, lines, p.id === hereId || p.id === selId);
        if (withIcon && ok) icon(p.id, p.sx, p.sy - 2, iconSize, false);
      }
    } else {
      const cand = [...circles.entries()].filter(([id]) => bands.shown(id))
        .map(([id, p]) => ({ id, sx: p.x * c.k + c.x, sy: p.y * c.k + c.y, sr: p.r * c.k, band: bands.band.get(id) }))
        .filter((p) => p.sr >= 4)
        .sort((a, b) => Number(special(b.id)) - Number(special(a.id)) || b.sr - a.sr)
        .slice(0, MAX_LABELS);
      for (const p of cand) {
        const named = special(p.id) || (p.band !== undefined && (p.band !== 'ancestor' || p.sr < Math.max(w, h)));
        const leafish = !childrenOf(map, p.id).length || bare(p.id) || p.sr <= 60;
        const dim = p.band === 'ancestor' || p.band === 'outline';
        const iconSize = leafish && p.sr >= 9 && iconFor(map.places.get(p.id), iconSet) ? Math.max(14, Math.min(30, p.sr * 1.15)) : 0;
        if (!named) { if (iconSize && p.sr >= 12) icon(p.id, p.sx, p.sy, iconSize, true); continue; }
        const lines: Line[] = wrap(map.places.get(p.id)!.name, Math.max(p.sr * 1.7, 90)).map((t) => ({ t, cls: p.id === selected ? 'sel' : undefined }));
        if (special(p.id)) { const extra = second(p.id); if (extra) lines.push(extra); }
        const y = !leafish ? p.sy - p.sr + 18 : iconSize ? p.sy + iconSize / 2 + 12 : p.sy + 4;
        const ok = put(p.id, p.sx, y, lines, special(p.id), dim ? 'dim' : '');
        if (iconSize && (ok || special(p.id))) icon(p.id, p.sx, p.sy - (leafish ? 2 : 0), iconSize, dim);
      }
    }
    return out;
  })();

  // ---- Gestures ----
  const pointers = useRef(new Map<number, [number, number]>());
  const gesture = useRef<{ kind: 'pan' | 'pinch' | 'drag' | 'paint'; start: [number, number]; last: [number, number]; moved: number; d: number; mid: [number, number]; id?: string; cell?: string } | null>(null);
  const lastTap = useRef({ t: 0, id: null as string | null });
  const local = (event: { clientX: number; clientY: number }): [number, number] => { const box = svg.current!.getBoundingClientRect(); return [event.clientX - box.left, event.clientY - box.top]; };
  const toWorld = ([x, y]: [number, number]) => [(x - cam.current.x) / cam.current.k, (y - cam.current.y) / cam.current.k] as const;
  const zoomAt = ([px, py]: [number, number], factor: number) => {
    const c = cam.current, lim = sheet ? [2, 260] : [0.02, 600];
    const k = Math.min(lim[1]!, Math.max(lim[0]!, c.k * factor)), g = k / c.k;
    cam.current = { k, x: px - (px - c.x) * g, y: py - (py - c.y) * g };
  };
  const hit = (p: [number, number]): string | null => {
    const [x, y] = toWorld(p);
    if (sheet) {
      const [q, r] = toCell(x, y);
      if (!inDisc(q, r, sheet.radius)) return null;
      const blob = sheet.owner.get(cellKey(q, r));
      return blob ? blob.id : sheet.area ? null : sheet.id;
    }
    let best: string | null = null, br = Infinity;
    for (const [id, c] of circles) if (bands.shown(id) && Math.hypot(c.x - x, c.y - y) <= c.r && c.r * cam.current.k >= 4 && c.r < br) { best = id; br = c.r; }
    return best;
  };
  const down = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = local(event);
    pointers.current.set(event.pointerId, p);
    cancelAnimationFrame(anim.current);
    if (pointers.current.size === 1) {
      gesture.current = { kind: 'pan', start: p, last: p, moved: 0, d: 0, mid: p };
      const [x, y] = toWorld(p), cell = toCell(x, y);
      if (sheet && tool === 'move' && onMove) {
        const blob = sheet.owner.get(cellKey(cell[0], cell[1]));
        if (blob && !blob.own) { gesture.current = { ...gesture.current, kind: 'drag', id: blob.id, cell: cellKey(cell[0], cell[1]) }; onSelect(blob.id); }
      } else if (sheet && (tool === 'paint' || tool === 'road') && onCell && inDisc(cell[0], cell[1], sheet.radius)) {
        gesture.current = { ...gesture.current, kind: 'paint', moved: 99, cell: cellKey(cell[0], cell[1]) };
        onCell(cell, true);
      }
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [[number, number], [number, number]];
      gesture.current = { kind: 'pinch', start: p, last: p, moved: 99, d: Math.hypot(a[0] - b[0], a[1] - b[1]), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
    }
  };
  const move = (event: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(event.pointerId)) return;
    const p = local(event);
    pointers.current.set(event.pointerId, p);
    if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()] as [[number, number], [number, number]];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      zoomAt(m, d / g.d);
      cam.current = { ...cam.current, x: cam.current.x + m[0] - g.mid[0], y: cam.current.y + m[1] - g.mid[1] };
      g.d = d; g.mid = m;
      redraw();
    } else if ((g.kind === 'drag' || g.kind === 'paint') && sheet) {
      g.moved = Math.max(g.moved, Math.hypot(p[0] - g.start[0], p[1] - g.start[1]));
      const [x, y] = toWorld(p), cell = toCell(x, y), key = cellKey(cell[0], cell[1]);
      if (key === g.cell) return;
      if (g.kind === 'drag' && inDisc(cell[0], cell[1], sheet.radius + 1)) { g.cell = key; onMove?.(g.id!, cell); }
      if (g.kind === 'paint' && inDisc(cell[0], cell[1], sheet.radius)) { g.cell = key; onCell?.(cell, false); }
    } else if (g.kind === 'pan') {
      const dx = p[0] - g.last[0], dy = p[1] - g.last[1];
      g.moved += Math.abs(dx) + Math.abs(dy); g.last = p;
      if (g.moved > 6) { cam.current = { ...cam.current, x: cam.current.x + dx, y: cam.current.y + dy }; redraw(); }
    }
  };
  const up = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pinch') {
      const rest = [...pointers.current.values()][0];
      gesture.current = rest ? { kind: 'pan', start: rest, last: rest, moved: 99, d: 0, mid: rest } : null;
      return;
    }
    if (pointers.current.size) return;
    gesture.current = null;
    if (g.kind === 'drag' || g.kind === 'paint') { onDone?.(); if (g.kind === 'paint' || g.moved > 6) return; }
    if (g.moved > 6) return;
    const id = hit(g.start), now = performance.now();
    const again = Boolean(id) && lastTap.current.id === id && now - lastTap.current.t < 340;
    lastTap.current = { t: now, id };
    onSelect(id);
    if (again && id) { if (sheet) { if (id !== sheet.id && childrenOf(map, id).length) onOpen(id); } else onFocus(id); }
  };
  useEffect(() => {
    const el = svg.current;
    if (!el) return undefined;
    const wheel = (event: WheelEvent) => { event.preventDefault(); zoomAt(local(event), Math.exp(-event.deltaY * 0.0016)); redraw(); };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  });

  const c = cam.current;
  return (
    <svg ref={svg} className="map-view" role="img" aria-label={label} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <defs>
        {Object.entries(MAP_ICONS).map(([name, { d }]) => (
          <symbol key={name} id={`${uid}-${name}`} viewBox="0 0 24 24">
            <path d={d} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
          </symbol>
        ))}
      </defs>
      <g ref={group} transform={`translate(${f(c.x)} ${f(c.y)}) scale(${c.k})`}>{shapes}</g>
      <g>{marks}</g>
    </svg>
  );
}
