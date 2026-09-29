"""Live Blender authoring for the bounded Sunward facade; original geometry.
Existing Scene is preserved. Exportable collection is separate from portal/context.
"""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path('E:/Projects/VibeLearn/experiments/bellweather-arcade')
if bpy.data.collections.get('Sunward Architecture'):
    raise RuntimeError('An atelier study already exists. Open its saved source or build in a fresh Blender file; do not duplicate over it.')
scene=bpy.data.scenes.new('Sunward Atelier Study')
bpy.context.window.scene=scene
kit=bpy.data.collections.new('Sunward Architecture');scene.collection.children.link(kit)
context=bpy.data.collections.new('Existing Portal Reference');scene.collection.children.link(context)
def linear(n):
    n=n/255
    return n/12.92 if n<=.04045 else ((n+.055)/1.055)**2.4
def material(name,colour,rough,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    rgba=tuple(linear(int(colour[i:i+2],16)) for i in (0,2,4))+(1,)
    p.inputs[0].default_value=rgba;p.inputs[1].default_value=metal;p.inputs[2].default_value=rough
    m.diffuse_color=rgba
    return m
cream=material('Atelier Porcelain','efe1c4',.50,.04)
navy=material('Atelier Indigo','223b52',.62,.10)
teal=material('Atelier Glazing','236d7a',.22,.48)
brass=material('Atelier Brass','c59a5f',.35,.68)
coral=material('Atelier Coral','cd8067',.73)
def mesh(name,verts,faces,mat,smooth=False):
    data=bpy.data.meshes.new(name);data.from_pydata([(x,-z,y) for x,y,z in verts],[],faces);data.update()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    o=bpy.data.objects.new(name,data);kit.objects.link(o);data.materials.append(mat)
    for f in data.polygons:f.use_smooth=smooth
    return o
def bevel(o,width=.04):
    b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=width;b.segments=2
    return o
def rounded_plan(cx,cz,w,d,r,n=8):
    pts=[]
    for x,z,start in [(cx+w/2-r,cz+d/2-r,0),(cx-w/2+r,cz+d/2-r,90),(cx-w/2+r,cz-d/2+r,180),(cx+w/2-r,cz-d/2+r,270)]:
        for j in range(n+1):
            a=math.radians(start+j*90/n);pts.append((x+math.cos(a)*r,z+math.sin(a)*r))
    return pts
def volume(name,plan,low,high,mat,edge=.035):
    N=len(plan);levels=[low,high];vs=[(x,y(x,z) if callable(y) else y,z) for y in levels for x,z in plan]
    fs=[tuple(range(N-1,-1,-1)),tuple(range(N,2*N))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
    o=mesh(name,vs,fs,mat)
    return bevel(o,edge) if edge else o
def block(name,cx,cy,cz,w,h,d,mat,r=.025):
    return volume(name,rounded_plan(cx,cz,w,d,min(r,w*.45,d*.45),3),cy-h/2,cy+h/2,mat,min(r,.025))
left=rounded_plan(-5.65,-3.95,7.2,4.3,.75)
volume('Left grounded plinth',left,.12,.68,navy)
volume('Left stone sill',left,.68,.96,cream)
volume('Lower curved glazing',left,.96,4.82,teal)
# Deep cream piers frame broad continuous glass; the dark reveal reads at distance.
for x in [-8.75,-6.15,-2.55]:
    volume('Tapered structural pier',rounded_plan(x,-1.93,.46,.48,.16),.13,5.08,cream)
for x in [-7.85,-7.0,-5.25,-4.3,-3.35]:
    block('Glazing mullion',x,2.95,-1.774,.036,3.85,.06,brass,.012)
for y in [1.20,4.57]:
    block('Glazing transom',-5.63,y,-1.766,5.93,.045,.06,navy,.01)
# Broad swept eave: same curve family as the portal; pronounced thickness and shadow slot.
roofplan=rounded_plan(-5.65,-3.59,7.5,5.6,1.05,12)
sweep=lambda x,z:5.08+.30*math.sin((x+9.4)/7.5*math.pi)+.10*(z+3.6)
volume('Gallery underside',roofplan,lambda x,z:sweep(x,z)-.13,sweep,navy,.035)
volume('Swept gallery edge',roofplan,sweep,lambda x,z:sweep(x,z)+.28,cream,.055)
lipplan=rounded_plan(-5.65,-3.59,7.53,5.63,1.06,12)
volume('Fine brass gallery reveal',lipplan,lambda x,z:sweep(x,z)+.065,lambda x,z:sweep(x,z)+.088,brass,.006)
upper=rounded_plan(-5.7,-3.95,6.5,3.9,.85,10)
volume('Upper shaded gallery',upper,5.35,7.74,navy)
# A long teal clerestory and vertical ceramic fins deliberately share one rhythm.
for i in range(7):
    x=-8.33+i*.87
    block('Upper glazing',x,6.58,-1.91,.78,1.78,.14,teal,.09)
    block('Upper fin',x+.43,6.58,-1.74,.065,2.02,.48,cream,.022)
crown=rounded_plan(-5.7,-3.85,7.08,4.9,1.0,12)
rise=lambda x,z:7.73+.44*math.sin((x+9.25)/7.1*math.pi)+.10*(z+3.8)
volume('Roof shadow reveal',crown,lambda x,z:rise(x,z)-.09,rise,navy,.03)
volume('Swept porcelain crown',crown,rise,lambda x,z:rise(x,z)+.32,cream,.05)
# Portal-side wall stays quiet: a rounded coral chamber, framed in porcelain.
right=rounded_plan(6.22,-4.5,3.25,3.25,.62,10)
volume('Right grounded plinth',right,.12,.68,navy)
volume('Right coral chamber',right,.68,6.18,coral)
volume('Right chamber base',right,.68,.88,cream)
block('Right inset shadow',6.22,3.4,-2.856,2.22,4.65,.12,navy,.19)
block('Right deep glazing',6.22,3.4,-2.76,1.83,4.21,.12,teal,.18)
for x in [5.26,6.22,7.18]:
    block('Right ceramic blade',x,3.45,-2.52,.10,4.68,.42,cream,.035)
rightroof=rounded_plan(6.22,-4.46,3.56,3.78,.72,10)
volume('Right chamber roof',rightroof,6.13,6.46,cream,.065)
volume('Right roof reveal',rightroof,6.08,6.14,navy,.015)
# Slender crown slats retain the conservatory identity without decorative clutter.
for i in range(6):
    x=4.96+i*.5
    block('Roof sun slat',x,6.68,-4.55,.11,.12,2.95,brass,.025)
# Reference is appended, not rebuilt or exported with the architecture.
with bpy.data.libraries.load(str(ROOT/'authoring/sunward-portal.blend'),link=False) as (src,dst):
    dst.objects=[n for n in src.objects if n=='Sunward sculpted portal']
for o in dst.objects:
    if o:
        context.objects.link(o);o.location=(1.1,4.4,.12)
# Display the actual assembly in Blender; these viewport settings are not game lighting.
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        space=area.spaces.active
        modes=[e.identifier for e in space.shading.bl_rna.properties['color_type'].enum_items]
        if 'MATERIAL' in modes:space.shading.color_type='MATERIAL'
        space.region_3d.view_location=(0,3.5,3.8)
        space.region_3d.view_distance=22
        space.region_3d.view_rotation=Vector((0,-1,.22)).to_track_quat('Z','Y')
print({'scene':scene.name,'architecture_objects':len(kit.objects),'reference_objects':len(context.objects),'preserved_scenes':[s.name for s in bpy.data.scenes]})

