import os from 'node:os';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// In dev, reload the whole page on every change instead of patching modules in place.
const fullReload = (): Plugin => ({
  name: 'full-reload',
  handleHotUpdate({ server }) {
    server.ws.send({ type: 'full-reload' });
    return [];
  },
});

// Builds to a single self-contained dist/index.html: scripts, styles and fonts
// are all inlined, so the app runs offline from disk or any static host.
export default defineConfig({
  plugins: [react(), viteSingleFile(), fullReload()],
  // keep Vite's cache out of the project: Dropbox locks files mid-sync and breaks dep re-optimisation
  cacheDir: path.join(os.tmpdir(), 'baremarks-vite'),
  base: './',
});
