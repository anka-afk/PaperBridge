var ReaderCompat,ReaderCompatMenus=new Map();
function addReaderCompatMenu(win){const doc=win.document,parent=doc.getElementById('menu_ToolsPopup');if(!parent||ReaderCompatMenus.has(win))return;const item=doc.createXULElement('menuitem');item.id='paperbridge-reader-compat-status';item.setAttribute('label','阅读兼容补丁状态…');item.addEventListener('command',()=>{const s=ReaderCompat.status();Zotero.alert(win,'PaperBridge Reader Compatibility',s.message+'\nCodex: '+(s.codexVersion||'未启动'));});parent.append(item);ReaderCompatMenus.set(win,item);}
async function startup({rootURI}){
 await Zotero.uiReadyPromise;Services.scriptloader.loadSubScript(rootURI+'compat.js');
 const {AddonManager}=ChromeUtils.importESModule('resource://gre/modules/AddonManager.sys.mjs'),win=Zotero.getMainWindow();
 ReaderCompat=new PaperBridgeReaderCompatibility({zotero:Zotero,addonManager:AddonManager,getScope:fn=>Components.utils.getGlobalForObject(fn),timers:{setInterval:(fn,ms)=>win.setInterval(fn,ms),clearInterval:id=>win.clearInterval(id)},log:error=>Zotero.logError(error)});
 Zotero.PaperBridgeReaderCompat={status:()=>ReaderCompat.status(),recheck:()=>ReaderCompat.check()};await ReaderCompat.start();for(const w of Zotero.getMainWindows())addReaderCompatMenu(w);
}
function shutdown(){ReaderCompat?.stop();for(const item of ReaderCompatMenus.values())item.remove();ReaderCompatMenus.clear();delete Zotero.PaperBridgeReaderCompat;ReaderCompat=null;}
function onMainWindowLoad({window}){addReaderCompatMenu(window);}
function onMainWindowUnload({window}){ReaderCompatMenus.get(window)?.remove();ReaderCompatMenus.delete(window);}
function install(){}
function uninstall(){}
