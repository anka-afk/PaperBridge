// Ordinary notes use Better Notes' whole-file engine. PaperBridge's generated
// master notes must never be registered with that engine as well.
var PaperBridgeAutoNotes = class {
  constructor(host) { this.host = host; this.last = {}; }
  enabled() { return this.host.config?.autoSyncNotes !== false; }
  available() {
    const bn = Zotero.BetterNotes;
    return !!(bn?.api?.convert?.note2md && bn.api.sync?.isSyncNote &&
      bn.api.sync?.getSyncStatus && bn.api.sync?.updateSyncStatus &&
      bn.api.sync?.getMDStatusFromContent && bn.hooks?.onSyncing);
  }
  relative(full) {
    const root = PathUtils.split(this.host.config.vaultPath);
    const parts = PathUtils.split(full);
    const same = (a, b) => Zotero.isWin ? a.toLowerCase() === b.toLowerCase() : a === b;
    if (parts.length <= root.length || !root.every((p, i) => same(p, parts[i])))
      throw Error('此笔记已有知识库外的 Better Notes 配对，保留原配对；请先调整目标目录');
    const rel = parts.slice(root.length).join('/');
    this.host.resolve(rel); // Apply the vault path validation used by master notes.
    return rel;
  }
  linkPath(note) {
    if (!/^[A-Z0-9]{8}$/.test(note.key)) throw Error('笔记标识无效');
    return PathUtils.join(this.host.config.vaultPath, '.paperbridge', 'note-links', `${note.libraryID}-${note.key}.json`);
  }
  async readLink(note) {
    const file = this.linkPath(note);
    if (!await IOUtils.exists(file)) return null;
    const raw = await IOUtils.readUTF8(file), link = JSON.parse(raw);
    if (link.version !== 1 || link.libraryID !== note.libraryID || link.noteKey !== note.key)
      throw Error('普通笔记配对记录损坏，已保留现有文件');
    this.host.resolve(link.path);
    return { raw, link };
  }
  async saveLink(note, rel, previous) {
    const link = { version: 1, libraryID: note.libraryID, noteKey: note.key, path: rel };
    const text = JSON.stringify(link, null, 2);
    if (previous?.raw === text) return;
    if (previous) await this.host.atomic(this.linkPath(note), text, previous.raw);
    else await this.createFile(this.linkPath(note), text);
  }
  async createFile(file, text) {
    await IOUtils.makeDirectory(PathUtils.parent(file), { createAncestors: true });
    const temp = file + '.paperbridge-' + Zotero.Utilities.randomString(12) + '.tmp';
    await IOUtils.writeUTF8(temp, text);
    try { await IOUtils.move(temp, file, { noOverwrite: true }); }
    finally { if (await IOUtils.exists(temp)) await IOUtils.remove(temp); }
  }
  async destination(note) {
    let parent = note.parentItemID ? await Zotero.Items.getAsync(note.parentItemID) : null;
    while (parent && !parent.isRegularItem())
      parent = parent.parentItemID ? await Zotero.Items.getAsync(parent.parentItemID) : null;
    if (parent?.deleted) throw Error('父条目已在回收站，保留现有笔记');
    const segment = s => PaperBridgeCore.segment(s).slice(0, 65).trim() || '未命名';
    const folder = parent
      ? ['条目笔记', segment(parent.getField('title')) + '--' + parent.key]
      : ['独立笔记'];
    return [...this.host.config.noteFolder.split(/[\\/]/), ...folder,
      segment(note.getNoteTitle()) + '--' + note.key + '.md'].join('/');
  }
  async register(note) {
    const bn = Zotero.BetterNotes, api = bn.api.sync, previous = await this.readLink(note);
    // Adopt manual exports (including pre-existing RoPE notes) without moving,
    // re-exporting, or replacing Better Notes' conflict-detection baseline.
    if (api.isSyncNote(note.id)) {
      const status = api.getSyncStatus(note.id);
      const full = PathUtils.join(status.path, status.filename), rel = this.relative(full);
      if (!await IOUtils.exists(full)) throw Error('已配对的 Markdown 不存在，请先恢复文件或在 Better Notes 中重新配对');
      await this.saveLink(note, rel, previous);
      return { status: 'registered', path: rel };
    }
    if (this.host.noteSync?.editing(note)) return { status: 'editing' };
    const rel = previous?.link.path || await this.destination(note);
    const full = this.host.resolve(rel), dir = PathUtils.parent(full);
    const exists = await IOUtils.exists(full);
    if (previous && !exists) throw Error('已配对的 Markdown 被移动或删除，保留 Zotero 原文；请先恢复文件');
    const old = exists ? await IOUtils.readUTF8(full) : null;
    const existing = exists ? api.getMDStatusFromContent(old) : null;
    if (exists && (existing.meta?.$itemKey !== note.key || Number(existing.meta?.$libraryID) !== note.libraryID))
      throw Error('目标 Markdown 不属于这份 Zotero 笔记，未覆盖');
    await IOUtils.makeDirectory(dir, { createAncestors: true });
    const html = note.getNote();
    const generated = await bn.api.convert.note2md(note, dir, {
      keepNoteLink: false, withYAMLHeader: true, cachedYAMLHeader: existing?.meta,
      // Existing files may have edited image attachments; comparison must not overwrite them.
      skipSavingImages: exists
    });
    const parsed = api.getMDStatusFromContent(generated);
    if (parsed.meta?.$itemKey !== note.key || Number(parsed.meta?.$libraryID) !== note.libraryID)
      throw Error('Markdown 转换缺少笔记身份信息，已暂停');
    if (html.replace(/<[^>]+>/g, '').trim() && !parsed.content.trim())
      throw Error('非空笔记转换为空，已保留 Zotero 原文');
    if (this.host.stopped || note.getNote() !== html || this.host.noteSync?.editing(note))
      return { status: 'changed-during-sync' };
    if (exists) {
      // A new device has no shared baseline. Never treat a differing existing
      // Markdown file as an empty initial export or choose a winner silently.
      const norm = s => s.replace(/\r\n/g, '\n').trim();
      if (norm(existing.content) !== norm(parsed.content))
        throw Error('首次配对的两端内容不同，均已保留；请在 Better Notes 中比较后配对');
      if (await IOUtils.readUTF8(full) !== old) return { status: 'changed-during-sync' };
    } else await this.createFile(full, generated);
    await this.saveLink(note, rel, previous);
    // setValue registers the note and installs the actual initial hashes.
    // Do not hard-reset these hashes on subsequent runs.
    api.updateSyncStatus(note.id, {
      path: dir, filename: PathUtils.filename(full), itemID: note.id,
      md5: Zotero.Utilities.Internal.md5(exists ? existing.content : parsed.content, false),
      noteMd5: Zotero.Utilities.Internal.md5(html, false), lastsync: Date.now()
    });
    return { status: 'registered', path: rel };
  }
  async all() {
    if (!this.enabled() || !this.available()) return this.summary();
    const index = await this.host.index();
    const masters = new Set(Object.values(index.items).map(e => e.zoteroNoteKey).filter(Boolean));
    // include child and standalone notes, even when the parent has no PDF.
    const items = await Zotero.Items.getAll(Zotero.Libraries.userLibraryID, false, false);
    const active = [], last = {};
    for (const note of items) {
      if (this.host.stopped) break;
      if (!note.isNote() || note.deleted || note.libraryID !== Zotero.Libraries.userLibraryID ||
          masters.has(note.key) || note.hasTag('PaperBridge 双向同步')) continue;
      try {
        if (note.parentItemID) {
          const parent = await Zotero.Items.getAsync(note.parentItemID);
          if (!parent || parent.deleted) continue;
        }
        const result = await this.register(note);
        last[note.key] = result;
        if (result.status === 'registered') active.push(note);
      } catch (error) { last[note.key] = { status: 'paused', reason: String(error.message || error) }; }
    }
    this.last = last;
    // Better Notes treats an empty list as "sync everything", so never pass it.
    if (active.length && !this.host.stopped)
      await Zotero.BetterNotes.hooks.onSyncing(active, { quiet: true, skipActive: true, reason: 'paperbridge-auto-notes' });
    return this.summary();
  }
  summary() {
    return {
      available: this.available(), enabled: this.enabled(), engine: 'Better Notes',
      registered: Object.values(this.last).filter(v => v.status === 'registered').length,
      paused: Object.entries(this.last).filter(([, v]) => v.status === 'paused').map(([key, v]) => ({ key, reason: v.reason })),
      notes: this.last
    };
  }
};
