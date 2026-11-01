---
name: krea2-image-prompt
description: Prompt guide and pipeline for bitmap assets with local Krea 2 Turbo—UI icons, backgrounds, empty states, characters, textures and seamless patterns; includes chroma-key transparency, character consistency and troubleshooting.
---

# Generate images with local Krea 2

Load only after choosing Krea 2 for bitmap production. For tool selection and acceptance, see [Asset production](../visual-asset-production/SKILL.md). Machine facts and timings below are historical measurements. Check the current models, nodes and interfaces before use; do not automatically install missing models.

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

## Three invocation paths

First check readiness. If ComfyUI does not respond at the configured address, check plugin configuration, then use the authorized startup method: `runtime start` (MCP) or the user's own ComfyUI launcher. Scripts default to `http://127.0.0.1:8188`; override with `COMFY_URL`. All scripts are under this skill's `scripts/` directory; use absolute paths or change into the skill directory first.

1. **MCP (primary path)**: pass an API-format graph (`reference/workflow.json`) to `enqueue_workflow action:"enqueue"`, then retrieve images with `get_history action:"list"`. This path was verified to return a prompt_id and an image.
2. **Quick scripts (fastest for local iteration)**:
   ```
   python scripts/krea.py --prompt "..." --w 1024 --h 1024 --seed 12345
   ```
   Supports `--lora krea2_darkbrush.safetensors:1.0`, `--init image.png --denoise 0.45` (img2img) and `--out DIR`. For batches: `python scripts/batch.py jobs.json`.
3. **Transparent background**: prompt with `on a completely flat solid chroma green background, even lighting, no shadow`, then run:
   ```
   python scripts/key.py in.png out.png
   ```
   Produces RGBA plus a light/dark/pink triptych preview. Use magenta if the subject itself is greenish.

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
| Green edges after keying | The subject itself is greenish | Use a magenta background and key again |

## Other uses

Scene illustrations, conceptual images, presentation covers, stickers and reaction images, avatars, desktop-pet character art, character turnarounds and expression sheets, comic storyboards, isometric minimaps, achievement badges, material spheres (glass/metal/paper), gradient and noise backgrounds, social-card backgrounds, 404 and empty-state illustrations, skeleton-screen placeholders, greeting cards and posters. This workflow applies to bitmap assets; keep real copy and layout in HTML/CSS.
