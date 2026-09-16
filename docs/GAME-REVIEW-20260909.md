# Internal game-experience review — 9 September 2026

## Verdict

**7.02/10 unrounded (7.0/10 displayed): NEEDS REVISION. Not a >=9 pass.**

Reviewer: implementation agent, in a deliberately separated critique pass after the candidate was frozen. Method: **`internal_tool_assisted`**, authorized by the user's latest instruction while Codex is blocked. This is not a separate agent/model, independent external review or youth playtest. The score is a design judgment with limited audience confidence, not a scientific measurement of enjoyment.

Candidate: **`620036808c6c558a4a0811e7be2cf9e0a8e74043`**, branch `game/expedition-nine-gate`, draft PR #2. Reviewed both the default illustrated expedition and its opt-in Three.js path. No production deployment was made. Prior user 6.5, agent 7.5 and superseded 8.8/9.1 scores concern earlier builds/methods and are not reused as this candidate's score.

## Evidence and observation limits

GitHub Actions **run 174 (`34265834379`) passed** the pinned vendor step, build, Python/hosted/PostgreSQL tests and all three browser modules. The Python suite remains **76 tests**. Chromium **138.0.7204.23** used real temporary local HTTP servers/databases. No successful API responses were mocked to establish gameplay. The reviewer inspected downloaded screenshots, JSON reports, source and browser traces; this was not an unrestricted personal or authenticated live-site playthrough. The local browser was administrator-blocked and not bypassed.

The run's synthetic PR merge is `fdf6ecb54bacd16fb2aae692fe72b1929266a5fd`. Source artifact **10071768936** and evidence artifact **10071821518** bind the reviewed input to the candidate. Evidence includes `game-review-probes.json`, `game-review-trace.zip`, original/expedition reports and screenshots. Artifacts have limited retention; they are not permanent evidence storage.

Observed journeys include: first send with one actual gear but unknown courier confirmation; safe retry; an intentional duplicate after restart and rehearsal recovery; journal restoration through a real 3D mesh click; late retry/reconciliation; unsafe and safe boss rules; bridge ending; missing-request/two-hour detour; XP-hidden default play; real process restart and dropped-acknowledgement recovery; keyboard focus; unsaved policy choice across attempted map navigation/reload; actual WebGL context loss; blocked renderer-module loading; and touch/narrow/reduced-motion fallback.

Representative artifacts: `review-three-first.png`, `review-three-send.png`, `review-three-ending.png`, `review-three-fallback-mobile.png`, `expedition-setback.png`, `expedition-unsafe-policy.png`, `expedition-mobile-390.png`, and `expedition-text-200.png`. Full-page captures taken after scrolling can position sticky elements at the captured scroll location; they are not evidence of a permanent layout position. The ordinary viewport still has substantial vertical separation between the scene and its action/report surfaces.

The initial 3D renderer report recorded revision180, 62 draw calls and pixel ratio1. These are diagnostics, **not frame-rate, phone-GPU or input-latency measurements**. Healthy 3D rendering was exercised on headless desktop; physical phone performance and healthy-3D mobile target legibility remain unvalidated. No children/young adults were recruited. No claim of equivalent/superior course effectiveness is established.

## Frozen rubric and scores

| Area | Weight | Raw /10 | Evidence and criticism |
|---|---:|---:|---|
| Game identity | 15% | 7.0 | A real world, companion, direct object selection, duplicate consequence and restored bridge are present. But the page still frames the scene with headings, buttons and report panels; the boss remains a four-choice rule form. |
| HUD / information hierarchy | 15% | 7.0 | Goal, world truth, courier knowledge and sync state are explicit. Repeated goal/title surfaces consume space; actions can sit below the first viewport; the floating utility dock competes with scene/dialogue content. |
| Core loop | 15% | 6.5 | Send/retry/recover is coherent and the journal mesh actually performs the action. Many decisions remain prescribed, with few consequential alternatives or discoveries the player owns. Hints and feedback often supply the next move rather than invite a hypothesis. |
| Progression | 15% | 6.5 | Retained identity, restart and retention progress into a policy boss and a materially different detour. Changed payloads and unavailable-register uncertainty have weaker hands-on preparation. A fair, self-directed combine challenge needs more than exposing the right rule choices. |
| Feedback / game feel | 12% | 6.5 | State changes, message motion, visible duplicate, rewind and bridge repair respond to actions. The rhythm still involves saving/confirming a guided run and reading results; effects are modest and the gameplay is not yet rich enough to carry engagement without them. |
| Theme / cohesion | 10% | 7.5 | Pip, journal, storm, workshop and bridge form a comprehensible setting. The low-poly prototype is a useful scene rather than final art direction; small props, generic instructional dialogue and page chrome limit world presence. |
| Learning integrity | 10% | 8.8 | Server replay, finite retention, explicit separate register, unsafe-policy counterexamples, learner isolation and honest assistance/limited-scope evidence are strong. Those safeguards do not establish fresh transfer, retention or course equivalence; the current world has important simplifying assumptions. |
| Accessibility / responsiveness | 8% | 7.0 | Equivalent semantic controls, real keyboard focus checks, 320/390px default play, text enlargement and renderer-failure recovery are present. Discoverability in the 3D scene, scrolling hierarchy and actual device/assistive-technology behavior require further work. |

