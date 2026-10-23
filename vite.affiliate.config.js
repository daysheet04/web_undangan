import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'daymoment-affiliate-html',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replace('/src/main.jsx', '/src/affiliate-main.jsx')
            .replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="Daftar dan masuk ke Program Affiliate Daymoment." />')
            .replace(/<title>[^<]*<\/title>/, '<title>Daymoment Affiliate — Partner Area</title>');
        },
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 8082,
    proxy: {
      '/api': 'http://127.0.0.1:8791',
    },
  },
  build: { outDir: 'dist-affiliate', emptyOutDir: true },
});

