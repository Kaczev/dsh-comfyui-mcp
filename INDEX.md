# 项目导航

ComfyUI 的 DSH 插件封装；业务工具由上游 MCP 提供。

- [README.md](README.md)：安装、技能启用方式与运行限制。
- [index.mjs](index.mjs)：配置、状态查询端点与条件工具注册。
- [lazy-tools.mjs](lazy-tools.mjs)：从成功的技能加载或已提交的斜杠调用识别当前代理。
- [client.js](client.js)：插件详情页和官方配置表单。
- [runtime.mjs](runtime.mjs)、[configured-runtime.mjs](configured-runtime.mjs)：进程生命周期与配置切换。
- [tool-router.mjs](tool-router.mjs)：三入口 schema、只读发现路由和旧调用兼容；[回归测试](test/tool-router.test.mjs)。
- [upstream.mjs](upstream.mjs)：首次调用时连接上游 `--compact` MCP，按配置复用连接。独立的 [stdio 适配器](server.mjs) 与 DSH 插件复用这段逻辑。
- [design/plugin.html](design/plugin.html)：0.1.8 配置页的历史视觉参考；当前默认值以插件配置为准。
- [test/](test/)：Node 测试；运行 `npm test`。
- [test/client-locale.test.mjs](test/client-locale.test.mjs)：语言资源与元数据共存、重复挂载及清理回归。
- [assets/icon-prompt.txt](assets/icon-prompt.txt)：Krea 图标生成参数。

- [comfyui](skills/comfyui/SKILL.md)：选定 ComfyUI 后探测服务、核对工作流、提交任务与验证输出。
- [krea2-image-prompt](skills/krea2-image-prompt/SKILL.md)：选定 Krea 2 Turbo 后使用的模型配方、工作流及历史实测。

- [packaged-skills.mjs](packaged-skills.mjs)：随包技能解析、注册与卸载清理；[回归测试](test/packaged-skills.test.mjs)。
- [docs/release-v0.1.9.md](docs/release-v0.1.9.md)：随包技能归属、迁移与本次验证范围。

- [0.1.10 release notes](docs/release-v0.1.10.md): English skill documentation and verification scope.
- [0.2.0 发布说明](docs/release-v0.2.0.md)：技能入口接管工具，首次调用再连接上游。
- [0.2.1 发布说明](docs/release-v0.2.1.md)：ComfyUI 技能补充不启动检查、选图和一次提交后的核对。
