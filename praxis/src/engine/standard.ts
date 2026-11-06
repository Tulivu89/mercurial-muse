// The standard ruleset: the Four Approaches on Genesys dice, as a module would write it.
//
// A module that sets `ruleset.extends: "four-approaches/1"` gets everything here beneath its
// own rules: its own states, approaches and deeds win by id, and anything it leaves out
// comes from here. So a world with no rules of its own is still playable, and every person,
// thing and place offers the four approaches without an author building a single obstacle.

export const STANDARD_RULESET_ID = 'four-approaches/1';

const share = (labels: [number, string][]) => labels.map(([at, label]) => ({ at, label }));

export const STANDARD_RULESET = {
  states: [
    ...(['force', 'finesse', 'focus', 'flair'] as const).map((id) => ({
      id, name: id.charAt(0).toUpperCase() + id.slice(1), scope: 'char', min: 1, max: 4, start: 1, category: 'Approaches',
    })),
    {
      id: 'health', name: 'Health', scope: 'char', min: 0, max: 8, start: 8, category: 'Condition', display: 'band', bandBasis: 'share',
      // Each label is its words, then what they mean, in one clean sentence. The screen shows
      // the words; the narrator reads it all, so a wound that is not yet the end says so. Any
      // loss leaves the resting band, so a success always shows. Pronouns come from the person.
      bands: share([[0, 'is down'], [1, 'is badly hurt, and every move costs you'], [34, 'is hurt, and it slows you'], [60, 'is bruised'], [100, 'is unhurt']]), restBand: 4,
      npcLabels: [
        'is down, out of the fight and unable to act',
        'is near death. One more good blow could drop |them|',
        'is hurt, bleeding and slowed, but still fighting',
        'is bruised, shaken but still fighting',
        'is unhurt',
      ],
      terminals: [{ at: 'min', note: 'They take no further part in this scene.', playerNote: 'You can do nothing more in this scene.' }],
      // Finesse can strike from cover, off its home ground.
      approach: { owner: 'force', secondary: ['finesse'] }, verb: 'Hurt or overpower',
    },
    {
      id: 'strain', name: 'Strain', scope: 'char', min: 0, max: 6, start: 6, category: 'Condition', display: 'band', bandBasis: 'share',
      bands: share([[0, 'is spent'], [1, 'is badly strained, and your composure is fraying'], [34, 'is strained'], [100, 'is steady']]), restBand: 3,
      // Against someone else, Strain is their will to hold out against you.
      npcLabels: [
        'has given way. |They| will take your word over anything |they| can see or know, and do as you ask, until something new changes |their| mind',
        'is close to giving way. |They| will hold out a little longer, but not much',
        'is wavering, no longer sure of |their| ground but still holding out',
        'is steady',
      ],
      terminals: [{ at: 'min', note: 'They stay that way unless something new changes their mind.', playerNote: 'You can push yourself no further until you rest.' }],
      approach: { owner: 'flair', secondary: ['force'] }, verb: 'Persuade, charm, bluff or intimidate',
    },
    { id: 'edge', name: 'Edge', scope: 'protagonist', min: 0, max: 1, start: 0, category: 'Momentum' },
    // Earned by overcoming people and obstacles, from lessons and milestones; spent on ratings
    // and charges. Never shown to the narrator.
    { id: 'experience', name: 'Experience', scope: 'protagonist', min: 0, max: 100000, start: 0, category: 'Growth' },
    // Your purse. Prices go up in steps of ten, each named for what it buys, and the narrator
    // reads only the band: what you could afford. Drinks, meals and a bed are never counted.
    {
      id: 'coin', name: 'Coin', scope: 'protagonist', min: 0, max: 1000000, start: 0, category: 'Purse', display: 'band', restBand: 1,
      bands: [
        { at: 0, label: 'have no money at all, not for a drink, a meal or a bed' },
        { at: 1, label: 'can pay for food, drink, a bed and small things' },
        { at: 10, label: 'could buy a sword or hire a blade for a month' },
        { at: 100, label: "could buy a horse or someone's contract" },
        { at: 1000, label: 'could buy a house or a ship' },
        { at: 10000, label: 'could buy a castle' },
      ],
    },
    // What your armour will still take: the first Health a failure costs comes off this.
    // Set by the armour you carry, and renewed on a rest. Never shown to the narrator.
    { id: 'armour', name: 'Armour', scope: 'protagonist', min: 0, max: 5, start: 0, category: 'Condition' },
    { id: 'story-points', name: 'Story Points', scope: 'protagonist', min: 0, max: 2, start: 1, category: 'Momentum' },
    { id: 'momentum', name: 'Momentum', scope: 'protagonist', min: -3, max: 3, start: 0, category: 'Momentum', display: 'hidden' },
    {
      id: 'alert', name: 'Alert', scope: 'place', min: 0, max: 3, start: 0, category: 'Scene', display: 'band',
      bands: share([[0, 'is quiet'], [1, 'is uneasy and keeps an eye on you'], [2, 'is watching closely, and one more slip will bring them down on you'], [3, 'is roused and acts against you']]), restBand: 0,
      line: '[Everyone at |nameMid| |bandLabel|.]',
      terminals: [{ at: 'max', note: 'Nothing passes unchallenged now.' }],
      // Flair can talk suspicion down, off its home ground.
      approach: { owner: 'finesse', secondary: ['flair'] }, verb: 'Lie low, cover your tracks',
    },
    // Haggling: Flair builds it on a seller, and your next purchase from them spends it.
    {
      id: 'bargain', name: 'Bargain', scope: 'npc', min: 0, max: 2, start: 0, category: 'Trade', display: 'band',
      bands: [{ at: 0, label: 'no bargain' }, { at: 1, label: 'a quarter off' }, { at: 2, label: 'half off' }], restBand: 0,
      line: '[|name| will give you |bandLabel| your next purchase.]',
      approach: { owner: 'flair', secondary: [] }, grows: true, verb: 'Haggle',
    },
    {
      id: 'refusing', name: 'Refusing to deal', scope: 'npc', min: 0, max: 1, start: 0, category: 'Trade', display: 'band',
      bands: [{ at: 0, label: 'will deal with you' }, { at: 1, label: "won't deal with you today" }], restBand: 0, countdown: 'day',
    },
    // Making something: Focus builds it up until it is finished. Its length comes from what is
    // being made (craft.ts).
    {
      id: 'progress', name: 'Progress', scope: 'work', min: 0, max: 2, start: 0, category: 'Making', display: 'band', bandBasis: 'share',
      bands: [{ at: 0, label: 'is not begun' }, { at: 1, label: 'is under way' }, { at: 50, label: 'is half done' }, { at: 100, label: 'is finished' }], restBand: 0,
      approach: { owner: 'focus', secondary: [] }, grows: true, verb: 'Work at it',
    },
    // Focus builds these up. Each point helps a later check against the same person, thing
    // or place, by another approach, and is spent there.
    {
      id: 'leverage', name: 'Leverage', scope: 'npc', min: 0, max: 2, start: 0, category: 'Focus', display: 'band',
      bands: share([[0, 'nothing'], [1, 'something'], [2, 'real leverage']]), restBand: 0, line: '[You have |bandLabel| on |nameMid|.]',
      approach: { owner: 'focus', secondary: [] }, grows: true, aids: 'easier', verb: 'Read them, find the pressure point',
    },
    {
      id: 'prepared', name: 'Prepared', scope: 'item', min: 0, max: 2, start: 0, category: 'Focus', display: 'band',
      bands: share([[0, 'have not studied'], [1, 'have studied'], [2, 'know every inch of']]), restBand: 0, line: '[You |bandLabel| |nameMid|.]',
      approach: { owner: 'focus', secondary: [] }, grows: true, aids: 'boost', verb: 'Study it, work out how it goes',
    },
    {
      id: 'prepared-place', name: 'Prepared', scope: 'place', min: 0, max: 2, start: 0, category: 'Focus', display: 'band',
      bands: share([[0, 'have not studied'], [1, 'have looked over'], [2, 'know every inch of']]), restBand: 0, line: '[You |bandLabel| |nameMid|.]',
      approach: { owner: 'focus', secondary: [] }, grows: true, aids: 'boost', verb: 'Search it, learn its ways',
    },
    // Obstacles: any thing in a scene can be broken or worked open.
    {
      id: 'integrity', name: 'Integrity', scope: 'item', min: 0, max: 2, start: 2, category: 'Obstacle', display: 'band',
      bands: share([[0, 'is broken'], [1, 'is damaged, still holding, but it will not take much more'], [100, 'is sound']]), restBand: 2, bandBasis: 'share',
      terminals: [{ at: 'min', note: 'It gives way, and whatever it held shut is open now.' }],
      approach: { owner: 'force', secondary: [] }, verb: 'Break it or force it',
    },
    {
      id: 'security', name: 'Security', scope: 'item', min: 0, max: 2, start: 2, category: 'Obstacle', display: 'band',
      bands: share([[0, 'is open'], [1, 'is giving, nearly open'], [100, 'is secure']]), restBand: 2, bandBasis: 'share',
      terminals: [{ at: 'min', note: 'Whatever it kept shut or held fast is yours to take.' }],
      // Focus can work out the mechanism, off its home ground.
      approach: { owner: 'finesse', secondary: ['focus'] }, verb: 'Pick it, work it loose, take it',
    },
  ],
  approaches: [
    { id: 'force', name: 'Force', failure: [{ stateId: 'health', who: 'player', add: -1 }, { stateId: 'alert', who: 'place', add: 1 }], threat: [{ stateId: 'alert', who: 'place', add: 1 }] },
    { id: 'finesse', name: 'Finesse', failure: [{ stateId: 'alert', who: 'place', add: 1 }], threat: [{ stateId: 'alert', who: 'place', add: 1 }] },
    { id: 'focus', name: 'Focus', failureMinutes: 30, threatMinutes: 15 },
    { id: 'flair', name: 'Flair', failure: [{ stateId: 'strain', who: 'player', add: -1 }], threat: [{ stateId: 'strain', who: 'player', add: -1 }] },
  ],
  // Acts with no state to wear down: they simply work or fail, and fail at the approach's cost.
  deeds: [
    { kind: 'person', approach: 'finesse', label: 'Lift, slip past or plant something' },
  ],
  // Who comes with you when you travel. The first that holds is the one used.
  follow: [
    { id: 'companion', label: 'Bring along', as: 'travelling with you', anyOf: [{ bond: 'follows' }] },
    { id: 'captive', label: 'Take as your captive', as: 'your captive', anyOf: [{ stateId: 'health', atMost: 0 }] },
    { id: 'won-over', label: 'Have them come with you', as: 'going along with you', anyOf: [{ stateId: 'strain', atMost: 0 }] },
  ],
  dice: {
    difficulty: 2, edge: 'edge', storyPoints: 'story-points', momentum: 'momentum',
    setbacks: [
      { stateId: 'health', who: 'player', atMost: 4, reason: 'You are hurt' },
      { stateId: 'alert', who: 'place', atLeast: 2, approaches: ['finesse'], reason: 'Someone is watching' },
      { stateId: 'alert', who: 'place', atLeast: 3, reason: 'The scene is roused' },
    ],
    push: { stateId: 'strain', add: -2 },
  },
  rest: { minutes: 480, effects: [{ stateId: 'health', add: 1 }, { stateId: 'strain', toMax: true }], resetCharges: true },
  // A fight is over when someone is down, or yields to Force, and no one else here is still
  // in it. The place settles to uneasy.
  fight: { harm: 'health', yields: [{ stateId: 'strain', approaches: ['force'] }], settle: { stateId: 'alert', atMost: 1 } },
  // A plain catalog any world can sell. Modules add their own and may replace these by id.
  goods: [
    { id: 'knife', name: 'a knife', plural: 'knives', worth: 1, kind: 'weapon', harm: 1, hidden: true },
    { id: 'club', name: 'a club', worth: 1, kind: 'weapon', harm: 1, hidden: true },
    { id: 'sword', name: 'a sword', worth: 10, kind: 'weapon', harm: 2 },
    { id: 'axe', name: 'an axe', worth: 10, kind: 'weapon', harm: 2 },
    { id: 'spear', name: 'a spear', worth: 10, kind: 'weapon', harm: 2 },
    { id: 'jerkin', name: 'a leather jerkin', worth: 1, kind: 'armour', armour: 1 },
    { id: 'mail', name: 'a mail shirt', worth: 10, kind: 'armour', armour: 2 },
    { id: 'plate', name: 'a suit of plate', plural: 'suits of plate', worth: 100, kind: 'armour', armour: 3, hinders: ['finesse'] },
    { id: 'lockpicks', name: 'a set of lockpicks', plural: 'sets of lockpicks', worth: 1, kind: 'help', helps: { approaches: ['finesse'], kinds: ['thing'] } },
    { id: 'fine-clothes', name: 'a suit of fine clothes', plural: 'suits of fine clothes', worth: 10, kind: 'help', helps: { approaches: ['flair'], kinds: ['person'] } },
    { id: 'poultice', name: 'a poultice', worth: 1, kind: 'use', restores: [{ stateId: 'health', add: 2 }] },
    { id: 'tonic', name: 'a tonic', worth: 1, kind: 'use', restores: [{ stateId: 'strain', add: 2 }] },
    { id: 'smoke-pot', name: 'a smoke pot', worth: 1, kind: 'use', restores: [{ stateId: 'alert', who: 'place', add: -1 }] },
  ],
  trade: {
    coin: 'coin', bargain: 'bargain', refusing: 'refusing', armour: 'armour',
    price: { minion: 1, rival: 10, nemesis: 100 }, purse: { minion: 1, rival: 10, nemesis: 100 },
    sellBack: 0.5, bribeApproaches: ['flair', 'finesse'],
  },
  // Making things: a knife's worth is a track of 1 and an hour a check, a sword's 2 and half a
  // day, a horse's 3 and a day, a house's 5 and a week. A castle needs more than one pair of
  // hands.
  craft: {
    approach: 'focus', stateId: 'progress', materials: 0.5, difficulty: 2, fineDifficulty: 3,
    steps: [{ upTo: 1, track: 1, minutes: 60 }, { upTo: 10, track: 2, minutes: 720 }, { upTo: 100, track: 3, minutes: 1440 }, { upTo: 1000, track: 5, minutes: 10080 }],
  },
  // Genesys's prices with Praxis's own earning. See Praxis — Growth, Challenge and Economy.
  growth: {
    stateId: 'experience', overcome: { minion: 1, rival: 4, nemesis: 10 }, obstacle: 1, hardObstacle: 2, hardFrom: 3, lesson: 1,
    ratingCost: 10, ratingMax: 4, chargeCost: 5,
  },
  // The Four Approaches tiers: how hard someone is to act against, and their maxima.
  tiers: {
    // A minion falls to one success: a proficient character beats them in a single roll.
    minion: { difficulty: 1, maxima: { health: 1, strain: 1 } },
    rival: { difficulty: 2, maxima: { health: 5, strain: 4 } },
    nemesis: { difficulty: 3, maxima: { health: 8, strain: 6 } },
  },
};

