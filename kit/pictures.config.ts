// The address the site's pictures (kit/src/pictures.ts) are read from, for a side's vite.config.
// The dev server reads them straight from the repository. A build reads them from GitHub through
// jsDelivr's free CDN, pinned to the commit being built, so the server sends none of them.
// INKWYRM_PICTURES overrides it (for example "/content/" to serve them yourself).
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
export const REPOSITORY = 'Tulivu89/mercurial-muse';

export function picturesBase(command: 'serve' | 'build'): string {
  if (process.env.INKWYRM_PICTURES) return process.env.INKWYRM_PICTURES;
  if (command === 'serve') return `/@fs${ROOT}/content/`;
  let commit = 'main';
  try {
    commit = execSync('git rev-parse HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'main';
  } catch {
    // Not a git checkout: the newest main is the best guess.
  }
  return `https://cdn.jsdelivr.net/gh/${REPOSITORY}@${commit}/content/`;
}

export const picturesDefine = (command: 'serve' | 'build') => ({ __INKWYRM_PICTURES__: JSON.stringify(picturesBase(command)) });
