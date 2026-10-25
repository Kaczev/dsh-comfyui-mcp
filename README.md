# dsh-comfyui-mcp

将 ComfyUI 接入 DSH，使用 DSH 官方 `@deepseek-ai/dsh-mcp-client` 注册 MCP 工具，并提供连接测试和可选的本地按需启动。

## 上游与职责

ComfyUI 工具来自 [artokun/comfyui-mcp](https://github.com/artokun/comfyui-mcp)，本包固定使用 **0.52.206**。上游负责工具发现、工作流执行、图片读取等业务能力。本包负责 DSH 插件封装、配置界面、连接探测及自有进程的生命周期；不将上游实现视为本项目原创。

## 安装与配置

需要 Node.js 22 及兼容的 DSH（当前声明为 `>=0.2.1-rc.3 <0.3.0`）。通过 DSH 插件管理器安装本地目录或打包后的 `.tgz`，然后启用组件。不要另外添加同名 MCP 桥。

打开「插件 → ComfyUI MCP」，点击「测试连接」探测现有服务。在同页下方的「运行配置」表单设置：

- `url`：默认 `http://127.0.0.1:8188`，支持已有 HTTP(S) 地址，不允许 URL 内嵌凭据。
- `autoStart`：默认关闭；开启后首次执行业务工具才允许启动本地 ComfyUI。
- `comfyuiDir`：包含 `main.py` 的绝对目录。
- `pythonPath`：已安装依赖的 Python 可执行文件绝对路径。
- `launchArgs`：额外参数数组，默认空。支持显存/精度选项、`--disable-xformers`、`--use-pytorch-cross-attention`、`--preview-method` 等白名单选项；拒绝监听地址、端口覆盖与参数缩写。
- `startupTimeoutMs`：默认 120000，范围 1000–600000 毫秒。

本地启动仅接受回环 HTTP 地址，固定禁用浏览器自动打开、自定义节点和 API 节点。已有远程实例不受这些启动参数影响。模型与 Python 环境需由用户事先准备，本插件不自动安装或更新它们。

## 使用

`list_tools` 和 `describe_tool` 只发现工具，不启动 ComfyUI 或加载模型。先读取工具 schema，再用 `call_tool` 执行业务工具。原生 Krea2 API 工作流使用上游 `enqueue_workflow`；模型名称和工作流须匹配现有 ComfyUI 安装。结果保留上游 MCP 内容，包括图片和本地保存路径。

`runtime` 提供 `status`、`test`、`start`、`stop`、`free`。状态查询和连接测试不启动进程。生成完成后使用 `stop` 释放插件自有进程；`free` 请求当前连接实例卸载模型，可能影响该实例的其他使用者。

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

DSH 提供的 peer 包需在插件运行环境中可解析。安装发布包时由 DSH 管理依赖；任何待运行的依赖构建脚本都应先取得用户许可。包采用文件白名单，不包含模型、Python、工作流、生成图片、凭据或个人配置。图标是原创 SVG，设计提示词保存在 `assets/icon-prompt.txt`，使用 DSH 的 `./icon` 导出。

## 限制与安全

上游依赖审计发现 `undici` 的已知高风险通告；本次保留用户指定的上游版本，未自动升级。仅连接受信任的 ComfyUI 服务；回环默认值不能替代服务端访问控制。上游部分工具可以管理文件、模型或依赖，执行安装/更新类操作前必须取得用户明确许可。

当前测试覆盖配置校验、不启动的探测、外部进程保护、并发启动与自有进程清理。实际 DSH 安装、页面、Krea2 生成及卸载验证进度另见交付说明；单元测试不能代替端到端验证。

## 许可证

本项目采用 MIT。上游 `comfyui-mcp` 为 MIT，版权归 Arthur R. Longbottom (artokun)。参见 `THIRD_PARTY_NOTICES.md`。依赖通过包管理器安装，不将上游依赖代码或模型整合进发布包；各依赖许可证继续适用。
