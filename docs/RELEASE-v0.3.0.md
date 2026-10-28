# PaperBridge 0.3.0

新增独立的 PaperBridge AI 侧栏，可选择 Codex 账户或 DeepSeek API。DeepSeek 直接连接官方接口，支持本机加密保存 Key、连接检查、Flash / Pro、可选深入思考、流式回答、停止请求、按论文保留本地对话及指定 AI 小节保存到 Obsidian。

三种阅读模板现在可以直接在面板中选择并应用到现有同步主笔记，不必通过 Better Notes 的独立模板入口。升级保留之前的笔记和个人书写内容，并包含 0.2.1 的 Codex 路径自动恢复修正。

Key 仅在当前 Zotero 资料目录对应的本机加密文件中保存，不进入知识库或 Git；换电脑后重新填写。DeepSeek 与 Codex 聊天历史分别保存，不会在切换时自动把旧聊天发给另一家服务。论文信息、选中原文和可选正文仅在发送问题时提交给 DeepSeek，按用户自己的 API 账户计费。

验证：31 项自动测试；独立 Zotero 文库中的模式选择、Key 加密保存、本地模拟接口连接、流式回答、对话落盘、方法小节保存和模板升级。未提供真实 DeepSeek Key，因此尚未进行真实账户的付费模型调用。自动分类继续使用原来的 Codex 配置。

适用于 Windows x64、Zotero 10（已在 10.0.6 验证）。这是预发布版本，尚未提供安装包代码签名和在线自动更新。

已有用户升级：在 Zotero 插件管理器中安装 `paperbridge-0.3.0.xpi` 并重启；已安装的 Codex 侧栏和 Better Notes 无需重装。全新电脑使用 `PaperBridge-Setup.exe`，按 README 完成本机路径配置和三个插件安装。DeepSeek Key 由每台电脑自行填写。

下载后的文件可用 `SHA256SUMS.txt` 核对。`PaperBridge-Source.zip` 包含固定版本的构建依赖和第三方许可证；个人论文、笔记、账号凭据及本机配置不随软件发布。
