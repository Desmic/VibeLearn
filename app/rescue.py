"""Relay Rescue: bounded investigation, construction and sealed transfer.

A new family of pinned activities; expedition-v1 is intentionally untouched.
Programs are data, not executable Python/JavaScript. No filesystem, network or I/O.
"""
from copy import deepcopy
from uuid import NAMESPACE_URL, uuid5

VERSION = 'rescue-v1'
MAX_MOVES = 120
BLOCKS = {
    'remember': {'name': 'Recover the ticket', 'detail': 'Load the saved ID for this job, even after a restart.', 'code': 'key = job.intent_id'},
    'match': {'name': 'Check the parcel', 'detail': 'Stop if the requested item or quantity changed.', 'code': 'if payload != saved_payload: reject_conflict()'},
    'reconcile': {'name': 'Resolve late orders', 'detail': 'After expiry: find an existing result, retry only proven absence, or pause when unknown.', 'code': 'if expired: reconcile_authoritative_record()'},
    'retry': {'name': 'Send the request', 'detail': 'Send the current ticket and parcel to the service.', 'code': 'service.request(key, payload)'},
    'new': {'name': 'Print a new ticket', 'detail': 'Give this attempt a different ID.', 'code': 'key = new_attempt_id()'},
    'wait': {'name': 'Wait without sending', 'detail': 'Leave this job unresolved for now.', 'code': 'return PENDING'},
}


def case(name, committed=True, elapsed=1, retention=24, changed=False, register='committed', worker=False):
    return dict(name=name, committed=committed, elapsed=elapsed, retention=retention,
                changed=changed, register=register, worker=worker)


TRAINING = [
    dict(title='The Echo Forge went silent', goal='Find Pip’s one bridge gear without ordering a second.',
         brief='The Forge accepted order-01 before lightning cut the reply. One rare ember may already be gone. Find the truth before Pip sends another seal.',
         c=case('Bridge hinge'), tools=['retry','new'], inspections=['ticket','workshop'],
         rule='A missing reply is not a failed order. The same remembered ticket returns the existing result.',
         formal='Idempotent retry: reuse the same key for the same business intent while the service retains it.',
         reward='The footbridge is working. Pip can reach the next island.'),
    dict(title='A new body, the same promise', goal='Repair the courier without ordering twice.',
         brief='Pip restarted. The parcel is unchanged, but the ticket in its hand is different. The journal survived.',
         c=case('Courier restart', worker=True), tools=['remember','retry','new'], inspections=['ticket','journal'],
         rule='A new worker is not a new job. Recover the job ticket before retrying.',
         formal='Persist the intent ID before dispatch. Worker IDs and attempt IDs must not replace it.',
         reward='The courier dock is back. Your jobs now survive a restart.'),
    dict(title='The parcel changed under the same seal', goal='Protect the original order and flag the changed request.',
         brief='The old order was for one small gear. This retry asks for three large gears. Compare the labels before sending.',
         c=case('Changed payload', changed=True), tools=['match','remember','retry','new'], inspections=['parcel','journal'],
         rule='One ticket must keep one meaning. A changed request needs a separate, authorized intent.',
         formal='Bind the idempotency key to a canonical request payload. Reject mismatches; do not silently overwrite.',
         reward='The sorting station is safe. Changed requests no longer slip through.'),
    dict(title='The Echo Forge forgot the old seal', goal='Locate the old gear without making another.',
         brief='The reply was lost 25 hours ago. Ticket memory lasts 24 hours. A separate order book may know what happened.',
         c=case('Expired ticket', elapsed=25), tools=['remember','inspect','retry','collect'], inspections=['ticket','book'],
         rule='A stable ID is not infinite protection. Past the memory window, reconcile with an authoritative record.',
         formal='Respect retention boundaries. Confirm a committed result instead of blind retry after expiry.',
         reward='The lookout lights up. You can recover orders after a long storm.'),
    dict(title='The valley ledger goes dark', goal='Keep uncertainty safe, then finish the missing delivery.',
         brief='The order book is offline. There may already be a gear. First choose how to handle not knowing.',
         c=case('Unreachable register', committed=False, elapsed=25, register='unavailable'), tools=['inspect','pause','retry','collect'], inspections=['book','ticket'],
         rule='Unknown is not absent. Pause and investigate. Retry only after authoritative absence with no in-flight request.',
         formal='Safety and liveness: pause under uncertainty, then resume once reconciliation establishes a safe action.',
         reward='The signal tower is restored. You know when to wait—and when to move.'),
]


