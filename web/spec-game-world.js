/* Generic WorldSpec package adapter. Animation presents state; it never commits it. */
import {createPlayCanvasWorld} from './playcanvas-backend.js';

export function makeWorldPackage(spec,present){
  return {
    gameWorldManifest:{id:spec.id,version:spec.version,engine:'playcanvas'},
    createGameWorld(host,{reducedMotion=false}={}){
      const engine=createPlayCanvasWorld(host,spec,{reducedMotion,pixelRatioCap:1.5});
      let previous=null,frame=0,paused=false,elapsed=0,last=0,transition=null;
      if(engine.available)engine.setControlMode('third-person',spec.id);
      let portrait=null;
      const fit=()=>{
        if(!engine.available||!spec.player?.camera?.portraitDistance)return;
        const next=host.clientWidth/Math.max(1,host.clientHeight)<.9;
        if(next===portrait)return;portrait=next;
        const view=engine.getPlayerView();
        if(view)engine.restorePlayerView({...view,distance:next?spec.player.camera.portraitDistance:spec.player.camera.distance});
      };
      const resize=new ResizeObserver(fit);resize.observe(host);fit();
      const draw=now=>{
        if(!transition)return;
        if(!paused)elapsed+=Math.min((now-last)||0,50);
        last=now;
        const t=Math.min(1,elapsed/transition.duration),u=t*t*(3-2*t);
        const position=transition.from.map((v,i)=>v+(transition.to[i]-v)*u);
        engine.applyPatch({transforms:{[transition.entity]:{position}}});
        if(t<1)frame=requestAnimationFrame(draw);else{engine.applyPatch(transition.finish||{});transition=null;}
      };
      const applyPresentation=patch=>{
        if(!engine.available)return;
        cancelAnimationFrame(frame);transition=null;
        engine.applyPatch(patch);
        if(patch.transition&&!reducedMotion){
          transition=patch.transition;elapsed=0;last=performance.now();
          engine.applyPatch({transforms:{[transition.entity]:{position:transition.from}}});
          frame=requestAnimationFrame(draw);
        }else if(patch.transition){engine.applyPatch(patch.transition.finish||{});}
      };
      const update=value=>{const patch=present(value,previous);previous=value;applyPresentation(patch);};
      return {available:engine.available,engine:'playcanvas',error:engine.error,
        setMissionState:update,setBeat:update,setMode(){},applyPresentation,
        async whenReady(){
          const deadline=performance.now()+15000;
          while(engine.available&&engine.stats().assetsPending>0&&performance.now()<deadline)await new Promise(resolve=>requestAnimationFrame(resolve));
          const status=engine.stats();
          if(!engine.available||status.assetsFailed||status.assetsPending)throw Error('The courier could not load. Reload the workshop to try again.');
        },
        setPaused(value){paused=Boolean(value);engine.setPaused(value);},
        projectEntity:id=>engine.projectEntity(id),pickSemanticAt:(x,y)=>engine.pickEntityAt(x,y),
        getPlayerView:()=>engine.getPlayerView(),restorePlayerView:value=>engine.restorePlayerView(value),
        replay(){if(previous!==null)update(previous);},
        stats:()=>({...engine.stats(),packageAdapter:'world-spec',animating:Boolean(transition)}),
        dispose(){resize.disconnect();cancelAnimationFrame(frame);engine.dispose();}
      };
    }
  };
}
