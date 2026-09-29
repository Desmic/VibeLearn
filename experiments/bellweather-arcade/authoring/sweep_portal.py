"""Bounded silhouette study from the existing original editable portal.

Preserves existing scenes/source; deforms only above 3m. Existing UVs are retained
and local AO is rebaked on the changed surface. Blender coordinates are Z-up.
"""
import bpy, math, json, hashlib
from pathlib import Path
ROOT=Path('E:/Projects/VibeLearn/experiments/bellweather-arcade')
OUT=ROOT/'public'/'crafted-portal'
previous=bpy.context.window.scene
scene=bpy.data.scenes.new('Sunward Swept Portal Study')
bpy.context.window.scene=scene
try:
    with bpy.data.libraries.load(str(ROOT/'authoring/sunward-portal.blend'),link=False) as (src,dst):
        dst.objects=[n for n in src.objects if n=='Sunward sculpted portal']
    asset=dst.objects[0]
    assert asset and asset.type=='MESH'
    scene.collection.objects.link(asset)
    asset.name='Sunward swept portal'
    asset.data=asset.data.copy()
    original=[v.co.copy() for v in asset.data.vertices]
    # A smooth upper-left fan, not a scaled whole arch: feet and low jambs retain
    # their original positions. All changes move the upper opening outward/upward.
    def smooth(a,b,x):
        t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
    for v in asset.data.vertices:
        x,y,z=v.co
        height=smooth(3.0,6.7,z)
        left=1-smooth(-2.7,1.7,x)
        v.co.x-=1.65*height*left
        v.co.z+=1.35*height*left
        v.co.y-=.45*height*left
    asset.data.update()
    assert all((v.co-old).length<1e-8 for v,old in zip(asset.data.vertices,original) if old.z<=3.0)
    asset.select_set(True);bpy.context.view_layer.objects.active=asset
    # Copy material graphs before changing bake targets; original assets remain
    # untouched even if appended data was reused by Blender.
    image=bpy.data.images.new('Swept portal local AO',width=512,height=512,alpha=False)
    image.colorspace_settings.name='Non-Color'
    old_surfaces=[]
    for slot in asset.material_slots:
        m=slot.material.copy();slot.material=m
        output=next(n for n in m.node_tree.nodes if n.type=='OUTPUT_MATERIAL')
        old=output.inputs['Surface'].links[0].from_socket
        ao=m.node_tree.nodes.new('ShaderNodeAmbientOcclusion');ao.inputs['Distance'].default_value=1.2
        emit=m.node_tree.nodes.new('ShaderNodeEmission')
        m.node_tree.links.new(ao.outputs['Color'],emit.inputs['Color'])
        m.node_tree.links.new(emit.outputs[0],output.inputs['Surface'])
        target=m.node_tree.nodes.new('ShaderNodeTexImage');target.image=image;m.node_tree.nodes.active=target
        old_surfaces.append((m,output,old,ao,emit,target))
    scene.render.engine='CYCLES';scene.cycles.samples=24
    modes=[i.identifier for i in scene.render.bl_rna.properties['threads_mode'].enum_items]
    assert 'FIXED' in modes
    scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.bake.margin=6
    bake_types=[i.identifier for i in bpy.ops.object.bake.get_rna_type().properties['type'].enum_items]
    assert 'EMIT' in bake_types
    bpy.ops.object.bake(type='EMIT')
    for m,output,old,ao,emit,target in old_surfaces:
        m.node_tree.links.new(old,output.inputs['Surface'])
        # Preserve the original glTF occlusion group but supply the rebaked image.
        groups=[n for n in m.node_tree.nodes if n.type=='GROUP' and n.inputs.get('Occlusion')]
        assert groups
        for group in groups:m.node_tree.links.new(target.outputs['Color'],group.inputs['Occlusion'])
        m.node_tree.nodes.remove(emit);m.node_tree.nodes.remove(ao)
    image.filepath_raw=str(OUT/'swept-portal-ao.png')
    formats=[i.identifier for i in image.bl_rna.properties['file_format'].enum_items]
    assert 'PNG' in formats
    image.file_format='PNG';image.save();image.pack()
    asset.data.calc_loop_triangles()
    path=OUT/'sunward-portal-swept.glb'
    export_formats=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
    if not export_formats:
        import io_scene_gltf2
        export_formats=[item[0] for item in io_scene_gltf2.get_format_items(scene,bpy.context)]
    assert 'GLB' in export_formats
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_yup=True)
    manifest=json.loads((OUT/'portal.json').read_text(encoding='utf-8'))
    manifest.update(name='Sunward swept portal',source='authoring/sweep_portal.py',
        triangles=len(asset.data.loop_triangles),baseAsset='sunward-portal.glb',
        unchangedBelowMetres=3.0,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        bounds={'min':[min(v.co[i] for v in asset.data.vertices) for i in range(3)],
                'max':[max(v.co[i] for v in asset.data.vertices) for i in range(3)]})
    (OUT/'portal-swept.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    # Save a separate library without switching the user's active .blend file.
    bpy.data.libraries.write(str(ROOT/'authoring/sunward-portal-swept.blend'),{scene},fake_user=True)
    print(json.dumps(manifest))
finally:
    bpy.context.window.scene=previous
