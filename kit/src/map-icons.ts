// The map's icons (docs/bids/maps/decision.md, phase M4): one line drawing each, on a 24-unit grid,
// drawn in the map's ink, so the whole library is a few kilobytes and each mark on a map is one
// <use>. A world picks a set to suit its genre (old, modern, far); every place shows its kind's
// icon from that set unless its author picked another. A key is stored on a place, so a key is
// never renamed. Character Engine's library, imported with its shading, was 346 KB; these are
// drawn plain for the map instead.
import type { PlaceKind } from '../../core/rules/index.js';

export type IconSet = 'old' | 'modern' | 'far';
export const ICON_SETS: { id: IconSet; name: string }[] = [
  { id: 'old', name: 'Old' },
  { id: 'modern', name: 'Modern' },
  { id: 'far', name: 'Far' },
];

export interface MapIcon { name: string; group: IconSet | 'any'; d: string }

export const MAP_ICONS: Record<string, MapIcon> = {
  // Any genre.
  wild: { name: 'Trees', group: 'any', d: 'M2 20h20M7 20v-3M3.5 17h7L7 9ZM17 20v-3M13 17h8l-4-9Z' },
  mountain: { name: 'Mountain', group: 'any', d: 'M2 20h20M3 20l6-11 4 6 2-3 6 8M8.5 11.5l1.5 1.5 1.5-1' },
  cave: { name: 'Cave', group: 'any', d: 'M2 20h20M3 20c1-8 5-13 9-13s8 5 9 13M9 20v-3a3 3 0 0 1 6 0v3' },
  water: { name: 'Water', group: 'any', d: 'M3 9c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0' },
  river: { name: 'River', group: 'any', d: 'M8 2c-3 5 3 8 0 13s3 7 0 7M16 2c-3 5 3 8 0 13s3 7 0 7' },
  road: { name: 'Road', group: 'any', d: 'M7 21 10 3M17 21 14 3M12 5v2M12 10v3M12 16v3' },
  landmark: { name: 'Flag', group: 'any', d: 'M4 21h9M8 21V4M8 4h10l-2.5 3L18 10H8' },
  mark: { name: 'Mark', group: 'any', d: 'M12 3l6 9-6 9-6-9ZM12 9v6' },
  // Old.
  village: { name: 'Village', group: 'old', d: 'M2 20h20M3 20v-8l4-3 4 3v8M13 20v-6l4-3 4 3v6M6 20v-3h2v3' },
  town: { name: 'Walled town', group: 'old', d: 'M2 20h20M4 20V10l2-2 2 2v10M16 20V10l2-2 2 2v10M8 20v-6h8v6M11 20v-3h2v3' },
  keep: { name: 'Keep', group: 'old', d: 'M3 20h18M5 20V9h3v2h2V9h4v2h2V9h3v11M10 20v-4a2 2 0 0 1 4 0v4' },
  tower: { name: 'Tower', group: 'old', d: 'M6 21h12M8 21V8h8v13M7 8l5-5 5 5M11 12h2M11 16h2' },
  temple: { name: 'Temple', group: 'old', d: 'M3 20h18M4 9l8-5 8 5ZM6 9v9M10 9v9M14 9v9M18 9v9M4 18h16' },
  gate: { name: 'Gate', group: 'old', d: 'M2 21h20M4 21V9a8 8 0 0 1 16 0v12M8 21v-9a4 4 0 0 1 8 0v9' },
  ruin: { name: 'Ruin', group: 'old', d: 'M3 20h18M5 20V9l2 2V7M10 20v-6l2-1V9M15 20v-9h3l-1 3 2 2v4' },
  camp: { name: 'Camp', group: 'old', d: 'M2 20h20M3 20 12 5l9 15M8 20l4-6 4 6' },
  building: { name: 'House', group: 'old', d: 'M2 20h20M5 20v-9l7-5 7 5v9M10 20v-5h4v5' },
  // Modern.
  house: { name: 'House', group: 'modern', d: 'M3 20h18M5 20v-8l7-6 7 6v8M9 20v-5h3v5M15 13h2v2h-2Z' },
  block: { name: 'Tower block', group: 'modern', d: 'M4 21h16M6 21V3h12v18M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2M10 21v-3h4v3' },
  office: { name: 'Office tower', group: 'modern', d: 'M3 21h18M9 21V2l6 3v16M5 21V10h4M15 12h4v9M11 8v10M13 9v9' },
  shop: { name: 'Shopfront', group: 'modern', d: 'M3 20h18M4 20V10h16v10M3 10l2-5h14l2 5M9 20v-5h6v5' },
  hospital: { name: 'Hospital', group: 'modern', d: 'M2 21h20M4 21V5h16v16M12 8v6M9 11h6M10 21v-3h4v3' },
  church: { name: 'Church', group: 'modern', d: 'M5 21h14M12 2v4M10 4h4M7 21v-9l5-5 5 5v9M11 21v-4h2v4' },
  factory: { name: 'Factory', group: 'modern', d: 'M2 21h20M3 21V11l5 3v-3l5 3v-3l5 3V5h3v16' },
  station: { name: 'Station', group: 'modern', d: 'M4 17V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v11ZM4 12h16M8 20l-2 2M16 20l2 2M8 15h.01M16 15h.01' },
  // Far.
  hab: { name: 'Habitat', group: 'far', d: 'M3 20h18M5 20v-6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6M9 15h.01M12 15h.01M15 15h.01' },
  dome: { name: 'Dome', group: 'far', d: 'M2 20h20M4 20a8 8 0 0 1 16 0M8 20a4 4 0 0 1 8 0M12 12V8M10 8h4' },
  spire: { name: 'Spire', group: 'far', d: 'M6 21h12M12 2v19M8 21l4-6 4 6M9 9h6M10 5h4' },
  orbital: { name: 'Orbital', group: 'far', d: 'M12 4v16M4 12h16M9 9h6v6H9ZM3 10h3v4H3ZM18 10h3v4h-3Z' },
  planet: { name: 'Planet', group: 'far', d: 'M12 6a6 6 0 1 0 0 12a6 6 0 1 0 0-12M2 14c4 3 16 1 20-6' },
  ship: { name: 'Ship', group: 'far', d: 'M12 2l4 9v7l-4 3-4-3v-7ZM8 14l-4 4v3l4-2M16 14l4 4v3l-4-2' },
  ring: { name: 'Ring gate', group: 'far', d: 'M4 21h16M12 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 6a5 5 0 1 0 0 10a5 5 0 1 0 0-10' },
};

