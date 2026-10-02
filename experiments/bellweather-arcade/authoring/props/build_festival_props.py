"""Bellweather festival props (Blender 4.2+ / 5.x), built from parameters:

  festival-lantern.glb  - the paper lantern Mira and Zip hang on the skiff.
      Paper  (ribbed paper, vertex colours; the game makes it glow)
      Frame  (dark wood caps and the hook ring)
      Tassel (hangs under it)
      Origin = the hook, so the game can swing it like a pendulum.

  bell-frame.glb  - the bell frame that gives the bell garden its name.
      Frame  (posts, curved beam, little roof, stone feet; vertex colours)
      Bell0..BellN (a bell with its rope; each origin is its hanging point, so
                    the game can swing them one by one)
      Pennants (festival flags strung between the posts)
      Origin = ground centre; the beam runs along X. Posts stand at x = +-span/2.

Run inside Blender:
  import runpy; runpy.run_path(r".../build_festival_props.py", init_globals={"OUT_DIR": r".../public/props"})
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

P = dict(
    lantern_h=0.34, lantern_r=0.15, ribs=12,
    paper=(0.93, 0.36, 0.22), paper_band=(0.98, 0.78, 0.36), wood=(0.24, 0.16, 0.12), gold=(0.9, 0.72, 0.36),
    span=3.0, post_h=2.9, beam_rise=0.22, bells=5,
    navy=(0.13, 0.2, 0.28), navy_light=(0.2, 0.3, 0.4), cream=(0.94, 0.89, 0.79), stone=(0.78, 0.74, 0.67),
    brass=(0.74, 0.5, 0.2), rope=(0.55, 0.45, 0.35),
    flags=((0.43, 0.88, 0.79), (0.98, 0.83, 0.42), (0.93, 0.42, 0.33), (0.94, 0.89, 0.79)),
)
P.update(globals().get("PARAMS", {}))
OUT_DIR = globals().get("OUT_DIR")


def fresh_scene(name):
    old = bpy.data.scenes.get(name)
    if old:
        for o in list(old.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.scenes.remove(old)
    scene = bpy.data.scenes.new(name)
    bpy.context.window.scene = scene
    col = bpy.data.collections.new(name)
    scene.collection.children.link(col)
    bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection.children[col.name]
    return col


def material(name, color, emissive=None, vcol=False, strength=1.5, rough=0.85):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = rough
    if vcol:
        a = nt.nodes.new("ShaderNodeVertexColor")
        a.layer_name = "Col"
        nt.links.new(a.outputs["Color"], bsdf.inputs["Base Color"])
    if emissive:
        bsdf.inputs["Emission Color"].default_value = (*emissive, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def new_obj(col, name, bm, mats, smooth=True, parent=None):
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
        p.use_smooth = smooth
    return o


def paint(bm, fn):
    lay = bm.loops.layers.color.get("Col") or bm.loops.layers.color.new("Col")
    for f in bm.faces:
        for l in f.loops:
            l[lay] = (*fn(l.vert.co, f), 1)


def merge(bm, other):
    me = bpy.data.meshes.new("tmp")
    other.to_mesh(me)
    other.free()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)


def lathe(bm, prof, segs, rfn=None, z0=0.0):
    """revolve (r, z) points around Z; rfn(a) scales the radius by angle (ribs)"""
    rings = []
    for k in range(segs):
        a = 2 * math.pi * k / segs
        s = rfn(a) if rfn else 1.0
        rings.append([bm.verts.new((r * s * math.cos(a), r * s * math.sin(a), z + z0)) for r, z in prof])
    for k in range(segs):
        a, b = rings[k], rings[(k + 1) % segs]
        for m in range(len(prof) - 1):
            bm.faces.new((a[m], b[m], b[m + 1], a[m + 1]))
    return rings


def tube(bm, pts, radii, segs=6, cap=True):
    rings = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        a = d.orthogonal().normalized()
        b = d.cross(a).normalized()
        rings.append([bm.verts.new(p + (a * math.cos(2 * math.pi * k / segs) + b * math.sin(2 * math.pi * k / segs)) * radii[i]) for k in range(segs)])
    for i in range(len(rings) - 1):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    if cap:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    return rings


def box(bm, c, s):
    g = bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=s, verts=g["verts"])
    bmesh.ops.translate(bm, vec=c, verts=g["verts"])


def tris_of(col):
    n = 0
    for o in col.objects:
        if o.type == "MESH":
            o.data.calc_loop_triangles()
            n += len(o.data.loop_triangles)
    return n


def export(col, name):
    if not OUT_DIR:
        return
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_active_scene=True, use_active_collection=True,
                              export_apply=True, export_yup=True, export_extras=True, export_materials="EXPORT")
    print("exported", path, os.path.getsize(path))


# ======================================================================
# Festival lantern: origin at the hook, hanging down -Z
# ======================================================================
col = fresh_scene("Prop_festival_lantern")
M_PAPER = material("LanternPaper", (1, 1, 1), vcol=True, emissive=(1, 0.6, 0.3), strength=0.6)
M_WOOD = material("LanternWood", P["wood"])
M_GOLD = material("LanternGold", P["gold"])
H, R = P["lantern_h"], P["lantern_r"]
top = -0.09  # the paper starts a little below the hook

bm = bmesh.new()
prof = []
for k in range(11):
    u = k / 10
    prof.append((R * (0.42 + 0.58 * math.sin(math.pi * u) ** 0.8), top - u * H))
lathe(bm, prof, P["ribs"] * 2, rfn=lambda a: 1 - 0.07 * abs(math.sin(P["ribs"] * a / 2)))


def paper_colour(co, f):
    u = (top - co.z) / H
    if u < 0.12 or u > 0.88:
        return P["paper_band"]
    if 0.46 < u < 0.54:
        return P["paper_band"]
    return P["paper"]


paint(bm, paper_colour)
new_obj(col, "Paper", bm, [M_PAPER])

bm = bmesh.new()
for z, r in ((top + 0.012, R * 0.5), (top - H - 0.012, R * 0.5)):
    lathe(bm, [(0.0, z + 0.02), (r, z + 0.02), (r, z - 0.02), (0.0, z - 0.02)], 12)
# hook ring and a short cord to it
tube(bm, [Vector((0, 0, top + 0.03)), Vector((0, 0, -0.02))], [0.008, 0.008], segs=5)
ring = [Vector((0.025 * math.cos(a), 0, 0.025 * math.sin(a))) for a in [2 * math.pi * k / 10 for k in range(11)]]
tube(bm, ring, [0.006] * len(ring), segs=4, cap=False)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
new_obj(col, "Frame", bm, [M_WOOD])

bm = bmesh.new()
z0 = top - H - 0.03
for k in range(7):
    a = 2 * math.pi * k / 7
    off = Vector((0.018 * math.cos(a), 0.018 * math.sin(a), 0))
    tube(bm, [Vector((0, 0, z0)) + off * 0.3, Vector((0, 0, z0 - 0.07)) + off, Vector((0, 0, z0 - 0.15)) + off * 1.4], [0.006, 0.005, 0.002], segs=3, cap=False)
tube(bm, [Vector((0, 0, z0 + 0.01)), Vector((0, 0, z0 - 0.03))], [0.016, 0.02], segs=6)
new_obj(col, "Tassel", bm, [M_GOLD])
print("lantern tris", tris_of(col))
export(col, "festival-lantern")

# ======================================================================
# Bell frame: posts at x = +-span/2, beam along X, bells hang under it
# ======================================================================
col = fresh_scene("Prop_bell_frame")
M_FRAME = material("BellFrameWood", (1, 1, 1), vcol=True)
M_BRASS = material("BellBrass", P["brass"], rough=0.35)
M_ROPE = material("BellRope", P["rope"])
M_FLAG = material("BellFlags", (1, 1, 1), vcol=True)
SP, PH = P["span"], P["post_h"]


def beam_z(x):
    """the beam's underside height at x (a gentle upward curve)"""
    u = x / (SP / 2 + 0.35)
    return PH + P["beam_rise"] * (1 - u * u)


