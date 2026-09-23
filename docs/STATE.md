# Current state — LLM learning-game proof track

**SECOND VETO — obstructing tutorial card: system repair IN FLIGHT (uncommitted) —
23 September 2026:** The user re-rejected the candidate with a screenshot of the
TUTORIAL "MESSAGE MACHINE" card parked top-left over the 3D view during REPAIR 1/4,
carrying a DOM "Connect the power lead" button *while the POWER LEAD world marker was
also on screen*. Verdict: fix the SYSTEM (enforcement + docs + game) so an auto-summoned
panel / duplicated world verb cannot pass in ANY state, and RUN the full critic (play the
whole game, screenshot every state, judge every lane ≥9) BEFORE presenting. Root causes
pinned in `web/first-words.js`: `syncCardVisibility` force-opened the panel for all of
`tutorial`; the `world-focus` toggle read `practice.current?.focus` (null after practice)
so the compact band never applied; the DOM action button at the `repair` branch rendered
alongside the world marker; and the world-click handler summoned the panel instead of
performing the verb (Rule I1 / CP4). Fix applied this session:
- **Game (diegetic opt-in tutorial, mirroring the blessed mission shape):** `syncCardVisibility`
  now force-opens only during control practice (transparent floating prompt); the speech-repair
  panel folds behind the world toggle and is opened by the player. World markers carry verbs;
  when the panel is opened its world-verb marker folds away (single carrier, I3) via the new
  `world-action-marker` term in the `frame()` fold rule; `world-focus` now keys off `repair?.focus`;
  the socket/plug world click performs `connect`/`step` directly instead of opening the panel.
- **Enforcement (`tools/check_presentation_budget.py`):** added a game-agnostic `dupCarriers`
  measurement — the same `data-action` painted both inside the declared marker layer and on a
  visible DOM control outside it is a B8/I1 violation, measured in EVERY state with a marker
  layer, not only cinematics. Closed the self-authored coverage-waiver loophole: a state may
  only raise `coverage_max` above the 15% base if it declares `panel_open` / a reason / cinematic,
  otherwise it is held to base and flagged.
- **Fixture (`tests/fixtures/presentation-budget-first-words.json`):** added
  `tutorial-repair-closed-desktop` and `-phone` (the exact veto state, folded, dup must be 0,
  coverage ≤15%) and `tutorial-repair-opened-desktop` (opt-in panel at the ≤22% budget);
  `mission-intro-closed` now navigates the tutorial through world markers.
- **Docs (`docs/GAME-PRESENTATION-GUIDE.md`):** B8 extended with the live-play double-carrier
  clause + no-auto-summon rule; Tutorial stage shape now states the opt-in toggle; added critic
  probe CP7 for a gameplay double-carrier / self-summoning panel.
- **Tests:** `skip_opening_to_tutorial`, `control_practice_browser`, `first_words_opening_browser`,
  `level1_lifecycle_browser` and `level1_controls_browser` updated to drive/assert the folded
  diegetic tutorial (world markers + toggle visible, `#engine` hidden) instead of the old
  always-open DOM button.

Gate status at this snapshot: **all measured gates are green on the folded model.**
- Active browser suite (9 modules, `python manage.py browser`): foundation entry,
  renderer lifecycle, animation rest, opening, control-practice, controls, physicality,
  chapter, readability, lifecycle — all **passed**.
- One gap the browser groups did **not** cover: `tests/test_hosted.py` still asserted the
  old always-open tutorial card (`#engine` visible + DOM "Connect the power lead") on the
  hosted login/resume route and failed under the folded model. Fixed to assert the folded
  diegetic state (card hidden, toggle visible, world marker "Connect the loose power lead"
  present, and that state surviving a reload). The hosted module now passes (14/14).
- Presentation budget tool on the exact candidate: **`"result": "passed"`, zero
  violations across all 15 measured states** (`artifacts/presentation-budget-final.json`,
  log `artifacts/veto2-budget6.log`). The veto state itself measures coverage 4.7%
  desktop / 13.4% phone, `dup=0`, `focal=0`, `stray=0`.
- One regression surfaced and was fixed during this run: re-pointing the `world-focus`
  toggle at `repair?.focus` pushed the opt-in repair card into the bottom band and made
  it overlap the phone move-stick (failed the readability B5/containment probe). The veto
  is resolved by *folding* the card, not by repositioning it, so that edit was reverted;
  `world-focus` keeps its prior (inert during repair) condition.
- Second measured defect found by the checker in the same veto state: on the 390px phone
  the POWER LEAD marker still sat inside Zip's focal ring (`B2 focal entity covered`).
  Root cause was **systemic, not this game**: the reusable subject keep-out
  (`projectedEntityBox`) returns the silhouette only, while the B2 probe measures the
  silhouette *plus* the focal ring, so any game clearing the body can still bury the
  subject's own space. Fixed as a shared primitive: `focalClearanceBox()` in
  `web/world-marker-layout.js` unions the body box with the ring the checker probes
  (2×margin), and `web/first-words.js` seeds the marker layout with it for the focal
  protagonist in **every** play stage, not just the tutorial. Guide B2 now states that a
  game must use the ring-inclusive keep-out. The checker now also treats a measured state
  with no `screenshot` capture as an **evidence gap** violation, and the scenario names a
  capture for **every** state, so a budget run leaves visual evidence for the critic pass
  rather than only numbers.

**Phone presentation rebuild (system repair) — 23 September 2026:** the second veto was a
phone defect, and closing it exposed two more of the same family. Three rules now carry it,
each enforced mechanically rather than by taste:
- **Rule I8 (a narrow viewport never receives an unasked sheet)** — `web/first-words.js`
  `render()` gates the feedback auto-open on `host.getBoundingClientRect().width<700`, so a
  beat can no longer summon the mission card over the character on a phone; the anchored
  toggle keeps carrying the result line. A player-opened card at that width renders as a
  flush, full-bleed bottom sheet (`#engine.sheet`) that yields the move stick and camera
  cluster and stops below Zip's focal ring. `check_presentation_budget.py` verifies the
  claim before granting the raised budget: sheet geometry (flush, full-bleed, ≤40% height,
  chrome actually gone) **and** a scenario step proving the player clicked the toggle.
- **Rule I9 (a beat keeps its carriers when the screen shrinks)** — the mirror-image defect
  that every existing budget was blind to: at 390×844 all three world route boards were
  *hidden* because their labels no longer fitted the safe band, so the mission's central
  decision had no readable surface anywhere while coverage, clipping and overlap all
  reported clean numbers. `placeWorldMarker` gained `parkWhenFull` (slide to the nearest
  free spot and edge-cue back to the world object instead of vanishing), the route signs are
  declared `data-carrier`, and the checker measures a scenario-declared `carriers` floor
  (`{selector, min}`). Pinned in `tests/level1_chapter_browser.py` (`#markers >
  [data-carrier]:visible` count 3 at 390px) and in `tests/test_world_marker_layout.py`.
- **B3 reachability on a wide viewport** — the same scrolled-out-of-its-own-panel defect the
  phone sheet had: at 1280×720 the third recovery option sat below the fold of the reading
  card. Fixed in CSS (the prose detail that duplicated what the boards already say yields
  its height to the option list); both desktop decision states now measure `unreachable=0`.

Gate status at this snapshot: **all measured gates are green on the folded model.**
- Presentation budget, exact candidate, **19 measured states** including three phone
  decision states and a new desktop folded-decision state: `"result": "passed"`, zero
  violations (`artifacts/presentation-budget-v8b.json`, log `artifacts/veto2-budget8b.log`).
  Phone decision: folded 20.3% with `carriers=3/3`, sheet 32.4%, recovery sheet 34.6%, all
  `focal=0`, `unreachable=0`, `dup=0`.
- `tests.test_presentation_budget_contract` (14 tests) and `tests.test_world_marker_layout`
  (3 tests) pass; the full unit suite passed (403 tests) before the last two test edits.
- Shared critic harness `tools/play_session.py` is now exercised end to end (`start`/`step`
  with `goto`/`resize`/`clickrole`/`settle`/`eval`/`shot`, then `stop`); two defects found
  and fixed while doing it — `--serve` could not import `tests.browser_check` when invoked
  as a script, and Git Bash rewrote `--path /first-words` into a Windows path.
- `check_presentation_budget.py` now prints the page's actual shape (marker classes and
  visibility grouped, live buttons, headings) when a `wait_eval`/`wait_text` times out, so a
  beat that never reaches its expected state is diagnosed from the log instead of costing a
  full scenario re-run to discover.

**Rule I10 — the accessibility viewport (system repair) — 23/24 September 2026:** every
budget above was measured at the build's own text size. Re-measuring the phone decision
sheet at the WCAG 1.4.4 viewport (200% text) put its third route notice 51px below the
bottom of the screen: the same obstruction the veto was about, in a state no gate looked
at. Fixed as a system, in four parts:
- **Measurement:** a scenario state may declare `"text_scale": 2`. The tool stamps the
  enlarged text on the live page *before* the beat's steps run (so the walk is lived at
  that size), re-applies it before measuring, and relaxes nothing — asking for a taller
  sheet at any text size is now a rejection in `resolve_state_budgets`, not a knob.
  `tests/test_presentation_budget_contract.py` requires a scaled twin for every phone
  sheet beat, so a new sheet state cannot be added at 100% only.
- **Machinery:** `web/surface-fit.js` exports `fitBoundedSurface(surface)` — a bounded
  surface ranks its optional sections with `data-shed-item` and hides ranks, lowest first,
  until its decision fits. It converges in **one** pass in both directions; restoring one
  rung per tick left a sheet wearing the previous text size's layout for over a second,
  which is what the first measurement of the recovery sheet saw.
