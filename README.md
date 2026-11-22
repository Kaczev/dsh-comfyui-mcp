# dsh-comfyui-mcp

将 ComfyUI 接入 DSH，使用 DSH 官方 `@deepseek-ai/dsh-mcp-client` 注册 MCP 工具，并提供连接测试和可选的本地按需启动。

## 上游与职责

ComfyUI 工具来自 [artokun/comfyui-mcp](https://github.com/artokun/comfyui-mcp)，本包固定使用 **0.52.206**。上游负责工具发现、工作流执行、图片读取等业务能力。本包负责 DSH 插件封装、配置界面、连接探测及自有进程的生命周期；不将上游实现视为本项目原创。

## 安装与配置

本版需要 Node.js 22 和支持条件工具注册的 DSH（`>=0.2.2-rc.5 <0.3.0`）。在 DSH 插件管理器中安装支持该技能入口的 `dsh-comfyui-mcp`，然后启用组件。也支持安装本地目录或 `.tgz`。不要另外添加同名 MCP 桥。

打开「插件 → ComfyUI MCP」，点击「测试连接」探测现有服务。在同页下方的「运行配置」表单设置：

- `url`：默认 `http://127.0.0.1:8188`，支持已有 HTTP(S) 地址，不允许 URL 内嵌凭据。
- `autoStart`：默认关闭；开启后，执行 `runtime start` 或通过 `call_tool` 调用上游工具时，插件可在服务离线且本地启动条件满足时启动 ComfyUI。
- `comfyuiDir`：包含 `main.py` 的绝对目录。
- `pythonPath`：已安装依赖的 Python 可执行文件绝对路径。
- `launchArgs`：额外参数数组，默认空。支持显存/精度选项、`--disable-xformers`、`--use-pytorch-cross-attention`、`--preview-method` 等白名单选项；拒绝监听地址、端口覆盖与参数缩写。
- `startupTimeoutMs`：默认 120000，范围 1000–600000 毫秒。

本地启动仅接受回环 HTTP 地址，固定禁用浏览器自动打开、自定义节点和 API 节点。已有远程实例不受这些启动参数影响。模型与 Python 环境需由用户事先准备，本插件不自动安装或更新它们。

## 工具入口

新代理的工具列表中没有 ComfyUI 入口。需要使用时，用户可以输入 `/comfyui`，或由代理调用 `skill` 并传入 `{"name":"comfyui"}`。成功加载随包技能后，该代理随后可使用预设允许的 `mcp__comfyui__runtime`、`mcp__comfyui__discover` 和 `mcp__comfyui__call_tool`。下文省略公共前缀。

子代理和重建的代理需自行加载技能。只加载 Krea 配方不会启用工具。旧设置 `lazyTools` 已停止生效，可以从自管配置中移除。加载技能不会启动服务或加载模型，`autoStart` 仍单独控制进程启动。

原始 MCP 请求仍可使用旧名称 `list_tools`、`describe_tool` 重放发现调用；服务器不再把它们列为单独入口。

## 使用

| 目的 | 调用 | 运行影响 |
| --- | --- | --- |
| 检查服务 | `runtime`：`{"action":"status"}` 或 `{"action":"test"}` | 探测配置地址，不启动 ComfyUI。 |
| 查上游目录和参数 | `discover`：`{"search":"workflow"}`；再单独传 `{"name":"enqueue_workflow"}` | 不启动 ComfyUI 或加载模型。查到工具不代表目标实例已安装所需模型和节点。 |
| 执行上游工具 | `call_tool`：传 `name` 和符合该工具 schema 的 `args` | 每次调用都会先确认服务可用，包括查询历史；服务离线且允许本地按需启动时，可能启动进程。 |

提交前核对 API 工作流的节点、模型文件名、输入和保存位置。用 `enqueue_workflow` 提交后保留 `prompt_id`，按该 ID 查历史并取回图片。超时时先查原任务，不要重复排队。拿到队列号或服务器路径不等于已经得到本地图片；交付前应打开实际输出，核对内容、尺寸和格式。

`runtime start` 用于有意启动；`runtime stop` 只停止插件自有进程。`runtime free` 会请求当前实例卸载模型；共享实例上不要未经许可释放显存。

## 模型与工作流的决定权

本插件不指定默认模型。提交现有工作流时，模型由图中的节点决定；调用上游的快捷出图工具时，上游会自行选择 checkpoint。四种调用方式的区别如下：

- `enqueue_workflow`（`action:"enqueue"`）：由调用方提交的 API 工作流决定，`UNETLoader` / `CLIPLoader` / `VAELoader` 里写什么文件就加载什么；seed 按原值使用，不随机化。
- `generate_image`（`action:"image"`）：由上游自建 txt2img 图并**自动挑选 checkpoint**——读 safetensors 头部判断是否含文本编码器，跳过视频类模型；其余参数来自默认值（配置文件 → `COMFYUI_DEFAULT_*` 环境变量 → 运行时 `get_defaults`，优先级递增）。没有可用 checkpoint 时会直接报错。Krea 2 是 UNet + CLIP + VAE 三件套、不是 checkpoint 模型，因此**不走这条路径**。
- `enqueue_workflow`（`action:"run_template"`）：由 pack 内的 `workflow.json` 决定，模型名是写死的常量；pack 依赖的自定义节点若被启动参数禁用则无法执行。
- `action:"rerun"`：复用历史中的工作流，seed 默认重新随机。

默认值配置文件位于 `%XDG_CONFIG_HOME%`（缺省 `~/.config`）下的 `comfyui-mcp/config.json`。

## 随包技能

- [comfyui](skills/comfyui/SKILL.md)：任务明确使用 ComfyUI 或已经选定 ComfyUI 工作流时，指导代理检查服务、读取 schema、提交任务并验证输出。升级时请将原来的 `/visual-asset-production` 改为 `/comfyui`。
- [krea2-image-prompt](skills/krea2-image-prompt/SKILL.md)：仅在明确要求或已经选定 Krea 2 Turbo 时使用。包含该模型的提示词配方、原生节点工作流、采样对照和历史耗时；普通图标、背景、角色或纹理需求本身不会选定 Krea。

插件启用时注册两个技能，禁用或卸载时撤销自己的注册；正文通过 `skill` 按需读取，也可用 `/comfyui` 或 `/krea2-image-prompt` 显式调用。资源路径以包内技能目录为准。用户已有的同名技能遵循宿主优先级，插件不会改写它们。迁移旧副本时，先核对来源，需要备份的副本可移出技能扫描目录。

### Krea 2 Turbo 资源

```
skills/krea2-image-prompt/
├── SKILL.md                  # 入口：机器事实、采样参数、提示词硬规则、六段骨架、调用路径、故障速查
├── reference/recipes.md      # 分类配方（图标/背景/空状态/角色/图案/UI 整屏…）与实测结论
├── reference/experiments.md  # 对比实验记录与耗时基线
├── reference/workflow.json   # 可直接提交的 API 工作流（原生节点，无自定义节点依赖）
└── scripts/                  # krea.py 出图、batch.py 批量、key.py 色键抠透明底
```

**直接使用脚本。** 先确认 `COMFY_URL` 指向预期服务；将 `OUTPUT_DIR` 换成任务允许写入的新目录。

```sh
cd skills/krea2-image-prompt
python scripts/krea.py --prompt "a flat two-color vector icon of a whale" --w 1024 --h 1024 --seed 12345 --out OUTPUT_DIR
python scripts/key.py in.png out.png      # 纯色底 → 透明 PNG
```

脚本通过 HTTP 直连 ComfyUI，服务地址取 `COMFY_URL` 环境变量，默认 `http://127.0.0.1:8188`。技能假定本机已备好 `krea2_turbo_fp8_scaled.safetensors`、`qwen3vl_4b_fp8_scaled.safetensors`、`qwen_image_vae.safetensors`，且不依赖任何自定义节点——因此插件按需启动时固定携带的 `--disable-all-custom-nodes` 不影响它。

**与启动方式的关系。** 服务若已由绘世等启动器在 `url` 上运行，插件只探测和连接，启动器里的端口、自定义节点、显存参数全部生效；只有插件**自己**拉起进程时才会追加自己的启动参数。技能里的实测数据来自插件自有启动的精简实例。

技能目录包含在 `package.json` 的 `files` 白名单中，随 npm 包分发；技能中的本机模型参数与实测记录不是新机器的环境保证。

## 禁用、卸载与迁移

通过 DSH 插件管理器禁用、重新启用或卸载。禁用/卸载关闭本插件连接并停止本插件启动的 ComfyUI；不会停止外部进程，也不删除模型、工作流或生成图片。

旧部署迁移时，先停用旧 `mcp-local-comfyui`，再仅删除该条目及其停用覆盖，保留其他配置，然后安装本包。不要让两个 `serverName: comfyui` 桥同时运行。本包不自动改写用户配置。

## 开发与打包

```sh
npm install --ignore-scripts --omit=optional --legacy-peer-deps
npm run build
npm test
npm run pack:check
npm pack
```

DSH 提供的 peer 包需在插件运行环境中可解析。安装发布包时由 DSH 管理依赖；任何待运行的依赖构建脚本都应先取得用户许可。包采用文件白名单，包含技能参考用的 API 工作流与辅助脚本，不包含模型、Python 运行时、生成图片、凭据或个人配置。图标由 Krea 2 Turbo 生成，经 Photoshop 调色、缩放和锐化，再清除四角连通白底并输出 256 × 256 RGBA PNG；SVG 内嵌同一位图；设计提示词保存在 `assets/icon-prompt.txt`，使用 DSH 的 `./icon` 导出。

## 限制与安全

上游依赖审计发现 `undici` 的已知高风险通告；本次保留用户指定的上游版本，未自动升级。仅连接受信任的 ComfyUI 服务；回环默认值不能替代服务端访问控制。上游部分工具可以管理文件、模型或依赖，执行安装/更新类操作前必须取得用户明确许可。

自动测试覆盖工具可见性、代理预设限制、配置保存、故障状态、配置校验、不启动的探测、外部进程保护、并发启动与自有进程清理。真实进程测试需要按测试文件中的环境变量显式启用，默认跳过。

此前的 DSH Desktop 实测验证过安装、重启后的配置页面、保存参数、本地启动和停止，以及插件管理器的卸载与重装。当时的 Krea 2 工作流生成了 768 × 768 图片，并通过 MCP 取回。上述记录不代表每次修改都重跑了桌面或 GPU 验收；真实运行期间禁用或卸载的完整清理仍待验证。

## 许可证

本项目采用 MIT。上游 `comfyui-mcp` 为 MIT，版权归 Arthur R. Longbottom (artokun)。参见 `THIRD_PARTY_NOTICES.md`。依赖通过包管理器安装，不将上游依赖代码或模型整合进发布包；各依赖许可证继续适用。
