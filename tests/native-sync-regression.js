// Invoke only from a disposable profile; all paper and note content is synthetic.
(async()=>{
 const running=Zotero.PaperBridge;await running.loadConfig();
 const base=PathUtils.parent(PathUtils.parent(running.configPath));
 if(!base.includes('native-')||!running.config.token.startsWith('synthetic'))throw Error('Disposable synthetic profile required');
 const report={ok:false,checks:[]},check=(v,label)=>{if(!v)throw Error(label);report.checks.push(label);};
 try{
  await running.stop();await running.queue;
  const h=new PaperBridgeHost(running.rootURI);await h.loadConfig();h.stopped=false;
  check(h.noteSync.available(),'real Better Notes conversion is available');
  const item=new Zotero.Item('journalArticle');item.setField('title','Synthetic migration conflict regression');await item.saveTx();
  let r=await h.ensure(item),md=PaperBridgeCore.append(r.text,'方法','Obsidian-only synthetic method','synthetic_md').text;
  md=PaperBridgeSyncCore.put(md,'personal','Synthetic personal text must stay exactly.');await h.atomic(r.notePath,md,r.text);
  check((await h.noteSync.sync(item)).status==='synced','fresh paired note created');
  const idx=await h.index(),id=item.libraryID+':'+item.key,note=await Zotero.Items.getByLibraryAndKeyAsync(item.libraryID,idx.items[id].zoteroNoteKey);
  const old=note.getNote(),parsed=h.noteSync.parse(old,Object.keys(PaperBridgeSyncCore.fields(md)));
  parsed.html['方法']='<p>Zotero-only synthetic method</p>';
  note.setNote(h.noteSync.render(parsed.prefix,parsed.html,Object.keys(PaperBridgeSyncCore.fields(md))));await note.saveTx();
  const s=await h.noteSync.state();delete s.notes[id];await h.noteSync.persist();
  const before=note.getNote(),beforeMD=await IOUtils.readUTF8(r.notePath);
  for(let n=0;n<4;n++)check((await h.noteSync.sync(item)).status==='conflict','conflicting first migration remains paused '+n);
  check(note.getNote()===before,'repeated conflict never appends empty headings or rewrites Zotero');
  check(await IOUtils.readUTF8(r.notePath)===beforeMD,'repeated conflict preserves Markdown including personal text');
  const changed=PaperBridgeCore.append(beforeMD,'方法','Another synthetic edit','synthetic_second').text;await h.atomic(r.notePath,changed,beforeMD);
  check((await h.noteSync.sync(item)).status==='conflict','changed first-conflict input remains a real conflict');
  check(note.getNote()===before,'conflict-only baseline does not convert old content into a prefix');
  const wrapped='<div class="zotero-note znv1">'+before+'</div>';
  const unwrapped=h.noteSync.parse(wrapped,[]);check(unwrapped.html.personal.includes('Synthetic personal text'),'nested Zotero wrappers preserve section boundaries');
  const emptyDuplicates=before.replace('<h2>原文批注（自动）</h2>','<h2>AI · 摘要</h2><p></p><h2>AI · 方法</h2><p><br></p><h2>我的笔记</h2><p></p><h2>原文批注（自动）</h2>');
  const repaired=h.noteSync.parse(emptyDuplicates,[]),repairedHTML=h.noteSync.render(repaired.prefix,repaired.html,Object.keys(PaperBridgeSyncCore.fields(md)));
  check((repairedHTML.match(/<h2>AI · 摘要<\/h2>/g)||[]).length===1,'only empty duplicate headings are removed');
  check(repaired.html.personal===unwrapped.html.personal&&repaired.html['方法']===unwrapped.html['方法'],'repair preserves all nonempty personal and AI content exactly');
  let duplicateBlocked=false;try{h.noteSync.parse(before.replace('<h2>原文批注（自动）</h2>','<h2>AI · 方法</h2><p>Another real body</p><h2>原文批注（自动）</h2>'),[]);}catch{duplicateBlocked=true;}check(duplicateBlocked,'two nonempty copies remain a conflict');
  const firstAnnotation='<blockquote><p>Synthetic quote one</p></blockquote><p>Comment one</p><!-- Zotero annotation ANNO1234 -->',secondAnnotation='<blockquote><p>Synthetic quote two</p></blockquote><p>Comment two</p><!-- Zotero annotation ANNO5678 -->',annDir=PathUtils.parent(r.notePath);
  check(await h.noteSync.annotationsMatchSource(note,'<p>尚无批注。</p>',firstAnnotation,annDir),'empty annotation placeholder can be restored from original annotations');
  check(await h.noteSync.annotationsMatchSource(note,firstAnnotation,firstAnnotation+secondAnnotation,annDir),'a verified subset of original annotations can be completed');
  check(!await h.noteSync.annotationsMatchSource(note,firstAnnotation.replace('Comment one','Human changed comment'),firstAnnotation+secondAnnotation,annDir),'edited annotation text is preserved as a conflict');
  const convert=Zotero.BetterNotes.api.convert,original=convert.note2md;
  try{convert.note2md=async()=>'';let caught=false;try{await h.noteSync.toMD(note,'<p>Nonempty synthetic text</p>',PathUtils.parent(r.notePath));}catch{caught=true;}check(caught,'unexpected empty conversion cannot erase nonempty text');}finally{convert.note2md=original;}
  // Use an existing synthetic PDF fixture to exercise actual Zotero annotation persistence.
  const pdf=await Zotero.Attachments.importFromFile({file:PathUtils.join(base,'state','fixture.pdf'),parentItemID:item.id});
  const a=new Zotero.Item('annotation');a.libraryID=pdf.libraryID;a.parentID=pdf.id;a.annotationType='highlight';a.annotationText='Persisted synthetic annotation';a.annotationComment='Do not erase this';a.annotationColor='#ffd400';a.annotationPageLabel='1';a.annotationSortIndex='00000|000000|00000';a.annotationPosition=JSON.stringify({pageIndex:0,rects:[[40,680,220,700]]});await a.saveTx();
  const getAnnotations=pdf.getAnnotations;try{pdf.getAnnotations=()=>[];const paper=await h.paper(item);check(paper.annotations.some(x=>x.key===a.key&&x.comment==='Do not erase this'),'annotation database is read even when attachment cache is empty');}finally{pdf.getAnnotations=getAnnotations;}
  r=await h.ensure(item);const annotated=await IOUtils.readUTF8(r.notePath),paper=await h.paper(item),read=h.paper;
  try{h.paper=async()=>({...paper,annotations:[]});let caught=false;try{await h.ensure(item);}catch{caught=true;}check(caught&&await IOUtils.readUTF8(r.notePath)===annotated,'empty annotation snapshot preserves the entire existing file');}finally{h.paper=read;}
  const second=new Zotero.Item('journalArticle');second.setField('title','Synthetic lost Markdown annotations');await second.saveTx();
  try{
   h.paper=async i=>({...await read.call(h,i),annotations:paper.annotations});
   check((await h.noteSync.sync(second)).status==='synced','second fixture starts with a complete annotation pair');
   const entry=(await h.index()).items[second.libraryID+':'+second.key],target=await Zotero.Items.getByLibraryAndKeyAsync(second.libraryID,entry.zoteroNoteKey),savedHTML=target.getNote(),path=h.resolve(entry.path),text=await IOUtils.readUTF8(path),region=PaperBridgeCore.region(text,'annotations');
   await h.atomic(path,text.slice(0,region.start)+'\n尚无批注。\n'+text.slice(region.end),text);h.paper=async i=>({...await read.call(h,i),annotations:[]});
   const lost=await h.noteSync.sync(second);check(lost.status==='conflict'&&target.getNote()===savedHTML,'lost Markdown plus empty source cannot clear annotations still present in Zotero');
  }finally{h.paper=read;}
  // A real editor save removes annotation comments and adds link attributes.
  const editedItem=new Zotero.Item('journalArticle');editedItem.setField('title','Synthetic editor annotation metadata regression');await editedItem.saveTx();
  const editedPDF=await Zotero.Attachments.importFromFile({file:PathUtils.join(base,'state','fixture.pdf'),parentItemID:editedItem.id});
  const editorAnnotation=new Zotero.Item('annotation');editorAnnotation.libraryID=editedPDF.libraryID;editorAnnotation.parentID=editedPDF.id;editorAnnotation.annotationType='highlight';editorAnnotation.annotationText='Synthetic editorAnnotation quotation';editorAnnotation.annotationComment='Synthetic editorAnnotation comment';editorAnnotation.annotationColor='#ffd400';editorAnnotation.annotationPageLabel='1';editorAnnotation.annotationSortIndex='00000|000000|00000';editorAnnotation.annotationPosition=JSON.stringify({pageIndex:0,rects:[[40,680,220,700]]});await editorAnnotation.saveTx();
  check((await h.noteSync.sync(editedItem)).status==='synced','editor fixture starts with a real persisted annotation and baseline');
  const eid=editedItem.libraryID+':'+editedItem.key,ee=(await h.index()).items[eid],en=await Zotero.Items.getByLibraryAndKeyAsync(editedItem.libraryID,ee.zoteroNoteKey),ep=h.resolve(ee.path),ek=Object.keys(PaperBridgeSyncCore.fields(await IOUtils.readUTF8(ep)));
  let editable=h.noteSync.parse(en.getNote(),ek);editable.html.personal='<p>Synthetic personal findings from the Zotero editor.</p><ol><li>Keep this ordering</li></ol>';editable.html['方法']='<p>Synthetic AI method retained from Zotero.</p>';
  const editorHTML=h.noteSync.render(editable.prefix,editable.html,ek).replace(/<!--\s*Zotero annotation [A-Z0-9]{8}\s*-->/g,'').replace(/<a href=/g,'<a rel="noopener noreferrer nofollow" href=');en.setNote(editorHTML);await en.saveTx();
  const personalBefore=h.noteSync.parse(en.getNote(),ek).html.personal,oldAnnotations=h.noteSync.parse(en.getNote(),ek).html.annotations,records=h.noteSync.annotationRecords(oldAnnotations);
  check(records?.has(editorAnnotation.key),'source-link identities survive when the editor removes comment markers');
  const cache=await h.noteSync.state();cache.notes[eid].blocked={md:await IOUtils.readUTF8(ep),html:en.getNote(),backup:'synthetic-existing-conflict',reason:'Synthetic v0.3.2 metadata-only conflict',parserVersion:2};await h.noteSync.persist();
  check((await h.noteSync.sync(editedItem)).status==='synced','legacy metadata-only conflict is re-evaluated and clears without choosing a side');
  let pulled=await IOUtils.readUTF8(ep);check(PaperBridgeCore.region(pulled,'personal').body.includes('Synthetic personal findings'),'Zotero personal text reaches Obsidian automatically');check(PaperBridgeCore.region(pulled,'slot-方法').body.includes('Synthetic AI method'),'Zotero AI text reaches its Obsidian section');
  check(h.noteSync.parse(en.getNote(),ek).html.personal===personalBefore,'personal rich text in Zotero stays exactly unchanged');
  editable=h.noteSync.parse(en.getNote(),ek);en.setNote(h.noteSync.render(editable.prefix,editable.html,ek).replace(/<!--\s*Zotero annotation [A-Z0-9]{8}\s*-->/g,''));await en.saveTx();
  editorAnnotation.annotationComment='Synthetic source comment updated in the PDF reader';await editorAnnotation.saveTx();
  check((await h.noteSync.sync(editedItem)).status==='synced','legitimate PDF annotation edits are accepted after comment-marker removal');pulled=await IOUtils.readUTF8(ep);check(pulled.includes(editorAnnotation.annotationComment)&&en.getNote().includes(editorAnnotation.annotationComment),'updated source comment reaches both note copies');
  editable=h.noteSync.parse(en.getNote(),ek);editable.html.annotations=editable.html.annotations.replace('Synthetic editorAnnotation quotation','Synthetic manual alteration inside the automatic section');en.setNote(h.noteSync.render(editable.prefix,editable.html,ek).replace(/<!--\s*Zotero annotation [A-Z0-9]{8}\s*-->/g,''));await en.saveTx();
  const protectedHTML=en.getNote(),protectedMD=await IOUtils.readUTF8(ep);check((await h.noteSync.sync(editedItem)).status==='conflict','real annotation body changes still pause for review');check(en.getNote()===protectedHTML&&await IOUtils.readUTF8(ep)===protectedMD,'a real conflict preserves both complete note copies');
  const visible=await h.known(editedItem);check(visible.noteReadWarning&&visible.zoteroNote?.html===protectedHTML,'read API exposes the Zotero copy and a warning when Obsidian is stale');
  report.ok=true;
 }catch(error){report.error=String(error.message||error);report.stack=String(error.stack||'');}
 await IOUtils.writeUTF8(PathUtils.join(base,'state','sync-regression-report.json'),JSON.stringify(report,null,2));
})();
