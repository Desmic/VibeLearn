"""Build context-separated critic assignments from an exact-candidate review evidence index."""
import argparse
import json
from pathlib import Path

PASS_SPECS={
    "cold_observer":{
        "requires":[["caption_blind_motion","interactive_trace"]],
        "allowed_modalities":["caption_blind_motion","motion_video","audio_capture","screenshot","runtime_trace"],
        "forbidden_context":["story treatment","storyboard rationale","creator intent","semantic source identifiers","prior critic scores","user review diagnosis"],
        "output_modality":"cold_observer_report",
        "questions":[
            "What kind of place is this before the disruption?",
            "Who appears important and what relationships are visible?",
            "What ordinary activity makes the world feel inhabited?",
            "What major event happens and what appears to cause it?",
            "What changes persist afterward?",
            "At the first playable handoff, who do you control and what should you do next?",
            "List anything understood only because of explanatory text."
        ]
    },
    "cinematic_causality":{
        "requires":[["cold_observer_report"],["motion_video"]],
        "allowed_modalities":["cold_observer_report","motion_video","screenshot","audio_capture"],
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
        "allowed_modalities":["interactive_trace","runtime_trace","screenshot"],
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
        "forbidden_context":["implementation state-machine details"],
        "output_modality":"critic_report",
        "questions":[
            "At each transition, is there one mode, one goal and one best next action?",
            "Does each tutorial step bind a visible target/control, action, success signal and feedback?",
            "Can a fresh player proceed without expert knowledge of the UI?"
        ]
    },
    "audio_atmosphere":{
        "requires":[["audio_capture"]],
        "allowed_modalities":["audio_capture","motion_video"],
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
        "forbidden_context":["expected answer labels beyond the task itself"],
        "output_modality":"critic_report",
        "questions":[
            "Does the mechanic faithfully represent the target concept?",
            "Does changed context require transfer rather than repetition?",
            "Can learner prediction/hints accidentally control or inflate the authoritative result?"
        ]
    },
    "intent_comparison":{
        "requires":[["cold_observer_report"],["source_inspection"]],
        "allowed_modalities":["cold_observer_report","source_inspection","motion_video","screenshot"],
        "forbidden_context":["prior numeric scores"],
        "output_modality":"critic_report",
        "questions":[
            "Compare cold-observer interpretation against intended design.",
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

def flatten_evidence(index):
    items=[]
    base=index.get("base_index") if index.get("schema")=="vibelearn.review-workspace.v1" else index
    for receipt in base.get("receipts") or []:
        base=Path(receipt["receipt_ref"]).parent
        for item in receipt.get("evidence") or []:
            if not isinstance(item,dict):
                continue
            copy=dict(item)
            copy["ref"]=(base/str(item.get("ref",""))).as_posix()
            copy["suite"]=receipt["suite"]
            items.append(copy)
    for item in index.get("supplemental_evidence") or []:
        if isinstance(item,dict):
            copy=dict(item);copy["suite"]="post-ci";items.append(copy)
    return items

def build_assignments(index):
    candidate=index.get("candidate_sha")
    evidence=flatten_evidence(index)
    by_modality={}
    for item in evidence:
        by_modality.setdefault(item.get("modality"),[]).append(item)
    assignments={}
    for name,spec in PASS_SPECS.items():
        missing=[]
        for alternatives in spec["requires"]:
            if not any(by_modality.get(modality) for modality in alternatives):
                missing.append(alternatives)
        allowed=[]
        for modality in spec["allowed_modalities"]:
            allowed.extend(by_modality.get(modality,[]))
        assignments[name]={
            "schema":"vibelearn.critic-assignment.v1",
            "candidate_sha":candidate,
            "pass":name,
            "status":"ready" if not missing else "blocked_missing_evidence",
            "missing_evidence":[list(group) for group in missing],
            "allowed_evidence":sorted(allowed,key=lambda item:(item.get("suite",""),item.get("ref",""))),
            "allowed_modalities":spec["allowed_modalities"],
            "forbidden_context":spec["forbidden_context"],
            "questions":spec["questions"],
            "expected_output_modality":spec["output_modality"],
            "instruction":"Report observations before interpretation. If required evidence is missing or ambiguous, return unresolved rather than substituting weaker evidence."
        }
    return assignments

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index",type=Path,required=True)
    parser.add_argument("--output-dir",type=Path,required=True)
    args=parser.parse_args()
    try:
        index=load_index(args.index)
        assignments=build_assignments(index)
    except ValueError as exc:
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