def build_campaign(template):
    result=[]
    for i in range(7):
        item=deepcopy(template)
        stem=f'vibelearn:{VERSION}:{i+1}'
        for k in ('activity','frame','binding','rubric'):
            item[k]['id']=str(uuid5(NAMESPACE_URL,stem+':'+k));item[k]['revision']=1
        item['family_id']=str(uuid5(NAMESPACE_URL,stem+':family'))
        training=i<5
        lesson=deepcopy(TRAINING[i]) if training else dict(
            title='Build Pip’s storm route' if i==5 else 'Live incident: a worker crashed',
            goal='Build a route that completes safe jobs and stops unsafe retries.' if i==5 else 'Repair an export worker without creating duplicate files.',
            brief='Place up to four blocks in the route. Run your design through the storms. Order matters: sending ends the route.' if i==5 else 'New system. No guided trial: save the policy you would ship, then see its incident tests. The worker calls an external export service.',
            rule='The useful skill is choosing a safe next action from the evidence, not memorizing a path.',
            formal='A bounded policy is not an end-to-end exactly-once guarantee. Production needs atomicity, concurrent-request handling, durable identity and a reconciliation contract.',
            reward='The whole valley is connected. Your route survives the storm.' if i==5 else 'Incident report saved. Take the repair kit into real code.',
        )
        item.update(title=lesson['title'],intro=lesson['brief'],prompt=lesson['goal'],trace=[],schema_version=3)
        item['frame'].update(name=lesson['goal'],coverage='novel-context policy transfer' if i==6 else 'guided system investigation')
        item['binding']['criterion']='rescue_execution'
        item['rubric']['criteria']=[dict(id='rescue_execution',name='Resolve the pinned incident safely and make progress',method=VERSION,coverage='Bounded cases only; no free-prose, code or general-mastery grade.')]
        item['policies']['assessment']=VERSION
        item['hints']=[lesson['rule'] if training else 'Keep identity durable, reject changed parameters, resolve late uncertainty before sending. Sending is terminal.']
        item['assumptions']='The service atomically binds each retained key to its payload and result. Retention is measured from commit, with expiry at the boundary. The separate authoritative order book can report committed, absent with no in-flight request, or unavailable. Simulated rewind is not a production rollback. A new ID is not authorization for another effect.'
        item['validation']=dict(status='criterion_checked',scope='Original bounded retry-policy simulation',basis='Executable cases, not independently validated learning efficacy or production safety.')
        item['mission']=dict(id=f'rescue-{i+1:02}',number=i+1,difficulty=['Discover','Repair','Compare','Investigate','Resolve','Build','Apply'][i],boss=i>=5,objective=lesson['goal'],plain_objective=lesson['goal'],requires_diagnosis=False,available_modes=['LEARN'],source_enabled=True,hint_count=1,reward_xp=10)
        item['rescue']=dict(version=VERSION,level=i+1,**lesson)
        if i == 5:
            # Optional practice changes presentation/content, not the pass criterion.
            item['activity']['revision'] = 2
            item['rescue']['sandbox_enabled'] = True
        result.append(item)
    return result


def empty():return {'moves':[], 'draft':[]}


