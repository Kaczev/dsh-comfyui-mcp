# 实测记录（2026-10-25，RTX 5060 Laptop 8GB）

这一轮是"从零摸清本机 Krea 2 Turbo 脾气"的记录。结论已进 SKILL.md，这里留过程与证据，避免以后重复踩。

## 环境

- ComfyUI 0.30.2，`--disable-all-custom-nodes --disable-api-nodes`，`127.0.0.1:8188`。
- 模型：`krea2_turbo_fp8_scaled` + `qwen3vl_4b_fp8_scaled`(type=krea2) + `qwen_image_vae`。无 checkpoint。
- 自建节点图跑通；`EmptySD3LatentImage` 正常出图。首图含模型加载约 26–29s，之后 512² 约 12s。

## 跑过的对比

| # | 目的 | 输入 | 结果 |
| --- | --- | --- | --- |
| 1 | 管线可用性 | 苹果静物 768² | 正常，画质好 |
| 2 | 矢量图标基线 | 蓝鲸图标 1024² | 干净两色矢量，`app icon` 未加方底（1024² 时） |
| 3 | 文字渲染 | 卡片 UI，标题/副标题/按钮全部加引号 | **全部正确**，排版也漂亮 |
| 4 | grounded DSL | `t[160,180,700,280]"Good morning"` 等 | 布局大致对，但**方括号原样画进图里** → stock 模型不支持该语法，弃用 |
| 5 | 不引号的文字 | "四行消息列表，每行有名字和预览" | 名字变 `Paties/Baties`，预览变 `oneetirles: olinlslic:`，背景浮出半透明字母纹理 |
| 6 | cfg 提升 | 图标 cfg 1.5 / 12 步 | 81s vs 29s，画面无提升 → 保持 cfg 1 / 8 步 |
| 7 | 2K | 图标 2048² | 140s，出图正常，但自动加了圆角方底（squircle） |
| 8 | 512² 够不够 | 图标 512² | 12s，质量够挑图 |
| 9 | 透明底 | 蓝鲸 on chroma green / magenta | 两版都能 key 干净；绿的实测色约 `#29BE48`，magenta 约 `#E60E9A` |
| 10 | 一致性：同 seed 换姿势 | 角色块 + seed 12345，加"waving one hand" | 同一个角色，只有动作变 |
| 11 | 一致性：换 seed 同文案 | 角色块 + seed 99999 | 仍是同一个角色（发型/兜帽/配色一致） |
| 12 | img2img | 上一张 + denoise 0.45 + 换姿势提示 | 只微调了表情与细节，**没有换姿势**，并带进淡纹理伪影 |
| 13 | 图标家族 | 2×2 网格四图标 | 风格统一，间距大小不均，裁切需补 padding |
| 14 | 留白背景 | 1536×1024，左侧留白叠字 | 留白精准，主体在右上 |
| 15 | 无缝图案 | 鲸鱼+泡泡平铺 | 规整网格，可作图案但接缝不保证 |
| 16 | 组件表 | 8 个 UI 组件 | 八件套齐、风格统一，但尺寸偏大；未引号的"计数徽章"出现伪字 `7` |
| 17 | 满分辨率 UI | 1280×800 设置面板，引号文案 | **所有字符串正确**，30s |
| 18 | 满分辨率 UI | 1920×1080 仪表盘，部分文案未引号 | 标题/侧栏/轴标签全变伪文字 → 引号覆盖率决定可读性 |
| 19 | 中文 | 1920×1080 登录页 `欢迎回来/邮箱/密码/登录` | `欢迎回来` 正确；`邮箱`→`箝杨`，`密码`→`答留`，`登录`→`设各` |
| 20 | 中文 | 1536×640 banner `鲸鲸的后花园` | → `鲽鲽的后莪园`（近字替换） |
| 21 | 长 prompt | 68 词 / 14 元素读书角 | 全部落地，含最后一个元素（红色小伞） |
| 22 | 风格 LoRA | `krea2_darkbrush:1.0` | 水彩油画质感 + 压暗，配色改变，无需触发词 |
| 23 | MCP 路径 | `enqueue_workflow action:"enqueue"` 传 graph | 返回 prompt_id，512² 11.6s，`get_history` 取到图 |

## 耗时基线

512² 12s · 768² 26s（含首载）· 1024² 30s · 1280×800 30s · 1536×640 30s · 1536×768 33s · 1024×1536 45s · 1920×1080 60s · 2048² 140s

## 已知不可用

- `generate_image`（走 CheckpointLoaderSimple）——本机无 checkpoint。
- `remove_background` / `upscale` / `controlnet` / `ip_adapter`——依赖被禁用的自定义节点，且无 upscale_models。
- grounded DSL（bbox 版训练格式）——在 stock Turbo 上会泄漏成文字。

## 还没试过的

- `redcraftKREA2RedMix_krea2Edition.safetensors`（第二个 diffusion 模型）。
- 双 pass 细节增强（上游 `krea2-combo` pack 的思路，需 KJNodes，本机被禁）。
- img2img denoise ≥0.6 的实际行为（只测到 0.45）。
- 采样器替换（`euler`/`dpmpp_2m`）是否改变质感。
