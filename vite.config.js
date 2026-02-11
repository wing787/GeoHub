import { defineConfig } from 'vite';

export default defineConfig({
  base: '/GeoHub/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