def validate(value):
    if not isinstance(value,dict) or set(value)!={'moves','draft'} or not isinstance(value['moves'],list) or len(value['moves'])>MAX_MOVES:
        raise ValueError('This rescue log is invalid or full. Start a new run after recording this one.')
    if not isinstance(value['draft'], list) or len(value['draft'])>4 or any(not isinstance(b,str) or b not in BLOCKS for b in value['draft']):
        raise ValueError('Choose only known route blocks.')
    for move in value['moves']:
        if isinstance(move,str) and move in {'retry','new','remember','match','inspect','pause','collect','rewind','hint'}:continue
        if isinstance(move,dict) and set(move)=={'look'} and isinstance(move['look'],str) and move['look'] in {'ticket','parcel','journal','book','workshop'}:continue
        if isinstance(move,dict) and set(move)=={'storm'}:
            validate_storm(move['storm']);continue
        if isinstance(move,dict) and set(move)=={'program'}:
            p=move['program']
            if isinstance(p,list) and len(p)<=4 and all(isinstance(b,str) and b in BLOCKS for b in p):continue
        raise ValueError('Choose a known rescue action or route block.')
    return value


def validate_storm(storm):
    keys={'program','elapsed','retention','record','changed','worker'}
    if not isinstance(storm,dict) or set(storm)!=keys:
        raise ValueError('The storm needs the known route and conditions.')
    validate({'moves':[], 'draft':storm['program']})
    if (type(storm['elapsed']) is not int or not 0 <= storm['elapsed'] <= 72 or
        type(storm['retention']) is not int or not 1 <= storm['retention'] <= 72 or
        not isinstance(storm['record'],str) or storm['record'] not in ('committed','absent','unavailable') or
        type(storm['changed']) is not bool or type(storm['worker']) is not bool):
        raise ValueError('Choose a 0–72 hour delay, a 1–72 hour memory and known storm conditions.')
    return storm


def sandbox_result(storm):
    validate_storm(storm)
    c=case('Your storm',committed=storm['record']!='absent',elapsed=storm['elapsed'],
           retention=storm['retention'],changed=storm['changed'],register=storm['record'],worker=storm['worker'])
    return execute(storm['program'],c) | {'settings':deepcopy(storm)}


def execute(program,c):
    """Finite declarative interpreter. Observes BOTH no-duplicate and progress goals."""
    key='worker' if c['worker'] else 'intent'
    effects=int(c['committed']);status='unfinished';trail=[]
    for block in program:
        if block=='remember':key='intent';note='Recovered the saved job ID.'
        elif block=='new':key='new';note='Printed another ID. The original intent has not changed.'
        elif block=='match':
            note='Compared the request to its saved meaning.'
            if c['changed']:status='conflict';note='Different parameters. Stopped before sending.'
        elif block=='reconcile':
            if c['elapsed']<c['retention']:note='The ticket is still retained. No late-order lookup needed.'
            elif c['register']=='committed':status='confirmed';note='Authoritative record found the existing result. No retry.'
            elif c['register']=='absent':note='Authoritative absence and no in-flight request: a single attempt can proceed.'
            else:status='paused';note='Record unavailable. Kept uncertainty and escalated; no new effect.'
        elif block=='wait':status='paused';note='Paused without resolving the job.'
        elif block=='retry':
            retained=c['committed'] and c['elapsed']<c['retention'] and key=='intent'
            if retained and c['changed']:status='conflict';note='Service rejected changed parameters for the retained key.'
            else:
                effects+=int(not retained);status='confirmed';note='Replayed the retained result.' if retained else 'Service accepted a new effect.'
        trail.append(dict(block=block,text=note,effects=effects))
        if status!='unfinished':break
    expected='conflict' if c['changed'] else 'paused' if c['elapsed']>=c['retention'] and c['register']=='unavailable' else 'confirmed'
    passed=status==expected and effects==(int(c['committed']) if expected!='confirmed' else 1)
    return dict(name=c['name'],correct=passed,effects=effects,status=status,expected=expected,trail=trail,
                reason='Handled safely with the required progress.' if passed else 'Another effect was created for the same job.' if effects>1 else 'The job did not reach the required safe outcome.')


