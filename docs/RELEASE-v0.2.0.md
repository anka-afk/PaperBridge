# PaperBridge 0.2.0

首个 Windows 预发布版本，将 Zotero 阅读、Codex 问答和 Obsidian 主笔记连接起来。

每篇论文配对一份 Zotero 子笔记，支持小节级双向同步、不同小节的修改合并、同小节冲突副本、三种阅读模板和自动分类。

适用于 Windows x64、Zotero 10（已在 10.0.6 验证），需要自行安装并登录 Codex 和 Obsidian。

下载 `PaperBridge-Setup.exe` 后选择本机路径，再按说明安装三个 Zotero 插件。已有 Codex 侧栏可以保留。完整源码包可以离线构建，`SHA256SUMS.txt` 用于核对下载文件。

## 当前限制

- 只支持个人文库，每篇论文一份主笔记；已有的其他笔记不会自动合并。
- 没有跨电脑编辑锁，切换电脑前后要完成 Zotero 和知识库同步。
- 尚未提供自动在线更新和安装包代码签名。
