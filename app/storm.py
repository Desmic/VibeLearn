"""Stormworks: pure, versioned teaching model; no learner I/O or code execution.

Guided experiments and withheld-feedback transfer are deliberately different.
A register's ABSENT result certifies no effect AND no old request in flight only
in this bounded model. Neither a timeout nor an ordinary 404 certifies absence.
"""
from copy import deepcopy
from uuid import NAMESPACE_URL, uuid5

VERSION = 'storm-v1'
MAX_MOVES = 100
ACTIONS = {'send', 'original', 'fresh', 'inspect', 'hold', 'rewind', 'approve', 'reconnect'}
TOOLS = {'same': 'Resend saved ticket', 'lookup': 'Read order records', 'wait': 'Hold for resolution', 'new': 'Create new intent'}
SOCKETS = {'quick': 'Reply lost · ticket remembered', 'changed': 'Order details changed', 'late': 'Ticket memory expired', 'absent': 'Proven absent · nothing in flight', 'unknown': 'Records unavailable', 'new_intent': 'A second order is authorized'}
LESSONS = [
    'A missing receipt means an unknown outcome, not a failed order. While the original ticket is remembered, the same ticket and details replay its result without doing the work twice.',
    'A worker restart is not a new business intent. Save the intent ID durably before the first send and reuse it across every worker and retry.',
    'A retry key has a retention boundary. After that window, look up the original intent in an authoritative record. A missing reply does not prove the original work is absent.',
    'Bind an intent ID to its original parameters. Changed parameters need resolution; an explicitly authorized second intent needs its own ID. Do not silently overwrite the first order.',
    'Unknown stays unknown. When records are unreachable, retain a pending operation and escalate or reconcile later. Safe systems also resume work when absence is genuinely established.',
    'A retry strategy must protect against extra effects AND finish work when the outcome is known. A plan that pauses every job is safe from duplicates but does not fulfill the job.',
    'A real intent ID is scoped to its tenant and operation. Event identity survives delivery retries. Combine that identity with parameter binding, finite retention and reconciliation. These checks cover these incidents, not general mastery.',
    'The same principles transfer to provisioning and event processing. A second authorized identical request is not a duplicate. Identity includes the caller/tenant and operation scope.',
]
SPECS = [
 ('First light', 'Get one lamp delivered. A lost receipt must not become two lamps.', 'discovery', 'One lamp will relight the harbour. Pip is ready to send its order.', 0, 0, 'order-7', 'lamp', True),
 ('The reboot', 'Recover the order, not the worker. Deliver exactly one lamp.', 'variation', 'The lamp was ordered. Pip rebooted before receiving a receipt. This new worker has a different ticket.', 1, 1, 'worker-9', 'lamp', True),
 ('Beyond the clock', 'Find the existing lamp after the ticket memory expires.', 'investigation', 'Two days have passed. The workshop remembers retry tickets for only 24 hours. Its order records are a separate service.', 1, 48, 'order-7', 'lamp', True),
 ('A different order', 'Resolve changed details without silently replacing the original order.', 'choice', 'The saved ticket is for a lamp. The new request asks for a bell. Is this a retry, or a new decision?', 1, 1, 'order-7', 'bell', True),
 ('Into the fog', 'Keep uncertainty pending, then finish when the records can answer.', 'investigation', 'The retry window has passed and the records link is down. Pip needs a safe next step, not a guess.', 0, 48, 'order-7', 'lamp', False),
 ('Build the storm engine', 'Wire a plan that delivers safely through every storm.', 'construction', 'Your discoveries are now tools. Pick a tool, fit it into a condition, then launch the storm trials.', 0, 0, 'order-7', 'lamp', True),
 ('The incident desk', 'Use the same ideas to repair real service failures.', 'transfer', 'No hints or results until you commit this plan. Read the actual incident facts, not the harbour story.', 0, 0, 'order-7', 'lamp', True),
 ('Night shift', 'Solve a different set of failures without relying on the old answers.', 'remix', 'New systems, different timing. Your first decisions are recorded before feedback.', 0, 0, 'order-7', 'lamp', True),
]
# Each fixture defines known observations, not a secret real-world oracle.
TRIALS = [
 {'id':'restart','title':'A worker restarts','condition':'quick','effects':1,'expected':1,'record':'committed','story':'Receipt lost. Original order retained. Worker identity changed.'},
 {'id':'boundary','title':'Exactly 24 hours','condition':'late','effects':1,'expected':1,'record':'committed','story':'Ticket memory has expired at the boundary. The separate order record confirms the lamp.'},
 {'id':'payload','title':'The order changes','condition':'changed','effects':1,'expected':1,'record':'committed','story':'Same intent, different parameters. No second purchase is authorized.'},
 {'id':'missing','title':'The request never arrived','condition':'late','effects':0,'expected':1,'record':'absent','story':'Records prove no effect AND no in-flight request. One new attempt is now safe.'},
 {'id':'fog','title':'Records cannot answer','condition':'late','effects':1,'expected':1,'record':'unavailable','story':'The old ticket expired. Records are down. The outcome remains unknown.'},
 {'id':'second','title':'Two lamps, on purpose','condition':'new_intent','effects':1,'expected':2,'record':'committed','story':'A separate second lamp is explicitly authorized. Identical details do not mean identical intent.'},
]
INCIDENTS = [
 {'id':'worker','title':'Duplicate webhook jobs','facts':'event_id=evt_42; delivery_id=try_a then try_b. Both deliveries refer to ONE event.\nBug: the job deduplicates using delivery_id. Which identity should replace it?', 'options':{'delivery':'Keep each delivery ID','event':'Persist tenant + operation + event ID','new':'Generate a random ID on every retry'},'answer':'event','why':'Delivery attempts change; the scoped business event does not. Persist the intended identity before work begins.'},
 {'id':'timeout','title':'An API reply disappears','facts':'operation=reserve(item_8, qty=1); key=reservation_42\nFirst send 09:00; timeout 09:01; now 09:02. Contract: keys retained 8 hours; same parameters replay the result.\nThe receiver outcome is unknown.', 'options':TOOLS,'answer':'same','why':'The unchanged original key and payload are still inside the declared retention window. A fresh key would create another intent.'},
 {'id':'late','title':'A late payment retry','facts':'Same business intent, unchanged amount. First send 49 hours ago.\nProvider key retention: 24 hours. Authoritative transaction lookup is unreachable.\nA timeout is the only earlier observation.', 'options':TOOLS,'answer':'wait','why':'Neither a new key nor an expired key protects this retry. Keep the operation pending and reconcile/escalate; do not claim paid or failed.'},
 {'id':'absent','title':'A lost fulfilment request','facts':'A provider-specific reconciliation endpoint proves: no shipment for this intent AND no earlier request in flight.\nThe order is still authorized, unchanged and not yet fulfilled.\nThe old retry entry has expired.', 'options':TOOLS,'answer':'same','why':'This unusually strong absence guarantee permits one new attempt for the same intent. An ordinary not-found or empty eventually consistent read would not.'},
 {'id':'changed','title':'A quantity changes','facts':'key=reservation_42 originally means item_8, qty=1.\nA retry arrives with qty=2. No customer authorization for another reservation is recorded.', 'options':TOOLS,'answer':'wait','why':'Reject or hold the conflicting request and resolve intent. Do not silently overwrite parameters or create a second authorized operation.'},
]
REMIX = [
 {'id':'vm','title':'A provisioning retry','facts':'Intent: create one compute instance. Original key is 9 hours old; retention is 8 hours.\nNo success reply was received. The authoritative intent lookup is available but has not been queried.', 'options':TOOLS,'answer':'lookup','why':'After expiry, inspect the authoritative intent record rather than assume failure and provision another instance.'},
 {'id':'second','title':'Identical, but not a retry','facts':'A customer intentionally submits two separately authorized jobs with identical inputs.\nThe first job completed. The second has never been sent.\nShould identical request content deduplicate the second job?', 'options':TOOLS,'answer':'new','why':'Two authorized intents need distinct identities even if their payloads match. A payload hash alone is not business identity.'},
 {'id':'tenant','title':'Two tenants, one local ID','facts':'Tenant A and tenant B both have order_id=17.\nBug: one shared deduplication table uses only order_id.\nChoose the identity rule that avoids suppressing B’s legitimate order.', 'options':{'local':'Use only order_id','scoped':'Use tenant + operation + order intent','payload':'Use only the request body hash'},'answer':'scoped','why':'Deduplication must respect tenant and operation boundaries. Locally equal IDs do not identify the same intent.'},
]


