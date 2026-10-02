"""Build a runtime asset kit from a kit manifest (Blender 4.2+ / 5.x).

Reusable for any kit: reads <kit>.kit.json, imports the source glTF files,
normalises them (one object per variant, origin at the base centre, transforms
applied, shared materials, textures resized, colour variants baked), tags every
object with its semantic role and exports one GLB plus a runtime index JSON.

Game code only ever asks for roles ("tree.blossom", "grass.tuft"). Swapping the
source library later means editing the manifest, not the game.

Run inside Blender:
    import runpy; runpy.run_path(r".../build_kit.py", init_globals={"KIT": r".../nature-meadow.kit.json", "REPO": r"E:/Projects/VibeLearn"})
"""
import bpy, bmesh, json, os, re, colorsys
import numpy as np
from mathutils import Vector

KIT = globals().get("KIT")
REPO = globals().get("REPO")
OUT = globals().get("OUT")  # folder for <kit>.glb and <kit>.json
man = json.load(open(KIT, encoding="utf-8"))
src_dir = os.path.join(REPO, man["source"]["localPath"])
OUT = OUT or os.path.join(REPO, "experiments", "bellweather-arcade", "public", "kits")
os.makedirs(OUT, exist_ok=True)

# fresh scene; the user's own scenes are left alone
name = "Kit_" + man["kit"]
old = bpy.data.scenes.get(name)
if old:
    for o in list(old.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new(name)
bpy.context.window.scene = scene
kitcol = bpy.data.collections.new(name)
scene.collection.children.link(kitcol)
lc = bpy.context.view_layer.layer_collection.children[kitcol.name]
bpy.context.view_layer.active_layer_collection = lc
bpy.ops.outliner.orphans_purge(do_recursive=True)

base = lambda n: re.sub(r"\.\d{3}$", "", n)


def import_file(stem):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(src_dir, stem + ".gltf"))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in new:
        if o.type != "MESH":
            continue
    # bake parent transforms, then join into one object
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    for o in new:
        if o != obj and o.name in bpy.data.objects:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # origin at base centre
    ws = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    lo = Vector((sum(v.x for v in ws) / 8, sum(v.y for v in ws) / 8, min(v.z for v in ws)))
    obj.data.transform(__import__("mathutils").Matrix.Translation(-lo))
    obj.location = (0, 0, 0)
    return obj


is_normal = lambda img: base(img.name).lower().endswith(("_normal", "_nor", "_nrm"))

# canonical materials: one per source texture, drop normal maps
canon = {}


def canonical(mat):
    key = base(mat.name)
    if key in canon:
        return canon[key]
    mat.name = key
    if man.get("dropNormalMaps") and mat.use_nodes:
        nt = mat.node_tree
        for n in list(nt.nodes):
            if n.type == "NORMAL_MAP" or (n.type == "TEX_IMAGE" and n.image and is_normal(n.image)):
                nt.nodes.remove(n)
    canon[key] = mat
    return mat


def mat_image(mat):
    if not mat.use_nodes:
        return None
    for n in mat.node_tree.nodes:
        if n.type == "TEX_IMAGE" and n.image and not is_normal(n.image):
            return n
    return None


def shifted_image(img, v, tag):
    nm = base(img.name) + "@" + tag
    if nm in bpy.data.images:
        return bpy.data.images[nm]
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    rgb = px[:, :3]
    mx, mn = rgb.max(1), rgb.min(1)
    d = mx - mn + 1e-6
    r, g, b = rgb[:, 0], rgb[:, 1], rgb[:, 2]
    hh = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    s = np.where(mx > 0, d / (mx + 1e-6), 0)
    vv = mx
    if v.get("mode") == "target":
        # recolour around a target hue, keeping each pixel's offset from the
        # image's mean hue (weighted by saturation and alpha) so detail survives
        wgt = s * px[:, 3] + 1e-6
        ang = hh * 2 * np.pi
        mean = (np.arctan2((np.sin(ang) * wgt).sum(), (np.cos(ang) * wgt).sum()) / (2 * np.pi)) % 1
        off = ((hh - mean + .5) % 1) - .5
        hh = (v["hue"] + off * .6) % 1
    else:
        hh = (hh + v["hue"]) % 1
    s = np.clip(s * v.get("sat", 1), 0, 1)
    vv = np.clip(vv * v.get("val", 1) + v.get("lift", 0) * (1 - vv), 0, 1)
    i = np.floor(hh * 6).astype(int) % 6
    f = hh * 6 - np.floor(hh * 6)
    p, q, t = vv * (1 - s), vv * (1 - f * s), vv * (1 - (1 - f) * s)
    out = np.zeros_like(rgb)
    for k, (a, bb, c) in enumerate([(vv, t, p), (q, vv, p), (p, vv, t), (p, q, vv), (t, p, vv), (vv, p, q)]):
        m = i == k
        out[m, 0], out[m, 1], out[m, 2] = a[m], bb[m], c[m]
    px[:, :3] = out
    new = bpy.data.images.new(nm, w, h, alpha=True)
    new.pixels[:] = px.ravel()
    new.pack()
    return new


