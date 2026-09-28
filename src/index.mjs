/**
 * Programmatic entry point.
 *
 * Most users never import this: they use `design-mode/nuxt`,
 * `design-mode/vite` or the `design-mode` CLI. It exists so the pieces can
 * be embedded in other dev tooling.
 */
export { createCollector, startCollector, isLocalOrigin } from './collector.mjs';
export { appendComment, formatEntry, normalise, HEADING } from './format.mjs';
export {
  COMMENT_ROUTE,
  DEFAULT_PORT,
  OVERLAY_FILE,
  OVERLAY_ROUTE,
  ROUTE_PREFIX,
  overlayScript,
  resolveOptions,
} from './serve.mjs';
