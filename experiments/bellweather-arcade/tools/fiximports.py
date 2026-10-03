import re,pathlib
for f in pathlib.Path('out/src').rglob('*.js'):
    s=f.read_text()
    s=re.sub(r"""^import ['"]\./style\.css['"];?""","",s,flags=re.M)
    s=re.sub(r"""((?:from|import)\s*\(?\s*)(['"])(\.{1,2}/[^'"]+?)\2""",lambda m:m.group(1)+m.group(2)+(m.group(3) if re.search(r'\.\w+$',m.group(3)) else m.group(3)+'.js')+m.group(2),s)
    f.write_text(s)