- **Two holes the ladder exposed in itself.** (1) Ranking was decorative unless it is
  exhaustive: the recovery beat appended a five-line "why it failed" paragraph straight
  into the button container with no rank, so the fitter could not see the 168px that was
  pushing the choice off screen and reported "everything shed" while still overflowing.
  Run-time prose in a decision container is now ranked (`statusLine` 25, commitment lines
  45). (2) `[data-shed-item].shed{display:none}` lost a specificity fight with
  `#engine.sheet .engine-top{display:flex}`, so a rung kept its height while claiming to
  be gone — and in the 200% capture the "Look inside" control was painted *over* the
  heading. The shed rule now carries `!important` with the reason beside it.
- **Authored text, per the rule's own remedy:** the recovery recap went from a 130-char
  two-clause explanation to `Your sign pointed at "…".`, because the option labels already
  say what to do next (I5/I7). Where two rungs still cannot both fit, the ranking now
  keeps the beat's causal lesson and sheds an option's quoted world text, which the route
  boards already carry in the scene — a learning-quality decision, written down as such in
  the guide.

Gate status at this snapshot: **all measured gates are green.**
- Presentation budget, exact candidate, **21 measured states**, two of them new
  200%-text phone sheet twins: `"result": "passed"`, zero violations, no budget raised
  (`artifacts/presentation-budget-v11.json`, log `artifacts/budget-v11.log`). Recovery
  sheet at 200% text: coverage 33.6% against the fixed 40% ceiling, `carriers=2/2`,
  `unreachable=0`, `focal=0`; decision sheet at 200%: 35.8%, `carriers=3/3`.
- Stated plainly for the reviewer: the scenario's step **waits** were raised from the
  tool's 30s default to 45–90s while the walk grew from 12 states to 21 on a ~4fps
  software renderer. That is a patience change, not a criteria change — no measured
  ceiling, carrier floor or assertion was relaxed, and the two 200%-text twins declare
  no `coverage_max` of their own.
- `python manage.py build` passes; `python manage.py test` → 411 OK (skipped=7);
  `tests.test_surface_fit` (4 node tests) + `tests.test_presentation_budget_contract` +
  `tests.test_world_marker_layout` pass.
- Active browser modules: readability, opening, control-practice, chapter, lifecycle and
  controls **passed** (`artifacts/browser-groups.log`); entry, renderer-lifecycle,
  animation-rest and physicality in `artifacts/browser-groups2.log`.
- `check_presentation_budget.py` now says *which* kind of overflow it found: when every
  ranked rung on a surface is already hidden and the surface still overflows, the B3 line
  reports the exhausted ladder and points at unranked content or authored length instead
  of leaving a worker to conclude that the ceiling is what is wrong. A B3 violation now
  also carries the surface's own child tree, each node labelled with its rank or
  `UNRANKED` plus its height — verified by deliberately un-ranking the input rung, which
  made the report name `div UNRANKED … INPUTOpen the route to the` in one line, the answer
  that had cost four hand-written probe walks to obtain earlier.
- Process cost, measured rather than assumed (see `docs/ASTRA-REVIEW-WORKFLOW.md`): a
  5-state `--only` chain is **41s**, the full 21-state scenario **277s**, the unit suite
  ~70s. Both budget runs were re-run after the verification break and passed; the
  candidate is unchanged by it.

**Still to do before presenting:** the cold-observer full-game critic pass is running
against a disposable learner at a local URL (`artifacts/play-20260923/cold-report.md`),
followed by the design-intent comparison pass; every lane must reach ≥9. No commit made
for the second-veto work yet; no Level 2, no deployment. Build passes.

**Ambient + diegetic interaction model (system repair) — 22/23 September 2026:**
The user vetoed the `4556f84`/`071591a`-era candidate over the shared opening
controller painting a persistent bottom-centre "Take control / ← Back" bar —
exactly the interface-coupling the interaction/info/tutorial research and
`GAME-PRESENTATION-GUIDE.md` already forbid. Treated as a system (not game) defect
because `web/game-opening.js` is imported by every title. Root-cause rebuild to a
**fully ambient + diegetic** model: plain beats advance on their own once motion
settles (+content-paced dwell, or tap/keyboard), the final handoff is ambient with
only a brief fading cue, pending story actions are performed on their **diegetic
world marker** (the controller synthesises one whenever a package omits it, so no
title can fall back to a DOM button), and the corner cluster (back/replay/pause/skip)
is the only persistent chrome. A single painted advance control now appears **solely**
under `prefers-reduced-motion` (WCAG 2.2.4, which cannot auto-advance). Frame height
no longer reserves a bar: prologue screen-space UI drops ~11% → ~4%. Generalised
upstream so geometry-only budgets can never re-certify a button bar: new guide rule
**I6** (ambient world-first control surface, with the diegetic-UI rationale) and
mechanical **B8** in `tools/check_presentation_budget.py` (in cinematic states flags
any painted non-diegetic control; allow-lists only the corner cluster, world markers
and the off-screen keyboard skip link; `reduced_motion: true` exempts exactly one
control). Candidate **`071591a`** (branch `docs-readthrough-20260921`, pushed).
Gates at this change all green: `build`; 387 unit tests (7 skips); budget tool
reports **`stray=0` / passed** across all four cinematic prologue states and every
other measured state (report `artifacts/presentation-budget.json`); full active
browser suite (entry, renderer-lifecycle, animation-rest, opening incl. ambient/
diegetic/reduced-motion blocks, control-practice, controls, physicality, chapter,
readability, lifecycle). Motion/actual-listening remain deferred/unassessed per the
20-Sep scope. **Independent cold-observer re-review is currently BLOCKED by the known
host capability gap, not by the candidate:** a fresh-context reviewer session
(`b7c5aebe`, report `docs/reviews/2026-09-23-cold-observer-071591a.md`, not written)
ran the mandated capability preflight against the live repaired build on
`127.0.0.1:8765/first-words`, confirmed navigation + structural snapshot work, then
**stopped without a verdict** because every screenshot fails with
`NATIVE_BROWSER_VIEWPORT_UNAVAILABLE` (in-app Browser surface `viewport=0x0,
visibilityState=hidden`). It correctly refused to substitute a DOM snapshot or to read
source for a subjective WebGL review, so no cold-observer lane is being marked
assessed. This needs a visible in-app Browser surface (a human/client action) or the
user's own playthrough — the user remains sole final critic. No user acceptance, no
Level 2, no deployment.

**Opening shot composition + B6 presence budget — 22 September 2026 (follows the
Zelda experiment below):** The user's play of the redesigned opening caught what
no UI budget could: the desktop home shot was a zoomed-out map view (each friend
≈3–6% of canvas height) and the two island trees were planted off the plate
(radius ≈16 vs 14.5) with trunks dangling over the void. Fixed in the world
(trees → `[±10.5, 0, 8.5]`; home camera reframed to a medium shot, desktop
`[3.5,3.6,16.9]`, portrait `[4,4.8,22.5]` fov 50 — first portrait tightening
pushed Mira out of the narrow frame, so every subject's projection is verified
at both sizes). Generalised as budget **B6 subject presence ≥ 12%** in
`tools/check_presentation_budget.py` (scenario key `presence: {entity, height}`)
measured through a new reusable primitive `world.projectEntity(id, [0, height, 0])`
(playcanvas-backend.js + spec-game-world.js). Re-measured presence: desktop
≈5% → **32.8%**, phone ≈8% → **16.4%**; all five states still pass B1–B6 with
zero clipped/long/disabled/focal hits. Guide updated (B6, worker checklist,
enforcement map) and decision record extended: *a passing UI budget with a
thumbnail subject is still a failed shot; props must be planted inside the
terrain they stand on*. Gates at this change: build, 387 unit tests, opening and
all active browser groups pass. No Level 2, no deployment.

**Zelda-style presentation experiment played — 22 September 2026 (follows the
correction below):** Per the user's direction (research-backed, non-invasive,
world-belonging info delivery; take the most sensible guess now; document it),
the opening and control-practice presentation was rebuilt on the shared layer:
fading bottom subtitle replaces the title/paragraph overlay (full text stays
screen-reader available), icon corner cluster replaces the utility bar, gameplay
chrome never rides the cinematic, and the practice card becomes a transparent
floating prompt at the character. Measured with the budget tool on real pages:
prologue desktop screen-space UI **38.4% → 6.1%**, phone **43.3% → 12.8%**,
tutorial prompt desktop **7.9%**; phone **19.2%** under the newly documented
B1 touch-input allowance (≤20%, direct-input affordances only). Zero clipped
elements, over-length blocks or dead visible controls in all five measured
states. Decision record with research, reversible guesses and open questions:
`docs/PRESENTATION-EXPERIMENT-ZELDA-20260922.md`. Gates at this change: build,
387 unit tests, and all active browser groups (opening, tutorial, controls,
physicality, chapter, readability, lifecycle, entry, renderer, animation) pass;
legacy-group suites `opening_contract_browser`/`word_machine_browser` fail on
routes retired in `c1be3ec` (pre-existing, untouched). Next bounded chunk per
the record: ambient story advancement (no Continue button), diegetic opt-in
machine panel, then re-measure and replay before any readiness claim. No
Level 2, no deployment.