Calculation: `(7*15 + 7*15 + 6.5*15 + 6.5*15 + 6.5*12 + 7.5*10 + 8.8*10 + 7*8) / 100 = 7.02`.

No points were awarded merely for adding Three.js, code volume or passing tests. The score's hundredths follow the fixed weights; they do not imply hundredth-point psychological precision.

## Audience lenses — predictions, not playtest findings

**Younger non-specialist: NOT YET PASSING.** Assume a reader comfortable with short English instructions but no distributed-systems vocabulary. Helping Pip and seeing a duplicate gear could create early curiosity. Likely friction/abandonment is the transition from concrete delivery actions to four abstract boss rules and lengthy result explanations, particularly when scrolling separates the action and its consequence. There is a reason to see the bridge repaired, but insufficient evidence that the present interaction itself earns continued voluntary play or replay with XP hidden.

**Older teen / young adult: NOT YET PASSING.** Assume curiosity about puzzles/systems, without requiring prior backend experience. The world-versus-courier-knowledge distinction and safe/unsafe-policy feedback offer useful insight. The likely abandonment point is realizing the early route is largely prescribed and that the boss can be solved by choosing the evidently safe options. The detour changes the failure model, but broader strategy, experimentation and a personally constructed solution are too limited to confidently earn another run.

## Blocking findings

**G1 — Too much exercise, too little owned discovery.** The scene is interactive, but a guided sequence plus rule-selection report does not yet satisfy the voluntary-game-play bar for either lens. A 3D background cannot fix this by itself.

**G2 — Boss preparation gap.** Payload conflict and unavailable-register uncertainty need concrete encounters before their combined assessed use. Difficulty should increase through recombination and reduced scaffolding, not newly introduced abstract choices.

**G3 — Experience hierarchy is still page-first.** Put the current action, relevant objects and immediate causal response together. Reduce repeated briefing/UI surfaces and post-action confirmations. The entire experience, not an isolated scene screenshot, must feel playable.

**L1 — Course-level outcome claim not ready.** This is a guided retry slice. Fresh unassisted transfer, delayed retrieval and authentic implementation/design evidence are missing for the broader course promise. This is a separate learning gate, not a criticism that the current metadata dishonestly claims mastery.

## Changes accepted as genuine progress in this iteration

- Three.js is actually rendering and raycasting into real legal actions, not a static mockup.
- A saved/recovered boss rule remains visible after reload; attempted map navigation cannot silently discard it.
- Boss rules use the intended numbered order, and completed tests move into an optional postmortem rather than forcing the long report ahead of the ending.
- Keyboard focus continues to the next relevant action after redraw.
- Actual WebGL failure and a failed module load preserve a playable alternative without changing learning evidence.

These are improvements, not approval of the whole game.

## Next acceptance slice

Build one compact **playfield-first investigation/construction encounter** before adding more course content or scenery: a clear goal; inspectable objects; at least two plausible actions; a recoverable wrong hypothesis with visible consequences; a rule the player discovers; and a constructed solution executed under a fresh disruption. Keep essential controls and effects together on desktop and mobile. Teach payload/unknown cases through play, then recombine them. Make the payoff change the world and give a genuine next choice rather than merely close a report.

In parallel, use GAME-AS-COURSE.md's outcome ledger to expose what is practiced, what is tested fresh and what remains unknown. Preserve serious capability targets; do not get a higher engagement score by silently making the learning shallow.

Status: **`needs_revision`**. Codex setup is not the blocker. The actual game design and outcome coverage are. The user's final review is still pending and should not be described as an acceptance-ready handoff.
