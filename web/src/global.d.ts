type JSONElement = null | boolean | number | string | JSONArray | JSONObject;
interface JSONObject<T extends JSONElement = JSONElement> extends Record<string, T> {}
interface JSONArray<T extends JSONElement = JSONElement> extends Array<T> {}

/**
 * The application version (from package.json), injected at build time by vite.config.ts.
 * Kept coherent across the whole monorepo via `npm run version:bump`.
 */
declare const __APP_VERSION__: string;