from pathlib import Path
import json,shutil,os
from reportlab.pdfgen import canvas
root=Path(__file__).resolve().parents[1]
base=root/'build/native-test'
profile=base/'profile'; data=base/'data'; vault=base/'vault'; state=base/'state'; extension=base/'extension'
for p in [profile/'extensions',data,vault/'.obsidian',state/'workspace',extension]:p.mkdir(parents=True,exist_ok=True)
shutil.copytree(root/'plugin',extension,dirs_exist_ok=True)
shutil.copy2(root/'app/core.js',extension/'core.js')
shutil.copy2(root/'app/sync-core.js',extension/'sync-core.js')
shutil.copy2(root/'app/codex-path.js',extension/'codex-path.js')
shutil.copy2(root/'app/deepseek-client.js',extension/'deepseek-client.js')
shutil.copy2(root/'tests/native-check.js',extension/'native-check.js')
bootstrap=(extension/'bootstrap.js').read_text(encoding='utf-8').replace('await PaperBridge.start();','await PaperBridge.start();Services.scriptloader.loadSubScript(rootURI+\'native-check.js\');')
(extension/'bootstrap.js').write_text(bootstrap,encoding='utf-8')
(profile/'extensions/paperbridge@local.reader').write_text(str(extension),encoding='utf-8')
config={'version':1,'vaultPath':str(vault),'workspacePath':str(state/'workspace'),'noteFolder':'papers','port':23120,'autoClassify':False,'token':'synthetic-local-test-token-'*3,'codexPath':os.environ.get('PAPERBRIDGE_CODEX',shutil.which('codex') or 'codex.exe')}
(state/'config.json').write_text(json.dumps(config),encoding='utf-8')
prefs={'extensions.zotero.dataDir':str(data),'extensions.zotero.useDataDir':True,'extensions.zotero.httpServer.port':23120,'extensions.zotero.paperbridge.configPath':str(state/'config.json'),'extensions.zotero.firstRun':False,'extensions.zotero.automaticScraperUpdates':False}
(profile/'user.js').write_text('\n'.join('user_pref('+json.dumps(k)+','+json.dumps(v)+');' for k,v in prefs.items()),encoding='utf-8')
c=canvas.Canvas(str(state/'fixture.pdf'));c.drawString(40,700,'Synthetic Bridge Study');c.drawString(40,680,'Synthetic content used only to verify the reading workflow.');c.save()
print(base)
