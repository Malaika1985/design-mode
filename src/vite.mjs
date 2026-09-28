/**
 * Vite plugin: design-mode
 *
 *   import designMode from 'design-mode/vite';
 *
 *   export default defineConfig({
 *     plugins: [vue(), designMode({ lang: 'de' })],
 *   });
 *
 * Serves the overlay and accepts comments at /__design-mode/comment.
 * `apply: 'serve'` keeps it out of every production build.
 */
import {
  COMMENT_ROUTE,
  OVERLAY_ROUTE,
  overlayScript,
  readJsonBody,
  resolveOptions,
  saveComment,
} from './serve.mjs';

/** @param {import('./serve.mjs').DesignModeOptions} [options] */
export default function designMode(options = {}) {
  let opts = resolveOptions(options);

  return {
    name: 'design-mode',
    apply: 'serve',

    configResolved(config) {
      opts = resolveOptions(options, config.root);
    },

    transformIndexHtml() {
      if (!opts.enabled) return [];
      return [
        {
          tag: 'script',
          attrs: { src: OVERLAY_ROUTE, defer: true },
          injectTo: 'body',
        },
      ];
    },

    configureServer(server) {
      if (!opts.enabled) return;

      server.middlewares.use(OVERLAY_ROUTE, (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(overlayScript(opts));
      });

      server.middlewares.use(COMMENT_ROUTE, (req, res, next) => {
        if (req.method !== 'POST') return next();
        res.setHeader('Content-Type', 'application/json');
        readJsonBody(req)
          .then((payload) => {
            server.config.logger.info(saveComment(opts.outFile, payload));
            res.end('{"ok":true}');
          })
          .catch((error) => {
            server.config.logger.warn(`design-mode: rejected comment (${error.message})`);
            res.statusCode = 400;
            res.end('{"ok":false}');
          });
      });

      server.config.logger.info(`design-mode: active, comments go to ${opts.outFile}`);
    },
  };
}
