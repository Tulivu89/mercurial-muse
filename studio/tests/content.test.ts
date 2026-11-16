// The content checker (studio/src/content/lint.ts) against small worlds made to fail it.
import { describe, expect, it } from 'vitest';
import { newRecord, newWorld, putRecord, type World } from '../../core/records/index.js';
import { catchesIn, lintWorld, reportText, tierOf } from '../src/content/lint';

function world(): World {
  let n = 0;
  const ids = () => `s${++n}`;
  let next = { ...newWorld('w', 'Low Water', 1), premise: 'A ferry town in winter.' };
  const booth = { ...newRecord('place', 'booth', 'The Booth', ids), line: 'A glass box at the top of the ramp.' };
  const dee = { ...newRecord('character', 'dee', 'Dee Harlow', ids), line: 'The night clerk.', parentId: null };
  dee.sections = dee.sections.map((section) => (section.title === 'Personality' ? { ...section, text: 'She moves like a cat, a testament to years of night shifts. Not cruel, but careful.' } : section));
  const ray = { ...newRecord('character', 'ray', 'Ray Harlow', ids), line: '' };
  next = putRecord(putRecord(putRecord(next, booth, 2), dee, 2), ray, 2);
  return next;
}

describe('the content checker', () => {
  it('flags the failure list\'s catches by rule, with where they are', () => {
    const rules = catchesIn('She moves like a cat, a testament to years of night shifts. Not cruel, but careful.').map((caught) => caught.rule);
    expect(rules).toEqual(expect.arrayContaining(['2 comparison as description', 'slop word', '5 contrast framing', '18 analyst vocabulary']));
    expect(catchesIn('Sells first and asks nothing. Keeps the roll under her palm.')).toEqual([]);
  });

  it('finds missing lines, and keeps a reader\'s attention on the record and section', () => {
    const report = lintWorld(world());
    expect(report.findings.filter((finding) => finding.kind === 'missing').map((finding) => finding.record)).toEqual(['Ray Harlow']);
    expect(report.findings.some((finding) => finding.kind === 'catch' && finding.record === 'Dee Harlow' && finding.where === 'Personality')).toBe(true);
  });

  it('judges a featured chat partner as a lead, and a townsperson as a person', () => {
    const base = newRecord('character', 'x', 'X', () => 'y');
    expect(tierOf(base)).toBe('person');
    expect(tierOf({ ...base, greetings: [{ id: 'g', text: 'Hi.', emotion: '' }] })).toBe('lead');
    expect(tierOf({ ...base, tags: ['Lead'] })).toBe('lead');
  });

  it('flags a person heavier than the provisional budget, and a line over 25 words', () => {
    const heavy = world();
    const ray = heavy.records.find((record) => record.id === 'ray')!;
    ray.line = Array.from({ length: 30 }, () => 'word').join(' ');
    ray.sections = ray.sections.map((section) => (section.title === 'Appearance' ? { ...section, text: 'Big hands. '.repeat(120) } : section));
    const report = lintWorld(heavy);
    expect(report.findings.filter((finding) => finding.kind === 'over').map((finding) => finding.rule)).toEqual(expect.arrayContaining(['line 30 words, budget 25', expect.stringMatching(/^person here \d+ t, budget 200$/)]));
    expect(reportText(report)).toContain('## Over budget: ');
  });

  it('holds a lead\'s Named sections to 300 each, not together', () => {
    const lead = world();
    const dee = lead.records.find((record) => record.id === 'dee')!;
    dee.tags = ['lead'];
    const named = (id: string, words: number) => ({ id, title: id, reach: 'named' as const, keys: [id], when: null, text: 'Keeps the ledger. '.repeat(words) });
    dee.sections = [...dee.sections, named('a', 50), named('b', 50)];
    const over = (world: World) => lintWorld(world).findings.filter((finding) => finding.kind === 'over' && finding.record === 'Dee Harlow').map((finding) => finding.rule);
    expect(over(lead).filter((rule) => rule.includes('named'))).toEqual([]);
    dee.sections = [...dee.sections, named('c', 140)];
    expect(over(lead).filter((rule) => rule.includes('named'))).toEqual([expect.stringMatching(/^one named section \d+ t, budget 300$/)]);
  });
});