def campaign(template):
    items = []
    for i, spec in enumerate(SPECS, 1):
        title, goal, kind, intro, effects, hours, ticket, payload, reachable = spec
        item = deepcopy(template)
        for field in ('activity','frame','binding','rubric'):
            item[field]['id'] = str(uuid5(NAMESPACE_URL, f'{VERSION}:{i}:{field}'))
            item[field]['revision'] = 1
        item['family_id'] = str(uuid5(NAMESPACE_URL,f'{VERSION}:{i}:family'))
        item['title'], item['intro'], item['prompt'], item['trace'] = title, intro, goal, []
        item['frame'].update(name=goal, coverage='bounded scenario transfer' if i>=7 else 'guided simulation')
        item['binding']['criterion'] = 'storm_execution'
        item['rubric']['criteria'] = [{'id':'storm_execution','name':goal,'method':VERSION,'coverage':item['frame']['coverage']}]
        item['policies']['assessment'] = VERSION
        item['hints'] = [LESSONS[i-1]] if i<7 else []
        item['assumptions'] = 'Original teaching model: atomic effect plus retry record; 24h ticket retention; separate durable intent records. ABSENT is authoritative with no request in flight. Unavailable is unknown. Rewinds reset only the rehearsal, never saved history. These assumptions are not universal provider guarantees.'
        item['validation'] = {'status':'criterion_checked','scope':item['frame']['coverage'],'basis':'Executable pinned scenarios; no general mastery or course-equivalence claim.'}
        item['mission'] = {'id':f'storm-{i:02d}','number':i,'difficulty':kind.title(),'boss':i==6,'objective':goal,'plain_objective':goal,'requires_diagnosis':False,'available_modes':['LEARN'],'source_enabled':True,'hint_count':len(item['hints']),'reward_xp':10}
        item['storm'] = {'version':VERSION,'level':i,'kind':kind,'lesson':LESSONS[i-1],'sockets':SOCKETS if i==6 else {},'tools':TOOLS,'incidents':deepcopy(INCIDENTS if i==7 else REMIX if i==8 else [])}
        # Rubric answers are never sent by presented(); code remains inspectable, not a secure exam.
        items.append(item)
    return items