def program_cases(transfer=False):
    if transfer:
        return [case('Worker B resumes export-721',worker=True,elapsed=.2,retention=6),
                case('Export request parameters changed',changed=True,elapsed=7,retention=6),
                case('Exact six-hour boundary',elapsed=6,retention=6),
                case('Export never started',committed=False,elapsed=8,retention=6,register='absent'),
                case('Export status service offline',elapsed=9,retention=6,register='unavailable'),
                case('Still retained, status service offline',worker=True,elapsed=2,retention=6,register='unavailable')]
    return [case('Restart',worker=True),case('Changed parcel',changed=True,elapsed=25),
            case('At the memory boundary',elapsed=24),case('Nothing arrived',committed=False,elapsed=25,register='absent'),
            case('Book offline',elapsed=25,register='unavailable'),case('Quick retry',register='unavailable')]


def replay(snapshot,value=None,reveal=False):
    cfg=snapshot['rescue'];level=cfg['level'];data=validate(value or empty());moves=data['moves']
    if cfg['version']!=VERSION:raise ValueError('Unsupported pinned rescue version.')
    if level>=6:
        if any(not isinstance(m,dict) or not ('program' in m or 'storm' in m and level==6 and cfg.get('sandbox_enabled')) for m in moves):raise ValueError('Use route blocks in this encounter.')
        runs=[m for m in moves if 'program' in m]
        storms=[m for m in moves if 'storm' in m]
        p=runs[-1]['program'] if runs else []
        if level==7 and (len(moves)>1 or moves and data['draft']!=p):raise ValueError('The transfer policy is sealed. Start a fresh attempt for another policy.')
        rows=[execute(p,c) for c in program_cases(level==7)] if runs and (level==6 or reveal) else []
        return dict(level=level,program=p,rows=rows,sandbox=sandbox_result(storms[-1]['storm']) if storms else None,complete=bool(rows and p==data['draft'] and all(r['correct'] for r in rows)),
                    sealed=level==7 and bool(moves),effects=0,knowledge='Design a route',feedback=cfg['brief'],available=[],moves=len(moves),rewinds=0)
    def start():
        c=deepcopy(cfg['c'])
        return dict(level=level,effects=int(c['committed']),visible_effects=None,knowledge='No confirmation',ticket='worker-02' if c['worker'] else 'order-01',
                    feedback=cfg['brief'],complete=False,failed=False,inspected=False,paused=False,looked=[],trail=[],c=c)
    s=start();rewinds=0
    for m in moves:
        if m=='rewind':s=start();rewinds+=1;continue
        if s['complete'] or s['failed']:raise ValueError('Rewind this rehearsal before another experiment.')
        if isinstance(m,dict):
            t=m.get('look')
            if t not in cfg['inspections']:raise ValueError('That object is not part of this encounter.')
            if t not in s['looked']:s['looked'].append(t)
            s['feedback']={
                'ticket':f"Ticket in hand: {s['ticket']}. Original: order-01. Elapsed {s['c']['elapsed']}h; ticket memory {s['c']['retention']}h.",
                'workshop':'A gear turns behind the window. The Echo Forge acted; Pip just did not get the reply.',
                'journal':'Saved job: order-01. Parcel: one small gear. This journal survives a courier restart.',
                'parcel':'Saved parcel: one small gear. Current retry: three large gears. These are different requests.',
                'book':'The order book is separate from short-lived ticket memory. An offline book is unknown, not empty.',
            }[t]
            if t=='workshop':s['visible_effects']=s['effects']
            continue
        if m not in cfg['tools'] and m!='hint':raise ValueError('That tool has not been introduced here.')
        if m=='hint':s['feedback']=cfg['rule'];continue
        c=s['c']
        if m=='remember':s['ticket']='order-01';s['feedback']='Recovered order-01. Same job, same ticket.'
        elif m=='new':s['ticket']='new-02';s['feedback']='A fresh ticket is ready. Does it still represent the original job?'
        elif m=='match':
            s['feedback']='The parcel changed. Request stopped for clarification; the original order is intact.'
            if c['changed']:s['complete']=True;s['knowledge']='Conflict held for clarification'
        elif m=='inspect':
            s['inspected']=True
            if c['register']=='unavailable':s['knowledge']='Unknown — book offline';s['feedback']='No readable record. There may be an earlier effect. What is safe while the book is offline?'
            elif s['effects']:s['knowledge']='Existing gear confirmed';s['feedback']='The order book found the gear. It can be collected without another order.';s['visible_effects']=s['effects']
            else:s['knowledge']='Absent; no request in flight';s['feedback']='Authoritative check: no gear and no old request still running. You can now send one attempt.';s['visible_effects']=0
        elif m=='pause':
            if not s['inspected'] or c['register']!='unavailable':s['feedback']='Pausing alone does not resolve this case. Inspect the evidence first.'
            else:
                s['paused']=True;c['register']='absent';s['inspected']=False;s['knowledge']='Support restored the book';s['feedback']='You paused safely and called support. The book is online again. Check what it says before deciding.'
        elif m=='collect':
            if s['knowledge']=='Existing gear confirmed' and s['effects']==1:s['complete']=True;s['feedback']=cfg['reward']
            else:s['feedback']='There is no confirmed result to collect. Find out what happened first.'
        elif m=='retry':
            retained=s['effects'] and s['ticket']=='order-01' and c['elapsed']<c['retention']
            if retained and c['changed']:s['failed']=True;s['feedback']='The service rejected this ticket: its parcel changed. Compare the request before retrying.'
            elif c['elapsed']>=c['retention'] and (c['register']=='unavailable' or (level==5 and not s['inspected'])):
                s['failed']=True;s['feedback']='An unverified retry risks another effect. Unknown cannot be treated as absent.'
            else:
                s['effects']+=int(not retained);s['visible_effects']=s['effects'];s['knowledge']='Result confirmed'
                s['failed']=s['effects']>1 or c['changed']
                s['complete']=not s['failed']
                s['feedback']='Two gears for one job. The new or forgotten ticket was treated as another order.' if s['effects']>1 else cfg['reward']
        s['trail'].append(dict(action=m,effects=s['effects'],knowledge=s['knowledge']))
    s.update(available=['rewind'] if s['failed'] else [] if s['complete'] else cfg['tools'],moves=len(moves),rewinds=rewinds)
    s.pop('c')
    return s


