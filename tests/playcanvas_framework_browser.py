"""Executable proof of the Phase 1 engine-neutral WorldSpec -> PlayCanvas backend seam.

This is architecture/runtime evidence, not a story, gameplay, or learning-quality
score. It proves both an unrelated synthetic world and the current Echo Forge package
mount through the real PlayCanvas backend before UI integration is considered.
"""
import json
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def main():
    out = ROOT / "artifacts"
    out.mkdir(exist_ok=True)
    errors = []
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        proc, url = start_server(Path(tmp) / "playcanvas-framework.db")
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 390, "height": 844})
        context.add_init_script("localStorage.setItem('vibelearn.relay-rescue.intro.v3','seen');")
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            page.goto(url)
            result = page.evaluate("""async () => {
              const {createPlayCanvasWorld} = await import('/playcanvas-backend.js');
              const spec = {
                schemaVersion:'1',
                id:'framework-proof.star-orchard',
                version:'1',
                environment:{clearColor:'#101022',ambient:'#40405a'},
                materials:{
                  star:{diffuse:'#ffd56a',emissive:'#ffd56a',emissiveIntensity:1.3},
                  trunk:{diffuse:'#714a35'},
                  leaf:{diffuse:'#477b61'}
                },
                lights:[{id:'sun',type:'directional',color:'#fff1c2',intensity:1.5,rotation:[35,-20,0]}],
                entities:[
                  {id:'star',primitive:'sphere',material:'star',position:[0,.8,0],scale:[1.2,1.2,1.2],motion:{type:'spin',axis:[0,1,0],speed:28}},
                  {id:'trunk-a',primitive:'cylinder',material:'trunk',position:[-1,-.2,-1],scale:[.25,1.8,.25]},
                  {id:'leaf-a',primitive:'sphere',material:'leaf',position:[-1,1,-1],scale:[1.1,.8,1.1]},
                  {id:'trunk-b',primitive:'cylinder',material:'trunk',position:[1.2,-.2,-1.6],scale:[.25,1.7,.25]},
                  {id:'leaf-b',primitive:'sphere',material:'leaf',position:[1.2,.9,-1.6],scale:[1,.75,1]}
                ],
                cameras:{
                  near:{position:[0,2.3,6],lookAt:[0,.5,-.5],fov:46},
                  far:{position:[0,3.4,8],lookAt:[0,.4,-.8],fov:48}
                },
                states:{
                  seed:{camera:'near'},
                  bloom:{camera:'far',transforms:{star:{position:[0,1.5,0],scale:[1.5,1.5,1.5]}}}
                }
              };
              const host=document.createElement('div');
              host.id='synthetic-playcanvas-host';
              Object.assign(host.style,{position:'fixed',left:'0',top:'0',width:'390px',height:'420px',zIndex:'9999'});
              document.body.append(host);
              const world=createPlayCanvasWorld(host,spec,{pixelRatioCap:1,reducedMotion:false});
              world.setState('bloom');
              await new Promise(resolve=>setTimeout(resolve,180));
              const stats=world.stats();
              const canvas=host.querySelector('canvas');
              const rect=canvas?.getBoundingClientRect();
              const synthetic={...stats,canvasEngine:canvas?.dataset.engine||null,canvasVersion:canvas?.dataset.playcanvasEngine||null,canvasRect:rect?{width:rect.width,height:rect.height}:null};
              world.dispose();host.remove();

              const echoModule=await import('/rescue-playcanvas-world.js');
              const echoHost=document.createElement('div');
              echoHost.id='echo-forge-playcanvas-host';
              Object.assign(echoHost.style,{position:'fixed',left:'0',top:'0',width:'390px',height:'600px',zIndex:'9999'});
              document.body.append(echoHost);
              const echo=echoModule.createGameWorld(echoHost,{reducedMotion:false,mode:'story'});
              await new Promise(resolve=>setTimeout(resolve,180));
              const echoCanvas=echoHost.querySelector('canvas');
              const echoRect=echoCanvas?.getBoundingClientRect();
              const echoResult={available:echo.available,error:echo.error||null,stats:echo.stats?.()||null,canvas:echoCanvas?{width:echoCanvas.width,height:echoCanvas.height,clientWidth:echoCanvas.clientWidth,clientHeight:echoCanvas.clientHeight,rect:echoRect?{width:echoRect.width,height:echoRect.height}:null,engine:echoCanvas.dataset.engine||null,vibelearnEngine:echoCanvas.dataset.vibelearnEngine||null}:null};
              echo.dispose?.();echoHost.remove();
              return {synthetic,echo:echoResult};
            }""")
            synthetic = result["synthetic"]
            assert synthetic["available"] is True, result
            assert synthetic["engine"] == "playcanvas", result
            assert synthetic["engineVersion"] == "2.22.1", result
            assert synthetic["worldId"] == "framework-proof.star-orchard", result
            assert synthetic["state"] == "bloom", result
            assert synthetic["entityCount"] == 5, result
            assert synthetic["canvasCount"] == 1, result
            assert synthetic["cameraVariant"] == "default", result
            assert synthetic["canvasEngine"] == "PlayCanvas 2.22.1", result
            assert synthetic["canvasVersion"] == "2.22.1", result
            assert synthetic["canvasRect"]["width"] > 1 and synthetic["canvasRect"]["height"] > 1, result

            echo = result["echo"]
            assert echo["available"] is True, result
            assert echo["stats"]["engine"] == "playcanvas", result
            assert echo["stats"]["worldId"] == "relay-rescue.echo-forge", result
            assert echo["stats"]["worldVersion"] == "pc-phase1-3", result
            assert echo["stats"]["state"] == "story.0", result
            assert echo["stats"]["cameraVariant"] == "portrait", result
            assert echo["canvas"]["vibelearnEngine"] == "playcanvas", result
            assert echo["canvas"]["rect"]["width"] > 1 and echo["canvas"]["rect"]["height"] > 1, result

            page.screenshot(path=str(out / "playcanvas-framework-390.png"), full_page=True)
            if errors:
                raise AssertionError(errors)
            print(json.dumps({
                "result": "passed",
                "engine": synthetic["engine"],
                "engine_version": synthetic["engineVersion"],
                "synthetic_world": synthetic["worldId"],
                "echo_world": echo["stats"]["worldId"],
                "echo_camera_variant": echo["stats"]["cameraVariant"],
                "checks": [
                    "An unrelated engine-neutral WorldSpec compiled into the real PlayCanvas Engine.",
                    "The generic backend created a measurable embedded canvas without Rescue-specific code.",
                    "The authored Echo Forge WorldSpec selects its portrait camera variant through the same generic backend on a 390x600 surface."
                ],
                "page_errors": errors
            }, indent=2))
        finally:
            context.close()
            browser.close()
            stop_server(proc)


if __name__ == "__main__":
    main()
