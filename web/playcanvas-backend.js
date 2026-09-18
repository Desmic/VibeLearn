/* PlayCanvas Engine backend for engine-neutral WorldSpec.
   Presentation only: server commands and assessment/evidence remain authoritative. */
'use strict';
import * as pc from './vendor/playcanvas.mjs';
import {validateWorldSpec} from './world-spec.js';
import {createPlayerControls} from './player-controls.js';

export const PLAYCANVAS_ENGINE_VERSION='2.22.1';
export const PLAYCANVAS_BACKEND_VERSION='2';
const PORTRAIT_ASPECT_MAX=.9;
const FOG_TYPES={none:pc.FOG_NONE,linear:pc.FOG_LINEAR,exp:pc.FOG_EXP,exp2:pc.FOG_EXP2};
const TONE_MAPPINGS={
  linear:pc.TONEMAP_LINEAR,filmic:pc.TONEMAP_FILMIC,hejl:pc.TONEMAP_HEJL,
  aces:pc.TONEMAP_ACES,aces2:pc.TONEMAP_ACES2,neutral:pc.TONEMAP_NEUTRAL
};

function unavailable(error){
  const message=error instanceof Error?error.message:String(error);
  return {available:false,error:message,setState(){},applyPatch(){},setPaused(){},replay(){},async pickEntityIdsAt(){return[];},async pickEntityAt(){return null;},stats(){return{available:false,error:message,engine:'playcanvas'};},dispose(){}};
}
function color(hex,fallback='#ffffff'){
  const raw=(typeof hex==='string'?hex:fallback).replace('#','');
  const value=parseInt(raw.length===3?raw.split('').map(x=>x+x).join(''):raw,16);
  return new pc.Color(((value>>16)&255)/255,((value>>8)&255)/255,(value&255)/255);
}
function setTransform(entity,transform={}){
  if(transform.position)entity.setLocalPosition(...transform.position);
  if(transform.rotation)entity.setLocalEulerAngles(...transform.rotation);
  if(transform.scale)entity.setLocalScale(...transform.scale);
}
function makeMaterial(def={}){
  const material=new pc.StandardMaterial();
  material.diffuse=color(def.diffuse,'#ffffff');
  if(def.emissive){
    material.emissive=color(def.emissive,'#000000');
    material.emissiveIntensity=Number.isFinite(def.emissiveIntensity)?def.emissiveIntensity:1;
  }
  material.metalness=Number.isFinite(def.metalness)?def.metalness:0;
  material.gloss=Number.isFinite(def.gloss)?def.gloss:.35;
  if(Number.isFinite(def.opacity)&&def.opacity<1){
    material.opacity=def.opacity;
    material.blendType=pc.BLEND_NORMAL;
    material.depthWrite=false;
  }
  material.update();
  return material;
}