def variant_material(mat, vname):
    key = mat.name + "@" + vname
    if key in bpy.data.materials:
        return bpy.data.materials[key]
    v = man["variants"][vname]
    node = mat_image(mat)
    if not node or base(node.image.name) not in v["images"]:
        return mat
    m2 = mat.copy()
    m2.name = key
    mat_image(m2).image = shifted_image(node.image, v, vname)
    return m2


def thinned_copy(obj, lod):
    """Distance version of a model: keep the trunk, keep only a share of the
    leaf cards (each card a separate face island) and grow the kept cards a
    little so the crown keeps its mass. Works for card foliage of any library."""
    import random
    rnd = random.Random(hash(obj.name) & 0xffff)
    foliage = {k for k, sl in enumerate(obj.material_slots) if sl.material and re.search(lod.get("foliage", "Leaf|Leaves|Grass|Flowers"), sl.material.name)}
    if not foliage:
        return None
    low = obj.copy()
    low.data = obj.data.copy()
    low.name = obj.name + "~lod1"
    kitcol.objects.link(low)
    bm = bmesh.new()
    bm.from_mesh(low.data)
    bm.faces.ensure_lookup_table()
    seen, drop, grow = set(), [], []
    for f in bm.faces:
        if f in seen or f.material_index not in foliage:
            continue
        island, stack = [], [f]
        seen.add(f)
        while stack:
            g = stack.pop()
            island.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h not in seen and h.material_index in foliage:
                        seen.add(h)
                        stack.append(h)
        (grow if rnd.random() < lod.get("keep", 0.4) else drop).append(island)
    k = lod.get("grow", 1.25)
    for island in grow:
        vs = {v for f in island for v in f.verts}
        c = sum((v.co for v in vs), Vector()) / len(vs)
        for v in vs:
            v.co = c + (v.co - c) * k
    bmesh.ops.delete(bm, geom=[f for isl in drop for f in isl], context="FACES")
    bm.to_mesh(low.data)
    bm.free()
    # simplify the bark (trunk and branches) too: decimate only its vertices
    vg = low.vertex_groups.new(name="bark")
    bark = [v.index for p in low.data.polygons if p.material_index not in foliage for v in [low.data.vertices[i] for i in p.vertices]]
    if bark:
        vg.add(sorted(set(bark)), 1.0, "REPLACE")
        mod = low.modifiers.new("lod", "DECIMATE")
        mod.ratio = lod.get("bark", 0.3)
        mod.vertex_group = "bark"
        bpy.context.view_layer.objects.active = low
        with bpy.context.temp_override(object=low, active_object=low):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    low.vertex_groups.clear()
    low.data.calc_loop_triangles()
    low["tris"] = len(low.data.loop_triangles)
    return low


def soften_foliage_shade(obj, amount):
    """Source foliage bakes dark ambient occlusion into vertex colours, which reads
    muddy under the painted lighting. Lift it toward white by `amount` (0-1)."""
    if not amount or not obj.data.color_attributes:
        return
    pat = re.compile(man.get("lod", {}).get("foliage", "Leaf|Leaves"))
    leafy = {k for k, sl in enumerate(obj.material_slots) if sl.material and pat.search(sl.material.name)}
    ca = obj.data.color_attributes[0]
    if not leafy or ca.domain != "CORNER":
        return
    for poly in obj.data.polygons:
        if poly.material_index in leafy:
            for li in poly.loop_indices:
                c = ca.data[li].color
                ca.data[li].color = (c[0] + (1 - c[0]) * amount, c[1] + (1 - c[1]) * amount, c[2] + (1 - c[2]) * amount, c[3])


graded = set()