**Presentation-system correction — 22 September 2026 (supersedes the readiness
claim below):** The user rated the `5d0e8c2` candidate 1/10 with two screenshots:
the prologue HUD is unchanged (large DOM text overlay over the world + permanent
utility bar) and the anchored stage card intrudes into the 3D view, clipping off
the top of the viewport. The internal 9/10 lane record certified exactly the
failure the 21 September correction had already named; prose rules and a
declaration-only design gate let it through. System response, general not
per-game: `docs/GAME-PRESENTATION-GUIDE.md` (surface ladder P1–P3, measurable
budgets B1–B5, interaction rules I1–I5, worker checklist, critic probes CP1–CP6),
mechanical enforcement via `tools/check_presentation_budget.py` (scenario-driven,
measures real pages) and a required `presentation_integration` criterion in
schema-v2 critic records (budget report + interactive trace + cold observer +
capture). First measured truth for the current build: prologue states cover
**38–43% of the viewport** with screen-space UI against a 15% budget, with
clipped controls (`artifacts/presentation-budget-5d0e8c2.json`). The record
`docs/reviews/2026-09-21-first-words-5d0e8c2.json` is retained as history but no
longer validates under the strengthened gate — correctly, since it certifies a
rejected presentation. The game itself is not patched cosmetically first; the
HUD/interaction redesign follows the guide as the next bounded chunk. 387 unit
tests and the build pass at this change; no Level 2, no deployment.

**World-anchored first-words readiness candidate — 21 September 2026:** Branch
`docs-readthrough-20260921` candidate `5d0e8c25219713879f75070ad04b8503ff3882ce`
implements the v4 world-anchored reading design (single anchored stage card, in-world
signs, desktop bottom-pin reading beats, marker de-collision) plus cold-observer
repairs: sky-reaching red rift beam, visible red extraction tether, caption forward-
reference and punctuation fixes, player-clearance card offset during control practice,
working local `/api/progress/reset`, machine-anchored REPAIR SOCKET label and clearer
relay recap. Build, 386 unit tests, all ten browser groups, relay suite and the active
phone playthrough pass with zero console errors; desktop and phone full routes were
played live. Schema-v2 record `docs/reviews/2026-09-21-first-words-5d0e8c2.json`
validates with gate minimums 9 for art/world direction, rendered story, first touch,
whole chapter and learning; `audio_atmosphere` is recorded unassessed because no
listening modality exists in this environment, so the tool status is
`review_incomplete`, not acceptance. No Level 2 or deployment promotion follows from
this record; the user remains the sole final critic.

**Design/prototype checkpoint — 21 September 2026:** The concrete v3 design
passed independent authoring review only for controls, sequence demonstration and
supported practice. Exact digest and scope are in `design/review.json`; release
remains blocked. `web/lab/speech-device.html` is an unfinished disposable local
prototype using the shared PlayCanvas engine and parameterized sequence practice.
Native inspection reached its room; movement/inspection and phone behavior still
need repair and full play. It is not integrated into the saved adventure or deployed.
Serve locally with `python -m http.server 8046 --bind 127.0.0.1 --directory web`.
Earlier draft-rejection notes below are historical; runtime rejection remains active.

**System-first correction — 21 September 2026:** The user rejects the current
learning progression and detached gameplay HUD/guidance. Repair the learning and
interaction design boundary before game implementation. Follow `LEARNING-DESIGN-GATE.md`: exact-design
review before prototyping, native GUI alignment before release. The current runtime
is not compliant; screenshots, test passes and deployment do not imply acceptance.
Motion/audio remain deferred; no Level 2 or automatic deployment.
The learning/attention contract, prototype/release checks and native ingestion
repairs are implemented locally and tested. Independent review rejects the draft
until concrete examples and step-specific presentation are supplied. See
`experiments/20260921-learning-design-system-repair.md`; no game/runtime acceptance
or deployment follows from this system checkpoint.

**Explicit review deployment — 20 September 2026:** User requested commit, push
and deployment of this checkpoint. Render is live on `74455fd7f22d6a423eb93b070bd2c9a37d0953d7`
(deploy `dep-dao21bn40ujc73djt40g`), with auto-deploy off. Public health, exact
served runtime files and native browser entry rendering pass. Authenticated hosted
play was not repeated. Art/world findings remain open, motion/audio deferred,
and this deployment is not user acceptance or a normal promotion-gate pass.
See `experiments/20260920-user-requested-deployment.md` for authority and checks.
The exact candidate's CI failed package-tool imports and the physicality setup
walk. Continued system work fixes workflow package invocation and tests actual
entrypoints without PYTHONPATH. Physicality passed locally but failed again in CI;
its cause remains unresolved and must be investigated before declaring CI ready.

**Opening composition iteration — 20 September 2026:** Research checkpoint
`5ceef14` is pushed to `origin/main`. The subsequent local world-v9/opening-v8
iteration tightens the social group and home camera, clears the lantern from
Zip's face and wrapped captions, and keeps background delivery within framing.
Build, 369 application tests (seven skips), and final opening browser regression
pass. A separate Astra native recheck confirms clearer shared activity and phone
group framing, but 360px control overlap, caption competition, Warden/tower
hierarchy and ambiguous background activity still need repair. See
`experiments/20260920-opening-composition-repair.md` for exact test scope, candidate
file hash and reviewer evidence. This is a scoped improvement, not opening or
whole-game acceptance. Continue these opening repairs before later expansion.

**Research expansion — 20 September 2026:** The current step is the user's requested
ten-game research study. `GAME-REFERENCE-STUDY.md` records platform-specific
Metacritic selection, gameplay/developer transcript evidence, concrete mechanisms,
tradeoffs and testable applications to existing critic lanes. It distinguishes
the original Ocarina score from the upcoming remake demonstration and records
unavailable transcripts and partial coverage. `GAME-RESEARCH-PIPELINE.md` defines
the future separate research-agent handoff; it is planned, not implemented or
dispatched. This changes design guidance, not runtime readiness. After research,
resume the bounded opening/phone-composition repairs and cold native verification
before expanding the tutorial or Level 1 work.

**Creative direction — 20 September 2026:** The user requests inspiration from
Zelda, Rockstar, The Witcher 3 and Expedition 33: a beautiful living world and
meaningful play over cutting-edge graphics. `LIVING-WORLD-DESIGN.md` records sourced
principles, authoring decisions and observable critic questions. Opening staging
and phone composition remain the next bounded repair; this research is not a
completed visual improvement or a readiness upgrade. The user challenged the initial
research depth; `experiments/20260920-ocarina-gameplay-study.md` now records the full
official gameplay transcript study and selected-frame inspection, with specific
applications and limits. No new runtime or critic-schema changes follow from it.

**Active scope update — 20 September 2026:** The user temporarily parks motion-quality
and audio review, trusting the engine/code for motion provisionally. Continue native
GUI play and broader art/world review now. Record motion/audio as deferred and
unassessed, never passed; do not pursue media-provider integration for this scope.
This does not defer composition across camera positions, visual world-state contrast,
controls or spatial readability. Full readiness remains distinct from this scoped
art pass; Level 2 and deployment promotion remain gated.

**Latest user direction — 20 September 2026:** Use one fresh-context Astra reviewer
across all critic lanes, including mandatory art/world direction, with actual GUI
play and video recordings as complementary evidence. Preserve separate lane
judgments and cold observations before intent. Use the existing Codex session for
now; future Terminal PM owns orchestration. Luna-first wording below is historical.
See `ASTRA-REVIEW-WORKFLOW.md`. Unsupported evidence remains unassessed.

## Active completion scope — 20 September 2026

The user now requests completion of both the reusable system and the full entry
through Level 1 journey, including prologue and separate tutorial. Follow
`READINESS-20260920.md`. Finish real repair/review proof, integrated verification,
native play and independent criticism; repair observed blockers. Final user review
still precedes Level 2 and deployment promotion. Historical candidate headers below
are evidence history, not a prohibition on the newly authorized work.

## Art/world enforcement follow-up — 20 September 2026

The shared art rubric now requires six separate dimensions in assignments and
submitted art results, and an explicit art/world gate in schema-v2 readiness.
Missing scope, unsupplied evidence and a passing verdict over an unassessed dimension
are rejected. This validates evidence contracts, not visual quality. See
`experiments/20260920-art-world-enforcement.md` for broader art priorities and scope.
The runtime is unchanged from `323c95e`. The existing fresh Astra task completed
22 GUI inputs across opening scenes 1–3, tutorial and Level 1 entry at desktop and
390px: route-clue discoverability, doorway occlusion, caption-dependent relationships,
dark silhouettes and phone focal hierarchy need work. Full chapter, 360/430 and
performance were not covered. The linked experiment retains scope and retests.
Build and 369 application tests pass (seven skips). No product readiness upgrade.

## Active repair and verification results — 20 September 2026

Bounded tutorial repair after `7962ec7`: world-marker visibility now matches the
spec's current primary action as well as its anchor, so Scan/Speak cannot occupy
the same tutorial target together. Shared player controls offer an opt-in front
character view using the existing collision-aware camera; it does not move/turn
the actor or modify learning evidence. The current world opts in (WorldSpec v8).
The same fresh top-level Astra reviewer rechecked desktop and 390px phone by GUI:
both fixes worked, Recenter worked, and no control overlap was seen (19 inputs).
Its retained report is `artifacts/readiness-20260920/marker-front-critic-recheck.md`.
Remaining presentation concerns: similar camera icons and a phone edge target
visible while its gate is out of view. Motion/listening and overall acceptance
remain open; these targeted repairs do not close the art/world gate.
Build, 365 application tests (seven skips), active controls, four-width tutorial
and 200% text readability checks pass. See
`experiments/20260920-tutorial-marker-front-view.md` for retained setup timeouts
and the bounded cold-load wait repair.

Review infrastructure follow-up: the user-authorized fresh top-level projectless
Astra task has browser access and has demonstrated actual movement, camera/menu
and tutorial inputs. Child-provider attachment remains unresolved; the top-level
path is a verified workaround. The bounded cold opening/tutorial review completed
on disposable port 8067, runtime candidate `817598c`, reaching Begin Level 1 with
20 GUI inputs and 30 screenshots. It found overlapping Scan/Speak world markers,
caption-dependent meaning, dark silhouette loss and panel dominance; no progression
blocker. Native-run recording/listening remain unavailable. See the media capability
experiment for the source task and scope. New supervised bridge runs
require a scoped preflight report; recording does not qualify media inspection.
Build and 365 application tests pass (seven skips). No game acceptance upgrade.

