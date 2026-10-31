import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListToolsRequestSchema,CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);let backend,connecting,closing=false;
async function control(action){const r=await fetch(process.env.DSH_COMFY_CONTROL+'/'+action,{method:'POST',headers:{authorization:'Bearer '+process.env.DSH_COMFY_TOKEN},signal:AbortSignal.timeout(action==='start'?610000:15000)});const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
let backendConfig;
async function connect(){const c=await control('config');const key=JSON.stringify(c);if(backend&&backendConfig!==key){await backend.close();backend=undefined;}if(backend)return backend;if(connecting)return connecting;return connecting=(async()=>{const client=new Client({name:'dsh-comfyui-upstream',version:'0.1.0'});const transport=new StdioClientTransport({command:process.execPath,args:[require.resolve('comfyui-mcp'),'--compact'],env:{...process.env,ELECTRON_RUN_AS_NODE:'1',COMFYUI_URL:c.url,COMFYUI_PATH:c.comfyuiDir||'',COMFYUI_PYTHON:c.pythonPath||''},stderr:'inherit'});try{await client.connect(transport);if(closing){await client.close();throw Error('Closing');}backend=client;backendConfig=key;return client;}catch(e){await transport.close();throw e;}})().finally(()=>connecting=undefined);}
import { TOOL_SCHEMAS, dispatchTool } from './tool-router.mjs';
const server=new Server({name:'dsh-comfyui-mcp',version:'0.1.8'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:TOOL_SCHEMAS}));
server.setRequestHandler(CallToolRequestSchema,async({params})=>dispatchTool(params.name,params.arguments,{control,connect}));
async function shutdown(){if(closing)return;closing=true;await connecting?.catch(()=>{});await backend?.close();await server.close();process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);process.stdin.on('end',shutdown);
await server.connect(new StdioServerTransport());
