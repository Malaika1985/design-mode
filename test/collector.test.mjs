import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after, before, describe } from 'node:test';
import { isLocalOrigin, startCollector } from '../src/collector.mjs';

const payload = {
  comment: 'more padding here',
  url: '/',
  selector: 'section.hero',
  components: ['Hero'],
  tag: 'section',
  classes: ['hero'],
};

// These hooks must live inside a describe(): a root-level `after` only runs on
// process exit, which never happens while the server holds the event loop open
// - the teardown would be waiting for itself (hangs on Node 18).
describe('collector', () => {
  let server;
  let baseUrl;
  let dir;
  let outFile;

  before(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-mode-collector-'));
    outFile = path.join(dir, 'design-comments.md');
    server = await startCollector({ port: 0, outFile, lang: 'de', log: () => {} });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => {
    // fetch() pools its sockets, so close() alone would wait for them.
    server?.closeAllConnections();
    server?.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('accepts a comment from a localhost origin and writes it', async () => {
    const res = await fetch(`${baseUrl}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.match(fs.readFileSync(outFile, 'utf8'), /more padding here/);
  });

  test('rejects a foreign origin', async () => {
    const res = await fetch(`${baseUrl}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 403);
    assert.doesNotMatch(fs.readFileSync(outFile, 'utf8'), /evil/);
  });

  test('rejects a malformed body', async () => {
    const res = await fetch(`${baseUrl}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    assert.equal(res.status, 400);
  });

  test('rejects a payload without a comment', async () => {
    const res = await fetch(`${baseUrl}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selector: 'div' }),
    });
    assert.equal(res.status, 400);
  });

  test('serves the overlay with the configured language', async () => {
    const res = await fetch(`${baseUrl}/overlay.js`);
    const body = await res.text();

    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /javascript/);
    assert.match(body, /^window\.__DESIGN_MODE__=/);
    assert.match(body, /"lang":"de"/);
    assert.match(body, /__designModeLoaded/);
  });

  test('answers preflight requests from localhost', async () => {
    const res = await fetch(`${baseUrl}/comment`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://127.0.0.1:3000' },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://127.0.0.1:3000');
  });

  test('unknown routes are 404', async () => {
    const res = await fetch(`${baseUrl}/nope`);
    assert.equal(res.status, 404);
  });
});

test('isLocalOrigin only trusts loopback', () => {
  assert.ok(isLocalOrigin('http://localhost:3000'));
  assert.ok(isLocalOrigin('http://127.0.0.1:5173'));
  assert.ok(isLocalOrigin('https://localhost'));
  assert.ok(isLocalOrigin('http://[::1]:8080'));
  assert.ok(!isLocalOrigin('http://localhost.evil.com'));
  assert.ok(!isLocalOrigin('https://example.com'));
  assert.ok(!isLocalOrigin('null'));
  assert.ok(!isLocalOrigin(undefined));
});
