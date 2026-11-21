import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { picturesDefine } from '../kit/pictures.config';

// The site's front page, served at the root (phase F4, docs/front-page/). /overview/ forwards here.
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [react()],
  define: picturesDefine(command),
  server: {
    port: 5179,
    allowedHosts: ['.app.github.dev'],
    proxy: { '/api': 'http://127.0.0.1:8791' },
  },
}));
