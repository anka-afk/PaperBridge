(function(root){
  'use strict';
  async function resolve({configured='',desktopRoots=[],fallbacks=[],io}){
    const normalized=String(configured).trim().replace(/^(['"])(.*)\1$/,'$2');
    const file=async path=>{try{const s=await io.stat(path);return s.type==='regular'?s:null;}catch{return null;}};
    if(normalized&&await file(normalized))return normalized;
    const found=[];
    for(const directory of desktopRoots){
      let children=[];try{children=(await io.children(directory)).slice(0,512);}catch{}
      for(const path of [io.join(directory,'codex.exe'),...children.map(p=>io.join(p,'codex.exe'))]){
        const s=await file(path);if(s)found.push({path,modified:Number(s.lastModified)||0});
      }
    }
    found.sort((a,b)=>b.modified-a.modified||a.path.localeCompare(b.path));
    if(found.length)return found[0].path;
    for(const path of [...new Set(fallbacks)])if(path&&await file(path))return path;
    return '';
  }
  const api={resolve};if(typeof module==='object'&&module.exports)module.exports=api;else root.PaperBridgeCodexPath=api;
})(typeof globalThis!=='undefined'?globalThis:this);
