# VibeLearn game UX critic gate

Purpose: prevent a polished website—or a confusing game skin—from being mistaken for a good learning game.

This review is a deliberately separate pass from implementation. The critic evaluates the shipped candidate against fixed criteria and records evidence before assigning a score. Do not change the rubric to rescue a weak build.

This gate also applies to **course-generation candidates**. A generated course cannot be labeled playable/validated merely because its content schema, source grounding, or assessment checks pass. Its actual game experience must independently clear this rubric.

## Current acceptance status — 8 September 2026

**Not accepted: user 6.5/10; later agent review 7.5/10.** Historical 8.8 and 9.1
scores retained below do not approve the current product. The user found the
experience insufficiently game-like and wants interest accessible even to a kid.

The current review pair is the user as product critic and Codex as agent critic.
Refine privately before presenting to other testers. Record their scores
separately. Internal acceptance requires >=8/10 from both and no critical blocker.
The user determines readiness for external testing. The existing numeric weights
remain unchanged; do not inflate scores for the proposed design.

The later agent evaluation used a critic-directed computer-use journey operated
by the parent agent on a disposable local instance because the critic could not
access the shared authenticated browser. It was not a separate authenticated
live-site playthrough. Deployed source reviewed:
`4f65fc8e20d847a2db294854f9baf5528cd1fbe2`.

Observed gaps:
- Reading cards, traces and answer selection dominate; too little experimentation.
- Correct boss counts with "Just retry forever." still produce mission clear.
  Prose is explicitly ungraded, but the experience fails to correct that misconception.
- Completion returns to the same campaign without a satisfying ending or fresh quest.
- Persistence, progression and evidence safeguards are strengths, not proof of fun.

## Pass rule

- Overall weighted score must be **>= 8.0 / 10**.
- No critical blocker may remain in the core loop, narrative/intuitive comprehension, progression/unlock logic, accessibility, persistence, assistance semantics or evidence integrity.
- An agent score >=8 permits another private user review; it does not establish user acceptance or readiness for external testing.
- For generated courses, this score is only the **game-UX/comprehension gate**. Separate grounding/content, structural/learning and accessibility validators in `docs/COURSE-GENERATION-GAME-SYSTEM.md` must also pass.

## Narrative / comprehension pre-gate

Effective for story-first candidates after the 8 September learner feedback. This is pass/fail and does not alter the numeric weights below.

Before numeric scoring, verify that:

- a non-specialist can identify the immediate goal without first decoding technical jargon;
- the scenario makes clear who/what wants something, what went wrong or changed, and what decision the player must make;
- story/visual beats map directly to the mechanism being assessed rather than serving as unrelated decoration;
- simple animation/sequence clarifies cause and effect and the same meaning survives reduced motion;
- the experience bridges the intuitive model to the formal terminology instead of replacing rigor with a metaphor;
- after a successful clear, the intended newly unlocked/recommended mission is the default focus; after failure, retry focus is predictable;
- `unknown`, current `assisted`, and `previously_exposed` are not mislabeled as one another.

Failure of any of these when applicable is a critical blocker regardless of the weighted score.

## Rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Game identity vs website residue | 15% | The primary screen reads immediately as a game/campaign, not a SaaS/dashboard/form with game labels. |
| HUD & information-at-a-glance | 15% | Level, **plain immediate objective**, progress, XP and useful tools are visible/glanceable; secondary detail is one action away. |
| Core loop clarity & immediacy | 15% | A non-specialist can understand the situation and goal, act directly, and receives clear response to every meaningful action. |
| Progression & difficulty curve | 15% | Early easy win, sequential mechanic teaching, visible unlock path, predictable next-node focus, rising challenge, and a boss that recombines learned mechanics. |
| Feedback / game feel / juice | 12% | Story/causal reveal, selection, saving, clear, reward and unlocks feel responsive; animation communicates cause/effect. |
| Theme & visual cohesion | 10% | Narrative, typography, icons, surfaces, motion and vocabulary belong to one coherent game world and interaction language. |
| Learning integrity | 10% | Game rewards do not distort evidence/mastery; unknown/help/prior exposure, checkpoints and review meaning remain honest and inspectable. |
| Accessibility & responsiveness | 8% | Keyboard/touch, narrow screens, readable text, contrast and reduced motion remain first-class; story meaning does not depend on motion/color alone. |

