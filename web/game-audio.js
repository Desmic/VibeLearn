/* Original Bellweather score v1. Synthesized locally; no downloads or model API.
   Semantic presentation cues only. Audio never establishes game success. */
export function createGameAudio(){
  let context=null,musicBus=null,effectsBus=null,timer=0,bar=0,next=0,phase='home',paused=false,disposed=false;
  const active=new Set(),heard=new Set();
  let preferences={music:true,effects:true,muted:false};
  try{preferences={...preferences,...JSON.parse(localStorage.getItem('vibelearn-audio')||'{}')};}catch{}
  const frequency=n=>440*2**((n-69)/12);
  function voice(note,start,length,volume,bus,type='triangle'){
    if(!context)return;
    const osc=context.createOscillator(),gain=context.createGain();
    osc.type=type;osc.frequency.value=frequency(note);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    osc.connect(gain);gain.connect(bus);osc.start(start);osc.stop(start+length+.03);
    active.add(osc);osc.onended=()=>{active.delete(osc);osc.disconnect();gain.disconnect();};
  }
  const tune=[[74,78,81,78,76,74,69,0],[71,74,78,0,76,74,71,0],[67,71,74,78,76,74,71,0],[69,73,76,81,78,76,74,0],
    [74,78,81,86,83,81,78,0],[71,74,78,81,78,76,74,0],[67,71,74,76,78,76,74,71],[69,73,76,78,76,73,74,0]];
  const chords=[[50,57,62],[47,54,59],[43,50,55],[45,52,57]];
  function schedule(){
    if(!context||paused||document.hidden||disposed)return;
    while(next<context.currentTime+.3){
      const beat=.48,notes=tune[bar%8],harmony=chords[bar%4],quiet=phase==='repair';
      for(let i=0;i<notes.length;i++)if(notes[i])voice(notes[i]-(phase==='danger'?12:0),next+i*beat,1.3,quiet?.018:.033,musicBus);
      harmony.forEach((n,i)=>voice(n,next+i*.03,3.7,quiet?.013:.025,musicBus,'sine'));
      if(phase==='reunion'||phase==='complete')for(let i=0;i<4;i++)voice(harmony[i%3]+24,next+i*.96,.9,.012,musicBus,'sine');
      bar++;next+=beat*8;
    }
  }
  function levels(){
    if(!context)return;
    const now=context.currentTime;
    musicBus.gain.setTargetAtTime(preferences.music&&!preferences.muted?.65:0,now,.1);
    effectsBus.gain.setTargetAtTime(preferences.effects&&!preferences.muted?.7:0,now,.03);
  }
  async function unlock(){
    if(disposed)return;
    if(!context){
      context=new AudioContext();musicBus=context.createGain();effectsBus=context.createGain();
      const compressor=context.createDynamicsCompressor();compressor.connect(context.destination);musicBus.connect(compressor);effectsBus.connect(compressor);
      next=context.currentTime+.1;levels();timer=setInterval(schedule,180);
    }
    if(!paused&&!document.hidden){await context.resume();schedule();}
  }
  function stopNotes(){for(const node of active){try{node.stop();}catch{}}active.clear();if(context)next=context.currentTime+.08;}
  function setPaused(value){paused=Boolean(value);if(!context)return;if(paused||document.hidden)context.suspend();else{context.resume();schedule();}}
  const visibility=()=>setPaused(paused);document.addEventListener('visibilitychange',visibility);
  return {
    unlock,
    setPhase(value){if(phase!==value){phase=value;bar=0;stopNotes();schedule();}},
    cue(name,key){
      if(!context||paused||document.hidden||disposed||heard.has(key))return;
      heard.add(key);if(heard.size>500)heard.delete(heard.values().next().value);
      const patterns={connect:[62,74],piece:[81],scan:[74,78],send:[69,76],wrong:[71,68],rescue:[62,69,74,78,81],exit:[67,74,78],finish:[62,66,69,74,78,86],tap:[74,81],capture:[45,44,38]};
      for(const [i,n] of (patterns[name]||[74]).entries())voice(n,context.currentTime+.02+i*.13,name==='piece'?.18:.65,.09,effectsBus,'sine');
    },
    setPreference(name,value){if(!(name in preferences))return;preferences[name]=Boolean(value);try{localStorage.setItem('vibelearn-audio',JSON.stringify(preferences));}catch{}levels();},
    get preferences(){return {...preferences};},setPaused,
    stats:()=>({ready:Boolean(context),state:context?.state||'locked',phase,scheduledBars:bar,activeVoices:active.size,heard:heard.size,preferences:{...preferences}}),
    dispose(){disposed=true;clearInterval(timer);document.removeEventListener('visibilitychange',visibility);stopNotes();context?.close();}
  };
}
