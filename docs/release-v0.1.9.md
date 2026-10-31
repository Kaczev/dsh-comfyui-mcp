# v0.1.9

## Changes

- Package the existing skills and companion resources in the npm distribution.
- Register runtime skills through the current Host skills service when enabled; dispose registrations with the plugin. Preserve independent same-name user skills.
- Update README installation, ownership and migration instructions. No tool routing or application behavior redesign.
- Replace one machine-specific absolute startup path in the Krea skill with configured startup guidance.

## Verification

- npm run check; npm test: 29 tests: 28 passed, 1 opt-in live process test skipped.
- npm run pack:check includes all owned SKILL.md files and companion resources.
- Current DSH profile: official plugin-manager enable/disable; every owned skill loaded from this package directory and disappeared from the live catalog on disable. Local duplicate junctions were backed up outside skill scanning; no skill bodies deleted.
- Restored original enabled states: Unity enabled; ComfyUI and Photoshop disabled.
- Same-name coexistence is covered by registration/disposal regression tests; not tested by adding a temporary real user skill.
- One disable operation reported restart-required (package-moved); the subsequent live catalog no longer contained the skills. A full DSH restart and running ComfyUI-process shutdown were not exercised.
- No new engine scene edits, image generation or Photoshop document edits were required or tested for this skill-lifecycle change.
