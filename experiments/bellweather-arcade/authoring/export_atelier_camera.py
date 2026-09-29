"""Export invisible per-part camera geometry; render asset stays unchanged."""
import bpy,bmesh,json
from pathlib import Path
ROOT=Path('E:/Projects/VibeLearn/experiments/bellweather-arcade')
OUT=ROOT/'public'/'atelier'
kit=bpy.data.collections['Sunward Architecture'];scene=bpy.context.scene
temporary=bpy.data.collections.new('Atelier Camera Temporary');scene.collection.children.link(temporary)
for o in scene.objects:o.select_set(False)
parts=[];triangles=0
try:
    for original in kit.objects:
        data=original.data.copy()
        bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
        o=bpy.data.objects.new(original.name+' Camera',data);temporary.objects.link(o)
        o.matrix_world=original.matrix_world.copy();o.select_set(True);parts.append(o)
        data.calc_loop_triangles();triangles+=len(data.loop_triangles)
    import io_scene_gltf2
    assert 'GLB' in [p[0] for p in io_scene_gltf2.get_format_items(None,bpy.context)]
    bpy.ops.export_scene.gltf(filepath=str(OUT/'sunward-atelier-camera.glb'),export_format='GLB',use_selection=True,export_apply=False,export_yup=True)
    manifest=json.loads((OUT/'atelier.json').read_text(encoding='utf-8'))
    manifest['cameraProxy']={'file':'sunward-atelier-camera.glb','parts':len(parts),'triangles':triangles,'source':'authoring/export_atelier_camera.py','approximation':'Authored surfaces without edge bevels, per-part bounds. Invisible camera-only geometry.'}
    (OUT/'atelier.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print({'camera_parts':len(parts),'camera_triangles':triangles,'camera_bytes':(OUT/'sunward-atelier-camera.glb').stat().st_size})
finally:
    for o in list(temporary.objects):
        data=o.data;bpy.data.objects.remove(o,do_unlink=True)
        if data.users==0:bpy.data.meshes.remove(data)
    bpy.data.collections.remove(temporary)

