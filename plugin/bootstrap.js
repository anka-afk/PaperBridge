var PaperBridge;
async function startup({rootURI}){await Zotero.uiReadyPromise;for(const file of ['core.js','sync-core.js','note-sync.js','bridge.js'])Services.scriptloader.loadSubScript(rootURI+file);PaperBridge=new PaperBridgeHost(rootURI);Zotero.PaperBridge=PaperBridge;await PaperBridge.start();}
async function shutdown(){await PaperBridge?.stop();delete Zotero.PaperBridge;PaperBridge=null;}
function install(){}
function uninstall(){}
