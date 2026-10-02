"""Island set pieces (Blender 4.2+ / 5.x), built from parameters:

  gate-arch.glb  - Blossom Isle's talking Gate: carved stone pillars and voussoirs,
                   bell reliefs on the capitals, a panel at the crown where the game
                   mounts the Gate's face, ivy climbing the pillars.
                   Parts: Stone (vertex colours), Ivy, Flowers. Origin = ground centre,
                   the opening faces +Z/-Z, inner radius `radius` springing at `spring`.
  word-loom.glb  - Loom Isle's Word Loom: a weaver's loom with warp threads, a woven
                   band of coloured pieces, a beater, a bench, and a brass rail of six
                   slots on top (the engine's limited room).
                   Parts: Wood, Threads, Band, Brass, Slots (the game makes these glow).
                   Origin = ground centre, the player's side is +Z.

Parts are authored in GAME coordinates (up +Y) and converted to Blender's Z-up.
Run inside Blender:
  import runpy; runpy.run_path(r".../build_island_props.py", init_globals={"OUT_DIR": r".../public/props"})
"""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix

P = dict(radius=1.7, spring=1.4, depth=.6, voussoirs=11,
         stone=(.94, .89, .79), stone_warm=(.91, .84, .72), stone_dark=(.78, .72, .62), mortar=(.62, .56, .5),
         ivy=(.36, .55, .38), ivy_light=(.5, .68, .44), flower=(.96, .66, .76),
         loom_w=2.6, loom_h=2.3, slots=6,
         wood=(.48, .34, .25), wood_dark=(.34, .24, .18), wood_light=(.62, .46, .33), thread=(.95, .91, .82),
         brass=(.8, .6, .3), slot=(.24, .2, .32),
         band=((.91, .44, .44), (.94, .75, .35), (.44, .72, .91), (.69, .48, 1.0), (.49, .79, .54), (.95, .6, .75)))
P.update(globals().get("PARAMS", {}))
OUT_DIR = globals().get("OUT_DIR")
TO_BLENDER = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))


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


def material(name, color=(1, 1, 1), emissive=None, strength=1.0, rough=.85):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = rough
    a = nt.nodes.new("ShaderNodeVertexColor")
    a.layer_name = "Col"
    nt.links.new(a.outputs["Color"], bsdf.inputs["Base Color"])
    if emissive:
        bsdf.inputs["Emission Color"].default_value = (*emissive, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def finish(col, name, bm, mat, paint, smooth=False):
    """paint(co, face_centre, face) -> rgb, in game coordinates; then convert and link"""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    lay = bm.loops.layers.color.new("Col")
    for f in bm.faces:
        c = f.calc_center_median()
        for l in f.loops:
            l[lay] = (*paint(l.vert.co, c, f), 1)
    bmesh.ops.transform(bm, matrix=TO_BLENDER, verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = smooth
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    return o


def box(bm, c, size, rot=0.0, axis="Z", bevel=.035):
    tmp = bmesh.new()
    bmesh.ops.create_cube(tmp, size=1)
    bmesh.ops.scale(tmp, vec=size, verts=tmp.verts)
    if bevel:
        bmesh.ops.bevel(tmp, geom=tmp.verts[:] + tmp.edges[:], offset=bevel, segments=1, affect="EDGES", profile=.5)
    if rot:
        bmesh.ops.rotate(tmp, cent=(0, 0, 0), matrix=Matrix.Rotation(rot, 3, axis), verts=tmp.verts)
    bmesh.ops.translate(tmp, vec=Vector(c), verts=tmp.verts)
    merge(bm, tmp)


def merge(bm, other):
    me = bpy.data.meshes.new("tmp")
    other.to_mesh(me)
    other.free()
    bm.from_mesh(me)
    bpy.data.meshes.remove(me)


def tube(bm, pts, radii, segs=8, cap=True):
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        a = d.cross(Vector((0, 0, 1)))
        if a.length < 1e-3:
            a = d.cross(Vector((1, 0, 0)))
        a.normalize()
        b = d.cross(a).normalized()
        rings.append([bm.verts.new(p + (a * math.cos(2 * math.pi * k / segs) + b * math.sin(2 * math.pi * k / segs)) * radii[i]) for k in range(segs)])
    for i in range(len(rings) - 1):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    if cap:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])


