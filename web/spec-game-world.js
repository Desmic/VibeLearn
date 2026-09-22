/* Generic WorldSpec package adapter. Animation presents state; it never commits it. */
import {createPlayCanvasWorld} from './playcanvas-backend.js';

export function makeWorldPackage(spec,present,{cinematic=false}={}){
  return {
    gameWorldManifest:{id:spec.id,version:spec.version,engine:'playcanvas'},
    createGameWorld(host,{reducedMotion=false}={}){
      const engine=createPlayCanvasWorld(host,spec,{reducedMotion,pixelRatioCap:1.5});
      let previous=null,frame=0,paused=false,elapsed=0,last=0,transition=null,timeline=null,mode='mission';
      if(engine.available)engine.setControlMode('third-person',spec.id);
      let portrait=null;
      const fit=()=>{
        // Authored story shots own actor positions. Restoring the gameplay view
        // during a cinematic resize would also restore its old player position.
        if(mode==='story'||!engine.available||!spec.player?.camera?.portraitDistance)return;
        const next=host.clientWidth/Math.max(1,host.clientHeight)<.9;
        if(next===portrait)return;portrait=next;
        const view=engine.getPlayerView();
        if(view)engine.restorePlayerView({...view,distance:next?spec.player.camera.portraitDistance:spec.player.camera.distance});
      };
      const resize=new ResizeObserver(fit);resize.observe(host);fit();
      const draw=now=>{
        if(!transition&&!timeline)return;
        if(!paused&&!document.hidden)elapsed+=Math.max(0,now-last);
        last=now;
        if(timeline){
          for(const cue of timeline.cues){if(!cue.done&&elapsed>=cue.at){cue.done=true;engine.applyPatch(cue.patch);}}
          for(const move of timeline.moves){
            const t=Math.max(0,Math.min(1,(elapsed-(move.at||0))/move.duration)),u=t*t*(3-2*t);
            if(elapsed>=(move.at||0))engine.applyPatch({transforms:{[move.entity]:{position:move.from.map((v,i)=>v+(move.to[i]-v)*u)}}});
          }
          if(elapsed<timeline.duration)frame=requestAnimationFrame(draw);else{engine.applyPatch(timeline.finish||{});timeline=null;}
          return;
        }
        const t=Math.min(1,elapsed/transition.duration),u=t*t*(3-2*t);
        const position=transition.from.map((v,i)=>v+(transition.to[i]-v)*u);
        engine.applyPatch({transforms:{[transition.entity]:{position}}});
        if(t<1)frame=requestAnimationFrame(draw);else{engine.applyPatch(transition.finish||{});transition=null;}
      };
      const applyPresentation=patch=>{
        if(!engine.available)return;
        cancelAnimationFrame(frame);transition=null;timeline=null;
        engine.applyPatch(patch);
        if(mode==='mission'&&patch.playerCheckpoint&&!engine.setPlayerCheckpoint(patch.playerCheckpoint)){
          throw new Error('The authored player checkpoint is outside the playable world.');
        }
        if(patch.timeline){
          const plan=patch.timeline;
          if(reducedMotion){
            for(const cue of plan.cues||[])engine.applyPatch(cue.patch);
            for(const move of plan.moves||[])engine.applyPatch({transforms:{[move.entity]:{position:move.to}}});
            engine.applyPatch(plan.finish||{});
          }else{
            timeline={...plan,cues:(plan.cues||[]).map(c=>({...c,done:false})),moves:plan.moves||[]};
            elapsed=0;last=performance.now();frame=requestAnimationFrame(draw);
          }
          return;
        }
        if(patch.transition&&!reducedMotion){
          transition=patch.transition;elapsed=0;last=performance.now();
          engine.applyPatch({transforms:{[transition.entity]:{position:transition.from}}});
          frame=requestAnimationFrame(draw);
        }else if(patch.transition){engine.applyPatch(patch.transition.finish||{});}
      };
      const update=value=>{const patch=present(value,previous);previous=value;applyPresentation(patch);};
      const visibility=()=>{last=performance.now();engine.setPaused(paused||document.hidden);};
      document.addEventListener('visibilitychange',visibility);
      return {available:engine.available,engine:'playcanvas',error:engine.error,
        setMissionState:update,setBeat:update,setMode(value){if(cinematic&&mode!==value){mode=value;engine.setControlMode(value==='story'?'overview':'third-person',spec.id);portrait=null;fit();}},applyPresentation,
        async whenReady(){
          const deadline=performance.now()+15000;
          while(engine.available&&engine.stats().assetsPending>0&&performance.now()<deadline)await new Promise(resolve=>requestAnimationFrame(resolve));
          const status=engine.stats();
          if(!engine.available||status.assetsFailed||status.assetsPending)throw Error('The courier could not load. Reload the workshop to try again.');
        },
        setPaused(value){paused=Boolean(value);last=performance.now();engine.setPaused(paused||document.hidden);},
        projectEntity:(id,offset)=>engine.projectEntity(id,offset),pickSemanticAt:(x,y)=>engine.pickEntityAt(x,y),
        colliderSnapshot:()=>engine.colliderSnapshot?.()||[],
        getPlayerView:()=>engine.getPlayerView(),restorePlayerView:value=>engine.restorePlayerView(value),
        replay(){if(previous!==null)update(previous);},
        stats:()=>({...engine.stats(),packageAdapter:'world-spec',animating:Boolean(transition||timeline)}),
        dispose(){resize.disconnect();cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);engine.dispose();}
      };
    }
  };
}
