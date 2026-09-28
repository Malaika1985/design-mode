/**
 * Shared plumbing for every integration: option resolution, serving the
 * overlay with its injected config, and the request handling that the Vite
 * plugin and the standalone collector have in common.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendComment } from './format.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

export const OVERLAY_FILE = path.join(here, 'overlay.js');
export const DEFAULT_PORT = 4939;
export const ROUTE_PREFIX = '/__design-mode';
export const OVERLAY_ROUTE = `${ROUTE_PREFIX}/overlay.js`;
export const COMMENT_ROUTE = `${ROUTE_PREFIX}/comment`;

/** Max size of a single comment payload; anything larger is a bug or an attack. */
export const MAX_BODY_BYTES = 256 * 1024;

/**
 * @typedef {object} DesignModeOptions
 * @property {'en'|'de'|'auto'} [lang='en']  Overlay UI language.
 * @property {string} [outFile='design-comments.md']  Target file, relative to the project root.
 * @property {boolean} [enabled=true]  Set false to turn the tool off without removing it.
 * @property {number} [collectorPort=4939]  Fallback collector port used by the overlay.
 */

/** @returns {{lang: string, outFile: string, enabled: boolean, collector: string}} */
export function resolveOptions(options = {}, root = process.cwd()) {
  const lang = options.lang ?? 'en';
  if (!['en', 'de', 'auto'].includes(lang)) {
    throw new Error(`design-mode: unknown lang "${lang}" (expected en, de or auto)`);
  }
  const port = options.collectorPort ?? DEFAULT_PORT;
  return {
    lang,
    enabled: options.enabled !== false,
    outFile: path.resolve(root, options.outFile ?? 'design-comments.md'),
    collector: `http://127.0.0.1:${port}/comment`,
  };
}

/** The overlay source with a config prelude for the browser. */
export function overlayScript(opts) {
  const config = JSON.stringify({
    lang: opts.lang,
    endpoint: opts.endpoint ?? COMMENT_ROUTE,
    collector: opts.collector,
  });
  const source = fs.readFileSync(OVERLAY_FILE, 'utf8');
  return `window.__DESIGN_MODE__=${config};\n${source}`;
}

/** Read a JSON request body with a hard size cap. */
export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Write one comment and return a short log line.
 * Throws when the payload is unusable, so callers can answer 400.
 */
export function saveComment(outFile, payload) {
  const entry = appendComment(outFile, payload);
  return `design-mode: saved "${entry.comment}" (${entry.selector})`;
}