class PlayCanvasWorld {
  constructor(host,spec,{reducedMotion=false,pixelRatioCap=1.5,interactive=true}={}){
    this.host=host;
    this.spec=validateWorldSpec(spec);
    this.available=true;
    this.reducedMotion=Boolean(reducedMotion);
    this.paused=false;
    this.state=null;
    this.entities=new Map();
    this.entityDefinitions=new Map();
    this.semanticNodes=new WeakMap();
    this.baseline=new Map();
    this.materials=new Map();
    this.assetInstances=new Map();
    this.assetFallbackHidden=new Set();
    this.desiredAnimations=new Map();
    this.activeAnimations=new Map();
    this.assetsPending=0;
    this.assetsLoaded=0;
    this.assetsFailed=0;
    this.assetErrors=[];
    this.elapsed=0;
    this.disposed=false;
    this.cameraVariant='default';
    this.toneMapping='linear';
    this.picker=null;

    const canvas=document.createElement('canvas');
    canvas.className='play-canvas-webgl vl-playcanvas-engine';
    // data-engine is also used internally by PlayCanvas; keep a namespaced marker
    // for VibeLearn's stable runtime contract instead of fighting engine metadata.
    canvas.dataset.vibelearnEngine='playcanvas';
    canvas.dataset.playcanvasEngine=PLAYCANVAS_ENGINE_VERSION;
    canvas.dataset.playcanvasBackend=PLAYCANVAS_BACKEND_VERSION;
    canvas.setAttribute('aria-hidden','true');
    host.prepend(canvas);
    this.canvas=canvas;

    const dpr=Math.min(window.devicePixelRatio||1,pixelRatioCap);
    const app=new pc.Application(canvas,{
      graphicsDeviceOptions:{antialias:true,alpha:false,powerPreference:'high-performance'}
    });
    this.app=app;
    app.graphicsDevice.maxPixelRatio=dpr;
    app.setCanvasFillMode(pc.FILLMODE_NONE,1,1);
    app.setCanvasResolution(pc.RESOLUTION_AUTO,1,1);
    app.start();

    const environment=this.spec.environment||{};
    if(environment.ambient)app.scene.ambientLight=color(environment.ambient);
    if(Number.isFinite(environment.exposure))app.scene.exposure=environment.exposure;
    if(environment.fog){
      const fog=environment.fog;
      app.scene.fog.type=FOG_TYPES[fog.type];
      if(fog.color)app.scene.fog.color=color(fog.color);
      if(Number.isFinite(fog.start))app.scene.fog.start=fog.start;
      if(Number.isFinite(fog.end))app.scene.fog.end=fog.end;
      if(Number.isFinite(fog.density))app.scene.fog.density=fog.density;
    }

    for(const [name,definition] of Object.entries(this.spec.materials)){
      this.materials.set(name,makeMaterial(definition));
    }

    this.root=new pc.Entity(`world:${this.spec.id}`);
    app.root.addChild(this.root);
    for(const definition of this.spec.entities)this._createEntity(definition);
    for(const definition of this.spec.lights||[])this._createLight(definition);
    for(const definition of this.spec.entities){if(definition.asset)this._loadAssetEntity(definition);}

    this.camera=new pc.Entity('vibelearn-camera');
    this.camera.addComponent('camera',{
      clearColor:color(environment.clearColor,'#071824'),
      nearClip:.1,farClip:250
    });
    app.root.addChild(this.camera);

    this._resize=()=>{
      if(this.disposed)return;
      let rect=host.getBoundingClientRect();
      if((rect.width<1||rect.height<1)&&host.parentElement)rect=host.parentElement.getBoundingClientRect();
      const width=Math.max(1,Math.round(rect.width));
      const height=Math.max(1,Math.round(rect.height));
      // Embedded worlds must be sized from their containing game surface, not
      // from window defaults. FILLMODE_NONE makes that contract explicit.
      app.resizeCanvas(width,height);
      app.setCanvasResolution(pc.RESOLUTION_AUTO,width,height);
      app.updateCanvasSize();
      this.picker?.resize(width,height);
      // Camera composition is presentation intent in WorldSpec. Re-evaluate the
      // active semantic camera when the surface crosses portrait/landscape.
      if(this.cameraName)this.setCamera(this.cameraName);
    };
    this.resizeObserver=new ResizeObserver(this._resize);
    this.resizeObserver.observe(host);
    if(host.parentElement)this.resizeObserver.observe(host.parentElement);
    this._resize();
    requestAnimationFrame(this._resize);

    this._update=dt=>this._tick(dt);
    app.on('update',this._update);
    const initial=Object.keys(this.spec.states||{})[0];
    if(initial)this.setState(initial);
    else this.setCamera(Object.keys(this.spec.cameras)[0]);
    if(this.spec.player&&interactive){
      this.controls=createPlayerControls(host,this.spec.player,{
        isEntityEnabled:id=>this._entityVisible(this.entities.get(id)),
        isPlayerBlocked:(x,y,z,body)=>this._playerBlocked(x,y,z,body),
        isCameraBlocked:(x,y,z)=>this._cameraBlocked(x,y,z),
        setAvatar:(position,yaw)=>{const entity=this.entities.get(this.spec.player.entity);entity?.setLocalPosition(...position);entity?.setLocalEulerAngles(0,yaw,0);},
        setCamera:(position,target,fov)=>{this.camera.setPosition(...position);this.camera.lookAt(...target);if(fov)this.camera.camera.fov=fov;},
        setMoving:value=>this._setPlayerMoving(value)
      });
      this.controls.setShot(this._cameraShot(this.cameraName).shot);
      canvas.style.pointerEvents='auto';canvas.style.touchAction='none';host.tabIndex=0;
      canvas.addEventListener('webglcontextlost',()=>this.controls?.setPaused(true));
      canvas.addEventListener('webglcontextrestored',()=>this.controls?.setPaused(this.paused));
    }
  }

  _entityVisible(entity){
    for(let current=entity;current&&current!==this.app.root;current=current.parent)if(current.enabled===false)return false;
    return Boolean(entity);
  }