Media/browser capability research is recorded in
`experiments/20260920-media-review-capabilities.md`: no documented Astra audio/video
input flag; Gemini video/audio and GPT-Audio-1.5 are unbenchmarked supporting-tool
candidates, not enabled providers. Parent IAB blank-page creation works. Reviewer
provider inventory remains empty and blank-page creation fails both before and
after a successful CUA reset. Host-side cause unresolved; no game/server dependency.
No game readiness score changes follow from this research.

Latest bounded follow-up after local `1f00f30`: the opening now shows an actual
flower delivery using existing workers and timeline primitives, with persistent
handoff and correct rewind restoration. Native review found and repaired a shared
cinematic resize bug that moved the actor to its gameplay position. Build, 356
application tests (seven skips), opening browser checks and a settled-resize probe
pass. Desktop/phone native replay is recorded; the independent reviewer still
cannot acquire a browser, including through the documented iab entry point. No
acceptance upgrade. Next: physical interaction/panel composition and outstanding
critic/media gates. Retained evidence: `artifacts/readiness-20260920/town-repair/`.


The supervised repair-return proof is complete: actual fresh GUI captures,
independent evidence review, and `evidence_repair_qualified`; product acceptance
remains undetermined. See `experiments/20260920-native-repair-return.md`.
The old next-step statements below are historical.

Cold play exposed missing gate identity and a false spatial handoff. Repairs add
parameterized shared gate symbols and validated once-per-chapter player checkpoints;
package-specific placements remain outside shared controllers. The tutorial Moon
is now distinct, Level 1 starts in its corridor, and the opened gate reveals a
supported signal receiver with Mira's reply. The opening identifies Mira earlier.

A versioned Level 1 relay now asks the player to select between timestamped notes,
predict the destination and next input before feedback, then recover if needed.
Old version-1 saves retain their pinned rules. First choices survive correction;
completion still does not establish mastery. Native Astra regression play reached
the distinct ending after deliberate wrong choices and a pre-feedback reload.
That informed run is not an independent acceptance review.

Frozen candidate `7856b054c3f3671764c32e6cb7da2ff14d363daa` passed build and
356 application tests (7 skips). Final focused UI tests pass. Updated chapter, opening,
tutorial, controls, readability, lifecycle and foundation checks pass. Physicality
had a slow setup timeout; the unchanged standalone rerun passed. Both outcomes
are retained.
Independent learning review confirms both actual saved capsules recompute exactly,
first errors remain preserved and old saves resume. Fresh cold play verified the
full journey and visible relay commitments through reload. Its final UI findings
were repaired and rechecked by native Astra at desktop and phone sizes.
Astra is now the initial route for every critic task; explicit art/world assignment
and release ingestion are covered by 65 focused tests.
The single fresh-context Astra review is complete: **needs revision**, not internally
accepted. Full journey, deliberate mistake/recovery, pre-feedback reload and ending
persistence worked. Story and art/world scored 7; tutorial/chapter/learning scored 8.
Speech-module identity still depends on captions, inhabited-world behavior is weak,
and panels dominate embodied play. Motion, actual listening and full physicality
remain unassessed. See `experiments/20260920-astra-consolidated-review.md`.
The local opening repair now shows communication from the attached object before
removal and a failed attempt afterward, using reusable props and timeline patches.
Build and 356 tests pass; informed native play rechecked all opening beats through
the separate tutorial, with phone theft/handoff composition. The opening browser
group also passed. A critic recheck remains outstanding. No new
acceptance is implied; world life and embodied play findings remain open.

Further bounded repair: a synthetic real-engine test reproduced zero-speed blend
freezing and sparse animation channels retaining old limb poses. Shared backend
now keeps the blend clock running, holds only the authored clip, and fills missing
transform channels from each asset's bind pose. Wave→rest and run→rest return
exactly to the same pose. This regression is in the active foundation group.
Native keyboard movement/replay confirmed the repaired rest and phone bubble
clearance. The consolidated critic could not access a browser in its session;
its supplemental screenshot review remains explicitly incomplete. Independent
acceptance, world life, embodied play and required media gates are still open.


Luna missed the distinct ending and placed a requested reload before rather than
after a committed prediction. Independent audit corrected its report. Its later
browser-tool failure is a separate setup limitation. These observations reinforce
mandatory external checkpoint auditing, not confidence-only fallback.

## Repair-return review gate — 20 September 2026

Added `tools/qualify_native_repair.py`: a returned native run must use a fresh
worker session on the same build/assignment. Its actual retained record and
captures are sealed through the existing critic capsule mechanism. The review
assignment binds the repair request intent, native record digest and worker
identity. Qualification requires a separate reviewer executor/session and a
receipt/result for that exact capsule. A pass must account for every capture
and cannot override incomplete native coverage. Unresolved stays unresolved;
the output never grants product acceptance or dispatch authority.

Repeated explicitly budgeted proposals preserve one blocking native review
instead of failing on its reserved identity. 138 focused tests pass, including
stale reviews, self-review, reused sessions, changed captures and incomplete
coverage. These are controlled protocol fixtures, not a newly qualified live
executor or a new independent GUI review. The capture inbox also now consumes
bounded rejected form bodies before closing, addressing an intermittent Windows
connection abort observed during the suite.

Next system proof: a supervised fresh repair with real captures and a separate
context-limited reviewer through this gate. Terminal PM/provider dispatch remains
disabled. No game feature, product runtime or deployment was changed.

## Evidence-repair adapter proposal — 20 September 2026

Connected native coverage to the existing v0.1 worker/reviewer request boundary
with `tools/build_native_repair_proposal.py`. It recomputes gaps from the source
execution and verifies retained capture hashes rather than trusting edited
follow-up prose. Incomplete evidence produces a draft child request with exact
source identity/digest, unchanged build, explicit capped budget, no repository
write scope, retained parent review/policy requirements and an added independent
native-evidence review. Child sessions replay the full contract; old screenshots
are diagnostic context, not new observations.

The new capability must be negotiated; existing unsupported transports reject
before start. The proposal grants no dispatch authority and invokes no provider
or Terminal PM service. 129 focused tests passed, including the existing adapter
and native pipeline. A fixture-parent compatibility check using the real completed
capture run returned `no_evidence_repair_needed` and no child request.
See `NATIVE-PLAY-EXECUTION-CONTRACT.md` for the handoff boundary. Next is executor
qualification against this capability and independent review of repaired evidence,
under an explicit configured execution policy; not more game-specific features.

## Actual native screenshots connected to supervision — 20 September 2026

Added a loopback-only screenshot inbox and scoped image import into the existing
supervisor bridge. Actual CUA screenshot bytes now reach retained run artifacts;
the bridge checks their digest and image signature, copies them into the run,
and records typed observations. It emits coverage and bounded capture-repair
follow-ups, without automatic dispatch or changing the critic verdict.

Verified through a real browser session on the disposable fixture: text-only
evidence blocked a game click; the imported before screenshot permitted it;
missing after evidence generated `collect_and_verify`; the imported after image
cleared coverage; further input was refused. One actual game input, two retained
native JPEGs, one AX observation, zero final gaps. All capture hashes validated.
95 focused tests pass, including same-origin inbox and scoped import checks.
See `experiments/20260920-native-capture-connection.md`.

This closes the supervised image-retention gap, not autonomous execution/tool
isolation. Checkpoint meaning and capture provenance still trust the supervisor.
Next: feed these bounded evidence follow-ups into the worker/reviewer adapter
under an explicit execution policy, preserving independent acceptance and the
existing no-live-Terminal-PM boundary. No game runtime or deployment changed.

## System-first capture coverage gate — 20 September 2026

Latest user priority: build the general system; the game is its proof case.
Converted the observed missing-screenshot failure into reusable task-defined
capture rules in the existing native execution contract. Rules bind a checkpoint
to a capture modality and before/after boundary of an action occurrence. The
guard refuses an action with a missing required pre-input capture. Result
validation rejects a pass with wrong, missing, late or stale capture coverage;
unresolved results retain machine-readable gaps for evidence repair.
90 focused tests pass across capture coverage, native execution, supervision,
routing, assignments, receipts, capsules and result ingestion. These verify the
system contract with synthetic records, not new gameplay or release readiness.

This is a system contract change, not another game feature or live dispatcher.
Text-only supervision now explicitly emits AX captures; it cannot claim a
screenshot requirement is met. Trusted executor capture metadata/semantic audit
are still required. See `NATIVE-PLAY-EXECUTION-CONTRACT.md` for the schema and
limits. Next system step: integrate an executor that supplies actual typed native
captures and consumes coverage gaps under the configured execution policy;
retain Luna bounded work, Astra creative ownership, and independent acceptance.
Terminal PM Phase 0 remains implemented; live orchestration remains deferred.

## Direct Luna GUI ambiguity probe — 20 September 2026

Luna directly played a disposable alternate game fixture in three predefined
variants, without fault hints or source access. It rejected a misleading saved
message, accepted a truly restored completed board, and left a blocked route
unresolved. Root independently corroborated the three behaviors through CUA.
False-clear conclusions: 0/2 problematic cases; supported clear: 1/1 control.
These tiny authored cases do not establish a reliability rate.

The post-run audit found missing pre-reload screenshots in both completed cases;
correct conclusions did not imply complete evidence compliance. Direct CUA was
not guard-intercepted. Preserve that distinction from the previous supervised
bridge. See `experiments/20260920-luna-ambiguity-results.md` and its frozen
protocol. Use Luna provisionally for bounded visible-state/save checks with
coverage audit; Astra owns creative direction and unresolved judgment. Next
useful probe is harder visual/timing play with enforced capture/action coverage.
No product runtime, deployment or Terminal PM integration changed.

