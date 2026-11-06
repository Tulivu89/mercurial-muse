// Scratch: exact odds for the growth proposal. Not part of the repo.
import { FACES, buildPool, type DieKind } from '../src/engine/dice';

type Dist = Map<string, number>; // key "net,triumph,despair"
const parse = (face: string) => {
  const S = (face.match(/S/g) ?? []).length + (face.match(/R/g) ?? []).length;
  const F = (face.match(/F/g) ?? []).length + (face.match(/D/g) ?? []).length;
  return { net: S - F, r: face.includes('R') ? 1 : 0, d: face.includes('D') ? 1 : 0 };
};
function dist(dice: DieKind[]): Dist {
  let states: Dist = new Map([['0,0,0', 1]]);
  for (const kind of dice) {
    const next: Dist = new Map();
    for (const [key, p] of states) {
      const [n, r, d] = key.split(',').map(Number) as [number, number, number];
      for (const face of FACES[kind]) {
        const f = parse(face);
        const k = `${n + f.net},${Math.min(1, r + f.r)},${Math.min(1, d + f.d)}`;
        next.set(k, (next.get(k) ?? 0) + p / FACES[kind].length);
      }
    }
    states = next;
  }
  return states;
}
interface Opp { difficulty: number; upgrades?: number; boost?: number; setback?: number }
function poolOf(rating: number, charge: number, o: Opp) {
  return buildPool({ rating, charge, upgrades: 0, boost: o.boost ?? 0, difficulty: o.difficulty, difficultyUpgrades: o.upgrades ?? 0, setback: o.setback ?? 0 });
}
// Damage distribution: amount = net + triumph on success, else 0.
function damage(rating: number, charge: number, o: Opp): number[] {
  const p = poolOf(rating, charge, o);
  const d = dist([...p.good, ...p.bad]);
  const out: number[] = [];
  for (const [key, pr] of d) {
    const [n, r] = key.split(',').map(Number) as [number, number];
    const amount = n >= 1 ? n + r : 0;
    out[amount] = (out[amount] ?? 0) + pr;
  }
  return Array.from(out, (x) => x ?? 0);
}
const success = (rating: number, charge: number, o: Opp) => 1 - damage(rating, charge, o)[0]!;
const pct = (x: number) => `${Math.round(x * 100)}%`;

// Rolls to bring a track to 0, using the highest unspent charge each roll; charges reset when all are spent.
function rollsToBeat(rating: number, charges: number[], track: number, o: Opp, maxRolls = 80) {
  const cycle = charges.length ? [...charges].sort((a, b) => b - a) : [0];
  const dmg = cycle.map((c) => damage(rating, c, o));
  let alive = new Map<number, number>([[track, 1]]);
  const doneBy: number[] = [];
  let done = 0;
  for (let roll = 1; roll <= maxRolls; roll += 1) {
    const d = dmg[(roll - 1) % cycle.length]!;
    const next = new Map<number, number>();
    for (const [hp, p] of alive) {
      d.forEach((pk, k) => {
        const left = hp - k;
        if (left <= 0) done += p * pk; else next.set(left, (next.get(left) ?? 0) + p * pk);
      });
    }
    alive = next;
    doneBy[roll] = done;
  }
  let expected = 0;
  for (let roll = 1; roll <= maxRolls; roll += 1) expected += 1 - (doneBy[roll - 1] ?? 0);
  return { expected, by: (n: number) => doneBy[n] ?? 0 };
}

