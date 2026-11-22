import test from 'node:test';
import assert from 'node:assert/strict';
import { installSkillGate } from '../lazy-tools.mjs';

const skill = { name: 'comfyui', content: 'packaged instructions', provider: 'runtime',
  resourceBase: { kind: 'directory', path: '/skills/comfyui/' } };
const rendered = '<skill_content name="comfyui">packaged instructions</skill_content>';
function harness() {
  const agents = [], listeners = new Map();
  const when = installSkillGate({ agents: { list: () => agents }, on: (key, fn) => listeners.set(key, fn) }, skill, rendered);
  const agent = () => { const a = { session: {} }; agents.push(a); return a; };
  const load = (a, exec = {}, result = {}) => listeners.get('tools/result')(
    { agent: a, name: 'skill', arguments: { name: 'comfyui' }, ...exec },
    { isError: false, value: skill, ...result });
  const slash = (a, source = {}, text = rendered) => listeners.get('session/event')(a.session, {
    type: 'user/message', data: { source: { kind: 'skill-invocation', form: 'instructions', name: 'comfyui', ...source }, content: [{ type: 'text', text }] },
  });
  return { agent, load, slash, visible: a => when({ agent: a }) };
}

test('the packaged skill activates only its caller after a successful load', () => {
  const h = harness(), caller = h.agent(), sibling = h.agent();
  assert.equal(h.visible(caller), false);
  h.load(caller, {}, { isError: true });
  h.load(caller, { name: 'comfyui_load_tools' });
  h.load(caller, { arguments: { name: 'krea2-image-prompt' } });
  h.load(caller, {}, { value: { ...skill, resourceBase: { kind: 'directory', path: '/elsewhere' } } });
  assert.equal(h.visible(caller), false);
  h.load(caller);
  assert.equal(h.visible(caller), true);
  assert.equal(h.visible(sibling), false);
  const fork = h.agent(); fork.parent = caller; fork.session.snapshotEvents = () => { throw Error('inherited history read'); };
  assert.equal(h.visible(fork), false);
  h.load(fork);
  assert.equal(h.visible(fork), true);
  assert.equal(h.visible(undefined), false);
});

test('slash activation requires committed host instructions from the packaged skill', () => {
  const h = harness(), a = h.agent(), b = h.agent();
  h.slash(a, { kind: 'user' }, '/comfyui');
  h.slash(a, { kind: 'skill-catalog' });
  h.slash(a, { name: 'krea2-image-prompt' });
  h.slash(a, {}, '<skill_content name="comfyui">different body</skill_content>');
  assert.equal(h.visible(a), false);
  h.slash(a);
  assert.equal(h.visible(a), true);
  assert.equal(h.visible(b), false);
});
