import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { picturesDefine } from '../kit/pictures.config';

// Served by the site's server at /chat/.
export default defineConfig(({ command }) => ({
  base: '/chat/',
  plugins: [react()],
  define: picturesDefine(command),
  server: {
    port: 5178,
    allowedHosts: ['.app.github.dev'],
    proxy: { '/api': 'http://127.0.0.1:8791' },
  },
}));
