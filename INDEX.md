# 项目导航

ComfyUI 的 DSH 插件封装；业务工具由上游 MCP 提供。

- [README.md](README.md)：安装、懒加载、运行模式与限制。
- [index.mjs](index.mjs)：配置、控制端点与 MCP 桥接入口。
- [lazy-tools.mjs](lazy-tools.mjs)：代理作用域的工具发现开关与清理。
- [client.js](client.js)：插件详情页和官方配置表单。
- [runtime.mjs](runtime.mjs)、[configured-runtime.mjs](configured-runtime.mjs)：进程生命周期与配置切换。
- [server.mjs](server.mjs)：上游工具代理和运行管理。
- [design/plugin.html](design/plugin.html)：配置页面的可交互视觉参考。
- [test/](test/)：Node 测试；运行 `npm test`。
- [assets/icon-prompt.txt](assets/icon-prompt.txt)：Krea 图标生成参数。
