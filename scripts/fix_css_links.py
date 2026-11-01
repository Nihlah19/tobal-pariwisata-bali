import glob

files = glob.glob('src/pages/*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    if 'href="/src/styles/main.css"' in content:
        content = content.replace('href="/src/styles/main.css"', 'href="/src/styles/main.css?direct"')
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(content)
        print('Updated:', f)
