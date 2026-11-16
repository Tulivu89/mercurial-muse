// What comes with Inkwyrm, as the Overview shows it before anyone has made anything of their own
// (docs/front-page/implementation.md, *Example manifest*). Showing an example installs nothing:
// a world opens in the Studio only when asked, and a game starts only from the Adventure's own
// start screen. The lines are taken from the bundled modules' own words; the opening is quoted.
export { HOUSE_WORLD_ID } from '../../kit/src/included';
export const IMPORTS_WORLD_ID = 'inkwyrm-imports';

export interface ExampleWorld { worldId: string; name: string; line: string; note: string; href: string; cover: { over: string; title: string } }
// A home that comes with the site: a household's house, by its world and its scenario.
export interface ExampleHome { worldId: string; scenarioId: string; name: string; world: string; line: string; who: string }
export interface ExampleAdventure { name: string; title: string; opening: string; href: string; note: string }

// No world comes with the site as an example yet: the dragon's resort and HOG Wild are
// households, shown under Homes, and never offered as worlds to play.
export const EXAMPLE_WORLDS: ExampleWorld[] = [];

export const EXAMPLE_HOMES: ExampleHome[] = [
  {
    worldId: 'dragons-resort', scenarioId: 'resort-arrival', name: 'Autumn\'s Leaves', world: 'The dragon\'s resort',
    line: 'A teahouse at the edge of myth, run by a dragon whose mother and half-sister have moved in for the season.',
    who: 'Qiulong, Errata and Echydna',
  },
  {
    worldId: 'hog-wild', scenarioId: 'house', name: 'The House', world: 'HOG Wild',
    line: 'A glass-fronted house on the Mile streams six residents to the city, always live, and the audience bids on their choices.',
    who: 'Six residents, one of them a companion unit',
  },
];

export const EXAMPLE_ADVENTURES: ExampleAdventure[] = [
  {
    name: 'Abernys: Bogwater', title: 'In the net at the long fence',
    opening: 'The net comes up out of the black water all at once, and you come up with it.',
    href: '/', note: 'Pick it under New game. Playing needs your own model; looking around doesn\'t.',
  },
];
