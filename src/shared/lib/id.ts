/**
 * Lightweight unique-id generator.
 * Combines a module-level counter, current epoch-ms, and a short random suffix.
 * Pure TS — no React, no DOM.
 */

let counter = 0;

/**
 * Generate a unique string id.
 * @param prefix Optional prefix, e.g. "bot", "order".
 */
export function uid(prefix?: string): string {
  counter += 1;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  const seq = counter.toString(36);
  const core = `${ts}-${seq}-${rand}`;
  return prefix ? `${prefix}_${core}` : core;
}
