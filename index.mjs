import z from '@deepseek-ai/schemastery';
import * as mcp from '@deepseek-ai/dsh-mcp-client';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createConfiguredRuntime } from './configured-runtime.mjs';
import { installLazyTools } from './lazy-tools.mjs';
export const name='dsh-comfyui-mcp';
export const inject=['tools','webServer','agents'];
export const Config=z.object({
 lazyTools:z.boolean().default(true).description('Load the four ComfyUI tools only when requested by each agent. Does not start ComfyUI.'),
 url:z.string().default('http://127.0.0.1:8188').description('ComfyUI HTTP(S) address; default is loopback.'),
 autoStart:z.boolean().default(false).description('Allow local on-demand startup. Discovery and connection tests never start ComfyUI.'),
 comfyuiDir:z.string().default('').description('Absolute directory containing main.py. Required for local startup.'),
 pythonPath:z.string().default('').description('Absolute Python executable path. No automatic dependency installation.'),
 launchArgs:z.array(String).default([]).description('Additional ComfyUI arguments; network binding overrides are forbidden.'),
 startupTimeoutMs:z.number().min(1000).max(600000).default(120000)
}).volatile();
export async function apply(ctx,config){
 const runtime=createConfiguredRuntime(()=>config.get());const token=randomBytes(32).toString('hex');let disposed=false;
 const control=createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');try{if(req.method!=='POST'||req.headers.authorization!=='Bearer '+token){res.writeHead(403);return res.end('{}');}const action=req.url.slice(1);if(!['status','start','stop','free','config'].includes(action))throw Error('Unknown action');const value=await runtime.run(action);res.end(JSON.stringify(value));}catch(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));}});
 await new Promise((resolve,reject)=>{control.once('error',reject);control.listen(0,'127.0.0.1',resolve);});
 ctx.effect(()=>async()=>{disposed=true;await runtime.close();control.closeAllConnections();await new Promise(r=>control.close(r));},'comfyui.runtime');
 ctx.effect(()=>ctx.webServer.register({kind:'exact',path:'/api/dsh-comfyui/status',handler:async(req,res)=>{res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');if(req.method!=='GET'){res.writeHead(405);return res.end('{}');}try{const s=await runtime.run('status');res.end(JSON.stringify(s));}catch(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));}}}),'comfyui.status-route');
 await mcp.apply(ctx,mcp.Config({transport:'stdio',serverName:'comfyui',command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],env:{ELECTRON_RUN_AS_NODE:'1',DSH_COMFY_CONTROL:'http://127.0.0.1:'+control.address().port,DSH_COMFY_TOKEN:token},toolCallTimeoutMs:1800000,failOnStartupError:true}));
 if(disposed)throw Error('Plugin disposed during startup');
 installLazyTools(ctx,config);
}