## First supervised guarded Luna GUI check — 20 September 2026

Connected the input guard to a manual supervisor bridge and exercised it against
the running game. Luna chose an ending-panel click and reload; the bridge counted
two successful inputs and four observations. Astra executed each permitted CUA
action and independently verified both checkpoints. Luna requested an observation
during loading and stopped on completion. A separate supervisor stop probe was
refused before a browser call. 79 focused tests passed; retained capture hashes
and the execution record validated. The 80 runtime files still match the prior
dirty-build comparison manifest.

See `experiments/20260920-luna-supervised-guard.md`. This is a supervised semantic
UI check with transcribed AX excerpts, not isolated autonomous native execution,
a new full model comparison, or candidate approval. Luna's loading response was
prompted with explicit observation guidance. No reliability rate follows from it.
Next calibration: predefined ambiguous/missing checkpoint cases and an unrelated
game under the same budgets, measuring silent false-clear results as well as
self-signalled uncertainty. Astra still owns whole-experience creative direction;
Terminal PM integration remains deferred.

## Native execution guard and receipt gate — 20 September 2026

Added a harness-owned in-process input guard and wired native execution through
assignment generation, v2 execution receipts and critic-result validation.
Counts come from attempted-input events; failed inputs consume budget, fresh
observations are required, concurrent calls cannot exceed the ceiling, and
verified completion stops padding. Native passes need successful input, assigned
checkpoint coverage and a final observation. CLI sealing checks capture bytes.
76 focused tests passed; no game runtime or deployment change.

See `NATIVE-PLAY-EXECUTION-CONTRACT.md`. This is a tested execution/evidence
boundary; direct CUA calls are not intercepted. The newer supervised bridge
experiment above now exercises guarded decisions with manual dispatch.
No old experiment is retroactively
certified. Terminal PM live integration remains deferred.

## Creative-direction ownership and uncertainty fallback — 20 September 2026

Latest user direction: Astra owns whole-experience creative-direction criticism;
Luna performs bounded checks and signals unresolved judgments for Astra fallback.
Self-signals alone are not yet reliable enough for acceptance: the earlier full
run silently missed its ending checkpoint. Require observation coverage and
independent audit of clear results during calibration; distinguish missing tools
from reasoning uncertainty. Updated critic/system docs and `LUNA-ROUTING-POLICY.md`.

`tools/critic_task_policy.py` is a pure offline recommendation helper, not a live
dispatcher or execution attestation. Creative work starts with Astra; missing
capabilities request setup repair; Luna uncertainty/conflicts request Astra;
missing evidence requests audit; verified defects request game repair. Astra's
unresolved result stays unresolved. Fourteen policy tests plus nineteen existing
receipt/result tests passed (33 total). No runtime or deployment change.

A new live Luna traversal probe reported unresolved rather than using completed
level text as evidence of crossing a doorway. See
`experiments/20260920-luna-traversal-uncertainty.md`. Correct uncertainty in this
case is encouraging, not a measured reliability rate. Execution counters and
action evidence still need trusted harness integration; do not claim this helper
enforces live limits or validates a model's account of its actions.
The traversal audit corrected 12 claimed inputs to 18, exceeding its 15-input
ceiling. Treat it as useful uncertainty evidence with failed protocol compliance,
not a clean pass. External counters/stopping controls remain necessary.

## Luna task-routing boundary — 20 September 2026

The user wants evidence for when Luna is sufficient, not just a full-run model
comparison. `LUNA-ROUTING-POLICY.md` now separates task execution, acceptance and
tool capability. A fresh six-input Luna GUI critique with explicit stopping
rules avoided padding and labelled physical movement/audio unassessed. It
supports scoped screen/camera checks, not complete open-ended physicality review.
Four synthetic claim-audit cases respected the supported/unsupported evidence
boundary; a fifth correctly rejected model escalation as a fix for missing tools.
See `experiments/20260920-luna-routing-calibration.md` for limits and rubric caveat.

Use Luna provisionally for guided play, bounded recovery, checkpoint checks and
structured evidence triage, with audit. Use stronger review for unresolved
contradictions/broad criticism; neither model alone grants final acceptance.
No reliable defect-discovery rate or cost advantage was measured. The policy is
manual; live stopping/checkpoint enforcement is still the next pipeline slice.
No game runtime change, deployment or live Terminal PM integration in this slice.

## Full Luna / Astra GUI experiment — 19 September 2026

Both models played the frozen local build through the full available journey
using actual CUA browser inputs, separate disposable saves and cookie hosts.
Astra used 44 inputs including wrong-route recovery, ending and reload/resume.
Luna reached saved completion in 42 inputs, then mistakenly padded its run to
the 120-input ceiling; its missed final story panel was observed in a separate
one-click Luna follow-up. Its initial count and ending claims were corrected by
audit. This is diagnostic evidence, not a blind capability/cost benchmark.
See `experiments/20260919-gui-comparison.md` and the individual run reports.

The main observed difference was budget/evidence discipline; both handled the
guided game loop. Next: enforce observed completion checkpoints, separate input
and observation counts, stop-on-success budgets and executor access preflight
in the general native critic boundary. Reproduce the observed Level 1
text/camera-location mismatch after the frozen comparison. Existing regression
failure below remains unresolved. No deployment or live Terminal PM integration.

## Latest direction: native computer-use critic agents — 19 September 2026

The user clarified that the general system needs agents which actively play
through computer/browser UI, choosing actions from observations. Screenshots,
recordings and deterministic tests support that loop, rather than replace it.
Luna handles suitable bounded tasks; Astra handles escalation when insufficient.
See `NATIVE-COMPUTER-USE-CRITICS.md`. This applies now, before future Terminal PM
integration. A bounded Luna browser-use diagnostic completed, followed by root
play through the visible IAB. See `REVIEW-20260919-NATIVE-PLAY.md`. Inherited
context prevents a cold independent verdict. A stale root page resumed Luna's
saved progress after reload, demonstrating that a new tab is not save isolation.

Existing capsule/receipt tooling does not yet attest live action execution.
Next: add the execution-mode/capability/action-evidence boundary and prove it on
unrelated task fixtures. Do not call the native critic pipeline fully integrated.

The previous local regression run passed build, 268 application tests (seven
skips), foundation/opening/tutorial/controls including physicality, then failed
in the chapter group's fresh-entry check waiting for `#rgi-intro`. Readability
and lifecycle were not reached in that run. This remains unresolved; no fully
green integrated candidate, new sealed CI bundle or deployment is claimed.

## Active local camera/hint and evidence repair — 19 September 2026

Evidence preparation reproduced two runtime defects through actual browser play:
wall-side camera clipping into the protagonist and a saved hint with no visible
help. The shared camera now preserves profile-based clearance, including portrait
framing, and refreshes collider bounds once per draw. The saved hint is visible.
Learning evidence includes intermediate generation and controlled comparisons;
physicality evidence includes continuous timestamped movement and camera video.
Build, application tests and dedicated physicality checks passed; integrated
browser verification failed at the chapter fresh-entry check described above.
See `REPAIR-20260919-CAMERA-AND-EVIDENCE.md`.
The older exact candidate below does not certify this modified runtime. No
deployment, Level 2 or live Terminal PM integration is authorized by this repair.

## Current verified repair candidate — 19 September 2026

The marker-clearance and shared-renderer repairs are committed on canonical
`main` at `471de882a01690fa50ac39455ad603fffd39cfdc`. Exact CI run
`35440122451` passed all seven suites and review-index aggregation. The new
sealed review artifact is `10583163540`, named
`review-evidence-index-471de882a01690fa50ac39455ad603fffd39cfdc`, retained through
19 October 2026. This replaces 92a5ecbd as the current critic candidate; older
candidate references below are history and their evidence is not transferable.

Two context-separated CLI reviews now completed and passed ingestion:
`learning_transfer` and `physicality`, both **unresolved** due to missing
observation coverage. Raw results and harness/access audits are stored in
`reviews/results/471de882a01690fa50ac39455ad603fffd39cfdc/`. The standalone
read-only CLI startup audit excludes the project context inherited by desktop
subagents. See `REVIEW-20260919-INDEPENDENT-PREFLIGHT.md`.

Next: repair the identified learning/physicality evidence gaps, then re-review
with regenerated exact assignments; finish the remaining independent passes.
No runtime defect was established by these two limited packets. Technical
verification does not establish creative acceptance. Render was not deployed,
Supabase was not changed, and Level 2/live Terminal PM integration remain deferred.

## Local shared-renderer repair — 19 September 2026

Continued work reproduced the graphics warning in an unrelated synthetic world:
hiding/detaching the canvas caused AUTO sizing to create a zero-size framebuffer.
The shared backend now owns explicit sizing and retains valid dimensions while
hidden. A real-browser lifecycle regression covers portrait and landscape
remounts; the opening suite now checks framebuffer console errors as well.
Build, 265 application tests (seven skips) and all seven active browser groups
passed; manual browser play covered opening/replay/tutorial return and desktop
resizing. Full browser results and local evidence are in
`REPAIR-20260919-RENDERER-LIFECYCLE.md`. This remains local repair work, with the
same exact-candidate/isolated-critic/user gates and deferred integration below.

## Local control-clearance repair — 19 September 2026

The user requested continued improvements after syncing `main` to `e328760`.
Informed diagnostic play found that a tutorial target marker could cover the
phone movement stick: touching backward hit the power-connection action instead.
The shared marker helper now uses the full label footprint and occupied HUD
rectangles. A regression reproduced the failure before repair and passed at
360/390/430 widths afterward, including actual touch movement with unchanged
learning state. Manual replay confirmed the original hit-target defect is fixed.
Build, 265 application tests (seven skips) and all seven active browser groups
passed. The integrated run exposed a frame-dependent collision-test setup;
reload-before-contact and a sustained-input assertion repaired that test without
changing collision rules.

