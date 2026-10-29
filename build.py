from pathlib import Path
import zipfile, shutil, subprocess, hashlib, json, argparse
from reader_compat import build_reader_compat
root=Path(__file__).parent
parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=root/'dist')
options=parser.parse_args()
dependencies=json.loads((root/'dependencies.lock.json').read_text(encoding='utf-8'))['files']
for dependency in dependencies:
    f=root/'build/payload'/dependency['path']
    if not f.is_file() or hashlib.sha256(f.read_bytes()).hexdigest()!=dependency['sha256']:
        raise ValueError('Missing or altered dependency; run python prepare-dependencies.py: '+dependency['path'])
payload=root/'build/payload'
plugins=payload/'plugins'
plugins.mkdir(parents=True,exist_ok=True)
reader_xpi=build_reader_compat(root,plugins)
manifest=json.loads((root/'plugin/manifest.json').read_text(encoding='utf-8'))
for field in ['id','update_url','strict_min_version','strict_max_version']:
    if not manifest.get('applications',{}).get('zotero',{}).get(field):
        raise ValueError('Zotero manifest missing '+field)
own_xpi=plugins/f"paperbridge-{manifest['version']}.xpi"
for previous in plugins.glob('paperbridge-*.xpi'):
    if previous not in [own_xpi,reader_xpi]:previous.unlink()
with zipfile.ZipFile(own_xpi,'w',zipfile.ZIP_DEFLATED) as z:
    for f in (root/'plugin').rglob('*'):
        if f.is_file():z.write(f,f.relative_to(root/'plugin').as_posix())
    z.write(root/'app/core.js','core.js')
    z.write(root/'app/sync-core.js','sync-core.js')
    z.write(root/'app/codex-path.js','codex-path.js')
    z.write(root/'app/deepseek-client.js','deepseek-client.js')
    z.write(root/'LICENSE','LICENSE')
for f in (root/'app').iterdir():
    if f.is_file():shutil.copy2(f,payload/f.name)
shutil.copy2(root/'README.md',payload/'使用说明.md')
shutil.copy2(root/'LICENSE',payload/'licenses/PaperBridge-MIT.txt')
(payload/'upstream.json').write_text(json.dumps({'project':'https://github.com/RTLiang/zotero-codex','version':'2026.299.1','sha256':hashlib.sha256((plugins/'codex-for-zotero.xpi').read_bytes()).hexdigest(),'betterNotes':{'project':'https://github.com/windingwind/zotero-better-notes','version':'3.3.3','sha256':hashlib.sha256((plugins/'better-notes-for-zotero-3.3.3.xpi').read_bytes()).hexdigest(),'source':'https://github.com/windingwind/zotero-better-notes/tree/v3.3.3'}},indent=2),encoding='utf-8')
payloadzip=root/'build/payload.zip'
public_payload=[payload/f.name for f in (root/'app').iterdir() if f.is_file()]
public_payload += [payload/'使用说明.md',payload/'upstream.json',payload/'licenses/PaperBridge-MIT.txt',own_xpi,reader_xpi]
public_payload += [payload/d['path'] for d in dependencies]
reader_guide=payload/'reader-compat/README.md'
reader_guide.parent.mkdir(parents=True,exist_ok=True)
shutil.copy2(root/'reader-compat/README.md',reader_guide)
public_payload.append(reader_guide)
for directory in ['docs']:
    for f in (root/directory).rglob('*'):
        if f.is_file():
            dest=payload/f.relative_to(root);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest);public_payload.append(dest)
with zipfile.ZipFile(payloadzip,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for f in public_payload:z.write(f,f.relative_to(payload).as_posix())
out=options.output.resolve()
out.mkdir(exist_ok=True)
exe=out/'PaperBridge-Setup.exe'
csc=Path('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe')
subprocess.run([str(csc),'/nologo','/target:winexe','/platform:anycpu','/optimize+',f'/out:{exe}',f'/resource:{payloadzip},payload.zip','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll','/reference:System.IO.Compression.dll','/reference:System.IO.Compression.FileSystem.dll',str(root/'installer/Setup.cs')],check=True)
with zipfile.ZipFile(out/'PaperBridge-Source.zip','w',zipfile.ZIP_DEFLATED) as z:
    for directory in ['app','plugin','installer','tests','docs','.github','reader-compat']:
        for f in (root/directory).rglob('*'):
            if f.is_file() and '__pycache__' not in f.parts and f.suffix!='.pyc':z.write(f,f.relative_to(root).as_posix())
    for name in ['README.md','LICENSE','build.py','reader_compat.py','prepare-dependencies.py','dependencies.lock.json','THIRD_PARTY_NOTICES.md','.gitignore']:
        z.write(root/name,name)
    z.write(payload/'upstream.json','third-party/upstream.json')
    for f in (payload/'licenses').iterdir():z.write(f,'third-party/'+f.name)
    for f in [plugins/'codex-for-zotero.xpi',plugins/'better-notes-for-zotero-3.3.3.xpi',payload/'runtime/node.exe',*list((payload/'licenses').iterdir())]:
        z.write(f,f.relative_to(root).as_posix())
shutil.copy2(root/'README.md',out/'PaperBridge 使用说明.md')
shutil.copy2(own_xpi,out/own_xpi.name)
shutil.copy2(reader_xpi,out/reader_xpi.name)
shutil.copy2(plugins/'codex-for-zotero.xpi',out/'codex-for-zotero-official.xpi')
print(json.dumps({'installer':str(exe),'size':exe.stat().st_size,'sha256':hashlib.sha256(exe.read_bytes()).hexdigest()},indent=2))
