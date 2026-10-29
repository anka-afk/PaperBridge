# PaperBridge 0.3.1

在 Zotero 找到和阅读论文，通过 Codex 或 DeepSeek API 提问，并把阅读成果放回 Obsidian。Windows 版沿用本机 Codex 登录，或使用自己填写的 DeepSeek Key。

## 安装

从 [0.3.1 发布页](https://github.com/anka-afk/PaperBridge/releases/tag/v0.3.1) 下载 `PaperBridge-Setup.exe`；源码和单独的 XPI 也在同一页面。

0.3.1 修复同步小节标题重复和批注被清空的问题，详见[修复说明与升级步骤](docs/RELEASE-v0.3.1.md)。多电脑使用时，请先备份并将各台电脑升级到此版本，再继续双向同步。

1. 本机安装 Zotero 10、Obsidian 和 Codex；在 Codex 中完成登录。
2. 双击 PaperBridge-Setup.exe，选择 Obsidian 知识库和 codex.exe，点击安装。
3. 安装目录会自动打开。在 Zotero 的工具、插件、齿轮菜单选择 Install Plugin From File，分别安装三个 XPI，然后重启 Zotero。

PaperBridge 0.2.0 加入笔记双向同步。桥接插件为 `paperbridge-0.3.1.xpi`，另需 Better Notes 3.3.3；已有 Codex 侧栏可继续使用。通过重新运行新版配置助手手动更新；清单使用保留的 .invalid 更新地址，不提供在线自动更新服务。

配置助手会把应用放在本机 LocalAppData/PaperBridge，把本机路径配置放在 RoamingAppData/PaperBridge，并在 Codex 的 config.toml 中加入一个有明确边界的 PaperBridge MCP 段。修改前自动备份配置，不复制或读取 Codex 认证文件。

## 日常使用

- 打开论文后，点击右侧蓝色 AI 图标进入 PaperBridge AI，选择阅读模板并点击“应用到同步主笔记”。在“条目笔记”中打开 `PaperBridge · 论文名`，或在 Obsidian 打开配对的 Markdown；每篇论文只需应用一次模板，之后继续编辑同一份主笔记。
- 新论文加入 Zotero 且 PDF 已下载后，自动在知识库的“科研/论文大学习/论文笔记/主题分类”下建立一份笔记。
- 已有 Zotero 主题分类会优先沿用；没有分类时先放入待分类，再由 Codex 根据标题和摘要分类。无法确定或调用失败时保留待分类。
- 在 PDF 阅读器右侧打开 Codex，选中文字后提问；需要保留多段文字时点击 Add to Codex。
- 想记录时直接说：“把刚才的解释记到这篇论文的方法小节”“把这个疑问记到问答”“这篇用精读复现模板”。Codex 会通过 PaperBridge 定向写入。
- 在 Obsidian 的“我的笔记”区自由书写。自动同步只更新文献信息、批注和 AI 整理区。
- 保护标记是 HTML 注释，阅读视图中不可见。不要删除 pb 开头的保护标记；标记损坏时程序会拒绝写入，避免覆盖个人内容。
- 默认速读筛选。科研分析和精读复现会增加相应的小节，保留已有记录。

## Zotero 条目笔记双向同步

每篇论文会建立一份带 PaperBridge 前缀和标签的 Zotero 子笔记，与“论文笔记/主题分类/标题--key.md”配对。它会同时出现在 Zotero 的“条目笔记”和“所有笔记”中；这是同一份笔记的两个入口。已有的其他 Zotero 笔记及独立笔记保持原样。

- AI 整理和我的笔记两个区域都可在 Zotero 或 Obsidian 编辑，通常在切换到另一端或离开 Zotero 编辑区后约 5 秒同步；Zotero 需保持运行。Codex 仍只写 AI 整理区。
- Zotero 笔记使用“AI · 方法”等小节标题定位，请保留这些标题；Obsidian 中继续保留 pb 保护标记。
- 不同小节的双边修改可以合并；同一小节两边均修改时暂停，保留两端与共同版本的副本在 `.paperbridge/conflicts`。可让 Codex 查询同步状态，但只有你明确选择来源后才进行覆盖恢复。
- PDF 原文批注仍由 Zotero 管理并自动更新。不要在同步子笔记的“原文批注（自动）”区填写个人内容。
- 删除配对笔记或移动/删除 Markdown 时暂停，不会顺带删除另一端。
- 0.3.1 修复首次迁移冲突后的空小节重复追加。已有批注标识减少、尚未同步完整或转换意外返回空内容时，保留旧内容并暂停覆盖；确实删除批注时需先核对删除情况。
- Better Notes 负责富文本、Markdown、标准图片和公式等格式转换，PaperBridge 负责配对、定时同步和冲突保护。无需再把同一主笔记加入 Better Notes 自己的整文件自动同步列表。
- Zotero 富文本不包含所有 Obsidian 专属语法。双链、嵌入和块引用等在 Zotero 中可能作为文本显示；Zotero 修改后该小节的 Markdown 排版可能被规范化。未修改的小节保持原文。

## 换电脑

详细步骤见 [Windows 迁移指南](docs/Windows迁移指南.md)。

在另一台 Windows 电脑安装三个应用并分别登录；通过 Zotero 同步文献和 PDF，通过自己的知识库同步方式同步 Markdown 和 .paperbridge 索引。运行同一个安装包重新选择本机路径，再安装三个 Zotero 插件。无需沿用原电脑的用户名或磁盘路径。Codex 账号由每台电脑自行登录。

Zotero 论文 item key 用于匹配笔记，须使用同一个同步文献库。Codex 对话是否在设备间同步取决于 Codex 自身；PaperBridge 不声称同步聊天历史。只复制 Markdown 而没有 Zotero 对应条目时，原文回链可能无法打开。

## 数据与记录

AI 整理、个人笔记、原文批注各自有独立区域。每次自动写入先检测文件是否被其他程序修改；发生并发编辑时保留现有文件并要求重试。同一次写入请求重试不会重复追加。论文标题改动不会重新创建笔记，分类调整会移动对应笔记并保留全部内容。

自动分类会把论文标题和摘要交给当前 Codex 登录。选择文字后发送提问时，相关原文按 Codex for Zotero 的上下文机制发送。个人笔记不会作为自动分类的输入。不会复制账号凭据到迁移包。

## Codex 更新后连接恢复

0.2.1 修复 Codex 更新后安装路径失效的问题。启动和后台检查会在旧路径失效时查找本机可用版本，并自动更新连接；已有有效的手动路径继续保留。

## DeepSeek API 与模板入口

0.3.0 在 Zotero 右侧新增 PaperBridge AI。问答来源可选择 Codex 账户或 DeepSeek API。DeepSeek 模式直接连接官方 API，不经过 Codex 登录；在设置中填写 Key 后点击保存，并可用“检查连接”验证。

支持 Flash、Pro、深入思考、选中原文和可选 PDF 前 30 页正文。点击“记到 Obsidian”将最后一条完整回答保存到所选 AI 小节；自己的书写区不被覆盖。DeepSeek 模式不会执行任意命令，也不会由模型擅自写文件。

三种阅读模板可在同一面板的下拉框选择，点击“应用到同步主笔记”；它与 Better Notes 自己的模板库是不同入口。

Key 使用 Zotero 本机资料目录的加密能力保存，不写入知识库、模式配置或源码包。换电脑后需要重新填写。DeepSeek 对话按论文在本机分别保存，与 Codex 历史分开；切换来源不会复制另一端的聊天记录。DeepSeek 的请求按账户计费，论文参考资料只在发送问题时提交给官方 API。自动分类仍遵循原来的 Codex 配置。

官方接口参考：[DeepSeek API 文档](https://api-docs.deepseek.com/)。
