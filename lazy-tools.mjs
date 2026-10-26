const NAMES=['runtime','list_tools','describe_tool','call_tool'].map(n=>'mcp__comfyui__'+n);
export function installLazyTools(ctx,config){
 const states=new Map();
 function attach(agent){
  if(states.has(agent))return states.get(agent);
  const state={loaded:false,mode:undefined,disposers:[]};states.set(agent,state);
  state.dispose=agent.ctx.effect(()=>()=>{for(const dispose of state.disposers.splice(0).reverse())dispose();states.delete(agent);},'comfyui.lazy-tools');
  return state;
 }
 function reconcile(agent){
  const state=attach(agent),lazy=config.get().lazyTools!==false;
  if(state.mode===lazy)return state;
  for(const dispose of state.disposers.splice(0).reverse())dispose();
  state.mode=lazy;
  if(!lazy){for(const name of NAMES){const definition=ctx.tools.get(name);if(!definition)throw Error('ComfyUI bridge unavailable: '+name);state.disposers.push(agent.ctx.tools.register({...definition}));}return state;}
  state.disposers.push(agent.ctx.tools.restrict({deny:NAMES}));
  const load=()=>{
   if(state.loaded)return;
   const definitions=NAMES.map(name=>{const definition=ctx.tools.get(name);if(!definition)throw Error('ComfyUI bridge unavailable: '+name);return definition;});
   const installed=[];
   try{for(const definition of definitions)installed.push(agent.ctx.tools.register({...definition}));}
   catch(error){for(const dispose of installed.reverse())dispose();throw error;}
   state.disposers.push(...installed);state.loaded=true;
  };
  if(state.loaded){state.loaded=false;load();}
  state.disposers.push(agent.ctx.tools.register({
   name:'comfyui_load_tools',description:'Load ComfyUI image generation, workflow, image retrieval and runtime tools for this agent. Does not start ComfyUI or load models.',parameters:{type:'object',properties:{},additionalProperties:false},
   output:{schema:{type:'object',properties:{tools:{type:'array',items:{type:'string'}}},required:['tools'],additionalProperties:false},render:(_,value)=>[{type:'text',text:JSON.stringify(value)}]},
   execute:async()=>{load();return {tools:NAMES};}
  }));return state;
 }
 ctx.on('agent/created',({agent})=>{reconcile(agent);});
 ctx.on('agent/pre-step',({agent},next)=>{reconcile(agent);return next();});
 for(const agent of ctx.agents.list())reconcile(agent);
 ctx.effect(()=>()=>{for(const state of [...states.values()])state.dispose();},'comfyui.lazy-tools-owner');
}