frame = bmesh.new()
for side in (-1, 1):
    x = side * SP / 2
    box(frame, (x, 0, 0.12), (0.42, 0.42, 0.24))                 # stone foot
    box(frame, (x, 0, PH / 2 + 0.12), (0.17, 0.17, PH - 0.05))    # post
    box(frame, (x, 0, 0.55), (0.21, 0.21, 0.08))                  # brass-ish collar (painted)
    box(frame, (x, 0, PH - 0.35), (0.21, 0.21, 0.08))
    # a diagonal brace up to the beam
    tube(frame, [Vector((x, 0, PH - 0.6)), Vector((x - side * 0.45, 0, beam_z(x - side * 0.45) - 0.02))], [0.04, 0.04], segs=5)
# the curved beam: a box lofted along the curve, with curled ends
n = 16
pts = [Vector((-SP / 2 - 0.45 + (SP + 0.9) * k / n, 0, 0)) for k in range(n + 1)]
for p in pts:
    p.z = beam_z(p.x) + 0.1
    end = abs(p.x) / (SP / 2 + 0.45)
    p.z += 0.12 * max(0, end - 0.82) / 0.18  # ends curl up
tube(frame, pts, [0.11] * len(pts), segs=6)
# second, thinner tie beam under the main one
tube(frame, [Vector((-SP / 2, 0, PH - 0.42)), Vector((SP / 2, 0, PH - 0.42))], [0.05, 0.05], segs=5)
# a little roof: two boards on top of the beam
for side in (-1, 1):
    roof_pts = [Vector((p.x, side * 0.12, p.z + 0.17)) for p in pts[2:-2]]
    for i in range(len(roof_pts) - 1):
        a, b = roof_pts[i], roof_pts[i + 1]
        c = Vector((0, side * 0.16, -0.08))
        vs = [frame.verts.new(v) for v in (a, b, b + c, a + c)]
        frame.faces.new(vs)
    ridge = [Vector((p.x, 0, p.z + 0.22)) for p in pts[2:-2]]
