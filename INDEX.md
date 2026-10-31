# 项目导航

ComfyUI 的 DSH 插件封装；业务工具由上游 MCP 提供。

- [README.md](README.md)：安装、懒加载、运行模式与限制。
- [index.mjs](index.mjs)：配置、控制端点与 MCP 桥接入口。
- [lazy-tools.mjs](lazy-tools.mjs)：代理作用域的工具发现开关与清理。
- [client.js](client.js)：插件详情页和官方配置表单。
- [runtime.mjs](runtime.mjs)、[configured-runtime.mjs](configured-runtime.mjs)：进程生命周期与配置切换。
- [tool-router.mjs](tool-router.mjs)：三入口 schema、只读发现路由和旧调用兼容；[回归测试](test/tool-router.test.mjs)。
- [server.mjs](server.mjs)：上游工具代理和运行管理。
- [design/plugin.html](design/plugin.html)：配置页面的可交互视觉参考。
- [test/](test/)：Node 测试；运行 `npm test`。
- [test/client-locale.test.mjs](test/client-locale.test.mjs)：语言资源与元数据共存、重复挂载及清理回归。
- [assets/icon-prompt.txt](assets/icon-prompt.txt)：Krea 图标生成参数。

- [visual-asset-production](skills/visual-asset-production/SKILL.md)：工具选择及目标场景验收。
- [krea2-image-prompt](skills/krea2-image-prompt/SKILL.md)：Krea 工作流及历史实测。
