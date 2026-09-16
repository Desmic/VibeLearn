# The First Words — Level 1 build and verification

## Active correction — 16 September 2026

Level 1 is not `/first-words` in isolation. It begins at `/`: loading, login/recovery,
transition into Bellweather, opening story, tutorial, first success, changed-context
challenge, ending, reset/logout and return/resume behavior are one ordered experience.

The active player path is Bellweather -> `/first-words`. Relay Rescue and Word Machine
are historical prototypes only. They must not be default/player recovery routes.
`/word-machine` redirects to `/first-words`; the root must not load the retired Relay
Rescue scripts/world. Active hosted assets exclude the retired SVG/DOM gameplay stack
and Three.js runtime.

**No 2D gameplay fallback.** The active game uses PlayCanvas. During loading the player
sees loading state only; on required-engine/asset failure the game fails closed with a
clear retry. Never display the old illustrated/SVG world underneath or before 3D.

## Easy to play; depth comes from learning, not friction

This Level 1 follows the existing first-chapter contract in
`GAME-OPENING-PROGRESSION.md` and `COURSE-GENERATION-GAME-SYSTEM.md`:

`hook -> obvious action -> visible response -> guided success -> variation -> recoverable challenge -> transfer`

The learner must not need to understand the LLM concept before they can operate the
game. Teach the controls and learning loop in context, one action at a time. The first
normal run has a golden path and a visible win before a wrong answer is expected.
Difficulty later comes from reasoning, competing context, reduced scaffolding and deeper
LLM internals—not denser HUDs, more buttons, extra navigation chores or stacked quizzes.

The current tutorial is deliberately simple:

1. **Power:** one highlighted action connects Zip's speech engine.
2. **Context:** one highlighted Moon plaque is scanned because it visibly describes
   where Zip is.
3. **Words:** one repeated `Next word` action makes the word-by-word loop visible; each
   word visibly joins the next input.
4. **Success:** the Moon gate opens and Zip returns to the player. No intentional failure
   is required before this payoff.
5. **Challenge:** only after that success does the tower route introduce competing
   context, one saved gate prediction, a normal wrong route and recovery.

The former required `Predict the next input` quiz is not part of new Level-1 runs. The
growing-input mechanic is demonstrated through play. Legacy `first-words-1` drafts that
already require that step remain resumable and immutable historical evidence remains
valid.

## Game lifecycle is part of Level 1

The in-game menu must always expose working **Reset game progress** and **Sign out**
controls in hosted play. Reset requires explicit confirmation, clears the current
learner's saved game/practice progress through the authoritative reset endpoint, keeps
device sound/accessibility preferences, and returns to the first-entry opening. Sign out
revokes the hosted session cookies/server session and returns to Bellweather account
entry. These behaviors are browser-gated; backend endpoints existing without usable game
controls does not count as implemented.

Opening replay remains non-destructive. Refresh/resume keeps a saved Level-1 attempt and
does not replay the opening automatically. A different authenticated learner remains
isolated.

## Ordered implementation gate

Follow `../CODEX.md` strictly in this order:

1. entry/login/recovery, reset/logout and direct Level-1 routing;
2. opening friendship -> capture -> voice loss -> reachable repair;
3. one-action-at-a-time tutorial -> guaranteed first rescue success;
4. changed-context tower challenge -> recoverable mistake -> current route;
5. world-first completion/ending, save/reload/replay/accessibility;
6. complete `/` -> ending playthrough, active CI, critic policy, then user review.

Do not implement Level 2 or later-series features before this full gate passes. Existing
later code is not evidence that an earlier gate is complete.

## Frozen Level 1 learning behavior

Use mission/content identity `ai-01-first-words` and pinned `first-words-1` rules.
Preserve old immutable snapshots/evidence. No model provider or general generator is
needed for this bounded level.

Opening: Bellweather home -> Warden captures a friend and steals speech engines -> Zip
saves the player and loses their voice -> reachable repair socket. The reduced-motion,
muted and replay paths communicate the same causal story.

Guided rescue: power Zip's speech engine, scan the obvious Moon plaque, then generate
`Open the Moon gate` word-by-word. The input display makes output accumulation visible.
The correct command visibly frees Zip. This is practice and onboarding, not assessment
or mastery.

Transfer: after reunion, the route to the tower changes. The player selects what context
enters the engine from an old Moon sign, unrelated parade notice, or the current clue.
The current clue requires mapping visible world information to the five-point Star mark
rather than literally saying the answer. Record the learner's first gate prediction
before generation/feedback. A stale first context can lead to a wrong route, then be
repaired without erasing the original prediction.

Assessment remains bounded: guided chapter completion plus the first changed-context gate
prediction. No independent mastery, retention or audience-learning claim follows from
completion.

## Verification gate

Use disposable storage. Run focused rules/storage checks after behavior changes, then the
active browser suites. Verify entry/lifecycle, opening, controls, full chapter and
readability independently, then run the combined Level-1 browser command before the
final critic pass.

Verify desktop and 360/390/430 portrait, save/reload, camera and movement after save,
reset/logout, reduced motion, sound controls, text enlargement, missing required assets,
opening replay without progress mutation and explicit no-2D-fallback behavior.

At the full gate run build, full application tests, `python manage.py browser`, then play
the complete experience from `/` through the world ending. Apply `CRITIC-POLICY.md` to
the exact candidate. Every required story/first-touch/chapter/learning criterion must be
>=9 with no blocker before internally marking `ready_for_user_review`. The user's review
remains final.