def validate(game, level):
    if not isinstance(game,dict) or set(game)!={'moves','policy'} or not isinstance(game['moves'],list) or len(game['moves'])>MAX_MOVES or not isinstance(game['policy'],dict):
        raise ValueError('This saved run has an invalid structure.')
    allowed = SOCKETS if level==6 else {c['id']:c for c in (INCIDENTS if level==7 else REMIX)} if level>=7 else {}
    if set(game['policy'])-set(allowed): raise ValueError('Unknown plan condition.')
    for key,value in game['policy'].items():
        options = TOOLS if level==6 else allowed[key]['options']
        if not isinstance(value,str) or value not in options: raise ValueError('Choose a tool available for this condition.')
    for move in game['moves']:
        if level<6:
            if not isinstance(move,str) or move not in ACTIONS: raise ValueError('Unknown workshop action.')
        elif level==6:
            if not isinstance(move,dict) or set(move)!={'action','policy'} or move['action']!='test': raise ValueError('The engine accepts only plan trials.')
            validate({'moves':[],'policy':move['policy']},6)
        else:
            raise ValueError('The incident desk records a plan, not guided simulation moves.')
    return game


def trial(policy, fixture):
    c=fixture; condition=c['condition']; effects=c['effects']; trail=[]; status='unresolved'
    for _ in range(4):
        tool=policy.get(condition)
        trail.append({'condition':condition,'tool':tool or 'unwired'})
        if not tool: break
        if tool=='lookup':
            if c['condition']=='new_intent': status='second_intent_not_sent'; break
            condition = {'committed':'confirmed','absent':'absent','unavailable':'unknown'}[c['record']]
            if condition=='confirmed': status='confirmed' if c['condition']!='changed' else 'conflicting_details'; break
            continue
        if tool=='wait': status='conflict_held' if c['condition']=='changed' else 'pending'; break
        if tool in ('same','new'):
            if condition=='absent' and tool=='new': status='unauthorized_new_intent'; break
            retained=c['condition']=='quick' and tool=='same'
            if c['condition']=='changed' and tool=='same': status='conflict_unresolved'; break
            if c['condition']=='new_intent' and tool=='same': status='second_intent_suppressed'; break
            effects += int(not retained)
            status='confirmed'; break
    correct = (status=='conflict_held' and effects==1 if c['condition']=='changed' else status=='pending' and effects==c['effects'] if c['record']=='unavailable' else status=='confirmed' and effects==c['expected'])
    return {'run':c['title'],'correct':correct,'actual':f'{effects} effect(s) · {status.replace("_"," ")}','expected': 'hold changed intent' if c['condition']=='changed' else 'preserve pending uncertainty' if c['record']=='unavailable' else f'{c["expected"]} intended effect(s)','reason':c['story'],'trail':trail,'effects':effects,'status':status}


