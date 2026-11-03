"""Build an isolated Zotero profile for real Better Notes integration checks."""
from pathlib import Path
import argparse, json, shutil

parser = argparse.ArgumentParser()
parser.add_argument('--better-notes', type=Path, required=True)
parser.add_argument('--name', default='native-auto-notes')
parser.add_argument('--enabled-addons-from', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
if not args.name.startswith('native-auto-notes') or '/' in args.name or '\\' in args.name:
    raise SystemExit('Invalid test folder name')
base = root / 'build' / args.name
if (base / 'profile').exists():
    raise SystemExit('Use a fresh disposable profile for this test')
for folder in ['profile/extensions', 'data', 'state/workspace', 'vault/.obsidian', 'extension']:
    (base / folder).mkdir(parents=True, exist_ok=True)
extension = base / 'extension'
shutil.copytree(root / 'plugin', extension, dirs_exist_ok=True)
for file in ['core.js', 'sync-core.js', 'codex-path.js', 'deepseek-client.js']:
    shutil.copy2(root / 'app' / file, extension / file)
shutil.copy2(root / 'tests/native-auto-notes.js', extension / 'native-auto-notes.js')
bootstrap = (extension / 'bootstrap.js').read_text(encoding='utf-8')
bootstrap = bootstrap.replace('await PaperBridge.start();', "await PaperBridge.start();Services.scriptloader.loadSubScript(rootURI+'native-auto-notes.js');")
(extension / 'bootstrap.js').write_text(bootstrap, encoding='utf-8')
(base / 'profile/extensions/paperbridge@local.reader').write_text(str(extension), encoding='utf-8')
shutil.copy2(args.better_notes, base / 'profile/extensions/Knowledge4Zotero@windingwind.com.xpi')
if args.enabled_addons_from:
    old_base = args.enabled_addons_from.resolve().parent.parent
    if 'native-auto-notes' not in old_base.name:
        raise SystemExit('Only isolated test metadata may be reused')
    metadata = json.loads(args.enabled_addons_from.read_text(encoding='utf-8'))
    for addon in metadata['addons']:
        addon['path'] = addon['path'].replace(str(old_base), str(base))
        addon['userDisabled'] = False
        addon['active'] = True
        addon['seen'] = True
    (base / 'profile/extensions.json').write_text(json.dumps(metadata), encoding='utf-8')
config = dict(version=1, vaultPath=str(base / 'vault'), workspacePath=str(base / 'state/workspace'),
              noteFolder='papers', port=23127, autoClassify=False, autoSyncNotes=True,
              token='synthetic-auto-notes-token-' * 3, codexPath='codex.exe')
(base / 'state/config.json').write_text(json.dumps(config), encoding='utf-8')
prefs = {'extensions.zotero.dataDir': str(base / 'data'), 'extensions.zotero.useDataDir': True,
         'extensions.zotero.httpServer.port': 23127, 'extensions.zotero.paperbridge.configPath': str(base / 'state/config.json'),
         'extensions.zotero.firstRun': False, 'extensions.zotero.automaticScraperUpdates': False}
(base / 'profile/user.js').write_text('\n'.join('user_pref('+json.dumps(k)+','+json.dumps(v)+');' for k,v in prefs.items()), encoding='utf-8')
print(base)
