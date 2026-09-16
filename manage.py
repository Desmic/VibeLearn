"""Small, reproducible entry points; invoke from the project directory."""
import compileall
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BROWSER_GROUPS = {
    # Active product gate: entry/auth continuity first, then the complete Level 1.
    "foundation": ["tests.level1_entry_browser"],
    "first-words": ["tests.first_words_opening_browser", "tests.first_words_browser", "tests.first_words_readability_browser"],
    # Historical suites remain callable for archaeology/regression work but are not
    # allowed to displace Level 1 verification in the active CI sequence.
    "legacy-foundation": ["tests.browser_check", "tests.expedition_browser_check",
                          "tests.game_review_browser", "tests.story3d_framework_browser",
                          "tests.playcanvas_framework_browser", "tests.playcanvas_story_interaction_browser"],
    "legacy-opening": ["tests.onboarding_browser", "tests.opening_contract_browser", "tests.player_controls_browser"],
    "legacy-journey": ["tests.rescue_browser"],
    "legacy-word-machine": ["tests.word_machine_browser"],
}


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "serve"
    if command == "vendor":
        for script in (
            "tools/vendor_three.py",
            "tools/vendor_playcanvas.py",
            "tools/vendor_game_assets.py",
        ):
            result = subprocess.call([sys.executable, script], cwd=ROOT)
            if result:
                return result
        from tools.package_repair import build as package_repair
        package_repair()
        return 0
    if command == "build":
        from tools.package_repair import build as package_repair
        package_repair()
        if not compileall.compile_dir(ROOT / "app", quiet=1):
            return 1
        for script in sorted((ROOT / "web").glob("*.js")):
            subprocess.run([
                "node", "--input-type=module", "--check"
            ], input=script.read_text(encoding="utf-8"), text=True, check=True)
        from app.manifest import manifest
        (ROOT / "artifacts").mkdir(exist_ok=True)
        (ROOT / "artifacts" / "build-manifest.json").write_text(json.dumps(manifest(), indent=2), encoding="utf-8")
        print("Build passed: Python compiled; browser JavaScript parsed with ESM semantics.")
        return 0
    if command == "browser":
        parser = argparse.ArgumentParser(description="Run all active browser checks or one group")
        parser.add_argument("--group", choices=BROWSER_GROUPS)
        args, remaining = parser.parse_known_args(sys.argv[2:])
        if args.group:
            modules=BROWSER_GROUPS[args.group]
        else:
            # Default means the current product, not every historical prototype.
            modules=BROWSER_GROUPS["foundation"]+BROWSER_GROUPS["first-words"]
        for module in modules:
            print(f"Starting {module}", flush=True)
            result = subprocess.call([sys.executable, "-m", module, *remaining], cwd=ROOT)
            if result:
                return result
            print(f"Passed {module}", flush=True)
        return 0
    commands = {
        "serve": ["-m", "app.server", *sys.argv[2:]],
        "test": ["-m", "unittest", "discover", "-s", "tests", "-v"],
    }
    if command not in commands:
        print("Usage: python manage.py [vendor|build|test|browser|serve --port 8000 --db path]")
        return 2
    return subprocess.call([sys.executable, *commands[command]], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
