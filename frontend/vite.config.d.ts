/**
 * Vite Configuration
 * ------------------------------------------------------------------
 * Key setup decisions:
 *
 * 1. Path alias `@` -> `src/` — allows imports like
 *    `import { api } from '@/lib/api'` instead of relative paths like
 *    `../../lib/api`, which get unwieldy as the component tree grows.
 *    Mirrored in tsconfig.json's `paths` config (next file) so
 *    TypeScript's type-checker and Vite's bundler agree on resolution.
 *
 * 2. Dev server proxy for `/api` -> backend on port 5000 — lets the
 *    frontend call relative paths like `/api/assets` during local dev
 *    without hardcoding `http://localhost:5000` in every request AND
 *    without needing CORS configured for local dev at all (the proxy
 *    makes it look same-origin from the browser's perspective). In
 *    production, the frontend will instead use an absolute API base
 *    URL from an environment variable (handled in the API client file).
 */
declare const _default: import("vite").UserConfig;
export default _default;
