import { defineConfig } from 'vitest/config';

// The live prompt tests: real calls to a real model, run by hand with your own key (README.md here).
export default defineConfig({
  test: {
    include: ['live/**/*.live.ts'],
    environment: 'node',
    testTimeout: 30 * 60 * 1000,
  },
});