def lathe(bm, prof, segs, c=(0, 0, 0), axis=None):
    c = Vector(c)
    rings = []
    for k in range(segs):
        a = 2 * math.pi * k / segs
        rings.append([bm.verts.new(c + Vector((r * math.cos(a), y, r * math.sin(a)))) for r, y in prof])
    for k in range(segs):
        a, b = rings[k], rings[(k + 1) % segs]
        for m in range(len(prof) - 1):
            bm.faces.new((a[m], a[m + 1], b[m + 1], b[m]))


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


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
                              export_apply=True, export_yup=True, export_extras=True, export_materials="EXPORT",
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6)
    print("exported", path, os.path.getsize(path))


# ======================================================================
# The Gate
# ======================================================================
rng = random.Random(17)
col = fresh_scene("Prop_gate_arch")
M_STONE = material("GateStone", rough=.9)
M_IVY = material("GateIvy")
R, SY, D = P["radius"], P["spring"], P["depth"]
PX = R + .08                      # pillar centre line
stone = bmesh.new()
tones = []                        # (centre, tone) for painting each block
# pillars: a wide plinth, four courses of blocks, a capital with a bell relief
for s in (-1, 1):
    box(stone, (s * PX, .09, 0), (.82, .18, .84), bevel=.03)
    tones.append(((s * PX, .09, 0), P["stone_dark"]))
    for k in range(4):
        h = .33
        y = .18 + h / 2 + k * (h + .012)
        w = .58 + rng.uniform(-.02, .02)
        box(stone, (s * PX + rng.uniform(-.015, .015), y, 0), (w, h, .62 + rng.uniform(-.02, .02)), rot=rng.uniform(-.03, .03), axis="Y")
        tones.append(((s * PX, y, 0), P["stone"] if k % 2 else P["stone_warm"]))
    cap_y = .18 + 4 * .342 + .09
    box(stone, (s * PX, cap_y, 0), (.72, .18, .74), bevel=.04)
    tones.append(((s * PX, cap_y, 0), P["stone_dark"]))
    # bell relief on both faces of the capital block below the cap
    for fz in (-1, 1):
        bell = bmesh.new()
        prof = [(0.0, 0.0), (.1, 0.0), (.095, .03), (.07, .1), (.06, .16), (.035, .2), (0.0, .21)]
        lathe(bell, prof, 10)
        bmesh.ops.scale(bell, vec=(1, 1, .35), verts=bell.verts)
        bmesh.ops.translate(bell, vec=(s * PX, cap_y - .44, fz * .31), verts=bell.verts)
        merge(stone, bell)
        tones.append(((s * PX, cap_y - .38, fz * .31), P["stone_dark"]))
# voussoirs: wedge blocks around the arch, the keystone deeper and taller
n = P["voussoirs"]
for i in range(n):
    a0, a1 = math.pi * i / n, math.pi * (i + 1) / n
    key = i == (n - 1) // 2
    r0, r1 = R, R + (.5 if key else .38)
    vb = bmesh.new()
    gap = .012
    ring = []
    for a in (a0 + gap, a1 - gap):
        for r in (r0, r1):
            for z in (-D / 2 - (.04 if key else 0), D / 2 + (.04 if key else 0)):
                ring.append(vb.verts.new((math.cos(a) * r, SY + math.sin(a) * r, z)))
    bmesh.ops.convex_hull(vb, input=vb.verts)
    merge(stone, vb)
    am = (a0 + a1) / 2
    tones.append(((math.cos(am) * (r0 + r1) / 2, SY + math.sin(am) * (r0 + r1) / 2, 0), P["stone_warm"] if key else (P["stone"] if i % 2 else P["stone_warm"])))
