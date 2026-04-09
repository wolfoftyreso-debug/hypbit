import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// quiXzoom Console — Vite config.
// Originally scaffolded by Lovable and cleaned for enterprise use.
// The lovable-tagger plugin has been removed.
export default defineConfig(() => ({
  server: {
    host: '::',
    port: 8080,
    hmr: { overlay: false },
    proxy: {
      // In dev, proxy API calls to the local connector on port 3000
      // so the console can be run with a fresh `npm run dev` on both
      // and the relative /api/v1/* paths just work.
      '/api': 'http://localhost:3000',
      '/llm': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/ready': 'http://localhost:3000',
      '/metrics': 'http://localhost:3000',
      '/stream': 'http://localhost:3000',
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      '@tanstack/query-core',
    ],
  },
}));
