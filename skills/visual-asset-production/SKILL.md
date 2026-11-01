---
name: visual-asset-production
description: Use when producing UI icons, panels, characters, backgrounds or textures to choose generation, programmatic drawing and typography, then verify assets at target size in their actual context.
---

# Choose asset tools and verify in context

## Choose tools from the constraints

Read existing visual references and assets. Confirm dimensions, transparency, padding, scaling, anchors, colors and text requirements.

- Prefer SVG, Canvas, programmatic drawing or typesetting for precise borders, nine-slice assets, layout, text and quantitative graphics.
- Generative models suit illustrations, textures and shapes that allow variation. Check models, nodes and authorization first.
- Reuse or lightly adapt suitable existing assets rather than redoing all assets without authorization.

Separate what may vary from what must be exact. Pseudo-text is not production copy. When text must be accurate, generate a text-free base and typeset real fonts afterwards.

## From sample to final asset

Confirm composition with a small sample and record the model, workflow, inputs and seed. The same seed does not guarantee consistency across models, dimensions or versions. Do not turn historical measurements into permanent guarantees.

Sample colors from existing assets and fix outlines, materials, light direction and viewpoint. Reuse character descriptions and references, but still check each image's face, clothing and proportions. Complex props and components can be made in layers. Batch generation does not prove consistency.

Read the [Krea skill](../krea2-image-prompt/SKILL.md) only when using Krea 2. Recheck its machine-specific facts before use; do not copy paths blindly or assume models exist. Read the current MCP schema first. Do not download models, install nodes or consume paid resources without authorization.

## Post-processing

Preserve originals and editable sources, and write to new paths. Before background removal, check whether subject and background share colors, then adjust thresholds from a conservative starting point. Load white-background-to-alpha when needed for white backgrounds. A white preview does not prove transparency.

Check decoded format, dimensions, alpha and edges on light, dark and colored backgrounds at target size. Leave margin for strokes. After scaling, inspect fine lines, white fringes and color spill.

Place assets back into the actual interface or scene. Check contrast, anchors, landing points, occlusion, seams and real copy. An HTML visual reference does not replace application acceptance. Report source files, outputs, verified sizes and remaining differences.
