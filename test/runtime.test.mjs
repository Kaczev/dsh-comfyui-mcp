import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRuntime, validateConfig } from '../runtime.mjs';

test('safe defaults and URL normalization', () => {
  assert.equal(validateConfig().url, 'http://127.0.0.1:8188');
  assert.equal(validateConfig().autoStart, false);
  assert.equal(validateConfig({url:'https://example.org/comfy/'}).url, 'https://example.org/comfy');
  for (const url of ['file:///tmp', 'http://u:p@localhost', 'http://localhost/?secret=x']) assert.throws(() => validateConfig({url}));
});
test('reject unsafe network binding, option abbreviation and remote startup', () => {
  for (const launchArgs of [['--listen','0.0.0.0'],['--lis','0.0.0.0'],['--port=80'],['--enable-cors-header'],['--base-directory','elsewhere']]) assert.throws(() => validateConfig({launchArgs}));
  assert.throws(() => validateConfig({autoStart:true,url:'http://192.0.2.1:8188'}));
  assert.throws(() => validateConfig({autoStart:true}));
  assert.deepEqual(validateConfig({launchArgs:['--disable-xformers','--preview-method','none']}).launchArgs,['--disable-xformers','--preview-method','none']);
});
test('status, free and stop never start a process; external start reuses it', async () => {
  let spawned = 0;
  const rt = createRuntime({}, {spawnProcess(){spawned++;},probeAddress:async()=>({running:true})});
  assert.equal((await rt.status()).owned,false);
  assert.equal((await rt.start()).started,false);
  assert.equal((await rt.stop()).stopped,false);
  await rt.close();
  assert.equal(spawned,0);
});
test('offline connection-only mode fails without spawn', async () => {
  const rt = createRuntime({}, {spawnProcess(){throw Error('must not spawn');},probeAddress:async()=>({running:false})});
  await assert.rejects(rt.start(),/disabled/);
  await rt.close();
});
test('concurrent on-demand start launches once and close kills owned process only', async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dsh-comfy-test-'));
  fs.writeFileSync(path.join(dir,'main.py'),'# test');
  let spawned=0, live=false, killed=0, recorded;
  const child=new EventEmitter(); Object.assign(child,{pid:42,exitCode:null,signalCode:null,kill(){killed++;live=false;this.signalCode='SIGTERM';this.emit('exit');return true;}});
  const rt=createRuntime({autoStart:true,comfyuiDir:dir,pythonPath:process.execPath},{spawnProcess(command,args,options){spawned++;live=true;recorded={command,args,options};return child;},probeAddress:async()=>({running:live})});
  try {
    await rt.status(); assert.equal(spawned,0);
    const [a,b]=await Promise.all([rt.start(),rt.start()]);
    assert.equal(a.pid,42);assert.equal(b.pid,42);assert.equal(spawned,1);
    assert.ok(recorded.args.includes('127.0.0.1'));
    assert.ok(recorded.args.includes('--disable-all-custom-nodes'));
    assert.equal(recorded.options.shell,undefined);
    await rt.close(); assert.equal(killed,1);
    await rt.close(); assert.equal(killed,1);
    await assert.rejects(rt.start(),/closing/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
