// Pictures that come with the site: a world's `pictures.json` beside its world file names a file
// in its `pictures/` folder for each character's slots (avatar, an emotion, `fig:<figure id>`)
// and for each Home's cover and rooms. The files are served from GitHub through jsDelivr, pinned
// to the commit the site was built from, so they cost the web server no bandwidth and a changed
// picture shows on the next deploy. A picture someone sets in their own browser wins over these.
// How to add or change one: content/PICTURES.md.
import hogWild from '../../content/hog-wild/pictures.json';

export const PICTURES_FORMAT = 'inkwyrm-pictures/1';
export interface PictureList {
  format: string;
  world: string;
  characters?: Record<string, Record<string, string>>;
  homes?: Record<string, { cover?: string; rooms?: Record<string, string> }>;
}
// Every world with pictures. A new world's list is one more line here.
export const PICTURE_LISTS: readonly PictureList[] = [hogWild];

// The slot a Home's cover picture sits in, beside its `room:<id>` slots.
export const COVER_SLOT = 'cover';

// Set at build time by kit/pictures.config.ts: the jsDelivr address in a build, the repository
// itself under the dev server. Anything else (tests) reads from the site's own /content/.
declare const __INKWYRM_PICTURES__: string | undefined;
export const PICTURE_BASE = typeof __INKWYRM_PICTURES__ === 'string' ? __INKWYRM_PICTURES__ : '/content/';

// Each list as picture sets by owner (`<world>:<record>`), slot to address.
export function pictureSets(lists: readonly PictureList[] = PICTURE_LISTS, base = PICTURE_BASE): Record<string, Record<string, string>> {
  const sets: Record<string, Record<string, string>> = {};
  for (const list of lists) {
    const url = (file: string) => `${base}${list.world}/pictures/${encodeURIComponent(file)}`;
    for (const [id, slots] of Object.entries(list.characters ?? {})) {
      const set = (sets[`${list.world}:${id}`] ??= {});
      for (const [slot, file] of Object.entries(slots)) set[slot] = url(file);
    }
    for (const [id, home] of Object.entries(list.homes ?? {})) {
      const set = (sets[`${list.world}:${id}`] ??= {});
      if (home.cover) set[COVER_SLOT] = url(home.cover);
      for (const [room, file] of Object.entries(home.rooms ?? {})) set[`room:${room}`] = url(file);
    }
  }
  return sets;
}

// The site's pictures under this browser's own: a slot the browser has filled keeps its picture.
export function withSitePictures(own: Record<string, Record<string, string>>, site = pictureSets()): Record<string, Record<string, string>> {
  const out = { ...own };
  for (const [owner, set] of Object.entries(site)) out[owner] = { ...set, ...own[owner] };
  return out;
}
