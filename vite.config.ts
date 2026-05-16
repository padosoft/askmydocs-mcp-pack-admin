import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/vendor/mcp-pack-admin/',
  // outDir lives inside Laravel's `public/` to make the built bundle
  // directly servable; publicDir must be disabled (default is `public/`)
  // because otherwise Vite tries to recursively copy `public/` into the
  // outDir on every build, producing a runaway nested path.
  publicDir: false,
  build: {
    outDir: 'public/vendor/mcp-pack-admin',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: resolve(__dirname, 'resources/js/main.tsx'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/js/setup.ts'],
    include: ['tests/js/**/*.test.{ts,tsx}'],
  },
});