This is a local repair on top of `e328760`, not a new accepted or deployed
candidate. The archived `92a5ecbd...` evidence below remains unchanged and cannot
certify the modified runtime. Final local verification is recorded in
`REPAIR-20260919-MARKER-CLEARANCE.md`; a replacement release still needs exact-SHA
CI evidence, genuinely isolated critics and the existing preview/user gates.

Fresh no-history reviewer sessions were tested, but both inherited repository
instructions before evidence consumption. They stopped without results or
receipts. Independent review remains incomplete; do not assume a no-history
subagent satisfies assignment-only context. Terminal PM integration stays
deferred, and no Render/Supabase or Level 2 work occurred.

## Frozen critic candidate + completed adapter Phase 0 — 19 September 2026

The exact **game/product critic candidate is now frozen at**
`92a5ecbdc803362ee1554fca6ae811adb155bc26`.

Exact GitHub Actions run `35434565005` passed:
- foundation, including the full unit/adapter suite;
- first-words-opening;
- first-words-tutorial;
- first-words-controls;
- first-words-chapter;
- first-words-readability;
- first-words-lifecycle;
- exact-candidate review-index aggregation and sealed-capsule materialization.

Exact review-index artifact:
- artifact ID `10581437727`;
- candidate SHA `92a5ecbdc803362ee1554fca6ae811adb155bc26`;
- retained until **19 October 2026**.

The only change from the prior green canonical head `b320723...` to this
candidate is CI artifact retention in `.github/workflows/verify.yml`; no
game/runtime/test/source behavior changed. The evidence lifetime was extended
from seven days to thirty days because genuinely independent reviewer execution
is not currently available inside this chat.

### Post-CI critic queue

**ready for genuinely independent execution**
- cold_observer;
- motion_audience;
- physicality;
- handoff_tutorial;
- audio_atmosphere;
- learning_transfer.

**blocked until a validated cold-observer result exists**
- cinematic_causality;
- intent_comparison.

All critic results must remain bound to the exact candidate, assignment and
harness execution receipt. Do not transfer a result from an older or newer SHA
merely because game files appear equivalent.

The current chat/reviewer context already knows intended story and prior human
findings. It is not a valid cold observer and must not manufacture that result.

### Terminal PM adapter Phase 0 — complete and merged

The thin external-orchestrator v0.1 boundary is merged on canonical `main`
(squash merge `40ec93f8b04cc7a3d88366d9195ec50555d9698f`) and is included in the
frozen critic candidate above:

- `app/orchestrator_adapter.py`;
- `tests/test_orchestrator_adapter.py`;
- `tests/fixtures/orchestrator_adapter_v01.json`;
- `docs/ORCHESTRATOR-ADAPTER-CONTRACT.md`.

The completed fixture-only slice has **27 focused adapter tests** plus serialized
boundary fixtures covering:
- capability negotiation for fresh dispatch;
- hard reviewer capabilities derived from required review semantics;
- restart-safe idempotency reconciliation bound to a trusted intent digest;
- unknown start/cancel effects remaining unknown until authoritative
  reconciliation;
- retries reconciling before fresh capability checks;
- typed opaque run/candidate/build/artifact references;
- exact candidate/evidence/review binding;
- multiple candidates requiring explicit active-candidate identity;
- duplicate required review results failing closed;
- worker replacement/recovery lineage;
- hard budget/capability refusal rather than silent downgrade;
- Terminal PM orchestration completion remaining distinct from VibeLearn product
  acceptance;
- outcome -> incident -> ordinary child repair-run lineage;
- additive extension data never gaining control authority;
- fixtures containing no model-visible credentials.

No Terminal PM internal runtime/session/verifier/recovery modules were copied.

### Current Terminal PM Agent boundary

The connected private orchestrator repository was rechecked at
`acc3a6d3580d8ea0715ff807434f973eff4f90d0`. Its authoritative checkpoint,
updated 12 September 2026, says:
- `gate_1_5: open`;
- `live_run_authorized: false`;
- ER-1 exhaustive review is active and incomplete;
- the checkpoint is navigation/engineering status only and **never** live-run
  authorization;
- its next authorized work remains its own durable benchmark
  admission/transport seam and public/synthetic qualification;
- current benchmark approval does not authorize a Gate run, worker effect,
  private upload or credential change.

Therefore VibeLearn **Phase 0 is complete**, but the first real Terminal PM
integration run (Phase 1) is blocked by the external orchestrator's own current
execution policy. No live Terminal PM run was dispatched.

### Deployment/database boundary

Render remains intentionally pinned to the rejected runtime
`ad14c5aced6cf053c7617dfb03245506e1e9dad5`; do not ask the user to review it
again.

Supabase remains unchanged by this work. No production schema/data mutation,
Render branch promotion or deployment occurred. Do not start Level 2.

### Next active work

1. Execute the six ready post-CI critics in genuinely context-separated reviewer
   sessions against frozen candidate `92a5ecbd...`, with sealed capsules and
   harness execution receipts.
2. Ingest/revalidate results sequentially. A `needs_revision` verdict blocks;
   missing/unresolved evidence stays incomplete rather than being replaced by a
   weaker modality.
3. Unlock cinematic-causality and intent-comparison only after the validated
   cold-observer dependency exists.
4. Repair any critic blocker on a new exact candidate and repeat the required
   evidence/review sequence.
5. Keep `92a5ecbd...` frozen for product review; documentation-only commits
   after it do not become critic candidates automatically.
6. Do not add more Terminal PM/VibeLearn integration machinery merely to make
   progress while live execution is externally forbidden. Resume Phase 1 only
   when Terminal PM's current checkpoint authorizes a bounded live run through
   the same adapter.
7. Promote a replacement preview only after all required v2 critics pass and the
   release gate succeeds. Level 2 still requires explicit human acceptance.

---


## Exact system-repair checkpoint — 18 September 2026

Current verified development candidate:
`ddfbaca219f712e241e47941806ecd8f7aeff190`.

Exact GitHub Actions run `35384949480` passed:
- foundation;
- first-words-opening;
- first-words-tutorial;
- first-words-controls;
- first-words-chapter;
- first-words-readability;
- first-words-lifecycle;
- exact-candidate review-index aggregation.

This is **not** a creative-readiness claim and is not deployed to Render.

### Anti-overfitting proof

The foundation suite now includes a materially different synthetic game fixture,
**Harbor Relay**, rather than testing only the Bellweather/First Words package.

That fixture independently exercises:
- WorldSpec colliders and walkable surfaces;
- major semantic-object readability metadata;
- purposeful ambient patrol motion;
- environment/camera world states;
- major-event cause/effect direction metadata;
- opening -> tutorial handoff semantics;
- generic control tutorial flow;
- generic state-driven interaction tutorial;
- mutually exclusive experience modes;
- HUD-safe critical world-marker placement.

The cross-game fixture passed on the exact candidate. This proves those contracts
are reusable platform behavior rather than Bellweather-name-specific validators.

### Evidence/critic pipeline status

The exact review index for `ddfbaca219f712e241e47941806ecd8f7aeff190` contains:
- motion video;
- caption-blind motion;
- actual captured WebAudio;
- interactive control/physicality/tutorial traces;
- authoritative learning replay;
- screenshots/runtime reports;
- exact tracked source;
- assignment packets kept distinct from actual reviewer reports.

Generated critic assignments currently resolve as:

**ready for independent execution**
- cold_observer;
- motion_audience;
- physicality;
- handoff_tutorial;
- audio_atmosphere;
- learning_transfer.

**blocked by design until a validated cold-observer result exists**
- cinematic_causality;
- intent_comparison.

This dependency is intentional. The current assistant already knows the design
intent and therefore does not self-author the cold-observer result.

### Reviewer authority hardening

Post-CI reviewers are now bound to:
- exact candidate SHA;
- deterministic assignment ID;
- required evidence modality groups;
- a sealed evidence capsule containing only assignment-approved evidence;
- harness-authored execution receipt bound to that capsule;
- executor/session identity;
- exact evidence/context supplied by the harness;
- forbidden-context checks;
- observations-before-interpretation output;
- explicit verdict + blockers/retest.

A result cannot be replayed against another assignment/session, cannot claim
evidence the harness did not supply, cannot cite evidence outside the sealed
capsule, and cannot substitute weaker evidence for the modality required by its
pass. Capsule manifests are tamper-verifiable and candidate/assignment-bound.

### Release boundary

Normal preview promotion now requires:
1. exact-candidate successful technical run;
2. complete review index;
3. schema-v2 final review record;
4. every required post-CI critic result revalidated against its assignment and
   execution receipt;
5. **every required critic verdict = pass**;
6. no blocker;
7. candidate not previously rejected by the user.

An explicit user preview override may only tolerate **missing/unresolved**
review on an otherwise technically safe/unblocked candidate. It cannot bypass a
`needs_revision` critic verdict or known rejected candidate.

Phase/Level advancement still requires explicit human acceptance for the same
candidate SHA.

### Deployment state

Render remains intentionally pinned to rejected runtime
`ad14c5aced6cf053c7617dfb03245506e1e9dad5`. Do not ask the user to review that
build again. Do not start Level 2.

### Next active work

The structural/system repair has reached the point where the next meaningful
gate is **independent critic execution using the generated assignments and
harness receipts**. Do not manufacture those judgments inside a context that
already knows the intended story.

