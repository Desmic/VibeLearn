"""Export only the Sunward Architecture collection; preserve editable objects."""
import bpy,bmesh,json
from pathlib import Path
from mathutils import Vector
ROOT=Path('E:/Projects/VibeLearn/experiments/bellweather-arcade')
OUT=ROOT/'public'/'atelier';OUT.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
kit=bpy.data.collections.get('Sunward Architecture')
assert kit and scene.name.startswith('Sunward Atelier Study')
# Save editable assembly before generating temporary, applied export meshes.
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'authoring/sunward-atelier.blend'))
for o in scene.objects:o.select_set(False)
export_collection=bpy.data.collections.new('Atelier Export Temporary');scene.collection.children.link(export_collection)
depsgraph=bpy.context.evaluated_depsgraph_get()
copies=[]
for original in kit.objects:
    data=bpy.data.meshes.new_from_object(original.evaluated_get(depsgraph),depsgraph=depsgraph)
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
    o=bpy.data.objects.new(original.name+' export',data);export_collection.objects.link(o);o.matrix_world=original.matrix_world.copy();copies.append(o)
# Match low-level collision footprint to actual authored ground volumes.
bounds=[]
for label,predicate in [('left',lambda v:v.x<0),('right',lambda v:v.x>4)]:
    points=[o.matrix_world@v.co for o in copies for v in o.data.vertices if predicate(o.matrix_world@v.co) and (o.matrix_world@v.co).z<1.9]
    bounds.append({'name':label,'minX':min(v.x for v in points),'maxX':max(v.x for v in points),'minZ':min(-v.y for v in points),'maxZ':max(-v.y for v in points)})
# Merge by material rather than shipping 49 independent draw submissions.
groups={}
for o in copies:groups.setdefault(o.data.materials[0].name,[]).append(o)
exports=[]
for objects in groups.values():
    for o in scene.objects:o.select_set(False)
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
    o=objects[0];o.name=o.data.materials[0].name+' Surface';exports.append(o)
# The glTF exporter triangulates after joining. Do that on our temporary copies
# first, then discard collapsed triangles before they enter the shipped GLB.
# These thresholds match the independent exported-GLB check; source parts stay
# editable and untouched in the saved .blend.
removed_degenerate=0
for o in exports:
    bm=bmesh.new();bm.from_mesh(o.data)
    bmesh.ops.triangulate(bm,faces=list(bm.faces))
    collapsed=[]
    for face in bm.faces:
        points=[o.matrix_world@vert.co for vert in face.verts]
        welded={tuple(round(value*1e5) for value in point) for point in points}
        if len(welded)<3 or (points[1]-points[0]).cross(points[2]-points[0]).length_squared<1e-18:
            collapsed.append(face)
    removed_degenerate+=len(collapsed)
    if collapsed:bmesh.ops.delete(bm,geom=collapsed,context='FACES')
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(o.data);bm.free();o.data.update()
for o in scene.objects:o.select_set(False)
for o in exports:o.select_set(True)
triangles=0
for o in exports:o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
import io_scene_gltf2
enum=[p[0] for p in io_scene_gltf2.get_format_items(None,bpy.context)]
assert 'GLB' in enum
bpy.ops.export_scene.gltf(filepath=str(OUT/'sunward-atelier.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
(OUT/'atelier.json').write_text(json.dumps({'name':'Sunward Atelier Architecture','tool':bpy.app.version_string,'original':True,'colliders':bounds,'triangles':triangles,'materials':len(exports),'source':'authoring/build_atelier.py','rights':'Original VibeLearn geometry and materials; existing portal remains separate.'},indent=2),encoding='utf-8')
# Remove only generated temporary objects, leaving the authored scene untouched.
for o in list(export_collection.objects):
    data=o.data;bpy.data.objects.remove(o,do_unlink=True)
    if data.users==0:bpy.data.meshes.remove(data)
bpy.data.collections.remove(export_collection)
print({'exported_triangles':triangles,'removed_degenerate':removed_degenerate,'bounds':bounds,'bytes':(OUT/'sunward-atelier.glb').stat().st_size})

