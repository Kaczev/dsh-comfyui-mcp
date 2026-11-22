---
name: krea2-image-prompt
description: Use only when Krea 2 Turbo is explicitly requested or already selected for a ComfyUI job. Provides its native-node workflow, prompt recipes, sampling measurements and chroma-key checks.
---

# Generate images with local Krea 2

Use this recipe after choosing Krea 2 Turbo. To use the ComfyUI bridge, load the separate `comfyui` skill in this agent. It covers discovery, startup permissions and output verification. See [Run a ComfyUI workflow](../comfyui/SKILL.md). The model inventory and timings below describe the measured installation, not the current service. Check that the named files and node types exist before submitting; do not install missing prerequisites without permission.

## Machine facts (measured locally in 2026-10)

- Model `krea2_turbo_fp8_scaled.safetensors` + encoder `qwen3vl_4b_fp8_scaled.safetensors` (`CLIPLoader type=krea2`) + `qwen_image_vae.safetensors`. **This machine had no checkpoints.**
- ComfyUI was launched with `--disable-all-custom-nodes`: KJNodes / RMBG / upscale / controlnet / ip-adapter were unavailable. The image action of `generate_image` would fail without a checkpoint. Build a node graph instead: `UNETLoader → CLIPLoader → VAELoader → CLIPTextEncode ×2 → EmptySD3LatentImage → KSampler → VAEDecode → SaveImage`. Full JSON: `reference/workflow.json`.
- 8GB VRAM was sufficient; 2K worked but took 4.7 times as long.
- Style LoRA: `krea2_darkbrush.safetensors`, strength 1.0, **no trigger word needed**. It shifts the image toward watercolor/oil painting, darkens the overall tone and changes character colors. `krea2_znsfw_V2` is an NSFW model, unrelated to asset work; do not use it.

## Sampling parameters (do not change arbitrarily)

| Setting | Value | Basis |
| --- | --- | --- |
| steps | 8 | Distilled model; increasing to 12 steps gave no visible benefit |
| cfg | 1.0 | 1.5+12 steps took 2.8 times as long without improving the image; at cfg=1 the guidance formula reduces to the conditional prediction alone, so **negative prompts do not participate mathematically; omit them** |
| sampler / scheduler | `er_sde` / `simple` | Upstream verified combination |
| seed | An explicit fixed number | Needed for reproducibility and consistency |

| Size | Measured time |
| --- | --- |
| 512×512 | 12s |
| 768×768 | 26s |
| 1024×1024 | 30s |
| 1024×1536 | 45s |
| 1280×800 | 30s |
| 1536×640 / 1536×768 | 30–33s |
| 1920×1080 | 60s |
| 2048×2048 | 140s |

Try composition at 512² or 1024², then rerun at the target size. The same prompt and seed do not guarantee the same result at a different size; composition can drift.

## Hard rules

1. **Put all intended visible text in English double quotes** and keep it short (1–4 words). Latin text was clear and correct at 1024², 1280×800 and 1920×1080: `text reads "Preferences"`.
2. **Write `no text` when no text is intended.** Any area described as text-shaped without specified wording invites pseudo-text: measured examples included sidebar labels `Revanto / Reparls`, chart axes `lor / 1ar / lmo` and translucent letter textures in the background.
3. **Do not rely on Chinese rendering.** A common four-character phrase occasionally worked (`欢迎回来`), but longer wording became look-alike characters: `登录`→`设各`, `鲸鲸的后花园`→`鲽鲽的后莪园`. For Chinese UI, generate a text-free image with reserved space, then overlay real text in HTML/CSS.
4. Describe only **visible things**, in this order: subject → appearance details (color/material/outline/line width) → composition and viewpoint → style and medium → light and color → background and negative space → `no text`. Krea 2 uses a Qwen3-VL encoder and understands natural language; the final background and `no text` clauses tend to take effect most reliably.
5. **One image, one job.** For four icons, request a 2×2 grid, matching style and equal padding. Do not expect twelve consistent components in one pass.
6. **Do not use grounded DSL**: `t[160,180,700,280]"..."` is a training format for a bbox-finetuned variant. Stock Turbo renders the brackets literally; this was observed as visible text leakage.
7. `app icon` can add a rounded-square background (squircle). For full-bleed art or seamless textures, use `flat vector illustration` / `sticker on a solid ... background` instead.
8. Keep prompts below 300 words. A measured 68-word, 14-element prompt included every element, even the last one. The encoding window is limited (community reports suggest about 512 tokens); overflow is truncated from the end, often losing the crucial `no text` clause.

## Six-part template

```
<one-sentence subject>, <appearance details>, <composition and viewpoint>, <style and medium>, <light and color>, <background and negative space>, no text
```

Example:

