/* Legacy compatibility surface.
   "Play Canvas" was VibeLearn's old shell name. Phase 1 now uses the real
   PlayCanvas Engine through game-runtime.js. New code should import game-runtime.js. */
'use strict';
import {GAME_RUNTIME_VERSION,getGameRuntime,resetGameRuntime} from './game-runtime.js';
import * as echoForgePlayCanvas from './rescue-playcanvas-world.js';

export const PLAY_CANVAS_VERSION=GAME_RUNTIME_VERSION;
let facade=null;

function resolveWorld(module){
  if(module?.gameWorldManifest&&typeof module.createGameWorld==='function')return module;
  if(module?.storyWorldManifest?.id==='relay-rescue.echo-forge')return echoForgePlayCanvas;
  if(module?.storyWorldManifest&&typeof module.createStoryWorld==='function'){
    return{
      gameWorldManifest:Object.freeze({
        id:module.storyWorldManifest.id,
        version:module.storyWorldManifest.version,
        engine:'legacy-three',
        modes:module.storyWorldManifest.modes||['story']
      }),
      createGameWorld:module.createStoryWorld
    };
  }
  return module;
}

export function getPlayCanvas(){
  if(facade)return facade;
  const runtime=getGameRuntime();
  facade={
    get instanceId(){return runtime.instanceId;},
    get stage(){return runtime.stage;},
    get world(){return runtime.world;},
    mount(module,target,options){return runtime.mount(resolveWorld(module),target,options);},
    showStory(module,target,beat,options){return runtime.showStory(resolveWorld(module),target,beat,options);},
    showMission(module,target,state,options){return runtime.showMission(resolveWorld(module),target,state,options);},
    replay(){return runtime.replay();},
    setPaused(value){return runtime.setPaused(value);},
    detach(){return runtime.detach();},
    disposeWorld(options){return runtime.disposeWorld(options);},
    stats(){return runtime.stats();},
    dispose(){return runtime.dispose();}
  };
  return facade;
}
export function resetPlayCanvas(){facade=null;resetGameRuntime();}
