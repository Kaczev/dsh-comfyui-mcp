// Keep discovery read-only and execution/lifecycle effects separate.
const object = (properties, required = []) => ({type:'object', properties, required, additionalProperties:false});
export const TOOL_SCHEMAS = [
  {name:'runtime', description:'Inspect/control ComfyUI. Status/test never start it; stop only stops owned processes; free unloads models and may affect other users.', inputSchema:object({action:{type:'string',enum:['status','test','start','stop','free'],default:'status'}})},
  {name:'discover', description:'Search the upstream catalog, or pass name alone for its full schema. Never starts ComfyUI or loads models.', inputSchema:object({name:{type:'string',minLength:1,description:'Exact tool name; omit to search.'},search:{type:'string',description:'Catalog text filter; omit when name is set.'},category:{type:'string',description:'Catalog category filter; omit when name is set.'}})},
  {name:'call_tool', description:'Execute an upstream tool; discover its schema first. May start configured local ComfyUI. Use enqueue_workflow for Krea2. Installing/updating models or dependencies requires user permission. Returns MCP images and paths.', inputSchema:object({name:{type:'string',minLength:1},args:{type:'object',additionalProperties:true}},['name'])},
];
export const TOOL_NAMES = TOOL_SCHEMAS.map(({name}) => 'mcp__comfyui__' + name);
export const LEGACY_NAMES = ['list_tools','describe_tool'].map(name => 'mcp__comfyui__' + name);
const text = value => ({content:[{type:'text',text:JSON.stringify(value)}]});
function validateObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Arguments must be an object');
}
export async function dispatchTool(name, args = {}, {control, connect}) {
  try {
    validateObject(args);
    if (name === 'runtime') {
      if (Object.keys(args).some(key => key !== 'action')) throw Error('Unknown runtime argument');
      const action = args.action ?? 'status';
      if (!['status','test','start','stop','free'].includes(action)) throw Error('Unknown runtime action: ' + action);
      return text(await control(action === 'test' ? 'status' : action));
    }
    if (name === 'discover') {
      if (Object.keys(args).some(key => !['name','search','category'].includes(key))) throw Error('Unknown discovery argument');
      for (const value of Object.values(args)) if (typeof value !== 'string') throw Error('Discovery filters must be strings');
      if (args.name !== undefined) {
        if (!args.name.trim() || args.search !== undefined || args.category !== undefined) throw Error('Use name alone for a schema, or search/category for the catalog');
        return await (await connect()).callTool({name:'describe_tool',arguments:{name:args.name}},undefined,{timeout:1800000});
      }
      return await (await connect()).callTool({name:'list_tools',arguments:args},undefined,{timeout:1800000});
    }
    // Compatibility for recorded calls; intentionally absent from tools/list.
    if (!['list_tools','describe_tool','call_tool'].includes(name)) throw Error('Unknown tool: ' + name);
    if (name === 'call_tool') {
      if (typeof args.name !== 'string' || !args.name.trim()) throw Error('Tool name is required');
      if (args.args !== undefined) validateObject(args.args);
      await control('start');
    }
    return await (await connect()).callTool({name,arguments:args},undefined,{timeout:1800000});
  } catch (error) {
    return {isError:true,content:[{type:'text',text:error.message}]};
  }
}
