"""Pure companion composition and authored-pose contract across two worlds."""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class CompanionKitTests(unittest.TestCase):
    def test_opt_in_companions_keep_semantic_anchors_and_connected_poses(self):
        script = r"""
          import {companionRobot,companionPose} from './web/rescue-world-props.js';
          import {validateWorldSpec} from './web/world-spec.js';
          import {worldSpec,openingSpec} from './web/first-words-world.js';
          import * as pc from './web/vendor/playcanvas.mjs';
          const assert=(value,message)=>{if(!value)throw Error(message)};
          const near=(a,b)=>Math.abs(a-b)<.0001;
          const legacy=companionRobot('harbor-worker',[0,0,0],{color:'copper',height:1.1});
          assert(legacy.some(e=>e.id==='harbor-worker-head'&&e.primitive==='box'),'legacy head shape changed');
          assert(!legacy[0].collider,'legacy worker gained an unrequested collider');
          const shell={plate:'shell',frame:'frame',visor:'visor',eyes:'eyes',trim:'trim'};
          const guide=companionRobot('observatory-guide',[2,0,-3],{color:'copper',height:2.2,shell,solid:true});
          const assistant=companionRobot('observatory-assistant',[-2,0,-1],{color:'jade',height:1.3,round:true,shell,solid:true});
          const all=[...guide,...assistant],ids=new Set(all.map(e=>e.id));
          assert(ids.size===all.length,'duplicate companion part IDs');
          for(const e of all)if(e.parent)assert(ids.has(e.parent),`missing parent ${e.parent}`);
          for(const [id,kit] of [['observatory-guide',guide],['observatory-assistant',assistant]]){
            const names=new Set(kit.map(e=>e.id));
            for(const part of ['body','head','face','hand-1','hand1','elbow-1','elbow1','upper-arm-1','upper-arm1','forearm-1','forearm1'])
              assert(names.has(`${id}-${part}`),`${id} lacks stable ${part} anchor`);
            assert(kit[0].collider?.shape==='box'&&kit[0].collider.halfExtents.every(v=>v>0),`${id} lacks bounded solid body`);
          }
          const materials=Object.fromEntries(['copper','jade','shell','frame','visor','eyes','trim'].map(k=>[k,{diffuse:'#789abc'}]));
          validateWorldSpec({schemaVersion:'1',id:'observatory-companions',version:'1',materials,entities:all,
            cameras:{view:{position:[0,3,10],lookAt:[0,1,0]}}});
          const handTargets={'-1':[-.9,1.6,.2],'1':[.8,1.3,.35]};
          const pose=companionPose('observatory-guide',{height:2.2,hands:handTargets});
          for(const side of [-1,1]){
            const hand=pose[`observatory-guide-hand${side}`].position;
            const elbow=pose[`observatory-guide-elbow${side}`].position;
            const shoulder=[side*.36,2.2*.65,0];
            assert(hand.every((v,i)=>near(v,handTargets[side][i])),'authored hand destination lost');
            for(const [name,start,end] of [['upper-arm',shoulder,elbow],['forearm',elbow,hand]]){
              const segment=pose[`observatory-guide-${name}${side}`];
              assert(segment.position.every((v,i)=>near(v,(start[i]+end[i])/2)),`${name} is detached`);
              assert(near(segment.scale[1],Math.hypot(...end.map((v,i)=>v-start[i]))),`${name} length is disconnected`);
              assert(segment.rotation.every(Number.isFinite),`${name} rotation is invalid`);
              const axis=new pc.Quat().setFromEulerAngles(...segment.rotation).transformVector(new pc.Vec3(0,1,0),new pc.Vec3());
              const length=segment.scale[1],expected=end.map((v,i)=>(v-start[i])/length);
              assert([axis.x,axis.y,axis.z].every((v,i)=>Math.abs(v-expected[i])<.001),`${name} rendered cylinder misses its joints`);
              const directed=[axis.x,axis.y,axis.z];
              const from=segment.position.map((v,i)=>v-directed[i]*length/2);
              const to=segment.position.map((v,i)=>v+directed[i]*length/2);
              assert(from.every((v,i)=>Math.abs(v-start[i])<.001)&&to.every((v,i)=>Math.abs(v-end[i])<.001),
                `${name} cylinder endpoints do not meet their joints`);
            }
          }
          validateWorldSpec(worldSpec);
          const actual=new Set(worldSpec.entities.map(e=>e.id));
          for(const id of ['singer','singer-head','singer-hand-1','singer-hand1','friend-a','friend-a-hand-1','friend-a-hand1'])
            assert(actual.has(id),`opening semantic/pose ID changed: ${id}`);
          const entity=id=>worldSpec.entities.find(e=>e.id===id);
          for(const id of ['singer','friend-a'])
            assert(entity(id).collider?.shape==='box'&&entity(id).collider.halfExtents.every(v=>v>0),`${id} needs an authored body collider`);
          assert(entity('singer-body').material!==entity('friend-a-body').material,'companions have identical material identity');
          assert(entity('singer-body').scale[0]!==entity('friend-a-body').scale[0],'companions have identical silhouettes');
          const opening=openingSpec.scenes[0];
          assert(opening.markers.some(m=>m.entity==='singer-head'),'Mira identity marker detached');
          for(const choice of opening.choices){
            for(const patch of [choice.patch,choice.carry])for(const id of Object.keys(patch?.transforms||{}))
              assert(actual.has(id),`authored pose targets missing entity ${id}`);
          }
          console.log('unrelated companion and opening semantic pose contracts passed');
        """
        result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()
