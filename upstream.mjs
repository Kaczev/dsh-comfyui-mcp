import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Share a compact catalog connection across admitted calls. Serialize only the
// connection/configuration transition, leaving actual tool calls independent.
export function createUpstream(readConfig) {
  let client, signature, closed = false, pending = Promise.resolve();
  function connect() {
    const task = pending.then(async () => {
      if (closed) throw Error('ComfyUI bridge is closing');
      const config = await readConfig();
      const next = JSON.stringify(config);
      if (client && signature === next) return client;
      await client?.close();
      client = undefined;
      const candidate = new Client({ name: 'dsh-comfyui-upstream', version: '1' });
      const transport = new StdioClientTransport({
        command: process.execPath, args: [require.resolve('comfyui-mcp'), '--compact'],
        env: { ELECTRON_RUN_AS_NODE: '1', COMFYUI_URL: config.url,
          COMFYUI_PATH: config.comfyuiDir || '', COMFYUI_PYTHON: config.pythonPath || '' },
        stderr: 'inherit',
      });
      candidate.onclose = () => { if (client === candidate) client = undefined; };
      try {
        await candidate.connect(transport);
        if (closed) throw Error('ComfyUI bridge is closing');
        client = candidate;
        signature = next;
        return client;
      } catch (error) {
        await transport.close();
        throw error;
      }
    });
    pending = task.catch(() => {});
    return task;
  }
  return { connect, async close() { closed = true; await pending; await client?.close(); } };
}
