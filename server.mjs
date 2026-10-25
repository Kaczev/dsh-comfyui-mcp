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
const obj=properties=>({type:'object',properties,additionalProperties:false});const text=value=>({content:[{type:'text',text:JSON.stringify(value)}]});
const server=new Server({name:'dsh-comfyui-mcp',version:'0.1.0'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:[
{name:'runtime',description:'ComfyUI lifecycle and connection test. Status/test do not start ComfyUI; stop only terminates this plugin’s process. Stop after generation to release GPU/RAM.',inputSchema:obj({action:{type:'string',enum:['status','test','start','stop','free']}})},
{name:'list_tools',description:'Discover artokun/comfyui-mcp tools without starting ComfyUI or loading models.',inputSchema:obj({search:{type:'string'},category:{type:'string'}})},
{name:'describe_tool',description:'Read an upstream tool schema without starting ComfyUI.',inputSchema:{...obj({name:{type:'string'}}),required:['name']}},
{name:'call_tool',description:'Execute an upstream ComfyUI tool; starts local ComfyUI only when configured. Read describe_tool first. Use enqueue_workflow for native Krea2 API workflows. Never install/update models or Python dependencies without explicit user permission. Returns MCP content including images and saved paths.',inputSchema:{...obj({name:{type:'string'},args:{type:'object',additionalProperties:true}}),required:['name']}}
]}));
server.setRequestHandler(CallToolRequestSchema,async({params})=>{try{const a=params.arguments??{};if(params.name==='runtime')return text(await control(a.action==='test'?'status':a.action||'status'));if(!['list_tools','describe_tool','call_tool'].includes(params.name))throw Error('Unknown tool');if(params.name==='call_tool')await control('start');return await(await connect()).callTool({name:params.name,arguments:a},undefined,{timeout:1800000});}catch(e){return {isError:true,content:[{type:'text',text:e.message}]};}});
async function shutdown(){if(closing)return;closing=true;await connecting?.catch(()=>{});await backend?.close();await server.close();process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);process.stdin.on('end',shutdown);
await server.connect(new StdioServerTransport());