```
Flat vector app icon of a friendly blue whale, thick rounded dark navy outlines, two flat colors plus white belly, centered with generous padding, solid off-white background, no text
```

This example keeps its background. If the icon needs transparency, describe it as a `sticker` rather than an `app icon` and use the keying workflow below.

## Three invocation paths

Probe the configured service with `runtime status` or `runtime test`. Read the upstream tool schemas with `discover`; these checks do not start ComfyUI. Every `call_tool` may start an offline configured instance if `autoStart` is enabled, even for history. Only start a service or run a job within the user's authorization. Scripts contact `COMFY_URL` directly (default `http://127.0.0.1:8188`); they do not use the plugin's startup controller.

1. **MCP**: copy the [API graph](./reference/workflow.json). Set the prompt in node `4`, size in node `6`, seed in node `7` and output prefix in node `9`. Submit the graph through `call_tool` using the discovered `enqueue_workflow` schema and `action:"enqueue"`. Keep the returned `prompt_id`; look up that job in history before any retry. Retrieve its actual image and check the dimensions, content and intended destination. The historical run returned both a prompt ID and an image.
2. **Direct HTTP scripts**: run from the skill directory. Replace `OUTPUT_DIR` below with a new writable project directory outside the installed package. Use an explicit seed.
   ```
   python scripts/krea.py --prompt "..." --w 1024 --h 1024 --seed 12345 --out OUTPUT_DIR
   ```
   The script supports `--lora krea2_darkbrush.safetensors:1.0`. `--init image.png --denoise 0.45` uploads the file under its basename with overwrite enabled: check the destination, use a unique basename and obtain authorization for the upload. The batch runner (`python scripts/batch.py jobs.json`) submits every listed job and writes under `scripts/out`; use it only when the batch and destination are intended.
3. **Transparent background**: choose a saturated key color that does not appear anywhere in the icon and is easy to distinguish from its outline and edge highlights. Use bright green when the icon has no green or nearby hues; for mint or teal artwork, try bright magenta if the icon has no pink or purple. Pick against the whole palette rather than inverting the main color.

   Append `centered with clear padding on all sides, on a flat solid bright magenta background covering the entire canvas, even lighting, no gradient, texture, cast shadow or glow, no text`, substituting the chosen color. Keep the icon clear of the frame so the script can sample the background from the border. Once the fill is uniform, run:
   ```
   python scripts/key.py in.png out.png
   ```
   The script saves an RGBA PNG and a light/dark/pink preview. Check the light and dark panels at the intended icon size for colored fringes, gaps in the silhouette, and missing thin lines.

## Consistency

- **Characters**: reuse the character block verbatim (hair / eyes / clothing / palette / art style). The character stayed consistent when changing seed or pose: both same-seed/different-action and different-seed/same-prompt tests were stable. Replace pose verbs rather than rewriting the character block.
- **Character holding an object**: full-body chibi figures hugging a plush merged arms and plush into a blob (reproduced twice). Generate props separately and composite them.
- **img2img**: denoise 0.45 only adjusted details and introduced faint texture artifacts. For a different pose, txt2img was cleaner.
- **Icon families**: generating a 2×2 grid and cropping produced more consistent styling than four separate images.

## Asset recipes

Icons / icon families / hero backgrounds / empty states / seamless patterns / component sheets / full-screen mockups / character art / watercolor scenes / material textures: copyable prompts and measured outcomes are in `reference/recipes.md`.

For experiments, timings and failures, see `reference/experiments.md`.

## Troubleshooting

| Symptom | Cause | Remedy |
| --- | --- | --- |
| Garbled text or pseudo-letters | Unquoted wording or Chinese | Specify ≤4 words in English double quotes; overlay Chinese later |
| Translucent letter textures in the background | Prompt describes an interface with lots of text | Remove text descriptions and add `no text` |
| Hands and plush merge into a blob | Full-body chibi figure holding an object | Remove the prop, or request hands resting at the sides |
| Rounded-square tile surrounds the subject | `app icon` | Use `sticker` / `illustration on solid background` |
| All elements appear but are blurry | Too many words and no clear subject | Define the subject in one sentence first; try composition at 512² |
| Fringes or missing details after keying | The key color is too close to the artwork, or the background is uneven | Regenerate with a more distinct key color or a flatter fill, then key again |

## Other uses

Scene illustrations, conceptual images, presentation covers, stickers and reaction images, avatars, desktop-pet character art, character turnarounds and expression sheets, comic storyboards, isometric minimaps, achievement badges, material spheres (glass/metal/paper), gradient and noise backgrounds, social-card backgrounds, 404 and empty-state illustrations, skeleton-screen placeholders, greeting cards and posters. This workflow applies to bitmap assets; keep real copy and layout in HTML/CSS.
