// The site's pictures (content/PICTURES.md): every list names a world that comes with the site,
// people and rooms that are in it, slots Chat has, and files that are there and small enough for
// jsDelivr. A mistake here fails the deploy before the running site is touched.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { PICTURE_LISTS, PICTURES_FORMAT, pictureSets, withSitePictures } from '../../kit/src/pictures';
import { EMOTIONS } from '../../core/chat/index.js';
import { parseWorld } from '../../core/records/index.js';

const content = `${resolve(__dirname, '../../content')}/`;
const IMAGE = /\.(png|jpe?g|webp|gif|avif|apng)$/i;
const MAX_BYTES = 15 * 1024 * 1024;

describe.each(PICTURE_LISTS.map((list) => [list.world, list] as const))('pictures for %s', (world, list) => {
  const read = parseWorld(JSON.parse(readFileSync(`${content}${world}/world.json`, 'utf8')));
  if (!read.ok) throw new Error(read.errors.join(' '));
  const records = read.world.records;
  const file = (name: string) => {
    expect(name, `${name} is not a picture type the site shows`).toMatch(IMAGE);
    const path = `${content}${world}/pictures/${name}`;
    expect(existsSync(path), `${world}/pictures/${name} is missing`).toBe(true);
    expect(statSync(path).size, `${name} is over 15 MB`).toBeLessThan(MAX_BYTES);
  };

  it('is a picture list for its world', () => {
    expect(list.format).toBe(PICTURES_FORMAT);
    expect(read.world.id).toBe(world);
  });

  it("names the world's characters, their slots and files that are there", () => {
    for (const [id, slots] of Object.entries(list.characters ?? {})) {
      const record = records.find((entry) => entry.id === id && entry.kind === 'character');
      expect(record, `no character "${id}" in ${world}`).toBeTruthy();
      for (const [slot, name] of Object.entries(slots)) {
        const known = ['avatar', 'cover', ...EMOTIONS].includes(slot)
          || (slot.startsWith('fig:') && record!.figures.some((figure) => `fig:${figure.id}` === slot));
        expect(known, `"${slot}" is not a picture slot for ${id}`).toBe(true);
        file(name);
      }
    }
  });

  it("names the world's Homes, their rooms and files that are there", () => {
    for (const [id, home] of Object.entries(list.homes ?? {})) {
      const scenario = records.find((entry) => entry.id === id && entry.kind === 'scenario');
      expect(scenario, `no Home "${id}" in ${world}`).toBeTruthy();
      const rooms = scenario!.sets.find((set) => set.members.length)?.members ?? [];
      if (home.cover) file(home.cover);
      for (const [room, name] of Object.entries(home.rooms ?? {})) {
        expect(rooms.some((member) => member.id === room), `no room "${room}" in ${id}`).toBe(true);
        file(name);
      }
    }
  });
});

describe('the site pictures', () => {
  it('fill only what a browser has not set', () => {
    const site = pictureSets([{ format: PICTURES_FORMAT, world: 'w', characters: { a: { avatar: 'a b.png' } }, homes: { h: { cover: 'c.jpg', rooms: { r: 'r.jpg' } } } }], 'https://cdn/');
    expect(site).toEqual({ 'w:a': { avatar: 'https://cdn/w/pictures/a%20b.png' }, 'w:h': { cover: 'https://cdn/w/pictures/c.jpg', 'room:r': 'https://cdn/w/pictures/r.jpg' } });
    const merged = withSitePictures({ 'w:a': { avatar: 'mine' }, 'x:y': { avatar: 'other' } }, site);
    expect(merged['w:a']).toEqual({ avatar: 'mine' });
    expect(merged['w:h']!.cover).toBe('https://cdn/w/pictures/c.jpg');
    expect(merged['x:y']).toEqual({ avatar: 'other' });
  });
});
