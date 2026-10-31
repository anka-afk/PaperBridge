# PaperBridge 0.3.2

HTML 阅读页划选原文后，Codex 有时只收到论文信息，没有收到选中的句子；关闭选区弹窗后，选区也可能丢失。这版新增独立的 Reader Compatibility 0.1.0，解决这两个问题。

现在单段选中就能提问，不用点 Add；需要固定多段内容时仍可以使用 Add。

修复不再内嵌到 Codex 官方插件中。官方 XPI 和更新地址保持原样，兼容插件会在侧栏启动或替换后重新挂接。如果官方以后更改内部接口，补丁可能需要更新，可以在“工具 → 阅读兼容补丁状态…”中检查。

## 安装与升级

- 新电脑：运行 `PaperBridge-Setup.exe`，选择知识库和 Codex 路径。安装器会准备 PaperBridge 0.3.2、Better Notes 3.3.3、Codex 官方侧栏和 Reader Compatibility 0.1.0，按提示在 Zotero 中安装并重启。
- 已有官方侧栏和 Better Notes：更新 `paperbridge-0.3.2.xpi`，再安装 `paperbridge-reader-compat-0.1.0.xpi`，官方侧栏不用重装。
- 曾安装定制侧栏 `2026.299.1.1 / 2026.299.1.2`：除上面两个插件外，还要安装 `codex-for-zotero-official.xpi`，恢复官方更新渠道。安装目录里的同一文件名为 `codex-for-zotero.xpi`，不用先卸载侧栏或删除账号设置。

配置助手升级时会归档安装目录里的旧版自有 XPI 和旧定制侧栏包，避免多个旧安装包混在一起。它不会直接修改 Zotero 资料目录中已经安装的插件。

内附官方侧栏的固定版本为 2026.299.1。保留官方更新渠道不代表兼容所有后续版本；PaperBridge 和 Reader Compatibility 自身仍采用手动更新。

## 文件

`PaperBridge-Source.zip` 包含源码、固定版本构建依赖和第三方许可证。独立补丁源码在 `reader-compat/`，可以用 `python reader_compat.py` 单独打包。下载文件的 SHA-256 见 `SHA256SUMS.txt`。

本版包含 0.3.1 的同步标题和批注修复，适用于 Windows x64、Zotero 10（已在 10.0.6 验证）。这是预发布版本，安装包未提供代码签名。
