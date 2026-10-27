from pathlib import Path
import json,os
from reportlab.pdfgen import canvas
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
base=root/'build/native-bidi-test'
for name in ['profile','data','state/workspace','vault/.obsidian']:(base/name).mkdir(parents=True,exist_ok=True)
cfg={'version':1,'vaultPath':str(base/'vault'),'workspacePath':str(base/'state/workspace'),'noteFolder':'papers','port':23120,'autoClassify':False,'bidirectionalNotes':True,'token':'synthetic-bidi-test-token-'*3,'codexPath':os.environ.get('PAPERBRIDGE_CODEX','codex.exe')}
(base/'state/config.json').write_text(json.dumps(cfg),encoding='utf-8')
prefs={'extensions.zotero.dataDir':str(base/'data'),'extensions.zotero.useDataDir':True,'extensions.zotero.httpServer.port':23120,'extensions.zotero.paperbridge.configPath':str(base/'state/config.json'),'extensions.zotero.firstRun':False,'extensions.zotero.automaticScraperUpdates':False}
(base/'profile/user.js').write_text('\n'.join('user_pref('+json.dumps(k)+','+json.dumps(v)+');' for k,v in prefs.items()),encoding='utf-8')
c=canvas.Canvas(str(base/'state/fixture.pdf'));c.drawString(40,700,'Synthetic Two Way Note Study');c.drawString(40,680,'Only disposable test content.');c.save()
image=Image.new('RGB',(100,60),'white');ImageDraw.Draw(image).rectangle((10,10,80,40),fill='blue');image.save(base/'state/fixture.png')
print(base)
