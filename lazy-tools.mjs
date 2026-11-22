// A fresh Agent, including a fork, must load the packaged skill for itself.
// Observe live events only. The transcript prefix and provider tool-call headers
// are neither skill loads nor evidence that this Agent received instructions.
export function installSkillGate(ctx, skill, rendered) {
  const active = new WeakSet();
  ctx.on('tools/result', (exec, result) => {
    const value = result.value;
    if (exec.agent && exec.name === 'skill' && exec.arguments?.name === skill.name &&
        result.isError === false && value?.name === skill.name &&
        value.provider === 'runtime' && value.content === skill.content &&
        value.resourceBase?.kind === 'directory' && value.resourceBase.path === skill.resourceBase.path) {
      active.add(exec.agent);
    }
  });
  ctx.on('session/event', (session, event) => {
    if (event.type !== 'user/message') return;
    const { source, content } = event.data;
    if (source?.kind !== 'skill-invocation' || source.name !== skill.name || source.form !== 'instructions' ||
        content?.length !== 1 || content[0]?.type !== 'text' || content[0].text !== rendered) return;
    const owners = [...ctx.agents.list()].filter(agent => agent.session === session);
    if (owners.length === 1) active.add(owners[0]);
  });
  return ({ agent }) => active.has(agent);
}
