---
name: krea2-image-prompt
description: 用本机 Krea 2 Turbo 出位图素材的提示词指南与流水线——UI 图标/背景/空状态/角色/纹理/无缝图案，含透明底抠色、角色一致性、故障速查
---

# 本机 Krea 2 出图

要画任何位图素材之前先读这一页：图标、背景、插画、角色、纹理、占位图都算。

## 机器事实（2026-10 在本机实测）

- 模型 `krea2_turbo_fp8_scaled.safetensors` + 编码器 `qwen3vl_4b_fp8_scaled.safetensors`（`CLIPLoader type=krea2`）+ `qwen_image_vae.safetensors`。**本机没有任何 checkpoint。**
- ComfyUI 以 `--disable-all-custom-nodes` 启动：KJNodes / RMBG / upscale / controlnet / ip-adapter 全部不可用，`generate_image` 的 image 动作会因缺 checkpoint 失败。必须自建节点图：`UNETLoader → CLIPLoader → VAELoader → CLIPTextEncode ×2 → EmptySD3LatentImage → KSampler → VAEDecode → SaveImage`，完整 JSON 见 `reference/workflow.json`。
- 8GB VRAM 够用；2K 不报错但慢 4.7 倍。
- 风格 LoRA：`krea2_darkbrush.safetensors`，strength 1.0，**不需要触发词**，效果是把画面推向水彩/油画质感并整体压暗，同时会改人物配色。`krea2_znsfw_V2` 是 NSFW 模型，与素材工作无关，不用。

## 采样参数（别乱调）

| 项 | 值 | 依据 |
| --- | --- | --- |
| steps | 8 | 蒸馏模型；加到 12 步没有可见收益 |
| cfg | 1.0 | 1.5+12 步实测耗时 2.8 倍、画面无提升；cfg=1 时引导公式退化为纯条件预测，**负向提示词在数学上不参与计算，别写** |
| sampler / scheduler | `er_sde` / `simple` | 上游 verified 组合 |
| seed | 写死具体数字 | 复现与一致性都靠它 |

| 尺寸 | 实测耗时 |
| --- | --- |
| 512×512 | 12s |
| 768×768 | 26s |
| 1024×1024 | 30s |
| 1024×1536 | 45s |
| 1280×800 | 30s |
| 1536×640 / 1536×768 | 30–33s |
| 1920×1080 | 60s |
| 2048×2048 | 140s |

先用 512² 或 1024² 试构图，定了再按目标尺寸重跑。同 prompt 同 seed 换尺寸，结果不保证一致，构图会漂。

## 硬规则

1. **要出现在图里的文字一律放进英文双引号**，越短越好（1–4 词）。实测 1024²、1280×800、1920×1080 下拉丁字母都清晰正确：`text reads "Preferences"`。
2. **不打算写字就写 `no text`**。任何"有文字形状但没指定内容"的区域都会被填成伪文字：实测侧栏被编成 `Revanto / Reparls`，图表轴变成 `lor / 1ar / lmo`，还会在背景留下半透明字母纹理。
3. **中文别指望**。四字常见词偶尔对（`欢迎回来` 对了），稍长就变近字：`登录`→`设各`，`鲸鲸的后花园`→`鲽鲽的后莪园`。中文 UI 一律走：生成无字留白版 → 真文字在 HTML/CSS 里叠。
4. 只写**看得见的东西**，按这个顺序：主体 → 外观细节（颜色/材质/轮廓/线宽）→ 构图与视角 → 风格媒介 → 光与色 → 背景与留白 → `no text`。Krea 2 用 Qwen3-VL 编码器，按自然语言理解，结尾的"背景 + no text"最容易生效。
5. **一图一件事**。要四个图标就说"2×2 网格、同风格、等距留白"，别指望一次给出十二个一致组件。
6. **别用 grounded DSL**：`t[160,180,700,280]"..."` 那套是 bbox 微调版的训练格式，在 stock Turbo 上会把方括号原样画进图里（实测确实泄漏成可见文字）。
7. `app icon` 会自动加圆角方底（squircle）。要出血或无缝贴图改用 `flat vector illustration` / `sticker on a solid ... background`。
8. 提示词控制在 300 词以内。实测 68 词、14 个元素的长 prompt 全部落地（含最后一个元素），但编码窗口有限（社区记录约 512 token），超了会从尾部截断——而尾部通常正是最关键的 `no text`。