def evaluate(snapshot,response,independence):
    s=replay(snapshot,response.get('rescue'),reveal=True)
    if not s['moves'] or s['level']==6 and (not s.get('rows') or response['rescue']['draft']!=s['program']):
        return dict(outcome='not_observed',score=None,mastery='unknown',rows=[],independence=independence,
                    scope='No tested result for the submitted route. Saved playground observations and earlier trials do not grade this untested revision.',
                    reasoning=dict(outcome='not_observed',score=None,message='No current route result was observed.'),validation=snapshot['validation'])
    rows=s.get('rows') or [dict(name=snapshot['title'],correct=s['complete'],reason=s['feedback'])]
    for row in rows:row.update(run=row['name'],actual=row.get('status','resolved' if s['complete'] else 'unresolved'),expected=row.get('expected','safe resolved incident'))
    n=sum(r['correct'] for r in rows)
    return dict(outcome='correct' if s['complete'] else 'partially_correct' if n else 'incorrect',score=n/len(rows),correct_count=n,total_count=len(rows),
                rows=rows,independence=independence,mastery='provisional',criterion='rescue_execution',
                reasoning=dict(outcome='not_observed',score=None,message='Free explanation and executable implementation are not graded.'),
                scope='Sealed policy tested in a new export-worker context; only these cases, not demonstrated implementation or delayed retention.' if s['level']==7 else 'Guided investigation/construction with feedback. Not fresh-independent capability.',
                validation=snapshot['validation'])
