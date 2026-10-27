# Windows 换电脑指南

GitHub 分发 PaperBridge 软件版本；论文、笔记和登录信息各自迁移。软件仓库中没有你的知识库。

## 在旧电脑收尾

1. 离开 Zotero 笔记编辑区，等待 PaperBridge 完成同步，确认没有待处理冲突。
2. 点击 Zotero 同步，等待条目、PaperBridge 子笔记和附件上传完成。
3. 用现有的私有知识库同步方式提交并上传 Markdown、图片及 `.paperbridge/index.json`。这个索引保存论文 key、笔记路径及 Zotero 子笔记 key，请一起保留。
4. 先备份知识库和 Zotero 数据，再在新电脑开始。切换电脑时先结束旧电脑的编辑。

## 在新电脑安装

1. 安装 Zotero 10、Obsidian、Codex，并各自登录。Zotero 使用同一账号，等待文库与 PDF 下载完成。
2. 下载或克隆自己的知识库，保留完整目录结构。用 Obsidian 的“打开本地仓库”打开它。
3. 从 PaperBridge 的 GitHub Release 下载 `PaperBridge-Setup.exe`。运行后选择本机知识库和 `codex.exe`，点击“安装 / 更新本机配置”。路径可以与旧电脑不同。
4. 在 Zotero 的插件管理器，从安装目录的 plugins 文件夹安装 PaperBridge、Better Notes 和 Codex 侧栏三个 XPI，然后重启 Zotero。
5. 重新打开 Codex 或开启新聊天，让本机 PaperBridge 接口加载。
6. 找一篇已同步的论文，打开 `PaperBridge · 论文名` 子笔记，核对 Obsidian 对应文件。先做一处容易辨认的小修改，切换应用，确认两端出现同样内容，再开始正常阅读。

## 各部分使用什么同步

| 内容 | 迁移方式 |
| --- | --- |
| PaperBridge 软件 | GitHub Release 的安装包 |
| Zotero 论文信息、标签、分类、条目笔记 | 同一 Zotero 账号的数据同步 |
| Zotero PDF 和笔记图片附件 | Zotero Storage 或个人文库 WebDAV 文件同步 |
| Obsidian Markdown、图片、PaperBridge 索引 | 自己的知识库 Git / 文件同步 / 完整复制 |
| 本机路径、PaperBridge 本地连接令牌 | 新电脑运行安装助手重新生成 |
| Codex 账号登录 | 新电脑自行登录，不复制认证文件 |
| Codex 侧栏聊天历史 | 以侧栏和 Codex 自身能力为准，PaperBridge 不负责迁移 |

不要用 Git 或网盘持续同步正在使用的 `zotero.sqlite` 数据库。Zotero 官方建议多电脑通过 Zotero Sync 同步；PDF 文件同步单独配置。

Obsidian 官方 Sync 会排除 `.paperbridge` 这类隐藏目录。若使用它，首次迁移还需单独复制索引；后续配对变动也需更新索引。当前版本更适合能同步该目录的知识库 Git 或文件同步方式。Git 不会因为文件名前面有点就自动忽略它，但要检查自己的 `.gitignore`。

## 第一次连接与冲突

新电脑没有旧电脑的本地共同版本历史，首次连接会保守比较两端。内容存在差异时可能暂停并保存冲突副本，不能理解为“数据丢了”。比较副本，明确决定以 Zotero 或 Obsidian 为准后再恢复。

如果索引指向的 Zotero 子笔记尚未下载，等 Zotero 完成同步再检查，不要删索引来强制重建。

本版本没有跨电脑编辑锁。两台电脑的 Zotero 同时运行时，两端后台均可能写入笔记。推荐一次只在一台电脑运行此工作流，换机前后依次完成 Zotero 和知识库同步；这比两台同时编辑同一篇更可靠。

## 官方资料

- [Zotero 多电脑同步](https://www.zotero.org/support/kb/using_multiple_computers)
- [Zotero 数据同步与附件同步](https://www.zotero.org/support/sync)
- [为什么不要把 Zotero 数据库放进网盘](https://www.zotero.org/support/kb/data_directory_in_cloud_storage_folder)
- [Obsidian Sync 的隐藏目录限制](https://obsidian.md/help/sync/settings)
