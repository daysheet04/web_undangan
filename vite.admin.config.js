import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'daymoment-admin-html',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replace('/src/main.jsx', '/src/admin-main.jsx')
            .replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="Workspace privat untuk mengelola operasional Daymoment." />')
            .replace(/<title>[^<]*<\/title>/, '<title>Daymoment Admin — Private Workspace</title>')
            .replace(/\s*<link rel="icon"[^>]+>/, '');
        },
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 8081,
    proxy: {
      '/api': 'http://127.0.0.1:8790',
    },
  },
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
  },
});
