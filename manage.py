"""Small, reproducible entry points; invoke from the project directory."""
import compileall
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BROWSER_GROUPS = {
    "foundation": ["tests.level1_entry_browser"],
    "first-words-opening": ["tests.first_words_opening_browser"],
    "first-words-controls": ["tests.level1_controls_browser"],
    "first-words-chapter": ["tests.level1_chapter_browser"],
    "first-words-readability": ["tests.first_words_readability_browser"],
    "first-words-lifecycle": ["tests.level1_lifecycle_browser"],
    # Keep the combined command as the final integrated Level 1 regression.
    "first-words": [
        "tests.first_words_opening_browser",
        "tests.level1_controls_browser",
        "tests.level1_chapter_browser",
        "tests.first_words_readability_browser",
        "tests.level1_lifecycle_browser",
    ],
    "legacy-foundation": ["tests.browser_check", "tests.expedition_browser_check",
                          "tests.game_review_browser", "tests.story3d_framework_browser",
                          "tests.playcanvas_framework_browser", "tests.playcanvas_story_interaction_browser"],
    "legacy-opening": ["tests.onboarding_browser", "tests.opening_contract_browser", "tests.player_controls_browser"],
    "legacy-journey": ["tests.rescue_browser"],
    "legacy-word-machine": ["tests.word_machine_browser"],
    "legacy-first-words-complex": ["tests.first_words_browser"],
}
ACTIVE_LEVEL1_GROUPS = ["first-words-opening", "first-words-controls", "first-words-chapter", "first-words-readability", "first-words-lifecycle"]


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "serve"
    if command == "vendor":
        # Current Level 1 is PlayCanvas-only. Do not download the retired Three.js
        # runtime into active builds; its historical source remains in Git only.
        for script in ("tools/vendor_playcanvas.py", "tools/vendor_game_assets.py"):
            result = subprocess.call([sys.executable, script], cwd=ROOT)
            if result:
                return result
        from tools.package_repair import build as package_repair
        package_repair()
        return 0
    if command == "vendor-legacy-three":
        return subprocess.call([sys.executable, "tools/vendor_three.py"], cwd=ROOT)
    if command == "build":
        from tools.package_repair import build as package_repair
        package_repair()
        if not compileall.compile_dir(ROOT / "app", quiet=1):
            return 1
        if not compileall.compile_dir(ROOT / "tests", quiet=1):
            return 1
        for script in sorted((ROOT / "web").glob("*.js")):
            subprocess.run(["node", "--input-type=module", "--check"], input=script.read_text(encoding="utf-8"), text=True, check=True)
        from app.manifest import manifest
        (ROOT / "artifacts").mkdir(exist_ok=True)
        (ROOT / "artifacts" / "build-manifest.json").write_text(json.dumps(manifest(), indent=2), encoding="utf-8")
        print("Build passed: application/test Python compiled; browser JavaScript parsed with ESM semantics.")
        return 0
    if command == "browser":
        parser = argparse.ArgumentParser(description="Run all active browser checks or one group")
        parser.add_argument("--group", choices=BROWSER_GROUPS)
        args, remaining = parser.parse_known_args(sys.argv[2:])
        modules=BROWSER_GROUPS[args.group] if args.group else BROWSER_GROUPS["foundation"]+BROWSER_GROUPS["first-words"]
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
        print("Usage: python manage.py [vendor|vendor-legacy-three|build|test|browser|serve --port 8000 --db path]")
        return 2
    return subprocess.call([sys.executable, *commands[command]], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())