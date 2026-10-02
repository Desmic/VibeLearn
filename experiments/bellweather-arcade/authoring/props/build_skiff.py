"""Sky skiff generator (Blender 4.2+ / 5.x): a small flying boat, built from
parameters so other islands (or other games) can make their own boats.

Output: one GLB with named parts the game drives:
  Hull   - planked wooden hull with gunwale, bench and keel (vertex colours)
  Mast   - mast + boom + rigging
  Sail   - the sail (the game makes it glow when the skiff wakes)
  Fins   - side sky-fins; FinGlow - their glowing edges
  Core   - glowing crystal under the hull (wakes with the sail)
  Bell   - little brass bell on the bow (Bellweather's mark)
  Rudder
Empties: LanternMount (stern hook), Seat (where the rider sits).
Axes: bow along +X, up +Y in the game (Blender +Z up, exported Y-up).

Run inside Blender:
  import runpy; runpy.run_path(r".../build_skiff.py", init_globals={"OUT": r".../public/props/skiff.glb"})
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

P = dict(
    length=2.5, beam=0.95, depth=0.5, sheer_bow=0.34, sheer_stern=0.2, stations=22, section=13,
    wood=(0.62, 0.42, 0.28), wood_dark=(0.42, 0.27, 0.19), wood_light=(0.78, 0.58, 0.4),
    cloth=(0.96, 0.93, 0.85), stripe=(0.45, 0.78, 0.72), brass=(0.85, 0.68, 0.36), glow=(0.55, 0.95, 0.85),
    mast_h=1.9, mast_x=-0.05,
)
P.update(globals().get("PARAMS", {}))
OUT = globals().get("OUT")

scene_name = "Prop_skiff"
old = bpy.data.scenes.get(scene_name)
if old:
    for o in list(old.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new(scene_name)
bpy.context.window.scene = scene
col = bpy.data.collections.new(scene_name)
scene.collection.children.link(col)
bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children[col.name]


def material(name, color, emissive=None, vcol=False, strength=1.5):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = 0.85
    if vcol:
        a = nt.nodes.new("ShaderNodeVertexColor")
        a.layer_name = "Col"
        nt.links.new(a.outputs["Color"], bsdf.inputs["Base Color"])
    if emissive:
        bsdf.inputs["Emission Color"].default_value = (*emissive, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


M_WOOD = material("SkiffWood", (1, 1, 1), vcol=True)
M_CLOTH = material("SkiffCloth", (1, 1, 1), vcol=True)
M_BRASS = material("SkiffBrass", P["brass"])
M_ROPE = material("SkiffRope", (0.55, 0.45, 0.35))
M_GLOW = material("SkiffGlow", P["glow"], emissive=P["glow"], strength=1.2)


def new_obj(name, bm, mats, parent=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    if parent:
        o.parent = parent
    for p in me.polygons:
        p.use_smooth = True
    return o


def paint(bm, fn):
    lay = bm.loops.layers.color.get("Col") or bm.loops.layers.color.new("Col")
    for f in bm.faces:
        for l in f.loops:
            c = fn(l.vert.co, f)
            l[lay] = (*c, 1)


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


L, B, D = P["length"], P["beam"], P["depth"]


def station(t):
    """half-beam, keel depth below sheer, sheer height at hull fraction t (0 stern .. 1 bow)"""
    body = math.sin(math.pi * min(1, max(0, t * 0.96 + 0.02))) ** 0.55
    w = B / 2 * body * (1 - 0.35 * max(0, t - 0.7) / 0.3)
    d = D * (0.35 + 0.65 * body)
    sheer = P["sheer_stern"] * (1 - t) ** 3 + P["sheer_bow"] * t ** 3
    return max(w, 0.015), d, sheer


# ---------------- Hull: lofted U sections, solidified into a shell
bm = bmesh.new()
S, N = P["stations"], P["section"]
grid = []
for i in range(S + 1):
    t = i / S
    x = -L / 2 + t * L
    w, d, sheer = station(t)
    row = []
    for j in range(N + 1):
        th = -math.pi / 2 + math.pi * j / N
        y = w * math.sin(th)
        z = sheer - d * (abs(math.cos(th)) ** 1.3)
        row.append(bm.verts.new((x, y, z)))
    grid.append(row)
for i in range(S):
    for j in range(N):
        bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
# close the transom (stern) with a fan
c0 = bm.verts.new((-L / 2, 0, station(0)[2] - station(0)[1] * 0.4))
for j in range(N):
    bm.faces.new((grid[0][j + 1], grid[0][j], c0))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)


def hull_colour(co, f):
    # planks: bands by height with a thin dark seam, darker toward the keel
    s = station((co.x + L / 2) / L)
    rel = (s[2] - co.z) / max(s[1], 1e-3)
    band = int(rel * 6)
    base = P["wood"] if band % 2 else P["wood_light"]
    seam = abs(rel * 6 - round(rel * 6)) < 0.06
    c = lerp3(base, P["wood_dark"], 0.55 if seam else 0)
    return lerp3(c, P["wood_dark"], min(1, max(0, rel - 0.6)) * 0.8)


paint(bm, hull_colour)
hull = new_obj("Hull", bm, [M_WOOD])
sol = hull.modifiers.new("shell", "SOLIDIFY")
sol.thickness = 0.045
sol.offset = 1

# gunwale rail along the sheer, both sides
bm = bmesh.new()
for side in (-1, 1):
    pts = []
    for i in range(S + 1):
        t = i / S
        w, d, sheer = station(t)
        pts.append(Vector((-L / 2 + t * L, side * w, sheer + 0.02)))
    prev = None
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        dirv = (b - a).normalized()
        n = Vector((0, 0, 1)).cross(dirv).normalized() * 0.035
        up = Vector((0, 0, 0.035))
        quad = [a - n - up, a + n - up, a + n + up, a - n + up, b - n - up, b + n - up, b + n + up, b - n + up]
        vs = [bm.verts.new(q) for q in quad]
        for k in range(4):
            bm.faces.new((vs[k], vs[(k + 1) % 4], vs[4 + (k + 1) % 4], vs[4 + k]))
paint(bm, lambda co, f: P["wood_dark"])
rail = new_obj("Rail", bm, [M_WOOD], hull)

# bench seat
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1)
bmesh.ops.scale(bm, vec=(0.34, B * 0.78, 0.05), verts=bm.verts)
bmesh.ops.translate(bm, vec=(-0.55, 0, station(0.3)[2] - 0.12), verts=bm.verts)
paint(bm, lambda co, f: P["wood_light"])
bench = new_obj("Bench", bm, [M_WOOD], hull)

# keel fin
bm = bmesh.new()
kv = [(-L * 0.42, 0, -D * 0.75), (L * 0.35, 0, -D * 0.85), (L * 0.1, 0, -D * 1.05), (-L * 0.3, 0, -D * 0.98)]
vs = [bm.verts.new(v) for v in kv]
bm.faces.new(vs)
bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.04)
paint(bm, lambda co, f: P["wood_dark"])
keel = new_obj("Keel", bm, [M_WOOD], hull)

# ---------------- Bell on the bow (Bellweather's mark)
bm = bmesh.new()
prof = [(0.0, 0.0), (0.075, 0.0), (0.07, 0.02), (0.05, 0.07), (0.04, 0.11), (0.012, 0.13), (0.0, 0.135)]
ring = []
segs = 14
for k in range(segs):
    a = 2 * math.pi * k / segs
    ring.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in prof])
for k in range(segs):
    a, b = ring[k], ring[(k + 1) % segs]
    for m in range(len(prof) - 1):
        bm.faces.new((a[m], b[m], b[m + 1], a[m + 1]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bw, bd, bs = station(1)
bmesh.ops.translate(bm, vec=(L / 2 + 0.02, 0, bs - 0.2), verts=bm.verts)
bell = new_obj("Bell", bm, [M_BRASS])
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.012, radius2=0.012, depth=0.14)
bmesh.ops.translate(bm, vec=(L / 2 + 0.02, 0, bs - 0.02), verts=bm.verts)
new_obj("BellHook", bm, [M_BRASS], bell)

# ---------------- Mast, boom, rigging
mx = P["mast_x"]
floor_z = station(0.5)[2] - D * 0.8
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.045, radius2=0.03, depth=P["mast_h"])
bmesh.ops.translate(bm, vec=(mx, 0, floor_z + P["mast_h"] / 2), verts=bm.verts)
boom_z = station(0.5)[2] + 0.32
bm2 = bmesh.new()
bmesh.ops.create_cone(bm2, cap_ends=True, segments=8, radius1=0.028, radius2=0.022, depth=L * 0.55)
bmesh.ops.rotate(bm2, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "Y"), verts=bm2.verts)
bmesh.ops.translate(bm2, vec=(mx - L * 0.26, 0, boom_z), verts=bm2.verts)
me2 = bpy.data.meshes.new("tmp")
bm2.to_mesh(me2)
bm2.free()
bm.from_mesh(me2)
bpy.data.meshes.remove(me2)
paint(bm, lambda co, f: P["wood_dark"])
mast = new_obj("Mast", bm, [M_WOOD])
top_z = floor_z + P["mast_h"]
# rigging: thin stays from mast top to bow and stern
bm = bmesh.new()
for end in ((L / 2 - 0.05, 0, station(1)[2]), (-L / 2 + 0.1, 0.25, station(0)[2]), (-L / 2 + 0.1, -0.25, station(0)[2])):
    a, b = Vector((mx, 0, top_z - 0.02)), Vector(end)
    v = b - a
    geom = bmesh.ops.create_cone(bm, cap_ends=False, segments=4, radius1=0.006, radius2=0.006, depth=v.length)
    rot = v.normalized().to_track_quat("Z", "Y").to_matrix()
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot, verts=geom["verts"])
    bmesh.ops.translate(bm, vec=(a + b) / 2, verts=geom["verts"])
new_obj("Rigging", bm, [M_ROPE], mast)

# ---------------- Sail: a bellied triangle from mast top to boom, with a stripe
bm = bmesh.new()
rows, colsn = 24, 8
luff_top, luff_bot = Vector((mx - 0.04, 0, top_z - 0.06)), Vector((mx - 0.04, 0, boom_z + 0.04))
clew = Vector((mx - L * 0.5, 0, boom_z + 0.04))
vg = []
for r in range(rows + 1):
    u = r / rows  # 0 at boom, 1 at head
    row = []
    for c in range(colsn + 1):
        v = c / colsn  # 0 at luff, 1 at leech
        luff = luff_bot.lerp(luff_top, u)
        leech = clew.lerp(luff_top, u)
        p = luff.lerp(leech, v)
        p.y += math.sin(math.pi * v) * math.sin(math.pi * (0.15 + 0.85 * (1 - u))) * 0.14
        row.append(bm.verts.new(p))
    vg.append(row)
for r in range(rows):
    for c in range(colsn):
        bm.faces.new((vg[r][c], vg[r][c + 1], vg[r + 1][c + 1], vg[r + 1][c]))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)


def sail_colour(co, f):
    u = (co.z - boom_z) / (top_z - boom_z)
    return P["stripe"] if 0.28 < u < 0.4 else P["cloth"]


paint(bm, sail_colour)
sail = new_obj("Sail", bm, [M_CLOTH])

# ---------------- Sky-fins with glowing edges, and the core crystal
for side in (-1, 1):
    bm = bmesh.new()
    w, d, sh = station(0.42)
    root_pts = [(-0.35, side * w * 0.95, sh - d * 0.45), (0.2, side * w * 0.95, sh - d * 0.4)]
    tip_pts = [(-0.05, side * (w + 0.45), sh - d * 0.1), (0.3, side * (w + 0.3), sh - d * 0.2)]
    vs = [bm.verts.new(p) for p in (root_pts[0], root_pts[1], tip_pts[1], tip_pts[0])]
    bm.faces.new(vs if side > 0 else list(reversed(vs)))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.025)
    paint(bm, lambda co, f: P["wood"])
    fin = new_obj("Fin" + ("R" if side > 0 else "L"), bm, [M_WOOD], hull)
    bm = bmesh.new()
    a, b = Vector(tip_pts[0]), Vector(tip_pts[1])
    v = b - a
    geom = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.02, radius2=0.02, depth=v.length)
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=v.normalized().to_track_quat("Z", "Y").to_matrix(), verts=geom["verts"])
    bmesh.ops.translate(bm, vec=(a + b) / 2, verts=geom["verts"])
    new_obj("FinGlow" + ("R" if side > 0 else "L"), bm, [M_GLOW])

bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.13)
bmesh.ops.scale(bm, vec=(1, 1, 1.6), verts=bm.verts)
bmesh.ops.translate(bm, vec=(0.05, 0, -D * 1.05), verts=bm.verts)
core = new_obj("Core", bm, [M_GLOW])
for p in core.data.polygons:
    p.use_smooth = False

# rudder
bm = bmesh.new()
rv = [(-L / 2 - 0.02, 0, station(0)[2] - 0.05), (-L / 2 - 0.02, 0, -D * 0.8), (-L / 2 - 0.28, 0, -D * 0.7), (-L / 2 - 0.22, 0, station(0)[2] - 0.12)]
vs = [bm.verts.new(v) for v in rv]
bm.faces.new(vs)
bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.03)
paint(bm, lambda co, f: P["wood_dark"])
new_obj("Rudder", bm, [M_WOOD])

# markers
for name, loc in (("LanternMount", (-L / 2 - 0.05, 0, station(0)[2] + 0.35)), ("Seat", (-0.55, 0, station(0.3)[2] - 0.08))):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    col.objects.link(e)

# lantern post at the stern (the lantern itself belongs to the game)
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.02, radius2=0.02, depth=0.45)
bmesh.ops.translate(bm, vec=(-L / 2 + 0.06, 0, station(0)[2] + 0.2), verts=bm.verts)
bm2 = bmesh.new()
bmesh.ops.create_cone(bm2, cap_ends=True, segments=6, radius1=0.015, radius2=0.015, depth=0.16)
bmesh.ops.rotate(bm2, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "Y"), verts=bm2.verts)
bmesh.ops.translate(bm2, vec=(-L / 2 - 0.0, 0, station(0)[2] + 0.42), verts=bm2.verts)
me2 = bpy.data.meshes.new("tmp")
bm2.to_mesh(me2)
bm2.free()
bm.from_mesh(me2)
bpy.data.meshes.remove(me2)
paint(bm, lambda co, f: P["wood_dark"])
new_obj("SternPost", bm, [M_WOOD], hull)

tris = 0
for o in col.objects:
    if o.type == "MESH":
        dg = o.evaluated_get(bpy.context.evaluated_depsgraph_get())
        me = dg.to_mesh()
        me.calc_loop_triangles()
        tris += len(me.loop_triangles)
        dg.to_mesh_clear()
print("skiff tris", tris)

if OUT:
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_active_scene=True, use_active_collection=True,
                              export_apply=True, export_yup=True, export_extras=True, export_materials="EXPORT")
    print("exported", OUT, os.path.getsize(OUT))
