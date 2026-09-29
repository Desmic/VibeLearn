"""Condition a copy of the swept portal at export scale; preserve authored source."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils.kdtree import KDTree
ROOT=Path('E:/Projects/VibeLearn/experiments/bellweather-arcade')
OUT=ROOT/'public'/'crafted-portal'
prior=bpy.context.window.scene
scene=bpy.data.scenes.new('Sunward Portal Export Repair')
bpy.context.window.scene=scene
try:
    with bpy.data.libraries.load(str(ROOT/'authoring/sunward-portal-swept.blend'),link=False) as (src,dst):
        dst.objects=[n for n in src.objects if n.startswith('Sunward swept portal')]
    assert len(dst.objects)==1
    obj=dst.objects[0];scene.collection.objects.link(obj);obj.data=obj.data.copy()
    obj.name='Sunward swept portal conditioned'
    before=[v.co.copy() for v in obj.data.vertices]
    bm=bmesh.new();bm.from_mesh(obj.data)
    # Triangulate before cleanup: the original closed n-gons yield collapsed
    # triangles at export. Welding is explicitly bounded to ten micrometres.
    bmesh.ops.triangulate(bm,faces=list(bm.faces))
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm,dist=1e-6,edges=list(bm.edges))
    bmesh.ops.triangulate(bm,faces=list(bm.faces))
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    assert all(e.is_manifold for e in bm.edges)
    assert all(f.calc_area()>=5e-10 for f in bm.faces)
    bm.to_mesh(obj.data);bm.free();obj.data.update()
    after=[v.co.copy() for v in obj.data.vertices]
    def displacement(a,b):
        tree=KDTree(len(b))
        for i,p in enumerate(b):tree.insert(p,i)
        tree.balance()
        return max(tree.find(p)[2] for p in a)
    deviation=max(displacement(before,after),displacement(after,before))
    assert deviation<=1e-5, deviation
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    formats=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
    if not formats:
        import io_scene_gltf2
        formats=[item[0] for item in io_scene_gltf2.get_format_items(scene,bpy.context)]
    assert 'GLB' in formats
    path=OUT/'sunward-portal-swept-clean.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_yup=True)
    obj.data.calc_loop_triangles()
    manifest=json.loads((OUT/'portal-swept.json').read_text(encoding='utf-8'))
    manifest.update(name='Sunward swept portal conditioned',source='authoring/repair_portal_export.py',
        baseAsset='sunward-portal-swept.glb',triangles=len(obj.data.loop_triangles),
        sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        cleanup={'weldMetres':1e-5,'maxBidirectionalVertexDistanceMetres':deviation,
                 'sourceVertices':len(before),'conditionedVertices':len(after),
                 'uvPolicy':'Preserve loop UVs and existing local AO; microscopic edge cleanup only.'})
    manifest.pop('unchangedBelowMetres',None)
    (OUT/'portal-swept-clean.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    bpy.data.libraries.write(str(ROOT/'authoring/sunward-portal-swept-clean.blend'),{scene},fake_user=True)
    print(json.dumps(manifest))
finally:
    bpy.context.window.scene=prior
