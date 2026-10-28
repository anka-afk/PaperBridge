(async()=>{
  const {root,base}=PaperBridgePathTest;
  if(!base.includes('native-path-recovery-test'))throw Error('Disposable test directory required');
  const report={ok:false,checks:[]},check=(value,label)=>{if(!value)throw Error(label);report.checks.push(label);};
  const native=PathUtils.join,cf=native(base,'state','config.json');
  const config={version:1,vaultPath:native(base,'vault'),workspacePath:native(base,'state','workspace'),noteFolder:'papers',port:23120,autoClassify:false,bidirectionalNotes:true,token:'synthetic-path-recovery-token-'.repeat(3),codexPath:native(base,'removed','codex.exe'),customOption:'synthetic-preserve'};
  for(const folder of [native(base,'vault','.obsidian'),config.workspacePath])await IOUtils.makeDirectory(folder,{createAncestors:true});
  await IOUtils.writeUTF8(cf,JSON.stringify(config));
  const preferences=new Map([['extensions.zotero.paperbridge.configPath',cf]]),timers={};
  const scope=Components.utils.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(),{sandboxName:'PaperBridge path recovery synthetic test',wantXrays:false});
  Object.assign(scope,{IOUtils,PathUtils,ChromeUtils,Ci,Services:{dirsvc:Services.dirsvc,env:Services.env,prefs:{savePrefFile(){}}},Zotero:{isWin:true,Prefs:{get:k=>preferences.get(k),set:(k,v)=>preferences.set(k,v)},debug(){},logError(){},Reader:{registerEventListener(){},unregisterEventListener(){}},Notifier:{registerObserver(){return 1},unregisterObserver(){}},Server:{Endpoints:{}},Libraries:{userLibraryID:9999},getMainWindow:()=>({setInterval:fn=>{timers.interval=fn;return 1},clearInterval(){},setTimeout:()=>2,clearTimeout(){}})}});
  try{
    for(const file of ['app/core.js','app/codex-path.js','plugin/bridge.js'])Services.scriptloader.loadSubScript(root+file,scope);
    const host=new scope.PaperBridgeHost('');await host.start();
    const recovered=JSON.parse(await IOUtils.readUTF8(cf));
    check(recovered.codexPath!==config.codexPath&&await IOUtils.exists(recovered.codexPath),'startup recovers removed binary');
    check(recovered.token===config.token&&recovered.vaultPath===config.vaultPath&&recovered.workspacePath===config.workspacePath&&recovered.customOption===config.customOption,'other configuration and local token preserved');
    check(preferences.get('extensions.zotero.codexSidebar.codexPath')===recovered.codexPath,'sidebar receives recovered path');
    check(JSON.parse(await IOUtils.readUTF8(cf+'.before-codex-path-recovery')).codexPath===config.codexPath,'original configuration backed up');
    recovered.codexPath=native(base,'another-removed-version','codex.exe');await IOUtils.writeUTF8(cf,JSON.stringify(recovered));
    timers.interval();await host.queue;
    const polled=JSON.parse(await IOUtils.readUTF8(cf));
    check(polled.codexPath===host.config.codexPath&&await IOUtils.exists(polled.codexPath),'background check repairs a later update without Better Notes');
    const raw=await IOUtils.readUTF8(cf);await host.loadConfig();check(raw===await IOUtils.readUTF8(cf),'valid path causes no configuration write loop');
    const {Subprocess}=ChromeUtils.importESModule('resource://gre/modules/Subprocess.sys.mjs');
    const proc=await Subprocess.call({command:polled.codexPath,arguments:['--version'],stderr:'pipe',environmentAppend:true});
    const text=await proc.stdout.readString(),err=await proc.stderr.readString(),exit=await proc.wait();
    check(exit.exitCode===0&&text.includes('codex-cli'),'native Zotero can launch recovered Codex');
    await host.stop();report.version=text.trim();report.ok=true;
  }catch(error){report.error=String(error.stack||error);}
  await IOUtils.writeUTF8(native(base,'report.json'),JSON.stringify(report,null,2));return report;
})()
