# Build the claude.ai-hosted copy of the game from out/ (run tools/build.sh first):
# relative paths, no import map, models as base64 text, settings from the #hash.
#   python3 tools/build-hosted.py [--out out] [--dest hosted]
# The hosted shell (tools/hosted/index.html, glb-text.js) is the page claude.ai serves;
# publish the dest folder as an artifact (index.html as the page, the rest as files).
import re,os,shutil,pathlib,json,base64,struct,sys
def arg(k,d):
    return sys.argv[sys.argv.index(k)+1] if k in sys.argv else d
HERE=pathlib.Path(__file__).resolve().parent
out=pathlib.Path(arg('--out',str(HERE.parent/'out'))).resolve(); S=pathlib.Path(arg('--dest',str(HERE.parent/'hosted'))).resolve()
keep_index=(HERE/'hosted/index.html').read_text()
glbtext=(HERE/'hosted/glb-text.js').read_text()
if S.exists(): shutil.rmtree(S)
S.mkdir(parents=True)
(S/'index.html').write_text(keep_index)
for sub in ['atelier','crafted-portal','materials','landmarks','characters','kits','props','voice']:
    if (out/sub).exists(): shutil.copytree(out/sub,S/sub)
shutil.copy(out/'style.css',S/'style.css')
for g in list(S.glob('*/*.glb')):
    (S/(str(g.relative_to(S))+'.b64.txt')).write_text(base64.b64encode(g.read_bytes()).decode()); g.unlink()
tb=HERE.parent/'node_modules/three'
def rel(frm,target):
    r=os.path.relpath(target,os.path.dirname(frm)).replace(os.sep,'/'); return r if r.startswith('.') else './'+r
def fiximports(path,s):
    def f(m):
        spec=m.group(3)
        if spec=='three': t=S/'three/build/three.module.js'
        elif spec.startswith('three/addons/'): t=S/'three/examples/jsm'/spec[13:]
        else: return m.group(0)
        return m.group(1)+m.group(2)+rel(str(path),str(t))+m.group(2)
    return re.sub(r"""((?:from|import)\s*)(['"])(three(?:/addons/[^'"]+)?)\2""",f,s)
need=set();queue=[]
def add(p):
    p=p.resolve()
    if p not in need: need.add(p); queue.append(p)
add(tb/'build/three.module.js')
for f in (out/'src').rglob('*.js'):
    s=f.read_text()
    for m in re.findall(r"from\s*['\"](three/addons/[^'\"]+)['\"]",s): add(tb/'examples/jsm'/m[13:])
    s=s.replace('location.search','window.__vlSearch')
    s=re.sub(r"(['`])/(atelier|crafted-portal|materials|landmarks|characters|kits|props|voice)/",r"\1\2/",s)
    s=re.sub(r"loader\.loadAsync\(",r"loadGlbText(loader, ",s)
    s=s.replace("await new GLTFLoader().loadAsync(","await loadGlbText(new GLTFLoader(), ")
    d=S/'src'/f.relative_to(out/'src'); d.parent.mkdir(parents=True,exist_ok=True)
    if 'loadGlbText(' in s: s="import { loadGlbText } from '"+rel(str(d),str(S/'src/glb-text.js'))+"';\n"+s
    d.write_text(fiximports(d,s))
(S/'src/glb-text.js').write_text(glbtext.replace(".replace(/\\.gltf\\.json$/, '.glb.b64.txt')",".replace(/\\.glb$/, '.glb.b64.txt')"))
while queue:
    p=queue.pop(); s=p.read_text()
    for m in re.findall(r"(?:from|import)\s*['\"]([^'\"]+)['\"]",s):
        if m.startswith('.'): add(p.parent/m)
        elif m=='three': add(tb/'build/three.module.js')
        elif m.startswith('three/addons/'): add(tb/'examples/jsm'/m[13:])
# Draco decoder (pure JS; the host does not serve .wasm) for compressed kits
(S/'draco').mkdir(exist_ok=True); shutil.copy(out/'draco/draco_decoder.js',S/'draco/draco_decoder.js')
for p in need:
    d=S/'three'/p.relative_to(tb); d.parent.mkdir(parents=True,exist_ok=True); d.write_text(fiximports(d,p.read_text()))
files=sorted(str(p.relative_to(S)) for p in S.rglob('*') if p.is_file() and p.name!='index.html')
json.dump(files,open(S/'files.json','w'),indent=0)  # the list to publish next to index.html
print(len(files))
# guard: every relative import in the hosted copy must resolve (a missing file
# makes the hosted game hang on "could not start")
bad=[(str(f.relative_to(S)),m) for f in S.rglob('*.js') for m in re.findall(r"(?:from|import)\s*['\"](\.[^'\"]+)['\"]",f.read_text(errors='ignore')) if not (f.parent/m).resolve().exists()]
if bad: raise SystemExit(f'hosted build has unresolved imports: {bad[:5]}')
