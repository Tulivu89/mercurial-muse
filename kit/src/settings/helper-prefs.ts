// The Studio helper's own model and its Plain voice (W2), kept in this browser. In the kit so the
// site's one Settings page can show them on every side; the Studio reads them (author/context.tsx).
export interface HelperPrefs {
  // Empty: the same model as play.
  model: string;
  plain: boolean;
}

const MODEL_KEY = 'inkwyrm.helper.model';
const PLAIN_KEY = 'inkwyrm.helper.plain';

export function readHelperPrefs(): HelperPrefs {
  try {
    return { model: window.localStorage.getItem(MODEL_KEY) ?? '', plain: window.localStorage.getItem(PLAIN_KEY) === 'yes' };
  } catch {
    return { model: '', plain: false };
  }
}

export function saveHelperPrefs(prefs: HelperPrefs): void {
  try {
    if (prefs.model) window.localStorage.setItem(MODEL_KEY, prefs.model); else window.localStorage.removeItem(MODEL_KEY);
    if (prefs.plain) window.localStorage.setItem(PLAIN_KEY, 'yes'); else window.localStorage.removeItem(PLAIN_KEY);
  } catch { /* a browser that keeps nothing still helps, just with the defaults */ }
}
