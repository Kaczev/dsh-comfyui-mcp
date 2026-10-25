import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('bundle page contains status and official revisioned configuration together', async () => {
 const entries=[];let plugin;const writes=[];
 const state={value:{},writable:true,revision:1};
 const scope={getSnapshot:()=>state,subscribe:()=>()=>{},mutate:async(...args)=>{writes.push(args);return true;}};
 const React={createElement:(type,props,...children)=>({type,props:props||{},children}),useState:value=>[value,()=>{}],useSyncExternalStore:(_,get)=>get()};
 vm.runInNewContext(fs.readFileSync(new URL('../client.js',import.meta.url),'utf8'),{window:{__ModuleLoader__:{load:spec=>{plugin=spec.factory(()=>React);}}}});
 const ctx={effect:fn=>fn(),inject:(_,fn)=>fn(ctx),configForms:{whileServed:(names,register)=>{assert.deepEqual(Array.from(names),['dsh-comfyui-mcp']);return register();},get:ns=>{assert.equal(ns,'dsh-comfyui-mcp');return scope;}},locale:{register(){},bind:()=>x=>x,getLocale:()=>({id:'zh'})},slots:{inject:(_,fn)=>fn(),register:(options,render)=>entries.push({options,render})}};plugin.apply(ctx);
 assert.equal(entries.length,1);
 const entry=entries[0];assert.equal(entry.options.name,'plugins.bundle.config');
 assert.equal(entry.options.key,'dsh-comfyui-mcp');
 const root=entry.render();const page=root.type(root.props);assert.equal(page.children.length,2);
 const component=page.children[1].children[2];
 const tree=component.type(component.props);
 assert.equal(tree.type,'form');
 const labels=tree.children.slice(1,7);
 assert.equal(labels[1].children[1].type,'select');
 assert.equal(labels[2].children[1].props.placeholder,'包含 main.py 的目录');
 await tree.props.onSubmit({preventDefault(){}});
 assert.equal(writes.length,1);assert.equal(writes[0][1],1);
 assert.equal(writes[0][0].length,6);
 assert.equal(writes[0][0].find(x=>x.path[0]==='autoStart').value,false);
 assert.equal(writes[0][0].find(x=>x.path[0]==='url').value,'http://127.0.0.1:8188');
});
