"""Build context-separated critic assignments from an exact-candidate review evidence index."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from tools.native_play_execution import validate_requirements
from tools.art_world_rubric import ART_WORLD_CRITERIA

PASS_SPECS={
    "cold_observer":{
        "requires":[["caption_blind_motion","interactive_trace"]],
        "allowed_modalities":["caption_blind_motion","motion_video","audio_capture","runtime_trace"],
        "suite_roles":["opening"],
        "forbidden_context":["story treatment","storyboard rationale","creator intent","semantic source identifiers","prior critic scores","user review diagnosis"],
        "output_modality":"cold_observer_report",
        "questions":[
            "What kind of place is this before the disruption?",
            "Who appears important and what relationships are visible?",
            "What ordinary activity makes the world feel inhabited?",
            "What major event happens and what appears to cause it?",
            "What changes persist afterward?",
            "At the first playable handoff, who do you control and what should you do next?",
            "What drew your curiosity, what did you choose to try, and what did you discover?",
            "List anything understood only because of explanatory text."
        ]
    },
    "art_world_direction":{
        "requires":[["cold_observer_report"],["interactive_trace"]],
        "allowed_modalities":["cold_observer_report","interactive_trace","screenshot","motion_video","runtime_trace"],
        "suite_roles":["opening","tutorial","controls","chapter","post-ci"],
        "forbidden_context":["creator defense","prior numeric scores"],
        "output_modality":"critic_report",
        "questions":[
            "Use the cold observer's actual perception before interpreting design intent; which visual meanings were missing?",
            "Does world scale give characters, props, routes and events believable proportions?",
            "Do negative space, prop density and landmark spacing give the playable world breathing room?",
            "Does focal hierarchy make the important character, event and next action readable without explanatory labels?",
            "Are silhouettes distinct and landmarks recognizable from multiple playable viewpoints?",
            "Does interactive traversal expose intersecting geometry, floating props, clipping or disconnected visible routes?",
            "Does camera movement preserve composition, protagonist visibility and readable depth rather than hiding problems?",
            "At phone sizes, do framing, spatial relationships, controls and world landmarks remain legible?",
            "Do materials, lighting, color, geometry and motion form one cohesive art direction across the opening, tutorial and mission?",
            "What visible purpose, relationship or trace of history makes this place specific; what response or consequence did you actually observe?",
            "Does exploration reveal something meaningful, and does visual detail support that discovery rather than obstruct it?",
            "Attempt an alternate-angle or scale counterexample; keep any unobserved dimension unassessed."
        ]
    },
    "cinematic_causality":{
        "requires":[["cold_observer_report"],["motion_video"]],
        "allowed_modalities":["cold_observer_report","motion_video","screenshot","audio_capture"],
        "suite_roles":["post-ci","opening"],
        "forbidden_context":["creator defense","prior numeric scores"],
        "output_modality":"critic_report",
        "questions":[
            "Does perceived cause match intended cause?",
            "Does event magnitude match narrative magnitude?",
            "Are reactions, atmosphere, camera/effects and persistent consequences coordinated?",
            "What counterexample makes the event feel staged or unclear?"
        ]
    },
    "motion_audience":{
        "requires":[["motion_video"]],
        "allowed_modalities":["motion_video","screenshot"],
        "suite_roles":["opening","controls"],
        "forbidden_context":["asset-source default animation rationale","prior numeric scores"],
        "output_modality":"critic_report",
        "questions":[
            "Describe idle, locomotion and reaction motion in audience-facing adjectives.",
            "Does any loop read uncanny, creepy, twitchy, lifeless or stylistically mismatched?",
            "Do transitions belong to one coherent motion language?"
        ]
    },
    "physicality":{
        "requires":[["interactive_trace"]],
        "allowed_modalities":["interactive_trace","runtime_trace","screenshot","motion_video"],
        "suite_roles":["controls"],
        "forbidden_context":["source-code collision intent"],
        "output_modality":"critic_report",
        "questions":[
            "Can the player penetrate visible solid props, doors or walls?",
            "Do opened/closed traversal states match visible geometry?",
            "Does camera motion expose clipping or impossible spatial behavior?"
        ]
    },
    "handoff_tutorial":{
        "requires":[["interactive_trace"]],
        "allowed_modalities":["interactive_trace","motion_video","screenshot","runtime_trace"],
        "suite_roles":["opening","tutorial","chapter"],
        "forbidden_context":["implementation state-machine details"],
        "output_modality":"critic_report",
        "questions":[
            "At each transition, is there one mode, one goal and one best next action?",
            "Does each tutorial step bind a visible target/control, action, success signal and feedback?",
            "Can a fresh player proceed without expert knowledge of the UI?",
            "Follow the actual attention path: are the goal, available action and visible response discoverable at the current object or character, or split across detached screen regions?",
            "Do inspection, offscreen recovery, touch and keyboard preserve the same clear interaction without tiny world text or hidden controls?"
        ]
    },
    "audio_atmosphere":{
        "requires":[["audio_capture"]],
        "allowed_modalities":["audio_capture","motion_video"],
        "suite_roles":["opening"],
        "forbidden_context":["audio source-code implementation"],
        "output_modality":"audio_listening",
        "questions":[
            "Listen to the actual captured experience.",
            "Do impact, ambience, music and silence match event magnitude and tone?",
            "Are repeated cues fatiguing or tonally wrong for the audience?",
            "Does muted play still preserve essential causality visually?"
        ]
    },
    "learning_transfer":{
        "requires":[["authoritative_replay"]],
        "allowed_modalities":["authoritative_replay","interactive_trace","runtime_trace"],
        "suite_roles":["chapter"],
        "forbidden_context":["expected answer labels beyond the task itself"],
        "output_modality":"critic_report",
        "questions":[
            "Does the mechanic faithfully represent the target concept?",
            "What must the player know before each encounter, where was it introduced and practiced, and what new reasoning does the next encounter require?",
            "Attempt success by waiting, repeated highlighted clicks and superficial clue patterns; distinguish progress from evidence of understanding.",
            "Does changed context require transfer rather than repetition?",
            "Does the target knowledge improve a meaningful player decision with a visible consequence, or is the task merely a quiz gate?",
            "Can learner prediction/hints accidentally control or inflate the authoritative result?"
        ]
    },
    "intent_comparison":{
        "requires":[["cold_observer_report"],["source_inspection"]],
        "allowed_modalities":["cold_observer_report","source_inspection","motion_video"],
        "suite_roles":["post-ci","foundation","opening"],
        "forbidden_context":["prior numeric scores"],
        "output_modality":"critic_report",
        "questions":[
            "Compare cold-observer interpretation against intended design.",
            "After the cold pass, compare the exact learning design step by step: progression, decisions, assistance, situated goal/action/feedback, recovery and transfer. Cite native before/after captures; source labels do not prove alignment.",
            "Identify intended meanings the rendered experience failed to communicate.",
            "Do not rewrite the cold report to fit intent."
        ]
    }
}

def load_index(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read review input: {exc}") from exc
    if value.get("schema") not in ("vibelearn.review-evidence-index.v1","vibelearn.review-workspace.v1"):
        raise ValueError("unsupported review input schema")
    return value

def suite_role(suite):
    if suite=="foundation":
        return "foundation"
    if suite=="post-ci":
        return "post-ci"
    if isinstance(suite,str) and "-" in suite:
        return suite.rsplit("-",1)[-1]
    return suite

def flatten_evidence(index):
    items=[]
    root_index=index.get("base_index") if index.get("schema")=="vibelearn.review-workspace.v1" else index
    for receipt in root_index.get("receipts") or []:
        receipt_base=Path(receipt["receipt_ref"]).parent
        suite=receipt["suite"]
        for item in receipt.get("evidence") or []:
            if not isinstance(item,dict):
                continue
            copy=dict(item)
            copy["ref"]=(receipt_base/str(item.get("ref",""))).as_posix()
            copy["suite"]=suite
            copy["suite_role"]=suite_role(suite)
            items.append(copy)
    for item in index.get("supplemental_evidence") or []:
        if isinstance(item,dict):
            copy=dict(item);copy["suite"]="post-ci";copy["suite_role"]="post-ci";items.append(copy)
    return items

def build_assignments(index,native_requirements=None,learning_design_sha256=None):
    if learning_design_sha256 is not None and (not isinstance(learning_design_sha256,str) or not re.fullmatch(r"[0-9a-f]{64}",learning_design_sha256)):
        raise ValueError("learning design digest must be SHA256")
    if native_requirements is None:
        native_requirements={}
    if not isinstance(native_requirements,dict) or set(native_requirements)-PASS_SPECS.keys():
        raise ValueError("native requirements must map known critic passes")
    candidate=index.get("candidate_sha")
    evidence=flatten_evidence(index)
    by_modality={}
    for item in evidence:
        by_modality.setdefault(item.get("modality"),[]).append(item)
    assignments={}
    for name,spec in PASS_SPECS.items():
        roles=set(spec.get("suite_roles") or [])
        eligible=[
            item for item in evidence
            if not roles or item.get("suite_role") in roles
        ]
        eligible_by_modality={}
        for item in eligible:
            eligible_by_modality.setdefault(item.get("modality"),[]).append(item)
        missing=[]
        for alternatives in spec["requires"]:
            if not any(eligible_by_modality.get(modality) for modality in alternatives):
                missing.append(alternatives)
        allowed=[]
        for modality in spec["allowed_modalities"]:
            allowed.extend(eligible_by_modality.get(modality,[]))
        assignment={
            "schema":"vibelearn.critic-assignment.v1",
            "candidate_sha":candidate,
            "pass":name,
            "status":"ready" if not missing else "blocked_missing_evidence",
            "required_evidence_groups":[list(group) for group in spec["requires"]],
            "missing_evidence":[list(group) for group in missing],
            "allowed_evidence":sorted(allowed,key=lambda item:(item.get("suite",""),item.get("ref",""))),
            "allowed_modalities":spec["allowed_modalities"],
            "suite_roles":spec.get("suite_roles") or [],
            "forbidden_context":spec["forbidden_context"],
            "questions":spec["questions"],
            "expected_output_modality":spec["output_modality"],
            "instruction":"Report observations before interpretation. If required evidence is missing or ambiguous, return unresolved rather than substituting weaker evidence."
        }
        if name == "art_world_direction":
            assignment["required_dimensions"] = ART_WORLD_CRITERIA.copy()
        if name in native_requirements:
            assignment["execution_requirements"]=validate_requirements(native_requirements[name])
        if name == "intent_comparison" and learning_design_sha256 is not None:
            assignment["learning_design_sha256"] = learning_design_sha256
        digest_payload={key:value for key,value in assignment.items() if key!="assignment_id"}
        assignment["assignment_id"]="sha256:"+hashlib.sha256(
            json.dumps(digest_payload,sort_keys=True,separators=(",",":")).encode("utf-8")
        ).hexdigest()
        assignments[name]=assignment
    return assignments

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index",type=Path,required=True)
    parser.add_argument("--output-dir",type=Path,required=True)
    parser.add_argument("--native-requirements",type=Path,
                        help="JSON mapping critic passes to required native GUI execution contracts")
    parser.add_argument("--learning-design-sha256",help="Bind the later intent comparison to the exact design; never supply it to cold observation")
    args=parser.parse_args()
    try:
        index=load_index(args.index)
        native=json.loads(args.native_requirements.read_text(encoding="utf-8")) if args.native_requirements else None
        assignments=build_assignments(index,native,args.learning_design_sha256)
    except (ValueError,OSError) as exc:
        print(json.dumps({"status":"invalid_critic_assignment","error":str(exc)}))
        return 2
    args.output_dir.mkdir(parents=True,exist_ok=True)
    for name,value in assignments.items():
        (args.output_dir/f"{name}.json").write_text(json.dumps(value,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({
        "status":"ok",
        "candidate_sha":index["candidate_sha"],
        "ready":[name for name,a in assignments.items() if a["status"]=="ready"],
        "blocked":[name for name,a in assignments.items() if a["status"]!="ready"],
    }))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
