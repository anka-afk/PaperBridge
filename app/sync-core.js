(function(root){
  'use strict';
  const C=typeof module==='object'&&module.exports?require('./core.js'):root.PaperBridgeCore;
  const clean=s=>String(s||'').replace(/<!-- pb:entry:[a-zA-Z0-9_-]+ -->\s*/g,'').replace(/\r\n/g,'\n').trim();
  function formatting(md,reference=''){
    // Zotero's rich-text editor stores code but not the fence language. Keep
    // the source language for unchanged code blocks, and restore wiki links
    // escaped by the CommonMark exporter outside literal code.
    const languages=new Map();const fence=/^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^\1[ \t]*$/gm;let m;
    while((m=fence.exec(reference)))if(m[2].trim())languages.set(m[3],m[2]);
    let out=String(md).replace(fence,(all,mark,lang,body)=>!lang.trim()&&languages.has(body)?mark+languages.get(body)+'\n'+body+mark:all);
    out=out.split(/(`{3,}[\s\S]*?`{3,}|~{3,}[\s\S]*?~{3,}|`+[^`]*`+)/g).map((part,i)=>i%2?part:part.replace(/\\\[\\\[([^\n]*?)\\?\]\\?\]/g,'[[$1]]')).join('');return out;
  }
  function fields(text){const ai=C.region(text,'ai').body,out={};for(const section of C.SECTIONS){const name='slot-'+section;if(ai.includes(`<!-- pb:${name}:start -->`))out[section]=C.region(ai,name).body;}out.personal=C.region(text,'personal').body;return out;}
  function put(text,key,value){if(/<!--\s*pb:/i.test(value))throw Error('同步内容中包含保留的保护标记');const name=key==='personal'?'personal':'slot-'+key;const r=C.region(text,name);const ids=key==='personal'?[]:r.body.match(/<!-- pb:entry:[a-zA-Z0-9_-]+ -->/g)||[];return text.slice(0,r.start)+'\n'+[...ids,value.trim()].filter(Boolean).join('\n')+'\n'+text.slice(r.end);}
  function plan(base,md,z,canonical,direction){const values={...md},toZ=[],conflicts=[];const keys=direction==='obsidian'?Object.keys(md):[...new Set([...Object.keys(md),...Object.keys(z)])];for(const k of keys){const old=base?.fields?.[k];if(direction==='obsidian'){toZ.push(k);continue;}if(!old&&k in md&&!(k in z)){toZ.push(k);continue;}if(!(k in md)||!(k in z)){conflicts.push(k);continue;}if(direction==='zotero'){values[k]=z[k];continue;}if(!old){if(canonical[k]!==z[k])conflicts.push(k);continue;}const m=md[k]!==old.md,n=z[k]!==old.z;if(m&&n){if(canonical[k]===z[k])continue;conflicts.push(k);}else if(n)values[k]=z[k];else if(m)toZ.push(k);}return {values,toZ,conflicts};}
  const api={clean,formatting,fields,put,plan};if(typeof module==='object'&&module.exports)module.exports=api;else root.PaperBridgeSyncCore=api;
})(globalThis);
