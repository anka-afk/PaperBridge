# Third-party components

PaperBridge 自有源码使用 MIT 许可证。独立第三方组件保留原许可证，不因打包而变为 MIT。

| 组件 | 固定版本 | 许可 | 来源 |
| --- | --- | --- | --- |
| Codex for Zotero | 2026.299.1 | MIT | https://github.com/RTLiang/zotero-codex |
| Better Notes | 3.3.3 | AGPL-3.0-or-later | https://github.com/windingwind/zotero-better-notes |
| Node.js (Windows x64) | 24.19.0 | MIT 及内含第三方许可 | https://nodejs.org/ |

安装包与完整源码包附带许可证、Better Notes v3.3.3 源码归档和固定版本插件。Git 克隆后可通过 prepare-dependencies.py 按 dependencies.lock.json 下载并核对 SHA-256。PaperBridge 通过独立 Better Notes 插件的公开格式转换接口工作，未把其实现复制到自有源码中。

Codex、Zotero 和 Obsidian 主程序不随安装包分发。使用者须自行安装并按其条款登录使用。
