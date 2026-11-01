# Test record (2026-10-25, RTX 5060 Laptop 8GB)

This round explored the local Krea 2 Turbo setup from scratch. Conclusions were incorporated into SKILL.md; the process and evidence remain here to avoid repeating failed approaches.

## Environment

- ComfyUI 0.30.2, `--disable-all-custom-nodes --disable-api-nodes`, `127.0.0.1:8188`.
- Models: `krea2_turbo_fp8_scaled` + `qwen3vl_4b_fp8_scaled` (type=krea2) + `qwen_image_vae`. No checkpoint.
- A custom-built node graph worked; `EmptySD3LatentImage` produced images correctly. First image including model loading: about 26–29s; subsequent 512² images: about 12s.

## Comparisons performed

| # | Purpose | Input | Result |
| --- | --- | --- | --- |
| 1 | Pipeline viability | Apple still life, 768² | Worked, good image quality |
| 2 | Vector-icon baseline | Blue whale icon, 1024² | Clean two-color vector; `app icon` did not add a square background at 1024² |
| 3 | Text rendering | Card UI with quoted heading/subheading/button | **All correct**, with good typography |
| 4 | Grounded DSL | `t[160,180,700,280]"Good morning"`, etc. | Roughly correct layout, but **brackets rendered literally** → stock model does not support this syntax; abandoned |
| 5 | Unquoted text | Four message rows with a name and preview each | Names became `Paties/Baties`, previews `oneetirles: olinlslic:`; translucent letter textures appeared in the background |
| 6 | Higher cfg | Icon, cfg 1.5 / 12 steps | 81s vs 29s, no image improvement → keep cfg 1 / 8 steps |
| 7 | 2K | Icon, 2048² | 140s, valid output, but added a rounded-square background (squircle) |
| 8 | Is 512² enough? | Icon, 512² | 12s, enough quality for candidate selection |
| 9 | Transparency | Blue whale on chroma green / magenta | Both keyed cleanly; measured green around `#29BE48`, magenta around `#E60E9A` |
| 10 | Consistency: same seed, different pose | Character block + seed 12345, adding "waving one hand" | Same character, only the action changed |
| 11 | Consistency: different seed, same wording | Character block + seed 99999 | Still the same character (hair/hood/palette consistent) |
| 12 | img2img | Previous image + denoise 0.45 + new pose prompt | Only expression and details changed; **pose did not change**, and faint texture artifacts appeared |
| 13 | Icon family | Four icons in a 2×2 grid | Consistent style, uneven spacing and sizes; add padding when cropping |
| 14 | Background with negative space | 1536×1024, blank left side for text | Precise negative space, subject in upper right |
| 15 | Seamless pattern | Tiled whales and bubbles | Regular grid; usable as a pattern but seams not guaranteed |
| 16 | Component sheet | 8 UI components | All eight present and stylistically consistent, but oversized; unquoted count badge produced a pseudo-digit `7` |
| 17 | Full-resolution UI | 1280×800 settings panel with quoted text | **All strings correct**, 30s |
| 18 | Full-resolution UI | 1920×1080 dashboard, some wording unquoted | Heading/sidebar/axis labels became pseudo-text → quoting coverage determines readability |
| 19 | Chinese | 1920×1080 login page, `欢迎回来/邮箱/密码/登录` | `欢迎回来` correct; `邮箱`→`箝杨`, `密码`→`答留`, `登录`→`设各` |
| 20 | Chinese | 1536×640 banner, `鲸鲸的后花园` | → `鲽鲽的后莪园` (look-alike substitutions) |
| 21 | Long prompt | Reading nook, 68 words / 14 elements | All included, even the final element (tiny red umbrella) |
| 22 | Style LoRA | `krea2_darkbrush:1.0` | Watercolor/oil texture, darker tone, changed palette; no trigger word needed |
| 23 | MCP path | Graph passed to `enqueue_workflow action:"enqueue"` | Returned prompt_id; 512² in 11.6s; `get_history` retrieved the image |

## Timing baseline

512² 12s · 768² 26s (including initial load) · 1024² 30s · 1280×800 30s · 1536×640 30s · 1536×768 33s · 1024×1536 45s · 1920×1080 60s · 2048² 140s

## Known unavailable paths

- `generate_image` (through CheckpointLoaderSimple): no local checkpoint.
- `remove_background` / `upscale` / `controlnet` / `ip_adapter`: depend on disabled custom nodes; no upscale_models either.
- Grounded DSL (bbox training format): leaks into visible text on stock Turbo.

## Not yet tested

- `redcraftKREA2RedMix_krea2Edition.safetensors` (the second diffusion model).
- Two-pass detail enhancement (the upstream `krea2-combo` pack approach; requires KJNodes, disabled locally).
- Actual behavior of img2img denoise ≥0.6 (only 0.45 was tested).
- Whether alternative samplers (`euler`/`dpmpp_2m`) change texture.