# springer blocks join pillars to the arch
for s in (-1, 1):
    box(stone, (s * PX, SY + .02, 0), (.62, .2, .66), bevel=.03)
    tones.append(((s * PX, SY + .02, 0), P["stone"]))
# the crown panel: a carved frame the Gate's face sits on (face centre at y 3.05, z .32)
box(stone, (0, 3.05, .12), (1.66, .98, .22), bevel=.05)
tones.append(((0, 3.05, .12), P["stone_dark"]))
box(stone, (0, 3.6, .1), (1.0, .14, .3), bevel=.04)          # a little cornice over the face
tones.append(((0, 3.6, .1), P["stone_warm"]))


def stone_paint(co, cen, f):
    best, bd = P["stone"], 1e9
    for c, t in tones:
        d = (Vector(c) - cen).length
        if d < bd:
            bd, best = d, t
    # darker toward the ground, and in the hollows (faces pointing down)
    shade = .9 + .1 * min(1, co.y / 1.5)
    if f.normal.y < -.5:
        shade *= .85
    return tuple(x * shade for x in best)


finish(col, "Stone", stone, M_STONE, stone_paint)

# ivy: leaf cards climbing each pillar's front and side, a few flowers
ivy = bmesh.new()
for s in (-1, 1):
    for k in range(34):
        side = rng.choice((1, 1, 1, -1))   # mostly the player's face
        y = rng.uniform(.15, 1.25) ** 1.3 * 1.05 + .1
        x = s * PX + rng.uniform(-.3, .3) * (1 - y / 2)
        z = side * (.32 + rng.uniform(0, .02))
        size = rng.uniform(.07, .12)
        a = rng.uniform(0, math.pi * 2)
        c = Vector((x, y, z))
        u = Vector((math.cos(a), math.sin(a), 0)) * size
        v = Vector((-math.sin(a), math.cos(a), 0)) * size * .7
        vs = [ivy.verts.new(c + w + Vector((0, 0, side * rng.uniform(0, .03)))) for w in (u, v, -u * .6, -v)]
        ivy.faces.new(vs)
    # a vine strand
    pts = [Vector((s * (PX - .22) + rng.uniform(-.05, .05), .1 + t * 1.2, .33)) for t in (0, .3, .6, .9, 1.0)]
    tube(ivy, pts, [.012] * len(pts), 4)
finish(col, "Ivy", ivy, M_IVY, lambda co, cen, f: P["ivy_light"] if (hash((round(cen.x, 2), round(cen.y, 2))) % 3 == 0) else P["ivy"])
flowers = bmesh.new()
for s in (-1, 1):
    for k in range(6):
        g = bmesh.ops.create_icosphere(flowers, subdivisions=1, radius=.035)
        bmesh.ops.translate(flowers, vec=(s * PX + rng.uniform(-.25, .25), rng.uniform(.3, 1.3), .36), verts=g["verts"])
finish(col, "Flowers", flowers, M_IVY, lambda co, cen, f: P["flower"])
print("gate tris", tris_of(col))
export(col, "gate-arch")

# ======================================================================
# The Word Loom
# ======================================================================
rng = random.Random(31)
col = fresh_scene("Prop_word_loom")
M_WOOD = material("LoomWood")
M_THREAD = material("LoomThread")
M_BRASS = material("LoomBrass", rough=.35)
M_SLOT = material("LoomSlot", emissive=(.69, .48, 1.0), strength=.4)
W, H = P["loom_w"], P["loom_h"]
wood = bmesh.new()
for s in (-1, 1):
    x = s * W / 2
    for z in (-.42, .42):
        box(wood, (x, H / 2, z), (.14, H, .14), bevel=.02)                       # posts
        g = bmesh.new()                                                            # turned finials
        lathe(g, [(0, 0), (.08, .0), (.09, .04), (.06, .09), (.075, .14), (.03, .2), (0, .22)], 10, c=(x, H, z))
        merge(wood, g)
    box(wood, (x, .08, 0), (.2, .14, 1.2), bevel=.03)                               # foot
    box(wood, (x, 1.25, 0), (.1, .1, .84), bevel=.015)                             # side rail
    box(wood, (x, H - .25, 0), (.1, .1, .84), bevel=.015)
    tube(wood, [(x, .2, -.42), (x, 1.2, .42)], [.035, .035], 6)                    # brace
