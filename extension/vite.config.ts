import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react(), crx({ manifest })],
  build: {
    sourcemap: true,
  },
});