def trials(policy): return [trial(policy,c) for c in TRIALS]


def replay(snapshot, game=None, submitted=False):
    config=snapshot['storm']; level=config['level']
    if config['version']!=VERSION: raise ValueError('Unsupported pinned workshop model.')
    game=validate(game or {'moves':[],'policy':{}},level)
    if level>=6:
        rows=[]; tested=False
        if level==6 and game['moves']:
            last=game['moves'][-1]; rows=trials(last['policy']); tested=last['policy']==game['policy']
        elif level>=7 and submitted:
            rows=transfer(snapshot,game); tested=True
        complete=bool(tested and rows and all(r['correct'] for r in rows))
        return {'level':level,'kind':config['kind'],'complete':complete,'tested':tested,'rows':rows,'moves':len(game['moves']),'available':[],'feedback':snapshot['intro'],'effects':0,'known':'plan','rewinds':0}
    spec=SPECS[level-1]
    def initial():
        return {'level':level,'kind':config['kind'],'effects':spec[4],'hours':spec[5],'ticket':spec[6],'payload':spec[7],'reachable':spec[8],'known':'not_sent' if level==1 else 'unknown','sent':level!=1,'inspected':False,'approved':False,'complete':False,'feedback':spec[3], 'last_action':None, 'tone':'neutral', 'unsafe':False, 'fresh_count':0, 'cache':{'order-7':{'at':0,'payload':'lamp'}} if spec[4] else {}}
    s=initial(); rewinds=0; history=[]
    for action in game['moves']:
        if action not in available(s): raise ValueError('That action is not available now. Resume the saved run.')
        s['last_action']=action; s['tone']='neutral'
        if action=='rewind': s=initial();rewinds+=1;s['feedback']='Another rehearsal. Try a different idea; your earlier discoveries are still recorded.'
        elif action=='original': s['ticket']='order-7';s['feedback']='The journal kept order-7. The worker changed; the order identity did not.'
        elif action=='fresh':
            s['fresh_count']+=1;s['ticket']=f'fresh-{s["fresh_count"]}';s['feedback']='A new ticket looks like a new order to the workshop.'
        elif action=='approve': s['approved']=True;s['ticket']='order-8';s['feedback']='A separate bell is now explicitly authorized. Its new intent gets its own ticket; the original lamp remains unchanged.'
        elif action=='reconnect': s['reachable']=True;s['feedback']='The records link is back. Connectivity alone does not tell us the old order’s outcome.'
        elif action=='inspect':
            s['inspected']=True
            if not s['reachable']: s['known']='unknown';s['feedback']='Records cannot answer. That is neither proof of delivery nor proof of failure.'
            elif level==4 and s['approved']:
                s['known']='absent';s['feedback']='The original lamp exists. The separately authorized bell is not made yet. Its new intent needs its own attempt.'
            elif s['payload']=='bell' and not s['approved']: s['known']='conflict';s['feedback']='Original record: one lamp, order-7. Current request: one bell. These are different details, not the same retry.'
            else: s['known']='confirmed' if s['effects'] else 'absent';s['feedback']='The durable order record confirms the original lamp. No new order is needed.' if s['effects'] else 'The record proves absence and no request in flight. One attempt is safe.'
        elif action=='hold':
            s['known']='conflict_held' if level==4 else 'pending';s['feedback']='Changed request held for a new authorization. The original lamp is untouched.' if level==4 else 'Pip kept the intent pending. No duplicate, no invented outcome. A person or later reconciliation can resolve it.'
            s['complete']=s['effects']==spec[4] and level==4;s['tone']='good' if s['complete'] else 'neutral'
            if level==5 and not s['inspected']: s['feedback']='Pip paused the order. Check the records to distinguish a known outcome from one that still needs investigation.'
        elif action=='send':
            entry=s['cache'].get(s['ticket']);retained=bool(entry and s['hours']-entry['at']<24)
            justified=s['hours']<24 or s['known']=='absent'
            if retained and s['payload']!=entry['payload']: s['known']='conflict';s['feedback']='The workshop rejected different details under the old ticket. The first order was not overwritten.';s['tone']='clue'
            else:
                s['effects']+=int(not retained)
                if not retained:s['cache'][s['ticket']]={'at':s['hours'],'payload':s['payload']}
                if not s['sent'] and level==1: s['known']='unknown';s['feedback']='One lamp was made. The receipt vanished. Pip cannot tell whether it worked. What will this ticket do on another send?'
                else: s['known']='confirmed';s['feedback']='The remembered ticket returned its original result. No extra lamp.' if retained else 'A new effect was created. Compare what you intended with what the workshop made.'
                s['sent']=True
                if level==5 and not justified:
                    s['unsafe']=True;s['tone']='setback';s['feedback']='The attempt happened to make one lamp, but Pip could not justify the retry from what was known. Rewind and resolve the uncertainty before sending.'
                expected=2 if s['approved'] else 1
                if s['effects']>expected: s['tone']='setback';s['feedback']='An extra lamp! The workshop saw a new or forgotten ticket. Nothing is lost here: rewind and test a different repair.'
        if not s['complete']:
            if level in (1,2,3,5) and s['known']=='confirmed' and s['effects']==1 and not s['unsafe']: s['complete']=True;s['tone']='good'
            elif level==4 and s['approved'] and s['effects']==2 and s['known']=='confirmed': s['complete']=True;s['tone']='good'
        history.append({'action':action,'effects':s['effects'],'known':s['known'],'ticket':s['ticket'],'complete':s['complete']})
    s.update(moves=len(game['moves']),rewinds=rewinds,available=available(s),trail=history,rows=[])
    return s


