"""Validate that human-review failures were generalized into reusable system regressions."""
import argparse
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LAYERS={"schema","runtime","world-spec","ux","evidence","reviewer"}
MODALITIES={
    "cold_observer_report","interactive_trace","motion_video","audio_listening",
    "screenshot","runtime_trace","authoritative_replay","ci_report","source_inspection",
}
GAME_SPECIFIC=re.compile(r"\b(bellweather|zip|warden|moon gate|star gate|first words)\b",re.I)

def validate(record,root=ROOT):
    def require(ok,message):
        if not ok: raise ValueError(message)
    require(record.get("schema")=="vibelearn.quality-failure-corpus.v1","Unsupported failure-corpus schema")
    incidents=record.get("incidents")
    require(isinstance(incidents,list) and incidents,"Failure corpus needs incidents")
    ids=set()
    for incident in incidents:
        require(isinstance(incident,dict),"Incident must be an object")
        incident_id=incident.get("id")
        require(isinstance(incident_id,str) and re.fullmatch(r"qf-[a-z0-9-]+",incident_id or ""),"Invalid incident id")
        require(incident_id not in ids,f"Duplicate incident id: {incident_id}")
        ids.add(incident_id)
        for key in ("symptom","generalized_failure","invariant"):
            value=incident.get(key)
            require(isinstance(value,str) and value.strip(),f"{incident_id}: missing {key}")
        generic_text=" ".join([incident["generalized_failure"],incident["invariant"]])
        require(not GAME_SPECIFIC.search(generic_text),f"{incident_id}: generalized rule contains proof-game-specific language")
        layers=incident.get("prevention_layers")
        require(isinstance(layers,list) and layers and set(layers)<=LAYERS,f"{incident_id}: invalid prevention layers")
        require(set(layers)!={"reviewer"},f"{incident_id}: prompt/reviewer-only prevention is insufficient")
        mechanisms=incident.get("mechanisms")
        require(isinstance(mechanisms,list) and mechanisms and all(isinstance(x,str) and x.strip() for x in mechanisms),f"{incident_id}: mechanisms required")
        modalities=incident.get("required_evidence")
        require(isinstance(modalities,list) and modalities and set(modalities)<=MODALITIES,f"{incident_id}: invalid evidence modalities")
        tests=incident.get("regression_tests")
        require(isinstance(tests,list) and tests,f"{incident_id}: regression tests required")
        for ref in tests:
            require(isinstance(ref,str) and ref.startswith("tests/"),f"{incident_id}: regression ref must be a tests/ path")
            path=(root/ref).resolve()
            require(path.is_relative_to(root.resolve()) and path.is_file(),f"{incident_id}: missing regression test {ref}")
    return {"status":"valid","incident_count":len(incidents),"ids":sorted(ids)}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record",type=Path)
    args=parser.parse_args()
    try:
        record=json.loads(args.record.read_text(encoding="utf-8"))
        result=validate(record)
    except (OSError,ValueError,TypeError,json.JSONDecodeError) as exc:
        print(json.dumps({"status":"invalid_failure_corpus","error":str(exc)}))
        return 2
    print(json.dumps(result,indent=2))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
