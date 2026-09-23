"""World targets must not steal controls or escape the viewport."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class WorldMarkerLayoutTests(unittest.TestCase):
    def test_button_footprint_and_control_clearance(self):
        script = r'''
import {placeWorldMarker} from MODULE;
function marker(width=105,height=44){
  return {style:{},dataset:{},offsetHeight:height,
    get offsetWidth(){return width+(this.dataset.edge?18:0);},
    classList:{toggle(){}}};
}
function rect(m,p){return {left:p.x-m.offsetWidth/2,right:p.x+m.offsetWidth/2,top:p.y-m.offsetHeight,bottom:p.y};}
function overlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
const cases=[];
for(const width of [360,390,430,1280]){
  const controls=[{left:16,right:86,top:550,bottom:627},{left:width-60,right:width-16,top:431,bottom:625}];
  for(const target of [{x:94,y:2000},{x:-300,y:500},{x:width+400,y:1500}]){
    for(const labelWidth of [105,190]){
      const m=marker(labelWidth),p=placeWorldMarker(m,target,{
        viewportWidth:width,safeTop:240,safeBottom:628,critical:true,avoidRects:controls
      });
      const r=rect(m,p);
      cases.push({width,target,labelWidth,placed:p.placed,edge:p.edge,
        inside:r.left>=0&&r.right<=width&&r.top>=196&&r.bottom<=628,
        overlaps:controls.some(c=>overlap(r,c))});
    }
  }
}
const busy=[{left:0,right:400,top:0,bottom:800}];
const noSpace=placeWorldMarker(marker(),{x:200,y:400},{viewportWidth:400,safeTop:200,safeBottom:600,critical:true,avoidRects:busy});
const tooWide=placeWorldMarker(marker(500),{x:200,y:400},{viewportWidth:400,safeTop:200,safeBottom:600,critical:true});
const ordinary=placeWorldMarker(marker(),{x:200,y:400},{viewportWidth:400,safeTop:200,safeBottom:600,avoidRects:busy});
console.log(JSON.stringify({cases,noSpace,tooWide,ordinary}));
'''.replace('MODULE', json.dumps((ROOT/'web/world-marker-layout.js').as_uri()))
        result = subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,
                                capture_output=True,text=True,check=True)
        data = json.loads(result.stdout)
        for case in data['cases']:
            with self.subTest(case=case):
                self.assertTrue(case['placed'],case)
                self.assertTrue(case['inside'],case)
                self.assertFalse(case['overlaps'],case)
                self.assertTrue(case['edge'],case)
        self.assertFalse(data['noSpace']['placed'])
        self.assertFalse(data['tooWide']['placed'])
        self.assertFalse(data['ordinary']['placed'])

    def test_a_declared_carrier_parks_instead_of_vanishing(self):
        """Guide I9: a label that carries a decision may slide and edge-cue, but a
        crowded viewport must not delete it — that is how all three route boards
        disappeared from the 390px phone build while every budget still passed."""
        script = r'''
import {placeWorldMarker} from MODULE;
const marker=(w,h)=>({style:{},dataset:{},offsetHeight:h,
  get offsetWidth(){return w+(this.dataset.edge?18:0);},classList:{toggle(){}}});
const band={viewportWidth:390,safeTop:76,safeBottom:654};
const hero={left:120,right:270,top:300,bottom:420};      // B2 focal keep-out box
const anchor={x:195,y:360};                              // its board projects behind him
const plain=placeWorldMarker(marker(170,60),anchor,{...band,avoidRects:[hero]});
const carrier=placeWorldMarker(marker(170,60),anchor,{...band,avoidRects:[hero],parkWhenFull:true});
// Three carriers crowding one narrow band: each must still land somewhere readable.
const placed=[];const rects=[];
for(const [i,x] of [150,190,230].entries()){
  const m=marker(170,60);
  const p=placeWorldMarker(m,{x,y:330+i*30},{...band,avoidRects:rects,parkWhenFull:true});
  placed.push(p);if(p.placed)rects.push({left:p.x-85,right:p.x+85,top:p.y-60,bottom:p.y});
}
console.log(JSON.stringify({plain,carrier,allThree:placed.every(p=>p.placed)}));
'''.replace('MODULE', json.dumps((ROOT/'web/world-marker-layout.js').as_uri()))
        result = subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,
                                capture_output=True,text=True,check=True)
        data = json.loads(result.stdout)
        self.assertFalse(data['plain']['placed'], data['plain'])
        self.assertTrue(data['carrier']['placed'], data['carrier'])
        self.assertTrue(data['carrier']['edge'], 'a displaced carrier must point back to its object')
        self.assertTrue(data['allThree'], data)

    def test_focal_keepout_box_covers_the_b2_probe_ring(self):
        """A label clearing only the body can still sit in the subject's own space."""
        script = r'''
import {focalClearanceBox,projectedEntityBox,FOCAL_CLEARANCE_PX} from MODULE;
// Screen mapping: +x world -> +50px right, +y world -> -50px up.
const worldWith=(originBehind,bodyBehind)=>({projectEntity:(id,o=[0,0,0])=>({
  x:200+o[0]*50, y:400-o[1]*50,
  inFront:!(id!=='zip'||(originBehind&&!o.some(v=>v!==0))||(bodyBehind&&o[1]!==0)),
  visible:true})});
const box={top:[0,2,0],bottom:[0,-2,0],left:[-0.2,0,0],right:[0.2,0,0]};
const inside=(r,p)=>p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;
const probe=[[-1,0],[1,0],[0,-1],[0,1]]
  .map(([dx,dy])=>({x:200+dx*FOCAL_CLEARANCE_PX,y:400+dy*FOCAL_CLEARANCE_PX}));
const world=worldWith(false,false);
console.log(JSON.stringify({
  ring:FOCAL_CLEARANCE_PX,
  body:projectedEntityBox(world,'zip',box),
  union:focalClearanceBox(world,'zip',box),
  originBehind:focalClearanceBox(worldWith(true,false),'zip',box),
  bodyBehind:focalClearanceBox(worldWith(false,true),'zip',box),
  probeInUnion:probe.every(p=>inside(focalClearanceBox(world,'zip',box),p)),
  probeInBody:probe.every(p=>inside(projectedEntityBox(world,'zip',box),p)),
}));
'''.replace('MODULE', json.dumps((ROOT/'web/world-marker-layout.js').as_uri()))
        result = subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,
                                capture_output=True,text=True,check=True)
        data = json.loads(result.stdout)
        self.assertEqual(data['union'], {'left': 152, 'right': 248, 'top': 300, 'bottom': 500})
        self.assertTrue(data['probeInUnion'], data)
        # The 23 September phone defect: the silhouette alone leaves the ring exposed.
        self.assertFalse(data['probeInBody'], data['body'])
        self.assertEqual(data['originBehind'], data['body'])
        self.assertEqual(data['bodyBehind'],
                         {'left': 200 - data['ring'], 'right': 200 + data['ring'],
                          'top': 400 - data['ring'], 'bottom': 400 + data['ring']})


if __name__ == '__main__':
    unittest.main()
