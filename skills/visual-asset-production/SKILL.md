---
name: visual-asset-production
description: Use when the user requests ComfyUI or a ComfyUI workflow has been selected. Inspect the runtime and upstream schema, check workflow prerequisites, submit an authorized job and verify its output.
---

# Run a ComfyUI workflow

Use the configured ComfyUI bridge. A request for an icon, illustration or transparent PNG does not by itself select this backend. The tools normally appear as `mcp__comfyui__runtime`, `mcp__comfyui__discover` and `mcp__comfyui__call_tool`. Only use `comfyui_load_tools` if the optional loader is visible instead. Loading tool definitions does not start ComfyUI.

## Inspect without starting

1. Call `runtime` with `{"action":"status"}` or `{"action":"test"}` to probe the configured service. If it is offline and the task is inspection only, report that state; do not start it.
2. Call `discover` with a filter such as `{"search":"workflow"}`. Then pass the exact name alone, e.g. `{"name":"enqueue_workflow"}`, to read the upstream schema. Neither operation starts ComfyUI or loads models. A catalog entry describes an upstream tool; it does not prove a model or node is installed on this instance.
3. Check the selected workflow against the intended service: API graph format, node types, exact model filenames, inputs, dimensions, seed and save node. For local Krea 2 Turbo, load [the Krea recipe](../krea2-image-prompt/SKILL.md) only after selecting that model. If a prerequisite is missing, report it; do not download models or install or update dependencies or nodes without explicit permission.

## Execute and verify

Every `call_tool`, even an inventory or history query, first asks the runtime to connect or start. If the endpoint is offline, this may launch a configured loopback instance when `autoStart` is enabled. Do not use a business call as a harmless connectivity test. Confirm authorization for starting a process, using compute or paid resources, sending inputs to the configured service and writing outputs as applicable. Use `runtime start` only when startup is intended.

Submit the checked graph with `call_tool` using the discovered `enqueue_workflow` schema (`action: "enqueue"`). Keep the returned `prompt_id`. If the call times out or returns no image, inspect history for that same job before resubmitting: a timeout does not cancel the queue entry. Use `discover` to check the schema of history and image retrieval tools. A queue ID proves submission, not completion.

Match the history entry and output to the submitted job. Retrieve the image, decode it and check its format, dimensions and visible content at the intended size. For transparent assets, inspect alpha and edges on light and dark backgrounds. A server-side filename is not a verified local file. Report the image or verified destination, workflow and seed; distinguish queued, failed and unverified results. Preserve the original when saving a derivative.

`runtime stop` stops only a process owned by this plugin. `runtime free` unloads models from the connected instance and can disrupt other users. Do not stop a shared job or free shared resources as routine cleanup.
