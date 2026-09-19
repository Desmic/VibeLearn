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


if __name__ == '__main__':
    unittest.main()
