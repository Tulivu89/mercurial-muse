import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// Every test starts at the Studio's front door, with nothing remembered and no page to scroll.
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  window.scrollTo = () => {};
});
