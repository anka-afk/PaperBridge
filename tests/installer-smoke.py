"""Run the real Windows installer only in disposable, explicitly isolated paths."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import tempfile
import zipfile


installer = Path(sys.argv[1]).resolve()
repository = Path(__file__).resolve().parents[1]
version = json.loads((repository / 'plugin/manifest.json').read_text(encoding='utf-8'))['version']
compat_version = json.loads((repository / 'reader-compat/manifest.json').read_text(encoding='utf-8'))['version']
expected = {
    f'paperbridge-{version}.xpi',
    f'paperbridge-reader-compat-{compat_version}.xpi',
    'better-notes-for-zotero-3.3.3.xpi',
    'codex-for-zotero.xpi',
}

with tempfile.TemporaryDirectory(prefix='paperbridge-installer-test-') as temporary:
    base = Path(temporary).resolve()
    app, state, home, vault = [base / name for name in ['app', 'state', 'codex-home', 'vault']]
    (vault / '.obsidian').mkdir(parents=True)
    home.mkdir()
    codex = base / 'codex.exe'
    codex.write_bytes(b'Synthetic path fixture; never executed.')
    original_config = 'model = "synthetic-preserved-model"\n'
    (home / 'config.toml').write_text(original_config, encoding='utf-8')
    command = [str(installer), '--no-ui', '--install-dir', str(app), '--state-dir', str(state),
               '--codex-home', str(home), '--vault', str(vault), '--codex', str(codex)]
    for target in [app, state, home, vault, codex]:
        assert target.is_relative_to(base)
    subprocess.run(command, check=True, timeout=90)
    plugin_dir = app / 'plugins'
    assert {p.name for p in plugin_dir.glob('*.xpi')} == expected
    initial = json.loads((state / 'config.json').read_text(encoding='utf-8'))
    assert initial['vaultPath'] == str(vault)
    assert initial['codexPath'] == str(codex)
    assert original_config.strip() in (home / 'config.toml').read_text(encoding='utf-8')
    assert (app / 'reader-compat/README.md').is_file()
    for name in expected:
        with zipfile.ZipFile(plugin_dir / name) as archive:
            assert archive.testzip() is None
            json.loads(archive.read('manifest.json'))
    pinned = json.loads((repository / 'dependencies.lock.json').read_text(encoding='utf-8'))['files']
    for dependency in pinned:
        assert hashlib.sha256((app / dependency['path']).read_bytes()).hexdigest() == dependency['sha256']

    old_files = {'paperbridge-0.0.0.xpi': b'Synthetic older bridge',
                 'paperbridge-reader-compat-0.0.0.xpi': b'Synthetic older compatibility add-on',
                 'codex-for-zotero-paperbridge.xpi': b'Synthetic older bundled fork'}
    for name, content in old_files.items():
        (plugin_dir / name).write_bytes(content)
    unrelated = plugin_dir / 'unrelated-plugin.xpi'
    unrelated.write_bytes(b'Synthetic unrelated file')
    subprocess.run(command, check=True, timeout=90)
    assert {p.name for p in plugin_dir.glob('*.xpi')} == expected | {unrelated.name}
    for name, content in old_files.items():
        assert (plugin_dir / 'archive' / name).read_bytes() == content
    assert unrelated.read_bytes() == b'Synthetic unrelated file'
    upgraded = json.loads((state / 'config.json').read_text(encoding='utf-8'))
    assert upgraded['token'] == initial['token']
    toml = (home / 'config.toml').read_text(encoding='utf-8')
    assert original_config.strip() in toml
    assert toml.count('[mcp_servers.paperbridge]') == 1
    assert (home / 'config.toml.paperbridge-backup').is_file()

print('PASS: first install, four plugins, pinned dependencies, guide, upgrade archive, token and Codex settings preservation')
