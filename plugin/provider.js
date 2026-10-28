var PaperBridgeProvider=class{
  constructor(host){this.host=host;this.options=null;this.jobs=new Map();this.views=new Set();this.drafts=new Map();}
  folder(){return PathUtils.parent(this.host.configPath);}
  async init(){
    this.settingsPath=PathUtils.join(this.folder(),'provider-settings.json');this.secretPath=PathUtils.join(this.folder(),'deepseek-secret.json');
    let value={};if(await IOUtils.exists(this.settingsPath))value=JSON.parse(await IOUtils.readUTF8(this.settingsPath));this.options=PaperBridgeDeepSeek.settings(value);
    const win=Zotero.getMainWindow();this.client=new PaperBridgeDeepSeek.Client({fetch:(...args)=>win.fetch(...args),Decoder:win.TextDecoder});
  }
  async hasKey(){return IOUtils.exists(this.secretPath);}
  crypt(){return Cc['@mozilla.org/security/sdr;1'].getService(Ci.nsISecretDecoderRing);}
  async key(){if(!await this.hasKey())throw Error('请先填写并保存 DeepSeek Key');try{return this.crypt().decryptString(JSON.parse(await IOUtils.readUTF8(this.secretPath)).encrypted);}catch{throw Error('本机无法解密已保存的 Key，请重新填写');}}
  async configure(values,key=''){
    if(this.jobs.size)throw Error('请先停止当前回答，再切换模式或设置');
    const next=PaperBridgeDeepSeek.settings({...this.options,...values});
    if(key){if(key.length<10||key.length>500||/[\s\x00-\x1f]/.test(key))throw Error('Key 格式不正确，请检查是否包含空格');const encrypted=this.crypt().encryptString(key);await this.host.atomic(this.secretPath,JSON.stringify({version:1,encrypted}));await IOUtils.setPermissions(this.secretPath,0o600);}
    await this.host.atomic(this.settingsPath,JSON.stringify(next,null,2));this.options=next;for(const view of this.views)view.applySettings();return {saved:true,hasKey:await this.hasKey()};
  }
  async forgetKey(){if(this.jobs.size)throw Error('请先停止当前回答');if(await this.hasKey())await IOUtils.remove(this.secretPath);for(const view of this.views)view.applySettings();}
  async paper(item){while(item&&!item.isRegularItem())item=item.parentItemID?await Zotero.Items.getAsync(item.parentItemID):null;if(!item||item.libraryID!==Zotero.Libraries.userLibraryID)throw Error('请选择个人文库中的论文');return this.host.paper(item);}
  historyPath(paper){if(!/^[A-Z0-9]{8}$/.test(paper.key))throw Error('论文标识无效');return PathUtils.join(this.folder(),'deepseek-chats',String(paper.libraryID),paper.key+'.json');}
  async history(paper){const p=this.historyPath(paper);if(!await IOUtils.exists(p))return [];const rows=JSON.parse(await IOUtils.readUTF8(p));if(!Array.isArray(rows))throw Error('本地对话记录格式异常');return rows;}
  async persist(paper,history){await this.host.atomic(this.historyPath(paper),JSON.stringify(history.slice(-100),null,2));}
  async context(paper){
    if(!this.options.includePaper)return null;
    const result={title:paper.title,authors:paper.authors,date:paper.date,abstract:(paper.abstract||'').slice(0,10000),itemURI:paper.itemURI,pdfURI:paper.pdfURI,selection:paper.selection||null,annotations:paper.annotations.slice(0,20)};
    if(this.options.includeText&&paper.pdfID){const r=await Zotero.PDFWorker.getFullText(paper.pdfID,30,true);result.text=String(r.text||'').slice(0,48000);result.totalPages=r.totalPages;result.extractedPages=r.extractedPages;result.textMayBeTruncated=r.totalPages>r.extractedPages||String(r.text||'').length>48000;}
    return result;
  }
  async send(paper,input,history,onDelta){
    const id=paper.libraryID+':'+paper.key;if(this.jobs.has(id))throw Error('这篇论文已有回答正在生成');
    const controller=new (Zotero.getMainWindow().AbortController)(),win=Zotero.getMainWindow();this.jobs.set(id,controller);let timedOut=false;
    const timer=win.setTimeout(()=>{timedOut=true;controller.abort();},180000);
    try{
      const key=await this.key(),context=await this.context(paper),messages=PaperBridgeDeepSeek.messages(history,input,context);
      const answer=await this.client.complete({key,model:this.options.model,thinking:this.options.thinking,messages,signal:controller.signal,onDelta});
      if(!answer.trim())throw Error('DeepSeek 没有返回正文，请重试');
      const turn=[{id:Zotero.Utilities.randomString(20),role:'user',content:input},{id:Zotero.Utilities.randomString(20),role:'assistant',content:answer,model:this.options.model}];
      const saved=[...history,...turn];await this.persist(paper,saved);
      if(paper.pdfID)this.host.selections.delete(paper.pdfID);return saved;
    }catch(error){if(timedOut)throw Error('DeepSeek 回答超时，请缩小问题范围或稍后重试');throw error;}
    finally{win.clearTimeout(timer);this.jobs.delete(id);}
  }
  stop(paper){this.jobs.get(paper.libraryID+':'+paper.key)?.abort();}
  async check(){const win=Zotero.getMainWindow(),controller=new win.AbortController(),timer=win.setTimeout(()=>controller.abort(),20000);try{return await this.client.checkKey(await this.key(),controller.signal);}finally{win.clearTimeout(timer);}}
  shutdown(){for(const controller of this.jobs.values())controller.abort();this.jobs.clear();for(const view of this.views)view.destroy();this.views.clear();}
};
