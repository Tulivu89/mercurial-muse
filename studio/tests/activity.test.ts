// The site's record of what was last opened (kit/src/activity.ts), read by the Overview.
import { describe, expect, it } from 'vitest';
import { MOST_RECENT, NAVIGATION_KEY, chatWithHref, hrefFor, loadNavigation, readNavigation, recordActivity, withActivity } from '../../kit/src/activity';
import { parseRoute } from '../src/route';

describe('the activity record', () => {
  it('reads only well-formed entries, newest first, one per place', () => {
    const read = readNavigation(JSON.stringify({ version: 1, recent: [
      { target: { kind: 'chat', chatId: 'a' }, openedAt: 10 },
      { target: { kind: 'adventure', saveId: 's' }, openedAt: 30 },
      { target: { kind: 'chat', chatId: 'a' }, openedAt: 20 },
      { target: { kind: 'studio', worldId: 'w', recordId: 'r', door: 'errata' }, openedAt: 25 },
      { target: { kind: 'chat' }, openedAt: 40 },
      { target: { kind: 'chat', chatId: 'b' }, openedAt: 'yesterday' },
      'nonsense',
    ] }));
    expect(read.recent.map((entry) => entry.openedAt)).toEqual([30, 25, 20]);
    expect(readNavigation('{not json').recent).toEqual([]);
    expect(readNavigation(null).recent).toEqual([]);
  });

  it('keeps one entry per world in the Studio, the newest record and door', () => {
    let navigation = readNavigation(null);
    navigation = withActivity(navigation, { kind: 'studio', worldId: 'w', recordId: 'a' }, 1);
    navigation = withActivity(navigation, { kind: 'studio', worldId: 'w', recordId: 'b', door: 'errata' }, 2);
    expect(navigation.recent).toEqual([{ target: { kind: 'studio', worldId: 'w', recordId: 'b', door: 'errata' }, openedAt: 2 }]);
  });

  it('stays bounded, and is written only by recordActivity', () => {
    window.localStorage.removeItem(NAVIGATION_KEY);
    for (let n = 1; n <= MOST_RECENT + 5; n += 1) recordActivity({ kind: 'chat', chatId: `c${n}` }, n);
    const kept = loadNavigation().recent;
    expect(kept).toHaveLength(MOST_RECENT);
    expect(kept[0].target).toEqual({ kind: 'chat', chatId: `c${MOST_RECENT + 5}` });
  });

  it('builds the addresses each side reads', () => {
    expect(hrefFor({ kind: 'chat', chatId: 'a b' })).toBe('/chat/#/chat/a%20b');
    expect(hrefFor({ kind: 'adventure', saveId: 's1' })).toBe('/adventure/?save=s1');
    const studio = hrefFor({ kind: 'studio', worldId: 'low water', recordId: 'dee', door: 'errata' });
    expect(studio).toBe('/studio/#/w/low%20water?rec=dee&door=errata');
    expect(parseRoute(studio.slice('/studio/'.length))).toMatchObject({ worldId: 'low water', rec: 'dee', door: 'errata' });
    expect(chatWithHref('inkwyrm-house', 'errata')).toBe('/chat/#/with/inkwyrm-house/errata');
  });
});
