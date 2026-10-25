# 素材配方

每条配方都是在本机实测过的。prompt 可整段复制；"实测"记的是这一次的真实结果，不是推测。

通用后缀：`no text`（不需要文字时）或 `text reads "..."`（需要文字时）。分辨率按用途取，先 1024² 试构图。

---

## 1. 矢量图标

```
Flat vector app icon of a friendly blue whale, thick rounded dark navy outlines, two flat colors plus white belly, simple geometric shapes, centered with generous padding, solid off-white background, no text
```

- 1024²，30s。干净的两色矢量鲸鱼，留白充足。
- 512²，12s，同样质量——图标类都该先跑 512² 挑图，挑中了再放大重跑。
- **`app icon` 会让模型加圆角方底（squircle）**；2048² 时尤其明显（整张图变成应用图标瓷砖）。要一张干净的图形就用：
  ```
  Flat vector sticker of a friendly blue whale, thick dark navy outline, blue body with white belly, on a solid off-white background, even lighting, no shadow, no text
  ```

## 2. 图标家族（一次出四个）

```
A set of four flat vector app icons arranged in a 2x2 grid on an off-white background: a whale, a crescent moon, a star and a soap bubble. Identical style across all four, thick rounded dark navy outlines, two flat colors each, generous equal padding, aligned to a grid, no text
```

- 1024²，30s。四个图标风格确实统一（同样的线宽与双色逻辑），但**间距与大小不完全均等**，裁切时按视觉重心补 padding。
- 裁切用 Pillow 均分四宫格再各自裁 bbox 最省事；不要指望模型给严格的等分。

## 3. Hero / 页面背景（带留白给文字）

```
A soft dreamy illustration background for an app onboarding screen: pale peach and lavender watercolor sky, gentle clouds, a calm horizon low in the frame, a small whale silhouette floating near the upper right, large empty smooth negative space across the left half for text, very soft edges and low contrast, no text
```

- 1536×1024，45s。左侧留白真的留出来了，主体落在右上，文字可读性没问题。
- 关键句式是 `large empty smooth negative space across the <位置> for text` + `low contrast`。只说"背景"会得到平均分布的纹理，叠字就糊。
- 纯抽象底（渐变网格、噪点）也可靠：
  ```
  Abstract soft gradient mesh background, pale mint green fading into lavender and warm cream, blurred organic blobs, fine film grain, extremely low contrast, no subject, no text, calm and airy, suitable as a website hero background
  ```
  → 1536×768，33s。柔和可用；紫块偶尔偏饱和，需在 CSS 里叠一层白色蒙版压住。

## 4. 空状态 / 错误页插画

```
A charming empty-state illustration for a message inbox: a small round blue whale character lying upside down on a tiny cloud, eyes closed, bored but cute, flat vector style with soft pastel palette and thick outlines, isolated on a plain white background, lots of white space above, no text
```

- 1024²，32s。主体落在下方中央、上方大片留白，正好放标题和按钮。
- 抠透明底见 `scripts/key.py`：换成 `on a solid chroma green background` 再 key。

## 5. 无缝平铺图案

```
A seamless repeating pattern of tiny cute blue whales and small soap bubbles scattered evenly on a pale mint background, flat vector illustration, thick outlines, evenly spaced with no empty gaps, tileable edges, no text, no border
```

- 1024²，30s。得到规整的重复网格，**但"seamless"只是意图，不是保证**。用前把图偏移半格拼 2×2 看一眼接缝。真要做到无缝，裁一块干净的四宫格单元再重复。

## 6. UI 组件表

```
A UI component sheet arranged as a neat grid on a plain off-white background: a dark navy pill button, an outlined secondary button, a toggle switch in the on position, a round avatar placeholder, a text input field with a light grey border, a small badge with a count, a checkbox checked, a progress bar at sixty percent. Consistent flat vector style, thin rounded shapes, soft grey shadows, each component evenly spaced in its own cell, aligned to a grid, no text labels
```

- 1024²，31s。八件套都在，风格统一，但**尺寸明显偏大**、不像真实组件比例；适合当"风格参考图"，不适合直接切图用。
- `a small badge with a count` 这种"有个数字但没说数字"的地方会被填成伪数字（实测出现一个 `7` 形状的怪字）。要数字就引号写死。

## 7. 整屏 UI mockup（工作主力）

```
A settings panel UI mockup, light theme, rounded window with a soft drop shadow at the centre of a pale lavender background. A title at the top reads "Preferences". Below it four rows, each with a label and a control on the right: "Notifications" with a toggle, "Theme" with a segmented control showing "Light" and "Dark", "Language" with a dropdown reading "English", "Storage" with a progress bar and the text "4.2 GB of 8 GB". Flat vector interface design, crisp sans-serif typography, thin dividers, generous spacing, no photo
```