## Critical blockers

Any one of these blocks a pass regardless of numeric score:

- locked missions can be started by client forgery;
- player can lose saved work through normal navigation/reload;
- XP/reward changes evidence or mastery semantics;
- a required action is inaccessible on keyboard or narrow mobile;
- raw implementation/network errors are shown as learner-facing copy;
- early onboarding presents several new mechanics simultaneously without a clear goal;
- important state exists only in long body text when it should be in HUD/feedback;
- the current mission is substantially harder than the mechanics the player has been taught;
- the player must understand specialist jargon before they can understand the basic scenario/goal, where a faithful intuitive presentation is feasible;
- a narrative is present but its causal story does not correspond to the assessed mechanic;
- story animation is the only way to recover essential meaning;
- clearing a sequential mission unexpectedly reselects the first/previous mission instead of the declared next route;
- `not declared` is displayed/recorded as assisted without observed or declared help;
- prior family exposure is displayed/recorded as current-attempt assistance.

For generated courses, also treat these as game-UX blockers even when other validators catch them too:

- the boss/combine mission requires an unexplained interaction mechanic or untaught learning rule;
- the generated interface exposes most advanced tools in the tutorial without a clear need;
- the generated “game” is primarily a sequence of ordinary forms/cards with game vocabulary pasted on top when a more direct interaction is feasible;
- progression is driven by participation rewards rather than the declared mission success condition;
- generated story/world details add reading burden without improving comprehension, motivation or the mechanic.

## Review evidence to collect

Before scoring, inspect at least:

1. signed-out/login state;
2. campaign map at a fresh account, including plain chapter goal;
3. Level 1 story/setup and first decision;
4. causal story/visual reveal and reduced-motion equivalent;
5. selection feedback;
6. save -> reload -> resume;
7. no-help/not-declared evidence label;
8. hint/source-assisted evidence label;
9. prior-exposure evidence label on a replay when applicable;
10. Level 1 clear + XP and next-level automatic focus;
11. locked later-mission behavior before prerequisites;
12. mobile/narrow viewport and text enlargement;
13. boss/combine mission after prerequisites;
14. evidence/review details after clear.

For a generated course, additionally inspect whether the generated interaction and narrative actually express the target learning operation and whether subject vocabulary/interface complexity rise deliberately with the campaign.

## Generated-course critic execution

The generator and critic are separate roles. Prefer a distinct critic agent/model configuration when the harness supports it. Otherwise run a separately prompted pass with this frozen rubric and record that limitation explicitly.

The critic receives the candidate manifest plus real rendered/browser evidence where available. It must not rely only on the generator's prose description of the experience.

A failing score returns structured findings to the generation/authoring loop. The generator may revise and resubmit, but the rubric/threshold cannot be weakened between attempts. The initial automatic repair budget is three candidate revisions; after that the course remains `draft_needs_review` rather than looping indefinitely.

## Recorded critic review — HUD campaign candidate, 8 September 2026

### Candidate

Commit: `3bbdfe18d2a8f38ad531ecbe585d993ba6ef4eb9`
Reviewer pass date: `2026-09-08`
Verification inputs: GitHub Actions `Verify hosted pilot` run 102 (`34215243233`), 57 Python/hosted/PostgreSQL tests, full real Chromium 138 browser campaign journey, real temporary database, actual process restart, dropped-acknowledgement fault injection, 390px viewport, 200% text enlargement and reduced-motion context. The browser run reported no page errors.

The review is a separate critic pass using the rubric that existed for this candidate; it is not represented as an independent external model or human review. The later narrative/comprehension pre-gate above was added because subsequent learner testing found the course objective/material insufficiently clear even though this visual/game-shell candidate passed 8.8. Therefore **the 8.8 historical pass must not be reused to approve the later story-first candidate.**

