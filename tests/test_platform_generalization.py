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
            "choices":(ROOT/"web"/"reversible-choice.js").as_uri(),
            "focus":(ROOT/"web"/"world-interaction-focus.js").as_uri(),
            "pending":(ROOT/"web"/"pending-source.js").as_uri(),
            "visibility":(ROOT/"web"/"world-feature-visibility.js").as_uri(),
        }
        script=textwrap.dedent(f"""
            const {{validateWorldSpec}}=await import({json.dumps(modules["world"])});
            const {{validateOpeningSpec}}=await import({json.dumps(modules["opening"])});
            const {{validateTutorialFlowSpec,createTutorialFlow,validateStateTutorialSpec,selectStateTutorialStep,tutorialStepSucceeded}}=await import({json.dumps(modules["tutorial"])});
            const {{createExperienceModeController}}=await import({json.dumps(modules["modes"])});
            const {{placeWorldMarker,parkWorldCarrier}}=await import({json.dumps(modules["markers"])});
            const {{createReversibleChoice}}=await import({json.dumps(modules["choices"])});
            const {{createEntityMatcher,carrierAtFocus}}=await import({json.dumps(modules["focus"])});
            const {{createPendingSourceStore}}=await import({json.dumps(modules["pending"])});
            const {{probeWorldFeature}}=await import({json.dumps(modules["visibility"])});

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
                {{id:'gauge-lens',parent:'pressure-core',primitive:'sphere',material:'signal',position:[0,.2,.2]}},
                {{id:'pressure-core-spare',primitive:'sphere',material:'metal',position:[3,1,-2]}},
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
                repaired:{{camera:'repair',transforms:{{'pressure-core':{{position:[2,1.5,-2]}}}}}}
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
            const parked={{offsetWidth:120,offsetHeight:48,style:{{}},dataset:{{}},
              classList:{{add(){{}}}}}};
            ensure(parkWorldCarrier(parked,{{viewportWidth:400,safeTop:100,safeBottom:250}})
              &&parked.style.left==='332px'&&parked.style.top==='156px'
              &&parked.dataset.edge==='bottom','required harbor carrier did not park within safe area');

            // Same interaction guarantees in a harbor lesson, with no Bellweather
            // names or learning IDs: child mesh hits route to the parent object,
            // a spent relay hint yields to the active bridge, and tentative
            // answers cannot dispatch an assessed command until commitment.
            const hitsEntity=createEntityMatcher(world.entities);
            ensure(hitsEntity('gauge-lens','pressure-core')
              &&hitsEntity('pressure-core','pressure-core')
              &&!hitsEntity('pressure-core-spare','pressure-core'),
              'semantic child hit routing must follow authored parentage, not IDs');
            const cyclic=createEntityMatcher([{{id:'cycle-a',parent:'cycle-b'}},{{id:'cycle-b',parent:'cycle-a'}}]);
            ensure(!cyclic('cycle-a','missing-root'),'cyclic generated ancestry did not terminate');
            ensure(!carrierAtFocus('pressure-core','bridge')
              &&carrierAtFocus('bridge','bridge'),'spent guidance did not yield');
            let dispatched=[];
            const pending=createReversibleChoice();
            pending.select('harbor-attempt:3:prediction','core-a');
            pending.select('harbor-attempt:3:prediction','core-b');
            ensure(dispatched.length===0,'tentative selection dispatched evidence');
            const commit=()=>pending.commit('harbor-attempt:3:prediction',action=>dispatched.push(action));
            await commit();await commit();
            ensure(dispatched.length===1&&dispatched[0]==='core-b','explicit commitment did not dispatch once');
            ensure(pending.selected('harbor-attempt:4:prediction')===null,'selection leaked across revision');
            const values=new Map();
            const pendingStorage={{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};
            const carried=createPendingSourceStore(pendingStorage,'harbor-source');
            const scope={{attemptId:'harbor-attempt:3',version:'harbor-lesson-2',kind:'dock-note'}};
            carried.set(scope,'gauge-report');
            ensure(carried.read(scope,['gauge-report','storm-warning'])==='gauge-report','reversible harbor source did not survive reload');
            ensure(carried.read({{...scope,attemptId:'harbor-attempt:4'}},['gauge-report'])===null,'pending source leaked into another attempt');
            ensure(carried.read(scope,['storm-warning'])===null,'unknown source was accepted');
            carried.clear(scope);
            ensure(carried.read(scope,['gauge-report'])===null,'cancel did not clear pending source');

            // A landmark's entity/DOM presence alone cannot certify that it is
            // readable: a nearer board or a painted control can cover its mark.
            let front='storm-beacon-glow';
            const beacon={{projectEntity:()=>({{x:37,y:42,inFront:true,visible:true}}),pickSemanticAt:async()=>front}};
            const feature={{entity:'storm-beacon-glow',acceptedHits:['storm-beacon-glow']}};
            ensure((await probeWorldFeature(beacon,feature)).visible,'clear harbor beacon was rejected');
            front='warning-board';
            ensure((await probeWorldFeature(beacon,feature)).reason==='occluded','nearer harbor board hid no feature');
            front='storm-beacon-glow';
            ensure((await probeWorldFeature(beacon,feature,()=>'.dock-action')).reason==='overlay','painted dock control hid no feature');

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
            cwd=ROOT,capture_output=True,text=True
        )
        self.assertEqual(
            completed.returncode,0,
            f"alternate-game contract fixture failed:\nSTDOUT:\n{completed.stdout}\nSTDERR:\n{completed.stderr}"
        )
        result=json.loads(completed.stdout.strip().splitlines()[-1])
        self.assertEqual(result["world"],"harbor.relay")
        self.assertEqual(result["opening"],"harbor-opening")
        self.assertEqual(result["finalMode"],"tutorial")
        self.assertEqual(result["markerEdge"],"right")


if __name__=="__main__":
    unittest.main()
