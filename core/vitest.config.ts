import { defineConfig } from 'vitest/config';

// Macros and schedules read local time; the tests pin it to UTC so they read the same anywhere.
process.env.TZ = 'UTC';

export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'], env: { TZ: 'UTC' } } });
