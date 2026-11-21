// This browser's reading and testing preferences. They change how the adventure looks, never
// what the narrator is sent, so they live here rather than in the save. Their storage is in the
// kit (kit/src/settings/adventure-prefs.ts), so the site's one Settings page shows them anywhere.
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_ADVENTURE_PREFS, readAdventurePrefs, writeAdventurePrefs, type AdventurePrefs } from '../../../kit/src/settings/adventure-prefs';

export type Prefs = AdventurePrefs;
export const DEFAULT_PREFS = DEFAULT_ADVENTURE_PREFS;

function apply(prefs: Prefs) {
  const root = document.documentElement;
  root.dataset.text = prefs.textSize;
  root.dataset.face = prefs.storyFace;
}

export function usePrefs(): [Prefs, (changes: Partial<Prefs>) => void] {
  const [prefs, setPrefs] = useState<Prefs>(readAdventurePrefs);
  useEffect(() => { apply(prefs); }, [prefs]);
  const update = useCallback((changes: Partial<Prefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...changes };
      writeAdventurePrefs(next);
      return next;
    });
  }, []);
  return [prefs, update];
}
