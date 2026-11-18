// The site's one question before anything opens: Inkwyrm is for adults (the owner, Nov 18). The
// answer is kept in this browser; nothing is sent anywhere.
const KEY = 'inkwyrm.adult';

export function isAdult(): boolean {
  try { return localStorage.getItem(KEY) === 'yes'; } catch { return false; }
}

export function setAdult(): void {
  try { localStorage.setItem(KEY, 'yes'); } catch { /* asked again next visit */ }
}
