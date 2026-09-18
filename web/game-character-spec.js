/* Reusable character/control profiles. Story identity is supplied by each game package. */
'use strict';

export function keeperCharacter(id='keeper'){
  const e=[{id,position:[0,0,0],enabled:false}];
  const part=(name,primitive,material,position,scale,extra={})=>e.push({id:`${id}-${name}`,parent:id,primitive,material,position,scale,...extra});
  part('coat','capsule','keeper-coat',[0,.85,0],[.55,.72,.42]);
  part('hood','sphere','keeper-coat',[0,1.6,0],[.6,.6,.56]);
  part('face','box','keeper-face',[0,1.61,.27],[.35,.25,.05]);
  part('eyes','box','keeper-light',[0,1.64,.30],[.22,.035,.025]);
  part('belt','box','keeper-gold',[0,.65,0],[.54,.12,.45]);
  part('scarf','box','keeper-gold',[0,1.3,.1],[.62,.13,.49]);
  part('scarf-tail','box','keeper-gold',[-.17,1.06,-.28],[.16,.5,.04],{rotation:[12,0,-8]});
  part('arm-left','capsule','keeper-coat',[-.38,.94,0],[.18,.55,.2]);
  part('arm-right','capsule','keeper-coat',[.38,.94,0],[.18,.55,.2]);
  part('leg-left','capsule','keeper-boot',[-.17,.28,0],[.21,.48,.25]);
  part('leg-right','capsule','keeper-boot',[.17,.28,0],[.21,.48,.25]);
  part('lantern','sphere','keeper-light',[.43,.6,.12],[.17,.2,.17]);
  return e;
}

export const keeperMaterials={
  'keeper-coat':{diffuse:'#267f85',gloss:.25},'keeper-face':{diffuse:'#132a35',gloss:.1},
  'keeper-gold':{diffuse:'#ebc780',emissive:'#8d6730',emissiveIntensity:.15},
  'keeper-boot':{diffuse:'#19313d'},'keeper-light':{diffuse:'#bcffe8',emissive:'#8af2d9',emissiveIntensity:1.5}
};

export function characterControlProfile({
  entity,spawn,surfaces,obstacles=[],camera={},speed=2.8,limbs=null,animations=null,animationSpeeds=null,body=null
}){
  return {
    version:'1',entity,spawn,speed,surfaces,obstacles,
    ...(limbs?.length?{limbs:[...limbs]}:{}),
    ...(animations?{animations:{...animations}}:{}),
    ...(animationSpeeds?{animationSpeeds:{...animationSpeeds}}:{}),
    ...(body?{body:{...body}}:{}),
    camera:{yaw:-42,pitch:22,distance:6,minDistance:2.8,maxDistance:15,targetHeight:1.1,...camera}
  };
}

export function keeperProfile({spawn,surfaces,obstacles=[],camera={}}){
  return characterControlProfile({
    entity:'keeper',spawn,surfaces,obstacles,camera,
    limbs:['keeper-arm-left','keeper-arm-right','keeper-leg-right','keeper-leg-left']
  });
}
