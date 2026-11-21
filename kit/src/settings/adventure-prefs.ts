// The adventure's reading and testing preferences in this browser (`praxis.prefs`, its name since
// Praxis: never rename it). They change how the adventure looks, never what the narrator is sent,
// so they live here rather than in a save. Kept in the kit so the site's one Settings page can
// show them on every side; the adventure applies them (adventure/src/ui/prefs.ts).
export interface AdventurePrefs {
  textSize: 'small' | 'standard' | 'large';
  storyFace: 'serif' | 'sans';
  // Testing: mark records the module calls unfinished.
  showDrafts: boolean;
  // Show the number beside each band.
  showNumbers: boolean;
  // The model that writes journal suggestions. Empty means the narration model.
  helperModel: string;
  // After you write something, the helper proposes a check when it sounds like one (the evaluator).
  evaluator: boolean;
}

export const ADVENTURE_PREFS_KEY = 'praxis.prefs';
export const DEFAULT_ADVENTURE_PREFS: AdventurePrefs = { textSize: 'standard', storyFace: 'serif', showDrafts: true, showNumbers: false, helperModel: 'glm-4-6', evaluator: true };

export function readAdventurePrefs(): AdventurePrefs {
  try {
    const raw = window.localStorage.getItem(ADVENTURE_PREFS_KEY);
    if (!raw) return DEFAULT_ADVENTURE_PREFS;
    const parsed = JSON.parse(raw) as Partial<AdventurePrefs>;
    return {
      textSize: parsed.textSize === 'small' || parsed.textSize === 'large' ? parsed.textSize : 'standard',
      storyFace: parsed.storyFace === 'sans' ? 'sans' : 'serif',
      showDrafts: typeof parsed.showDrafts === 'boolean' ? parsed.showDrafts : DEFAULT_ADVENTURE_PREFS.showDrafts,
      showNumbers: typeof parsed.showNumbers === 'boolean' ? parsed.showNumbers : DEFAULT_ADVENTURE_PREFS.showNumbers,
      helperModel: typeof parsed.helperModel === 'string' ? parsed.helperModel : DEFAULT_ADVENTURE_PREFS.helperModel,
      evaluator: parsed.evaluator !== false,
    };
  } catch {
    return DEFAULT_ADVENTURE_PREFS;
  }
}

export function writeAdventurePrefs(prefs: AdventurePrefs): void {
  try { window.localStorage.setItem(ADVENTURE_PREFS_KEY, JSON.stringify(prefs)); } catch { /* not remembered */ }
}
