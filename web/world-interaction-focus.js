/* Reusable semantic hit and presentation ownership rules. Story modules choose
   entity roots and focus names; authored parent links, not ID spelling, define hits. */
export function createEntityMatcher(entities){
  const parents=new Map(entities.map(({id,parent})=>[id,parent||null]));
  return (target,root)=>{
    const visited=new Set();
    for(let id=target;typeof id==='string'&&parents.has(id);id=parents.get(id)){
      if(visited.has(id))return false;
      visited.add(id);
      if(id===root)return true;
    }
    return false;
  };
}

export function carrierAtFocus(carrierFocus,activeFocus,hasContent=true){
  return Boolean(hasContent&&carrierFocus===activeFocus);
}
