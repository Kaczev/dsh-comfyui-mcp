import test from 'node:test';
import assert from 'node:assert/strict';
import {TOOL_SCHEMAS,dispatchTool} from '../tool-router.mjs';
function harness(){
 const events=[];
 const deps={
  control:async action=>{events.push(action);return {action};},
  connect:async()=>{events.push('connect');return {callTool:async request=>{events.push(request);return {content:[{type:'text',text:'upstream'}]};}};},
 };
 return {events,deps};
}
test('catalog has three compact entry points',()=>{assert.deepEqual(TOOL_SCHEMAS.map(t=>t.name),['runtime','discover','call_tool']);});
test('discovery searches and describes without starting ComfyUI',async()=>{for(const [args,name] of [[{search:'image',category:'images-assets'},'list_tools'],[{name:'enqueue_workflow'},'describe_tool'],[{},'list_tools']]){const h=harness();const result=await dispatchTool('discover',args,h.deps);assert.ok(!result.isError);assert.deepEqual(h.events,['connect',{name,arguments:args}]);}});
test('runtime defaults to status and test probes status without a connection',async()=>{for(const args of [{},{action:'test'}]){const h=harness();await dispatchTool('runtime',args,h.deps);assert.deepEqual(h.events,['status']);}});
test('execution starts before connecting and preserves upstream content',async()=>{const h=harness();const args={name:'enqueue_workflow',args:{action:'enqueue'}};assert.deepEqual(await dispatchTool('call_tool',args,h.deps),{content:[{type:'text',text:'upstream'}]});assert.deepEqual(h.events,['start','connect',{name:'call_tool',arguments:args}]);});
test('invalid calls fail before side effects',async()=>{for(const [name,args] of [['discover',{name:'x',search:'y'}],['discover',{name:''}],['discover',{search:3}],['discover',{extra:'x'}],['runtime',{action:'delete'}],['runtime',{extra:true}],['call_tool',{}],['call_tool',{name:'x',args:[]}],['unknown',{}],['discover',[]]]){const h=harness();assert.equal((await dispatchTool(name,args,h.deps)).isError,true);assert.deepEqual(h.events,[]);}});
test('legacy discovery routes remain callable but unadvertised',async()=>{for(const name of ['list_tools','describe_tool']){const h=harness();await dispatchTool(name,{name:'x'},h.deps);assert.deepEqual(h.events,['connect',{name,arguments:{name:'x'}}]);assert.ok(!TOOL_SCHEMAS.some(t=>t.name===name));}});
test('control errors are reported without connecting',async()=>{const h=harness();h.deps.control=async()=>{throw Error('start denied');};const result=await dispatchTool('call_tool',{name:'x'},h.deps);assert.equal(result.isError,true);assert.equal(result.content[0].text,'start denied');assert.deepEqual(h.events,[]);});
