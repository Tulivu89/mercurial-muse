import { defineConfig, type Plugin } from 'vitest/config';
import { moduleToWorld, worldToModule } from '../core/convert';

// The proof for the converters between Studio worlds and modules: every module the tests load
// is first turned into a Studio world and back, and the whole suite runs on what comes back.
function throughTheStudio(): Plugin {
  return {
    name: 'through-the-studio',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/modules\/[^/]+\.json$/.test(id.split('?')[0]!)) return null;
      const imported = moduleToWorld(JSON.parse(code), 1);
      if (!imported.ok) throw new Error(`${id} did not open as a world: ${imported.errors.join(' ')}`);
      return { code: JSON.stringify(worldToModule(imported.world).module), map: null };
    },
  };
}

export default defineConfig({
  plugins: [throughTheStudio()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
