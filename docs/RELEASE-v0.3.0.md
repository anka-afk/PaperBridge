# PaperBridge 0.3.0

新增 PaperBridge AI 侧栏，问答来源可以选择 Codex 账户或 DeepSeek API。

## 新功能

- DeepSeek 直接连接官方接口，支持 Flash / Pro、深入思考、流式回答和停止请求。
- Key 在本机加密保存，可以在面板中检查连接。
- 对话按论文保存在本机，回答可以保存到指定的 AI 小节。
- 三种阅读模板可以直接在面板中选择并应用到现有同步主笔记，不用再走 Better Notes 的模板入口。

升级会保留已有笔记和个人书写内容，并包含 0.2.1 的 Codex 路径自动恢复修复。

DeepSeek Key 只保存在当前 Zotero 资料目录对应的本机加密文件中，不进入知识库或 Git，换电脑后需要重新填写。DeepSeek 和 Codex 的聊天历史分开保存，切换来源时不会把旧聊天发给另一家服务。

论文信息、选中原文和可选正文只在发送问题时提交给 DeepSeek，费用由自己的 API 账户承担。自动分类仍使用 Codex。

## 升级

已有用户安装 `paperbridge-0.3.0.xpi` 并重启 Zotero，Codex 侧栏和 Better Notes 不用重装。新电脑使用 `PaperBridge-Setup.exe`，按 README 配置本机路径并安装三个插件。

适用于 Windows x64、Zotero 10（已在 10.0.6 验证）。这是预发布版本，尚未提供安装包代码签名和在线自动更新。

下载文件可以用 `SHA256SUMS.txt` 核对。`PaperBridge-Source.zip` 包含固定版本的构建依赖和第三方许可证。