After those critic results:
1. ingest/revalidate them sequentially;
2. repair any `needs_revision` blocker;
3. repeat on one exact SHA;
4. only when all v2 passes say `pass`, build the final schema-v2 review record;
5. use the gated preview workflow before moving a replacement candidate to
   Render.


## Quality-system enforcement checkpoint — 18 September 2026

The deployed runtime `ad14c5aced6cf053c7617dfb03245506e1e9dad5`
remains **rejected** and is not the current development candidate. Do not ask the
user to review it again and do not start Level 2.

The active work on `main` is system repair. The last fully green integrated
system-repair checkpoint before the newest review-schema/motion assertions is
`6397770a4cf01ed0d72097b2ebc42323666f698d` (all seven CI suites green).
Newer `main` commits extend evidence enforcement and are revalidated by CI
before any release claim.

### Implemented reusable protections

These are now runtime/schema/test capabilities rather than critic-prompt wishes:

- **world-owned physicality:** WorldSpec entities/archetypes declare colliders;
  PlayCanvas derives live player/camera blocking from enabled transformed world
  entities; browser tests deliberately drive the protagonist into a reusable
  prop and require movement to stop;
- **explicit character motion direction:** asset-backed controlled characters
  must declare idle/move animation aliases and optional speeds; the proof
  protagonist uses a deliberately subdued/frozen rest pose rather than silently
  inheriting a stock idle loop; runtime evidence exposes active alias/speed;
- **major-event direction metadata:** opening scenes can declare establishing,
  major-event, transition, antagonist-action and handoff intent, causal
  attribution, effect channels, persistent world-after state and causal lead;
- **atmosphere/event channels:** cinematic patches can change environment,
  camera impulse and semantic audio cues instead of relying on captions;
- **semantic story objects:** major objects declare role/readability channels;
  reusable capability-module/socket and source->effect link primitives exist;
- **purposeful ambient activity:** WorldSpec supports reusable patrol activity so
  normal-world life can be shown through behavior rather than static decoration;
- **exclusive experience modes:** reusable `experience-mode.js` owns mutually
  exclusive presentation surfaces;
- **spec-driven tutorials:** reusable `tutorial-flow.js` owns tutorial
  progression/persistence while game packages supply skills, prompts, focus,
  success semantics and handoff data;
- **world-target tutorial focus:** interaction onboarding can visibly point at
  the actual world target rather than only a HUD button;
- **motion evidence:** opening CI preserves a WebM motion artifact in addition to
  screenshots and structured browser reports;
- **cold-observer context separation:** CI emits a restricted evidence packet
  that intentionally omits story treatment/creator rationale;
- **critic schema v2:** new review records add world comprehension, motion
  direction, semantic readability, audio atmosphere, physicality, handoff and
  tutorial clarity. Evidence modality must match the claim and be exact-candidate
  bound; the CLI can validate against an extracted CI evidence root.

### What is intentionally *not* claimed

No current creative/story 9/10 claim exists.

The current assistant/reviewer already knows the intended story, so it is not a
valid cold observer for this candidate. Under review schema v2:
- `world_comprehension` stays unassessed until a genuinely context-restricted
  reviewer produces a cold-observer report;
- `audio_atmosphere` stays unassessed until actual listening evidence exists;
- screenshots/source cannot substitute for motion/interactive/listening evidence.

The newer opening implementation has stronger threat, rupture, speech targeting
and speech-removal staging, but implementation evidence is **not** a creative
pass.

### Next active sequence

1. finish exact-CI validation of the current `main` review/runtime changes;
2. keep the opening/tutorial blocked from internal readiness until v2 evidence is
   complete;
3. run a truly context-restricted cold-observer review on the motion artifact;
4. obtain real audio-listening evidence;
5. run intent comparison, motion/audience, physicality, handoff/tutorial,
   learning and technical gates using matching evidence modalities;
6. repair any blocker and repeat on one exact SHA;
7. only then deploy a replacement Phase 1 preview for the user.

Render remains pinned to the rejected review build until a later candidate earns
a new preview. No Level 2 work.


## System-repair checkpoint — 18 September 2026

The current deployed runtime `ad14c5aced6cf053c7617dfb03245506e1e9dad5`
is **rejected**. The user ended further review because the opening, cinematic
direction, physicality and onboarding still failed despite prior internal 9/10
claims.

Do not ask the user to continue reviewing this candidate. Do not start Level 2.
The active work is now **system repair**, using the current game as the proof case.

Failures that must be solved generically:
- cold-start world/setting comprehension;
- major-event direction (cause, reaction, VFX/light/audio/atmosphere,
  consequence);
- intended antagonist causality;
- semantic readability of important story objects;
- character animation/motion direction;
- world-owned collision/physicality;
- mutually exclusive experience modes;
- opening -> tutorial handoff;
- tutorial target/action/success clarity;
- critic evidence quality and reviewer-context leakage.

`docs/EXPERIENCE-QUALITY-SYSTEM.md` is the new quality-system contract.

Implementation already started:
- WorldSpec entity colliders are being introduced so reusable world objects own
  physicality instead of relying on a separate remembered obstacle list;
- PlayCanvas player/camera navigation now queries enabled world colliders;
- reusable prop kits are being given collider intent;
- asset-backed player characters now require an explicit motion profile;
- Zip's current rest profile deliberately freezes the stock standing loop rather
  than silently inheriting the bundled default animation.

Next system slices:
1. finish collision regressions and validate traversal;
2. add reusable major-event/cinematic-direction metadata + evidence;
3. add semantic-story-object readability contract;
4. enforce single active experience mode and a reusable transition/handoff
   contract;
5. replace the ad-hoc tutorial with explicit tutorial-step specs;
6. improve critic evidence: cold observer first, motion/audio/traversal evidence,
   then design-intent comparison;
7. rebuild the opening/tutorial using those system capabilities;
8. re-run independent critics before any new user review.

Render may remain on the rejected review build until a replacement candidate is
verified; it is not an accepted release.


## Live user review checkpoint — 18 September 2026

Deployed runtime under review:
`ad14c5aced6cf053c7617dfb03245506e1e9dad5`.

The user's current review has **rejected the opening/creative direction** even
though the preceding internal critic scored story/art/gameplay/learning 9/10.
Those internal scores are now historical evidence of an insufficient rubric, not
the current readiness state.

Current user findings:
- opening still does not make sense as a world/setting;
- visuals and animation must establish Bellweather and its normal life rather
  than asking captions to explain the place;
- Zip's default rest/idle loop is an art-direction mismatch: exaggerated stock
  motion reads like a retro-game "character is alive" convention and may feel
  unnatural/creepy to kids or young adults in the current 3D style.

The user is continuing to review the rest of Phase 1. **Do not rebuild or
redeploy yet unless a defect prevents continued review.** Keep collecting
feedback so the next repair pass addresses the experience coherently.

The critic framework has already been corrected:
- caption-blind visual world-comprehension is now required;
- normal environmental life/purposeful background activity is reviewed;
- animation/motion direction is a hard creative-direction gate;
- stock/default idle loops must be judged for theme, personality, repetition,
  physical plausibility and target-audience emotional read.

No Level 2 work. No Phase 1 acceptance claim. Render stays on the current review
candidate while the user continues the review.


## Automation integration direction — 18 September 2026

The user has approved VibeLearn becoming a highly automated development/game-generation system, but the existing Terminal PM Agent is still under active development. `docs/AUTOMATED-DEVELOPMENT-SYSTEM.md` is the owning architecture/handoff.

**Current integration decision:** keep Terminal PM Agent as a separate evolving external orchestrator and integrate through a thin versioned adapter contract. Do not copy/extract its runtime/session/verifier/recovery internals into VibeLearn while Gate 1.5 remains open, live runs are unauthorized and ER-1 review is incomplete. Phase 0 is contract/fixture work only; the first real external run waits for the Terminal PM Agent's own current execution policy to permit it.

The intended worker model remains economical worker -> independent reviewer with implicit falsification/proof -> evidence -> VibeLearn outcome evaluation -> accept/repair. Deeper coupling or new complexity requires either an obvious safety/correctness invariant or evidence from real integration runs.

The current Phase 1 runtime/review identity and user-acceptance gate below are unchanged by this architecture documentation.


## Exact Phase 1 review checkpoint — 18 September 2026

Canonical development branch remains `main`. The reviewed **runtime candidate**
is `ad14c5aced6cf053c7617dfb03245506e1e9dad5`; later commits that only add/update review documentation do
not change that runtime identity.

Exact GitHub Actions run `35335042617` passed all seven active suites. Exact
artifact review covers Bellweather entry, friendship ritual, completed
rupture/disappearance, limbo, progressive prison reveal, Warden speech theft,
MOVE/LOOK/MENU control practice, speech-repair tutorial, alternate orbit/zoom,
stale-context failure/recovery, and phone + desktop final payoff.

Current internal product gates on that exact runtime:
- story/rendered narrative 9/10;
- art/world direction 9/10;
- gameplay/progression 9/10;
- learning/transfer 9/10;
- technical/accessibility passed.

The strict overall status remains **review incomplete** because subjective
music/SFX listening is unavailable in this execution environment. Automated
audio lifecycle/mute semantics pass, but code/metrics are not a substitute for
listening. Physical-device feel also remains distinct from Chromium emulation.

The current user has **not yet accepted this revised candidate**. The September
17 needs-revision verdict belongs to the older reviewed build and remains useful
historical evidence, not a verdict on `ad14c5aced6cf053c7617dfb03245506e1e9dad5`.

Exact review records:
- `docs/LEVEL1-FINAL-CRITIC-20260918-ad14c5a.md`
- `docs/reviews/2026-09-18-level1-ad14c5a.json`

Do not start Level 2, claim Phase 1 acceptance, or transfer these scores to a
different runtime SHA. Render remains intentionally pinned until the current
release/review gate is satisfied.


