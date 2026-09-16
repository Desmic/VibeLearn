# The First Words — Level 1 build and verification

## Active correction — 16 September 2026

Level 1 is not `/first-words` in isolation. It begins at `/`: loading, login/recovery,
transition into Bellweather, opening story, first action, wrong/safe recovery path,
reunion, changed-context tower challenge and ending are one ordered experience.

The active player path is now Bellweather -> `/first-words`. Relay Rescue and Word
Machine are historical prototypes only. They must not be default/player recovery
routes. `/word-machine` redirects to `/first-words`; the root must not load the retired
Relay Rescue scripts/world. Active hosted assets exclude the retired SVG/DOM gameplay
stack and Three.js runtime.

**No 2D gameplay fallback.** The active game uses PlayCanvas. During loading the player
sees loading state only; on required-engine/asset failure the game fails closed with a
clear retry. Never display the old illustrated/SVG world underneath or before 3D.

Follow `../CODEX.md` strictly in this order:

1. entry/login/loading consistency and direct Level 1 routing;
2. opening friendship -> capture -> voice loss -> reachable repair;
3. first action and rescue mechanic, including inspect-first and plausible mistake paths;
4. visible mistake/recovery -> Moon repair -> Zip reunion;
5. changed-context tower challenge with predictions before feedback;
6. world-first completion/ending, save/reload/replay/accessibility;
7. complete `/` -> ending playthrough, active CI, critic policy, then user review.

Do not implement Level 2 or later-series features before this full gate passes. Existing
later code is not evidence that an earlier gate is complete.

## Frozen Level 1 learning behavior

Use mission/content identity `ai-01-first-words` and pinned `first-words-1` rules.
Preserve old immutable snapshots/evidence. No model provider or general generator is
needed for this bounded level.

Opening: Bellweather home -> Warden captures a friend and steals speech engines -> Zip
saves the player and loses their voice -> reachable repair socket. The reduced-motion,
muted and replay paths communicate the same causal story.

First rescue: power Zip's speech engine. From `Open a gate.` the toy continuation favors
Sun. The player may generate immediately and see a plausible wrong hatch, or inspect
Zip's Moon plaque first and change what the engine receives. Each generated whole-word
piece joins the next input. The Moon context raises Moon and the correct command visibly
frees Zip. Both approaches remain valid learning paths; error is recoverable rather than
required.

Transfer: after reunion, the route to the tower changes. The player selects what context
enters the engine from an old Moon sign, unrelated parade notice, or the current clue.
The current clue must require mapping visible world information to the five-point Star
marker rather than literally saying the answer. Record destination and input-growth
predictions before generation/feedback. Preserve wrong first predictions through repair.

Assessment remains bounded: guided chapter completion plus separately reported first
predictions on the changed task. No independent mastery, retention or audience-learning
claim follows from completion.

## Verification gate

Use disposable storage. Run focused rules/storage checks after behavior changes, then the
active browser suites. Verify desktop and 360/390/430 portrait, save/reload, camera and
movement after save, reduced motion, sound controls, text enlargement, missing required
assets, opening replay without progress mutation and explicit no-2D-fallback behavior.

At the full gate run build, full application tests, `python manage.py browser`, then play
the complete experience from `/` through the world ending. Apply `CRITIC-POLICY.md` to
the exact candidate. Every required story/first-touch/chapter/learning criterion must be
>=9 with no blocker before internally marking `ready_for_user_review`. The user's review
remains final.
