from pathlib import Path
import re
root = Path('src')
pattern = re.compile(r'(?<=from\s+["\'])(\.{1,2}/[^"\']*?)(?<!\.[A-Za-z0-9]+)(?=["\'])')
updated = 0
for path in root.rglob('*.ts'):
    text = path.read_text(encoding='utf-8')
    new = pattern.sub(r'\1.js', text)
    if new != text:
        path.write_text(new, encoding='utf-8')
        print('updated', path)
        updated += 1
print('done', updated)
