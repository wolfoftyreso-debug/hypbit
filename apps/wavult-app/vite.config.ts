import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        // Gruppera vendor-chunks stabilt för att minska hash-ändringar
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor'
          if (id.includes('/react-router') || id.includes('/react-router-dom')) return 'router'
          if (id.includes('/@tanstack/')) return 'tanstack'
          if (id.includes('/lucide-react/')) return 'icons'
          return 'vendor'
        },
      },
    },
    // Öka chunk size warning threshold
    chunkSizeWarningLimit: 1000,
  },
})
