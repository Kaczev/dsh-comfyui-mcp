import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConfiguredRuntime } from '../configured-runtime.mjs';

test('configuration switches close the old runtime without starting a process', async () => {
  let value = { url: 'http://127.0.0.1:8188' };
  const events = [];
  const runtime = createConfiguredRuntime(() => value, config => ({
    config,
    status: async () => { events.push('status:' + config.url); return config; },
    close: async () => { events.push('close:' + config.url); },
  }));
  assert.equal((await runtime.run('config')).url, value.url);
  value = { url: 'http://127.0.0.1:8190' };
  assert.equal((await runtime.run('status')).url, value.url);
  assert.deepEqual(events, ['close:http://127.0.0.1:8188', 'status:http://127.0.0.1:8190']);
  await runtime.close();
  assert.equal(events.at(-1), 'close:http://127.0.0.1:8190');
  await assert.rejects(runtime.run('status'), /closing/);
});

test('old lazyTools settings preserve the runtime and the upstream config', async () => {
  let value = {}, created = 0, closed = 0;
  const runtime = createConfiguredRuntime(() => value, config => {
    created++;
    return { config, close: async () => { closed++; } };
  });
  const initial = await runtime.run('config');
  for (const lazyTools of [true, false]) {
    value = { lazyTools };
    assert.equal(await runtime.run('config'), initial);
    assert.equal(created, 1);
    assert.equal(closed, 0);
  }
  assert.equal(Object.hasOwn(initial, 'lazyTools'), false);
  await runtime.close();
  assert.equal(closed, 1);
});

test('invalid saved configuration does not dispose the active runtime', async () => {
  let value = {};
  let closed = false;
  const runtime = createConfiguredRuntime(() => value, config => ({config, close: async () => { closed = true; }}));
  await runtime.run('config');
  value = { url: 'file:///invalid' };
  await assert.rejects(runtime.run('config'), /HTTP/);
  assert.equal(closed, false);
  await runtime.close();
});
