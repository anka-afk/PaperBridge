# Windows 换电脑指南

换电脑时，软件、Zotero 数据和 Obsidian 知识库要分别迁移。别只复制 Markdown，`.paperbridge/index.json` 也要一起带上。

## 旧电脑收尾

1. 离开 Zotero 笔记编辑区，等 PaperBridge 同步完成，确认没有待处理的冲突。
2. 点击 Zotero 同步，等条目、PaperBridge 子笔记和附件上传完成。
3. 用平时的知识库同步方式上传 Markdown、图片和 `.paperbridge/index.json`。索引保存论文 key、笔记路径和 Zotero 子笔记 key，不能漏掉。
4. 备份知识库和 Zotero 数据，再开始配置新电脑。迁移期间不要两边同时编辑。

## 新电脑安装

1. 安装 Zotero 10、Obsidian 和 Codex，并分别登录。Zotero 使用同一个账号，等文库和 PDF 下载完成。
2. 下载或复制自己的知识库，保留完整目录结构，再用 Obsidian 打开。
3. 从 PaperBridge 的 [发布页](https://github.com/anka-afk/PaperBridge/releases) 下载 `PaperBridge-Setup.exe`。
4. 运行安装器，选择新电脑上的知识库和 `codex.exe`，点击“安装 / 更新本机配置”。路径可以和旧电脑不同。
5. 在 Zotero 插件管理器中，从安装目录的 `plugins` 文件夹安装 PaperBridge、Better Notes、Codex 官方侧栏和 Reader Compatibility，然后重启 Zotero。
6. 重新打开 Codex 或新建聊天，让本机 PaperBridge 接口加载。
7. 找一篇已经同步的论文，打开 `PaperBridge · 论文名` 子笔记，核对 Obsidian 中的对应文件。先做一处容易辨认的小修改，确认两端都能同步，再继续正常使用。

使用 DeepSeek 的话，还要在 PaperBridge AI 面板重新填写 Key。`deepseek-secret.json` 依赖原电脑的 Zotero 资料目录解密，不要把它放进知识库或 Git。DeepSeek 对话也保存在本机，不随配对索引迁移。

## 各类内容怎么迁移

| 内容 | 迁移方式 |
| --- | --- |
| PaperBridge 软件 | GitHub Release 安装包 |
| Zotero 论文信息、标签、分类、条目笔记 | 同一 Zotero 账号的数据同步 |
| Zotero PDF 和笔记图片附件 | Zotero Storage 或个人文库 WebDAV 文件同步 |
| Obsidian Markdown、图片、PaperBridge 索引 | 知识库 Git、文件同步或完整复制 |
| 本机路径、PaperBridge 本地连接令牌 | 新电脑运行安装器重新生成 |
| Codex 账号登录 | 新电脑自行登录，不复制认证文件 |
| Codex 侧栏聊天历史 | 由侧栏和 Codex 自身决定，PaperBridge 不负责迁移 |

不要用 Git 或网盘持续同步正在使用的 `zotero.sqlite`。多电脑文献数据走 Zotero Sync，PDF 文件同步单独配置。

Obsidian 官方 Sync 会排除 `.paperbridge` 这类隐藏目录。使用 Obsidian Sync 时，首次迁移要单独复制索引，之后配对关系有变化也要更新它。更方便的做法是用能同步隐藏目录的知识库 Git 或文件同步方式；同时检查自己的 `.gitignore`，别把索引排除掉。

## 第一次连接

新电脑没有旧电脑的共同版本历史。第一次连接时，如果两端内容不同，PaperBridge 可能暂停同步并保存冲突副本，这不代表数据被删了。比较副本，决定以 Zotero 或 Obsidian 为准后再恢复。

如果索引指向的 Zotero 子笔记还没下载，先等 Zotero 同步完成，不要删索引强制重建。

当前版本没有跨电脑编辑锁。两台电脑同时运行 Zotero 时，可能同时写同一篇笔记。一次只在一台电脑上使用这套工作流，换机前后依次完成 Zotero 和知识库同步。

## 官方资料

- [Zotero 多电脑同步](https://www.zotero.org/support/kb/using_multiple_computers)
- [Zotero 数据同步与附件同步](https://www.zotero.org/support/sync)
- [为什么不要把 Zotero 数据库放进网盘](https://www.zotero.org/support/kb/data_directory_in_cloud_storage_folder)
- [Obsidian Sync 的隐藏目录限制](https://obsidian.md/help/sync/settings)