const mode = process.argv[2];
const DIFFS: [string, Opp][] = [['Easy', { difficulty: 1 }], ['Average', { difficulty: 2 }], ['Hard', { difficulty: 3 }], ['Daunting', { difficulty: 4 }], ['Average+1red', { difficulty: 2, upgrades: 1 }], ['Hard+1red', { difficulty: 3, upgrades: 1 }], ['Hard+2red', { difficulty: 3, upgrades: 2 }]];
if (mode === 'table') {
  for (const [name, o] of DIFFS) {
    console.log(`\n${name}: rows rating 1-4, cols charge 0..5`);
    for (let r = 1; r <= 4; r += 1) console.log(`  r${r}: ${[0, 1, 2, 3, 4, 5].map((c) => pct(success(r, c, o)).padStart(4)).join(' ')}`);
  }
}
if (mode === 'tiers') {
  const builds: [string, number, number[]][] = [
    ['r1 raw', 1, [1]], ['r2 practiced', 2, [1, 2]], ['r3 trained', 3, [1, 2, 3]], ['r3 expert', 3, [1, 2, 3, 4]], ['r4 trained', 4, [1, 2, 3]], ['r4 expert', 4, [1, 2, 3, 4]], ['r4 master', 4, [1, 2, 3, 4, 5]], ['r2 none', 2, []], ['r3 none', 3, []],
  ];
  const tiers: [string, number, Opp][] = [
    ['minion 1 vs Easy', 1, { difficulty: 1 }],
    ['rival S4 vs Avg', 4, { difficulty: 2 }], ['rival H5 vs Avg', 5, { difficulty: 2 }], ['rival 3 vs Avg', 3, { difficulty: 2 }],
    ['nemesis S6 vs Hard', 6, { difficulty: 3 }], ['nemesis H8 vs Hard', 8, { difficulty: 3 }], ['nemesis S6 vs Hard+1red', 6, { difficulty: 3, upgrades: 1 }],
    ['nemesis S6 vs Hard+1red, Leverage 2 (Easy+1red)', 6, { difficulty: 1, upgrades: 1 }],
  ];
  for (const [tn, track, o] of tiers) {
    console.log(`\n${tn}`);
    for (const [bn, r, ch] of builds) {
      const res = rollsToBeat(r, ch, track, o);
      console.log(`  ${bn.padEnd(13)} expected ${res.expected.toFixed(1).padStart(5)} rolls · by 1: ${pct(res.by(1)).padStart(4)} · by 3: ${pct(res.by(3)).padStart(4)} · by 5: ${pct(res.by(5)).padStart(4)} · by 8: ${pct(res.by(8)).padStart(4)}`);
    }
  }
}
if (mode === 'aids') {
  // Leverage: steps easier; bribe works the same way in the proposal.
  for (const [r, c] of [[1, 1], [2, 2], [3, 3], [2, 0], [3, 0]] as const) {
    const row = [2, 1, 0].map((d) => pct(success(r, c, { difficulty: d })));
    console.log(`r${r} c${c}: Average ${row[0]} · one step easier ${row[1]} · two steps ${row[2]}`);
  }
}
if (mode === 'stages') {
  const ladder: Record<string, number[]> = { none: [], raw: [1], practiced: [1, 2], trained: [1, 2, 3], expert: [1, 2, 3, 4], master: [1, 2, 3, 4, 5] };
  const stages: [string, [string, number, string][]][] = [
    ['Start (0 XP)', [['Flair', 3, 'trained'], ['Force', 2, 'practiced'], ['Finesse', 2, 'practiced'], ['Focus', 1, 'raw']]],
    ['Seasoned (~75 XP)', [['Flair', 3, 'expert'], ['Force', 2, 'trained'], ['Finesse', 3, 'practiced'], ['Focus', 1, 'practiced']]],
    ['Veteran (~240 XP)', [['Flair', 4, 'master'], ['Force', 3, 'expert'], ['Finesse', 3, 'trained'], ['Focus', 2, 'trained']]],
  ];
  const avgOver = (r: number, ch: number[], o: Opp) => { const c = ch.length ? ch : [0]; return c.reduce((s, x) => s + success(r, x, o), 0) / c.length; };
  for (const [name, approaches] of stages) {
    console.log(`\n${name}`);
    for (const [a, r, l] of approaches) {
      const ch = ladder[l]!;
      const cells = [
        pct(avgOver(r, ch, { difficulty: 1 })), pct(avgOver(r, ch, { difficulty: 2 })), pct(avgOver(r, ch, { difficulty: 3 })), pct(avgOver(r, ch, { difficulty: 3, upgrades: 1 })),
        rollsToBeat(r, ch, 4, { difficulty: 2 }).expected.toFixed(1), rollsToBeat(r, ch, 5, { difficulty: 2 }).expected.toFixed(1),
        rollsToBeat(r, ch, 6, { difficulty: 3, upgrades: 1 }).expected.toFixed(1), rollsToBeat(r, ch, 8, { difficulty: 3, upgrades: 1 }).expected.toFixed(1),
      ];
      console.log(`  ${a.padEnd(8)} r${r} ${l.padEnd(9)} Easy ${cells[0]} Avg ${cells[1]} Hard ${cells[2]} Hard+red ${cells[3]} | rival S4 ${cells[4]} H5 ${cells[5]} | nemesis(Hard+red) S6 ${cells[6]} H8 ${cells[7]}`);
    }
  }
}
if (mode === 'gang') {
  // Genesys minion groups: a group of N acts as one, Health N, difficulty 1 upgraded by N-1? Here: difficulty 1 + (N-1) purple.
  for (const n of [1, 2, 3, 4]) {
    const o = { difficulty: Math.min(4, n) };
    console.log(`gang of ${n} (Health ${n}, ${n} purple): r2 practiced ${rollsToBeat(2, [1, 2], n, o).expected.toFixed(1)} · r3 trained ${rollsToBeat(3, [1, 2, 3], n, o).expected.toFixed(1)} rolls`);
  }
}
if (mode === 'bribe') {
  // A bribe at their price makes it one step easier; a scale above, two. Flair vs a rival (Average).
  for (const [r, l, ch] of [[3, 'trained', [1, 2, 3]], [2, 'practiced', [1, 2]], [1, 'raw', [1]]] as [number, string, number[]][]) {
    const one = (d: number) => ch.reduce((s, c) => s + success(r, c, { difficulty: d }), 0) / ch.length;
    console.log(`r${r} ${l}: no bribe ${pct(one(2))} · at their price ${pct(one(1))} · a scale above ${pct(one(0))}`);
  }
  // Minion at Easy with a bribe at price: difficulty 0.
  console.log(`minion, r2 practiced, bribe at price: ${pct(([1, 2]).reduce((s, c) => s + success(2, c, { difficulty: 0 }), 0) / 2)}`);
}
if (mode === 'ladders') {
  const sets: [string, number[]][] = [['trained 1-3', [1, 2, 3]], ['expert 1-4', [1, 2, 3, 4]], ['expert 2-4', [2, 3, 4]], ['master 1-5', [1, 2, 3, 4, 5]], ['master 3-5', [3, 4, 5]]];
  for (const r of [2, 3, 4]) for (const [n, ch] of sets) {
    const avg = (o: Opp) => pct(ch.reduce((s, c) => s + success(r, c, o), 0) / ch.length);
    console.log(`r${r} ${n.padEnd(11)} Avg ${avg({ difficulty: 2 })} Hard ${avg({ difficulty: 3 })} Hard+red ${avg({ difficulty: 3, upgrades: 1 })} | rival S4 ${rollsToBeat(r, ch, 4, { difficulty: 2 }).expected.toFixed(1)} H5 ${rollsToBeat(r, ch, 5, { difficulty: 2 }).expected.toFixed(1)} | nemesis S6 ${rollsToBeat(r, ch, 6, { difficulty: 3, upgrades: 1 }).expected.toFixed(1)} H8 ${rollsToBeat(r, ch, 8, { difficulty: 3, upgrades: 1 }).expected.toFixed(1)}`);
  }
}
if (mode === 'rank') {
  const builds: [string, number, number[]][] = [['Flair 3 Trained', 3, [1, 2, 3]], ['Force 2 Practiced', 2, [1, 2]], ['Flair 4 Master', 4, [1, 2, 3, 4, 5]]];
  const opps: [string, Opp, number][] = [['rival r0', { difficulty: 2 }, 4], ['rival r1', { difficulty: 2, upgrades: 1 }, 4], ['rival r2', { difficulty: 2, upgrades: 2 }, 4], ['nemesis r0', { difficulty: 3 }, 6], ['nemesis r1', { difficulty: 3, upgrades: 1 }, 6], ['nemesis r2', { difficulty: 3, upgrades: 2 }, 6]];
  for (const [on, o, track] of opps) {
    console.log(`${on.padEnd(11)} ${builds.map(([bn, r, ch]) => `${bn}: ${pct(ch.reduce((s, c) => s + success(r, c, o), 0) / ch.length)} (${rollsToBeat(r, ch, track, o).expected.toFixed(1)} rolls)`).join(' · ')}`);
  }
}
// Items: harm added on success, boost dice, and Health lost over a fight.
function damageH(rating: number, charge: number, o: Opp, harm: number): number[] {
  const base = damage(rating, charge, o);
  const out: number[] = [base[0]!];
  base.forEach((p, k) => { if (k > 0) out[k + harm] = (out[k + harm] ?? 0) + p; });
  return Array.from(out, (x) => x ?? 0);
}
function fight(rating: number, charges: number[], track: number, o: Opp, harm: number, maxRolls = 120) {
  const cycle = charges.length ? [...charges].sort((a, b) => b - a) : [0];
  const dm = cycle.map((c) => damageH(rating, c, o, harm));
  // Failure and despair chances per charge, for Health lost (1 per failure, 2 on a despair).
  const loss = cycle.map((c) => {
    const p = poolOf(rating, c, o); const d = dist([...p.good, ...p.bad]); let l = 0;
    for (const [key, pr] of d) { const [n, , de] = key.split(',').map(Number) as [number, number, number]; if (n < 1) l += pr * (de ? 2 : 1); }
    return l;
  });
  let alive = new Map<number, number>([[track, 1]]); let expected = 0; let lost = 0;
  for (let roll = 1; roll <= maxRolls; roll += 1) {
    const i = (roll - 1) % cycle.length; const d = dm[i]!;
    let mass = 0; for (const p of alive.values()) mass += p;
    expected += mass; lost += mass * loss[i]!;
    const next = new Map<number, number>();
    for (const [hp, p] of alive) d.forEach((pk, k) => { const left = hp - k; if (left > 0) next.set(left, (next.get(left) ?? 0) + p * pk); });
    alive = next;
  }
  return { rolls: expected, lost };
}
if (mode === 'items') {
  const builds: [string, number, number[]][] = [['r1 raw', 1, [1]], ['r2 practiced', 2, [1, 2]], ['r3 trained', 3, [1, 2, 3]]];
  console.log('Tool, +1 boost (avg over cycle):');
  for (const [bn, r, ch] of builds) {
    const avg = (o: Opp) => pct(ch.reduce((s, c) => s + success(r, c, o), 0) / ch.length);
    console.log(`  ${bn}: Average ${avg({ difficulty: 2 })} -> ${avg({ difficulty: 2, boost: 1 })} · Hard ${avg({ difficulty: 3 })} -> ${avg({ difficulty: 3, boost: 1 })}`);
  }
  console.log('Weapon: rolls to drop, and Health lost on the way (1 a failure, 2 on despair):');
  for (const [bn, r, ch] of builds) for (const [tn, track, o] of [['rival H5', 5, { difficulty: 2 }], ['nemesis H8 Hard+1red', 8, { difficulty: 3, upgrades: 1 }]] as [string, number, Opp][]) {
    const row = [0, 1, 2].map((h) => { const f = fight(r, ch, track, o, h); return `${f.rolls.toFixed(1)} rolls, ${f.lost.toFixed(1)} Health`; });
    console.log(`  ${bn} vs ${tn}: bare ${row[0]} · weapon ${row[1]} · heavy ${row[2]}`);
  }
}
if (mode === 'craft') {
  const builds: [string, number, number[]][] = [['Focus 1 Raw', 1, [1]], ['Focus 2 Practiced', 2, [1, 2]], ['Focus 3 Trained', 3, [1, 2, 3]]];
  for (const [bn, r, ch] of builds) {
    const cells = [1, 2, 3, 5].map((need) => `${need}: ${rollsToBeat(r, ch, need, { difficulty: 2 }).expected.toFixed(1)}`);
    const hard = [1, 2, 3].map((need) => `${need}: ${rollsToBeat(r, ch, need, { difficulty: 3 }).expected.toFixed(1)}`);
    console.log(`${bn}: Average, progress ${cells.join(' · ')} | Hard ${hard.join(' · ')}`);
  }
}
// Full read of a pool: P(success), and expected cost to the player per roll:
// failure costs 1 (2 on a despair), and two or more net threat costs 1.
function readPool(rating: number, charge: number, o: Opp) {
  const p = poolOf(rating, charge, o);
  // Need advantage/threat too: recompute with full tallies.
  let states = new Map<string, number>([['0,0,0,0', 1]]); // net success, net advantage, triumph, despair
  for (const kind of [...p.good, ...p.bad]) {
    const next = new Map<string, number>();
    for (const [key, pr] of states) {
      const [n, a, r, d] = key.split(',').map(Number) as [number, number, number, number];
      for (const face of FACES[kind]) {
        const S = (face.match(/[SR]/g) ?? []).length, F = (face.match(/[FD]/g) ?? []).length, A = (face.match(/A/g) ?? []).length, T = (face.match(/T/g) ?? []).length;
        const k = `${n + S - F},${a + A - T},${Math.min(1, r + (face.includes('R') ? 1 : 0))},${Math.min(1, d + (face.includes('D') ? 1 : 0))}`;
        next.set(k, (next.get(k) ?? 0) + pr / FACES[kind].length);
      }
    }
    states = next;
  }
  let succ = 0, cost = 0;
  for (const [key, pr] of states) {
    const [n, a, , d] = key.split(',').map(Number) as [number, number, number, number];
    if (n >= 1) succ += pr; else cost += pr * (d ? 2 : 1);
    if (a <= -2) cost += pr;
  }
  return { succ, cost };
}
function route(rating: number, charges: number[], track: number, o: Opp) {
  const cycle = charges.length ? [...charges].sort((a, b) => b - a) : [0];
  const costs = cycle.map((c) => readPool(rating, c, o).cost);
  const dm = cycle.map((c) => damage(rating, c, o));
  let alive = new Map<number, number>([[track, 1]]); let rolls = 0; let spent = 0;
  for (let roll = 1; roll <= 150; roll += 1) {
    const i = (roll - 1) % cycle.length; let mass = 0; for (const p of alive.values()) mass += p;
    rolls += mass; spent += mass * costs[i]!;
    const next = new Map<number, number>();
    for (const [hp, p] of alive) dm[i]!.forEach((pk, k) => { const left = hp - k; if (left > 0) next.set(left, (next.get(left) ?? 0) + p * pk); });
    alive = next;
  }
  const per = cycle.reduce((s, c) => s + readPool(rating, c, o).succ, 0) / cycle.length;
  return { per, rolls, spent };
}
if (mode === 'secondary') {
  const ladders: Record<string, number[]> = { raw: [1], practiced: [1, 2], trained: [1, 2, 3], none: [] };
  const routes: [string, number, string, number][] = [
    ['Flair 1 Raw', 1, 'raw', 0], ['Flair 2 Practiced', 2, 'practiced', 0], ['Flair 3 Trained', 3, 'trained', 0],
    ['Force 2 Practiced, intimidating', 2, 'practiced', 1], ['Force 3 Trained, intimidating', 3, 'trained', 1], ['Force 3, no charge, intimidating', 3, 'none', 1], ['Flair 1, no charge', 1, 'none', 0],
  ];
  for (const [tn, track, o] of [['Rival, Strain 4, Average', 4, { difficulty: 2 }], ['Minion, Strain 1, Easy', 1, { difficulty: 1 }], ['Nemesis, Strain 6, Hard', 6, { difficulty: 3 }]] as [string, number, Opp][]) {
    console.log(`\n${tn}`);
    for (const [rn, r, l, setback] of routes) {
      const res = route(r, ladders[l]!, track, { ...o, setback });
      console.log(`  ${rn.padEnd(34)} per roll ${pct(res.per).padStart(4)} · rolls ${res.rolls.toFixed(1).padStart(5)} · Strain you spend ${res.spent.toFixed(1)}`);
    }
  }
}