- 1280×800，30s。**所有引号里的字符串全部正确**，开关/分段控件/进度条都对，可以直接当设计稿给人看。
- 1920×1080 同样可靠（60s），文字在满分辨率下依然干净。
- 反面教材（同一轮实测）：只写"四行菜单、三张卡片分别叫 Revenue/Users/Retention"而不全部加引号，会得到 `Anlytich Dashyiens`、`Revanto`、`Reparls`、`lor / 1ar / lmo` 这类伪文字，背景还会浮出半透明字母纹理。**凡是字，全部加引号；不加就整块别要。**
- 中文：`欢迎回来` 侥幸正确，`登录` 变 `设各`，整句标题变近字。中文文案一律后期叠。

## 8. 角色立绘（UI 头像 / 空状态 / 桌宠）

角色块（逐字复用，别改）：

```
Full body chibi anime girl mascot wearing an oversized blue whale hoodie with a whale-tail hood, fluffy white hair, big round blue eyes, soft pastel palette of mint blue and cream, soft watercolor and cel-shaded illustration, thick clean linework, plain white background, centered with margin around the character, no text
```

- 1024×1536，45s。要换姿势就只改中间那一句：
  ```
  ... big round blue eyes, waving one hand cheerfully, slight three-quarter turn, soft pastel palette of mint blue and cream ...
  ```
  同 seed 换姿势 → 同一个角色换动作；换 seed 同文案 → 还是同一个角色（发型、兜帽、配色都对得上）。**身份来自文字，不是来自 seed。**
- 失败模式：`hugging a small whale plush` 会让手臂和玩偶糊成一团（两次复现）。要拿道具就单独生成道具再拼。
- 非 Q 版、正比例的少女立绘同样成立：
  ```
  Anime illustration of a girl in a whale hoodie sitting on a rock at the seaside, soft pastel palette, gentle light
  ```
  1024²，32s。加 `--lora krea2_darkbrush.safetensors:1.0` 会变成水彩油画质感、调子压暗、配色也变（40s）——想换风格质感时用它，别指望它保持原配色。

## 9. 宽幅 banner（含贴纸风角色）

```
A wide app banner with a soft pastel watercolor background of pale peach and mint clouds. On the right side a cute chibi whale character floats happily among bubbles. On the left third large bold dark navy Chinese text reads '鲸鲸的后花园', below it smaller text reads '每天收集一只小鲸鱼'. Flat vector illustration with thick outlines, plenty of clean space, no other text
```

- 1536×640，30s。布局、角色、留白全对；**中文标题被画成近字**（`鲽鲽的后莪园`）。把中文换拉丁文案，或让 banner 留空后期叠字。

## 10. 透明底素材

```
Flat vector mascot sticker of a friendly blue whale, thick dark navy outline, blue body with white belly, simple geometric shapes, on a completely flat solid chroma green background (hex 00FF00), even lighting, no shadow, no text
```

- 1024²，30s。模型给的绿不是纯 `#00FF00`（实测约 `#29BE48`），所以 key 时按四边中位色自适应，不要写死色值。
- `python scripts/key.py in.png out.png` → RGBA，边缘去绿溢，输出浅/深/粉三联预览。默认阈值 `lo=36 hi=96`，边缘发绿就调高 `lo`。
- 主体本身偏绿/偏青（比如薄荷色吉祥物）就换 magenta 底：同样实测可用，边缘略更干净。

## 11. 场景插画 / 讲概念的配图

一条长 prompt 可以同时锁定：视角、构图位置、材质、调子、若干具体物件。实测 68 词 14 个元素全部落地（含最后一句"右下角靠墙放一把红色小伞"）：

```
A cozy reading nook in a small attic room, warm afternoon light through a round window, a worn armchair with a knitted blanket, a stack of books on a wooden stool, dust motes in the sunbeam, soft painterly illustration, muted warm palette, quiet and inviting atmosphere, gentle shadows, visible brush texture, careful composition with the window at the upper left and the chair facing it, a small whale plush tucked into the corner of the armchair, a striped mug of tea on the floor beside the stool, a folded newspaper, a hanging plant in the upper right corner, an old rug with faded geometric pattern, three framed prints on the slanted wall, a wooden ladder leaning at the far right, in the extreme lower right corner a tiny red umbrella leaning against the wall
```

- 1024²，32s。长 prompt 仍然好用，但控制在 300 词以内。
