import re, base64, mimetypes, os

ROOT = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(ROOT, path), 'r', encoding='utf-8') as f:
        return f.read()

html = read('index.html')
css = read('styles.css')
js = read('script.js')

body_match = re.search(r'<body[^>]*>(.*)</body>', html, re.S)
body = body_match.group(1)

head_extra_match = re.search(r'<link rel="icon"[^>]*>', html)
favicon_link = head_extra_match.group(0) if head_extra_match else ''

title_match = re.search(r'<title>(.*?)</title>', html, re.S)
title = title_match.group(1) if title_match else 'Lean Energy Solutions'

desc_match = re.search(r'<meta name="description" content="([^"]*)"', html)
description = desc_match.group(1) if desc_match else ''

def embed_images(text):
    def repl(m):
        prefix, path, suffix = m.group(1), m.group(2), m.group(3)
        if not path.startswith('assets/'):
            return m.group(0)
        local_path = os.path.join(ROOT, path)
        if not os.path.isfile(local_path):
            return m.group(0)
        mime = mimetypes.guess_type(local_path)[0] or 'application/octet-stream'
        with open(local_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('ascii')
        return f'{prefix}data:{mime};base64,{b64}{suffix}'
    ext = r'(?:png|jpg|jpeg|svg|webp|mp4)'
    text = re.sub(rf'(src=")([^"]+\.{ext})(")', repl, text)
    text = re.sub(rf'(href=")([^"]+\.{ext})(")', repl, text)
    text = re.sub(rf'(poster=")([^"]+\.{ext})(")', repl, text)
    return text

body = embed_images(body)
css = embed_images(css)

artifact = f'''<title>{title}</title>
{favicon_link}
<meta name="description" content="{description}">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
{css}
</style>
{body}
<script>
{js}
</script>
'''

out_path = os.path.join(ROOT, 'artifact.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(artifact)

print('artifact.html written:', os.path.getsize(out_path), 'bytes')
