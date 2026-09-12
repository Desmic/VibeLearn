/* Engine-neutral WorldSpec validation for Phase 1 generated-game runtime. */
'use strict';

export const WORLD_SPEC_VERSION = '1';
const PRIMITIVES = new Set(['box','sphere','cone','cylinder','plane','torus','capsule']);
const MOTIONS = new Set(['spin','bob','pulse']);

function assert(condition,message){if(!condition)throw new Error(`WorldSpec invalid: ${message}`);}
function vec(value,n,label){
  assert(Array.isArray(value)&&value.length===n&&value.every(Number.isFinite),`${label} must be ${n} finite numbers`);
}
function id(value,label){assert(typeof value==='string'&&/^[a-zA-Z0-9._:-]+$/.test(value),`${label} has invalid id`);}
function cameraShot(shot,label){
  assert(shot&&typeof shot==='object',`${label} must be a camera shot`);
  vec(shot.position,3,`${label}.position`);
  vec(shot.lookAt,3,`${label}.lookAt`);
  if('fov' in shot)assert(Number.isFinite(shot.fov),`${label}.fov`);
}

export function validateWorldSpec(spec){
  assert(spec&&typeof spec==='object','spec must be an object');
  assert(String(spec.schemaVersion)===WORLD_SPEC_VERSION,`schemaVersion must be ${WORLD_SPEC_VERSION}`);
  id(spec.id,'world');
  assert(typeof spec.version==='string'&&spec.version.length>0,'version is required');
  assert(spec.materials&&typeof spec.materials==='object','materials are required');
  assert(Array.isArray(spec.entities)&&spec.entities.length>0,'entities are required');
  const ids=new Set();
  for(const entity of spec.entities){
    id(entity.id,'entity');
    assert(!ids.has(entity.id),`duplicate entity ${entity.id}`);
    ids.add(entity.id);
    if(entity.parent)id(entity.parent,'parent');
    if(entity.primitive)assert(PRIMITIVES.has(entity.primitive),`unsupported primitive ${entity.primitive}`);
    if(entity.material)assert(spec.materials[entity.material],`unknown material ${entity.material}`);
    if(entity.position)vec(entity.position,3,`${entity.id}.position`);
    if(entity.rotation)vec(entity.rotation,3,`${entity.id}.rotation`);
    if(entity.scale)vec(entity.scale,3,`${entity.id}.scale`);
    if(entity.motion){
      assert(MOTIONS.has(entity.motion.type),`unsupported motion ${entity.motion.type}`);
      if(entity.motion.axis)vec(entity.motion.axis,3,`${entity.id}.motion.axis`);
      if('speed' in entity.motion)assert(Number.isFinite(entity.motion.speed),`${entity.id}.motion.speed`);
      if('amplitude' in entity.motion)assert(Number.isFinite(entity.motion.amplitude),`${entity.id}.motion.amplitude`);
    }
  }
  for(const entity of spec.entities){
    assert(!entity.parent||ids.has(entity.parent),`${entity.id} parent ${entity.parent} does not exist`);
  }
  assert(spec.cameras&&typeof spec.cameras==='object'&&Object.keys(spec.cameras).length,'cameras are required');
  for(const [name,camera] of Object.entries(spec.cameras)){
    cameraShot(camera,name);
    if(camera.portrait)cameraShot(camera.portrait,`${name}.portrait`);
  }
  if(spec.states){
    for(const [name,state] of Object.entries(spec.states)){
      if(state.camera)assert(spec.cameras[state.camera],`${name} references unknown camera ${state.camera}`);
      for(const key of ['show','hide']){
        if(state[key])for(const entityId of state[key])assert(ids.has(entityId),`${name} references unknown entity ${entityId}`);
      }
      if(state.transforms)for(const [entityId,transform] of Object.entries(state.transforms)){
        assert(ids.has(entityId),`${name} transform references unknown entity ${entityId}`);
        if(transform.position)vec(transform.position,3,`${name}.${entityId}.position`);
        if(transform.rotation)vec(transform.rotation,3,`${name}.${entityId}.rotation`);
        if(transform.scale)vec(transform.scale,3,`${name}.${entityId}.scale`);
      }
    }
  }
  return spec;
}