## 六段骨架

```
<主体一句话>, <外观细节>, <构图与视角>, <风格媒介>, <光与色>, <背景与留白>, no text
```

例：

```
Flat vector app icon of a friendly blue whale, thick rounded dark navy outlines, two flat colors plus white belly, centered with generous padding, solid off-white background, no text
```

## 三条调用路径

起手检查：ComfyUI 没在 8188 上响应就先 `runtime start`（MCP），或直接启动 `C:\Users\Kaczev\LocalAI\ComfyUI-aki-v3.2`。脚本默认连 `http://127.0.0.1:8188`，可用 `COMFY_URL` 覆盖；脚本都在本 skill 目录的 `scripts/` 下，用绝对路径或先 cd 进去。

1. **MCP（正式路径）**：`enqueue_workflow action:"enqueue"` 传 API 格式 graph（`reference/workflow.json`），再 `get_history action:"list"` 取图。已验证能拿到 prompt_id 并出图。
2. **脚本快跑（本机迭代最快）**：
   ```
   python scripts/krea.py --prompt "..." --w 1024 --h 1024 --seed 12345
   ```
   支持 `--lora krea2_darkbrush.safetensors:1.0`、`--init 图.png --denoise 0.45`（img2img）、`--out DIR`。批量跑：`python scripts/batch.py jobs.json`。
3. **透明底**：prompt 写 `on a completely flat solid chroma green background, even lighting, no shadow`，生成后
   ```
   python scripts/key.py in.png out.png
   ```
   得到 RGBA + 浅/深/粉三联预览。主体本身偏绿就换 magenta 底。

## 一致性

- **角色**：把一段"角色块"逐字复用（发型 / 眼睛 / 服装 / 配色 / 画风），换 seed、换姿势角色仍是同一个（实测同 seed 换动作、不同 seed 同文案都稳）。姿势用动词替换，别重写角色块。
- **角色 + 持物**：Q 版全身像抱玩偶会把手臂和玩偶糊成一团（两次复现）。道具单独生成再拼。
- **img2img**：denoise 0.45 只做细节微调，且会带进淡纹理伪影；要换姿势直接 txt2img 更干净。
- **图标家族**：一次出 2×2 网格再裁切，比四张单图风格更统一。

## 素材配方

图标 / 图标家族 / hero 背景 / 空状态 / 无缝图案 / 组件表 / 整屏 mockup / 角色立绘 / 水彩场景 / 材质纹理 —— 每条都有可直接抄的 prompt 和实测结论：`reference/recipes.md`。

跑过什么、耗时、哪些失败：`reference/experiments.md`。

## 故障速查

| 现象 | 原因 | 对策 |
| --- | --- | --- |
| 文字乱码、伪字母 | 没加引号，或用了中文 | 英文引号写死 ≤4 词；中文后期叠 |
| 背景浮出半透明字母纹理 | 提示词描述了"有很多文字的界面" | 删掉文字描述，加 `no text` |
| 手 / 玩偶糊成一团 | Q 版全身像 + 持物 | 去掉持物，或改成"手放在身侧" |
| 主体被圆角方底包住 | 用了 `app icon` | 改 `sticker` / `illustration on solid background` |
| 元素都出现但都糊 | 词太多，主体不明确 | 先一句话定主体，512² 试构图 |
| 抠图边缘发绿 | 主体本身偏绿 | 换 magenta 底再 key |

## 还能这么用

场景插画、讲概念的配图、演示封面、贴纸与表情包、头像、桌宠立绘、角色三视图与表情表、漫画分镜、等距小地图、徽章成就、材质球（玻璃/金属/纸）、渐变与噪点底图、社交分享卡背景、404 与空状态插画、骨架屏占位图、贺卡海报。凡是"位图素材"都能套这套流程；真正的文案与排版回到 HTML/CSS。
