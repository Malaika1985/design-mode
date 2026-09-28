/**
 * Nuxt module: design-mode
 *
 *   export default defineNuxtConfig({
 *     modules: ['design-mode/nuxt'],
 *     designMode: { lang: 'de' },   // optional
 *   })
 *
 * Injects the overlay into every page and accepts comments at
 * /__design-mode/comment - no extra process, no other project changes.
 * The module exits immediately outside of dev mode, and dev server handlers
 * are never part of a production build.
 */
import { defineNuxtModule, addDevServerHandler } from '@nuxt/kit';
import { defineEventHandler, readBody, setResponseHeader, createError } from 'h3';
import {
  COMMENT_ROUTE,
  OVERLAY_ROUTE,
  overlayScript,
  resolveOptions,
  saveComment,
} from './serve.mjs';

export default defineNuxtModule({
  meta: {
    name: 'design-mode',
    configKey: 'designMode',
    compatibility: { nuxt: '>=3.0.0' },
  },

  defaults: {
    lang: 'en',
    outFile: 'design-comments.md',
    enabled: true,
  },

  setup(options, nuxt) {
    if (!nuxt.options.dev) return; // dev only, always

    const opts = resolveOptions(options, nuxt.options.rootDir);
    if (!opts.enabled) return;

    nuxt.options.app.head.script = nuxt.options.app.head.script || [];
    nuxt.options.app.head.script.push({ src: OVERLAY_ROUTE, defer: true });

    addDevServerHandler({
      route: OVERLAY_ROUTE,
      handler: defineEventHandler((event) => {
        setResponseHeader(event, 'Content-Type', 'application/javascript; charset=utf-8');
        setResponseHeader(event, 'Cache-Control', 'no-store');
        return overlayScript(opts);
      }),
    });

    addDevServerHandler({
      route: COMMENT_ROUTE,
      handler: defineEventHandler(async (event) => {
        const body = await readBody(event);
        try {
          console.log(saveComment(opts.outFile, body));
        } catch (error) {
          throw createError({ statusCode: 400, statusMessage: error.message });
        }
        return { ok: true };
      }),
    });

    console.log(`design-mode: active, comments go to ${opts.outFile}`);
  },
});
