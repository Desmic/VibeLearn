"""Condition a COPY of an untextured static GLB using Blender's UV/AO baker.

Call with INPUT_GLB and OUTPUT_GLB in the execution namespace. Does not change
the source asset or gameplay/camera geometry. Bake distance is in source metres.
This is offline local occlusion, not baked sunlight or a global-illumination claim.
"""
import bpy, json, hashlib, time, struct
from pathlib import Path

source = Path(INPUT_GLB).resolve()
output = Path(OUTPUT_GLB).resolve()
assert source != output and source.is_file()
assert not output.exists(), 'Use a new output filename; preserve prior candidates.'
raw = source.read_bytes()
assert raw[:4] == b'glTF' and struct.unpack_from('<I',raw,4)[0] == 2
json_size, chunk_type = struct.unpack_from('<II',raw,12)
assert chunk_type == 0x4E4F534A
document = json.loads(raw[20:20+json_size])
# This pilot repacks the UVs. Applying it to a textured/generated asset would
# invalidate its appearance; those need a separate AO UV channel or reprojection.
assert not document.get('images'), 'Textured input requires preserved UVs/reprojection; unsupported by this pilot.'
assert not document.get('skins') and not document.get('animations'), 'Only static architecture is supported by this pilot.'
started = time.perf_counter()
previous_scene = bpy.context.window.scene
scene = bpy.data.scenes.new('Occlusion conditioning comparison')
bpy.context.window.scene = scene
output.parent.mkdir(parents=True, exist_ok=True)

try:
    # glTF splits vertices at shading/UV seams. Reconstruct shared vertices for
    # UV packing; importing every triangle as an island wastes the bake atlas.
    bpy.ops.import_scene.gltf(filepath=str(source), merge_vertices=True)
    objects = [o for o in scene.objects if o.type == 'MESH']
    assert objects
    # Keep acquisition data independent from editable materials in other scenes.
    for o in objects:
        for slot in o.material_slots:
            if slot.material:
                slot.material = slot.material.copy()
    glass = [o for o in objects if all('Clear Glass' in m.name for m in o.data.materials)]
    opaque = [o for o in objects if o not in glass]
    # The welded copy is a bake/UV proxy only. Preserve thin source triangles,
    # split normals and silhouette in untouched export copies.
    exports = []
    for original in opaque:
        copy = original.copy()
        copy.data = original.data.copy()
        copy.name = original.name + ' conditioned export'
        scene.collection.objects.link(copy)
        copy.hide_render = True
        copy.hide_set(True)
        exports.append(copy)
    for o in scene.objects:
        o.select_set(False)
    for o in opaque:
        o.select_set(True)
    bpy.context.view_layer.objects.active = opaque[0]
    bpy.ops.object.join()
    asset = bpy.context.object
    asset.name = 'Conditioned original architecture'
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=.000001, use_centroid=False, use_sharp_edge_from_normals=True)
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.003)
    bpy.ops.object.mode_set(mode='OBJECT')
    asset.data.calc_loop_triangles()
    uv = asset.data.uv_layers.active.data
    coverage = 0.
    for triangle in asset.data.loop_triangles:
        p, q, r = [uv[i].uv for i in triangle.loops]
        coverage += abs((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x))*.5
    assert coverage > .25, f'Unusable UV bake coverage: {coverage:.3f}'
    for o in glass:
        o.hide_render = True

    image = bpy.data.images.new('Architecture local occlusion', width=1024, height=1024, alpha=False)
    image.colorspace_settings.name = 'Non-Color'
    targets, temporary, saved_links = [], [], []
    for m in asset.data.materials:
        nodes, links = m.node_tree.nodes, m.node_tree.links
        target = nodes.new('ShaderNodeTexImage')
        target.image = image
        nodes.active = target
        targets.append((m, target))
        output_node = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output)
        saved_links.append((m, output_node, output_node.inputs['Surface'].links[0].from_socket))
        ao = nodes.new('ShaderNodeAmbientOcclusion')
        ao.inputs['Distance'].default_value = 1.5
        ao.samples = 16
        emission = nodes.new('ShaderNodeEmission')
        links.new(ao.outputs['Color'], emission.inputs['Color'])
        links.new(emission.outputs[0], output_node.inputs['Surface'])
        temporary.append((m, ao, emission))

    try:
        scene.render.engine = 'CYCLES'
    except TypeError as error:
        raise RuntimeError('Cycles is required for this local conditioning experiment') from error
    scene.cycles.samples = 24
    assert 'FIXED' in [i.identifier for i in scene.render.bl_rna.properties['threads_mode'].enum_items]
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = 4
    scene.render.bake.margin = 8
    assert 'EMIT' in [i.identifier for i in bpy.ops.object.bake.get_rna_type().properties['type'].enum_items]
    bpy.ops.object.bake(type='EMIT')
    image.filepath_raw = str(output.with_suffix('.ao.png'))
    assert 'PNG' in [i.identifier for i in scene.render.image_settings.bl_rna.properties['file_format'].enum_items]
    image.file_format = 'PNG'
    image.save()
    image.pack()
    for m, node, socket in saved_links:
        m.node_tree.links.new(socket, node.inputs['Surface'])
    for m, ao, emission in temporary:
        m.node_tree.nodes.remove(ao)
        m.node_tree.nodes.remove(emission)

    group = bpy.data.node_groups.get('glTF Material Output')
    if group is None:
        group = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        group.interface.new_socket(name='Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        group.nodes.new('NodeGroupInput')
        group.nodes.new('NodeGroupOutput')
    for m, target in targets:
        node = m.node_tree.nodes.new('ShaderNodeGroup')
        node.node_tree = group
        m.node_tree.links.new(target.outputs['Color'], node.inputs['Occlusion'])
    for o in scene.objects:
        o.select_set(False)
    for o in exports:
        o.hide_set(False)
        o.hide_render = False
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        transfer = o.modifiers.new('Transfer bake UVs only', 'DATA_TRANSFER')
        transfer.object = asset
        transfer.use_loop_data = True
        transfer.data_types_loops = {'UV'}
        transfer.loop_mapping = 'POLYINTERP_NEAREST'
        transfer.layers_uv_select_src = asset.data.uv_layers.active.name
        transfer.layers_uv_select_dst = 'NAME'
        bpy.ops.object.modifier_apply(modifier=transfer.name)
        o.select_set(False)
    for o in exports:
        o.select_set(True)
    for o in glass:
        o.hide_render = False
        o.select_set(True)
    import io_scene_gltf2
    assert 'GLB' in [p[0] for p in io_scene_gltf2.get_format_items(None, bpy.context)]
    bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', use_selection=True, use_active_scene=True, export_apply=True, export_yup=True)
    record = {
        'source':str(source), 'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'output':str(output), 'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
        'blender':bpy.app.version_string, 'resolution':1024, 'distance_metres':1.5,
        'samples':24, 'threads':4, 'elapsed_seconds':round(time.perf_counter()-started,2),
        'bytes':output.stat().st_size, 'uv_coverage':round(coverage,4),
        'limits':'Welded bake proxy only; UVs transferred to untouched original geometry with Blender Data Transfer. Position/normal parity requires independent verification. No sunlight or GI bake.'
    }
    output.with_suffix('.conditioning.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
    print(json.dumps(record))
finally:
    bpy.context.window.scene = previous_scene
