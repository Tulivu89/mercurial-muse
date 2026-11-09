import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served by the site's server at /chat/.
export default defineConfig({
  base: '/chat/',
  plugins: [react()],
  server: {
    port: 5178,
    allowedHosts: ['.app.github.dev'],
    proxy: { '/api': 'http://127.0.0.1:8791' },
  },
});
