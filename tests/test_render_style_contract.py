"""Bounded reusable render authoring, without a game-specific validator."""
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RenderStyleContractTests(unittest.TestCase):
    def test_shared_geometry_and_style_reject_invalid_or_unbounded_input(self):
        script = r"""
          import {validateWorldSpec} from './web/world-spec.js';
          import {gardenGeometries,canopyTree,floatingGarden,habitatTower} from './web/garden-world-kit.js';
          import * as pc from './web/vendor/playcanvas.mjs';
          const base={schemaVersion:'1',id:'observatory',version:'1',
            geometries:{lens:{type:'torus',options:{ringRadius:2,tubeRadius:.1,sectorAngle:180,segments:24,sides:6}}},
            materials:{brass:{diffuse:'#ba8',metalness:.8,gloss:.6}},
            entities:[{id:'instrument',geometry:'lens',material:'brass'}],
            cameras:{view:{position:[0,2,8],lookAt:[0,0,0]}},
            lights:[{type:'directional',shadowResolution:1024,shadowDistance:20,shadowFilter:'pcf3',numCascades:2}]};
          validateWorldSpec(base);
          const reject=change=>{let rejected=false;const s=structuredClone(base);change(s);try{validateWorldSpec(s)}catch{rejected=true}if(!rejected)throw Error('accepted invalid render authoring')};
          reject(s=>s.entities[0].geometry='missing');
          reject(s=>s.entities[0].geometry='constructor');
          reject(s=>s.geometries.lens.type='toString');
          reject(s=>delete s.entities[0].material);
          reject(s=>s.geometries=[]);
          reject(s=>s.entities[0].primitive='torus');
          reject(s=>s.geometries.lens.options.segments=1000000);
          reject(s=>s.geometries.lens.options.segments=3.5);
          reject(s=>s.geometries.lens.options.arbitrary=1);
          reject(s=>s.materials.brass.metalness=2);
          reject(s=>s.materials.brass.emissiveIntensity=Infinity);
          reject(s=>s.lights[0].shadowResolution=8192);
          reject(s=>s.lights[0].numCascades=0);
          reject(s=>s.lights[0].shadowFilter='invented');
          reject(s=>s.materials.brass.texture='missing');
          reject(s=>s.textures={paint:{type:'brush',colors:['#fff','not-a-color']}});
          reject(s=>s.materials.brass.textureRepeat=[Infinity,2]);
          reject(s=>s.entities[0].batchGroup='missing');
          reject(s=>{s.batchGroups={deck:{maxAabbSize:0}};s.entities[0].batchGroup='deck'});
          reject(s=>{s.batchGroups={deck:{maxAabbSize:8}};s.entities[0].batchGroup='deck';s.entities[0].motion={type:'spin',speed:4}});
          reject(s=>{s.batchGroups={deck:{maxAabbSize:8}};s.entities[0].batchGroup='deck';s.entities[0].asset='robot'});
          reject(s=>s.assets={robot:{type:'container',src:'/assets/a.glb',materialOverrides:{Main:'missing'}}});
          const types={sphere:pc.SphereGeometry,torus:pc.TorusGeometry,cone:pc.ConeGeometry,cylinder:pc.CylinderGeometry};
          for(const def of Object.values(gardenGeometries)){
            const mesh=new types[def.type](def.options);
            if(!mesh.positions.every(Number.isFinite)||!mesh.normals.every(Number.isFinite))throw Error('invalid native geometry');
            if(mesh.positions.length/3>2500)throw Error('kit mesh exceeds intended vertex budget');
          }
          // Same kit, a different palette, arrangement and proportions, no game IDs.
          const entities=[...floatingGarden('research-deck',[30,8,-4],{scale:2,deck:'brass',underside:'brass',rim:'brass'}),
            ...canopyTree('specimen',[0,0,0],{parent:'research-deck',scale:.4,palette:['brass','brass','brass','brass']}),
            ...habitatTower('laboratory',[3,0,0],{parent:'research-deck',height:5,width:8,body:'brass',glass:'brass',trim:'brass',plant:'brass'})];
          validateWorldSpec({...base,geometries:gardenGeometries,entities});
          console.log('bounded render styles and alternate composition passed');
        """
        result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
