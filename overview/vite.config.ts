import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { picturesDefine } from '../kit/pictures.config';

// Served by the site's server at /overview/ (docs/front-page/); the root stays the Adventure's
// until the front door moves (phase F4).
export default defineConfig(({ command }) => ({
  base: '/overview/',
  plugins: [react()],
  define: picturesDefine(command),
  server: {
    port: 5179,
    allowedHosts: ['.app.github.dev'],
    proxy: { '/api': 'http://127.0.0.1:8791' },
  },
}));