type Keyed = { id?: string; kind?: string; approach?: string };

// The standard's entries in their own order, each replaced by the module's own where it has
// one, then the module's additions.
function mergeBy<T extends Keyed>(base: readonly T[], own: unknown, key: (entry: T) => string): T[] {
  const mine = Array.isArray(own) ? (own as T[]) : [];
  const byKey = new Map(mine.map((entry) => [key(entry), entry]));
  const known = new Set(base.map(key));
  return [...base.map((entry) => byKey.get(key(entry)) ?? entry), ...mine.filter((entry) => !known.has(key(entry)))];
}

// The module's raw ruleset with the standard one beneath it, when it asks for it.
export function withStandard(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const module = raw as Record<string, unknown>;
  const ruleset = module.ruleset && typeof module.ruleset === 'object' ? (module.ruleset as Record<string, unknown>) : null;
  if (!ruleset || ruleset.extends !== STANDARD_RULESET_ID) return raw;
  const merged: Record<string, unknown> = {
    ...ruleset,
    states: mergeBy(STANDARD_RULESET.states as Keyed[], ruleset.states, (entry) => entry.id ?? ''),
    approaches: mergeBy(STANDARD_RULESET.approaches as Keyed[], ruleset.approaches, (entry) => entry.id ?? ''),
    deeds: mergeBy(STANDARD_RULESET.deeds as Keyed[], ruleset.deeds, (entry) => `${entry.kind}:${entry.approach}`),
    follow: mergeBy(STANDARD_RULESET.follow as Keyed[], ruleset.follow, (entry) => entry.id ?? ''),
    dice: ruleset.dice ?? STANDARD_RULESET.dice,
    rest: ruleset.rest ?? STANDARD_RULESET.rest,
    fight: ruleset.fight ?? STANDARD_RULESET.fight,
    growth: ruleset.growth ?? STANDARD_RULESET.growth,
    goods: mergeBy(STANDARD_RULESET.goods as Keyed[], ruleset.goods, (entry) => entry.id ?? ''),
    trade: ruleset.trade ?? STANDARD_RULESET.trade,
    craft: ruleset.craft ?? STANDARD_RULESET.craft,
    tiers: ruleset.tiers ?? STANDARD_RULESET.tiers,
  };
  return { ...module, ruleset: merged };
}
