# dsh-comfyui-mcp

将 ComfyUI 接入 DSH，使用 DSH 官方 `@deepseek-ai/dsh-mcp-client` 注册 MCP 工具，并提供连接测试和可选的本地按需启动。

## 上游与职责

ComfyUI 工具来自 [artokun/comfyui-mcp](https://github.com/artokun/comfyui-mcp)，本包固定使用 **0.52.206**。上游负责工具发现、工作流执行、图片读取等业务能力。本包负责 DSH 插件封装、配置界面、连接探测及自有进程的生命周期；不将上游实现视为本项目原创。

## 安装与配置

需要 Node.js 22 及兼容的 DSH（当前声明为 `>=0.2.1-rc.3 <0.3.0`）。在 DSH 插件管理器中安装 `dsh-comfyui-mcp`（指定版本可填 `dsh-comfyui-mcp@0.1.8`），然后启用组件。也支持安装本地目录或 `.tgz`。不要另外添加同名 MCP 桥。

打开「插件 → ComfyUI MCP」，点击「测试连接」探测现有服务。在同页下方的「运行配置」表单设置：

- `url`：默认 `http://127.0.0.1:8188`，支持已有 HTTP(S) 地址，不允许 URL 内嵌凭据。
- `autoStart`：默认关闭；开启后首次执行业务工具才允许启动本地 ComfyUI。
- `comfyuiDir`：包含 `main.py` 的绝对目录。
- `pythonPath`：已安装依赖的 Python 可执行文件绝对路径。
- `launchArgs`：额外参数数组，默认空。支持显存/精度选项、`--disable-xformers`、`--use-pytorch-cross-attention`、`--preview-method` 等白名单选项；拒绝监听地址、端口覆盖与参数缩写。
- `startupTimeoutMs`：默认 120000，范围 1000–600000 毫秒。

本地启动仅接受回环 HTTP 地址，固定禁用浏览器自动打开、自定义节点和 API 节点。已有远程实例不受这些启动参数影响。模型与 Python 环境需由用户事先准备，本插件不自动安装或更新它们。

## 工具懒加载

`lazyTools` 默认开启。代理最初只看到 `comfyui_load_tools`；调用后为当前代理加载 `runtime`、`discover`、`call_tool`。加载不会启动 ComfyUI 或加载模型，其他代理保持自己的加载状态。代理重建后可再次加载。

关闭「工具懒加载」并保存，代理下一步便直接获得这 3 个工具。开关与 `autoStart` 独立：前者控制工具定义何时进入模型上下文，后者控制是否允许启动本地进程。

未加载时只有 1 个入口；加载后保留入口及 3 个工具。0.1.8 将搜索目录和读取参数合并为 `discover`，原来的 `list_tools`、`describe_tool` 不再出现在工具列表中；服务器仍接受旧名称，供已记录的 MCP 调用重放。插件不直接改写模型请求字段，也不承诺固定 token 降幅。

## 使用

用 `discover` 的 `search` / `category` 筛选目录，或只传 `name` 读取指定工具的完整 schema。这两种操作都不启动 ComfyUI 或加载模型。然后用 `call_tool` 执行业务工具。原生 Krea2 API 工作流使用上游 `enqueue_workflow`；模型名称和工作流须匹配现有安装。结果保留上游 MCP 内容，包括图片和保存路径。本机 Krea 2 的提示词、采样参数与工作流见下文 [技能：krea2-image-prompt](#技能krea2-image-prompt)。

`runtime` 提供 `status`、`test`、`start`、`stop`、`free`。状态查询和连接测试不启动进程。开启按需启动且服务未运行时，页面显示「未运行 · 按需启动待命」；执行生图工具时才会启动。生成完成后使用 `stop` 释放插件自有进程；`free` 请求当前连接实例卸载模型，可能影响该实例的其他使用者。

## 模型与工作流的决定权

插件和上游都不替你选模型。四条路径的决定方各不相同：

- `enqueue_workflow`（`action:"enqueue"`）：由调用方提交的 API 工作流决定，`UNETLoader` / `CLIPLoader` / `VAELoader` 里写什么文件就加载什么；seed 按原值使用，不随机化。
- `generate_image`（`action:"image"`）：由上游自建 txt2img 图并**自动挑选 checkpoint**——读 safetensors 头部判断是否含文本编码器，跳过视频类模型；其余参数来自默认值（配置文件 → `COMFYUI_DEFAULT_*` 环境变量 → 运行时 `get_defaults`，优先级递增）。没有可用 checkpoint 时会直接报错。Krea 2 是 UNet + CLIP + VAE 三件套、不是 checkpoint 模型，因此**不走这条路径**。
- `enqueue_workflow`（`action:"run_template"`）：由 pack 内的 `workflow.json` 决定，模型名是写死的常量；pack 依赖的自定义节点若被启动参数禁用则无法执行。
- `action:"rerun"`：复用历史中的工作流，seed 默认重新随机。

默认值配置文件位于 `%XDG_CONFIG_HOME%`（缺省 `~/.config`）下的 `comfyui-mcp/config.json`。

## 技能：krea2-image-prompt

`skills/krea2-image-prompt/` 是一份面向本机 Krea 2 Turbo 的出图技能，教会代理「本机这套模型该怎么写提示词、怎么拼工作流、怎么后处理」，覆盖 UI 图标、背景、空状态、角色立绘、纹理图案等位图素材场景。

```
skills/krea2-image-prompt/
├── SKILL.md                  # 入口：机器事实、采样参数、提示词硬规则、六段骨架、调用路径、故障速查
├── reference/recipes.md      # 分类配方（图标/背景/空状态/角色/图案/UI 整屏…）与实测结论
├── reference/experiments.md  # 对比实验记录与耗时基线
├── reference/workflow.json   # 可直接提交的 API 工作流（原生节点，无自定义节点依赖）
└── scripts/                  # krea.py 出图、batch.py 批量、key.py 色键抠透明底
```

**路径与发现机制。** DSH 的技能发现根有两类：用户级 `$DSH_HOME/skills`（缺省 `~/.dsh/skills`）与项目级 `<工作目录>/.agents/skills`；仓库里的 `skills/` 本身不是发现根。本技能属于「只有这台机器有对应 MCP」的那种，因此装到**用户级全局根**：真身留在 `skills/`（进版本库），`~/.dsh/skills/krea2-image-prompt` 是指向它的 **Windows 目录联结点（junction）**——单一副本，任意项目都能用，也不占用跨工具的 `~/.agents`。克隆本仓库到新机器、或仓库改名搬家后联结点失效，重建：

```powershell
New-Item -ItemType Junction -Path "$HOME\.dsh\skills\krea2-image-prompt" -Target "<仓库路径>\skills\krea2-image-prompt"
```

**触发方式。** 任务涉及「画图标 / 画背景 / 生成角色素材 / 做纹理」时自动加载；也可用 `skill` 工具或 `/krea2-image-prompt` 显式调用。

**直接使用脚本。**

```sh
cd skills/krea2-image-prompt
python scripts/krea.py --prompt "a flat two-color vector icon of a whale" --w 1024 --h 1024
python scripts/key.py in.png out.png      # 纯色底 → 透明 PNG
```

脚本通过 HTTP 直连 ComfyUI，服务地址取 `COMFY_URL` 环境变量，默认 `http://127.0.0.1:8188`。技能假定本机已备好 `krea2_turbo_fp8_scaled.safetensors`、`qwen3vl_4b_fp8_scaled.safetensors`、`qwen_image_vae.safetensors`，且不依赖任何自定义节点——因此插件按需启动时固定携带的 `--disable-all-custom-nodes` 不影响它。

**与启动方式的关系。** 服务若已由绘世等启动器在 `url` 上运行，插件只探测和连接，启动器里的端口、自定义节点、显存参数全部生效；只有插件**自己**拉起进程时才会追加自己的启动参数。技能里的实测数据来自插件自有启动的精简实例。

技能目录属于仓库内资产，不在 `package.json` 的 `files` 白名单中，因此不随 npm 包分发。

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

DSH 提供的 peer 包需在插件运行环境中可解析。安装发布包时由 DSH 管理依赖；任何待运行的依赖构建脚本都应先取得用户许可。包采用文件白名单，不包含模型、Python、工作流、生成图片、凭据或个人配置。图标由 Krea 2 Turbo 生成，经 Photoshop 调色、缩放和锐化，再清除四角连通白底并输出 256 × 256 RGBA PNG；SVG 内嵌同一位图；设计提示词保存在 `assets/icon-prompt.txt`，使用 DSH 的 `./icon` 导出。

## 限制与安全

上游依赖审计发现 `undici` 的已知高风险通告；本次保留用户指定的上游版本，未自动升级。仅连接受信任的 ComfyUI 服务；回环默认值不能替代服务端访问控制。上游部分工具可以管理文件、模型或依赖，执行安装/更新类操作前必须取得用户明确许可。

自动测试覆盖配置保存、待命与故障状态、配置校验、不启动的探测、外部进程保护、并发启动与自有进程清理。已在 DSH Desktop 验证安装、重启后的配置页面、保存参数、本地启动及停止；Krea2 768 × 768 工作流执行成功，并通过 MCP 取回图片。插件管理器的卸载与重装操作已成功；真实运行期间禁用/卸载的完整清理验收尚未完成。真实进程测试需按测试文件中的环境变量显式启用，默认跳过。

## 许可证

本项目采用 MIT。上游 `comfyui-mcp` 为 MIT，版权归 Arthur R. Longbottom (artokun)。参见 `THIRD_PARTY_NOTICES.md`。依赖通过包管理器安装，不将上游依赖代码或模型整合进发布包；各依赖许可证继续适用。
