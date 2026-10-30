const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../app/core.js'),S=require('../app/sync-core.js');
const annotation=(key,changes={})=>({key,text:'Synthetic quote',comment:'Synthetic comment',page:'2',uri:`zotero://open-pdf/library/items/PDF12345?page=2&annotation=${key}`,...changes});
const paper=annotations=>({key:'TEST1234',title:'Synthetic rekey fixture',annotations});
const record=a=>C.region(C.create(paper([a])),'annotations').body;

test('批注唯一内容对应时可以更新 ID，逐字保留个人区和 AI 区',()=>{
 const old=annotation('OLD12345'),next=annotation('NEW12345');
 let md=C.append(C.create(paper([old])),'方法','Synthetic AI findings','synthetic').text;
 md=S.put(md,'personal','Synthetic personal findings\n\n$e^x$');
 const updated=C.sync(md,paper([next,annotation('EXTRA123',{text:'Added quote'})]));
 assert.match(updated,/NEW12345/);assert.match(updated,/Added quote/);assert.doesNotMatch(updated,/OLD12345/);
 for(const section of ['personal','ai'])assert.equal(C.region(updated,section).body,C.region(md,section).body);
 assert.equal(C.sync(updated,paper([next,annotation('EXTRA123',{text:'Added quote'})])),updated);
});

test('ID 变化不能掩盖删除、正文评论页码 PDF 差异或无法确认的重复内容',()=>{
 const old=annotation('OLD12345'),md=C.create(paper([old]));
 const cases=[[],[annotation('NEW12345',{text:'Changed quote'})],[annotation('NEW12345',{comment:'Changed comment'})],
  [annotation('NEW12345',{page:'3'})],[annotation('NEW12345',{uri:'zotero://open-pdf/library/items/PDF99999?page=2&annotation=NEW12345'})],
  [annotation('NEW12345'),annotation('DUP12345')]];
 for(const annotations of cases)assert.throws(()=>C.sync(md,paper(annotations)),/批注列表减少/);
 const duplicates=C.create(paper([old,annotation('OLD67890')]));
 assert.throws(()=>C.sync(duplicates,paper([annotation('NEW12345'),annotation('NEW67890')])),/批注列表减少/);
 const retained=C.create(paper([old,annotation('KEEP1234')]));
 assert.throws(()=>C.sync(retained,paper([annotation('NEW12345'),annotation('KEEP1234')])),/批注列表减少/);
});

test('匹配只忽略最终回链的 ID，保留批注正文内的链接和换行内容',()=>{
 const old=annotation('OLD12345',{text:'Quote with [link](zotero://open-pdf/library/items/PDF12345?page=2&annotation=OLD12345)'});
 const next=annotation('NEW12345',{text:old.text});
 const map=C.annotationKeyMap(new Map([[old.key,record(old)]]),new Map([[next.key,record(next)]]));
 assert.equal(map.get(old.key),next.key);
 const modified={...next,text:next.text.replace('annotation=OLD12345','annotation=NEW12345')};
 assert.equal(C.annotationKeyMap(new Map([[old.key,record(old)]]),new Map([[modified.key,record(modified)]])).size,0);
 assert.match(C.sync(C.create(paper([old])).replace(/\n/g,'\r\n'),paper([next])),/NEW12345/);
});

test('Zotero 侧批注重新配对仍要求内容唯一一致',async()=>{
 const scope={PaperBridgeCore:C,PaperBridgeSyncCore:S};vm.createContext(scope);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../plugin/note-sync.js'),'utf8'),scope);
 const sync=new scope.PaperBridgeNoteSync({});sync.toMD=async(_note,body)=>body;
 const old=annotation('OLD12345'),next=annotation('NEW12345');
 sync.annotationRecords=value=>value==='old'?new Map([[old.key,record(old)]]):new Map([[next.key,record(next)]]);
 assert.equal(await sync.annotationsMatchSource({},'old','new',''),true);
 next.comment='Human edit in automatic section';
 assert.equal(await sync.annotationsMatchSource({},'old','new',''),false);
});

test('所有读取状态都返回 Zotero 当前副本，暂停状态有提示且不会修改两端',async()=>{
 const note={key:'NOTE1234',parentItemID:42,isNote:()=>true,getNote:()=>'<p>Synthetic new personal note</p>'};
 const scope={Zotero:{Items:{getByLibraryAndKeyAsync:async()=>note}},IOUtils:{exists:async()=>false}};
 vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(__dirname,'../plugin/bridge.js'),'utf8'),scope);
 const host=new scope.PaperBridgeHost('');host.config={categories:[]};host.paper=async()=>({key:'TEST1234',libraryID:1});
 host.index=async()=>({items:{'1:TEST1234':{path:'missing.md',zoteroNoteKey:note.key}}});host.resolve=p=>p;
 for(const status of [{paused:[{key:'1:TEST1234'}]},{conflicts:[{key:'1:TEST1234'}]},{}]){
  host.noteSync={summary:async()=>status};const result=await host.known({id:42,libraryID:1});
  assert.equal(result.note,null);assert.equal(result.zoteroNote.html,note.getNote());
  assert.equal(Boolean(result.noteReadWarning),Boolean(status.paused||status.conflicts));
 }
 for(const changes of [{deleted:true},{parentItemID:99},{isNote:()=>false}]){
  const saved={...note};Object.assign(note,changes);assert.equal((await host.known({id:42,libraryID:1})).zoteroNote,undefined);Object.assign(note,saved);delete note.deleted;
 }
});
