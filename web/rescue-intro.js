/* Echo Forge binding for the reusable spec-driven opening. */
'use strict';
(() => {
  const game=window.RescueGame;if(!game)return;
  let opening=null,token=0;
  const load=()=>Promise.all([import('/game-runtime.js'),import('/rescue-playcanvas-world.js'),import('/game-opening.js'),import('/echo-forge-opening-spec.js')]);
  const originalMap=game.map.bind(game),originalRender=game.render.bind(game),originalHide=game.hide.bind(game);
  const authBlocking=()=>Boolean(document.querySelector('#sign-in:not([hidden]),#password-reset:not([hidden])'));
  const cancel=()=>{token++;opening?.close('cancel');opening=null;};
  async function open({replay=false}={}){
    const root=document.querySelector('#rescue-game');if(!root||root.hidden||authBlocking())return;
    cancel();const own=token;const launch=root.querySelector('#rg-launch');
    const previousMenu=root.querySelector('#rg-menu');if(previousMenu)previousMenu.hidden=true;
    try{
      const [runtime,world,controller,content]=await load();
      if(token!==own||!root.isConnected||root.hidden)return;
      opening=controller.openGameOpening({root,spec:content.echoForgeOpeningSpec,runtime:replay?runtime.createGameRuntime():runtime.getGameRuntime(),worldModule:world,replay,onExit:reason=>{
        opening=null;
        if(!replay&&(reason==='skip'||reason==='complete'))launch?.click();
      }});
    }catch(_){if(token===own)window.GameWorldStatus.set(root.querySelector('.rg-world')||root,'failed');}
  }
  function replayControl(){
    const root=document.querySelector('#rescue-game'),menu=root?.querySelector('#rg-menu');
    if(!menu||menu.querySelector('#rg-replay-story'))return;
    const button=document.createElement('button');button.type='button';button.id='rg-replay-story';button.textContent='Replay opening';button.onclick=()=>open({replay:true});menu.prepend(button);
  }
  game.map=(missions,attempt,handlers)=>{
    cancel();const result=originalMap(missions,attempt,handlers);replayControl();
    // Authoritative progress/attempt state, never a browser-wide seen flag.
    const own=token;
    import('/game-opening.js').then(({shouldOpenGame})=>{if(token===own&&!authBlocking()&&shouldOpenGame({missions,attempt}))open();}).catch(()=>{if(token===own)window.GameWorldStatus?.set(document.querySelector('#rescue-game .rg-world'),'failed');});
    return result;
  };
  game.render=(...args)=>{cancel();const result=originalRender(...args);replayControl();return result;};
  game.hide=(...args)=>{cancel();return originalHide(...args);};
})();
