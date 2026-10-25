import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

export function validateConfig(input = {}) {
  const c = { url: 'http://127.0.0.1:8188', autoStart: false, comfyuiDir: '', pythonPath: '', launchArgs: [], startupTimeoutMs: 120000, ...input };
  const u = new URL(c.url);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) throw Error('Use an HTTP(S) address without credentials, query or fragment.');
  c.url = u.href.endsWith('/') ? u.href.slice(0, -1) : u.href;
  if (typeof c.autoStart !== 'boolean') throw Error('autoStart must be boolean');
  if (!Array.isArray(c.launchArgs) || c.launchArgs.some(a => typeof a !== 'string')) throw Error('launchArgs must be an array of strings');
  if (c.autoStart) {
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname) || u.protocol !== 'http:' || u.pathname !== '/') throw Error('Local startup requires a loopback HTTP origin.');
    if (!path.isAbsolute(c.comfyuiDir) || !path.isAbsolute(c.pythonPath)) throw Error('Local startup requires absolute ComfyUI and Python paths.');
  }
  // argparse accepts long-option abbreviations. Only explicitly supported non-network options are allowed.
  const flags = new Set(['--use-pytorch-cross-attention', '--disable-xformers', '--lowvram', '--novram', '--highvram', '--normalvram', '--cpu', '--force-fp32', '--force-fp16', '--fp16-vae', '--fp32-vae', '--bf16-vae', '--cpu-vae', '--preview-method']);
  for (let i = 0; i < c.launchArgs.length; i++) {
    const a = c.launchArgs[i];
    if (!flags.has(a)) throw Error('Unsupported launch argument: ' + a);
    if (a === '--preview-method' && !['none', 'auto', 'latent2rgb', 'taesd'].includes(c.launchArgs[++i])) throw Error('Invalid preview method');
  }
  if (!Number.isFinite(c.startupTimeoutMs) || c.startupTimeoutMs < 1000 || c.startupTimeoutMs > 600000) throw Error('Startup timeout must be 1000–600000 ms.');
  return c;
}
export async function probe(url) {
  try {
    const r = await fetch(url + '/system_stats', { signal: AbortSignal.timeout(2500) });
    if (!r.ok) throw Error('HTTP ' + r.status);
    const body = await r.json();
    if (!body.system && !body.devices) throw Error('Not a ComfyUI system_stats response');
    return { running: true };
  } catch (e) { return { running: false, error: e.message }; }
}
export function createRuntime(input, { spawnProcess = spawn, probeAddress = probe } = {}) {
  const c = validateConfig(input);
  let child, starting, closing = false, lastError;
  const owned = () => !!child && child.exitCode === null && child.signalCode === null;
  async function status() { return { ...await probeAddress(c.url), owned: owned(), pid: owned() ? child.pid : undefined, url: c.url, autoStart: c.autoStart, lastError }; }
  async function waitExit(p, ms) {
    if (p.exitCode !== null || p.signalCode !== null) return;
    await new Promise(resolve => {
      const done = () => { clearTimeout(timer); p.removeListener('exit', done); resolve(); };
      const timer = setTimeout(done, ms);
      p.once('exit', done);
    });
  }
  async function terminate() {
    if (!owned()) return { stopped: false, reason: 'No owned process; external instances are never stopped.' };
    const p = child;
    p.kill(); await waitExit(p, 8000);
    if (owned()) { p.kill('SIGKILL'); await waitExit(p, 2000); }
    if (owned()) throw Error('Owned ComfyUI process could not be stopped: ' + p.pid);
    return { stopped: true, pid: p.pid };
  }
  async function start() {
    if (closing) throw Error('Runtime is closing');
    if (starting) return starting;
    starting = (async () => {
      if ((await probeAddress(c.url)).running) return { running: true, started: false, owned: owned() };
      if (!c.autoStart) throw Error('ComfyUI is offline; local on-demand startup is disabled.');
      if (owned()) throw Error('Owned process exists but is not responding.');
      const main = path.join(c.comfyuiDir, 'main.py');
      fs.accessSync(main); fs.accessSync(c.pythonPath);
      if (closing) throw Error('Runtime is closing');
      const u = new URL(c.url);
      child = spawnProcess(c.pythonPath, [main, '--listen', u.hostname === '[::1]' ? '::1' : '127.0.0.1', '--port', u.port || '80', '--disable-auto-launch', '--disable-all-custom-nodes', '--disable-api-nodes', ...c.launchArgs], { cwd: c.comfyuiDir, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, windowsHide: true, stdio: ['ignore', 'inherit', 'inherit'] });
      let failure;
      child.on('error', e => { failure = e; });
      const end = Date.now() + c.startupTimeoutMs;
      while (Date.now() < end) {
        if (closing) throw Error('Runtime is closing');
        if (failure) throw failure;
        if (!owned()) throw Error('ComfyUI exited before becoming ready; inspect DSH stderr logs.');
        if ((await probeAddress(c.url)).running) { lastError = undefined; return { running: true, started: true, owned: true, pid: child.pid }; }
        await delay(500);
      }
      throw Error('ComfyUI startup timed out; inspect DSH stderr logs.');
    })().catch(async e => { lastError = e.message; await terminate(); throw e; }).finally(() => { starting = undefined; });
    return starting;
  }
  async function stop() { closing = true; try { await starting?.catch(() => {}); return await terminate(); } finally { closing = false; } }
  async function close() { closing = true; await starting?.catch(() => {}); return terminate(); }
  async function free() {
    if (!(await status()).running) return { freed: false };
    const r = await fetch(c.url + '/free', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unload_models: true, free_memory: true }), signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw Error('Free failed: HTTP ' + r.status);
    return { freed: true };
  }
  return { status, start, stop, close, free, config: c };
}
