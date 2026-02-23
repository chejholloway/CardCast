import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [react(), crx({ manifest }), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
