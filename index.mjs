import z from '@deepseek-ai/schemastery';
import { createMcpToolDefinition } from '@deepseek-ai/dsh-mcp-client';
import { renderSkillContent } from '@deepseek-ai/dsh-skill';
import { createConfiguredRuntime } from './configured-runtime.mjs';
import { createUpstream } from './upstream.mjs';
import { installSkillGate } from './lazy-tools.mjs';
import { installPackagedSkills } from './packaged-skills.mjs';
import { TOOL_SCHEMAS, dispatchTool } from './tool-router.mjs';
export const name = 'dsh-comfyui-mcp';
export const inject = ['tools', 'webServer', 'agents', 'skills'];
export const Config = z.object({
  url: z.string().default('http://127.0.0.1:8188').description('ComfyUI HTTP(S) address; default is loopback.'),
  autoStart: z.boolean().default(false).description('Allow local on-demand startup. Discovery and connection tests never start ComfyUI.'),
  comfyuiDir: z.string().default('').description('Absolute directory containing main.py. Required for local startup.'),
  pythonPath: z.string().default('').description('Absolute Python executable path. No automatic dependency installation.'),
  launchArgs: z.array(String).default([]).description('Additional ComfyUI arguments; network binding overrides are forbidden.'),
  startupTimeoutMs: z.number().min(1000).max(600000).default(120000),
}).volatile();

export function apply(ctx, config) {
  if (typeof ctx.tools.resolve !== 'function' || typeof ctx.tools.executable !== 'function') {
    throw Error('This plugin requires DSH conditional tool registration (0.2.2-rc.5 or newer).');
  }
  const skills = installPackagedSkills(ctx, new URL('./skills/', import.meta.url));
  const skill = skills.find(row => row.name === 'comfyui');
  const when = installSkillGate(ctx, skill, renderSkillContent({ ...skill, provider: 'runtime' }));
  const runtime = createConfiguredRuntime(() => config.get());
  const upstream = createUpstream(() => runtime.run('config'));
  const generation = new AbortController();
  ctx.effect(() => async () => {
    generation.abort();
    try { await upstream.close(); } finally { await runtime.close(); }
  }, 'comfyui.runtime');
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact', path: '/api/dsh-comfyui/status', async handler(req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      if (req.method !== 'GET') { res.writeHead(405); return res.end('{}'); }
      try { res.end(JSON.stringify(await runtime.run('status'))); }
      catch (error) { res.writeHead(500); res.end(JSON.stringify({ error: error.message })); }
    },
  }), 'comfyui.status-route');
  for (const { name: rawName, description, inputSchema } of TOOL_SCHEMAS) {
    const definition = createMcpToolDefinition(ctx, {
      name: `mcp__comfyui__${rawName}`, rawName, description, inputSchema,
      call: (args, exec) => dispatchTool(rawName, args, {
        control: runtime.run, connect: upstream.connect,
        signal: AbortSignal.any([exec.signal, generation.signal]),
      }),
    });
    ctx.tools.register(definition, { when });
  }
}
