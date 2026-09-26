/* A local, unassessed selection until the player activates an explicit commit.
   The scope includes the attempt revision, so a saved action or a different
   question cannot inherit an old tentative answer. The caller owns rendering
   and the authoritative command; this module never writes learning evidence. */
export function createReversibleChoice(onChange=()=>{}){
  let scope=null,value=null,committedScope=null;
  return {
    selected(nextScope){return nextScope===scope?value:null;},
    select(nextScope,nextValue){if(committedScope===nextScope)return;scope=nextScope;value=nextValue;onChange();},
    clear(nextScope){if(nextScope===scope){value=null;onChange();}},
    async commit(nextScope,dispatch){
      if(nextScope!==scope||!value||committedScope===nextScope)return false;
      committedScope=nextScope;
      try{await dispatch(value);return true;}
      catch(error){committedScope=null;throw error;}
    },
    reset(){scope=null;value=null;committedScope=null;}
  };
}
