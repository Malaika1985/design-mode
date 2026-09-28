/**
 * Nuxt module tests.
 *
 * design-mode ships without dependencies, so @nuxt/kit is not installed by
 * default and this file skips itself. To run it:
 *
 *   npm i --no-save @nuxt/kit h3
 *   npm test
 *
 * CI does exactly that in a separate job.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after, describe } from 'node:test';

let kit;
try {
  kit = await import('@nuxt/kit');
} catch {
  test('nuxt module', { skip: '@nuxt/kit not installed' }, () => {});
}

if (kit) {
  const { runWithNuxtContext } = kit;
  const { default: mod } = await import('../src/nuxt.mjs');

  // Hooks stay inside the suite so they run on suite completion rather than on
  // process exit - see the note in collector.test.mjs.
  describe('nuxt module', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-mode-nuxt-'));

    const fakeNuxt = (dev, designMode) => ({
      _version: '3.0.0',
      options: { dev, rootDir: dir, app: { head: {} }, devServerHandlers: [], designMode },
      hook() {},
      hooks: { hook() {}, callHook: async () => {} },
      callHook: async () => {},
    });

    const run = (nuxt) => runWithNuxtContext(nuxt, () => mod({}, nuxt));

    after(() => fs.rmSync(dir, { recursive: true, force: true }));

    test('exposes the expected module metadata', async () => {
      const meta = await mod.getMeta();
      assert.equal(meta.name, 'design-mode');
      assert.equal(meta.configKey, 'designMode');
    });

    test('does absolutely nothing outside of dev mode', async () => {
      const nuxt = fakeNuxt(false);
      await run(nuxt);
      assert.equal(nuxt.options.app.head.script, undefined);
      assert.equal(nuxt.options.devServerHandlers.length, 0);
    });

    test('injects the overlay and registers both dev handlers', async () => {
      const nuxt = fakeNuxt(true);
      await run(nuxt);
      assert.deepEqual(nuxt.options.app.head.script, [
        { src: '/__design-mode/overlay.js', defer: true },
      ]);
      assert.deepEqual(
        nuxt.options.devServerHandlers.map((h) => h.route),
        ['/__design-mode/overlay.js', '/__design-mode/comment']
      );
    });

    test('enabled: false turns it into a no-op', async () => {
      const nuxt = fakeNuxt(true, { enabled: false });
      await run(nuxt);
      assert.equal(nuxt.options.app.head.script, undefined);
      assert.equal(nuxt.options.devServerHandlers.length, 0);
    });

    test('rejects an unknown language from nuxt.config', async () => {
      const nuxt = fakeNuxt(true, { lang: 'fr' });
      await assert.rejects(() => run(nuxt), /unknown lang "fr"/);
    });
  });
}
