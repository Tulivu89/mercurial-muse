// The site's one Settings page (kit/src/settings/SettingsPage.tsx): it opens on the tab for the
// side it's opened from, every tab is there to switch to, another side's tab writes this browser's
// storage for that side to read, and Start here sends an arrival from outside to the chosen side.
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPage, tabForSide, type SettingsTab } from '../../kit/src/settings/SettingsPage';
import { initialConnection } from '../../kit/src/connection';
import { readSettings } from '../../kit/src/settings/chat-settings';
import { readAdventurePrefs } from '../../kit/src/settings/adventure-prefs';
import { readHelperPrefs } from '../../kit/src/settings/helper-prefs';
import { START_KEY, readStart, startRedirect } from '../../kit/src/settings/start';
import { adventureHref } from '../../kit/src/addresses';
import type { Side } from '../../kit/src/SiteHeader';

function page(side: Side, extra: Partial<Parameters<typeof SettingsPage>[0]> = {}) {
  const onTheme = vi.fn();
  render(<SettingsPage side={side} theme="paper" onTheme={onTheme} look="world" onLook={() => {}} connection={initialConnection()} onConnection={() => {}} {...extra} />);
  return { onTheme };
}
const tab = (name: string) => screen.getByRole('tab', { name });

describe('the Settings page', () => {
  it('opens on the side’s own tab, and General on the front page', () => {
    expect(tabForSide('chat')).toBe('chat');
    expect(tabForSide('overview')).toBe('general');
    page('studio');
    expect(tab('Studio')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab').map((entry) => entry.textContent)).toEqual(['General', 'Model', 'Chat', 'Adventure', 'Studio']);
  });

  it('switches tabs, and says when a tab belongs to another side', () => {
    const picked: SettingsTab[] = [];
    page('studio', { onTab: (next) => picked.push(next) });
    fireEvent.click(tab('Chat'));
    expect(picked).toEqual(['chat']);
    expect(screen.getByText(/These are Chat’s settings/)).toBeInTheDocument();
    fireEvent.click(tab('Studio'));
    expect(screen.queryByText(/These are/)).not.toBeInTheDocument();
  });

  it('writes another side’s settings to this browser for that side to read', () => {
    page('studio', { tab: 'chat' });
    fireEvent.click(screen.getByRole('switch', { name: 'Read each new reply aloud' }));
    expect(readSettings().readAloud).toBe(true);
  });

  it('writes the adventure’s and the Studio’s own preferences from anywhere', () => {
    const { unmount } = render(<SettingsPage side="chat" tab="adventure" theme="paper" onTheme={() => {}} look="world" onLook={() => {}} connection={initialConnection()} onConnection={() => {}} />);
    fireEvent.click(within(screen.getByRole('group', { name: 'Story typeface' })).getByRole('button', { name: 'Plain sans' }));
    expect(readAdventurePrefs().storyFace).toBe('sans');
    unmount();
    page('chat', { tab: 'studio' });
    fireEvent.click(screen.getByRole('switch', { name: 'Plain voice' }));
    expect(readHelperPrefs().plain).toBe(true);
  });

  it('hands a live tab’s changes to the side that holds them', () => {
    const onSettings = vi.fn();
    page('chat', { tab: 'chat', chat: { settings: readSettings(), onSettings } });
    fireEvent.click(screen.getByRole('switch', { name: 'Read each new reply aloud' }));
    expect(onSettings).toHaveBeenCalledWith(expect.objectContaining({ readAloud: true }));
    expect(readSettings().readAloud).toBe(false);
  });

  it('sets paper or night for the whole site on General', () => {
    const { onTheme } = page('overview');
    fireEvent.click(within(screen.getByRole('group', { name: 'Paper or night' })).getByRole('button', { name: 'Night' }));
    expect(onTheme).toHaveBeenCalledWith('night');
  });
});

describe('Start here', () => {
  const at = (pathname: string, search = '', hash = '') => ({ pathname, search, hash, origin: 'https://inkwyrm.test' });

  it('sends an arrival from outside at the bare root to the chosen side', () => {
    expect(startRedirect('chat', at('/'), '')).toBe('/chat/');
    expect(startRedirect('adventure', at('/'), 'https://elsewhere.test/')).toBe('/adventure/');
  });

  it('never moves the front page’s own visitors, or an address that names something', () => {
    expect(startRedirect('front', at('/'), '')).toBeNull();
    expect(startRedirect('chat', at('/'), 'https://inkwyrm.test/studio/')).toBeNull();
    expect(startRedirect('chat', at('/settings'), '')).toBeNull();
    expect(startRedirect('chat', at('/', '?save=1'), '')).toBeNull();
  });

  it('is kept on General, and the front page is the default', () => {
    expect(readStart()).toBe('front');
    page('overview');
    fireEvent.change(screen.getByLabelText(/Opening the site takes you to/), { target: { value: 'studio' } });
    expect(window.localStorage.getItem(START_KEY)).toBe('studio');
    expect(readStart()).toBe('studio');
  });
});

describe('the adventure’s address', () => {
  it('is under /adventure/, with the game or the launch it names', () => {
    expect(adventureHref()).toBe('/adventure/');
    expect(adventureHref({ save: 'a b' })).toBe('/adventure/?save=a+b');
    expect(adventureHref({ launch: 'w' })).toBe('/adventure/?launch=w');
  });
});
