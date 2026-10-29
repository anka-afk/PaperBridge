const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const C=require('../app/core.js');const S=require('../app/sync-core.js');
const paper={title:'Synthetic annotated paper',key:'TEST1234',authors:[],annotations:[{key:'ANNO1234',text:'Original passage',comment:'Keep this comment',uri:'zotero://test'}]};
test('启动读取为空或只返回部分批注时，保留原有批注而不清空',()=>{
 const md=C.create(paper),personal=C.region(md,'personal').body;
 assert.throws(()=>C.sync(md,{...paper,annotations:[]}),/批注列表减少/);
 assert.match(md,/Keep this comment/);assert.equal(C.region(md,'personal').body,personal);
 const more={...paper,annotations:[...paper.annotations,{key:'ANNO5678',text:'Second passage'}]};
 const extended=C.sync(md,more);assert.match(extended,/Second passage/);assert.match(extended,/Keep this comment/);
 assert.throws(()=>C.sync(extended,paper),/批注列表减少/);
});
test('只有冲突记录的首次迁移状态不会许可覆盖另一端内容',()=>{
 const p=S.plan({blocked:{reason:'first conflict'}},{方法:'Obsidian content',personal:''},{方法:'Zotero content',personal:''},{方法:'Obsidian content',personal:''});
 assert.deepEqual(p.conflicts,['方法']);assert.deepEqual(p.toZ,[]);assert.equal(p.values.方法,'Obsidian content');
});
test('批注读取使用已落盘数据，不把附件的空缓存当成没有批注',async()=>{
 const rows=[{key:'ANNO1234',text:'Persisted passage',comment:'Persisted comment',pageLabel:'2',attachmentKey:'PDF12345'}];
 let queried=false;const scope={PaperBridgeCore:C,Zotero:{DB:{queryAsync:async(sql,args)=>{assert.match(sql,/itemAnnotations/);assert.deepEqual([...args],[42]);queried=true;return rows;}},Items:{getAsync:async()=>[{id:9,key:'PDF12345',attachmentContentType:'application/pdf',getAnnotations:()=>[]}]},CreatorTypes:{getID:()=>1},Collections:{get:()=>null}}};
 vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(__dirname,'../plugin/bridge.js'),'utf8'),scope);
 const host=new scope.PaperBridgeHost('');
 const item={id:42,key:'TEST1234',libraryID:1,getAttachments:()=>[9],getCollections:()=>[],getCreators:()=>[],getField:k=>k==='title'?'Synthetic paper':''};
 const result=await host.paper(item);assert.equal(queried,true);assert.equal(result.annotations.length,1);assert.equal(result.annotations[0].comment,'Persisted comment');assert.match(result.annotations[0].uri,/PDF12345\?page=2&annotation=ANNO1234/);
});
test('单篇论文批注不完整时暂停该篇，其他论文仍能继续批量同步',async()=>{
 const items=['TEST0001','TEST0002','TEST0003'].map(key=>({key,isRegularItem:()=>true})),scope={Zotero:{logError(){},Libraries:{userLibraryID:1},Items:{getAll:async()=>items}}};
 vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(__dirname,'../plugin/bridge.js'),'utf8'),scope);
 const host=new scope.PaperBridgeHost(''),updated=[];host.loadConfig=async()=>true;host.paper=async()=>({pdfID:1});host.autoClassifyLater=()=>{};
 host.ensure=async item=>{if(item.key==='TEST0002')throw Error('Incomplete annotation list');updated.push(item.key);};
 const result=await host.call('sync_library');assert.deepEqual(updated,['TEST0001','TEST0003']);assert.equal(result.synced,2);assert.equal(result.paused.length,1);assert.equal(result.paused[0].key,'TEST0002');
});
