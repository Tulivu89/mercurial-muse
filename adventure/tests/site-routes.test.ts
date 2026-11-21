// @vitest-environment node
// The site's addresses since the Overview took the root (phase F4): the adventure's old ones
// forward to /adventure/, and the Overview's own old address forwards to the root.
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BUILT_IN_PROVIDERS } from '../../core/narration/providers';
import { createApp } from '../server/app';

describe('the site’s old addresses', () => {
  const server = createApp({ providers: BUILT_IN_PROVIDERS }).listen(0);
  let base = '';
  beforeAll(() => { base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
  afterAll(() => { server.close(); });
  const head = (path: string) => fetch(`${base}${path}`, { redirect: 'manual' });

  it('forwards a saved game and a Studio launch named at the root to the adventure', async () => {
    const save = await head('/?save=s%201');
    expect(save.status).toBe(302);
    expect(save.headers.get('location')).toBe('/adventure/?save=s+1');
    const launch = await head('/?launch=world-1');
    expect(launch.headers.get('location')).toBe('/adventure/?launch=world-1');
  });

  it('sends the Overview’s old address to the root', async () => {
    for (const path of ['/overview', '/overview/', '/overview/anything']) {
      const response = await head(path);
      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toBe('/');
    }
  });

  it('leaves the root alone when it names nothing to forward', async () => {
    const response = await head('/?utm=x');
    expect(response.status).not.toBe(302);
    expect(response.status).not.toBe(301);
  });
});
