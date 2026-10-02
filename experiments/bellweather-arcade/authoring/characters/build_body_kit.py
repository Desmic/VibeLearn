"""Body kit (Blender 4.2+ / 5.x): a library of character parts on the shared
humanoid skeleton, so the game can assemble many people (and Mira) from one file
and animate all of them with the same clip library.

Output: body-kit.glb with
  BodyRig          - the 17-bone skeleton (names and rest joints as townsfolk-rig.ts)
  <slot>.<variant> - one skinned mesh per part, e.g. head.round, hair.bob, hat.wide,
                     top.vest, lower.coat, shoes.boot ...
Every part shares one vertex-colour material. Colours are mostly light "detail"
values the game multiplies by a palette colour; UV u says which:
  u = 0  fixed colour (eyes, mouth, soles)
  u = 1  tint with the part's main slot (skin for a head, cloth for a coat)
  u = 2  tint with the part's accent slot (hair for brows, ribbon for a hat)
Parts are authored in GAME coordinates (front -Z, up +Y, feet at y = 0) through G();
the script converts to Blender's Z-up axes, and the exporter converts back.

Run inside Blender:
  import runpy; runpy.run_path(r".../build_body_kit.py", init_globals={"OUT": r".../public/characters/body-kit.glb"})
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

OUT = globals().get("OUT")

# skeleton: name -> (x, y, z, parent) in game coordinates (same as src/townsfolk-rig.ts)
J = {
    "Hips": (0, .95, 0, None), "Spine": (0, 1.08, 0, "Hips"), "Chest": (0, 1.25, 0, "Spine"), "Neck": (0, 1.45, 0, "Chest"), "Head": (0, 1.53, 0, "Neck"),
    "UpperArmL": (-.2, 1.42, 0, "Chest"), "LowerArmL": (-.25, 1.15, .01, "UpperArmL"), "HandL": (-.27, .9, 0, "LowerArmL"),
    "UpperArmR": (.2, 1.42, 0, "Chest"), "LowerArmR": (.25, 1.15, .01, "UpperArmR"), "HandR": (.27, .9, 0, "LowerArmR"),
    "UpperLegL": (-.1, .9, 0, "Hips"), "LowerLegL": (-.11, .5, .01, "UpperLegL"), "FootL": (-.12, .1, 0, "LowerLegL"),
    "UpperLegR": (.1, .9, 0, "Hips"), "LowerLegR": (.11, .5, .01, "UpperLegR"), "FootR": (.12, .1, 0, "LowerLegR"),
}
TO_BLENDER = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))  # game (x, y, z) -> blender (x, -z, y)


def G(x, y, z):
    return Vector((x, -z, y))


# ---------------------------------------------------------------- scene
scene_name = "Char_body_kit"
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

mat = bpy.data.materials.get("BodyKit") or bpy.data.materials.new("BodyKit")
mat.use_nodes = True
nt = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
o_ = nt.nodes.new("ShaderNodeOutputMaterial")
b_ = nt.nodes.new("ShaderNodeBsdfPrincipled")
b_.inputs["Roughness"].default_value = 0.9
vc = nt.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
nt.links.new(vc.outputs["Color"], b_.inputs["Base Color"])
nt.links.new(b_.outputs["BSDF"], o_.inputs["Surface"])

# armature
arm_data = bpy.data.armatures.new("BodyRig")
rig = bpy.data.objects.new("BodyRig", arm_data)
col.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="EDIT")
children = {}
for n, (x, y, z, p) in J.items():
    children.setdefault(p, []).append(n)
for n, (x, y, z, p) in J.items():
    eb = arm_data.edit_bones.new(n)
    eb.head = G(x, y, z)
    kids = children.get(n, [])
    if len(kids) == 1:
        cx, cy, cz, _ = J[kids[0]]
        tail = G(cx, cy, cz)
    elif n == "Head":
        tail = G(x, y + .25, z)
    elif n.startswith("Foot"):
        tail = G(x, y - .05, z - .14)
    elif n.startswith("Hand"):
        tail = G(x, y - .12, z)
    else:
        tail = G(x, y + .12, z)
    if (tail - eb.head).length < 1e-3:
        tail = eb.head + Vector((0, 0, .1))
    eb.tail = tail
for n, (x, y, z, p) in J.items():
    if p:
        arm_data.edit_bones[n].parent = arm_data.edit_bones[p]
bpy.ops.object.mode_set(mode="OBJECT")


# ---------------------------------------------------------------- geometry helpers (game coordinates)
def ellipsoid(bm, c, r, segs=16, rings=10, pow_=1.0):
    """an ellipsoid (pow_ < 1 makes it boxier); returns its verts"""
    c = Vector(c)
    top = bm.verts.new(c + Vector((0, r[1], 0)))
    bot = bm.verts.new(c - Vector((0, r[1], 0)))
    rows = []
    for i in range(1, rings):
        th = math.pi * i / rings
        sy, cy = math.sin(th), math.cos(th)
        row = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ca, sa = math.cos(a), math.sin(a)
            f = lambda v: math.copysign(abs(v) ** pow_, v)
            row.append(bm.verts.new(c + Vector((r[0] * f(sy) * f(ca), r[1] * f(cy), r[2] * f(sy) * f(sa)))))
        rows.append(row)
    for k in range(segs):
        bm.faces.new((top, rows[0][(k + 1) % segs], rows[0][k]))
        bm.faces.new((bot, rows[-1][k], rows[-1][(k + 1) % segs]))
    for i in range(len(rows) - 1):
        for k in range(segs):
            bm.faces.new((rows[i][k], rows[i][(k + 1) % segs], rows[i + 1][(k + 1) % segs], rows[i + 1][k]))
    return [top, bot] + [v for r_ in rows for v in r_]


def tube(bm, pts, radii, segs=8, cap=True, flat=1.0):
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        a = d.cross(Vector((0, 0, 1)))
        if a.length < 1e-3:
            a = d.cross(Vector((1, 0, 0)))
        a.normalize()
        b = d.cross(a).normalized()
        rings.append([bm.verts.new(p + (a * math.cos(2 * math.pi * k / segs) + b * math.sin(2 * math.pi * k / segs) * flat) * radii[i]) for k in range(segs)])
    for i in range(len(rings) - 1):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    if cap:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    return rings


def loft(bm, sections, segs=16, cap_top=True, cap_bottom=True, sq=0.8):
    """rings along +Y: sections = [(y, rx, rz, cz)], superellipse cross-sections (sq < 1 boxier)"""
    rings = []
    for y, rx, rz, cz in sections:
        row = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ca, sa = math.cos(a), math.sin(a)
            row.append(bm.verts.new((rx * math.copysign(abs(ca) ** sq, ca), y, cz + rz * math.copysign(abs(sa) ** sq, sa))))
        rings.append(row)
    for i in range(len(rings) - 1):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i + 1][k], rings[i + 1][(k + 1) % segs], rings[i][(k + 1) % segs]))
    if cap_bottom:
        bm.faces.new(rings[0])
    if cap_top:
        bm.faces.new(list(reversed(rings[-1])))
    return rings


def lathe(bm, prof, segs, c=(0, 0, 0)):
    """revolve (r, y) around the Y axis"""
    c = Vector(c)
    rings = []
    for k in range(segs):
        a = 2 * math.pi * k / segs
        rings.append([bm.verts.new(c + Vector((r * math.cos(a), y, r * math.sin(a)))) for r, y in prof])
    for k in range(segs):
        a, b = rings[k], rings[(k + 1) % segs]
        for m in range(len(prof) - 1):
            bm.faces.new((a[m], a[m + 1], b[m + 1], b[m]))
    return rings


def remove_faces(bm, keep):
    """delete faces whose centre fails keep(centre)"""
    dead = [f for f in bm.faces if not keep(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=dead, context="FACES")


def smooth_step(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# ---------------------------------------------------------------- parts
def make_part(name, bm, weights, paint, smooth=True, solidify=0.0):
    """weights(co) -> {bone: w}; paint(co, face) -> (rgb, code). co in game coordinates"""
    if solidify:
        bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=solidify)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.verts.index_update()
    vw = [weights(v.co.copy()) for v in bm.verts]
    lay = bm.loops.layers.color.new("Col")
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        cen = f.calc_center_median()
        for l in f.loops:
            rgb, code = paint(l.vert.co, cen)
            l[lay] = (*rgb, 1)
            l[uv].uv = (code, 0)
    bmesh.ops.transform(bm, matrix=TO_BLENDER, verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = smooth
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    o.parent = rig
    md = o.modifiers.new("Armature", "ARMATURE")
    md.object = rig
    groups = {}
    for i, w in enumerate(vw):
        tot = sum(w.values()) or 1
        for bn, x in w.items():
            if x <= 0:
                continue
            g = groups.get(bn) or o.vertex_groups.new(name=bn)
            groups[bn] = g
            g.add([i], x / tot, "REPLACE")
    return o


rigid = lambda bone: (lambda co: {bone: 1.0})
WHITE = (1, 1, 1)


def solid(code, rgb=WHITE):
    return lambda co, cen: (rgb, code)


def torso_w(co):
    t = smooth_step(1.1, 1.3, co.y)
    return {"Spine": 1 - t, "Chest": t}


def hem_w(top):
    """skirts and coats: hips above `top`, the hem follows the legs below it"""
    def w(co):
        if co.y > top:
            return {"Hips": 1.0}
        k = max(0.0, min(1.0, (top - co.y) / .75)) * .75
        leg = "UpperLegL" if co.x < 0 else "UpperLegR"
        return {"Hips": 1 - k, leg: k}
    return w


HR = .205                      # a big, friendly head (the skeleton's head bone is at 1.53)
HEAD_C = Vector((0, 1.53 + HR * .93, 0))
k = HR / .175                  # face features scale with the head


def F(x, y, z):
    """a point on the face, relative to the head centre, in head units"""
    return HEAD_C + Vector((x * k, y * k, z))


# head: a round face with painted cheeks (skin), separate eyes, brows (hair), nose, mouth, ears
bm = bmesh.new()
ellipsoid(bm, HEAD_C, (HR, HR * .97, HR * .95), 22, 16)


def head_paint(co, cen):
    d = (co - HEAD_C) / k
    cheek = math.exp(-(((abs(d.x) - .088) / .035) ** 2 + ((d.y + .045) / .03) ** 2)) if d.z < 0 else 0
    return ((1, 1 - .22 * cheek, 1 - .24 * cheek), 1)


make_part("head.round", bm, rigid("Head"), head_paint)

bm = bmesh.new()
for s in (-1, 1):
    ellipsoid(bm, F(s * .064, .0, -HR * .9), (.027 * k, .037 * k, .014 * k), 10, 6)
make_part("face.eyes", bm, rigid("Head"), solid(0, (.06, .07, .12)))
bm = bmesh.new()
for s in (-1, 1):
    ellipsoid(bm, F(s * .057, .014, -HR * .985), (.009 * k, .01 * k, .005 * k), 6, 4)
make_part("face.glints", bm, rigid("Head"), solid(0, (1, 1, 1)))
bm = bmesh.new()
for s in (-1, 1):
    tube(bm, [F(s * .036, .056, -HR * .93), F(s * .07, .064, -HR * .89), F(s * .1, .056, -HR * .8)], [.008 * k, .01 * k, .007 * k], 5)
make_part("face.brows", bm, rigid("Head"), solid(2, (.85, .85, .85)))
bm = bmesh.new()
ellipsoid(bm, F(0, -.026, -HR * .985), (.017 * k, .015 * k, .016 * k), 8, 6)
for s in (-1, 1):
    ellipsoid(bm, HEAD_C + Vector((s * HR * .97, -.01 * k, .005)), (.022 * k, .036 * k, .03 * k), 8, 6)
make_part("face.nose-ears", bm, rigid("Head"), solid(1, (1, .9, .88)))
bm = bmesh.new()
tube(bm, [F(-.03, -.064, -HR * .9), F(0, -.075, -HR * .93), F(.03, -.064, -HR * .9)], [.005 * k, .007 * k, .005 * k], 5)
make_part("face.smile", bm, rigid("Head"), solid(0, (.36, .16, .16)))

# neck and hands (skin)
bm = bmesh.new()
tube(bm, [(0, 1.4, 0), (0, 1.58, 0)], [.05, .048], 10)
make_part("neck.skin", bm, lambda co: {"Neck": 1.0}, solid(1))
bm = bmesh.new()
for s in (-1, 1):
    ellipsoid(bm, (s * .274, .855, 0), (.048, .06, .044), 10, 7)
make_part("hands.bare", bm, lambda co: {"HandL" if co.x < 0 else "HandR": 1.0}, solid(1))


# ---------------------------------------------------------------- hair (main slot = hair)
def hair_shell(keep, r=1.09, extra=None, face=None):
    """a shell over the head; keep(d) trims it, face(d) in 0..1 tucks it inside the head
    (a smooth hairline instead of a jagged cut)"""
    bm = bmesh.new()
    ellipsoid(bm, HEAD_C + Vector((0, .008, .008)), (HR * r, HR * r * 1.01, HR * r * .99), 26, 18)
    if face:
        for v in bm.verts:
            m = face((v.co - HEAD_C) / k)
            v.co = HEAD_C + (v.co - HEAD_C) * (1 - .22 * m)
    remove_faces(bm, lambda c: keep((c - HEAD_C) / k))
    if extra:
        extra(bm)
    return bm


def hair_paint(co, cen):
    # soft strands: lighter on top, darker underneath
    d = (co - HEAD_C) / k
    v = .8 + .2 * max(0, min(1, (d.y + .1) / .25))
    return ((v, v, v), 1)


HU = .175   # head units: keep() tests run on a head of radius .175


def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# bob with a side-swept fringe (Mira's): the face shows through a soft hairline
def bob_face(d):
    fringe = .05 - .035 * max(-.3, d.x / HU)
    return ss(-HU * .2, -HU * .5, d.z) * ss(fringe + .012, fringe - .012, d.y) * ss(HU * .9, HU * .72, abs(d.x))


def bob_keep(d):
    return d.y > -.15 + .05 * max(0, -d.z / HU) and not (d.z < -HU * .6 and d.y < 0)


make_part("hair.bob", hair_shell(bob_keep, face=bob_face), rigid("Head"), hair_paint, solidify=.02)
# bun: tidy hair with a knot on top
make_part("hair.bun", hair_shell(lambda d: d.y > -.06, face=lambda d: ss(-HU * .1, -HU * .45, d.z) * ss(.085, .06, d.y),
          extra=lambda bm: ellipsoid(bm, HEAD_C + Vector((0, .155 * k, .085 * k)), (.08 * k, .07 * k, .075 * k), 12, 8)), rigid("Head"), hair_paint, solidify=.016)
# short crop
make_part("hair.short", hair_shell(lambda d: d.y > -.03 - .04 * max(0, d.z / HU), r=1.05, face=lambda d: ss(-HU * .05, -HU * .4, d.z) * ss(.095, .07, d.y)), rigid("Head"), hair_paint, solidify=.013)
# long: bob plus a fall down the back
make_part("hair.long", hair_shell(bob_keep, face=bob_face, extra=lambda bm: ellipsoid(bm, (0, 1.5, .11 * k), (.16, .2, .07), 14, 8)), rigid("Head"), hair_paint, solidify=.017)


# ---------------------------------------------------------------- hats (main = hat, accent = band)
TIP = Matrix.Rotation(.24, 3, "X")   # hats sit tipped back, so the face shows under the brim
crown_y = HEAD_C.y + HR * .62


def tipped(bm):
    bmesh.ops.rotate(bm, cent=HEAD_C, matrix=TIP, verts=bm.verts)


def untip(c):
    return TIP.inverted() @ (c - HEAD_C) + HEAD_C


# Mira's wide sun hat: soft drooping brim, round crown, a ribbon band
bm = bmesh.new()
hy = crown_y
cr = HR * .98
prof = [(.0, hy + .17), (.09, hy + .165), (cr * .82, hy + .13), (cr * .97, hy + .06), (cr, hy + .01), (cr + .01, hy), (cr + .09, hy - .012), (cr + .16, hy - .036), (cr + .185, hy - .056),
        (cr + .18, hy - .066), (cr + .15, hy - .05), (cr + .08, hy - .026), (cr + .01, hy - .016)]
lathe(bm, prof, 28)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
tipped(bm)
make_part("hat.wide", bm, rigid("Head"), lambda co, cen: (WHITE, 2) if hy + .012 < untip(cen).y < hy + .055 and Vector((untip(cen).x, 0, untip(cen).z)).length < cr + .02 else (((.92, .92, .92) if int(math.atan2(cen.z, cen.x) * 12) % 2 else WHITE), 1))

# woven cone hat (the town's signature)
bm = bmesh.new()
cy = crown_y - .02
lathe(bm, [(0, cy + .2), (.12, cy + .13), (.3, cy + .04), (.45, cy - .02), (.44, cy - .035), (.3, cy + .02), (cr * .95, cy + .05), (cr * .9, cy + .0)], 24)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
tipped(bm)
make_part("hat.cone", bm, rigid("Head"), lambda co, cen: ((.86, .86, .86) if int((untip(co) - Vector((0, cy, 0))).length * 40) % 2 else WHITE, 1))

# beret
bm = bmesh.new()
ellipsoid(bm, HEAD_C + Vector((.02, HR * .78, .01)), (HR * 1.12, .06, HR * 1.08), 18, 8)
ellipsoid(bm, HEAD_C + Vector((.02, HR * .78 + .065, .01)), (.015, .02, .015), 6, 4)
bmesh.ops.rotate(bm, cent=HEAD_C, matrix=Matrix.Rotation(.22, 3, "Z"), verts=bm.verts)
make_part("hat.beret", bm, rigid("Head"), solid(1))

# ---------------------------------------------------------------- tops (main = shirt, accent = vest/trim)
TORSO = [(.9, .165, .115, 0), (1.0, .175, .12, 0), (1.15, .185, .125, 0), (1.3, .205, .13, 0), (1.4, .2, .12, 0), (1.46, .14, .1, 0), (1.49, .07, .065, 0)]
bm = bmesh.new()
loft(bm, TORSO, 18, cap_top=False)
make_part("top.tunic", bm, torso_w, lambda co, cen: (((.82, .82, .82) if co.y < .96 else WHITE), 1))
bm = bmesh.new()
loft(bm, TORSO, 18, cap_top=False)
make_part("top.vest", bm, torso_w, lambda co, cen: (WHITE, 1) if (abs(cen.x) < .06 and cen.z < 0) or cen.y > 1.42 else (WHITE, 2))
# a wrapped shawl around the shoulders (main = shawl)
bm = bmesh.new()
pts = [(.17 * math.cos(a), 1.41 - .03 * math.cos(a) ** 2, .125 * math.sin(a)) for a in [2 * math.pi * k / 16 for k in range(17)]]
tube(bm, pts, [.05] * len(pts), 8, cap=False)
ellipsoid(bm, (.0, 1.33, -.13), (.06, .07, .03), 8, 6)  # the knot
make_part("shawl.wrap", bm, rigid("Chest"), solid(1))

# sleeves (main = sleeve) with cuffs (accent)
bm = bmesh.new()
for s in (-1, 1):
    tube(bm, [(s * .19, 1.45, 0), (s * .225, 1.3, .005), (s * .25, 1.15, .01), (s * .262, 1.02, .005), (s * .27, .92, 0)], [.07, .062, .052, .046, .044], 10)
make_part("arms.sleeve", bm, lambda co: (lambda sd: {f"UpperArm{sd}": 1 - smooth_step(1.12, 1.2, -co.y + 2.32), f"LowerArm{sd}": smooth_step(1.12, 1.2, -co.y + 2.32)})("L" if co.x < 0 else "R"),
          lambda co, cen: (WHITE, 2) if cen.y < .96 else (WHITE, 1))
bm = bmesh.new()
for s in (-1, 1):
    ellipsoid(bm, (s * .205, 1.42, 0), (.085, .07, .08), 10, 7)  # puffed shoulders
make_part("arms.puff", bm, lambda co: {"UpperArmL" if co.x < 0 else "UpperArmR": 1.0}, solid(1))

# ---------------------------------------------------------------- lower body
bm = bmesh.new()
loft(bm, [(.1, .34, .27, 0), (.35, .3, .24, 0), (.7, .24, .18, 0), (.95, .2, .14, 0), (1.02, .19, .135, 0)], 18, cap_top=False, cap_bottom=False, sq=.9)
make_part("lower.coat", bm, hem_w(.82), lambda co, cen: (((.78, .78, .78) if co.y < .16 else WHITE), 1), solidify=.012)
bm = bmesh.new()
loft(bm, [(.46, .31, .26, 0), (.6, .27, .22, 0), (.8, .21, .16, 0), (.97, .185, .13, 0)], 18, cap_top=False, cap_bottom=False, sq=.9)
make_part("lower.skirt", bm, hem_w(.85), lambda co, cen: ((WHITE, 2) if co.y < .52 else (WHITE, 1)), solidify=.012)
bm = bmesh.new()
for s in (-1, 1):
    tube(bm, [(s * .1, .95, 0), (s * .105, .72, .005), (s * .11, .5, .01), (s * .115, .3, .005), (s * .12, .13, 0)], [.085, .072, .062, .055, .05], 10)
make_part("legs.trousers", bm, lambda co: (lambda sd: {f"UpperLeg{sd}": smooth_step(.44, .56, co.y), f"LowerLeg{sd}": 1 - smooth_step(.44, .56, co.y)})("L" if co.x < 0 else "R"), solid(1))
bm = bmesh.new()
for s in (-1, 1):
    tube(bm, [(s * .095, .9, 0), (s * .105, .7, .005), (s * .11, .5, .01), (s * .115, .3, .005), (s * .12, .13, 0)], [.06, .055, .048, .044, .04], 10)
make_part("legs.stockings", bm, lambda co: (lambda sd: {f"UpperLeg{sd}": smooth_step(.44, .56, co.y), f"LowerLeg{sd}": 1 - smooth_step(.44, .56, co.y)})("L" if co.x < 0 else "R"), solid(1))
bm = bmesh.new()
for s in (-1, 1):
    ellipsoid(bm, (s * .12, .075, -.045), (.062, .07, .12), 12, 8, pow_=.7)
    tube(bm, [(s * .12, .1, 0), (s * .12, .22, 0)], [.058, .056], 10)
make_part("shoes.boot", bm, lambda co: {"FootL" if co.x < 0 else "FootR": 1.0}, lambda co, cen: (((.45, .45, .45), 1) if cen.y < .025 else (WHITE, 1)))

# ---------------------------------------------------------------- accessories
# satchel on the right hip, strap over the left shoulder (main = leather, accent = buckle)
bm = bmesh.new()
ellipsoid(bm, (.235, .93, -.02), (.05, .1, .12), 10, 8, pow_=.6)
make_part("bag.satchel", bm, rigid("Hips"), lambda co, cen: ((WHITE, 2) if cen.x > .28 and abs(cen.y - .95) < .03 else (WHITE, 1)))
bm = bmesh.new()
strap = [(.22, 1.02, -.04), (.1, 1.18, -.15), (-.06, 1.34, -.14), (-.17, 1.45, -.02), (-.1, 1.38, .12), (.06, 1.2, .13), (.2, 1.02, .05)]
tube(bm, strap, [.012] * len(strap), 4, cap=False, flat=2.4)
make_part("bag.strap", bm, torso_w, solid(1))
# an apron (main = apron)
bm = bmesh.new()
loft(bm, [(.35, .2, .02, -.29), (.6, .19, .02, -.21), (.95, .17, .02, -.15)], 8, sq=.4)
make_part("lower.apron", bm, hem_w(.85), solid(1))

tris = 0
for o in col.objects:
    if o.type == "MESH":
        o.data.calc_loop_triangles()
        tris += len(o.data.loop_triangles)
print("body kit parts", len([o for o in col.objects if o.type == "MESH"]), "tris", tris)

if OUT:
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_active_scene=True, use_active_collection=True,
                              export_apply=True, export_yup=True, export_extras=True, export_materials="EXPORT", export_skins=True,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6)
    print("exported", OUT, os.path.getsize(OUT))
