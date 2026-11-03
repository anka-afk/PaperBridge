# PaperBridge 0.4.0

普通条目笔记和独立笔记现在会自动与 Obsidian 配对，不再只同步 PaperBridge 生成的主笔记。无需逐篇导出，父条目也不需要 PDF。

- 启动时补齐个人文库中的已有笔记，运行时自动发现新增笔记。
- 普通笔记使用 Better Notes 的整篇双向同步；主笔记保留 PaperBridge 的分区同步。
- 复用知识库内已有的 Better Notes 配对路径和冲突检测记录，不生成重复文件。
- 按 note key 保存独立的路径映射，避免所有普通笔记都改同一个 Git 索引文件。
- 首次配对遇到不同内容、路径冲突或缺失文件时暂停并保留原文，其他笔记继续处理。
- 通过 `autoSyncNotes: false` 可关闭自动发现；已有 Better Notes 配对仍按原设置运行。

更新后重启 Zotero。普通笔记的整篇冲突在 Better Notes 比较窗口中处理，主笔记的分区冲突处理方式不变。
