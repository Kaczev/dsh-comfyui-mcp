import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createUpstream } from './upstream.mjs';
import { TOOL_SCHEMAS, dispatchTool } from './tool-router.mjs';

async function control(action) {
  const response = await fetch(process.env.DSH_COMFY_CONTROL + '/' + action, {
    method: 'POST', headers: { authorization: 'Bearer ' + process.env.DSH_COMFY_TOKEN },
    signal: AbortSignal.timeout(action === 'start' ? 610000 : 15000),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error);
  return data;
}
const upstream = createUpstream(() => control('config'));
const server = new Server({ name: 'dsh-comfyui-mcp', version: '1' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOL_SCHEMAS }));
server.setRequestHandler(CallToolRequestSchema, ({ params }, { signal }) =>
  dispatchTool(params.name, params.arguments, { control, connect: upstream.connect, signal }));
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  await upstream.close();
  await server.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.stdin.on('end', shutdown);
await server.connect(new StdioServerTransport());
