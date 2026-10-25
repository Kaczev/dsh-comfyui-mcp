import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { probe } from '../runtime.mjs';

async function fixture(handler, run) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('probe reaches a real HTTP endpoint without issuing start or prompt requests', async () => {
  const requests = [];
  await fixture((req, res) => {
    requests.push([req.method, req.url]);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({system: {os: 'test'}, devices: []}));
  }, async url => assert.deepEqual(await probe(url), {running: true}));
  assert.deepEqual(requests, [['GET', '/system_stats']]);
});

test('probe rejects an unrelated HTTP server and malformed JSON', async () => {
  for (const body of ['{}', 'not-json']) {
    await fixture((req, res) => res.end(body), async url => {
      const result = await probe(url);
      assert.equal(result.running, false);
      assert.equal(typeof result.error, 'string');
    });
  }
});

test('probe reports HTTP errors without treating them as readiness', async () => {
  await fixture((req, res) => { res.writeHead(503); res.end(); }, async url => {
    assert.deepEqual(await probe(url), {running: false, error: 'HTTP 503'});
  });
});
