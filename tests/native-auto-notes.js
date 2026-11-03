// Load only from tests/prepare-auto-notes-native.py's disposable profile.
(async()=>{
 const running=Zotero.PaperBridge;await running.loadConfig();
 if(!running.config.token.startsWith('synthetic-auto-notes-')||!running.configPath.includes('native-auto-notes'))throw Error('Disposable profile required');
 const report={ok:false,checks:[]},check=(v,s)=>{if(!v)throw Error(s);report.checks.push(s);};
 const wait=ms=>new Promise(resolve=>Zotero.getMainWindow().setTimeout(resolve,ms));
 try{
  for(let i=0;i<90&&!running.autoNotes.available();i++)await wait(500);
  check(running.autoNotes.available(),'real Better Notes API loaded');
  await running.stop();await running.queue;
  const host=new PaperBridgeHost(running.rootURI);await host.loadConfig();host.stopped=false;
  const settle=async predicate=>{for(let i=0;i<30;i++){await host.autoNotes.all();if(await predicate())return true;await wait(500);}return false;};
  const parent=new Zotero.Item('book');parent.setField('title','Synthetic book without a PDF');await parent.saveTx();
  const child=new Zotero.Item('note');child.parentID=parent.id;child.setNote('<div data-schema-version="9"><h1>Native child</h1><p>Original text</p><p><span class="math">$x^2+y^2$</span></p><table><tr><td>A</td><td>B</td></tr></table></div>');await child.saveTx();
  const standalone=new Zotero.Item('note');standalone.setNote('<div data-schema-version="9"><h1>Native standalone</h1><p>Independent text</p></div>');await standalone.saveTx();
  const master=new Zotero.Item('note');master.parentID=parent.id;master.addTag('PaperBridge 双向同步');master.setNote('<p>Master must be excluded</p>');await master.saveTx();
  const original=child.getNote(),r=await host.autoNotes.all();check(r.registered===2,'child without PDF and standalone note automatically registered');
  const api=Zotero.BetterNotes.api.sync,s=api.getSyncStatus(child.id),file=PathUtils.join(s.path,s.filename);
  let md=await IOUtils.readUTF8(file);check(md.includes('Original text')&&md.includes('x^2+y^2')&&md.includes('|'),'text, formula and table exported');check(child.getNote()===original,'first export preserves source rich text');check(!api.isSyncNote(master.id),'master note excluded from whole-file engine');
  child.setNote(child.getNote().replace('Original text','Updated in Zotero'));await child.saveTx();
  check(await settle(async()=> (await IOUtils.readUTF8(file)).includes('Updated in Zotero')),'Zotero edit automatically reaches Markdown');
  md=await IOUtils.readUTF8(file);await IOUtils.writeUTF8(file,md.replace('Updated in Zotero','Updated in Obsidian'));
  check(await settle(async()=>child.getNote().includes('Updated in Obsidian')),'Markdown edit automatically reaches Zotero');
  for(let i=0;i<30&&Zotero.BetterNotes.data.sync.lock;i++)await wait(100);
  const beforeStatus=JSON.stringify(api.getSyncStatus(child.id));await host.autoNotes.all();check(JSON.stringify(api.getSyncStatus(child.id))===beforeStatus,'unchanged poll does not reset baseline');
  // Existing manually chosen filenames are adopted without duplication.
  const standaloneStatus=api.getSyncStatus(standalone.id),oldPath=PathUtils.join(standaloneStatus.path,standaloneStatus.filename),renamed=PathUtils.join(standaloneStatus.path,'manually-selected.md');
  await IOUtils.move(oldPath,renamed,{noOverwrite:true});api.updateSyncStatus(standalone.id,{...standaloneStatus,filename:'manually-selected.md'});
  await host.autoNotes.all();check((await host.autoNotes.readLink(standalone)).link.path.endsWith('/manually-selected.md'),'existing manual path adopted');
  // Catch the real engine's conflict UI so automated testing does not choose a side.
  const hooks=Zotero.BetterNotes.hooks,show=hooks.onShowSyncDiff;let conflicts=0;
  try{
   hooks.onShowSyncDiff=async()=>{conflicts++;};
   md=await IOUtils.readUTF8(file);const edited=md.replace('Updated in Obsidian','Conflicting Markdown');await IOUtils.writeUTF8(file,edited);
   child.setNote(child.getNote().replace('Updated in Obsidian','Conflicting Zotero'));await child.saveTx();const html=child.getNote();
   check(await settle(async()=>conflicts>0),'simultaneous changes reach Better Notes conflict handling');check(child.getNote()===html&&await IOUtils.readUTF8(file)===edited,'conflicting copies preserved');
  }finally{hooks.onShowSyncDiff=show;}
  // A new device with no baseline must not overwrite the existing export.
  api.removeSyncNote(child.id);const preserved=await IOUtils.readUTF8(file);const migrated=await host.autoNotes.all();
  check(migrated.paused.some(p=>p.key===child.key)&&!api.isSyncNote(child.id),'different first pairing pauses without choosing a winner');check(await IOUtils.readUTF8(file)===preserved,'migration preserves edited Markdown');
  report.ok=true;
 }catch(e){report.error=String(e.message||e);report.stack=String(e.stack||'');}
 await IOUtils.writeUTF8(PathUtils.join(PathUtils.parent(running.configPath),'auto-notes-report.json'),JSON.stringify(report,null,2));
 Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit);
})();
