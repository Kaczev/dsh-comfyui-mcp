# 0.1.10

Translate visual-asset-production, krea2-image-prompt and the two Krea reference documents into English. Workflow JSON and Python scripts are unchanged.

Skill names, registration, tool interfaces, safety rules and measured values are preserved. This patch does not change runtime code or dependencies.

## Verification

- `npm run check`, `npm test` (28 passed, 1 skipped), `npm run pack:check` and tarball inspection.
- Replacement-resource comparison against the handoff kit; unchanged executable resources retain their baseline hashes.

No live DSH profile reload, editor operation, Photoshop operation or image generation was performed for this documentation patch.
