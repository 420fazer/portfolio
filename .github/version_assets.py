"""Version local CSS and JS references in assembled HTML using file contents."""
import hashlib
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

root = Path(sys.argv[1]).resolve()
# Only quoted href/src attributes in link/script tags, not arbitrary page text.
tags = re.compile(r'<(?:link|script)\b[^>]*>', re.I)
attrs = re.compile(r'(\b(?:href|src)\s*=\s*)(["\'])(.*?)\2', re.I)

def version(match, page):
    url = urlsplit(match[3])
    if url.scheme or url.netloc or url.path.startswith('/') or not url.path.endswith(('.css', '.js')):
        return match[0]
    target = (page.parent / url.path).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        raise ValueError(f'Missing or out-of-tree asset: {page}: {url.path}')
    digest = hashlib.sha256(target.read_bytes()).hexdigest()[:16]
    query = [(k, v) for k, v in parse_qsl(url.query, keep_blank_values=True) if k != 'v']
    query.append(('v', digest))
    return match[1] + match[2] + urlunsplit(('', '', url.path, urlencode(query), url.fragment)) + match[2]

for page in sorted(root.rglob('*.html')):
    if root / 'preview' in page.parents:
        continue
    html = page.read_text(encoding='utf-8')
    updated = tags.sub(lambda tag: attrs.sub(lambda m: version(m, page), tag[0]), html)
    page.write_text(updated, encoding='utf-8')
    print(f'Versioned {page.relative_to(root)}')
