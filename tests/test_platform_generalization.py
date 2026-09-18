import json
import subprocess
import textwrap
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]


class PlatformGeneralizationTests(unittest.TestCase):
    def test_reusable_contracts_validate_a_materially_different_harbor_game(self):
        modules={
            "world":(ROOT/"web"/"world-spec.js").as_uri(),
            "opening":(ROOT/"web"/"game-opening.js").as_uri(),
            "tutorial":(ROOT/"web"/"tutorial-flow.js").as_uri(),
            "modes":(ROOT/"web"/"experience-mode.js").as_uri(),
            "markers":(ROOT/"web"/"world-marker-layout.js").as_uri(),
        }
        script=textwrap.dedent(f"""
            const {{validateWorldSpec}}=await import({json.dumps(modules["world"])});
            const {{validateOpeningSpec}}=await import({json.dumps(modules["opening"])});
            const {{validateTutorialFlowSpec,createTutorialFlow,validateStateTutorialSpec,selectStateTutorialStep,tutorialStepSucceeded}}=await import({json.dumps(modules["tutorial"])});
            const {{createExperienceModeController}}=await import({json.dumps(modules["modes"])});
            const {{placeWorldMarker}}=await import({json.dumps(modules["markers"])});

            const ensure=(value,message)=>{{if(!value)throw new Error(message);}};

            // A separate proof fixture: a storm-damaged harbor relay with a pressure
            // core, dock workers and a bridge. It deliberately shares no story
            // objects, characters or tutorial wording with the current proof game.
            const world={{
              schemaVersion:'1',id:'harbor.relay',version:'1',
              environment:{{clearColor:'#183247',ambient:'#7894a6',exposure:1.1,fog:{{type:'linear',color:'#7996a8',start:12,end:70}}}},
              materials:{{metal:{{}},stone:{{}},signal:{{}},worker:{{}},water:{{}}}},
              entities:[
                {{id:'pilot',primitive:'capsule',material:'metal',position:[0,0,0]}},
                {{id:'dock-wall',primitive:'box',material:'stone',position:[0,1,-4],scale:[8,2,.5],collider:{{shape:'box',halfExtents:[4,1,.25]}}}},
                {{id:'pressure-core',primitive:'sphere',material:'signal',position:[2,1,-2],
                  storyObject:{{role:'pressure-core',importance:'major',readability:['light','motion']}},
                  motion:{{type:'pulse',amplitude:.12,speed:2.4}}}},
                {{id:'dock-worker',primitive:'capsule',material:'worker',position:[-3,0,1],
                  motion:{{type:'patrol',offset:[2.5,0,-1],speed:.45,phase:.7}}}},
                {{id:'bridge',primitive:'box',material:'stone',position:[0,.3,-6],scale:[4,.5,2],
                  collider:{{shape:'box',halfExtents:[2,.25,1]}}}},
                {{id:'storm-beacon',primitive:'cylinder',material:'signal',position:[0,3,-8]}}
              ],
              cameras:{{
                harbor:{{position:[8,6,11],lookAt:[0,1,-2],fov:48}},
                storm:{{position:[5,4,7],lookAt:[0,2,-6],fov:44}},
                repair:{{position:[4,3,5],lookAt:[2,1,-2],fov:46}}
              }},
              states:{{
                storm:{{camera:'storm',environment:{{clearColor:'#101723',ambient:'#465369',exposure:.72,fog:{{type:'linear',color:'#42546b',start:8,end:46}}}},show:['storm-beacon']}},
                repaired:{{camera:'repair',transforms:{{pressure-core:{{position:[2,1.5,-2]}}}}}}
              }},
              player:{{
                version:'1',entity:'pilot',spawn:[0,0,0],speed:3,
                surfaces:[{{bounds:[-5,5,-3.5,4],height:0}}],
                body:{{radius:.35,height:1.6}},
                camera:{{yaw:10,pitch:25,distance:6,minDistance:2.5,maxDistance:12,targetHeight:1}}
              }}
            }};
            validateWorldSpec(world);

            const opening={{
              id:'harbor-opening',title:'HARBOR RELAY',subtitle:'Storm warning',
              finishLabel:'Take the controls',directionVersion:'1',
              scenes:[
                {{beat:0,title:'Morning shift',body:'Cargo moves while the relay hums.',
                  direction:{{kind:'establishing',channels:['world','character','camera','interaction'],worldAfter:'The harbor routine and relay purpose are visible.'}},
                  action:{{target:'pressure-core',label:'Check the relay'}}}},
                {{beat:1,title:'The surge hits',body:'The storm beacon overloads the relay.',
                  direction:{{kind:'major-event',cause:{{mode:'visible',entity:'storm-beacon'}},causeLeadMs:750,
                    channels:['world','character','camera','lighting','audio'],worldAfter:'The bridge route is unsafe and the relay is unstable.'}}}},
                {{beat:2,title:'Stabilize the harbor',body:'Take control and repair the pressure core.',
                  direction:{{kind:'handoff',channels:['world','character','camera','interaction'],worldAfter:'Direct control begins with one repair target.'}}}}
              ]
            }};
            validateOpeningSpec(opening);

            const controlSpec={{
              id:'harbor-controls',version:'1',skipAllowed:true,
              handoff:{{from:'opening',to:'tutorial',playerRole:'harbor pilot',goal:'Learn movement and inspection before repairing the relay.'}},
              steps:[
                {{id:'steer',skill:'move pilot',observe:'move',focus:'move',success:'pilot position changed',title:'Move along the dock',instructions:{{desktop:'Use movement keys.',touch:'Use the movement control.'}}}},
                {{id:'inspect',skill:'inspect relay',observe:'look',focus:'look',success:'camera changed',title:'Look at the relay',instructions:{{desktop:'Turn the camera.',touch:'Drag the view.'}}}}
              ]
            }};
            validateTutorialFlowSpec(controlSpec);
            const memory=new Map();
            const storage={{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)}};
            const flow=createTutorialFlow(controlSpec,{{storage}});
            flow.bind('harbor-run-1',true);
            ensure(flow.step==='steer','generic tutorial did not start at first step');
            ensure(flow.observe('move')===true&&flow.step==='inspect','generic tutorial did not advance from observed move');
            ensure(flow.observe('look')===true&&flow.step==='done','generic tutorial did not complete');

            const interactionSpec={{
              id:'harbor-repair',version:'1',
              steps:[
                {{id:'vent',stage:'REPAIR 1/2',title:'Vent the pressure line',detail:'Use the marked valve.',feedback:'Pressure drops.',
                  when:{{pressure:'high'}},success:{{pressure:'safe'}},target:'pressure-core',focus:'world',
                  actions:['vent'],primaryAction:'vent',actionLabel:'Vent pressure'}},
                {{id:'reset',stage:'REPAIR 2/2',title:'Restart the relay',detail:'Restart after pressure is safe.',feedback:'The relay stabilizes.',
                  when:{{pressure:'safe',relay:'offline'}},success:{{relay:'online'}},target:'pressure-core',focus:'world',
                  actions:['restart'],primaryAction:'restart',actionLabel:'Restart relay'}}
              ]
            }};
            validateStateTutorialSpec(interactionSpec);
            const vent=selectStateTutorialStep(interactionSpec,{{pressure:'high',relay:'offline'}});
            ensure(vent?.id==='vent','state tutorial selected wrong generic step');
            ensure(tutorialStepSucceeded(vent,{{pressure:'safe',relay:'offline'}}),'state tutorial success detector failed');

            const nodes={{
              '.opening':[{{hidden:false}}],
              '.tutorial':[{{hidden:true}}],
              '.mission':[{{hidden:true}}]
            }};
            const root={{dataset:{{}},querySelectorAll:selector=>nodes[selector]||[]}};
            const modes=createExperienceModeController(root,{{
              modes:['opening','tutorial','mission'],
              surfaces:[
                {{selector:'.opening',modes:['opening']}},
                {{selector:'.tutorial',modes:['tutorial']}},
                {{selector:'.mission',modes:['mission']}}
              ],
              initial:'opening'
            }});
            modes.set('tutorial');
            ensure(nodes['.opening'][0].hidden===true&&nodes['.tutorial'][0].hidden===false&&nodes['.mission'][0].hidden===true,
              'experience-mode exclusivity failed in alternate game');

            const marker={{
              style:{{}},dataset:{{}},
              classList:{{values:new Set(),toggle(name,on){{if(on)this.values.add(name);else this.values.delete(name);}}}}
            }};
            const placed=placeWorldMarker(marker,{{x:900,y:350}},{{viewportWidth:400,safeTop:120,safeBottom:650,critical:true}});
            ensure(placed.edge==='right'&&placed.x===360,'critical world target did not clamp generically');

            console.log(JSON.stringify({{
              world:world.id,
              opening:opening.id,
              tutorial:controlSpec.id,
              interaction:interactionSpec.id,
              finalMode:modes.mode,
              markerEdge:placed.edge
            }}));
        """)
        completed=subprocess.run(
            ["node","--input-type=module","-e",script],
            cwd=ROOT,capture_output=True,text=True,check=True
        )
        result=json.loads(completed.stdout.strip().splitlines()[-1])
        self.assertEqual(result["world"],"harbor.relay")
        self.assertEqual(result["opening"],"harbor-opening")
        self.assertEqual(result["finalMode"],"tutorial")
        self.assertEqual(result["markerEdge"],"right")


if __name__=="__main__":
    unittest.main()
