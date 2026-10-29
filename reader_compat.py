"""Package the independent compatibility add-on without changing upstream files."""
from pathlib import Path
import json
import zipfile


def build_reader_compat(root: Path, output: Path) -> Path:
    source = root / 'reader-compat'
    manifest = json.loads((source / 'manifest.json').read_text(encoding='utf-8'))
    output.mkdir(parents=True, exist_ok=True)
    target = output / f"paperbridge-reader-compat-{manifest['version']}.xpi"
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in ['manifest.json', 'bootstrap.js', 'compat.js', 'README.md']:
            archive.write(source / name, name)
        archive.write(root / 'LICENSE', 'LICENSE')
    return target


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=Path(__file__).parent / 'dist')
    args = parser.parse_args()
    print(build_reader_compat(Path(__file__).parent, args.output))
