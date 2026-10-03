# Bellweather: The First Words

The VibeLearn proof game: a three.js web game that teaches how language models work. This
folder is **the game** (the official direction since 3 Oct 2026; older notes calling it a
"visual study" or saying PlayCanvas is the runtime are historical).

**New here? Read `../../docs/START-HERE.md` first.** It covers what to read, where things
are, how to build and check, how the game ships, and the mistakes not to repeat.

Quick commands (from this folder):

```text
npm ci
bash tools/build.sh          # build into out/
npm run check                # types, story scripts, asset budgets
node tools/flowcheck.mjs     # play start to end of Stop 2, headless
```

Checks, benchmark, timing and voices: `tools/CHECKS.md`. AI play-testers:
`tools/AI-PLAYTEST.md`. Models are built by Blender scripts in `authoring/`.
