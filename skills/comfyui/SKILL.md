---
name: comfyui
description: Use when the user requests ComfyUI or a ComfyUI workflow has been selected. Inspect the runtime, find upstream tools, check workflow prerequisites, run an authorized job and verify its output.
---

# Run a ComfyUI workflow

Loading this skill enables `mcp__comfyui__runtime`, `mcp__comfyui__discover` and `mcp__comfyui__call_tool` for this agent, subject to its preset. Each child agent that needs these tools must load `comfyui` itself. A request for an icon or image alone does not select ComfyUI.

## Inspect without starting ComfyUI

1. Probe the configured service with `runtime` and `{"action":"status"}`. `{"action":"test"}` runs the same probe. Report an offline service if the user asked only for inspection.
2. Search the upstream catalog with `discover`, for example `{"search":"workflow"}`. Then pass the exact name alone, such as `{"name":"enqueue_workflow"}`, for its schema. Both operations leave ComfyUI and its models unloaded if they were offline.
3. Check the workflow's API graph, node types, exact model filenames, inputs, dimensions, seed and save node against the intended service. For Krea 2 Turbo, consult [the Krea recipe](../krea2-image-prompt/SKILL.md). Ask before installing missing models, dependencies or nodes.

## Execute and verify

Every `call_tool`, including a history query, asks the runtime to connect or start. If the service is offline and `autoStart` is enabled, the plugin may launch a configured loopback instance. Confirm that the task authorizes startup, compute, transfer of inputs and output writes as applicable.

Submit the checked graph through `call_tool` using the discovered `enqueue_workflow` schema and `action: "enqueue"`. Keep its `prompt_id`. A timeout can leave the job queued. Check history under the same ID before resubmitting. Use `discover` for the history and image retrieval schemas.

Match the returned image to the submitted job. Decode it and check its format, dimensions and visible content at the intended size. For transparency, inspect edges on light and dark backgrounds. Verify the local destination before reporting a saved file. Include the workflow and seed with the result.

`runtime stop` stops only a plugin-owned process. `runtime free` unloads models on the connected instance and can interrupt other users. Obtain permission before releasing shared resources.
