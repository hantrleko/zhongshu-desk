import { defineConfig } from 'vitest/config';

/** GitHub Pages project sites need a base like `/repo-name/`. */
function pagesBase(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const raw = env?.VITE_BASE;
  if (!raw || raw === '/' || raw === './') return '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.endsWith('/') ? withSlash : `${withSlash}/`;
}

export default defineConfig({
  base: pagesBase(),
  server: {
    host: '0.0.0.0',
    port: 47321,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 47321,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
