"""The Warden's ship (Blender 4.2+ / 5.x): a dark listening-ship, built from
parameters so another villain (or another game) can make its own.

Its shape tells the story: the Warden hunts for machines that think, so the
ship is all ears. Two great listening horns rise from its back, a single eye
looks down from the nose, and a hatch underneath takes what it catches.

Output: one GLB with named parts the game drives:
  ShipHull   - lofted manta body, swept wings, tail fins (vertex colours)
  ShipTrim   - dark metal: horn throats, eye bezel, hatch rim, wing claws
  ShipGlow   - violet light: horn mouths, wing edges, vents, tail tips (the game blooms it)
  ShipEye    - the eye lens (the game pulses it)
  ShipHatch  - the glowing ring under the belly (the tractor beam starts here)
Empties: EyeMount, Beam (the beam's origin, under the hatch).
Axes in the game: nose toward +Z, up +Y, wings along X. Origin = hatch centre.
(Blender: nose toward -Y, up +Z; exported Y-up.)

Run inside Blender:
  import runpy; runpy.run_path(r".../build_warden_ship.py", init_globals={"OUT": r".../public/props/warden-ship.glb"})
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

P = dict(
    length=3.6, width=1.7, top=0.48, belly=0.3, stations=20, ring=16,
    span=5.4, sweep=1.1, droop=0.42,
    horn_len=1.25, horn_mouth=0.34,
    hull=(0.17, 0.12, 0.26), hull_light=(0.27, 0.2, 0.4), hull_dark=(0.09, 0.06, 0.14),
    metal=(0.12, 0.1, 0.16), glow=(0.72, 0.5, 1.0), eye=(0.86, 0.72, 1.0),
)
P.update(globals().get("PARAMS", {}))
OUT = globals().get("OUT")

scene_name = "Prop_warden_ship"
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


def material(name, color, emissive=None, vcol=False, strength=1.5, rough=0.8):
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


M_HULL = material("WardenHull", (1, 1, 1), vcol=True, rough=0.55)
M_TRIM = material("WardenTrim", P["metal"], rough=0.4)
M_GLOW = material("WardenGlow", P["glow"], emissive=P["glow"], strength=2.0)
M_EYE = material("WardenEye", P["eye"], emissive=P["eye"], strength=3.0)


def new_obj(name, bm, mats, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    for p in me.polygons:
        p.use_smooth = smooth
    return o


def paint(bm, fn):
    lay = bm.loops.layers.color.get("Col") or bm.loops.layers.color.new("Col")
    for f in bm.faces:
        for l in f.loops:
            l[lay] = (*fn(l.vert.co, f), 1)


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def merge(bm, other):
    me = bpy.data.meshes.new("tmp")
    other.to_mesh(me)
    other.free()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)


def tube(bm, pts, radii, segs=8, cap=True):
    """a swept tube through pts (Vectors) with a radius per point; returns the last ring"""
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
    return rings


L, W = P["length"], P["width"]


# ---------------- Hull: a lofted manta body. t = 0 nose (-Y) .. 1 tail (+Y)
def section(t):
    # width swells fast behind the nose and tapers to a blade at the tail
    w = W / 2 * (math.sin(math.pi * min(1, t * 1.25)) ** 0.6 if t < 0.4 else (1 - (t - 0.4) / 0.6 * 0.82))
    top = P["top"] * (math.sin(math.pi * min(1, 0.08 + t * 1.1)) ** 0.7) * (1 - 0.55 * max(0, t - 0.55) / 0.45)
    bel = P["belly"] * (math.sin(math.pi * min(1, 0.05 + t * 1.15)) ** 0.8)
    return max(w, 0.02), max(top, 0.02), max(bel, 0.02)


bm = bmesh.new()
S, N = P["stations"], P["ring"]
grid = []
for i in range(S + 1):
    t = i / S
    y = -L / 2 + t * L
    w, top, bel = section(t)
    row = []
    for j in range(N):
        a = 2 * math.pi * j / N
        c, s = math.cos(a), math.sin(a)
        # superellipse cross-section: flat belly, a ridge along the spine
        x = w * math.copysign(abs(c) ** 0.7, c)
        h = top if s > 0 else bel
        z = h * math.copysign(abs(s) ** 0.9, s)
        if s > 0:
            z += 0.12 * top * max(0, 1 - abs(c) * 4)  # dorsal ridge
        row.append(bm.verts.new((x, y, z)))
    grid.append(row)
for i in range(S):
    for j in range(N):
        bm.faces.new((grid[i][j], grid[i][(j + 1) % N], grid[i + 1][(j + 1) % N], grid[i + 1][j]))
nose = bm.verts.new((0, -L / 2 - 0.3, -0.12))  # a hooked beak
tail = bm.verts.new((0, L / 2 + 0.05, 0.03))
for j in range(N):
    bm.faces.new((grid[0][(j + 1) % N], grid[0][j], nose))
    bm.faces.new((grid[S][j], grid[S][(j + 1) % N], tail))

# ---------------- Wings: bat wings, swept back and drooping, with a scalloped trailing edge
wing_root_y0, wing_root_y1 = -0.45, 1.05
FINGERS = 3


def wing_outline(side):
    """leading edge root -> tip, then the scalloped trailing edge back to the root"""
    w0 = section((wing_root_y0 + L / 2) / L)[0]
    w1 = section((wing_root_y1 + L / 2) / L)[0]
    span = P["span"] / 2
    lead = []
    for k in range(6):
        u = k / 5
        x = w0 * 0.9 + (span - w0 * 0.9) * u
        y = wing_root_y0 + P["sweep"] * u ** 1.3 - 0.12 * math.sin(math.pi * u)
        z = 0.03 - P["droop"] * u ** 1.6 + 0.12 * math.sin(math.pi * u * 0.8)
        lead.append(Vector((side * x, y, z)))
    trail = []
    for f in range(FINGERS):
        # each finger tip, then a notch between fingers
        u = 1 - f / FINGERS
        tip = lead[-1].lerp(Vector((side * w1 * 0.9, wing_root_y1, -0.02)), f / FINGERS)
        tip = Vector((tip.x, tip.y + 0.55 + 0.2 * (1 - u), tip.z - 0.06))
        trail.append(tip)
        nu = 1 - (f + 0.5) / FINGERS
        notch = lead[-1].lerp(Vector((side * w1 * 0.9, wing_root_y1, -0.02)), (f + 0.5) / FINGERS)
        trail.append(Vector((notch.x, notch.y + 0.18, notch.z)))
    trail.append(Vector((side * w1 * 0.9, wing_root_y1, -0.02)))
    return lead + trail


for side in (-1, 1):
    pts = wing_outline(side)
    n = len(pts)
    th = [0.07 * (1 - min(1, abs(p.x) / (P["span"] / 2))) + 0.015 for p in pts]
    top = [bm.verts.new(p + Vector((0, 0, t))) for p, t in zip(pts, th)]
    bot = [bm.verts.new(p - Vector((0, 0, t * 0.6))) for p, t in zip(pts, th)]
    bm.faces.new(top if side > 0 else list(reversed(top)))
    bm.faces.new(list(reversed(bot)) if side > 0 else bot)
    for k in range(n):
        q = (top[k], top[(k + 1) % n], bot[(k + 1) % n], bot[k])
        bm.faces.new(q if side < 0 else tuple(reversed(q)))
    # wing bones: ribs from the shoulder to each finger tip, raised a little
    shoulder = pts[0].lerp(pts[-1], 0.3) + Vector((0, 0, 0.05))
    for f in range(FINGERS):
        tip = pts[6 + 2 * f]
        rib = bmesh.new()
        tube(rib, [shoulder, shoulder.lerp(tip, 0.5) + Vector((0, 0, 0.05)), tip + Vector((0, 0, 0.02))], [0.045, 0.03, 0.012], segs=5, cap=True)
        merge(bm, rib)

# ---------------- Tail fins: a tall central blade and two angled side blades
for (x, z, lean, h) in ((0, P["top"] * 0.45, 0, 0.75), (-0.32, 0.1, -0.6, 0.5), (0.32, 0.1, 0.6, 0.5)):
    base_y = L / 2 - 0.85
    pts = [Vector((0, 0, 0)), Vector((0, 0.95, 0)), Vector((0, 1.15, h)), Vector((0, 0.6, h * 0.55))]
    rot = Matrix.Rotation(lean, 3, "Y")
    vs = [rot @ p + Vector((x, base_y, z)) for p in pts]
    a = [bm.verts.new(v + rot @ Vector((0.025, 0, 0))) for v in vs]
    b = [bm.verts.new(v - rot @ Vector((0.025, 0, 0))) for v in vs]
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    for k in range(4):
        bm.faces.new((a[(k + 1) % 4], a[k], b[k], b[(k + 1) % 4]))

bmesh.ops.recalc_face_normals(bm, faces=bm.faces)


def hull_colour(co, f):
    # dark plum armour: lighter plates on top in bands along the length, a pale spine, dark belly
    t = (co.y + L / 2) / L
    plate = int(t * 7) % 2
    c = P["hull_light"] if plate and co.z > 0 else P["hull"]
    if abs(co.x) < 0.08 and co.z > 0.2:
        c = lerp3(P["hull_light"], (0.5, 0.42, 0.62), 0.5)
    if co.z < -0.05:
        c = lerp3(c, P["hull_dark"], 0.7)
    if abs(co.x) > W * 0.55:  # wings: a little lighter toward the tips
        c = lerp3(P["hull"], P["hull_light"], min(1, (abs(co.x) - W * 0.55) / 1.5))
    return c


paint(bm, hull_colour)
hull = new_obj("ShipHull", bm, [M_HULL])

# ---------------- Listening ears: tall pointed shells, open to the front, glowing inside
trim = bmesh.new()
glow = bmesh.new()


def ear_shell(bmx, side, scale=1.0, arc=105, inset=0.0):
    base = Vector((side * 0.34, 0.15, section(0.5)[1] * 0.7))
    n, m = 9, 9
    rows = []
    for k in range(n + 1):
        u = k / n
        c = base + Vector((side * 0.38 * u, 0.42 * u ** 1.5, P["horn_len"] * u))
        r = (P["horn_mouth"] * (1 - u) ** 0.75 + 0.01) * scale
        row = []
        for j in range(m + 1):
            a = math.radians(-arc + 2 * arc * j / m)
            # open toward the front (-Y) and a little outward
            back = Vector((side * 0.35, 1, 0)).normalized()
            out = Vector((1, -side * 0.35, 0)).normalized()
            row.append(bmx.verts.new(c + (back * math.cos(a) + out * math.sin(a)) * r + back * inset))
        rows.append(row)
    faces = []
    for k in range(n):
        for j in range(m):
            faces.append(bmx.faces.new((rows[k][j], rows[k][j + 1], rows[k + 1][j + 1], rows[k + 1][j])))
    return faces


for side in (-1, 1):
    ear = bmesh.new()
    fs = ear_shell(ear, side)
    bmesh.ops.solidify(ear, geom=fs, thickness=0.035)
    merge(trim, ear)
    ear_shell(glow, side, scale=0.82, arc=80, inset=0.02)

# eye bezel at the nose, angled down toward what it watches
eye_at = Vector((0, -L / 2 + 0.28, -0.12))
eye_dir = Vector((0, -0.75, -0.65)).normalized()
tube(trim, [eye_at - eye_dir * 0.05, eye_at + eye_dir * 0.1], [0.3, 0.27], segs=16, cap=False)
# a heavy brow over the eye, low in the middle: the ship always looks cross
for side in (-1, 1):
    a = eye_at + Vector((side * 0.42, -0.02, 0.3))
    b = eye_at + Vector((side * 0.2, -0.12, 0.24))
    c = eye_at + Vector((0, -0.17, 0.13))
    tube(trim, [a, b, c], [0.05, 0.075, 0.06], segs=6, cap=True)
# hatch rim under the belly (the beam starts here)
hatch_at = Vector((0, 0.15, -section(0.5)[2] - 0.01))
up = Vector((0, 0, 1))
tube(trim, [hatch_at + up * 0.05, hatch_at - up * 0.04], [0.42, 0.46], segs=20, cap=False)
# wing claws: a hook at the wrist of each wing
for side in (-1, 1):
    tip = wing_outline(side)[5]
    tube(trim, [tip, tip + Vector((side * 0.06, -0.1, 0.12)), tip + Vector((side * 0.02, -0.22, 0.16))], [0.04, 0.028, 0.006], segs=5, cap=True)
bmesh.ops.recalc_face_normals(trim, faces=trim.faces)
new_obj("ShipTrim", trim, [M_TRIM])

# glowing wing edges along the leading edge
for side in (-1, 1):
    lead = wing_outline(side)[:6]
    tube(glow, [p + Vector((0, -0.02, 0.02)) for p in lead], [0.02, 0.026, 0.026, 0.024, 0.02, 0.012], segs=5, cap=True)
# vent slits along the flanks
for side in (-1, 1):
    for k in range(4):
        t = 0.32 + k * 0.08
        w, top, bel = section(t)
        y = -L / 2 + t * L
        a = Vector((side * w * 0.93, y, 0.08))
        tube(glow, [a, a + Vector((0, 0.16, -0.02))], [0.025, 0.025], segs=4, cap=True)
# tail fin tips
for (x, z, lean, h) in ((0, P["top"] * 0.45, 0, 0.75), (-0.32, 0.1, -0.6, 0.5), (0.32, 0.1, 0.6, 0.5)):
    rot = Matrix.Rotation(lean, 3, "Y")
    p = rot @ Vector((0, 1.15, h)) + Vector((x, L / 2 - 0.85, z))
    bm2 = bmesh.new()
    bmesh.ops.create_icosphere(bm2, subdivisions=1, radius=0.06)
    bmesh.ops.translate(bm2, vec=p, verts=bm2.verts)
    merge(glow, bm2)
bmesh.ops.recalc_face_normals(glow, faces=glow.faces)
new_obj("ShipGlow", glow, [M_GLOW], smooth=False)

# the eye: a lens set into the bezel
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=0.25)
bmesh.ops.scale(bm, vec=(1, 1, 0.6), verts=bm.verts)
rot = Vector((0, 0, 1)).rotation_difference(eye_dir).to_matrix()
bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=rot, verts=bm.verts)
bmesh.ops.translate(bm, vec=eye_at + eye_dir * 0.04, verts=bm.verts)
new_obj("ShipEye", bm, [M_EYE])

# the hatch light
bm = bmesh.new()
bmesh.ops.create_circle(bm, cap_ends=True, segments=20, radius=0.4)
bmesh.ops.translate(bm, vec=hatch_at - up * 0.035, verts=bm.verts)
bmesh.ops.reverse_faces(bm, faces=bm.faces)  # faces down
new_obj("ShipHatch", bm, [M_GLOW], smooth=False)

# markers
for name, loc in (("EyeMount", eye_at + eye_dir * 0.1), ("Beam", hatch_at - up * 0.05)):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    col.objects.link(e)

# put the origin at the hatch so the game's beam lines up with the belly
for o in col.objects:
    o.location -= hatch_at
for o in col.objects:
    if o.type == "MESH":
        for v in o.data.vertices:
            v.co += o.location
        o.location = (0, 0, 0)

tris = 0
for o in col.objects:
    if o.type == "MESH":
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
print("warden ship tris", tris)

if OUT:
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_active_scene=True, use_active_collection=True,
                              export_apply=True, export_yup=True, export_extras=True, export_materials="EXPORT")
    print("exported", OUT, os.path.getsize(OUT))
