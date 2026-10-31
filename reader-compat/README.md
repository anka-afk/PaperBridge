# PaperBridge Reader Compatibility

给 Codex for Zotero 用的小补丁：在 HTML 阅读页选中文字就能提问，关闭选区弹窗后也会保留当前选区。支持 Zotero 10。

当前版本：0.1.0。

## 安装

1. 打开 Zotero 的“工具 → 插件”，在齿轮菜单中选择从文件安装插件。
2. 选择 `paperbridge-reader-compat-0.1.0.xpi`，安装后重启 Zotero。
3. 打开“工具 → 阅读兼容补丁状态…”，看到“选区兼容补丁已启用”就可以用了。

打开论文的 HTML 阅读页，划选一段文字，直接在 Codex 侧栏提问。单段选区不用点 Add；需要固定保留多段文字时再用 Add。

## 从旧定制侧栏迁移

如果以前装过 PaperBridge 定制侧栏 `2026.299.1.1` 或 `2026.299.1.2`，除了这个补丁，还要重新安装官方侧栏原包：

- 安装目录里的文件名是 `codex-for-zotero.xpi`。
- 单独下载的附件名是 `codex-for-zotero-official.xpi`。
- 两个文件内容相同，不用先卸载侧栏或删除设置。

只装补丁不会恢复旧定制侧栏里被禁用的官方更新地址。安装官方原包和补丁后，重启 Zotero。

## 更新与停用

补丁只在内存中挂接方法，不修改官方 XPI、更新地址或账号配置。官方侧栏更新或替换实例后，补丁会重新挂接。

它仍然依赖侧栏的内部接口。检测到接口变化时会停止挂接，并在状态菜单里显示原因。PaperBridge 和补丁自身目前采用手动更新。

停用补丁会恢复包装过的方法。已经打开的阅读页建议关掉重开，让官方侧栏重新建立选区监听。补丁不读写 Obsidian 笔记、Zotero 文献数据、Codex 登录信息或 API Key。

## 兼容范围

已在 Zotero 10.0.6 和未修改的 Codex for Zotero 2026.299.1 上验证 HTML 划词、选区保留和侧栏替换后重新挂接。PDF 阅读上下文不受补丁影响。

这不代表已经逐版本验证后续官方更新。升级后如果选区失效，先查看补丁状态。

## 构建

在仓库根目录运行：

```bash
python reader_compat.py --output dist
```

只打包这个插件。完整 Windows 安装包用 `python build.py` 构建，回归测试用 `node --test tests/reader-compat.test.cjs`。

MIT 许可证。此插件由 PaperBridge 维护，与 Codex for Zotero 官方版本分别分发。
