import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ADMIN_BUNDLE_HREF = '/assets/css/admin-bundle.css?v=20261127-perf-v2';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'daymoment-admin-html',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          let next = html
            .replace('/src/main.jsx', '/src/admin-main.jsx')
            .replace(/<meta name="description" content="[^"]*"\s*\/>/, '<meta name="description" content="Workspace privat untuk mengelola operasional Daymoment." />')
            .replace(/<title>[^<]*<\/title>/, '<title>Daymoment Admin — Private Workspace</title>')
            // Strip unused wedding-only Google Fonts (Italianno, Marcellus, italic Playfair weights) to avoid heavy font-swap relayouts
            .replace(
              /https:\/\/fonts\.googleapis\.com\/css2\?family=Playfair\+Display:[^"']+/g,
              'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap',
            );
          if (command === 'build') {
            next = next.replace(
              '</head>',
              `    <link rel="stylesheet" href="${ADMIN_BUNDLE_HREF}" />\n  </head>`,
            );
          }
          return next;
        },
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 8081,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.io'],
    proxy: {
      '/api': 'http://127.0.0.1:8790',
      '/media': 'http://127.0.0.1:8790',
    },
  },
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/canvg')) {
            return 'vendor-pdf';
          }
          return undefined;
        },
      },
    },
  },
}));
