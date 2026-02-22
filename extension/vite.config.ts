import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  publicDir: 'extension',
  plugins: [react(), crx({ manifest })],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: 'src/popup.html',
      },
    },
  },
});
