(function(root){
  'use strict';
  const TARGET='codex-sidebar@zotero.local';
  class ReaderCompatibility{
    constructor({zotero,addonManager,getScope,timers,log=()=>{}}){Object.assign(this,{zotero,addonManager,getScope,timers,log});this.binding=null;this.stopped=true;this.checking=false;this.state={state:'waiting',message:'等待 Codex 侧栏启动',codexVersion:''};}
    status(){return {...this.state};}
    async start(){
      this.stopped=false;
      const changed=addon=>{if(addon.id===TARGET)void this.check();};
      const removed=addon=>{if(addon.id===TARGET){this.detach();this.state={state:'waiting',message:'Codex 侧栏已停用，等待重新启用',codexVersion:addon.version||''};}};
      this.listener={onInstalled:changed,onEnabled:changed,onDisabled:removed,onUninstalled:removed};
      this.addonManager.addAddonListener(this.listener);
      this.timer=this.timers.setInterval(()=>void this.check(),3000);
      await this.check();
    }
    async check(){
      if(this.stopped||this.checking)return this.status();this.checking=true;
      try{
        const addon=await this.addonManager.getAddonByID(TARGET);if(this.stopped)return this.status();
        if(!addon?.isActive||!this.zotero.CodexSidebar?.reconnect){this.detach();this.state={state:'waiting',message:'等待 Codex 侧栏启动',codexVersion:addon?.version||''};return this.status();}
        const scope=this.getScope(this.zotero.CodexSidebar.reconnect),plugin=scope?.ZoteroCodexPlugin,api=scope?.ZoteroCodexModules?.Sidebar,manager=plugin?.sidebar,proto=api?.SidebarView?.prototype;
        const refresh=this.binding?.proto===proto&&proto?.refreshContext===this.binding.refreshWrapper?this.binding.refresh:proto?.refreshContext;
        const supported=plugin?.id===TARGET&&plugin.initialized&&manager?.views?.values&&proto
          &&['refreshContext','renderSelections','renderContextAttachment','send'].every(k=>typeof proto[k]==='function')
          &&['watchReaderSelectionPopup','getLiveSelection','clearLiveSelection','consumeSelections'].every(k=>typeof manager[k]==='function')
          &&manager.selectionPopupCleanups?.add&&String(refresh).includes('resolveItemContext')&&String(proto.send).includes('getLiveSelection');
        if(!supported){this.detach();this.state={state:'unsupported',message:'新版侧栏接口发生变化，兼容补丁未启用；请更新兼容插件',codexVersion:addon.version};return this.status();}
        if(this.binding?.manager!==manager){this.detach();this.attach(manager,proto);}
        this.state={state:'active',message:'HTML/PDF 选区兼容补丁已启用',codexVersion:addon.version};
        for(const view of manager.views.values()){
          if(view.destroyed||view.running||view.creatingTask||view.contextTransitioning)continue;
          const changed=this.fixContext(view,view.context);if(changed)this.render(view);
        }
      }catch(error){this.detach();this.state={state:'error',message:'兼容补丁未启用，请查看 Zotero 错误控制台',codexVersion:this.state.codexVersion||''};this.log(error);}
      finally{this.checking=false;}
      return this.status();
    }
    readerItem(view){
      if(view.tabType!=='reader')return null;
      const details=view.body?.closest?.('item-details'),win=view.doc?.defaultView;
      const tab=details?.tabID||details?.dataset?.tabId||win?.Zotero_Tabs?.selectedID;
      const reader=this.zotero.Reader?.getByTabID?.(tab)||this.zotero.Reader?._readers?.find(r=>r.tabID===tab);
      const id=reader?.itemID||reader?._item?.id;if(!id)return null;
      return this.zotero.Items.get(id);
    }
    fixContext(view,context){
      if(!context||!this.binding)return false;const item=this.readerItem(view);if(!item)return false;
      if(item.parentItemID!==context.itemID&&item.id!==context.itemID)return false;
      if(!['text/html','application/xhtml+xml'].includes(String(item.attachmentContentType||'').toLowerCase()))return false;
      if(context.selectionAttachmentID===item.id)return false; // A newer upstream or the earlier bundled patch already supports this reader.
      const previous={context,attachmentID:context.attachmentID,pdfPath:context.pdfPath,selectionAttachmentID:context.selectionAttachmentID,hadSelection:Object.hasOwn(context,'selectionAttachmentID')};
      this.binding.contexts.set(view,previous);
      // Official versions using attachmentID for both purposes must not pass an
      // HTML attachment to PDFWorker. PDF readers and library contexts stay intact.
      context.attachmentID=item.id;context.selectionAttachmentID=item.id;context.pdfPath='';
      return true;
    }
    render(view){if(!view.destroyed){view.renderSelections();view.renderContextAttachment();}}
    attach(manager,proto){
      const owner=this,binding={manager,proto,refresh:proto.refreshContext,popup:manager.watchReaderSelectionPopup,contexts:new Map(),hooks:new Map()};
      // Cancel pre-existing popup observers, which otherwise could still clear
      // a live selection after the independent hook has been installed.
      for(const cleanup of [...manager.selectionPopupCleanups])cleanup();
      binding.refreshWrapper=async function(...args){const result=await binding.refresh.apply(this,args);if(owner.binding===binding&&result&&this.context===result&&owner.fixContext(this,result))owner.render(this);return result;};
      binding.popupWrapper=function(doc,button,id,selectionID){
        if(!doc?.defaultView||!selectionID)return;binding.hooks.get(id)?.();
        const win=doc.defaultView;
        const cleanup=()=>{win.removeEventListener?.('unload',unload);manager.selectionPopupCleanups.delete(cleanup);if(binding.hooks.get(id)===cleanup)binding.hooks.delete(id);};
        const unload=()=>{cleanup();manager.clearLiveSelection(id,selectionID);};
        binding.hooks.set(id,cleanup);manager.selectionPopupCleanups.add(cleanup);win.addEventListener('unload',unload,{once:true});
      };
      this.binding=binding;proto.refreshContext=binding.refreshWrapper;manager.watchReaderSelectionPopup=binding.popupWrapper;
    }
    detach(){
      const b=this.binding;if(!b)return;this.binding=null;
      try{if(b.proto.refreshContext===b.refreshWrapper)b.proto.refreshContext=b.refresh;if(b.manager.watchReaderSelectionPopup===b.popupWrapper)b.manager.watchReaderSelectionPopup=b.popup;
        for(const cleanup of [...b.hooks.values()])cleanup();
        for(const [view,old]of b.contexts){if(view.context!==old.context)continue;old.context.attachmentID=old.attachmentID;old.context.pdfPath=old.pdfPath;if(old.hadSelection)old.context.selectionAttachmentID=old.selectionAttachmentID;else delete old.context.selectionAttachmentID;this.render(view);}
      }catch(error){this.log(error);}b.contexts.clear();
    }
    stop(){this.stopped=true;if(this.timer)this.timers.clearInterval(this.timer);if(this.listener)this.addonManager.removeAddonListener(this.listener);this.detach();this.state={state:'disabled',message:'阅读兼容补丁已停用',codexVersion:this.state.codexVersion};}
  }
  if(typeof module==='object'&&module.exports)module.exports={ReaderCompatibility};else root.PaperBridgeReaderCompatibility=ReaderCompatibility;
})(typeof globalThis!=='undefined'?globalThis:this);