# beams: top, breast beam (front), cloth beam, back warp beam
for (y, z, r) in ((H - .12, 0, .07), (.92, .5, .06), (.62, .45, .09), (.62, -.45, .09)):
    tube(wood, [(-W / 2 - .1, y, z), (W / 2 + .1, y, z)], [r, r], 12)
# beater (reed frame) hanging at mid height
box(wood, (0, 1.45, .2), (W - .2, .09, .07), bevel=.015)
box(wood, (0, 1.2, .2), (W - .2, .06, .05), bevel=.01)
# the weaver's bench (Tavi's side) and a spool peg
box(wood, (0, .45, -.95), (1.3, .08, .34), bevel=.02)
for s in (-1, 1):
    box(wood, (s * .55, .22, -.95), (.08, .44, .28), bevel=.015)
finish(col, "Wood", wood, M_WOOD, lambda co, cen, f: P["wood_light"] if f.normal.y > .6 else (P["wood_dark"] if cen.y < .2 else P["wood"]), smooth=False)

# warp threads: thin ribbons from the top beam down over the breast beam to the back beam
threads = bmesh.new()
nw = 28
for i in range(nw):
    x = -W / 2 + .18 + i * (W - .36) / (nw - 1)
    pts = [(x, H - .12, .05), (x, 1.45, .2), (x, .92, .55), (x, .62, .53)]
    for a, b in zip(pts, pts[1:]):
        w = .006
        vs = [threads.verts.new(v) for v in ((a[0] - w, a[1], a[2]), (a[0] + w, a[1], a[2]), (b[0] + w, b[1], b[2]), (b[0] - w, b[1], b[2]))]
        threads.faces.new(vs)
finish(col, "Threads", threads, M_THREAD, lambda co, cen, f: P["thread"])

# the woven band: pieces of uneven width (pieces are not whole words) wound round the cloth beam
band = bmesh.new()
x = -W / 2 + .2
face_col = {}
while x < W / 2 - .25:
    w = min(.14 + rng.random() * .3, W / 2 - .2 - x)
    c = P["band"][rng.randrange(len(P["band"]))]
    for (y0, y1, z0, z1) in ((.93, 1.12, .56, .5), (.7, .93, .6, .56)):
        vs = [band.verts.new(v) for v in ((x, y0, z0), (x + w, y0, z0), (x + w, y1, z1), (x, y1, z1))]
        face_col[band.faces.new(vs)] = c
    x += w + .015
finish(col, "Band", band, M_THREAD, lambda co, cen, f: face_col.get(f, P["thread"]))

# the brass rail and its six slots (sockets the pieces drop into)
brass = bmesh.new()
box(brass, (0, H + .08, 0), (W + .1, .05, .12), bevel=.01)
slots = bmesh.new()
ns = P["slots"]
for i in range(ns):
    sx = -W / 2 + .35 + i * (W - .7) / (ns - 1)
    for dx in (-.17, .17):
        box(brass, (sx + dx, H + .23, 0), (.03, .26, .1), bevel=.006)       # socket cheeks
    box(brass, (sx, H + .36, 0), (.37, .03, .1), bevel=.006)               # socket lid
    box(slots, (sx, H + .22, 0), (.3, .2, .05), bevel=.01)                 # the slot itself
for s in (-1, 1):
    g = bmesh.new()
    g2 = bmesh.ops.create_icosphere(g, subdivisions=1, radius=.05)
    bmesh.ops.translate(g, vec=(s * (W / 2 + .05), H + .08, 0), verts=g2["verts"])
    merge(brass, g)
finish(col, "Brass", brass, M_BRASS, lambda co, cen, f: P["brass"])
finish(col, "Slots", slots, M_SLOT, lambda co, cen, f: P["slot"])
print("loom tris", tris_of(col))
export(col, "word-loom")