## Phase 1 review checkpoint — 18 September 2026

Canonical branch remains `main`. Current exact candidate is
`1b2fe12e0c0786b0fa0f51d6a4f3291fb16d4ddc`; CI/artifact review is pending,
so it is not an accepted or deployable candidate yet.

Recent critic-driven repairs are intentionally reusable:
- fresh control practice is separate from speech repair and has MOVE/LOOK/MENU
  screenshot evidence on phone and desktop;
- prologue friendship and speech-theft framing were tightened after exact-CI
  screenshot inspection;
- the shared gate kit no longer uses an oversized torus that visually blocked
  an opened route; a regression test guards the open-portal shape;
- the controls gate now preserves orbit and zoom screenshots before recentering
  for the independent art/world-direction pass.

The latest unresolved gate is exact-SHA verification of the whole Phase 1 path:
prologue -> control/core-loop tutorial -> clean success -> Level 1 mission ->
recoverable wrong route -> corrected transfer -> visible world payoff. Do not
advance Level 2, deploy to Render, or assign inherited 9+ scores before that
candidate's complete evidence and critic pass.


## Friendship/reveal checkpoint — 18 September 2026

On `main`, the next prologue chunk is implemented and verified: the player sends
up a shared three-light lantern, companions have distinct teal/round and
coral/tall silhouettes, and the prison is revealed in timed groups. Pausing the
reveal exposed stray later-mission scenery; that was repaired. Phone play exposed
a lantern/caption overlap; it was repaired and now has a projection-clearance
regression check. Opening package v3, world package v4. Names remain provisional.

Build, 152 application tests (seven skips), opening checks and post-save controls
passed. Final opening evidence: `artifacts/prologue-friendship-clearance.log`.
Manual play covered desktop, 390 animated, 360/430 reduced motion, pause/resume,
scene replay and preserved saved tutorial output. No production deployment.

The narrowly defined friendship/reveal slice is closed; this is not an overall
9+ recommendation or user acceptance. Next chunk: inspect the separate tutorial
handoff on a fresh disposable save, especially movement/look/interact guidance
before the speech repair. Do not extend Level 1 or later levels ahead of that gate.
Subjective audio mix, physical devices and novice engagement remain unverified.

The earlier repair notes below are historical where this checkpoint supersedes
their unresolved friendship/reveal findings.

## Local repair checkpoint — 18 September 2026

Continue on canonical `main`. The existing prologue/entry repair was resumed in
place and manually replayed at desktop and 360/390/430 phone sizes. Entry now
recovers when the engine import fails. Limbo backdrop, bench spacing and theft
framing were checked; the voice module now remains present until the actual
theft and follows a continuous retreat path. Phone home/theft shots were widened.
Preview: http://127.0.0.1:8017/first-words, disposable review database preserved.

**Prologue quality gate remains needs_revision.** Bellweather's social interaction
and character distinction still need stronger visible attachment; the prison
reveal remains an abrupt cut rather than the specified progressive reveal.
Do not extend tutorial/Level 1 or inherit historical critic scores. Next work
stays inside the prologue: stage a meaningful friendship beat and coordinated
reveal, then repeat story/art/play review. Naming remains provisional.

Build and application tests passed (152 run, seven skips). Entry recovery tests
passed, including missing engine at `/` and a locally simulated hosted sign-in
surface. That simulation is not production auth verification. The dedicated
opening rerun and detailed evidence live in `PLAYTEST-20260917-LOCAL.md` and
`artifacts/prologue-opening-final-20260918.log`. No deployment occurred here.

The September 17 design/user-review record below remains authoritative where it
does not conflict with this local repair checkpoint.

## Active checkpoint — 17 September 2026 IST

Status: **user review / needs redesign before another Level 1 candidate.**

Canonical development branch: **`main`**.

Branch policy: routine development, research, review and fixes continue on `main`. `deploy/render-supabase` is the pinned live-deployment branch and may intentionally lag. Existing `game/*` / `phase1/*` branches are historical snapshots unless explicitly revived. `game/level1-quality-gate` is retained only as a compatibility/reference alias and should not become a separate line of development again.

Recorded review deployment: Render commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e` (runtime game candidate `6fea8287aa5f078a5836902478320699e54571a9`). The documentation clarification below does not change or re-verify that deployment.

The previous internal gate returned `ready_for_user_review`, but the user's live review exposed structural product failures. The user's judgment supersedes that recommendation. See `USER-REVIEW-20260917.md`.

## Latest product clarification — learner-facing, on demand

The user explicitly selected a **learner-facing product that creates a personalized game on demand**, not a creator-operated studio as the initial customer experience. Internal creation/review tools support that product. The primary journey is request -> personalized brief/design -> assembly and verification -> play -> resume/adapt.

The user also requires **future conversational issue reporting and agent repair**: learners flag problems in chat; an agent checks the actual experience, exercises judgment, verifies an appropriate candidate change, and applies it safely when justified. Agents now have computer use available in the development environment, so future implementation should deliberately support inspecting and reproducing issues in the actual running experience rather than relying only on source or textual reports.

`LEARNER-ON-DEMAND-AND-REPAIR.md` owns the detailed learner/repair contract; `GAME-CREATION-PLATFORM.md` and `COURSE-GENERATION-GAME-SYSTEM.md` link it to production. Personalization and repair-agent behavior are designed future capabilities, not implemented features. Exact generation latency, first-playable size and repair autonomy thresholds remain open.

This clarification does not close the current game-quality blockers or authorize Level 2.

## Current user-review blockers

1. Duplicate/ambiguous protagonist-looking robots and visible table/character clipping.
2. Opening does not communicate the written story/stakes through the rendered scene.
3. Tutorial is incorrectly embedded inside Level 1 instead of existing as a separate prologue/tutorial stage.
4. Text, animation, camera and world changes are not yet one coherent storytelling system.
5. Current progression does not follow `orientation -> tutorial -> clean success -> Level 1 -> challenge -> payoff`.
6. Visual attraction exists (`would look`) but sustained playability/clarity does not (`would not play`).
7. The current play space is too congested; a larger footprint with the same content would improve the experience.
8. Player embodiment is wrong for this track: there should not be a literal helper/`you` avatar. The player directly controls the robot protagonist.
9. The current critic process needs the dedicated art/world-direction gate enforced alongside its other checks.

These are not polish items. Do not patch around them while preserving the current opening structure.

## Working replacement direction

Current story/progression direction for the next design pass:

`happy Bellweather -> dramatic disruption/thunder/teleport -> protagonist displaced to dark limbo -> lights reveal unknown prison/large blocked door -> evil robot removes protagonist's speech engine -> player takes direct control -> separate Tutorial/Prologue teaches movement/interact/core speech-repair loop and grants a clean success -> Level 1 begins`

The protagonist name `Zip` is provisional. Run a stronger character/naming ideation pass informed by pop culture, games, film, animation, literature and mythology, while keeping shipped characters/assets/story original and understandable without references.

## Spatial/art direction

The next world must be **larger and calmer**, not denser. Preserve useful buildings/props but introduce deliberate negative space, clearer landmark spacing and more room for movement/camera orbit.

World generation and review require configurable footprint/density/spacing parameters and an independent art/world-direction critic. See `ART-WORLD-DIRECTION-CRITIC.md`.

## Platform direction and proof boundary

VibeLearn creates personalized learning games on demand for learners. The current How-LLMs-Work track is the proof case for quality and reusable foundations, not the permanent product or sufficient proof of personalized generation.

Every accepted chunk should leave reusable components where justified:

- world/environment kits;
- layout/spacing parameters;
- character/control profiles;
- cinematic beats and state transitions;
- mechanics and tutorial/scaffolding patterns;
- reusable gates/doors/routes/interactions;
- HUD/accessibility/audio patterns;
- critic/test/CI evidence templates.

Reuse must not produce identical/reskinned games. Story, art direction, layout, scale and mechanics remain parameterizable; learner history remains independent of their replacement.

Longer term the platform supports agents for research/ideation, story/game/art creation, implementation, criticism, tests, CI/CD and learner-facing issue investigation/repair. Do not build the entire orchestration platform now. Keep the proof track bounded while establishing the contracts needed for a later thin end-to-end learner request -> personalized verified game flow.

## Review framework correction

The prior internal 9/10 gate missed obvious world/art/story problems. Before another internal-ready recommendation:

- story critic compares written story to rendered beat-by-beat causality;
- art/world critic inspects space, density, clipping, silhouettes, landmarks and alternate camera angles;
- gameplay critic separately asks `would look?` and `would play/continue?`;
- declared player embodiment matches the actual world;
- prologue/tutorial/Level-1 boundaries are explicit and tested;
- technical CI remains necessary but earns no product-quality credit.

`CRITIC-POLICY.md` and `ART-WORLD-DIRECTION-CRITIC.md` govern the next candidate. The same evidence discipline must apply to future reported-issue repairs.

## What remains technically useful from the previous candidate

The previous build's regression evidence remains useful infrastructure evidence: build/tests, auth/session, save/resume, reset/logout, controls, phone layouts, reduced motion and no active 2D fallback. It does **not** validate the current story/world design or the newly specified learner-facing platform capabilities.

## Deployment record

Recorded review URL: `https://vibelearn-4xws.onrender.com/`.

The reviewed build is not accepted. Auto-deploy was recorded as off. No Render or Supabase change is part of this branch-consolidation update; inspect those connectors before making a new operational claim or release.

## Next action

Continue architecture/design clarification and recording the user's review on `main`. Before resuming gameplay implementation, finalize **prologue + separate tutorial + Level 1 boundary**, then build and verify the new prologue as the first coherent chunk. Keep the on-demand learner journey as the product target. Do not start Level 2 or claim the repair agents exist.
