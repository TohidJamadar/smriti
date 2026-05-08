import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Suppress the 500KB chunk warning (expected with GSAP + Framer Motion)
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Code-split heavy animation libraries into their own chunks
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],

        },
      },
    },
  },
});