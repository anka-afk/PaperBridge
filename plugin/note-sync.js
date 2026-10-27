var PaperBridgeNoteSync=class {
  constructor(host){this.host=host;this.tag='PaperBridge 双向同步';this.cache=null;this.pending=false;this.last={};}
  available(){return !!Zotero.BetterNotes?.api?.convert?.md2note;}
  enabled(){return this.host.config?.bidirectionalNotes!==false;}
  async state(){if(!this.cache){this.statePath=PathUtils.join(PathUtils.parent(this.host.configPath),'notes-sync-state.json');this.cache=await IOUtils.exists(this.statePath)?JSON.parse(await IOUtils.readUTF8(this.statePath)):{version:1,notes:{}};if(this.cache.version!==1)throw Error('双向同步历史格式不支持');}return this.cache;}
  async persist(){await this.host.atomic(this.statePath,JSON.stringify(this.cache,null,2));}
  norm(s){return String(s||'').replace(/\r\n/g,'\n').trim();}
  esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
  label(key){return key==='personal'?'我的笔记':key==='annotations'?'原文批注（自动）':'AI · '+key;}
  linkPrefix(prefix,path){const win=Zotero.getMainWindow(),doc=new win.DOMParser().parseFromString(prefix,'text/html');const link=[...doc.querySelectorAll('a')].find(a=>a.textContent==='在 Obsidian 打开');if(link)link.setAttribute('href','obsidian://open?vault='+encodeURIComponent(PathUtils.filename(this.host.config.vaultPath))+'&file='+encodeURIComponent(path));return doc.body.innerHTML;}
  parse(html,keys){const win=Zotero.getMainWindow(),doc=new win.DOMParser().parseFromString(html,'text/html');const wrap=doc.body.firstElementChild;const root=wrap?.tagName==='DIV'&&wrap.hasAttribute('data-schema-version')?wrap:doc.body;const wanted=new Map([...keys,'annotations'].map(k=>[this.label(k),k]));const chunks={},prefix=[];let key=null;for(const n of root.childNodes){if(n.nodeType===1&&/^H[1-6]$/.test(n.tagName)&&wanted.has(n.textContent.trim())){key=wanted.get(n.textContent.trim());if(key in chunks)throw Error('Zotero 同步小节标题重复：'+key);chunks[key]=[];}else if(key)chunks[key].push(n.outerHTML??this.esc(n.textContent));else prefix.push(n.outerHTML??this.esc(n.textContent));}for(const k of [...keys,'annotations'])if(!(k in chunks))throw Error('Zotero 同步小节标题缺失：'+this.label(k));return {prefix:prefix.join(''),html:Object.fromEntries(Object.entries(chunks).map(([k,v])=>[k,v.join('')]))};}
  async toMD(note,html,dir,reference=''){return PaperBridgeSyncCore.formatting(this.norm(await Zotero.BetterNotes.api.convert.note2md(note,dir,{noteContent:html,skipTemplate:true,keepNoteLink:true,withYAMLHeader:false})),reference);}
  async toHTML(note,md,dir){return await Zotero.BetterNotes.api.convert.md2note({content:PaperBridgeSyncCore.clean(md),meta:{},filedir:dir,filename:''},note,{isImport:true});}
  render(prefix,html,keys){return '<div data-schema-version="9">'+prefix+keys.map(k=>`<h2>${this.esc(this.label(k))}</h2>${html[k]||'<p></p>'}`).join('')+`<h2>${this.label('annotations')}</h2>${html.annotations||'<p></p>'}</div>`;}
  editing(note){return (Zotero.Notes?._editorInstances||[]).some(e=>{try{return e._item?.id===note.id&&e._iframeWindow?.document.hasFocus();}catch{return false;}});}
  async backup(id,md,html,base,reason){const h=this.host,stamp=new Date().toISOString().replace(/[:.]/g,'-');const dir=PathUtils.join(h.config.vaultPath,'.paperbridge','conflicts',id.replace(':','-'),stamp);await IOUtils.makeDirectory(dir,{createAncestors:true});await IOUtils.writeUTF8(PathUtils.join(dir,'obsidian.md'),md);await IOUtils.writeUTF8(PathUtils.join(dir,'zotero.html'),html);if(base)await IOUtils.writeUTF8(PathUtils.join(dir,'common-base.json'),JSON.stringify(base,null,2));await IOUtils.writeUTF8(PathUtils.join(dir,'说明.txt'),'两端内容均已保留。'+reason+'\n请比较副本，明确选择以 Obsidian 或 Zotero 为准后再恢复同步。');return dir;}
  async conflict(id,md,html,base,reason){if(base?.blocked&&base.blocked.md===md&&base.blocked.html===html)return {status:'conflict',backup:base.blocked.backup,reason:base.blocked.reason};const backup=await this.backup(id,md,html,base,reason);const s=await this.state();s.notes[id]={...(base||{}),blocked:{md,html,reason,backup}};await this.persist();return {status:'conflict',backup,reason};}
  async paired(item,entry){let n;if(entry.zoteroNoteKey){n=await Zotero.Items.getByLibraryAndKeyAsync(item.libraryID,entry.zoteroNoteKey);if(!n||n.deleted)throw Error('配对的 Zotero 笔记未同步到本机或已删除；已暂停，不会重建或删除另一端');if(n.parentItemID!==item.id||!n.isNote())throw Error('Zotero 笔记配对指向了其他条目');return {note:n,fresh:false};}const candidates=(await Zotero.Items.getAsync(item.getNotes())).filter(i=>!i.deleted&&i.hasTag(this.tag));if(candidates.length>1)throw Error('同一论文存在多份 PaperBridge 同步笔记，请先确定主笔记');if(candidates.length===1)return {note:candidates[0],fresh:candidates[0].getNote().includes('PaperBridge 正在建立双向同步…')};n=new Zotero.Item('note');n.libraryID=item.libraryID;n.parentID=item.id;n.addTag(this.tag);n.setNote('<div data-schema-version="9"><p>PaperBridge 正在建立双向同步…</p></div>');await n.saveTx();return {note:n,fresh:true};}
  async sync(item,options={}){
    if(!this.enabled())return {status:'disabled'};if(!this.available())return {status:'requires-better-notes'};
    const h=this.host,r=await h.ensure(item),id=`${item.libraryID}:${item.key}`,store=await this.state(),base=store.notes[id],idx=await h.index(),entry=idx.items[id];
    const {note,fresh}=await this.paired(item,entry),md=await IOUtils.readUTF8(r.notePath),oldHTML=fresh?'':note.getNote(),dir=PathUtils.parent(r.notePath),fields=PaperBridgeSyncCore.fields(md),keys=Object.keys(fields);
    if(!fresh&&base?.md===md&&base?.html===oldHTML&&!base.blocked)return {status:'up-to-date',noteKey:note.key};
    let parsed,z={},canonical={},html={},result;
    try{
      if(fresh){for(const k of keys)html[k]=await this.toHTML(note,fields[k],dir);html.annotations=await this.toHTML(note,PaperBridgeCore.region(md,'annotations').body,dir);const obsidian='obsidian://open?vault='+encodeURIComponent(PathUtils.filename(h.config.vaultPath))+'&file='+encodeURIComponent(r.relativePath);parsed={prefix:`<h1>PaperBridge · ${this.esc(r.paper.title)}</h1><p><a href="${this.esc(obsidian)}">在 Obsidian 打开</a> · AI 与我的笔记双向同步；请保留小节标题。</p>`};result={values:fields,toZ:keys,conflicts:[]};}
      else{
        try{parsed=this.parse(oldHTML,base?Object.keys(base.fields||{}):keys);}catch(e){if(options.direction!=='obsidian')throw e;parsed={prefix:`<h1>PaperBridge · ${this.esc(r.paper.title)}</h1>`,html:{annotations:''}};}html={...parsed.html};
        for(const k of Object.keys(parsed.html)){if(k==='annotations')continue;z[k]=base?.html===oldHTML&&base.fields?.[k]?base.fields[k].z:await this.toMD(note,parsed.html[k],dir,base?.fields?.[k]?.md||fields[k]);}
        for(const k of keys){if(!base?.fields?.[k]||fields[k]!==base.fields[k].md||options.direction){const converted=await this.toHTML(note,fields[k],dir);canonical[k]=await this.toMD(note,converted,dir,fields[k]);}else canonical[k]=base.fields[k].z;}
        result=PaperBridgeSyncCore.plan(base,fields,z,canonical,options.direction);
        if(base?.annotations!==undefined&&await this.toMD(note,parsed.html.annotations,dir)!==base.annotations&&!options.direction)result.conflicts.push('原文批注（自动区被修改）');
        if(result.conflicts.length)return this.last[id]=await this.conflict(id,md,oldHTML,base,'两端同时修改或结构不一致：'+result.conflicts.join('、'));
        for(const k of result.toZ)html[k]=await this.toHTML(note,result.values[k],dir);
        html.annotations=await this.toHTML(note,PaperBridgeCore.region(md,'annotations').body,dir);
      }
      let updated=md;for(const k of keys)if(result.values[k]!==fields[k])updated=PaperBridgeSyncCore.put(updated,k,result.values[k]);
      const nextHTML=this.render(this.linkPrefix(parsed.prefix,r.relativePath),html,keys),willPush=fresh||nextHTML!==oldHTML;
      if(willPush&&this.editing(note))return {status:'editing',noteKey:note.key};
      if(h.stopped)return {status:'stopped'};
      if(await IOUtils.readUTF8(r.notePath)!==md||!fresh&&note.getNote()!==oldHTML)return {status:'changed-during-sync'};
      if(options.direction)await this.backup(id,md,oldHTML,base,'手动选择以 '+options.direction+' 为准');
      // Persist the Obsidian update first. If a crash interrupts the second write,
      // the unchanged baseline makes the next run detect and retain both versions.
      if(updated!==md)await h.atomic(r.notePath,updated,md);
      if(willPush){if(!fresh&&note.getNote()!==oldHTML)throw Error('Zotero 笔记刚被修改，已停止本轮同步');note.setNote(nextHTML);await note.saveTx({notifierData:{paperbridgeSync:true}});}
      if(!entry.zoteroNoteKey){const latest=await h.index();latest.items[id].zoteroNoteKey=note.key;await h.atomic(h.indexPath,JSON.stringify(latest,null,2));}
      const actualHTML=note.getNote(),actual=this.parse(actualHTML,keys),newFields=PaperBridgeSyncCore.fields(updated),baseline={noteKey:note.key,md:updated,html:actualHTML,fields:{},time:new Date().toISOString()};
      for(const k of keys)baseline.fields[k]={md:newFields[k],z:await this.toMD(note,actual.html[k],dir,newFields[k])};
      baseline.annotations=await this.toMD(note,actual.html.annotations,dir);store.notes[id]=baseline;await this.persist();
      return this.last[id]={status:'synced',noteKey:note.key,direction:options.direction||'both',time:baseline.time};
    }catch(e){let liveMD=md;try{if(await IOUtils.exists(r.notePath))liveMD=await IOUtils.readUTF8(r.notePath);}catch{}return this.last[id]=await this.conflict(id,liveMD,note.getNote()||oldHTML,base,String(e.message||e));}
  }
  async all(){const index=await this.host.index();const result=[];for(const id of Object.keys(index.items)){if(this.host.stopped)break;const key=id.split(':')[1];try{const item=await this.host.item(key);result.push({key,...await this.sync(item)});}catch(e){result.push({key,status:'paused',reason:String(e.message||e)});}}return result;}
  async summary(){const s=await this.state();return {available:this.available(),enabled:this.enabled(),paired:Object.values(s.notes).filter(n=>n.noteKey).length,conflicts:Object.entries(s.notes).filter(([,n])=>n.blocked).map(([key,n])=>({key,reason:n.blocked.reason,backup:n.blocked.backup})),last:this.last};}
};
