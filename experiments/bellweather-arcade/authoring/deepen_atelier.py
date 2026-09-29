"""Replace the opaque lower window volume with a shallow, visible conservatory.
Run once after refine_atelier.py. Same footprint and player boundary.
"""
import bpy,bmesh,math,ast
from pathlib import Path
ROOT=Path('E:/Projects/VibeLearn/experiments/bellweather-arcade')
kit=bpy.data.collections['Sunward Architecture']
assert bpy.context.scene.name=='Sunward Atelier Study'
assert not bpy.data.objects.get('Gallery interior floor'), 'Depth refinement already applied'
# Reuse our existing modeling functions, without re-running scene creation.
source=ast.parse((ROOT/'authoring/build_atelier.py').read_text(encoding='utf-8-sig'))
exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'<atelier helpers>','exec'))
cream=bpy.data.materials['Atelier Porcelain'];navy=bpy.data.materials['Atelier Indigo'];brass=bpy.data.materials['Atelier Brass']
glass=material('Atelier Clear Glass','addbd8',.12,.05)
clay=material('Atelier Interior Clay','b88362',.8)
mint=material('Atelier Interior Mint','6b9c92',.65)
leaf=material('Atelier Botanical Jade','347e64',.52)
leaflight=material('Atelier Botanical Lime','a6b95c',.55)
o=bpy.data.objects['Lower curved glazing'];data=o.data
bpy.data.objects.remove(o,do_unlink=True)
if data.users==0:bpy.data.meshes.remove(data)
# Actual depth, not a painted window image. Floor and reveals remain within the
# existing grounded footprint; the elevated room is not a new walkable area.
block('Gallery interior floor',-5.65,1.01,-3.91,6.60,.12,3.43,clay,.025)
block('Gallery interior back',-5.65,2.96,-5.72,6.47,3.87,.16,mint,.025)
for x in [-8.94,-2.39]:block('Gallery side return',x,2.98,-3.95,.17,3.93,3.47,navy,.025)
block('Gallery shaded ceiling',-5.65,4.78,-3.92,6.50,.13,3.49,cream,.025)
# Slender glazing panels in two deep bays. Runtime assigns alpha glass, avoiding
# costly screen-space transmission; the room geometry supplies parallax.
for x,w in [(-7.49,2.44),(-4.34,3.06)]:
    block('Clear gallery pane',x,2.86,-2.16,w,3.73,.018,glass,.005)
for x in [-7.85,-7.0,-5.25,-4.3,-3.35]:
    for o in kit.objects:
        if o.name.startswith('Glazing mullion') and abs(sum(v.co.x for v in o.data.vertices)/len(o.data.vertices)-x)<.03:
            for v in o.data.vertices:v.co.y+=.095
# Articulated rear ribs and a low continuous display bench reveal room scale.
for x in [-8.05,-6.68,-5.31,-3.94]:
    block('Interior bronze rib',x,2.93,-5.59,.043,3.58,.052,brass,.008)
block('Gallery display bench',-5.65,1.36,-4.75,5.78,.28,.64,cream,.08)
for x in [-7.6,-3.7]:block('Bench foot',x,1.15,-4.75,.2,.20,.44,navy,.015)
# A pair of compact botanical silhouettes. Closed folded leaf meshes preserve
# visible shape and correct normals without alpha-card stacks or extra textures.
def plant(cx,cz,scale):
    volume('Interior botanical vessel',rounded_plan(cx,cz,.70*scale,.67*scale,.24*scale,6),1.08,1.66,cream,.03)
    volume('Interior planting bed',rounded_plan(cx,cz,.56*scale,.53*scale,.20*scale,6),1.64,1.68,navy,0)
    for j in range(11):
        angle=j*2.399;length=scale*(1.15+.21*(j%4));width=scale*(.20+.025*(j%3));base=1.66+j*.014
        vs=[];steps=8
        for side in [0,1]:
            for k in range(steps+1):
                t=k/steps;r=length*(.1*t+.52*t*t);y=base+length*(1.20*t-.40*t*t)-side*.012
                half=width*math.sin(math.pi*t)**.7+.003
                for s in [-1,0,1]:
                    vs.append((cx+math.cos(angle)*r-math.sin(angle)*half*s,y+(.045*math.sin(math.pi*t) if s==0 else 0),cz+math.sin(angle)*r+math.cos(angle)*half*s))
        N=(steps+1)*3;fs=[]
        for side in [0,1]:
            off=side*N
            for k in range(steps):
                for q in range(2):
                    a=off+k*3+q;f=(a,a+1,a+4,a+3);fs.append(f if side==0 else f[::-1])
        outline=[k*3 for k in range(steps+1)]+[steps*3+1]+[k*3+2 for k in range(steps,-1,-1)]+[1]
        for k,a in enumerate(outline):b=outline[(k+1)%len(outline)];fs.append((a,b,b+N,a+N))
        mesh('Interior folded leaf',vs,fs,leaflight if j%4==0 else leaf,True)
plant(-7.50,-3.85,1.18);plant(-4.00,-4.00,.91)
# Light ceramic catches broad highlights; indigo stays a quiet, blue shadow mass.
p=next(n for n in cream.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs[2].default_value=.31;p.inputs[20].default_value=.26
print({'architecture_parts':len(kit.objects),'depth_refinement':'two glazed bays, real interior, folded botanical silhouettes'})
