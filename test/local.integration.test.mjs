import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, probe } from '../runtime.mjs';

// Opt-in acceptance check: uses the user's prepared Python environment, never installs it.
test('real local process starts on demand and close releases its listener', {skip:!process.env.DSH_COMFY_TEST_DIR,timeout:180000}, async () => {
 const runtime=createRuntime({comfyuiDir:process.env.DSH_COMFY_TEST_DIR,pythonPath:process.env.DSH_COMFY_TEST_PYTHON,url:'http://127.0.0.1:18188',autoStart:true,launchArgs:['--use-pytorch-cross-attention','--disable-xformers']});
 assert.equal((await runtime.status()).running,false);
 assert.equal((await runtime.status()).owned,false);
 try {
  const started=await runtime.start();
  assert.equal(started.started,true);
  assert.equal(started.owned,true);
  assert.equal((await runtime.status()).running,true);
  const external=createRuntime({url:'http://127.0.0.1:18188'});
  assert.equal((await external.start()).started,false);
  assert.equal((await external.status()).owned,false);
  assert.equal((await external.stop()).stopped,false);
  await external.close();
  assert.equal((await runtime.status()).running,true);
 } finally {await runtime.close();}
 assert.equal((await probe('http://127.0.0.1:18188')).running,false);
 assert.equal((await runtime.status()).owned,false);
});
