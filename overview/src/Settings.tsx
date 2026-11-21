// The site's Settings page at its own address, /settings, which the front page's gear opens. The
// sides open the same page in place; this one serves a visitor on the front page, and any link
// that names a tab (`/settings#model`).
import { useEffect, useState, useSyncExternalStore } from 'react';
import { SiteHeader } from '../../kit/src/SiteHeader';
import { SettingsPage, isSettingsTab, type SettingsTab } from '../../kit/src/settings/SettingsPage';
import { initialConnection, reconnect, type Connection } from '../../kit/src/connection';
import { useTheme } from '../../kit/src/theme';
import { useLook } from '../../kit/src/look';
import { ADDRESS } from '../../kit/src/addresses';

const onHash = (changed: () => void) => { window.addEventListener('hashchange', changed); return () => window.removeEventListener('hashchange', changed); };

function pickTab(next: SettingsTab) {
  window.history.replaceState(null, '', `${ADDRESS.settings}#${next}`);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// Done goes back to the page the visitor came from on this site, or to the front page.
function back() {
  try {
    const from = new URL(document.referrer);
    if (from.origin === window.location.origin && from.pathname !== ADDRESS.settings) { window.location.assign(from.href); return; }
  } catch { /* no referrer, or one from elsewhere */ }
  window.location.assign(ADDRESS.front);
}

export function SettingsAddress() {
  const hash = useSyncExternalStore(onHash, () => window.location.hash, () => '');
  const named = hash.replace(/^#\/?/, '');
  const tab: SettingsTab = isSettingsTab(named) ? named : 'general';
  const [theme, setTheme] = useTheme();
  const [look, setLook] = useLook();
  const [connection, setConnection] = useState<Connection>(initialConnection);
  useEffect(() => { void reconnect(connection).then(setConnection).catch(() => undefined); }, []);
  return (
    <>
      <SiteHeader side="overview" homeLabel="Inkwyrm, the front page" settingsOpen />
      <main>
        <SettingsPage
          side="overview" tab={tab} onTab={pickTab} onDone={back}
          theme={theme} onTheme={setTheme} look={look} onLook={setLook} connection={connection} onConnection={setConnection}
        />
      </main>
    </>
  );
}
