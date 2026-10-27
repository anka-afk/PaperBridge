// Runs only in an explicitly prepared disposable Zotero profile.
(async()=>{const host=Zotero.PaperBridge;const base=PathUtils.parent(host.configPath);let result;
try {
 const item=new Zotero.Item('journalArticle');item.setField('title','Fictional Bridge Study');item.setField('abstractNote','A synthetic study of durable assistant memories.');item.setCreators([{firstName:'Example',lastName:'Researcher',creatorType:'author'}]);await item.saveTx();
 const pdf=await Zotero.Attachments.importFromFile({file:PathUtils.join(base,'fixture.pdf'),parentItemID:item.id});
 const a=new Zotero.Item('annotation');a.libraryID=pdf.libraryID;a.parentID=pdf.id;a.annotationType='highlight';a.annotationText='Synthetic highlight for verification.';a.annotationComment='Synthetic comment';a.annotationColor='#ffd400';a.annotationPageLabel='1';a.annotationSortIndex='00000|000000|00000';a.annotationPosition=JSON.stringify({pageIndex:0,rects:[[40,680,220,700]]});await a.saveTx();
 const first=await host.serial(()=>host.ensure(item));let note=await IOUtils.readUTF8(first.notePath);note=note.replace('<!-- pb:personal:start -->','<!-- pb:personal:start -->\nSynthetic personal content: keep exactly.');await IOUtils.writeUTF8(first.notePath,note);
 const save=await host.call('save_note',{key:item.key,section:'方法',markdown:'Synthetic AI explanation.'},'native_one');
 const duplicate=await host.call('save_note',{key:item.key,section:'方法',markdown:'Synthetic AI explanation.'},'native_one');
 await host.call('set_reading_mode',{key:item.key,mode:'精读复现'});
 const moved=await host.call('classify_paper',{key:item.key,category:host.config.categories[0]});
 const after=await IOUtils.readUTF8(moved.notePath);if(!after.includes('Synthetic personal content: keep exactly.')||!after.includes('Synthetic highlight for verification.')||!after.includes('Synthetic AI explanation.'))throw Error('Native note content mismatch');
 const text=await host.call('get_paper_text',{key:item.key,maxPages:1});
 result={ok:true,zotero:Zotero.version,key:item.key,saved:save.saved,duplicate:duplicate.duplicate,personalPreserved:true,annotationsSynced:true,category:moved.category,textExtracted:typeof text.text==='string'&&text.text.includes('Synthetic'),pdfPages:text.totalPages};
}catch(e){result={ok:false,error:String(e),stack:e.stack};}
await IOUtils.writeUTF8(PathUtils.join(base,'native-report.json'),JSON.stringify(result,null,2));})();
