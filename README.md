# PaperBridge

在 Zotero 里读论文，用 Codex 或 DeepSeek 提问，再把阅读笔记同步到 Obsidian。

目前支持 Windows x64 和 Zotero 10。Codex 沿用本机登录，DeepSeek 使用自己的 API Key。

当前版本：0.3.4（[更新说明](docs/RELEASE-v0.3.4.md)）。

## 能做什么

- 在 PDF / HTML 阅读页划选原文提问，需要时可以把多段文字加入上下文。
- 用速读筛选、科研分析、精读复现三种模板整理论文。
- 新论文下载 PDF 后自动建立笔记，并按 Zotero 中已有的主题分类归档。
- 将 Zotero 条目笔记和 Obsidian Markdown 双向同步。
- 分开保存文献信息、原文批注、AI 整理和个人笔记，互不混在一起。

## 安装

1. 安装 Zotero 10、Obsidian 和 Codex，并在 Codex 中登录。
2. 从 [发布页](https://github.com/anka-afk/PaperBridge/releases) 下载 `PaperBridge-Setup.exe`。
3. 运行安装器，选择 Obsidian 知识库和 `codex.exe`，点击“安装 / 更新本机配置”。
4. 安装完成后，在 Zotero 的“工具 → 插件 → 齿轮菜单 → Install Plugin From File”中，依次安装安装目录里的四个 XPI：
   - PaperBridge
   - Better Notes
   - Codex 官方侧栏
   - Reader Compatibility
5. 重启 Zotero。

程序安装在 `%LOCALAPPDATA%\PaperBridge`，本机路径配置保存在 `%APPDATA%\PaperBridge`。配置助手会备份修改前的 Codex 配置，不会复制或读取 Codex 认证文件。

PaperBridge 和阅读兼容补丁目前随安装包手动更新，Codex 官方侧栏仍使用自己的更新渠道。以前装过 PaperBridge 定制侧栏的话，先看[兼容补丁说明](reader-compat/README.md)。

## 开始读论文

1. 打开论文，点击右侧蓝色 AI 图标进入 PaperBridge AI。
2. 选择阅读模板，点击“应用到同步主笔记”。每篇论文只需应用一次，之后继续编辑同一份笔记。
3. 选中原文后提问。需要保留多段文字时，点击 Add to Codex。
4. 想让 Codex 记笔记，直接说“把刚才的解释记到方法小节”或“把这个疑问记到问答”。

笔记既可以在 Zotero 的“条目笔记”中打开，也可以在 Obsidian 中编辑。Zotero 里的名称是 `PaperBridge · 论文名`，Obsidian 中对应 `论文笔记/主题分类/标题--key.md`。

没有主题分类的论文会先放进“待分类”，再由 Codex 根据标题和摘要判断。无法确定或调用失败时，就留在“待分类”。

## 笔记同步

每篇论文只有一份配对笔记。“条目笔记”和“所有笔记”只是 Zotero 中的两个入口，已有的其他笔记不会被合并或删除。

| 区域 | 怎么编辑 |
| --- | --- |
| 文献信息、原文批注 | 由 Zotero 管理和更新，不要在自动批注区写个人内容 |
| AI 整理 | Codex 通过 PaperBridge 写入，也可以在 Zotero 或 Obsidian 中修改 |
| 我的笔记 | 自己写，AI 工具不会覆盖 |

Zotero 保持运行时，两端通常会在切换应用或离开编辑区后约 5 秒同步。使用 DeepSeek 时，点击“记到 Obsidian”可以把最后一条完整回答保存到所选的 AI 小节。

几点注意：

- 保留 `pb` 开头的 HTML 注释和“AI · 方法”等小节标题，同步靠它们定位。标记损坏时会停止写入。
- 不同小节的双边修改可以合并；同一小节两边都改过时会暂停，并把副本保存到 `.paperbridge/conflicts`。选择以哪一端为准后再恢复。
- 删除配对笔记、移动或删除 Markdown 也会暂停同步，不会顺带删除另一端。
- 不要再把同一份主笔记加入 Better Notes 的整文件自动同步，两个同步引擎会抢写同一份文件。
- Zotero 不支持所有 Obsidian 语法。双链、嵌入和块引用可能只显示为文本，Zotero 修改过的小节也可能被重新排版；未修改的小节保持原文。

## DeepSeek

PaperBridge AI 的问答来源可以切换为 DeepSeek API。支持 Flash、Pro、深入思考、选中原文，以及可选的 PDF 前 30 页正文。

Key 加密保存在本机状态目录，不会写进知识库，换电脑后需要重新填写。DeepSeek 对话按论文保存在本机，和 Codex 聊天记录分开；自动分类仍使用 Codex。

论文参考资料只在你发送问题时提交给 DeepSeek 官方 API，费用由自己的 API 账户承担。接口说明见 [DeepSeek API 文档](https://api-docs.deepseek.com/)。

## 换电脑

软件、Zotero 数据和 Obsidian 知识库需要分别迁移。除了 Markdown 和图片，记得一起同步 `.paperbridge/index.json`，它保存论文与笔记的配对关系。

新电脑重新运行安装器并选择本机路径即可，不用沿用旧电脑的用户名或磁盘路径。Codex 和 DeepSeek 都需要在新电脑上重新登录或填写 Key。

具体步骤和同步方式见 [Windows 换电脑指南](docs/Windows迁移指南.md)。

## 其他说明

### 阅读兼容补丁

Reader Compatibility 用来解决 HTML 阅读页划词后 Codex 收不到原文的问题，并保留弹窗关闭后的当前选区。它不改官方 XPI；官方侧栏更新后，补丁会重新检查并挂接。

如果划词没有反应，打开 Zotero 的“工具 → 阅读兼容补丁状态…”看看。安装、旧侧栏迁移和停用方法见[兼容补丁说明](reader-compat/README.md)。

### Codex 路径恢复

Codex 更新后，如果原来的程序路径失效，PaperBridge 会查找本机可用版本并更新连接。仍然有效的手动路径不会被改动。

## 数据说明

自动分类会把论文标题和摘要发给当前登录的 Codex。提问时，选中文字或读取的论文片段会随请求发送给所选的模型服务；个人笔记不会用于自动分类。

仓库和安装包不包含你的论文、笔记、聊天记录、API Key 或账号认证文件。详见[数据说明](docs/数据说明.md)。
