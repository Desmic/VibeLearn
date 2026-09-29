/* Engine-neutral WorldSpec validation for Phase 1 generated-game runtime. */
'use strict';
import {validatePlayerProfile} from './player-controls.js';

export const WORLD_SPEC_VERSION = '1';
const PRIMITIVES = new Set(['box','sphere','cone','cylinder','plane','torus','capsule']);
const ASSET_TYPES = new Set(['container']);
const MOTIONS = new Set(['spin','bob','pulse','patrol']);
const FOG_TYPES = new Set(['none','linear','exp','exp2']);
const TONE_MAPPINGS = new Set(['linear','filmic','hejl','aces','aces2','neutral']);
const GEOMETRY_OPTIONS={
  cone:{baseRadius:[.001,10],peakRadius:[0,10],height:[.001,20],heightSegments:[1,16,true],capSegments:[3,64,true]},
  cylinder:{radius:[.001,10],height:[.001,20],heightSegments:[1,16,true],capSegments:[3,64,true]},
  sphere:{radius:[.001,10],latitudeBands:[3,48,true],longitudeBands:[3,64,true]},
  torus:{tubeRadius:[.001,10],ringRadius:[.001,10],sectorAngle:[1,360],segments:[3,96,true],sides:[3,24,true]}
};

function assert(condition,message){if(!condition)throw new Error(`WorldSpec invalid: ${message}`);}
function vec(value,n,label){
  assert(Array.isArray(value)&&value.length===n&&value.every(Number.isFinite),`${label} must be ${n} finite numbers`);
}
function id(value,label){assert(typeof value==='string'&&/^[a-zA-Z0-9._:-]+$/.test(value),`${label} has invalid id`);}
function hex(value,label){assert(typeof value==='string'&&/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value),`${label} must be a hex color`);}
function tone(value,label){assert(TONE_MAPPINGS.has(value),`${label} has unsupported tone mapping ${value}`);}
function bounded(value,min,max,label,integer=false){
  assert(Number.isFinite(value)&&value>=min&&value<=max&&(!integer||Number.isInteger(value)),`${label} must be ${integer?'an integer ':''}between ${min} and ${max}`);
}
function renderStyle(spec){
  if(spec.batchGroups!=null){
    assert(typeof spec.batchGroups==='object'&&!Array.isArray(spec.batchGroups)&&Object.keys(spec.batchGroups).length<=8,'batchGroups must be a dictionary with at most 8 entries');
    for(const [name,group] of Object.entries(spec.batchGroups)){
      id(name,'batch group');
      assert(group&&typeof group==='object'&&!Array.isArray(group),'batch group must be an object');
      assert(Object.keys(group).every(key=>key==='maxAabbSize'),`${name} has unsupported batch group option`);
      bounded(group.maxAabbSize,1,200,`${name}.maxAabbSize`);
    }
  }
  for(const [key,limit] of [['textures',16],['geometries',64]]){
    if(spec[key]!=null)assert(typeof spec[key]==='object'&&!Array.isArray(spec[key])&&Object.keys(spec[key]).length<=limit,`${key} must be a dictionary with at most ${limit} entries`);
  }
  for(const [name,def] of Object.entries(spec.textures||{})){
    id(name,'texture');
    assert(def&&['gradient','brush'].includes(def.type),`${name} has unsupported texture type`);
    assert(Array.isArray(def.colors)&&def.colors.length>=2&&def.colors.length<=8,`${name}.colors must contain 2 to 8 colors`);
    def.colors.forEach(value=>hex(value,`${name}.colors`));
    if(def.seed!=null)bounded(def.seed,0,65535,`${name}.seed`,true);
  }
  for(const [name,def] of Object.entries(spec.geometries||{})){
    id(name,'geometry');
    assert(def&&Object.hasOwn(GEOMETRY_OPTIONS,def.type),`${name} has unsupported geometry type`);
    const options=def.options||{};
    assert(typeof options==='object'&&!Array.isArray(options),`${name}.options must be an object`);
    for(const [key,value] of Object.entries(options)){
      const range=Object.hasOwn(GEOMETRY_OPTIONS[def.type],key)?GEOMETRY_OPTIONS[def.type][key]:null;
      assert(range,`${name} has unsupported geometry option ${key}`);
      bounded(value,range[0],range[1],`${name}.${key}`,range[2]);
    }
  }
  for(const [name,def] of Object.entries(spec.materials)){
    assert(def&&typeof def==='object'&&!Array.isArray(def),`${name} material must be an object`);
    for(const key of ['diffuse','emissive'])if(key in def)hex(def[key],`${name}.${key}`);
    for(const key of ['metalness','gloss','opacity'])if(key in def)bounded(def[key],0,1,`${name}.${key}`);
    if('emissiveIntensity' in def)bounded(def.emissiveIntensity,0,8,`${name}.emissiveIntensity`);
    if('unlit' in def)assert(typeof def.unlit==='boolean',`${name}.unlit must be boolean`);
    if('fog' in def)assert(typeof def.fog==='boolean',`${name}.fog must be boolean`);
    if(def.texture)assert(typeof def.texture==='string'&&Object.hasOwn(spec.textures||{},def.texture),`${name} references unknown texture`);
    if(def.textureRepeat){vec(def.textureRepeat,2,`${name}.textureRepeat`);def.textureRepeat.forEach(v=>bounded(v,.1,32,`${name}.textureRepeat`));}
  }
  for(const light of spec.lights||[]){
    assert(light&&typeof light==='object','light must be an object');
    if(light.type)assert(['directional','omni','spot'].includes(light.type),'unsupported light type');
    if(light.color)hex(light.color,'light.color');
    if(light.shadowResolution!=null)assert([256,512,1024,2048].includes(light.shadowResolution),'light.shadowResolution must be 256, 512, 1024 or 2048');
    for(const [key,min,max,integer] of [['intensity',0,8],['range',.01,250],['shadowDistance',1,150],['shadowBias',0,1],['normalOffsetBias',0,1],['numCascades',1,4,true]]){
      if(key in light)bounded(light[key],min,max,`light.${key}`,integer);
    }
    if(light.shadowFilter!=null)assert(['pcf1','pcf3','pcf5'].includes(light.shadowFilter),'unsupported light.shadowFilter');
  }
}
function transform(value,label){
  assert(value&&typeof value==='object'&&!Array.isArray(value),`${label} must be an object`);
  if(value.position)vec(value.position,3,`${label}.position`);
  if(value.rotation)vec(value.rotation,3,`${label}.rotation`);
  if(value.scale)vec(value.scale,3,`${label}.scale`);
}
function cameraShot(shot,label){
  assert(shot&&typeof shot==='object',`${label} must be a camera shot`);
  vec(shot.position,3,`${label}.position`);
  vec(shot.lookAt,3,`${label}.lookAt`);
  if('fov' in shot)assert(Number.isFinite(shot.fov)&&shot.fov>1&&shot.fov<179,`${label}.fov must be between 1 and 179`);
  if('toneMapping' in shot)tone(shot.toneMapping,`${label}.toneMapping`);
}
const STORY_READABILITY=new Set(['attachment','silhouette','material','light','motion','interaction','label','narration','sound','transformation']);
function storyObject(value,label){
  assert(value&&typeof value==='object'&&!Array.isArray(value),`${label} must be an object`);
  id(value.role,`${label}.role`);
  assert(['minor','major'].includes(value.importance),`${label}.importance must be minor or major`);
  assert(Array.isArray(value.readability)&&value.readability.length>0&&value.readability.every(v=>STORY_READABILITY.has(v)),`${label}.readability is invalid`);
  if(value.importance==='major')assert(new Set(value.readability).size>=2,`${label} major object needs at least two readability channels`);
}
function collider(value,label){
  assert(value&&typeof value==='object'&&!Array.isArray(value),`${label} must be an object`);
  assert(value.shape==='box',`${label}.shape must be box`);
  if(value.halfExtents)vec(value.halfExtents,3,`${label}.halfExtents`);
  if(value.offset)vec(value.offset,3,`${label}.offset`);
  if(value.halfExtents)assert(value.halfExtents.every(v=>v>0&&v<=100),`${label}.halfExtents must be > 0 and <= 100`);
  for(const key of ['blocksPlayer','blocksCamera'])if(key in value)assert(typeof value[key]==='boolean',`${label}.${key} must be boolean`);
}
function environment(def){
  if(def==null)return;
  assert(typeof def==='object'&&!Array.isArray(def),'environment must be an object');
  if('clearColor' in def)hex(def.clearColor,'environment.clearColor');
  if('ambient' in def)hex(def.ambient,'environment.ambient');
  if('exposure' in def)assert(Number.isFinite(def.exposure)&&def.exposure>0&&def.exposure<=8,'environment.exposure must be > 0 and <= 8');
  if('toneMapping' in def)tone(def.toneMapping,'environment.toneMapping');
  if(def.fog!=null){
    const fog=def.fog;
    assert(typeof fog==='object'&&!Array.isArray(fog),'environment.fog must be an object');
    assert(FOG_TYPES.has(fog.type),`environment.fog has unsupported type ${fog.type}`);
    if('color' in fog)hex(fog.color,'environment.fog.color');
    if(fog.type==='linear'){
      assert(Number.isFinite(fog.start)&&fog.start>=0,'environment.fog.start must be >= 0');
      assert(Number.isFinite(fog.end)&&fog.end>fog.start,'environment.fog.end must be greater than start');
    }
    if(fog.type==='exp'||fog.type==='exp2'){
      assert(Number.isFinite(fog.density)&&fog.density>0&&fog.density<=1,'environment.fog.density must be > 0 and <= 1');
    }
  }
}
function assets(spec){
  const result=new Map();
  if(spec.assets==null)return result;
  assert(typeof spec.assets==='object'&&!Array.isArray(spec.assets),'assets must be an object');
  for(const [assetId,def] of Object.entries(spec.assets)){
    id(assetId,'asset');
    assert(def&&typeof def==='object'&&!Array.isArray(def),`${assetId} asset must be an object`);
    assert(ASSET_TYPES.has(def.type),`${assetId} has unsupported asset type ${def.type}`);
    assert(typeof def.src==='string'&&/^\/[a-zA-Z0-9_./-]+$/.test(def.src)&&!def.src.includes('..'),`${assetId}.src must be a safe same-origin root path`);
    if(def.transform)transform(def.transform,`${assetId}.transform`);
    if(def.materialOverrides){
      assert(typeof def.materialOverrides==='object'&&!Array.isArray(def.materialOverrides),`${assetId}.materialOverrides must be an object`);
      for(const [source,target] of Object.entries(def.materialOverrides)){
        assert(source.length>0&&source.length<=150&&typeof target==='string'&&Object.hasOwn(spec.materials,target),`${assetId} material override must reference a known material`);
      }
    }
    const aliases=new Set();
    if(def.animations!=null){
      assert(typeof def.animations==='object'&&!Array.isArray(def.animations),`${assetId}.animations must be an object`);
      for(const [alias,track] of Object.entries(def.animations)){
        id(alias,`${assetId} animation alias`);
        assert(typeof track==='string'&&track.length>0&&track.length<=180,`${assetId}.${alias} must name an animation track`);
        aliases.add(alias);
      }
    }
    if(def.defaultAnimation!=null){
      id(def.defaultAnimation,`${assetId}.defaultAnimation`);
      assert(aliases.has(def.defaultAnimation),`${assetId}.defaultAnimation must reference an animation alias`);
    }
    result.set(assetId,{def,aliases});
  }
  return result;
}

