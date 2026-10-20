import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: ['.ngrok-free.app'],
    proxy: {
      '/api': 'http://127.0.0.1:8789',
      '/media': 'http://127.0.0.1:8789',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Target modern browsers — eliminates legacy JS polyfills (~10 KiB savings per PSI report)
    target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
    // esbuild minifier (default, fast & effective)
    minify: 'esbuild',
    cssMinify: true,
    // Raise warning limit — AdminPage/InvitationPage are intentionally large
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — tiny, loaded on every page, cache separately
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Heavy optional deps — only loaded when user navigates to that page
          if (id.includes('node_modules/three')) return 'vendor-three';
          if (id.includes('node_modules/jspdf')) return 'vendor-jspdf';
          if (id.includes('node_modules/xlsx')) return 'vendor-xlsx';
          if (id.includes('node_modules/@gradio')) return 'vendor-gradio';
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          // Everything else from node_modules → shared vendor chunk
          if (id.includes('node_modules/')) return 'vendor';
        },
        // Hashed filenames for aggressive long-term caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
