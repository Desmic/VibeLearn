"""Small source/build identity for review; not a release or activation subsystem."""
import hashlib
from pathlib import Path
from app.content import digest
from app.storage import MIGRATIONS

ROOT = Path(__file__).resolve().parent.parent
VERSION = "0.1.0"


def manifest():
    paths = [*sorted((ROOT / "app").glob("*.py")), *sorted((ROOT / "web").rglob("*")), *sorted((ROOT / "db").glob("*.sql")), ROOT / "manage.py", ROOT / "requirements.lock"]
    hashes = {str(path.relative_to(ROOT)).replace("\\", "/"): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths if path.is_file()}
    return {"version": VERSION, "schema_version": len(MIGRATIONS), "source_digest": digest(hashes), "files": hashes, "components": ["journey", "incident-trace", "response-workspace", "assistance", "source-companion", "evidence-recap"], "activation": "local_preview_only", "user_acceptance": "pending"}
