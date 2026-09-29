"""One focused live refinement after first in-game inspection."""
import bpy,math
from mathutils import Vector
kit=bpy.data.collections['Sunward Architecture']
if any(o.name=='Upper ceramic ribbon' for o in kit.objects):
    raise RuntimeError('This study has already been refined. Use the saved source; do not apply the deformation twice.')
# Recess the glass behind the structural piers, giving real reveal depth.
for o in kit.objects:
    if o.name=='Lower curved glazing':
        for v in o.data.vertices:
            if v.co.y<3.0:v.co.y+=.43*max(0,min(1,(3.0-v.co.y)/1.2))
    elif o.name.startswith(('Glazing mullion','Glazing transom')):
        for v in o.data.vertices:v.co.y+=.30
    elif o.name.startswith('Upper glazing'):
        for v in o.data.vertices:v.co.y+=.11
# Pull the crown upward toward the left, giving a clean, purposeful wing silhouette.
for o in kit.objects:
    if o.name in ['Roof shadow reveal','Swept porcelain crown']:
        for v in o.data.vertices:
            x=v.co.x
            v.co.z+=.70*math.sin(max(0,min(1,(-x-2.0)/7.3))*math.pi*.5)
# A coherent ceramic ribbon beneath the upper glazing supplies a broad quiet surface.
# Reuse existing modeled sill profile, rather than writing another geometric primitive.
source=bpy.data.objects['Left stone sill']
ribbon=source.copy();ribbon.data=source.data.copy();ribbon.name='Upper ceramic ribbon';kit.objects.link(ribbon)
for v in ribbon.data.vertices:
    v.co.x=-5.65+(v.co.x+5.65)*.92
    v.co.y=3.95+(v.co.y-3.95)*.94
    v.co.z=5.40+(v.co.z-.68)*1.8
# Opaque metallic teal remains stylized glazing; don't claim optical transmission.
m=next(m for m in bpy.data.materials if m.name=='Atelier Glazing')
p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs[1].default_value=.62;p.inputs[2].default_value=.18;p.inputs[20].default_value=.45
# Deliberate oblique viewport for checking depth, not a substitute for gameplay review.
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        s=area.spaces.active;s.region_3d.view_location=(0,3.5,4.1);s.region_3d.view_distance=22
        s.region_3d.view_rotation=Vector((-.22,-1,.18)).to_track_quat('Z','Y')
# Extend the upper structural enclosure to the revised roof underside.
o=bpy.data.objects['Upper shaded gallery']
for v in o.data.vertices:
    if v.co.z>7.7:
        x=v.co.x;z=-v.co.y
        v.co.z=7.73+.44*math.sin((x+9.25)/7.1*math.pi)+.10*(z+3.8)-.08+.70*math.sin(max(0,min(1,(-x-2.0)/7.3))*math.pi*.5)
print({'refined_objects':len(kit.objects)})

