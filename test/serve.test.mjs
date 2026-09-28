import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { COMMENT_ROUTE, overlayScript, resolveOptions } from '../src/serve.mjs';

test('resolveOptions defaults to English and design-comments.md in the root', () => {
  const opts = resolveOptions({}, '/project');
  assert.equal(opts.lang, 'en');
  assert.equal(opts.enabled, true);
  assert.equal(opts.outFile, path.resolve('/project/design-comments.md'));
  assert.equal(opts.collector, 'http://127.0.0.1:4939/comment');
});

test('resolveOptions honours overrides', () => {
  const opts = resolveOptions(
    { lang: 'de', outFile: 'docs/comments.md', enabled: false, collectorPort: 5000 },
    '/project'
  );
  assert.equal(opts.lang, 'de');
  assert.equal(opts.enabled, false);
  assert.equal(opts.outFile, path.resolve('/project/docs/comments.md'));
  assert.equal(opts.collector, 'http://127.0.0.1:5000/comment');
});

test('resolveOptions rejects an unknown language', () => {
  assert.throws(() => resolveOptions({ lang: 'fr' }), /unknown lang "fr"/);
});

test('overlayScript prepends the browser config', () => {
  const script = overlayScript(resolveOptions({ lang: 'auto' }, '/project'));
  const [first] = script.split('\n');
  const config = JSON.parse(first.replace('window.__DESIGN_MODE__=', '').replace(/;$/, ''));

  assert.deepEqual(config, {
    lang: 'auto',
    endpoint: COMMENT_ROUTE,
    collector: 'http://127.0.0.1:4939/comment',
  });
});

test('overlayScript lets the collector override the endpoint', () => {
  const opts = { ...resolveOptions({}, '/p'), endpoint: 'http://127.0.0.1:4939/comment' };
  assert.match(overlayScript(opts), /"endpoint":"http:\/\/127\.0\.0\.1:4939\/comment"/);
});