def available(s):
    if s['complete'] or s.get('unsafe') or s['effects']>(2 if s['approved'] else 1): return ['rewind']
    result=['send','fresh','rewind']
    if s['level']>=2 and s['ticket']!='order-7':result.append('original')
    if s['level']>=3:result.append('inspect')
    if s['level']==4:result+=['hold','approve'] if not s['approved'] else []
    if s['level']==5:result+=['hold']+(['reconnect'] if not s['reachable'] else [])
    return result


def transfer(snapshot,game):
    rows=[]
    for c in snapshot['storm']['incidents']:
        value=game['policy'].get(c['id']); correct=value==c['answer']
        # Authoritative absence also permits a new token for the SAME authorized
        # intent in this bounded fixture. UI's "new intent" is different, so no.
        rows.append({'run':c['title'],'correct':correct,'actual':c['options'].get(value,'No plan recorded'),'expected':c['options'][c['answer']],'reason':c['why']})
    return rows


def evaluate(snapshot,response,independence):
    game=response.get('game',{'moves':[],'policy':{}});s=replay(snapshot,game,submitted=True);level=s['level']
    observed=bool(game['policy']) if level>=7 else bool(s['moves'])
    if not observed:return {'outcome':'not_observed','score':None,'mastery':'unknown','independence':independence,'rows':[]}
    rows=s['rows'] if level>=6 else [{'run':snapshot['title'],'correct':s['complete'],'actual':f'{s["effects"]} effect(s) · {s["known"]}','expected':snapshot['mission']['plain_objective'],'reason':s['feedback']}]
    correct=sum(r['correct'] for r in rows) if level!=6 or s['tested'] else 0
    return {'outcome':'correct' if s['complete'] else 'partially_correct' if correct else 'incorrect','score':correct/len(rows),'correct_count':correct,'total_count':len(rows),'rows':rows,'independence':independence,'mastery':'provisional','criterion':'storm_execution','reasoning':{'outcome':'not_observed','score':None,'message':'Written explanations and implementation skill have not been graded.'},'scope':'First decisions on pinned incident cases, feedback withheld until submission. Not a secure exam, general mastery, implemented production fix or delayed-retention measurement.' if level>=7 else 'Guided simulation practice with feedback exposure. Not a fresh independent assessment or general mastery claim.','validation':snapshot['validation']}
