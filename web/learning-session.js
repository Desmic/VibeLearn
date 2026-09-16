/* Shared authenticated command client. Retains the exact command for lost-ACK retry. */
export function createLearningSession(onChange=()=>{}){
  let attempt=null,busy=false,pending=null,error=null;
  async function request(path,body){
    const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Learning-Command':'1'},body:JSON.stringify(body)});
    const result=await response.json();
    if(!response.ok)throw Object.assign(new Error(result.message||'Could not save. Your action is retained.'),{code:result.error});
    return result;
  }
  async function execute(command,body){
    if(busy)return;
    busy=true;pending={command,body};error=null;onChange();
    try{attempt=await request('/api/commands/'+command,body);pending=null;}catch(e){error=e;}finally{busy=false;onChange();}
  }
  return {
    async load(){const state=await request('/api/session',{});attempt=state.attempt;return state;},
    start:mission=>pending?Promise.resolve():execute('start',{command_id:crypto.randomUUID(),expected_revision:0,mode:'LEARN',mission_id:mission}),
    async action(move){
      if(!attempt||busy||pending||attempt.status!=='draft')return;
      const response=structuredClone(attempt.response);if(move!=='finish')response.word_machine.moves.push(move);
      return execute(move==='finish'?'submit':'save',{command_id:crypto.randomUUID(),expected_revision:attempt.revision,attempt_id:attempt.id,response});
    },
    retry:()=>pending?execute(pending.command,pending.body):Promise.resolve(),
    get attempt(){return attempt;},get busy(){return busy;},get pending(){return pending;},get error(){return error;}
  };
}
