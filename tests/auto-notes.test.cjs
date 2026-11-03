const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path').win32;
const Core=require('../app/core.js');
function fixture(){
  const files=new Map(),statuses=new Map(),items=[],calls=[],conversions=[];
  const parse=text=>{const [header,...body]=text.split('\nBODY\n');return {meta:JSON.parse(header),content:body.join('\nBODY\n')};};
  const render=note=>JSON.stringify({$itemKey:note.key,$libraryID:note.libraryID,$version:note.version})+'\nBODY\n'+note.html;
  const api={isSyncNote:id=>statuses.has(id),getSyncStatus:id=>statuses.get(id),updateSyncStatus:(id,s)=>statuses.set(id,s),getMDStatusFromContent:parse};
  let serial=0;
  const scope={PaperBridgeCore:Core,PathUtils:{join:path.join,parent:path.dirname,filename:path.basename,split:p=>path.normalize(p).split('\\')},
    IOUtils:{exists:async p=>files.has(p),readUTF8:async p=>files.get(p),writeUTF8:async(p,t)=>files.set(p,t),makeDirectory:async()=>{},remove:async p=>files.delete(p),move:async(a,b,o)=>{if(o.noOverwrite&&files.has(b))throw Error('Exists');files.set(b,files.get(a));files.delete(a);}},
    Zotero:{isWin:true,Libraries:{userLibraryID:1},Utilities:{randomString:()=>String(++serial),Internal:{md5:s=>'hash:'+s}},
      Items:{getAll:async(lib,top,deleted)=>{assert.equal(top,false);assert.equal(deleted,false);return items;},getAsync:async id=>items.find(i=>i.id===id)},
      BetterNotes:{api:{sync:api,convert:{note2md:async(n,dir,opts)=>{conversions.push({key:n.key,opts});return render(n);}}},hooks:null}}
  };
  scope.Zotero.BetterNotes.hooks={onSyncing:async(...args)=>calls.push(args)};
  vm.createContext(scope);vm.runInContext(fs.readFileSync(require.resolve('../plugin/auto-notes.js'),'utf8'),scope);
  const host={config:{vaultPath:'C:\\vault',noteFolder:'papers'},stopped:false,noteSync:{editing:()=>false},index:async()=>({items:{}}),
    resolve:rel=>{if(rel.split(/[\\/]/).some(s=>!s||s==='..'||s==='.'||/[<>:"|?*]/.test(s))||!rel.endsWith('.md'))throw Error('Invalid path');return path.join('C:\\vault',rel);},
    atomic:async(p,t,old)=>{if(old!==undefined&&files.get(p)!==old)throw Error('Changed');files.set(p,t);}};
  const auto=new scope.PaperBridgeAutoNotes(host);
  const add=(key,extra={})=>{const n={id:items.length+1,key,libraryID:1,version:1,deleted:false,html:'<p>'+key+'</p>',isNote:()=>true,isRegularItem:()=>false,hasTag:()=>false,getNoteTitle:()=>key,getNote(){return this.html;},...extra};items.push(n);return n;};
  return {auto,host,scope,api,files,statuses,items,calls,conversions,add,render};
}
test('startup sweep registers child notes without PDF and standalone notes, excluding masters, trash and shared libraries',async()=>{
 const f=fixture(),parent=f.add('PARENT01',{isNote:()=>false,isRegularItem:()=>true,getField:()=> 'Book'});
 const child=f.add('CHILD001',{parentItemID:parent.id}),standalone=f.add('ALONE001');
 f.add('MASTER01',{hasTag:()=>true});f.add('MASTER02');f.add('DELETED1',{deleted:true});f.add('SHARED01',{libraryID:2});
 f.host.index=async()=>({items:{x:{zoteroNoteKey:'MASTER02'}}});
 const result=await f.auto.all();assert.equal(result.registered,2);assert.equal(result.paused.length,0);
 assert.match(f.statuses.get(child.id).path,/条目笔记/);assert.match(f.statuses.get(standalone.id).path,/独立笔记/);
 assert.equal(f.calls.length,1);assert.deepEqual(Array.from(f.calls[0][0],n=>n.key),['CHILD001','ALONE001']);assert.equal(f.calls[0][1].skipActive,true);
});
test('manual in-vault pairing retains its filename and conflict baseline without exporting a duplicate',async()=>{
 const f=fixture(),n=f.add('MANUAL01'),status={path:'C:\\vault\\old',filename:'RoPE.md',md5:'existing-md',noteMd5:'existing-note'};
 f.statuses.set(n.id,status);f.files.set('C:\\vault\\old\\RoPE.md','user content');
 await f.auto.all();await f.auto.all();assert.equal(f.statuses.get(n.id),status);assert.equal(f.conversions.length,0);
 assert.equal([...f.files.keys()].filter(p=>p.endsWith('.md')).length,1);
 assert.equal(JSON.parse(f.files.get(f.auto.linkPath(n))).path,'old/RoPE.md');
});
test('repeated polling preserves dirty Better Notes baselines',async()=>{
 const f=fixture(),n=f.add('REPEAT01');await f.auto.all();const status=f.statuses.get(n.id);n.html='<p>New Zotero edit</p>';
 await f.auto.all();assert.equal(f.statuses.get(n.id),status);assert.equal(f.conversions.length,1);assert.equal(f.calls.length,2);
});
test('second device registers an identical existing Markdown without replacing it',async()=>{
 const f=fixture(),n=f.add('DEVICE01');await f.auto.all();const p=path.join(f.statuses.get(n.id).path,f.statuses.get(n.id).filename),before=f.files.get(p);
 f.statuses.clear();await f.auto.all();assert.equal(f.auto.summary().registered,1);assert.equal(f.files.get(p),before);
 assert.equal(f.conversions.at(-1).opts.skipSavingImages,true);
});
test('different content on initial pairing pauses both copies and continues other notes',async()=>{
 const f=fixture(),n=f.add('CONFLICT');await f.auto.all();const p=path.join(f.statuses.get(n.id).path,f.statuses.get(n.id).filename);
 f.statuses.clear();const changed=f.files.get(p)+' user Markdown edit';f.files.set(p,changed);f.add('HEALTHY1');
 const r=await f.auto.all();assert.equal(r.registered,1);assert.equal(r.paused.length,1);assert.equal(f.files.get(p),changed);assert.equal(n.html,'<p>CONFLICT</p>');assert.equal(f.statuses.has(n.id),false);
});
test('foreign target, missing paired file and corrupt per-note mapping do not overwrite or recreate content',async()=>{
 const f=fixture(),n=f.add('FOREIGN1');const p=f.host.resolve(await f.auto.destination(n));f.files.set(p,JSON.stringify({$itemKey:'OTHER001',$libraryID:1})+'\nBODY\nForeign content');
 const a=await f.auto.all();assert.equal(a.paused.length,1);assert.equal(f.statuses.size,0);
 f.files.delete(p);await f.auto.all();f.statuses.clear();f.files.delete(p);assert.equal((await f.auto.all()).paused.length,1);assert.equal(f.files.has(p),false);
 f.files.set(f.auto.linkPath(n),'<<<<<<< HEAD');assert.equal((await f.auto.all()).paused.length,1);
});
test('out-of-vault manual mapping is preserved and not silently redirected',async()=>{
 const f=fixture(),n=f.add('OUTSIDE1'),s={path:'C:\\vault-other',filename:'note.md'};f.statuses.set(n.id,s);f.files.set('C:\\vault-other\\note.md','original');
 assert.equal((await f.auto.all()).paused.length,1);assert.equal(f.statuses.get(n.id),s);assert.equal(f.conversions.length,0);
});
test('notes being edited are retried later without an empty-list whole-library sync',async()=>{
 const f=fixture();f.add('EDITING1');f.host.noteSync.editing=()=>true;assert.equal((await f.auto.all()).registered,0);assert.equal(f.calls.length,0);assert.equal(f.files.size,0);
 f.host.noteSync.editing=()=>false;assert.equal((await f.auto.all()).registered,1);
});
test('source changing during conversion is not paired to a stale snapshot',async()=>{
 const f=fixture(),n=f.add('CHANGING');f.scope.Zotero.BetterNotes.api.convert.note2md=async note=>{const md=f.render(note);note.html+=' newer';return md;};
 await f.auto.all();assert.equal(f.statuses.size,0);assert.equal([...f.files.keys()].filter(p=>p.endsWith('.md')).length,0);
});
test('explicit opt-out and late Better Notes readiness preserve files and recover on later sweep',async()=>{
 const f=fixture();f.add('READY001');f.host.config.autoSyncNotes=false;await f.auto.all();assert.equal(f.statuses.size,0);
 f.host.config.autoSyncNotes=true;const bn=f.scope.Zotero.BetterNotes;delete f.scope.Zotero.BetterNotes;assert.equal((await f.auto.all()).available,false);
 f.scope.Zotero.BetterNotes=bn;assert.equal((await f.auto.all()).registered,1);
});
