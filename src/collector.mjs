/**
 * Standalone collector
 *
 * A tiny local server that receives comments from the overlay and appends
 * them to design-comments.md. Only needed when you are NOT using the Nuxt
 * module or the Vite plugin - those bring the same endpoint along with them.
 *
 *   npx design-mode collect
 *
 * It also serves the overlay itself, so any dev server can opt in with one
 * script tag:
 *
 *   <script src="http://127.0.0.1:4939/overlay.js" defer></script>
 *
 * The server binds to loopback only and accepts cross-origin requests from
 * localhost origins alone - it writes to your disk, so it stays off the
 * network.
 */
import http from 'node:http';
import { DEFAULT_PORT, overlayScript, readJsonBody, resolveOptions, saveComment } from './serve.mjs';

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** Only localhost pages may post comments; anything else is rejected. */
export function isLocalOrigin(origin) {
  if (!origin || origin === 'null') return false;
  return LOCAL_ORIGIN.test(origin);
}

/**
 * Build the collector server (not yet listening).
 * @param {import('./serve.mjs').DesignModeOptions & {port?: number, log?: Function}} [options]
 */
export function createCollector(options = {}) {
  const port = options.port ?? DEFAULT_PORT;
  const log = options.log ?? console.log;
  const opts = {
    ...resolveOptions({ ...options, collectorPort: port }),
    endpoint: `http://127.0.0.1:${port}/comment`,
  };

  const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    if (origin && isLocalOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    } else if (origin) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end('{"ok":false,"error":"origin not allowed"}');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const url = (req.url || '').split('?')[0];

    if (req.method === 'GET' && (url === '/overlay.js' || url === '/__design-mode/overlay.js')) {
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      return res.end(overlayScript(opts));
    }

    if (req.method === 'POST' && (url === '/comment' || url === '/__design-mode/comment')) {
      readJsonBody(req)
        .then((payload) => {
          log(saveComment(opts.outFile, payload));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        })
        .catch((error) => {
          log(`design-mode: rejected comment (${error.message})`);
          if (res.headersSent) return;
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"ok":false}');
        });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.designMode = { ...opts, port };
  return server;
}

/** Start the collector on loopback. Resolves with the listening server. */
export function startCollector(options = {}) {
  const server = createCollector(options);
  const port = server.designMode.port;
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
