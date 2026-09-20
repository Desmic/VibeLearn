"""Real-engine regression: a zero-speed resting pose must finish its transition.

Synthetic actor fixture; not a creative animation-quality certification.
"""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def main():
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as p:
        proc, url = start_server(Path(temp) / 'rest.db')
        browser = p.chromium.launch()
        try:
            page = browser.new_page()
            page.goto(url + '/first-words')
            result = page.evaluate("""async()=>{
              const {createPlayCanvasWorld}=await import('/playcanvas-backend.js');
              const host=document.createElement('div');
              Object.assign(host.style,{position:'fixed',width:'400px',height:'400px'});
              document.body.append(host);
              const spec={schemaVersion:'1',id:'rest-pose-fixture',version:'1',
                assets:{actor:{type:'container',src:'/assets/quaternius-animated-robot.glb',
                  animations:{rest:'RobotArmature|Robot_Standing',gesture:'RobotArmature|Robot_Wave',walk:'RobotArmature|Robot_Running'}}},
                materials:{},entities:[{id:'actor',asset:'actor',animation:'rest'}],
                cameras:{front:{position:[0,3,10],lookAt:[0,1,0]}},states:{start:{camera:'front'}},
                player:{version:'1',entity:'actor',spawn:[0,0,0],speed:2,surfaces:[{bounds:[-5,5,-5,5],height:0}],
                  animations:{idle:'rest',move:'walk'},animationSpeeds:{idle:0,move:1},
                  camera:{yaw:0,pitch:25,distance:6,minDistance:2,maxDistance:10,targetHeight:1}}};
              const w=createPlayCanvasWorld(host,spec,{reducedMotion:false});
              if(!w.available)throw Error(w.error);
              const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
              try{
                const deadline=performance.now()+15000;
                while(w.stats().assetsPending&&performance.now()<deadline)await wait(50);
                if(w.stats().assetsLoaded!==1)throw Error(JSON.stringify(w.stats()));
                const instance=w.assetInstances.get('actor').instance,anim=instance.anim;
                const pose=()=>{const out=[];const visit=n=>{const q=n.getLocalRotation(),p=n.getLocalPosition();out.push(q.x,q.y,q.z,q.w,p.x,p.y,p.z);for(const c of n.children)visit(c);};visit(instance);return out;};
                const delta=(a,b)=>{let d=0;for(let i=0;i<a.length;i+=7){
                  // q and -q encode the same rotation.
                  const dot=a.slice(i,i+4).reduce((sum,v,k)=>sum+v*b[i+k],0);
                  const sign=dot<0?-1:1;
                  for(let k=0;k<7;k++)d=Math.max(d,Math.abs(a[i+k]-(k<4?sign:1)*b[i+k]));
                }return d;};
                await wait(150);w.applyPatch({animations:{actor:'rest'}});await wait(150);const rest=pose();
                w.applyPatch({animations:{actor:'gesture'}});await wait(650);
                const gestureDelta=delta(rest,pose());
                w.applyPatch({animations:{actor:'rest'}});await wait(350);
                const afterGesture={delta:delta(rest,pose()),transitioning:anim.baseLayer.transitioning};
                w.applyPatch({animations:{actor:'walk'}});await wait(350);
                w.applyPatch({animations:{actor:'rest'}});await wait(350);
                const afterWalk={delta:delta(rest,pose()),transitioning:anim.baseLayer.transitioning};
                return {gestureDelta,afterGesture,afterWalk};
              }finally{w.dispose();host.remove();}
            }""")
            out = ROOT / 'artifacts/animation-rest-report.json'
            out.write_text(json.dumps(result, indent=2), encoding='utf-8')
            print(json.dumps(result), flush=True)
            assert result['gestureDelta'] > .01, result
            for key in ['afterGesture', 'afterWalk']:
                assert not result[key]['transitioning'], result
                assert result[key]['delta'] < .001, result
        finally:
            browser.close()
            stop_server(proc)


if __name__ == '__main__':
    main()
