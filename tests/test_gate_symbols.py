"""Portable gate signs must travel with the door without changing its collider."""
import json
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class GateSymbolTests(unittest.TestCase):
    def test_symbols_preserve_gate_and_follow_door_transform(self):
        script = r'''
import assert from 'node:assert/strict';
import {gate} from './web/rescue-world-props.js';
import {Entity} from './web/vendor/playcanvas.mjs';
for(const symbol of ['moon','sun','star']){
  const options={width:5,height:6,color:'gold'};
  const plain=gate('test',[3,0,-4],options);
  const marked=gate('test',[3,0,-4],{...options,symbol,symbolHeight:2.3,symbolSize:1.8});
  assert.deepEqual(marked.filter(e=>!e.id.startsWith('test-mark')),plain);
  const nodes=new Map(marked.map(e=>[e.id,new Entity(e.id)]));
  for(const e of marked){
    const n=nodes.get(e.id);
    if(e.parent)nodes.get(e.parent).addChild(n);
    n.setLocalPosition(...(e.position||[0,0,0]));
    n.setLocalScale(...(e.scale||[1,1,1]));
    n.setLocalEulerAngles(...(e.rotation||[0,0,0]));
  }
  const parts=marked.filter(e=>e.parent==='test-mark');
  assert(parts.length>1);
  const before=parts.map(e=>nodes.get(e.id).getPosition().clone());
  nodes.get('test-door').setLocalPosition(0,6,0);
  parts.forEach((e,i)=>{
    const after=nodes.get(e.id).getPosition();
    assert(Math.abs(after.y-before[i].y-6)<1e-5);
    assert(Math.abs(after.x-before[i].x)<1e-5);
    assert(Math.abs(after.z-before[i].z)<1e-5);
    assert(after.z>-4, 'Symbol must be on the front face');
  });
}
assert.throws(()=>gate('bad',[0,0,0],{symbol:'unknown'}));
assert.throws(()=>gate('bad',[0,0,0],{symbol:'moon',symbolSize:0}));
console.log(JSON.stringify({passed:true}));
'''
        result = subprocess.run(['node', '--input-type=module', '-e', script],
                                cwd=ROOT, capture_output=True, text=True,
                                encoding='utf-8', check=True)
        self.assertTrue(json.loads(result.stdout)['passed'])
