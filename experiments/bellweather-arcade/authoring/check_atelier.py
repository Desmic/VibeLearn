import bpy,bmesh,json
from pathlib import Path
depsgraph=bpy.context.evaluated_depsgraph_get();checks=[]
for o in bpy.data.collections['Sunward Architecture'].objects:
    bm=bmesh.new();bm.from_mesh(o.evaluated_get(depsgraph).data)
    volume=bm.calc_volume(signed=True);bad_edges=sum(not e.is_manifold for e in bm.edges)
    checks.append({'object':o.name,'signed_volume':volume,'non_manifold_edges':bad_edges,'passed':volume>0 and bad_edges==0});bm.free()
result={'scope':'Evaluated authored closed parts, before GLB material grouping; not a glTF decoder validation','passed':all(c['passed'] for c in checks),'parts':len(checks),'checks':checks}
Path('E:/Projects/VibeLearn/artifacts/bellweather-arcade/atelier-blender-geometry.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print({'passed':result['passed'],'parts':len(checks),'failures':[c for c in checks if not c['passed']]})
