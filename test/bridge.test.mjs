import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {fileURLToPath} from 'node:url';

test('stdio bridge advertises three tools and discovers real upstream schemas without starting ComfyUI', {timeout:60000}, async()=>{
 const actions=[];
 const control=createServer((req,res)=>{
  assert.equal(req.headers.authorization,'Bearer acceptance-token');
  const action=req.url.slice(1);actions.push(action);
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify(action==='config'?{url:'http://127.0.0.1:1',comfyuiDir:'',pythonPath:''}:{running:false,owned:false}));
 });
 await new Promise(resolve=>control.listen(0,'127.0.0.1',resolve));
 const client=new Client({name:'bridge-acceptance',version:'1'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../server.mjs',import.meta.url))],env:{...process.env,DSH_COMFY_CONTROL:'http://127.0.0.1:'+control.address().port,DSH_COMFY_TOKEN:'acceptance-token'},stderr:'pipe'});
 try {
  await client.connect(transport);
  assert.deepEqual((await client.listTools()).tools.map(t=>t.name),['runtime','discover','call_tool']);
  for(const request of [{name:'runtime',arguments:{}},{name:'discover',arguments:{search:'image'}},{name:'discover',arguments:{name:'enqueue_workflow'}},{name:'describe_tool',arguments:{name:'enqueue_workflow'}}]){
   const result=await client.callTool(request);
   assert.ok(!result.isError,JSON.stringify(result));
   assert.ok(result.content.length);
   if(request.arguments?.name)assert.match(JSON.stringify(result),/workflow/);
  }
  assert.ok(actions.includes('config'));
  assert.ok(!actions.includes('start'));
 } finally {await client.close();await transport.close();await new Promise(resolve=>control.close(resolve));}
});
