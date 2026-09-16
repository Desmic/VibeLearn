/* Bellweather score v2. Original procedural audio synthesized locally; no downloads
   or model API. Semantic presentation cues only. Audio never establishes success. */
export function createGameAudio(){
  let context=null,musicBus=null,effectsBus=null,noiseBuffer=null,timer=0,bar=0,next=0,phase='home',paused=false,disposed=false;
  const active=new Set(),heard=new Set();
  let preferences={music:true,effects:true,muted:false};
  try{preferences={...preferences,...JSON.parse(localStorage.getItem('vibelearn-audio')||'{}')};}catch{}
  const frequency=n=>440*2**((n-69)/12);
  function track(node,...connections){
    active.add(node);node.onended=()=>{active.delete(node);try{node.disconnect();}catch{}for(const item of connections)try{item.disconnect();}catch{}};
  }
  function voice(note,start,length,volume,bus,type='triangle',attack=.018){
    if(!context)return;
    const osc=context.createOscillator(),gain=context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency(note),start);
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+attack);
    gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    osc.connect(gain);gain.connect(bus);osc.start(start);osc.stop(start+length+.035);track(osc,gain);
  }
  function pluck(note,start,volume=.035,length=.72,bus=musicBus){
    voice(note,start,length,volume,bus,'triangle',.008);
    voice(note+12,start+.004,Math.min(.34,length),volume*.22,bus,'sine',.006);
  }
  function noise(start,length,volume,bus,{frequency=900,type='lowpass',q=.7}={}){
    if(!context||!noiseBuffer)return;
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=noiseBuffer;source.loop=true;filter.type=type;filter.frequency.setValueAtTime(frequency,start);filter.Q.value=q;
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+Math.min(.12,length*.2));
    gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    source.connect(filter);filter.connect(gain);gain.connect(bus);source.start(start);source.stop(start+length+.02);track(source,filter,gain);
  }
  function handDrum(start,volume=.018){
    if(!context)return;
    const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(145,start);osc.frequency.exponentialRampToValueAtTime(82,start+.13);
    gain.gain.setValueAtTime(Math.max(.0002,volume),start);gain.gain.exponentialRampToValueAtTime(.0001,start+.19);
    osc.connect(gain);gain.connect(musicBus);osc.start(start);osc.stop(start+.22);track(osc,gain);
    noise(start,.08,volume*.35,musicBus,{frequency:1200,type:'bandpass',q:1.8});
  }
  function workshopTick(start,volume=.012){
    voice(88,start,.08,volume,musicBus,'sine',.003);voice(76,start+.025,.11,volume*.45,musicBus,'triangle',.003);
  }
  function wind(start,length,volume=.006){noise(start,length,volume,musicBus,{frequency:620,type:'lowpass',q:.25});}
  const tune=[[74,78,81,78,76,74,69,0],[71,74,78,0,76,74,71,0],[67,71,74,78,76,74,71,0],[69,73,76,81,78,76,74,0],
    [74,78,81,86,83,81,78,0],[71,74,78,81,78,76,74,0],[67,71,74,76,78,76,74,71],[69,73,76,78,76,73,74,0]];
  const chords=[[50,57,62],[47,54,59],[43,50,55],[45,52,57]];
  function schedule(){
    if(!context||paused||document.hidden||disposed)return;
    while(next<context.currentTime+.32){
      const beat=.5,notes=tune[bar%8],harmony=chords[bar%4];
      const danger=phase==='danger',repair=phase==='repair',warm=phase==='reunion'||phase==='complete';
      const melodyGain=repair?.015:danger?.019:warm?.032:.028,padGain=repair?.009:danger?.012:warm?.023:.018;
      for(let i=0;i<notes.length;i++){
        if(!notes[i]||(danger&&i%2))continue;
        pluck(notes[i]-(danger?12:0),next+i*beat,melodyGain,danger?.45:.82);
      }
      harmony.forEach((n,i)=>voice(n-(danger?12:0),next+i*.045,3.65,padGain,musicBus,'sine',.11));
      wind(next,3.75,repair?.0045:danger?.0035:.0065);
      if(!repair){handDrum(next+.03,danger?.011:.017);if(!danger)handDrum(next+beat*4,.012);}
      if(phase==='home'){workshopTick(next+beat*2.45,.009);workshopTick(next+beat*6.15,.007);}
      if(danger){voice(38,next+.08,.5,.022,musicBus,'sine',.01);noise(next+.12,.16,.006,musicBus,{frequency:480,type:'bandpass',q:2.2});}
      if(warm){
        for(let i=0;i<4;i++)pluck(harmony[i%3]+24,next+i*beat*1.6,.017,.72);
        if(bar%4===3)for(const [i,n] of [74,78,81,86].entries())pluck(n,next+beat*(4+i*.62),.022,.78);
      }
      bar++;next+=beat*8;
    }
  }
  function levels(){
    if(!context)return;
    const now=context.currentTime;
    musicBus.gain.setTargetAtTime(preferences.music&&!preferences.muted?.62:0,now,.12);
    effectsBus.gain.setTargetAtTime(preferences.effects&&!preferences.muted?.72:0,now,.035);
  }
  async function unlock(){
    if(disposed)return;
    if(!context){
      context=new AudioContext();musicBus=context.createGain();effectsBus=context.createGain();
      const compressor=context.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=16;compressor.ratio.value=5;compressor.attack.value=.008;compressor.release.value=.2;
      compressor.connect(context.destination);musicBus.connect(compressor);effectsBus.connect(compressor);
      noiseBuffer=context.createBuffer(1,Math.max(1,Math.floor(context.sampleRate*2)),context.sampleRate);
      const data=noiseBuffer.getChannelData(0);let previous=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;previous=previous*.94+white*.06;data[i]=previous*.8;}
      next=context.currentTime+.1;levels();timer=setInterval(schedule,180);
    }
    if(!paused&&!document.hidden){await context.resume();schedule();}
  }
  function stopNotes(){for(const node of [...active]){try{node.stop();}catch{}}active.clear();if(context)next=context.currentTime+.08;}
  function setPaused(value){paused=Boolean(value);if(!context)return;if(paused||document.hidden)context.suspend();else{context.resume();schedule();}}
  const visibility=()=>setPaused(paused);document.addEventListener('visibilitychange',visibility);
  function effectPattern(notes,{spacing=.13,length=.58,volume=.085,type='sine'}={}){
    if(!context)return;for(const [i,n] of notes.entries())voice(n,context.currentTime+.02+i*spacing,length,volume*(i?0.88:1),effectsBus,type,.006);
  }
  return {
    unlock,
    setPhase(value){if(phase!==value){phase=value;bar=0;stopNotes();schedule();}},
    cue(name,key){
      if(!context||paused||document.hidden||disposed||heard.has(key))return;
      heard.add(key);if(heard.size>500)heard.delete(heard.values().next().value);
      const now=context.currentTime+.02;
      if(name==='connect'){effectPattern([62,69,74],{spacing:.09,length:.42,volume:.07,type:'triangle'});noise(now,.1,.016,effectsBus,{frequency:1800,type:'bandpass',q:2});}
      else if(name==='piece')pluck(81,now,.075,.22,effectsBus);
      else if(name==='scan')effectPattern([74,78],{spacing:.1,length:.35,volume:.055,type:'triangle'});
      else if(name==='send'){effectPattern([57,69,76],{spacing:.09,length:.5,volume:.065});handDrum(now,.035);}
      else if(name==='wrong'){effectPattern([71,68,64],{spacing:.12,length:.48,volume:.052,type:'triangle'});noise(now+.08,.18,.008,effectsBus,{frequency:520,type:'bandpass',q:1.4});}
      else if(name==='rescue'){effectPattern([62,69,74,78,81],{spacing:.11,length:.72,volume:.072,type:'triangle'});}
      else if(name==='exit'){effectPattern([67,74,78],{spacing:.14,length:.64,volume:.062,type:'triangle'});}
      else if(name==='finish'){effectPattern([62,66,69,74,78,86],{spacing:.1,length:.82,volume:.075,type:'triangle'});noise(now+.06,.42,.009,effectsBus,{frequency:1500,type:'bandpass',q:.9});}
      else if(name==='tap')effectPattern([74,81],{spacing:.13,length:.38,volume:.045,type:'triangle'});
      else if(name==='capture'){voice(45,now,.42,.08,effectsBus,'sine',.006);voice(38,now+.16,.65,.09,effectsBus,'sine',.006);noise(now+.08,.22,.022,effectsBus,{frequency:420,type:'bandpass',q:2.4});}
      else effectPattern([74],{length:.4,volume:.05});
    },
    setPreference(name,value){if(!(name in preferences))return;preferences[name]=Boolean(value);try{localStorage.setItem('vibelearn-audio',JSON.stringify(preferences));}catch{}levels();},
    get preferences(){return {...preferences};},setPaused,
    stats:()=>({version:'bellweather-score-v2',ready:Boolean(context),state:context?.state||'locked',phase,scheduledBars:bar,activeVoices:active.size,heard:heard.size,preferences:{...preferences}}),
    dispose(){disposed=true;clearInterval(timer);document.removeEventListener('visibilitychange',visibility);stopNotes();context?.close();}
  };
}
