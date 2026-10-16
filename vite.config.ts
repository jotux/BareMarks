import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds to a single self-contained dist/index.html: scripts, styles and fonts
// are all inlined, so the app runs offline from disk or any static host.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
});
