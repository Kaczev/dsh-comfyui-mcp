# Asset recipes

Each recipe was tested on the local machine. Prompts can be copied in full. Measured outcomes describe that run, not predictions.

Common suffix: `no text` when no wording is needed, or `text reads "..."` when it is. Choose resolution for the intended use; start at 1024² to test composition.

---

## 1. Vector icon

```
Flat vector app icon of a friendly blue whale, thick rounded dark navy outlines, two flat colors plus white belly, simple geometric shapes, centered with generous padding, solid off-white background, no text
```

- 1024², 30s. A clean two-color vector whale with generous padding.
- 512², 12s, with the same quality. For icons, select a candidate at 512² first, then rerun larger.
- **`app icon` can cause a rounded-square background (squircle)**, especially at 2048², where the entire image became an app-icon tile. For a standalone graphic, use:
  ```
  Flat vector sticker of a friendly blue whale, thick dark navy outline, blue body with white belly, on a solid off-white background, even lighting, no shadow, no text
  ```

## 2. Icon family (four at once)

```
A set of four flat vector app icons arranged in a 2x2 grid on an off-white background: a whale, a crescent moon, a star and a soap bubble. Identical style across all four, thick rounded dark navy outlines, two flat colors each, generous equal padding, aligned to a grid, no text
```

- 1024², 30s. All four icons shared line width and two-color treatment, but **spacing and sizes were not exactly equal**. Add padding around their visual centers when cropping.
- The simplest crop is to split into four cells with Pillow, then crop each bounding box. Do not expect exact equal divisions from the model.

## 3. Hero / page background (space for text)

```
A soft dreamy illustration background for an app onboarding screen: pale peach and lavender watercolor sky, gentle clouds, a calm horizon low in the frame, a small whale silhouette floating near the upper right, large empty smooth negative space across the left half for text, very soft edges and low contrast, no text
```

- 1536×1024, 45s. The left side remained empty, the subject landed in the upper right, and overlaid text was readable.
- The key wording is `large empty smooth negative space across the <position> for text` + `low contrast`. Asking only for a background produces evenly distributed texture that interferes with text.
- Abstract backgrounds (gradient meshes, noise) also worked:
  ```
  Abstract soft gradient mesh background, pale mint green fading into lavender and warm cream, blurred organic blobs, fine film grain, extremely low contrast, no subject, no text, calm and airy, suitable as a website hero background
  ```
  → 1536×768, 33s. Soft and usable; purple areas were sometimes too saturated and needed a white overlay in CSS.

## 4. Empty-state / error-page illustration

```
A charming empty-state illustration for a message inbox: a small round blue whale character lying upside down on a tiny cloud, eyes closed, bored but cute, flat vector style with soft pastel palette and thick outlines, isolated on a plain white background, lots of white space above, no text
```

- 1024², 32s. The subject sat at bottom center with ample space above for a heading and button.
- For transparency, see `scripts/key.py`: change the background to `on a solid chroma green background`, then key it.

## 5. Seamless repeating pattern

```
A seamless repeating pattern of tiny cute blue whales and small soap bubbles scattered evenly on a pale mint background, flat vector illustration, thick outlines, evenly spaced with no empty gaps, tileable edges, no text, no border
```

- 1024², 30s. Produced a regular repeating grid, but **“seamless” is an intention, not a guarantee**. Offset by half a tile and inspect seams in a 2×2 arrangement before use. For an actually seamless result, crop a clean four-cell repeat unit and tile that.

## 6. UI component sheet

```
A UI component sheet arranged as a neat grid on a plain off-white background: a dark navy pill button, an outlined secondary button, a toggle switch in the on position, a round avatar placeholder, a text input field with a light grey border, a small badge with a count, a checkbox checked, a progress bar at sixty percent. Consistent flat vector style, thin rounded shapes, soft grey shadows, each component evenly spaced in its own cell, aligned to a grid, no text labels
```

- 1024², 31s. All eight components were present with consistent styling, but **their proportions were noticeably oversized**, unlike real components. Useful as a style reference, not ready-to-crop production UI.
- An unspecified number such as `a small badge with a count` invites pseudo-digits (a strange `7` shape appeared in the test). Quote the exact number if needed.

## 7. Full-screen UI mockup (main workhorse)

