import { defineConfig } from 'vitest/config';

// The AetherRoom parity fixtures were recorded in UTC; macros and schedules read local time.
process.env.TZ = 'UTC';

export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'], env: { TZ: 'UTC' } } });