  _colliderBounds(entityId){
    const def=this.entityDefinitions.get(entityId),entity=this.entities.get(entityId),collider=def?.collider;
    if(!collider||!entity||!this._entityVisible(entity))return null;
    const half=collider.halfExtents||[.5,.5,.5],offset=collider.offset||[0,0,0],matrix=entity.getWorldTransform();
    let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){
      const local=new pc.Vec3(offset[0]+sx*half[0],offset[1]+sy*half[1],offset[2]+sz*half[2]);
      const world=matrix.transformPoint(local);
      min=[Math.min(min[0],world.x),Math.min(min[1],world.y),Math.min(min[2],world.z)];
      max=[Math.max(max[0],world.x),Math.max(max[1],world.y),Math.max(max[2],world.z)];
    }
    return{min,max,collider};
  }

  _playerBlocked(x,y,z,body={radius:.32,height:1.6}){
    for(const id of this.entities.keys()){
      const bounds=this._colliderBounds(id);if(!bounds||bounds.collider.blocksPlayer===false)continue;
      const {min,max}=bounds,r=body.radius||.32,h=body.height||1.6;
      if(x>min[0]-r&&x<max[0]+r&&z>min[2]-r&&z<max[2]+r&&y+h>min[1]&&y<max[1])return true;
    }
    return false;
  }

  _cameraBlocked(x,y,z){
    for(const id of this.entities.keys()){
      const bounds=this._colliderBounds(id);if(!bounds||bounds.collider.blocksCamera===false)continue;
      const {min,max}=bounds;
      if(x>min[0]-.15&&x<max[0]+.15&&y>min[1]-.15&&y<max[1]+.15&&z>min[2]-.15&&z<max[2]+.15)return true;
    }
    return false;
  }

  _cameraImpulse(value={}){
    if(this.reducedMotion||!this.canvas?.animate)return;
    const duration=Math.max(80,Math.min(1600,Number(value.duration)||520));
    const px=Math.max(1,Math.min(16,Number(value.intensity)||7));
    (this.canvas.getAnimations?.()||[]).filter(a=>a.id==='vibelearn-camera-impulse').forEach(a=>a.cancel());
    const animation=this.canvas.animate([
      {transform:'translate(0,0)'},
      {transform:`translate(${-px}px,${px*.35}px)`},
      {transform:`translate(${px*.8}px,${-px*.45}px)`},
      {transform:`translate(${-px*.45}px,${px*.25}px)`},
      {transform:'translate(0,0)'}
    ],{duration,easing:'ease-out'});
    animation.id='vibelearn-camera-impulse';
  }

  _applyEnvironment(patch={}){
    const base=this.spec.environment||{},fog={...(base.fog||{type:'none'}),...(patch.fog||{})};
    const env={...base,...patch,fog};
    if(env.ambient)this.app.scene.ambientLight=color(env.ambient);
    if(Number.isFinite(env.exposure))this.app.scene.exposure=env.exposure;
    this.app.scene.fog.type=FOG_TYPES[fog.type||'none'];
    if(fog.color)this.app.scene.fog.color=color(fog.color);
    if(Number.isFinite(fog.start))this.app.scene.fog.start=fog.start;
    if(Number.isFinite(fog.end))this.app.scene.fog.end=fog.end;
    if(Number.isFinite(fog.density))this.app.scene.fog.density=fog.density;
    if(env.clearColor&&this.camera?.camera)this.camera.camera.clearColor=color(env.clearColor);
  }

  _createEntity(def){
    const entity=new pc.Entity(def.id);
    entity.enabled=def.enabled!==false;
    if(def.primitive){
      entity.addComponent('render',{type:def.primitive});
      if(def.material)entity.render.material=this.materials.get(def.material);
      entity.render.castShadows=def.castShadows!==false;
      entity.render.receiveShadows=def.receiveShadows!==false;
    }
    setTransform(entity,def);
    const parent=def.parent?this.entities.get(def.parent):this.root;
    if(!parent)throw new Error(`WorldSpec parent ${def.parent} must appear before ${def.id}`);
    parent.addChild(entity);
    this.entities.set(def.id,entity);
    this.entityDefinitions.set(def.id,def);
    this.semanticNodes.set(entity,def.id);
    this.baseline.set(def.id,{
      // Entity.enabled includes ancestor visibility. Preserve authored local
      // intent so children of a hidden archetype appear when it is revealed.
      enabled:def.enabled!==false,
      position:[entity.getLocalPosition().x,entity.getLocalPosition().y,entity.getLocalPosition().z],
      rotation:[entity.getLocalEulerAngles().x,entity.getLocalEulerAngles().y,entity.getLocalEulerAngles().z],
      scale:[entity.getLocalScale().x,entity.getLocalScale().y,entity.getLocalScale().z],
      motion:def.motion||null
    });
  }

  _createLight(def){
    const entity=new pc.Entity(def.id||`light-${this.entities.size}`);
    entity.addComponent('light',{
      type:def.type||'directional',
      color:color(def.color,'#ffffff'),
      intensity:Number.isFinite(def.intensity)?def.intensity:1,
      range:Number.isFinite(def.range)?def.range:20,
      castShadows:Boolean(def.castShadows)
    });
    setTransform(entity,def);
    this.root.addChild(entity);
  }

  _loadAssetEntity(def){
    const assetDef=this.spec.assets?.[def.asset];
    const semanticEntity=this.entities.get(def.id);
    if(!assetDef||!semanticEntity)return;
    this.assetsPending+=1;
    this.app.assets.loadFromUrl(assetDef.src,'container',(error,asset)=>{
      this.assetsPending=Math.max(0,this.assetsPending-1);
      if(this.disposed){try{asset?.unload();}catch(_){}return;}
      if(error||!asset?.resource){
        this.assetsFailed+=1;
        this.assetErrors.push(`${def.id}: ${error||'container resource unavailable'}`);
        return;
      }
      let instance=null;
      try{
        instance=asset.resource.instantiateRenderEntity({
          castShadows:def.castShadows!==false,
          receiveShadows:def.receiveShadows!==false
        });
        instance.name=`${def.id}:asset`;
        setTransform(instance,assetDef.transform||{});
        semanticEntity.addChild(instance);
        this._bindAssetAnimations(def,assetDef,asset,instance);
        const fallback=[...(def.fallback||[])];
        for(const fallbackId of fallback){
          const entity=this.entities.get(fallbackId);
          if(entity){entity.enabled=false;this.assetFallbackHidden.add(fallbackId);}
        }
        const bounds=this._measureAssetBounds(instance);
        this.assetInstances.set(def.id,{asset,instance,fallback,bounds});
        this.assetsLoaded+=1;
        const playerIdle=def.id===this.spec.player?.entity?this.spec.player?.animations?.idle:null;
        this._applyEntityAnimation(def.id,this.desiredAnimations.get(def.id)||def.animation||playerIdle||assetDef.defaultAnimation||null,0);
      }catch(assetError){
        try{instance?.destroy();}catch(_){}
        this.assetsFailed+=1;
        this.assetErrors.push(`${def.id}: ${assetError instanceof Error?assetError.message:String(assetError)}`);
        try{asset.unload();}catch(_){}
      }
    });
  }

  _measureAssetBounds(instance){
    let combined=null;
    for(const render of instance.findComponents('render')){
      for(const meshInstance of render.meshInstances||[]){
        const aabb=meshInstance.aabb;
        if(!aabb)continue;
        if(!combined)combined=aabb.clone();else combined.add(aabb);
      }
    }
    if(!combined)return null;
    const min=combined.getMin(),max=combined.getMax();
    const round=value=>Math.round(value*10000)/10000;
    return{
      min:[round(min.x),round(min.y),round(min.z)],
      max:[round(max.x),round(max.y),round(max.z)],
      size:[round(max.x-min.x),round(max.y-min.y),round(max.z-min.z)]
    };
  }

  _bindAssetAnimations(def,assetDef,asset,instance){
    const aliases=Object.entries(assetDef.animations||{});
    if(!aliases.length)return;
    // Current PlayCanvas ContainerResource.animations contains Animation Asset
    // wrappers whose .resource is the AnimTrack. Older engine examples exposed
    // tracks directly, so accept both shapes at this compiler boundary.
    const tracks=(asset.resource.animations||[]).map(value=>value?.resource||value).filter(Boolean);
    const byName=new Map(tracks.map(track=>[track.name,track]));
    instance.addComponent('anim',{activate:true,speed:this.reducedMotion?0:1});
    for(const [alias,trackName] of aliases){
      const track=byName.get(trackName);
      if(!track){
        const available=[...byName.keys()].filter(Boolean).join(', ')||'(none)';
        throw new Error(`animation track ${trackName} missing for alias ${alias}; available: ${available}`);
      }
      instance.anim.assignAnimation(alias,track,undefined,1,true);
    }
  }

  _animationSpeed(entityId,alias){
    if(entityId!==this.spec.player?.entity)return 1;
    const profile=this.spec.player,kind=profile.animations?.move===alias?'move':profile.animations?.idle===alias?'idle':null;
    return kind&&Number.isFinite(profile.animationSpeeds?.[kind])?profile.animationSpeeds[kind]:1;
  }

  _applyEntityAnimation(entityId,alias,blendTime){
    if(!alias)return;
    this.desiredAnimations.set(entityId,alias);
    const record=this.assetInstances.get(entityId);
    const anim=record?.instance?.anim;
    if(!anim?.baseLayer)return;
    const def=this.entityDefinitions.get(entityId)||{};
    const duration=Number.isFinite(blendTime)?blendTime:(Number.isFinite(def.animationBlendTime)?def.animationBlendTime:.18);
    anim.speed=this.reducedMotion?0:this._animationSpeed(entityId,alias);
    anim.baseLayer.transition(alias,this.reducedMotion?0:duration);
    anim.playing=!this.paused;
    this.activeAnimations.set(entityId,alias);
  }

  _setPlayerMoving(value){
    const moving=Boolean(value);
    if(this.playerMoving===moving)return;
    this.playerMoving=moving;
    const alias=moving?this.spec.player?.animations?.move:this.spec.player?.animations?.idle;
    if(alias)this._applyEntityAnimation(this.spec.player.entity,alias,.12);
  }

  _reset(){
    this._applyEnvironment({});
    for(const [id,base] of this.baseline){
      const entity=this.entities.get(id);
      entity.enabled=base.enabled;
      entity.setLocalPosition(...base.position);
      entity.setLocalEulerAngles(...base.rotation);
      entity.setLocalScale(...base.scale);
    }
    for(const id of this.assetFallbackHidden){
      const entity=this.entities.get(id);if(entity)entity.enabled=false;
    }
  }

  _cameraShot(name){
    const definition=this.spec.cameras[name];
    if(!definition)throw new Error(`Unknown camera ${name}`);
    const rect=this.canvas.getBoundingClientRect();
    const aspect=rect.height>0?rect.width/rect.height:1;
    if(definition.portrait&&aspect<=PORTRAIT_ASPECT_MAX){
      return{shot:definition.portrait,variant:'portrait'};
    }
    return{shot:definition,variant:'default'};
  }

  setCamera(name){
    const {shot,variant}=this._cameraShot(name);
    this.camera.setPosition(...shot.position);
    this.camera.lookAt(...shot.lookAt);
    if(Number.isFinite(shot.fov))this.camera.camera.fov=shot.fov;
    const toneName=shot.toneMapping||this.spec.environment?.toneMapping||'linear';
    this.camera.camera.toneMapping=TONE_MAPPINGS[toneName];
    this.cameraName=name;
    this.cameraVariant=variant;
    this.toneMapping=toneName;
    this.controls?.setShot(shot);
  }

  applyPatch(patch={}){
    if(patch.environment)this._applyEnvironment(patch.environment);
    if(patch.cameraImpulse)this._cameraImpulse(patch.cameraImpulse);
    for(const id of patch.show||[]){const entity=this.entities.get(id);if(entity)entity.enabled=true;}
    for(const id of patch.hide||[]){const entity=this.entities.get(id);if(entity)entity.enabled=false;}
    for(const [id,transform] of Object.entries(patch.transforms||{})){
      const entity=this.entities.get(id);if(entity)setTransform(entity,transform);
    }
    for(const [id,alias] of Object.entries(patch.animations||{}))this._applyEntityAnimation(id,alias);
    if(patch.camera)this.setCamera(patch.camera);
  }

  setState(name){
    const state=this.spec.states?.[name];
    if(!state)throw new Error(`Unknown world state ${name}`);
    this._reset();
    this.desiredAnimations.clear();
    for(const def of this.spec.entities){
      if(!def.asset)continue;
      const playerIdle=def.id===this.spec.player?.entity?this.spec.player?.animations?.idle:null;
      const alias=def.animation||playerIdle||this.spec.assets?.[def.asset]?.defaultAnimation;
      if(alias)this.desiredAnimations.set(def.id,alias);
    }
    this.applyPatch(state);
    for(const [id,alias] of this.desiredAnimations)this._applyEntityAnimation(id,alias);
    this.state=name;
    this.elapsed=0;
    this.controls?.restoreAvatar();
  }

  setControlMode(mode,key){this.controls?.setMode(mode,key);}
  getPlayerView(){return this.controls?.snapshot()||null;}
  restorePlayerView(value){this.controls?.restore(value);}
  bindMarkers(provider){this.markerProvider=provider;}
  _updateMarkers(){
    const binding=this.markerProvider?.();if(!binding)return;
    const rect=this.canvas.getBoundingClientRect(),placed=[];
    const obstacles=(binding.avoid||[]).filter(n=>n&&n.getClientRects().length).map(n=>n.getBoundingClientRect());
    for(const {element,entity} of binding.markers||[]){
      if(!element?.getClientRects().length)continue;
      const point=this.projectEntity(entity),w=element.offsetWidth,h=element.offsetHeight;
      const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
      const initial={x:point?.x||rect.width/2,y:(point?.y||rect.height/2)-h-16};
      let x=clamp(initial.x-w/2,10,rect.width-w-66),y=clamp(initial.y,rect.height*.36,rect.height*.65-h);
      const hits=()=>[...obstacles,...placed].some(b=>x+rect.left<b.right+8&&x+w+rect.left>b.left-8&&y+rect.top<b.bottom+8&&y+h+rect.top>b.top-8);
      if(hits()){
        let found=false;
        for(let row=rect.height*.38;row<rect.height*.66-h&&!found;row+=h+12)for(let col=10;col<rect.width-w-60;col+=w+12){x=col;y=row;if(!hits()){found=true;break;}}
      }
      element.style.left=`${x}px`;element.style.top=`${y}px`;element.style.right='auto';element.style.bottom='auto';element.style.transform='none';
      const pinned=!point?.visible||Math.abs(x+w/2-initial.x)>40||Math.abs(y-initial.y)>40;
      element.dataset.worldPinned=String(pinned);
      element.title=pinned?'Object is outside this clear view. Drag the world to look around; this action stays available.':'Interact with this world object';
      placed.push({left:x+rect.left,right:x+w+rect.left,top:y+rect.top,bottom:y+h+rect.top});
    }
  }

  _semanticEntityIdForNode(node){
    for(let current=node;current;current=current.parent){
      const semanticId=this.semanticNodes.get(current);
      if(semanticId)return semanticId;
    }
    return null;
  }

  projectEntity(id){
    const entity=this.entities.get(id);
    if(!entity||!entity.enabled||!this.available)return null;
    const point=this.camera.camera.worldToScreen(entity.getPosition());
    const rect=this.canvas.getBoundingClientRect();
    return {x:point.x,y:point.y,visible:point.z>0&&point.x>=0&&point.x<=rect.width&&point.y>=0&&point.y<=rect.height};
  }
  async pickEntityIdsAt(clientX,clientY,{radius=7}={}){
    if(this.disposed||!this.available||!this.camera?.camera)return [];
    const rect=this.canvas.getBoundingClientRect();
    if(rect.width<1||rect.height<1||clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return [];
    const width=Math.max(1,Math.round(rect.width));
    const height=Math.max(1,Math.round(rect.height));
    if(!this.picker)this.picker=new pc.Picker(this.app,width,height);
    else this.picker.resize(width,height);
    this.picker.prepare(this.camera.camera,this.app.scene);
    const x=Math.round(clientX-rect.left);
    const y=Math.round(clientY-rect.top);
    const r=Math.max(1,Math.round(radius));
    const left=Math.max(0,x-r),top=Math.max(0,y-r);
    const selection=await this.picker.getSelectionAsync(left,top,Math.min(width-left,r*2+1),Math.min(height-top,r*2+1));
    const result=[];
    for(const item of selection||[]){
      const semanticId=this._semanticEntityIdForNode(item?.node);
      if(semanticId&&!result.includes(semanticId))result.push(semanticId);
    }
    return result;
  }

  async pickEntityAt(clientX,clientY,options={}){
    return (await this.pickEntityIdsAt(clientX,clientY,options))[0]||null;
  }

  _tick(dt){
    if(this.paused)return;
    this.controls?.update(dt);
    this._updateMarkers();
    if(this.reducedMotion)return;
    this.elapsed+=dt;
    if(this.spec.player?.limbs){
      this.spec.player.limbs.forEach((id,i)=>this.entities.get(id)?.setLocalEulerAngles(this.playerMoving?Math.sin(this.elapsed*11+(i%2)*Math.PI)*24:0,0,0));
    }
    for(const [id,base] of this.baseline){
      const motion=base.motion;
      const entity=this.entities.get(id);
      if(!motion||!entity?.enabled)continue;
      if(motion.type==='spin'){
        const a=motion.axis||[0,1,0],speed=motion.speed||15;
        entity.rotateLocal(a[0]*speed*dt,a[1]*speed*dt,a[2]*speed*dt);
      }else if(motion.type==='bob'){
        const p=base.position,amp=motion.amplitude||.12,speed=motion.speed||1;
        entity.setLocalPosition(p[0],p[1]+Math.sin(this.elapsed*speed)*amp,p[2]);
      }else if(motion.type==='pulse'){
        const s=base.scale,amp=motion.amplitude||.08,speed=motion.speed||2,k=1+Math.sin(this.elapsed*speed)*amp;
        entity.setLocalScale(s[0]*k,s[1]*k,s[2]*k);
      }else if(motion.type==='patrol'){
        const p=base.position,o=motion.offset||[0,0,0],speed=motion.speed||.35,phase=motion.phase||0;
        const t=(1+Math.sin(this.elapsed*speed+phase))/2;
        entity.setLocalPosition(p[0]+o[0]*t,p[1]+o[1]*t,p[2]+o[2]*t);
        if(Math.abs(o[0])+Math.abs(o[2])>.01)entity.setLocalEulerAngles(0,Math.atan2(o[0],o[2])*180/Math.PI+(Math.cos(this.elapsed*speed+phase)<0?180:0),0);
      }
    }
  }

  setPaused(value){
    this.paused=Boolean(value);this.app.timeScale=this.paused?0:1;
    this.controls?.setPaused(value);
    for(const record of this.assetInstances.values())if(record.instance.anim)record.instance.anim.playing=!this.paused;
  }
  replay(){if(this.state)this.setState(this.state);}
  stats(){
    const rect=this.canvas.getBoundingClientRect();
    const fog=this.spec.environment?.fog||{type:'none'};
    return{
      available:this.available,engine:'playcanvas',engineVersion:PLAYCANVAS_ENGINE_VERSION,
      backendVersion:PLAYCANVAS_BACKEND_VERSION,worldId:this.spec.id,worldVersion:this.spec.version,
      state:this.state,camera:this.cameraName,cameraVariant:this.cameraVariant,toneMapping:this.toneMapping,
      exposure:this.app.scene.exposure,fogType:fog.type,entityCount:this.entities.size,
      colliderCount:this.spec.entities.filter(entity=>Boolean(entity.collider)).length,
      assetEntityCount:this.spec.entities.filter(entity=>Boolean(entity.asset)).length,
      assetsPending:this.assetsPending,assetsLoaded:this.assetsLoaded,assetsFailed:this.assetsFailed,
      loadedAssetEntities:[...this.assetInstances.keys()],activeAnimations:Object.fromEntries(this.activeAnimations),
      assetBounds:Object.fromEntries([...this.assetInstances].map(([id,record])=>[id,record.bounds])),
      assetErrors:[...this.assetErrors],
      player:this.controls?.stats()||null,
      deviceType:this.app.graphicsDevice?.deviceType||'unknown',canvasCount:this.host.querySelectorAll('canvas').length,
      canvasCssWidth:Math.round(rect.width),canvasCssHeight:Math.round(rect.height),
      bufferWidth:this.app.graphicsDevice?.width||0,bufferHeight:this.app.graphicsDevice?.height||0
    };
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.available=false;
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    try{this.picker?.destroy();}catch(_){}
    this.picker=null;
    for(const record of this.assetInstances.values()){
      try{record.asset?.unload();}catch(_){}
    }
    this.assetInstances.clear();
    try{this.app.off('update',this._update);}catch(_){}
    try{this.app.destroy();}catch(_){}
    this.canvas?.remove();
    this.entities.clear();this.entityDefinitions.clear();this.materials.clear();
  }
}

export function createPlayCanvasWorld(host,spec,options={}){
  try{
    if(!host?.isConnected)throw new Error('PlayCanvas host is not connected');
    return new PlayCanvasWorld(host,spec,options);
  }catch(error){return unavailable(error);}
}
