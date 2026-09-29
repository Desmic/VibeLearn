"""Original Sunward entrance: authored loft, inset skins and baked local AO.

Run with the installed Blender in background mode. Coordinates in helper calls
are game X/right, Y/up, Z/front; Blender conversion happens once at mesh creation.
Outputs remain versioned experiment assets, not a new general asset pipeline.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

HERE=Path(__file__).resolve().parent
OUT=HERE.parent/'public'/'crafted-portal'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def srgb(n):
    n=n/255
    return n/12.92 if n<=.04045 else ((n+.055)/1.055)**2.4
def mat(name,hex,rough,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    colour=tuple(srgb(int(hex[i:i+2],16)) for i in (0,2,4))+(1,)
    p.inputs['Base Color'].default_value=colour
    p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    m.diffuse_color=colour
    return m
ceramic=mat('Porcelain · warm mineral','f0dec0',.48,.04)
edge=mat('Porcelain · edge','faf0d6',.37,.08)
navy=mat('Structural enamel','23394f',.59,.18)
brass=mat('Satin brass','b68b4f',.34,.72)
coral=mat('Coral inlay','c97659',.64,.04)
objects=[]

def mesh(name,verts,faces,material):
    data=bpy.data.meshes.new(name)
    data.from_pydata([(x,-z,y) for x,y,z in verts],[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    for p in data.polygons:p.use_smooth=True
    objects.append(obj);return obj

# Hand-authored centreline; the changing section below is what distinguishes
# this piece from an extruded rounded rectangle. Feet stay planted at Y=0.
anchors=[(-2.96,.10,0),(-2.98,2.20,.03),(-2.80,4.20,.14),
         (-1.98,5.85,.28),(-.38,6.61,.40),(1.23,6.27,.20),
         (2.55,5.08,.08),(3.03,2.83,.02),(3.02,.10,0)]

def curve(t):
    u=t*(len(anchors)-1);i=min(len(anchors)-2,int(u));f=u-i
    a=Vector(anchors[max(0,i-1)]);b=Vector(anchors[i]);c=Vector(anchors[i+1]);d=Vector(anchors[min(len(anchors)-1,i+2)])
    return .5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f)
def frame(t):
    c=curve(t);tangent=(curve(min(1,t+.001))-curve(max(0,t-.001))).normalized()
    normal=Vector((-tangent.y,tangent.x,0)).normalized()
    # Larger shoulder and narrow lower jambs. Depth visibly swells into an eave.
    width=.40+.22*math.sin(math.pi*t)**1.8+.075*math.sin(3*math.pi*t)
    depth=.65+.38*math.sin(math.pi*t)**3
    return c,normal,width,depth

def shell(name,t0,t1,material,back=False):
    steps=max(8,round((t1-t0)*160));sides=24;verts=[];faces=[]
    for k in range(steps+1):
        t=t0+(t1-t0)*k/steps;c,n,w,d=frame(t)
        for j in range(sides):
            a=2*math.pi*j/sides
            # Rounded rectangular profile, with a stronger bevel on front skin.
            q=math.copysign(abs(math.cos(a))**.50,math.cos(a))
            z=math.copysign(abs(math.sin(a))**.50,math.sin(a))
            p=c+n*(q*w)+Vector((0,0,z*d))
            if k in (0,steps) and (t<.001 or t>.999):p.y=max(0,p.y)
            verts.append(tuple(p))
    for k in range(steps):
        for j in range(sides):
            a=k*sides+j;b=k*sides+(j+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.append(tuple(range(sides-1,-1,-1)))
    faces.append(tuple(steps*sides+j for j in range(sides)))
    return mesh(name,verts,faces,material)

# Actual panel breaks give grazing light something to catch. They remain narrow
# enough not to read as an assemblage of independent blocks at play distance.
breaks=[0,.19,.37,.55,.73,.88,1]
for i,(a,b) in enumerate(zip(breaks,breaks[1:])):
    shell('Ceramic shell %02d'%i,a+(.0007 if i else 0),b-(.0007 if i<len(breaks)-2 else 0),ceramic)

def strip(name,offset,width,material,t0=0,t1=1,front=True,lift=.025):
    verts=[];faces=[];steps=150
    for i in range(steps+1):
        t=t0+(t1-t0)*i/steps;c,n,w,d=frame(t)
        for side in [-1,1]:
            q=offset+side*width/2
            skin=d*max(0,1-abs(q)**4)**.25
            p=c+n*(q*w)+Vector((0,0,(skin+lift)*(1 if front else -1)))
            verts.append(tuple(p))
    for i in range(steps):faces.append((i*2,i*2+1,i*2+3,i*2+2))
    obj=mesh(name,verts,faces,material)
    solid=obj.modifiers.new('Skin thickness','SOLIDIFY');solid.thickness=.025
    bevel=obj.modifiers.new('Machined edge','BEVEL');bevel.width=.013;bevel.segments=2
    return obj

# Large graphic relationships: dark structural lining, a broad ceramic edge and
# restrained warm metal. Decoration is subordinate to the sweep of the form.
strip('Recessed indigo channel',-.20,.72,navy,lift=.029)
strip('Outer ceramic return',.69,.27,edge,lift=.048)
strip('Continuous brass reveal',.39,.058,brass,lift=.043)
strip('Inner brass reveal',-.61,.054,brass,lift=.035)
strip('Crown coral insert',-.20,.51,coral,.365,.545,lift=.070)
strip('Back enamel lining',-.20,.60,navy,front=False,lift=.025)
strip('Back brass reveal',.39,.055,brass,front=False,lift=.037)

# Feet share the source profile but terminate in an explicit, low plinth.
for x in [-2.96,3.02]:
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,0,.075))
    o=bpy.context.object;o.name='Grounded ceramic foot';o.dimensions=(.96,1.50,.15)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(navy)
    b=o.modifiers.new('Foot edge','BEVEL');b.width=.06;b.segments=3
    objects.append(o)

# Apply authored surface thickness/edge conditioning before a single UV unwrap.
bpy.ops.object.select_all(action='DESELECT')
for o in objects:
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    for modifier in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
    o.select_set(False)
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.object.join();asset=bpy.context.object;asset.name='Sunward sculpted portal'
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.015)
bpy.ops.object.mode_set(mode='OBJECT')

# Bake only local crevice occlusion. Directional lighting remains real-time and
# movable: no photographed/reference lighting is baked into the colour texture.
image=bpy.data.images.new('Portal local occlusion',width=512,height=512,alpha=False)
image.colorspace_settings.name='Non-Color'
for m in asset.data.materials:
    node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;node.name='AO bake target';m.node_tree.nodes.active=node
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.bake.margin=6
bpy.ops.object.bake(type='AO')
image.filepath_raw=str(OUT/'portal-ao.png');image.file_format='PNG';image.save();image.pack()
group=bpy.data.node_groups.new('glTF Material Output','ShaderNodeTree')
group.interface.new_socket(name='Occlusion',in_out='INPUT',socket_type='NodeSocketFloat')
group.nodes.new('NodeGroupInput');group.nodes.new('NodeGroupOutput')
for m in asset.data.materials:
    node=m.node_tree.nodes.new('ShaderNodeGroup');node.node_tree=group
    m.node_tree.links.new(m.node_tree.nodes['AO bake target'].outputs['Color'],node.inputs['Occlusion'])

verts=[asset.matrix_world@v.co for v in asset.data.vertices]
# Floor-level collider data is derived from the exported shape, in game axes.
colliders=[]
for sign in [-1,1]:
    points=[v for v in verts if v.z<2.05 and v.x*sign>0]
    colliders.append({'minX':min(v.x for v in points),'maxX':max(v.x for v in points),
                      'minZ':min(-v.y for v in points),'maxZ':max(-v.y for v in points)})
asset.data.calc_loop_triangles()
manifest={'name':'Sunward sculpted portal','original':True,'tool':bpy.app.version_string,
          'coordinateSystem':'glTF Y-up, metres','triangles':len(asset.data.loop_triangles),
          'materials':len(asset.data.materials),'aoSize':[512,512],'colliders':colliders,
          'placement':{'x':1.10,'y':.12,'z':-4.40},
          'source':'authoring/build_portal.py','rights':'Original VibeLearn asset; no third-party geometry or images.'}
(OUT/'portal.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'sunward-portal.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'sunward-portal.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
print('PORTAL_RESULT '+json.dumps(manifest))