def grade_all():
    gr = man.get("grade")
    if not gr:
        return
    for img in list(bpy.data.images):
        if not img.size[0] or img.name in graded or "@" in img.name or is_normal(img) or img.name in ("Render Result", "Viewer Node"):
            continue
        px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
        rgb = px[:, :3]
        lum = (rgb * np.array([.2126, .7152, .0722], dtype=np.float32)).sum(1, keepdims=True)
        rgb[:] = np.clip((lum + (rgb - lum) * gr.get("sat", 1)) * gr.get("val", 1), 0, 1)
        img.pixels[:] = px.ravel()
        img.pack()
        graded.add(img.name)


index = {"kit": man["kit"], "version": man["version"], "styleFamily": man["styleFamily"], "source": man["source"], "roles": {}}
cache = {}
for role, spec in man["roles"].items():
    entries = []
    for i, stem in enumerate(spec["files"]):
        if stem not in cache:
            cache[stem] = import_file(stem)
            grade_all()
            soften_foliage_shade(cache[stem], man.get("foliageShade", 0))
            for slot in cache[stem].material_slots:
                slot.material = canonical(slot.material)
        src = cache[stem]
        obj = src.copy()
        obj.data = src.data.copy()
        kitcol.objects.link(obj)
        if spec.get("variant"):
            for slot in obj.material_slots:
                slot.material = variant_material(slot.material, spec["variant"])
        obj.name = f"{role}#{i}"
        ws = [Vector(c) for c in obj.bound_box]
        height = max(v.z for v in ws)
        radius = max(max(abs(v.x), abs(v.y)) for v in ws)
        obj.data.calc_loop_triangles()
        tris = len(obj.data.loop_triangles)
        obj["role"], obj["variantIndex"], obj["height"], obj["radius"], obj["footprint"] = role, i, round(height, 3), round(radius, 3), spec.get("footprint", 0)
        obj.location.x = len(index["roles"]) * 12
        obj.location.y = i * 12
        entry = {"node": obj.name, "source": stem, "height": round(height, 3), "radius": round(radius, 3), "tris": tris}
        lod = man.get("lod")
        if lod and tris >= lod.get("minTris", 2500):
            low = thinned_copy(obj, lod)
            if low:
                low["role"], low["variantIndex"], low["lod"] = role, i, 1
                entry["lod1"] = {"node": low.name, "tris": low["tris"], "distance": lod.get("distance", 16)}
        entries.append(entry)
    index["roles"][role] = {"tier": spec.get("tier"), "footprint": spec.get("footprint", 0), "variant": spec.get("variant"), "items": entries}

# drop the un-copied import originals
for o in cache.values():
    bpy.data.objects.remove(o, do_unlink=True)

# texture budget
tmax = man.get("textureMax", {})
for img in bpy.data.images:
    if not img.size[0]:
        continue
    lim = tmax.get(base(img.name).split("@")[0], tmax.get("default", 1024))
    w, h = img.size
    if max(w, h) > lim:
        sc = lim / max(w, h)
        img.scale(max(1, int(w * sc)), max(1, int(h * sc)))
        img.pack()

# the kit objects sit at the origin at export (the grid layout was for viewing)
for o in scene.objects:
    o.location = (0, 0, 0)

glb = os.path.join(OUT, man["kit"] + ".glb")
bpy.ops.object.select_all(action="DESELECT")
for o in scene.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_active_scene=True, use_active_collection=True, use_selection=False, export_extras=True,
                          export_image_format="WEBP", export_image_quality=88, export_apply=True,
                          export_yup=True, export_texcoords=True, export_normals=True, export_materials="EXPORT",
                          export_draco_mesh_compression_enable=man.get("draco", True), export_draco_mesh_compression_level=6,
                          export_draco_position_quantization=14, export_draco_normal_quantization=10,
                          export_draco_texcoord_quantization=12, export_draco_color_quantization=10)
index["glb"] = man["kit"] + ".glb"
index["bytes"] = os.path.getsize(glb)
index["materials"] = sorted({s.material.name for o in scene.objects for s in o.material_slots if s.material})
json.dump(index, open(os.path.join(OUT, man["kit"] + ".json"), "w", encoding="utf-8"), indent=1)
for o in scene.objects:
    pass
print("kit", glb, index["bytes"], "roles", len(index["roles"]), "objects", len(scene.objects), "materials", len(index["materials"]))
