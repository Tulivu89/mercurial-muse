// What comes with Inkwyrm, as the Overview shows it before anyone has made anything of their own
// (docs/front-page/implementation.md, *Example manifest*). Showing an example installs nothing:
// a world opens in the Studio only when asked, and a game starts only from the Adventure's own
// start screen. The lines are taken from the bundled modules' own words; the opening is quoted.
export { HOUSE_WORLD_ID } from '../../chat/src/errata';
export const IMPORTS_WORLD_ID = 'inkwyrm-imports';

export interface ExampleWorld { worldId: string; name: string; line: string; note: string; href: string; cover: { over: string; title: string } }
export interface ExampleAdventure { name: string; title: string; opening: string; href: string; note: string }

export const EXAMPLE_WORLDS: ExampleWorld[] = [
  {
    worldId: 'abernys-bogwater', name: 'Abernys: Bogwater',
    line: 'A fen town on an island of layered migrations. Grim, wet and dangerous, with room for hijinks.',
    note: 'Opens a copy in the Studio, in this browser. Nothing changes until you do.',
    href: '/studio/#/bring/bogwater', cover: { over: 'Abernys', title: 'Bogwater' },
  },
  {
    worldId: 'abernys-port-covenant', name: 'Abernys: Port Covenant',
    line: 'A dark-fantasy island port, settled in layers of migration and conquest. Grim, political and uncanny.',
    note: 'Opens a copy in the Studio, in this browser.',
    href: '/studio/#/bring/port-covenant', cover: { over: 'Abernys', title: 'Port Covenant' },
  },
];

export const EXAMPLE_ADVENTURES: ExampleAdventure[] = [
  {
    name: 'Abernys: Bogwater', title: 'In the net at the long fence',
    opening: 'The net comes up out of the black water all at once, and you come up with it.',
    href: '/', note: 'Pick it under New game. Playing needs your own model; looking around doesn\'t.',
  },
];