// What each kind shows in each set. Areas show no icon; their names do the work.
const BY_KIND: Record<IconSet, Partial<Record<PlaceKind, string>>> = {
  old: { settlement: 'village', village: 'village', town: 'town', district: 'town', building: 'building', landmark: 'landmark', wilderness: 'wild', lake: 'water', 'sea or ocean': 'water', river: 'river', 'road or trail': 'road', other: 'mark' },
  modern: { settlement: 'house', village: 'house', town: 'block', district: 'office', building: 'block', landmark: 'landmark', wilderness: 'wild', lake: 'water', 'sea or ocean': 'water', river: 'river', 'road or trail': 'road', other: 'mark' },
  far: { settlement: 'hab', village: 'hab', town: 'dome', district: 'dome', building: 'hab', landmark: 'spire', wilderness: 'mountain', lake: 'water', 'sea or ocean': 'water', river: 'river', 'road or trail': 'road', other: 'mark' },
};

export const kindIcon = (kind: PlaceKind, set: IconSet = 'old') => BY_KIND[set][kind];
// The icon a place shows: its own pick, or its kind's in the world's set.
export function iconFor(place: { kind: PlaceKind; icon?: string } | undefined, set: IconSet = 'old'): string | undefined {
  if (!place) return undefined;
  if (place.icon && MAP_ICONS[place.icon]) return place.icon;
  return kindIcon(place.kind, set);
}

// The colours an author can paint on cells. A look, never a rule.
export const MAP_PAINT = ['Green', 'Gold', 'Stone', 'Rust', 'Slate', 'Bone'] as const;
