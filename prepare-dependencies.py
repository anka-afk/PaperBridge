"""Download only pinned public dependencies; never read local user configuration."""
from pathlib import Path, PurePosixPath
import hashlib,json,urllib.request

root=Path(__file__).resolve().parent
lock=json.loads((root/'dependencies.lock.json').read_text(encoding='utf-8'))
for entry in lock['files']:
    relative=PurePosixPath(entry['path'])
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError('Invalid dependency path')
    dest=root/'build/payload'/relative
    if dest.is_file() and hashlib.sha256(dest.read_bytes()).hexdigest()==entry['sha256']:
        print('Verified '+entry['path']);continue
    if not entry['url'].startswith('https://'):
        raise ValueError('HTTPS required')
    request=urllib.request.Request(entry['url'],headers={'User-Agent':'PaperBridge-build/0.2.0'})
    with urllib.request.urlopen(request,timeout=120) as response:
        content=response.read()
    if len(content)!=entry['size'] or hashlib.sha256(content).hexdigest()!=entry['sha256']:
        raise ValueError('Dependency hash mismatch: '+entry['path'])
    dest.parent.mkdir(parents=True,exist_ok=True)
    temp=dest.with_suffix(dest.suffix+'.download')
    temp.write_bytes(content);temp.replace(dest)
    print('Downloaded and verified '+entry['path'])
