"""Follow camera clearance against unrelated wall/corner/ceiling layouts."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class FollowCameraTests(unittest.TestCase):
    def test_portrait_collision_clearance_preserves_configured_framing(self):
        script = r'''
import {followCameraClearance,resolveFollowCamera} from MODULE;
const cases=[];
for(const scale of [1,2]){
 const profile={body:{radius:.32*scale,height:1.6*scale},camera:{minDistance:4*scale,distance:7.2*scale,portraitDistance:14*scale}};
 const landscape=followCameraClearance(profile,16/9),portrait=followCameraClearance(profile,390/844);
 const result=resolveFollowCamera([0,1.2*scale,0],{yaw:70.4,pitch:30,distance:14*scale,minClearance:portrait},(x,y,z)=>x>.35*scale&&y<10*scale);
 const zoomed=resolveFollowCamera([0,1.2*scale,0],{yaw:70.4,pitch:30,distance:4*scale,minClearance:portrait},()=>false);
 cases.push({landscape,portrait,result,zoomed,scale});
}
const fallback=followCameraClearance({camera:{minDistance:2,distance:8}},.5);
console.log(JSON.stringify({cases,fallback}));
'''.replace('MODULE', json.dumps((ROOT/'web/player-controls.js').as_uri()))
        result = subprocess.run(['node', '--input-type=module', '-e', script],
                                cwd=ROOT, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        for case in data['cases']:
            with self.subTest(scale=case['scale']):
                self.assertAlmostEqual(case['portrait']/case['landscape'], 14/7.2)
                self.assertGreaterEqual(case['result']['distance'], case['portrait'])
                self.assertTrue(case['result']['clearanceSatisfied'])
                self.assertEqual(case['zoomed']['distance'], 4*case['scale'])
        self.assertAlmostEqual(data['fallback'], 2.4)

    def test_camera_bounds_are_fresh_per_solve_not_per_probe(self):
        script = r'''
import {snapshotCameraBlocker} from BACKEND;
import {resolveFollowCamera} from CONTROLS;
let reads=0;
const wall={min:[.35,0,-20],max:[1,5,20],collider:{}};
const ignored={min:[-20,-20,-20],max:[20,20,20],collider:{blocksCamera:false}};
let visible=true;
const read=id=>{reads++;return id==='wall'?(visible?wall:null):ignored;};
const blocker=snapshotCameraBlocker(['wall','ignored'],read);
let probes=0;
const result=resolveFollowCamera([0,1,0],{yaw:90,pitch:30,distance:18,minClearance:4},(...p)=>{probes++;return blocker(...p);});
const readsAfterSolve=reads;
const initiallyBlocked=blocker(.4,1,0);
wall.min[0]=10;wall.max[0]=11;
const snapshotStillBlocks=blocker(.4,1,0);
const moved=snapshotCameraBlocker(['wall','ignored'],read);
const movedOldPoint=moved(.4,1,0),movedNewPoint=moved(10.5,1,0);
visible=false;
const hidden=snapshotCameraBlocker(['wall','ignored'],read);
console.log(JSON.stringify({result,probes,readsAfterSolve,initiallyBlocked,snapshotStillBlocks,movedOldPoint,movedNewPoint,hiddenPoint:hidden(10.5,1,0)}));
'''.replace('BACKEND', json.dumps((ROOT/'web/playcanvas-backend.js').as_uri())).replace('CONTROLS', json.dumps((ROOT/'web/player-controls.js').as_uri()))
        result = subprocess.run(['node', '--input-type=module', '-e', script],
                                cwd=ROOT, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        self.assertEqual(data['readsAfterSolve'], 2)
        self.assertGreater(data['probes'], 100)
        self.assertTrue(data['result']['clearanceSatisfied'])
        self.assertTrue(data['initiallyBlocked'])
        self.assertTrue(data['snapshotStillBlocks'])
        self.assertFalse(data['movedOldPoint'])
        self.assertTrue(data['movedNewPoint'])
        self.assertFalse(data['hiddenPoint'])

    def test_obstructed_orbits_preserve_clearance_and_bearing(self):
        script = r'''
import {resolveFollowCamera} from MODULE;
const cases=[];
for(const scale of [1,2])for(const side of [-1,1])for(const yaw of [35,70,134.2]){
  const target=[side*8*scale,1.2*scale,-4*scale];
  const blocked=(x,y,z)=>side*x>8.35*scale&&y<4*scale;
  const request={yaw:side*yaw,pitch:29.8,distance:7.2*scale,minClearance:2.4*scale};
  const result=resolveFollowCamera(target,request,blocked);
  let crosses=false;
  for(let t=0;t<=1;t+=.001){
    const p=target.map((v,k)=>v+(result.eye[k]-v)*t);
    crosses ||= blocked(...p);
  }
  const bearing=Math.atan2(result.eye[0]-target[0],result.eye[2]-target[2])*180/Math.PI;
  cases.push({result,request,crosses,bearing});
}
const free=resolveFollowCamera([0,1,0],{yaw:42,pitch:25,distance:9,minClearance:2.4},()=>false);
const corner=resolveFollowCamera([0,1,0],{yaw:45,pitch:15,distance:8,minClearance:2.4},(x,y,z)=>(x>.4||z>.4)&&y<4);
// A sealed low ceiling is genuinely unable to fit a useful follow camera.
const enclosed=resolveFollowCamera([0,1,0],{yaw:0,pitch:25,distance:8,minClearance:2.4},(x,y,z)=>Math.abs(x)>.4||Math.abs(z)>.4||y>1.8);
// Continuous drags near a wall must not flip horizontal movement orientation.
const sweep=[];
for(let yaw=20;yaw<=160;yaw+=.5)sweep.push(resolveFollowCamera([0,1,0],{yaw,pitch:30,distance:7,minClearance:2.4},(x,y,z)=>x>.35&&y<5));
console.log(JSON.stringify({cases,free,corner,enclosed,maxStep:Math.max(...sweep.slice(1).map((r,i)=>Math.hypot(...r.eye.map((v,k)=>v-sweep[i].eye[k]))))}));
'''.replace('MODULE', json.dumps((ROOT/'web/player-controls.js').as_uri()))
        result = subprocess.run(['node', '--input-type=module', '-e', script],
                                cwd=ROOT, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        for case in data['cases']:
            with self.subTest(request=case['request']):
                self.assertTrue(case['result']['clearanceSatisfied'])
                self.assertGreaterEqual(case['result']['distance'], case['request']['minClearance'])
                self.assertFalse(case['crosses'])
                self.assertAlmostEqual(case['bearing'], case['request']['yaw'])
        self.assertEqual(data['free']['distance'], 9)
        self.assertEqual(data['free']['pitch'], 25)
        self.assertFalse(data['free']['adjusted'])
        self.assertTrue(data['corner']['clearanceSatisfied'])
        self.assertFalse(data['enclosed']['clearanceSatisfied'])
        self.assertLess(data['enclosed']['distance'], 2.4)
        self.assertLess(data['maxStep'], .15)


if __name__ == '__main__':
    unittest.main()
