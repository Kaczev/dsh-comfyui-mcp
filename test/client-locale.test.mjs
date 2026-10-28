import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('client locales coexist with package metadata and clean up on remount', () => {
  const occupied = new Set(['dsh-comfyui-mcp:zh', 'dsh-comfyui-mcp:en']);
  const cleanups = [];
  const ctx = {
    locale: {
      register(ns, lang) {
        const key = ns + ':' + lang;
        assert.ok(!occupied.has(key), 'duplicate locale: ' + key);
        occupied.add(key);
        return () => occupied.delete(key);
      },
      bind(ns) { assert.equal(ns, 'dsh-comfyui-mcp-ui'); return key => key; }
    },
    effect(fn) { const dispose = fn(); cleanups.push(dispose); return dispose; },
    inject() {}
  };
  let plugin;
  vm.runInNewContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load({ factory }) { plugin = factory(() => ({ createElement() {} })); } } }
  });
  for (let i = 0; i < 2; i++) {
    plugin.apply(ctx);
    assert.equal(occupied.size, 4);
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
    assert.deepEqual([...occupied], ['dsh-comfyui-mcp:zh', 'dsh-comfyui-mcp:en']);
  }
});
