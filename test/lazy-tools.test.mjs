import test from 'node:test';
import assert from 'node:assert/strict';
import {installLazyTools} from '../lazy-tools.mjs';
const names=['runtime','discover','call_tool'].map(n=>'mcp__comfyui__'+n);
function harness(){
 const global=new Map(names.map(name=>[name,{name,description:name,parameters:{type:'object'},execute:async()=>name}]));
 const events={},effects=[],agents=[];let lazyTools=true;
 const ctx={tools:{get:n=>global.get(n)},agents:{list:()=>agents},on:(n,f)=>events[n]=f,effect:f=>{const dispose=f();effects.push(dispose);return dispose;}};
 installLazyTools(ctx,{get:()=>({lazyTools})});
 function agent(){const own=new Map(),denied=new Set();const a={ctx:{effect:f=>f(),tools:{restrict:({deny})=>{deny.forEach(n=>denied.add(n));return()=>deny.forEach(n=>denied.delete(n));},register:d=>{assert.ok(!own.has(d.name));own.set(d.name,d);return()=>own.delete(d.name);}}}};agents.push(a);events['agent/created']({agent:a});return {a,own,visible:()=>[...global.keys()].filter(n=>!denied.has(n)||own.has(n)).concat([...own.keys()].filter(n=>!global.has(n)))};}
 return {agent,events,effects,setLazy:v=>lazyTools=v};
}
test('lazy loading exposes one loader, activates three tools only for the caller, and cleans up',async()=>{
 const h=harness(),a=h.agent(),b=h.agent();assert.deepEqual(a.visible(),['comfyui_load_tools']);
 const loader=a.own.get('comfyui_load_tools');assert.deepEqual((await loader.execute()).tools,names);assert.equal(a.visible().length,4);assert.deepEqual(b.visible(),['comfyui_load_tools']);
 await loader.execute();assert.equal(a.own.size,4);
 h.setLazy(false);await h.events['agent/pre-step']({agent:a.a},()=>true);assert.equal(a.visible().length,3);assert.ok(!a.own.has('comfyui_load_tools'));
 h.setLazy(true);await h.events['agent/pre-step']({agent:a.a},()=>true);assert.equal(a.visible().length,4);
 h.effects.forEach(f=>f());assert.equal(a.own.size,0);assert.equal(b.own.size,0);
});
test('disabled mode exposes three tools without a loader',()=>{const h=harness();h.setLazy(false);const a=h.agent();assert.deepEqual(a.visible(),names);});
