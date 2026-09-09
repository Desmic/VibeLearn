"""Small, reproducible entry points; invoke from the project directory."""
import compileall
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "serve"
    if command == "vendor":
        return subprocess.call([sys.executable, "tools/vendor_three.py"], cwd=ROOT)
    if command == "build":
        from tools.package_repair import build as package_repair
        package_repair()
        if not compileall.compile_dir(ROOT / "app", quiet=1):
            return 1
        for script in sorted((ROOT / "web").glob("*.js")):
            subprocess.run(["node", "--check", str(script)], check=True)
        from app.manifest import manifest
        (ROOT / "artifacts").mkdir(exist_ok=True)
        (ROOT / "artifacts" / "build-manifest.json").write_text(json.dumps(manifest(), indent=2), encoding="utf-8")
        print("Build passed: Python compiled; browser JavaScript syntax checked.")
        return 0
    if command == "browser":
        for module in ["tests.browser_check", "tests.expedition_browser_check", "tests.game_review_browser", "tests.onboarding_browser", "tests.rescue_browser"]:
            result = subprocess.call([sys.executable, "-m", module, *sys.argv[2:]], cwd=ROOT)
            if result:
                return result
        return 0
    commands = {
        "serve": ["-m", "app.server", *sys.argv[2:]],
        "test": ["-m", "unittest", "discover", "-s", "tests", "-v"],
    }
    if command not in commands:
        print("Usage: python manage.py [build|test|browser|serve --port 8000 --db path]")
        return 2
    return subprocess.call([sys.executable, *commands[command]], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