export function validateWorldSpec(spec){
  assert(spec&&typeof spec==='object','spec must be an object');
  assert(String(spec.schemaVersion)===WORLD_SPEC_VERSION,`schemaVersion must be ${WORLD_SPEC_VERSION}`);
  id(spec.id,'world');
  assert(typeof spec.version==='string'&&spec.version.length>0,'version is required');
  environment(spec.environment);
  assert(spec.materials&&typeof spec.materials==='object','materials are required');
  renderStyle(spec);
  const assetDefs=assets(spec);
  assert(Array.isArray(spec.entities)&&spec.entities.length>0,'entities are required');
  const ids=new Set();
  const entityDefs=new Map();
  for(const entity of spec.entities){
    id(entity.id,'entity');
    assert(!ids.has(entity.id),`duplicate entity ${entity.id}`);
    ids.add(entity.id);entityDefs.set(entity.id,entity);
    if(entity.parent)id(entity.parent,'parent');
    assert([entity.primitive,entity.asset,entity.geometry].filter(Boolean).length<=1,`${entity.id} cannot use multiple render sources`);
    if(entity.geometry){
      assert(typeof entity.geometry==='string'&&Object.hasOwn(spec.geometries||{},entity.geometry),`${entity.id} references unknown geometry ${entity.geometry}`);
      assert(typeof entity.material==='string'&&Object.hasOwn(spec.materials,entity.material),`${entity.id} geometry requires a material`);
    }
    if(entity.primitive)assert(PRIMITIVES.has(entity.primitive),`unsupported primitive ${entity.primitive}`);
    if(entity.batchGroup!=null){
      assert(typeof entity.batchGroup==='string'&&Object.hasOwn(spec.batchGroups||{},entity.batchGroup),`${entity.id} references unknown batch group`);
      assert(Boolean(entity.primitive||entity.geometry)&&!entity.asset&&!entity.motion,`${entity.id} batch group requires static primitive or geometry`);
    }
    if(entity.asset){
      id(entity.asset,`${entity.id}.asset`);
      assert(assetDefs.has(entity.asset),`${entity.id} references unknown asset ${entity.asset}`);
      const aliases=assetDefs.get(entity.asset).aliases;
      if(entity.animation!=null){id(entity.animation,`${entity.id}.animation`);assert(aliases.has(entity.animation),`${entity.id}.animation references unknown alias ${entity.animation}`);}
      if(entity.animationBlendTime!=null)assert(Number.isFinite(entity.animationBlendTime)&&entity.animationBlendTime>=0&&entity.animationBlendTime<=5,`${entity.id}.animationBlendTime must be between 0 and 5`);
    }
    if(entity.material)assert(spec.materials[entity.material],`unknown material ${entity.material}`);
    if(entity.position)vec(entity.position,3,`${entity.id}.position`);
    if(entity.rotation)vec(entity.rotation,3,`${entity.id}.rotation`);
    if(entity.scale)vec(entity.scale,3,`${entity.id}.scale`);
    if(entity.collider)collider(entity.collider,`${entity.id}.collider`);
    if(entity.storyObject)storyObject(entity.storyObject,`${entity.id}.storyObject`);
    if(entity.motion){
      assert(MOTIONS.has(entity.motion.type),`unsupported motion ${entity.motion.type}`);
      if(entity.motion.axis)vec(entity.motion.axis,3,`${entity.id}.motion.axis`);
      if(entity.motion.offset)vec(entity.motion.offset,3,`${entity.id}.motion.offset`);
      if('speed' in entity.motion)assert(Number.isFinite(entity.motion.speed)&&entity.motion.speed>0,`${entity.id}.motion.speed`);
      if('amplitude' in entity.motion)assert(Number.isFinite(entity.motion.amplitude),`${entity.id}.motion.amplitude`);
      if('phase' in entity.motion)assert(Number.isFinite(entity.motion.phase),`${entity.id}.motion.phase`);
      if(entity.motion.type==='patrol')assert(entity.motion.offset&&entity.motion.offset.some(v=>Math.abs(v)>.01),`${entity.id}.motion patrol needs a non-zero offset`);
    }
  }
  for(const entity of spec.entities){
    assert(!entity.parent||ids.has(entity.parent),`${entity.id} parent ${entity.parent} does not exist`);
    if(entity.fallback){
      assert(entity.asset,`${entity.id}.fallback requires an asset entity`);
      assert(Array.isArray(entity.fallback)&&entity.fallback.length>0,`${entity.id}.fallback must be a non-empty entity list`);
      for(const fallbackId of entity.fallback){
        assert(ids.has(fallbackId),`${entity.id}.fallback references unknown entity ${fallbackId}`);
        assert(fallbackId!==entity.id,`${entity.id} cannot fall back to itself`);
      }
    }
  }
  assert(spec.cameras&&typeof spec.cameras==='object'&&Object.keys(spec.cameras).length,'cameras are required');
  for(const [name,camera] of Object.entries(spec.cameras)){
    cameraShot(camera,name);
    if(camera.portrait)cameraShot(camera.portrait,`${name}.portrait`);
  }
  if(spec.states){
    for(const [name,state] of Object.entries(spec.states)){
      if(state.camera)assert(spec.cameras[state.camera],`${name} references unknown camera ${state.camera}`);
      if(state.environment)environment(state.environment);
      for(const key of ['show','hide']){
        if(state[key])for(const entityId of state[key])assert(ids.has(entityId),`${name} references unknown entity ${entityId}`);
      }
      if(state.transforms)for(const [entityId,value] of Object.entries(state.transforms)){
        assert(ids.has(entityId),`${name} transform references unknown entity ${entityId}`);
        transform(value,`${name}.${entityId}`);
      }
      if(state.animations)for(const [entityId,alias] of Object.entries(state.animations)){
        assert(ids.has(entityId),`${name} animation references unknown entity ${entityId}`);
        const entity=entityDefs.get(entityId);
        assert(entity.asset,`${name} animation target ${entityId} is not an asset entity`);
        id(alias,`${name}.${entityId}.animation`);
        assert(assetDefs.get(entity.asset).aliases.has(alias),`${name}.${entityId} references unknown animation alias ${alias}`);
      }
    }
  }
  if(spec.player){
    validatePlayerProfile(spec.player,ids);
    const playerEntity=entityDefs.get(spec.player.entity);
    if(playerEntity?.asset)assert(spec.player.animations,'asset-backed player requires explicit player.animations');
    if(spec.player.animations){
      assert(spec.player.animations&&typeof spec.player.animations==='object'&&!Array.isArray(spec.player.animations),'player.animations must be an object');
      assert(Object.keys(spec.player.animations).every(key=>key==='idle'||key==='move'),'player.animations only supports idle/move aliases');
      assert(playerEntity?.asset,'player.animations requires an asset-backed player entity');
      const aliases=assetDefs.get(playerEntity.asset).aliases;
      for(const [key,alias] of Object.entries(spec.player.animations)){
        id(alias,`player.animations.${key}`);
        assert(aliases.has(alias),`player.animations.${key} references unknown alias ${alias}`);
      }
      assert(typeof spec.player.animations.idle==='string'&&typeof spec.player.animations.move==='string','player.animations must explicitly declare idle and move');
    }
    if(spec.player.animationSpeeds){
      assert(spec.player.animationSpeeds&&typeof spec.player.animationSpeeds==='object'&&!Array.isArray(spec.player.animationSpeeds),'player.animationSpeeds must be an object');
      assert(Object.keys(spec.player.animationSpeeds).every(key=>key==='idle'||key==='move'),'player.animationSpeeds only supports idle/move');
      for(const [key,value] of Object.entries(spec.player.animationSpeeds))assert(Number.isFinite(value)&&value>=0&&value<=3,`player.animationSpeeds.${key} must be between 0 and 3`);
    }
  }
  return spec;
}
