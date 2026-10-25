import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('offline on-demand standby hides only the expected fetch error', () => {
 let plugin,render,status;const entries=[];let sample;
 const React={createElement:(type,props,...children)=>({type,props:props||{},children}),useState:value=>[value===undefined?sample:value,()=>{}],useSyncExternalStore:()=>({})};
 vm.runInNewContext(fs.readFileSync(new URL('../client.js',import.meta.url),'utf8'),{window:{__ModuleLoader__:{load:spec=>{plugin=spec.factory(()=>React);}}}});
 const messages={};const ctx={effect:fn=>fn(),inject:(_,fn)=>fn(ctx),configForms:{whileServed:(_,fn)=>fn(),get:()=>({})},locale:{register:(ns,lang,v)=>{if(lang==='zh')Object.assign(messages,v);},bind:()=>key=>messages[key],getLocale:()=>({id:'zh'})},slots:{inject:(_,fn)=>fn(),register:(_,fn)=>entries.push(fn)}};
 plugin.apply(ctx);render=entries[0]();status=render.type(render.props).children[0];
 const check=(value)=>{sample=value;return JSON.stringify(status.type(status.props));};
 const offline={running:false,autoStart:true,owned:false,error:'fetch failed'};
 assert.match(check(offline),/未运行 · 按需启动待命/);assert.doesNotMatch(check(offline),/fetch failed/);
 for(const extra of [{autoStart:false},{owned:true},{lastError:'startup failed'},{error:'HTTP 500'}]){const output=check({...offline,...extra});assert.doesNotMatch(output,/未运行 · 按需启动待命/);assert.match(output,/fetch failed|HTTP 500/);}
 assert.match(check({...offline,running:true}),/连接成功/);
});
