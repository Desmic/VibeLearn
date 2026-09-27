/* Reversible source acquisition belongs to the browser interaction, not the
   assessed command journal. Scope a pending ID to a package and attempt so a
   reload can restore it without writing a first choice or leaking into a new run. */
export function createPendingSourceStore(storage, namespace='pending-source'){
  const key=({attemptId,version,kind})=>`${namespace}:${version}:${attemptId}:${kind}`;
  return {
    read(scope,allowed){
      if(!scope?.attemptId||!scope?.version||!scope?.kind)return null;
      try{
        const value=storage.getItem(key(scope));
        return allowed.includes(value)?value:null;
      }catch{return null;}
    },
    set(scope,value){
      if(!scope?.attemptId||!scope?.version||!scope?.kind)return;
      try{storage.setItem(key(scope),value);}catch{/* Storage can be unavailable. */}
    },
    clear(scope){
      if(!scope?.attemptId||!scope?.version||!scope?.kind)return;
      try{storage.removeItem(key(scope));}catch{/* UI remains usable without storage. */}
    }
  };
}
