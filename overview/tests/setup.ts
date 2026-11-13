import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// Every test starts at the front page with nothing remembered.
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  window.scrollTo = () => {};
});
