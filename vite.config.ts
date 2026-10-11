import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/mfe/inventory/',
  publicDir: 'node_modules/@bysellens/frontend-core/assets',
  plugins: [react()],
  server: { port: 5175, strictPort: true },
  test: {
    globals: true, environment: 'jsdom',
    setupFiles: 'node_modules/@bysellens/frontend-core/testing/setupTests.ts',
    server: { deps: { inline: ['@bysellens/frontend-core'] } },
  },
}));
