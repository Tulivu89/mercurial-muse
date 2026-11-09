import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served by the site's server at /studio/.
export default defineConfig({
  base: '/studio/',
  plugins: [react()],
  server: {
    port: 5177,
    allowedHosts: ['.app.github.dev'],
    proxy: { '/api': 'http://127.0.0.1:8791' },
  },
});
