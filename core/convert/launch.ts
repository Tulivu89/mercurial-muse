// The hand-off from the Studio to the adventure: converted modules left in the browser's
// localStorage for the adventure's start screen to list and start. Both apps are served from
// one origin, so they share it. The reading and writing of storage is each app's own; this is
// only the shape.
export const LAUNCH_KEY = 'inkwyrm.launch';

export interface Launched {
  // The world's id.
  id: string;
  name: string;
  // When it was sent, in milliseconds.
  at: number;
  module: unknown;
}

export function readLaunches(stored: string | null): Launched[] {
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is Launched => typeof entry === 'object' && entry !== null && typeof (entry as Launched).id === 'string' && typeof (entry as Launched).name === 'string' && typeof (entry as Launched).at === 'number' && 'module' in entry);
  } catch {
    return [];
  }
}

// The list with this one first, replacing an earlier send of the same world, newest kept.
export function withLaunch(launches: readonly Launched[], entry: Launched, keep = 6): Launched[] {
  return [entry, ...launches.filter((existing) => existing.id !== entry.id)].slice(0, keep);
}

export function withoutLaunch(launches: readonly Launched[], id: string): Launched[] {
  return launches.filter((existing) => existing.id !== id);
}