tube(frame, ridge, [0.035] * len(ridge), segs=4)
bmesh.ops.recalc_face_normals(frame, faces=frame.faces)


def frame_colour(co, f):
    if co.z < 0.25:
        return P["stone"]
    if abs(co.z - 0.55) < 0.05 or abs(co.z - (PH - 0.35)) < 0.05:
        return P["brass"]
    if co.z > PH + 0.2 and abs(co.y) > 0.05:
        return P["cream"]                     # roof boards
    if co.z > PH - 0.5:
        return P["navy_light"] if co.z > PH + 0.05 else P["navy"]
    return P["navy"]


paint(frame, frame_colour)
new_obj(col, "Frame", frame, [M_FRAME])

# bells: bigger in the middle, hanging at different heights, each with its rope
bell_prof = [(0.0, 0.0), (1.0, 0.0), (0.95, 0.12), (0.72, 0.42), (0.6, 0.72), (0.5, 0.86), (0.16, 0.98), (0.0, 1.0)]
NB = P["bells"]
for i in range(NB):
    u = (i + 0.5) / NB * 2 - 1        # -1 .. 1 along the beam
    x = u * (SP / 2 - 0.35)
    size = 0.2 + 0.11 * (1 - abs(u))
    hang = beam_z(x) + 0.0
    drop = 0.5 + 0.25 * (1 - abs(u)) + 0.1 * ((i * 7) % 3)
    bm = bmesh.new()
    lathe(bm, [(r * size, z * size * 1.25 - drop - size * 1.25) for r, z in bell_prof], 14)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # clapper ball
    g = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=size * 0.22)
    bmesh.ops.translate(bm, vec=(0, 0, -drop - size * 1.25 - size * 0.1), verts=g["verts"])
    bell = new_obj(col, "Bell%d" % i, bm, [M_BRASS])
    rope = bmesh.new()
    tube(rope, [Vector((0, 0, 0)), Vector((0, 0, -drop + 0.02))], [0.012, 0.012], segs=4, cap=False)
    new_obj(col, "Rope%d" % i, rope, [M_ROPE], parent=bell)
    bell.location = (x, 0, hang)


# pennant strings: a sagging line from post to post in front and behind, with little triangle flags
flags = bmesh.new()
for side in (-1, 1):
    y = side * 0.14
    a, b = Vector((-SP / 2, y, PH - 0.3)), Vector((SP / 2, y, PH - 0.3))
    m = 11
    line = [a.lerp(b, k / m) - Vector((0, 0, 0.15 * math.sin(math.pi * k / m))) for k in range(m + 1)]
    tube(flags, line, [0.006] * len(line), segs=3, cap=False)
    for k in range(1, m):
        p, q = line[k], line[k + 1] if k + 1 <= m else line[k]
        mid = p.lerp(q, 0.5)
        vs = [flags.verts.new(v) for v in (p, q, mid - Vector((0, 0, 0.2)))]
        f = flags.faces.new(vs)
        lay = flags.loops.layers.color.get("Col") or flags.loops.layers.color.new("Col")
        c = P["flags"][(k + (side > 0)) % len(P["flags"])]
        for l in f.loops:
            l[lay] = (*c, 1)
lay = flags.loops.layers.color.get("Col")
for f in flags.faces:
    if len(f.verts) != 3:
        for l in f.loops:
            l[lay] = (*P["rope"], 1)
new_obj(col, "Pennants", flags, [M_FLAG], smooth=False)
print("bell frame tris", tris_of(col))
export(col, "bell-frame")
