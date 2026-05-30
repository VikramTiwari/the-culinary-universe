import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    fs: {
      // Allow serving files from the project root (including compiled WASM in src/wasm-engine/pkg)
      allow: ['.']
    }
  },
  worker: {
    format: 'es'
  }
});
