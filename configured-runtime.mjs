import { createRuntime, validateConfig } from './runtime.mjs';

export function createConfiguredRuntime(readConfig, factory = createRuntime) {
  let runtime, signature, closed = false, pending = Promise.resolve();
  function run(action) {
    const task = pending.then(async () => {
      if (closed) throw Error('Runtime is closing');
      const config = validateConfig(readConfig());
      const next = JSON.stringify(config);
      if (signature !== next) {
        await runtime?.close();
        runtime = factory(config);
        signature = next;
      }
      return action === 'config' ? runtime.config : runtime[action]();
    });
    pending = task.catch(() => {});
    return task;
  }
  return {
    run,
    async close() {
      closed = true;
      await pending;
      await runtime?.close();
    },
  };
}
