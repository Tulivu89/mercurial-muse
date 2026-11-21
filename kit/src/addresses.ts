// Where each part of the site lives (phase F4, docs/front-page/): the Overview at the root and the
// adventure under /adventure/. Every cross-side link is built from these, so a part can move again
// by changing one line.
export const ADDRESS = {
  front: '/',
  adventure: '/adventure/',
  chat: '/chat/',
  studio: '/studio/',
  // The front page's own way into Settings; each side also opens it in place (SettingsPage.tsx).
  settings: '/settings',
} as const;

// A game by its save, or a world sent from the Studio, opened in the adventure.
export const adventureHref = (asked: { save?: string; launch?: string } = {}): string => {
  const query = new URLSearchParams();
  if (asked.save) query.set('save', asked.save);
  if (asked.launch) query.set('launch', asked.launch);
  const text = query.toString();
  return `${ADDRESS.adventure}${text ? `?${text}` : ''}`;
};