| Area | Score | Evidence / criticism |
|---|---:|---|
| Game identity | 8.5/10 | The old sidebar/topbar and permanent right rail are removed from play. A persistent game HUD, bottom tool dock, campaign path, locked nodes and direct outcome decisions now dominate the experience. Some central task/debrief geometry still inherits card/table structure, so it is not yet a fully bespoke game scene. |
| HUD | 8.4/10 | Level/boss state, mission objective, chapter progress, XP and sync state are glanceable on desktop; Hint, Intel, Play style and Save are persistent HUD tools with one-action drawers. On smaller layouts one secondary sync statistic is hidden to preserve space, although Save remains available in the dock. |
| Core loop | 8.8/10 | Campaign map -> launch -> direct 1/2-charge decision -> optional HUD tools -> lock answer -> debrief/reward -> continue is clear and test-covered at a structural level. Later learner testing showed that the *learning scenario itself* was not yet clear enough, motivating the new pre-gate. |
| Progression | 9.4/10 | Tutorial -> Easy -> Medium -> Boss is a real server-enforced curve. Levels 1-2 teach one mechanic with one decision; Level 3 introduces two decisions, explanation and optional assisted tools; the boss recombines three traces plus full contract reasoning. Incorrect submissions may earn bounded practice XP but cannot unlock the next mission. Later learner testing found the map's selected-node behavior after a clear unexpected; this is now an explicit blocker for new candidates. |
| Feedback / juice | 8.4/10 | Selection locks with tactile feedback; trace events reveal in causal order; sync flashes; newly available/cleared nodes animate; results enter as a dedicated screen and rewards pop. Motion is meaningful rather than ambient. There is still room for richer story-specific feedback. |
| Theme | 8.5/10 | Dark tactical systems-game shell, lime/cyan/violet state language, consistent HUD/dock vocabulary and campaign terminology feel coherent. Residual dense tables/details appropriately remain for technical content but still carry some web/document ancestry. |
| Learning integrity | 9.7/10 | Historical Phase 1 snapshots remain immutable; campaign activities/families use new IDs; mission unlocks depend on correct pinned evidence rather than XP; XP does not affect mastery. Subsequent testing revealed that prior exposure was being collapsed into “assisted”; the underlying evidence event was retained correctly but the interpretation label is now being corrected and newly gated. |
| Accessibility | 8.8/10 | Browser gate covers keyboard flow, 390px layout, 200% text enlargement, separate learner context and reduced motion. No horizontal overflow or page errors were observed. Mobile HUD is intentionally denser and deserves continued real-device refinement. |

Weighted total at that time: **8.8 / 10** (`8.7975` before rounding)

Historical critical blockers under the then-current rubric: **none observed.**

Historical verdict: **PASS >=8** for the HUD-shell candidate. **Not a pass for the later narrative/comprehension requirements.**

## Recorded critic review — story-first Shopping Agent candidate, 8 September 2026

### Candidate

Implementation/browser-gate commit: `79ef8e93adc108856cdd49fcc924a600b721e516`
Reviewer pass date: `2026-09-08`
Verification inputs: GitHub Actions `Verify hosted pilot` run 148 (`34222243777`), 59 Python/hosted/PostgreSQL tests, full Chromium browser campaign journey, a real temporary database, actual process restart, dropped-acknowledgement fault injection, server-forged locked-mission request, 390px viewport, 200% text enlargement and reduced-motion context.

The critic is a separate review pass with the frozen rubric above. This chat harness did not expose a separate critic model/agent, so this is **not represented as an independent external model or human review**. It is a deliberately separate evaluation pass after implementation and machine verification. Learner playtesting remains a separate acceptance gate.

### Narrative / comprehension pre-gate

- **PASS — plain goal:** fresh campaign browser check requires the chapter to state the 5 kg dumbbell scenario and “one request from you never becomes two purchases or two charges.”
- **PASS — actors/change/decision:** Level 1 pins five visible story beats: user request, agent order, successful charge, lost receipt, retry; the player then chooses one vs two charges.
- **PASS — story maps to assessed mechanism:** campaign tests pin the story-first activity at revision 2 while retaining the `trace-counts-v1` deterministic assessment policy; purchase tickets map directly to retry keys and store memory maps to retention.
- **PASS — reduced-motion equivalence:** story content is ordinary semantic DOM; reduced-motion disables transitions/animations rather than removing the story state.
- **PASS — intuitive/formal bridge:** mission/debrief copy explains purchase tickets/store memory first and names the idempotent-retry/identity/retention concepts progressively.
- **PASS — progression focus:** browser checks require Level 2 selected after Level 1 clear, Level 3 after Level 2, Boss after Level 3, and the highest completed node after chapter clear.
- **PASS — assistance semantics:** unit/browser coverage distinguishes `unknown`, `declared_independent`, `assisted` and `previously_exposed`; prior exposure is excluded from current-help counts.

