"""Build the downloadable Claude Desktop bundle from the checked-in sources."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent
output = root.parents[1] / 'assets/downloads/ask-nacho.mcpb'
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', compression=ZIP_DEFLATED) as archive:
    for name in ('manifest.json', 'server/index.js'):
        info = ZipInfo(name, (2020, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, (root / name).read_bytes())
print(output)