```
A settings panel UI mockup, light theme, rounded window with a soft drop shadow at the centre of a pale lavender background. A title at the top reads "Preferences". Below it four rows, each with a label and a control on the right: "Notifications" with a toggle, "Theme" with a segmented control showing "Light" and "Dark", "Language" with a dropdown reading "English", "Storage" with a progress bar and the text "4.2 GB of 8 GB". Flat vector interface design, crisp sans-serif typography, thin dividers, generous spacing, no photo
```

- 1280×800, 30s. **Every quoted string was correct**, as were the toggle, segmented control and progress bar. Usable as a design mockup to show someone.
- Also reliable at 1920×1080 (60s), with clean text at full resolution.
- Counterexample from the same test round: describing four menu rows and three cards named Revenue/Users/Retention without quoting all wording produced `Anlytich Dashyiens`, `Revanto`, `Reparls`, `lor / 1ar / lmo` and translucent letter textures in the background. **Quote all text; otherwise omit that text area entirely.**
- Chinese: `欢迎回来` happened to work, but `登录` became `设各`, and a full heading became look-alike characters. Overlay Chinese copy afterward.

## 8. Character art (UI avatars / empty states / desktop pets)

Character block (reuse verbatim):

```
Full body chibi anime girl mascot wearing an oversized blue whale hoodie with a whale-tail hood, fluffy white hair, big round blue eyes, soft pastel palette of mint blue and cream, soft watercolor and cel-shaded illustration, thick clean linework, plain white background, centered with margin around the character, no text
```

- 1024×1536, 45s. To change pose, change only the clause in the middle:
  ```
  ... big round blue eyes, waving one hand cheerfully, slight three-quarter turn, soft pastel palette of mint blue and cream ...
  ```
  Same seed with a new pose → same character doing another action. Different seed with the same prompt → still the same character (matching hair, hood and palette). **Identity came from the wording, not the seed.**
- Failure: `hugging a small whale plush` merged arms and plush into a blob (reproduced twice). Generate props separately and composite them.
- Non-chibi character art with normal proportions also worked:
  ```
  Anime illustration of a girl in a whale hoodie sitting on a rock at the seaside, soft pastel palette, gentle light
  ```
  1024², 32s. Adding `--lora krea2_darkbrush.safetensors:1.0` produced watercolor/oil texture, a darker tone and different colors (40s). Use it to change texture and style, not to preserve the original palette.

## 9. Wide banner (with a sticker-style character)

```
A wide app banner with a soft pastel watercolor background of pale peach and mint clouds. On the right side a cute chibi whale character floats happily among bubbles. On the left third large bold dark navy Chinese text reads '鲸鲸的后花园', below it smaller text reads '每天收集一只小鲸鱼'. Flat vector illustration with thick outlines, plenty of clean space, no other text
```

- 1536×640, 30s. Layout, character and negative space were correct, but **the Chinese heading became look-alike characters** (`鲽鲽的后莪园`). Replace Chinese with Latin wording, or leave the banner blank and overlay text afterward.

## 10. Transparent assets

```
Flat vector mascot sticker of a friendly blue whale, thick dark navy outline, blue body with white belly, simple geometric shapes, on a completely flat solid chroma green background (hex 00FF00), even lighting, no shadow, no text
```

- 1024², 30s. The generated green was not pure `#00FF00` (measured around `#29BE48`), so adapt keying to the median boundary color rather than hard-coding it.
- `python scripts/key.py in.png out.png` → RGBA with green spill suppression and a light/dark/pink triptych preview. Default thresholds: `lo=36 hi=96`; increase `lo` if edges remain green.
- If the subject is greenish/cyan (such as a mint mascot), use a magenta background. This also worked in testing, with slightly cleaner edges.

## 11. Scene illustrations / conceptual images

A long prompt can specify viewpoint, placement, materials, tone and several objects at once. A measured 68-word, 14-element prompt included everything, even the final tiny red umbrella against the wall at bottom right:

```
A cozy reading nook in a small attic room, warm afternoon light through a round window, a worn armchair with a knitted blanket, a stack of books on a wooden stool, dust motes in the sunbeam, soft painterly illustration, muted warm palette, quiet and inviting atmosphere, gentle shadows, visible brush texture, careful composition with the window at the upper left and the chair facing it, a small whale plush tucked into the corner of the armchair, a striped mug of tea on the floor beside the stool, a folded newspaper, a hanging plant in the upper right corner, an old rug with faded geometric pattern, three framed prints on the slanted wall, a wooden ladder leaning at the far right, in the extreme lower right corner a tiny red umbrella leaning against the wall
```

- 1024², 32s. Long prompts still worked, but keep them below 300 words.
