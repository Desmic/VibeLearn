"""Learner-scoped transactional commands. Browser identity is resolved separately."""
import json
import secrets
import hashlib
from datetime import datetime, timezone
from uuid import uuid4

from app.content import MODES, freeze, digest, presented, campaign_catalog
from app.storage import transaction, family_evidence
from app.assessment import evaluate, parse_prediction, review_need
from app.expedition import validate_game, empty_game, replay
from app import storm

EMPTY_RESPONSE = {"prediction": "", "diagnosis": "", "aid_declaration": "unknown"}


class DomainError(Exception):
    def __init__(self, code, message, status=400):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status


def now():
    return datetime.now(timezone.utc).isoformat()


def encode(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(path):
    token, learner = secrets.token_urlsafe(32), str(uuid4())
    profile = {"experience": "6+ years of engineering; roughly 2 years of independent work and agent development", "basis": "self-report, not measured mastery"}
    with transaction(path) as db:
        db.execute("INSERT INTO learners (id, profile, created_at) VALUES (?, ?, ?)", (learner, encode(profile), now()))
        db.execute("INSERT INTO sessions (token_hash, learner_id) VALUES (?, ?)", (token_hash(token), learner))
    return token, learner


def resolve_session(path, token):
    with transaction(path) as db:
        row = db.execute("SELECT learner_id FROM sessions WHERE token_hash=?", (token_hash(token),)).fetchone()
        return row[0] if row else None


def check_response(value, snapshot=None):
    if not isinstance(value, dict) or set(value) not in (set(EMPTY_RESPONSE), set(EMPTY_RESPONSE) | {"game"}):
        raise DomainError("INVALID_RESPONSE", "The response has an invalid structure.")
    if any(not isinstance(value[k], str) for k in EMPTY_RESPONSE):
        raise DomainError("INVALID_RESPONSE", "Answer fields must be text.")
    if len(value["prediction"]) > 100 or len(value["diagnosis"]) > 12000:
        raise DomainError("INVALID_RESPONSE", "Please keep the diagnosis under 12,000 characters.")
    if value["aid_declaration"] not in ("unknown", "none", "external"):
        raise DomainError("INVALID_RESPONSE", "Choose a valid aid declaration.")
    if "game" in value:
        try:
            if snapshot and "storm" in snapshot:
                storm.validate(value["game"], snapshot["storm"]["level"])
            else:
                validate_game(value["game"])
        except ValueError as error:
            raise DomainError("INVALID_RESPONSE", str(error))
    return value


def assistance_view(db, learner, attempt_id):
    return [dict(event) | {"detail": json.loads(event["detail"]), "affects_independence": bool(event["affects_independence"])} for event in db.execute("SELECT * FROM assistance WHERE learner_id=? AND attempt_id=? ORDER BY rowid", (learner, attempt_id))]


def add_assistance(db, learner, attempt_id, kind, detail, stamp, affects=True):
    detail = detail | {"content_digest": digest(detail)}
    db.execute("INSERT INTO assistance (id, learner_id, attempt_id, kind, detail, affects_independence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", (str(uuid4()), learner, attempt_id, kind, encode(detail), int(affects), stamp))


def seal(db, row, response, kind, stamp):
    checkpoint_id = str(uuid4())
    history = assistance_view(db, row["learner_id"], row["id"])
    db.execute("INSERT INTO checkpoints (id, learner_id, attempt_id, kind, response, mode, assistance, snapshot_digest, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (checkpoint_id, row["learner_id"], row["id"], kind, encode(response), row["mode"], encode(history), row["snapshot_digest"], stamp))
    return checkpoint_id, history


def campaign_progress(db, learner, expedition=False):
    catalog = campaign_catalog(expedition)
    cleared = set()
    for row in db.execute("SELECT capsule, result FROM evidence WHERE learner_id=? ORDER BY created_at", (learner,)):
        result = json.loads(row["result"])
        if result.get("outcome") != "correct":
            continue
        capsule = json.loads(row["capsule"])
        family_id = capsule.get("snapshot", {}).get("family_id")
        if family_id:
            cleared.add(family_id)
    result = []
    for index, mission in enumerate(catalog):
        is_cleared = mission["family_id"] in cleared
        is_unlocked = index == 0 or catalog[index - 1]["family_id"] in cleared or is_cleared
        status = "cleared" if is_cleared else "unlocked" if is_unlocked else "locked"
        result.append({key: value for key, value in mission.items() if key != "family_id"} | {"status": status})
    return result


def attempt_view(db, row):
    if row is None:
        return None
    snapshot = json.loads(row["snapshot"])
    result = {"id": row["id"], "revision": row["revision"], "status": row["status"], "mode": row["mode"], "response": json.loads(row["response"]), "snapshot": presented(snapshot), "snapshot_digest": row["snapshot_digest"], "updated_at": row["updated_at"]}
    if "storm" in snapshot:
        result["game_state"] = storm.replay(snapshot, result["response"].get("game"), submitted=row["status"] == "submitted")
    if "expedition" in snapshot:
        result["game_state"] = replay(snapshot, result["response"].get("game"))
    history = assistance_view(db, row["learner_id"], row["id"])
    result["assistance"] = history
    result["hints"] = [event["detail"]["text"] for event in history if event["kind"] == "hint"]
    result["worked_example"] = next((event["detail"]["text"] for event in history if event["kind"] == "worked_example"), None)
    result["source"] = snapshot["source"] if any(event["kind"] == "source" for event in history) else None
    source_enabled = snapshot.get("mission", {}).get("source_enabled", True)
    result["source_allowed"] = source_enabled and (row["status"] == "submitted" or snapshot["mode_contracts"][row["mode"]]["sources_before_submit"])
    evidence = db.execute("SELECT * FROM evidence WHERE learner_id=? AND attempt_id=?", (row["learner_id"], row["id"])).fetchone()
    result["assessment"] = json.loads(evidence["result"]) if evidence else {"outcome": "not_observed", "score": None, "mastery": "unknown"}
    result["evidence"] = {"id": evidence["id"], "checkpoint_id": evidence["checkpoint_id"], "capsule": json.loads(evidence["capsule"]), "created_at": evidence["created_at"]} if evidence else None
    result["checkpoints"] = []
    for cp in db.execute("SELECT * FROM checkpoints WHERE learner_id=? AND attempt_id=? ORDER BY rowid", (row["learner_id"], row["id"])):
        checkpoint = {key: cp[key] for key in cp.keys() if key != "rowid"} | {"response": json.loads(cp["response"]), "assistance": [event if isinstance(event, dict) else {"kind": "legacy_assistance", "detail": {"text": event}, "affects_independence": True} for event in json.loads(cp["assistance"])]}
        if row["status"] == "submitted":
            checkpoint["assessment"] = evaluate(snapshot, checkpoint["response"], [event for event in checkpoint["assistance"] if event["affects_independence"]])
        result["checkpoints"].append(checkpoint)
    review = db.execute("SELECT intent FROM reviews WHERE learner_id=? AND frame_id=? AND frame_revision=?", (row["learner_id"], snapshot["frame"]["id"], snapshot["frame"]["revision"])).fetchone()
    result["review"] = json.loads(review[0]) if review else None
    result["practice_xp"] = db.execute("SELECT COALESCE(SUM(xp),0) FROM rewards WHERE learner_id=?", (row["learner_id"],)).fetchone()[0]
    result["reward"] = db.execute("SELECT xp FROM rewards WHERE learner_id=? AND attempt_id=?", (row["learner_id"], row["id"])).fetchone()
    result["reward"] = result["reward"][0] if result["reward"] else 0
    return result


def state(path, learner):
    with transaction(path, learner=learner) as db:
        profile = db.execute("SELECT profile FROM learners WHERE id=?", (learner,)).fetchone()
        if not profile:
            raise DomainError("UNAUTHENTICATED", "Open a local learning session.", 401)
        row = db.execute("SELECT * FROM attempts WHERE learner_id=? ORDER BY rowid DESC LIMIT 1", (learner,)).fetchone()
        return {
            "learner_id": learner,
            "profile": json.loads(profile[0]),
            "attempt": attempt_view(db, row),
            "course": {"title": "Reliable agent execution", "episode_count": 4, "campaign": campaign_progress(db, learner), "expedition": campaign_progress(db, learner, True), "storm": campaign_progress(db, learner, "storm")},
            "modes": MODES,
        }


def command(path, learner, action, body):
    if not isinstance(body, dict):
        raise DomainError("INVALID_COMMAND", "Command must be a JSON object.")
    required = {"command_id", "expected_revision"}
    if action == "start":
        allowed = (required | {"mode"}, required | {"mode", "mission_id"})
        if set(body) not in allowed:
            raise DomainError("INVALID_COMMAND", "Command fields or revision are invalid.")
    elif action in ("save", "submit", "hint", "source", "mode"):
        required |= {"attempt_id", "response"}
        if action == "mode":
            required |= {"mode"}
        if set(body) != required:
            raise DomainError("INVALID_COMMAND", "Command fields or revision are invalid.")
    else:
        raise DomainError("NOT_FOUND", "Unknown command.", 404)
    if not isinstance(body.get("command_id"), str) or not 8 <= len(body["command_id"]) <= 100 or type(body.get("expected_revision")) is not int:
        raise DomainError("INVALID_COMMAND", "Command fields or revision are invalid.")
    if "mode" in body and (not isinstance(body["mode"], str) or body["mode"] not in MODES):
        raise DomainError("INVALID_COMMAND", "Choose LEARN, PAIR or BUILD.")
    if "mission_id" in body and not isinstance(body["mission_id"], str):
        raise DomainError("INVALID_COMMAND", "Mission ID must be text.")
    if "attempt_id" in body and not isinstance(body["attempt_id"], str):
        raise DomainError("INVALID_COMMAND", "Attempt ID must be text.")
    request_digest = digest({"action": action, "body": body})
    with transaction(path, learner=learner, lock=True) as db:
        if not db.execute("SELECT 1 FROM learners WHERE id=?", (learner,)).fetchone():
            raise DomainError("UNAUTHENTICATED", "Session is missing.", 401)
        receipt = db.execute("SELECT * FROM commands WHERE learner_id=? AND command_id=?", (learner, body["command_id"])).fetchone()
        if receipt:
            if receipt["request_digest"] != request_digest:
                raise DomainError("IDEMPOTENCY_CONFLICT", "This command ID was already used for a different request.", 409)
            return json.loads(receipt["result"])
        stamp = now()
        if action == "start":
            if body["expected_revision"] != 0:
                raise DomainError("INVALID_COMMAND", "New attempts start at revision zero.")
            existing = db.execute("SELECT id FROM attempts WHERE learner_id=? AND status='draft'", (learner,)).fetchone()
            if existing:
                raise DomainError("ACTIVE_ATTEMPT", "Resume your existing attempt first.", 409)
            mission_id = body.get("mission_id")
            if mission_id:
                progress = {item["id"]: item for item in campaign_progress(db, learner) + campaign_progress(db, learner, True) + campaign_progress(db, learner, "storm")}
                if mission_id not in progress:
                    raise DomainError("NOT_FOUND", "Unknown mission.", 404)
                if progress[mission_id]["status"] == "locked":
                    raise DomainError("MISSION_LOCKED", "Clear the previous mission to unlock this one.", 403)
            try:
                snapshot = freeze(body["mode"], mission_id)
            except ValueError as error:
                raise DomainError("MISSION_RULE", str(error), 400)
            initial_response = EMPTY_RESPONSE | ({"game": empty_game()} if "expedition" in snapshot or "storm" in snapshot else {})
            attempt_id = str(uuid4())
            db.execute("INSERT INTO attempts (id, learner_id, revision, status, mode, response, snapshot, snapshot_digest, created_at, updated_at) VALUES (?, ?, 1, 'draft', ?, ?, ?, ?, ?, ?)", (attempt_id, learner, body["mode"], encode(initial_response), encode(snapshot), digest(snapshot), stamp, stamp))
            prior = family_evidence(db, learner, snapshot["family_id"])
            if prior:
                add_assistance(db, learner, attempt_id, "prior_family_exposure", {"evidence_id": prior[0], "text": "You have already seen feedback for this trace family."}, stamp)
            if body["mode"] == "BUILD":
                row = db.execute("SELECT * FROM attempts WHERE id=?", (attempt_id,)).fetchone()
                seal(db, row, EMPTY_RESPONSE, "before_worked_example", stamp)
                add_assistance(db, learner, attempt_id, "worked_example", {"text": snapshot["hints"][-1]}, stamp)
        else:
            attempt_id = body["attempt_id"]
            row = db.execute("SELECT * FROM attempts WHERE id=? AND learner_id=?", (attempt_id, learner)).fetchone()
            if not row:
                raise DomainError("NOT_FOUND", "Attempt not found in this learner session.", 404)
            if row["revision"] != body["expected_revision"]:
                raise DomainError("STALE_REVISION", "This attempt changed in another tab. Your local answer is retained; reload before reconciling.", 409)
            if row["status"] != "draft" and action != "source":
                raise DomainError("ALREADY_SUBMITTED", "A submitted answer is immutable.", 409)
            snapshot = json.loads(row["snapshot"])
            response = check_response(body["response"], snapshot)
            if "expedition" in snapshot or "storm" in snapshot:
                old_moves = json.loads(row["response"]).get("game", empty_game())["moves"]
                game = response.get("game", empty_game())
                new_moves = game["moves"]
                if new_moves[:len(old_moves)] != old_moves or not len(old_moves) <= len(new_moves) <= len(old_moves) + 1:
                    raise DomainError("INVALID_RESPONSE", "Saved expedition history cannot be rewritten. Use Rewind for a fresh rehearsal.")
                try:
                    if "storm" in snapshot:
                        storm.replay(snapshot, game)
                    else:
                        replay(snapshot, game)
                except (ValueError, KeyError, TypeError) as error:
                    raise DomainError("INVALID_RESPONSE", str(error) if isinstance(error, ValueError) else "The expedition move could not be read.")
                if new_moves and not any(event["kind"] == "simulation_feedback" for event in assistance_view(db, learner, attempt_id)):
                    seal(db, row, json.loads(row["response"]), "before_simulation_feedback", stamp)
                    add_assistance(db, learner, attempt_id, "simulation_feedback", {"text": "The interactive simulation revealed consequences before submission. This is guided practice, not a fresh prediction."}, stamp)
            elif "game" in response:
                raise DomainError("INVALID_RESPONSE", "This pinned activity does not accept expedition data.")
            history = assistance_view(db, learner, attempt_id)
            mission = snapshot.get("mission", {})
            if action == "source":
                if not mission.get("source_enabled", True):
                    raise DomainError("AID_RESTRICTED", "Intel sources unlock in a later mission.", 403)
                if row["status"] != "submitted" and not snapshot["mode_contracts"][row["mode"]]["sources_before_submit"]:
                    raise DomainError("AID_RESTRICTED", "In LEARN, the source unlocks after submission. Switch to PAIR to use it now; that exposure will be recorded.", 403)
                if not any(event["kind"] == "source" for event in history):
                    if row["status"] == "draft":
                        seal(db, row, response, "before_source", stamp)
                    add_assistance(db, learner, attempt_id, "source", {"text": snapshot["source"]["summary"], "url": snapshot["source"]["url"], "scope": "trace_counts and diagnosis", "access": "source panel revealed; external page reading cannot be observed"}, stamp)
            if action == "hint":
                level = sum(event["kind"] == "hint" for event in history)
                if level >= len(snapshot["hints"]):
                    raise DomainError("NO_MORE_HINTS", "All prepared hints are already revealed.", 409)
                seal(db, row, response, "before_hint", stamp)
                add_assistance(db, learner, attempt_id, "hint", {"level": level + 1, "text": snapshot["hints"][level], "scope": "trace_counts and diagnosis"}, stamp)
            if action == "mode":
                available = mission.get("available_modes", list(MODES))
                if body["mode"] not in available:
                    raise DomainError("MISSION_RULE", "That play style unlocks in a later mission.", 403)
                seal(db, row, response, "before_mode_change", stamp)
                add_assistance(db, learner, attempt_id, "mode_boundary", {"from": row["mode"], "to": body["mode"]}, stamp, affects=False)
                if body["mode"] == "BUILD" and not any(event["kind"] == "worked_example" for event in history):
                    add_assistance(db, learner, attempt_id, "worked_example", {"text": snapshot["hints"][-1]}, stamp)
                db.execute("UPDATE attempts SET mode=? WHERE id=? AND learner_id=?", (body["mode"], attempt_id, learner))
            if action == "submit":
                count = len(snapshot["trace"])
                diagnosis_required = mission.get("requires_diagnosis", True)
                if ("expedition" not in snapshot and "storm" not in snapshot and (parse_prediction(response["prediction"], count) is None or (diagnosis_required and not response["diagnosis"].strip()))) or ("expedition" in snapshot and not response.get("game", {}).get("moves")) or ("storm" in snapshot and not (response.get("game", {}).get("policy") if snapshot["storm"]["level"] >= 7 else response.get("game", {}).get("moves"))):
                    unit = "number" if count == 1 else "comma-separated numbers"
                    suffix = " and a written diagnosis" if diagnosis_required else ""
                    raise DomainError("INVALID_ANSWER", f"Choose {count} valid {unit}{suffix} before locking in your answer.")
                try:
                    assessment = evaluate(snapshot, response, [event for event in history if event["affects_independence"]])
                except (ValueError, KeyError, TypeError):
                    raise DomainError("EVALUATOR_UNAVAILABLE", "The pinned assessment cannot run. Your draft is preserved; no failed score was recorded.", 503)
                checkpoint_id, history = seal(db, row, response, "submission", stamp)
                evidence_id = str(uuid4())
                capsule = {"snapshot": snapshot, "snapshot_digest": row["snapshot_digest"], "response": response, "assistance": history, "mode_at_submission": row["mode"]}
                db.execute("INSERT INTO evidence (id, learner_id, attempt_id, checkpoint_id, frame_id, frame_revision, capsule, result, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (evidence_id, learner, attempt_id, checkpoint_id, snapshot["frame"]["id"], snapshot["frame"]["revision"], encode(capsule), encode(assessment), stamp))
                intent = review_need(snapshot, assessment, stamp)
                previous = db.execute("SELECT intent FROM reviews WHERE learner_id=? AND frame_id=? AND frame_revision=?", (learner, snapshot["frame"]["id"], snapshot["frame"]["revision"])).fetchone()
                if previous:
                    intent["due_at"] = min(intent["due_at"], json.loads(previous[0])["due_at"])
                db.execute("INSERT INTO reviews (learner_id, frame_id, frame_revision, evidence_id, intent) VALUES (?, ?, ?, ?, ?) ON CONFLICT(learner_id, frame_id, frame_revision) DO UPDATE SET evidence_id=excluded.evidence_id, intent=excluded.intent", (learner, snapshot["frame"]["id"], snapshot["frame"]["revision"], evidence_id, encode(intent)))
                reward_xp = mission.get("reward_xp", 10)
                db.execute("INSERT INTO rewards (learner_id, family_id, attempt_id, xp, policy, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(learner_id, family_id) DO NOTHING", (learner, snapshot["family_id"], attempt_id, reward_xp, snapshot["policies"]["reward"], stamp))
                db.execute("UPDATE attempts SET status='submitted', response=?, revision=revision+1, updated_at=? WHERE id=? AND learner_id=?", (encode(response), stamp, attempt_id, learner))
            if row["status"] == "submitted":
                db.execute("UPDATE attempts SET revision=revision+1, updated_at=? WHERE id=? AND learner_id=?", (stamp, attempt_id, learner))
            elif action != "submit":
                db.execute("UPDATE attempts SET response=?, revision=revision+1, updated_at=? WHERE id=? AND learner_id=?", (encode(response), stamp, attempt_id, learner))
        result = attempt_view(db, db.execute("SELECT * FROM attempts WHERE id=? AND learner_id=?", (attempt_id, learner)).fetchone())
        db.execute("INSERT INTO commands (learner_id, command_id, request_digest, result) VALUES (?, ?, ?, ?)", (learner, body["command_id"], request_digest, encode(result)))
        return result