Critical blockers: **none observed in the verified candidate.**

| Area | Score | Evidence / criticism |
|---|---:|---|
| Game identity | 8.6/10 | HUD/dock/campaign/direct decisions remain game-first. Story beats now make the playfield more experiential, but the right-side response card and detailed trace table still carry some web/document ancestry. |
| HUD | 8.8/10 | The HUD now uses the mission's plain-language objective instead of leading with formal frame language. Level/boss state, progress, XP and sync remain glanceable. Mobile still compresses secondary HUD detail. |
| Core loop | 9.2/10 | The learner gets a human goal first (“buy one dumbbell once”), sees the causal failure, makes a direct consequence prediction, and only later meets formal retry terminology. Browser coverage proves the full interaction path rather than only inspecting static text. Live learner comprehension still needs re-testing. |
| Progression | 9.5/10 | Tutorial -> Easy -> Medium -> Boss teaches same-ticket replay, changed identity, retention and then recombination. The previously surprising map behavior is fixed: a successful clear selects the newly unlocked next mission; failure stays on the current route. Server-side locks and XP/success separation remain enforced. |
| Feedback / juice | 8.9/10 | Story beats reveal sequentially, selections lock tactically, save sync/unlock/results/rewards animate causally, and the motion remains optional. Richer scene-specific animation, sound or haptics could increase emotional payoff later. |
| Theme | 9.0/10 | “Shopping Agent” gives the whole chapter one coherent world: dumbbell request, purchase ticket, store memory, missing receipt, safe retry. The theme bridges to technical vocabulary rather than existing only as labels. Future chapters must prove this generalizes without repetitive shopping metaphors. |
| Learning integrity | 9.8/10 | Historical snapshots remain immutable; story-first activities use revision 2; assessment meaning remains pinned; correct evidence—not XP—unlocks progression. Unknown help declaration, explicit no-help, actual current help and prior exposure are now distinct evidence states. |
| Accessibility | 9.0/10 | Semantic story text remains readable without motion; reduced motion, keyboard, 390px viewport and 200% text are regression-tested. Real-device touch pacing and animation comfort still warrant learner feedback. |

Weighted total: **9.1 / 10** (`9.083` before rounding)

Verdict: **PASS >=8**

### Remaining design debt after the fresh pass

- Replace more dense technical tables/cards with scene-specific interactive representations when the learning operation allows it.
- Add richer visual simulation of state/memory/identity instead of relying mainly on icons and text story beats.
- Consider optional sound/haptic cues only after the visual/semantic loop is proven comfortable.
- Validate the story and objective with the learner; a critic pass cannot establish that the teaching explanation genuinely “clicked.”
- Apply the same narrative-before-abstraction standard to other domains without forcing story where it would distort the concept.

## Current baseline observation

The pre-HUD build was visually polished but structurally a website. The first HUD build improved game identity/progression but later learner testing showed that a good shell alone is insufficient. The current standard therefore treats **course comprehension, narrative causality, honest assistance semantics and expected progression focus as first-class game-quality requirements**, alongside visual game identity.

## Additional observations for the next Phase 1 review

Collect these alongside the existing evidence and frozen numeric rubric:

- Is the core interaction enjoyable with XP hidden?
- Does the player have an immediate goal and a reason to care about its outcome?
- Can the player try an unprompted experiment and understand the consequence?
- Do later challenges combine earlier discoveries and tools?
- Does failure suggest a useful next experiment, with quick recovery?
- Do character, story, scene and feedback support a coherent experience?
- Does the boss expose the unsafe retry-policy misconception?
- Is there a complete story payoff and a meaningful working replay variation?
- Does the interaction remain usable on mobile, keyboard and reduced motion?

Record observed evidence and remaining limitations for each item. Proposed features,
screenshots alone and passing automated checks cannot establish enjoyment.
The latest documentation-only update supplies no new build or score.
