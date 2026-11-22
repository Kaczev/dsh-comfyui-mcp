# 0.2.0

新代理不再预先看到 ComfyUI 工具。用户执行 `/comfyui`，或当前代理成功加载随包技能 `comfyui` 之后，才会获得 `runtime`、`discover` 和 `call_tool`。只加载 Krea 配方不会打开工具。旧设置 `lazyTools` 不再提前公开工具。

上游 MCP 改到首次需要时以 `--compact` 连接，插件和独立 stdio 适配器共用这段逻辑。要求 DSH `>=0.2.2-rc.5 <0.3.0`。

随包入口由 `visual-asset-production` 改为 `comfyui`。升级时把原来的 `/visual-asset-production` 换成 `/comfyui`。`krea2-image-prompt` 仍只在明确使用 Krea 2 Turbo 时加载。

## 验证

- `npm test`：30 通过，1 跳过（真实本地进程）。
- 未重跑 DSH Desktop 安装、本机 ComfyUI 启动或出图。
