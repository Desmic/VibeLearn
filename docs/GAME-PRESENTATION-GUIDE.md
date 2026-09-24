# Game presentation guide — HUD, interactions and information delivery

**Status — 22 September 2026.** System-level response to the user's rejection of the
world-anchored candidate (rated 1/10): the prologue was still a text overlay on the
world, and the tutorial/mission card obstructed and clipped inside the 3D view. The
21 September attention rule existed in prose but no measurable presentation contract
or critic criterion enforced it, and the internal reviewer certified 9/10 over the
exact failure the user had named. This guide turns the ten-game study, the recorded
user findings and wider industry evidence into **general, testable rules for every
generated game** — not a patch for one game.

Scope: what a worker may put on screen, when, where, and how a critic proves it.
Read `GAME-REFERENCE-STUDY.md`, `LEARNING-DESIGN-GATE.md`, `GAME-UX-SYSTEM.md`,
`ART-WORLD-DIRECTION-CRITIC.md` and `CRITIC-POLICY.md`. This guide binds
`presentation_integration` in `tools/check_critic_review.py` and is measured by
`tools/check_presentation_budget.py`.

## Evidence base (patterns, not celebrity)

Sources: our ten-game study (Ocarina, BOTW, RDR2, BG3, Elden Ring, Portal 2, Hades,
Witcher 3, Expedition 33, Outer Wilds); diegetic-UI analyses (Dead Space, Metro);
Elden Ring/BOTW UX write-ups and player debates; contextual-prompt practice in
Naughty Dog titles; mobile thumb-zone and occlusion guidance; player-reaction threads
on text-heavy overlays. These are observed techniques and reactions, not proof of
causal success. The recurring player verdicts:

- Players accept **uncertainty about where to go** (Elden Ring, Outer Wilds) but
  revolt against **uncertainty about how to act or what the interface says**.
- Large persistent text panels read as "a slideshow wearing game art" — the exact
  phrase class our own product standard forbids.
- Reading that happens **in the world or on objects the player chose to open**
  (Outer Wilds signals/ship log, Edith Finch, Gone Home, Dead Space) is described as
  immersive; the same words in a corner dialog are described as UI.
- Buttons that remain visible when they are not the current action erode trust and
  create accidental clicks (mobile playtests; platform UI reviews).

## The surface ladder

Every piece of player-facing information must be delivered on the **lowest usable
rung**. Higher rungs require a recorded reason in the game's design package.

1. **World event** — the scene itself changes: lighting, motion, sound, an object
   moving, a character reacting. Zero text.
2. **World object** — information lives in a thing: a note on a wall, a machine's
   display, a signal light, a door that will not open. The player reads/inspects the
   object by acting on it in the world.
3. **Spatial marker (ephemeral)** — a short label or glow anchored to a world entity,
   shown only while relevant, hidden when occluded or done.
4. **Contextual prompt** — one verb + one control, adjacent to the target, visible
   only when the action is available at that moment (Uncharted/TLOU pattern).
5. **Transient status line** — one short line, edge-anchored, fades after seconds
   (objective changed, something was saved).
6. **Focused panel (opt-in)** — opened by the player from an object or key, sized to
   its content, dismissible, never auto-summons over the focal subject.
7. **Blocking dialog / overlay** — errors, confirmations, accessibility content only.

**Rule P1 (channel budget).** Primary gameplay information — current goal, available
action, result feedback — must be delivered on rungs 1–4. Rungs 5–7 may *duplicate*
it for accessibility but must not be its *only* carrier. This generalizes the design
gate's `object_local / contextual_inspection / scene_focus` requirement from
declaration to observed behavior.

**Rule P2 (world-first cinematic).** Story beats are staged as world events with
short anchored dialogue (rungs 1–3). A cinematic may not be a paragraph + illustration.
Hard limit: **≤ 24 words of scene text per beat**, one speaker line at a time; if a
beat needs more, split it or show it instead.

**Rule P3 (no permanent dashboard).** At any moment, visible screen-space controls
must all be *currently actionable*. No disabled-but-shown utility rows, no stage
rail listing future stages, no buttons whose only purpose is to restate the world.
Persistent chrome budget: **one menu affordance + one audio affordance**, corner
anchored; everything else is contextual or in the menu.

## Measurable on-screen budgets

Applies to every generated game; measured by `tools/check_presentation_budget.py`
in real play states at 1280×720 and 390×844. Every state a scenario measures must name a
`screenshot` capture: a state nobody can look at is a state nobody reviewed, so the tool
reports a missing capture as an evidence gap rather than letting numbers stand in for the
critic's eyes:

- **B1 Coverage:** visible screen-space UI (DOM outside the canvas, excluding
  sr-only) covers **≤ 15%** of the viewport in any gameplay state, **≤ 22%** in a
  player-opened focused panel. On a touch viewport a scenario may raise the limit
  to **≤ 20%** solely to afford on-screen direct-input controls (move stick, camera
  cluster) that no other input mode needs; the informational surfaces alone must
  still clear 15%, and the scenario must state the reason (`coverage_max_reason`).
  **Narrow-sheet clause.** The 22% opt-in figure is an area budget calibrated on a
  desktop viewport, and it is not physically reachable on a phone: three readable
  44px decision options plus the learning readout already cost ~25% of 390×844
  before any chrome is counted. There, the allowance is bought with *geometry*, not
  with a looser number, and the tool verifies the claim before it applies the
  ceiling (`narrow_sheet`, `sheet`, `yields`, `opened_by`):
  the viewport is under 700px; the surface is a **flush, full-bleed bottom sheet**
  (≤ 8px from the bottom edge and both side edges — a card floating over the scene
  may not claim this); the direct-input chrome it replaces is **yielded**, not
  painted underneath it; the sheet is **≤ 40% of screen height** and **≤ 45% of
  screen area**; and the scenario proves the *player* opened it, because a state
  that cannot show the opt-in click in its own or an earlier step is an
  auto-summoned panel (rule I8). B2 focal clearance, B3 containment, B3
  reachability, B4, B5 and P3 stay **hard** — the clause buys area, never
  obstruction. The default (sheet folded) state still measures under the plain
  budgets, so a game may not live inside its sheet. **The ceiling never moves for
  text size**: a scenario may not raise `narrow_sheet_max` or
  `narrow_sheet_height_max` at all, and the tool rejects the attempt — see rule I10.
  The 23 September defect this replaces: the mission card auto-opened at 390×844
  and measured 44.9% coverage *with the focal character buried* (B2 9/9 probe hits)
  and its third option scrolled out of its own panel.
- **B2 Focal clearance:** no UI element intersects the projected screen box of the
  current focal entity (player character during movement; interaction target while
  prompting) plus a 24px margin. The focal band (central 50%×60%) stays UI-free
  during movement and camera orbit. In a game that places anchored world labels,
  the keep-out must be the shared `focalClearanceBox()` (body box **unioned with
  the focal ring** the checker probes at 2×margin), not the bare silhouette —
  clearing only the body still lets a label sit inside the subject's own space.
- **B3 Containment:** every visible UI element is fully inside the viewport — no
  clipping at any edge, at any supported size. Containment is measured per scroll
  surface, so content deliberately scrolled inside its own opt-in panel (a dialog, a
  reference list) is not "clipped". That exemption covers *reading* only: a painted
  **decision option** in a play state must be fully on screen with no scrolling, because
  a choice the player cannot see is not a choice they can make. The tool reports this as
  `unreachableActions`. The 23 September defect this blocks: the mission panel's third
  route notice rendered at y 694-779 in a 720px viewport and "passed" B3 because the card
  scrolls — the cold observer only noticed it by playing.
- **B4 Text size:** any single non-inspection text block ≤ 24 words; ≤ 1 primary
  action button visible at a time; secondary actions ≤ 2 and icon/labelled-small.
- **B5 Touch ergonomics (phone):** interactive elements ≥ 44px, inside the bottom
  thumb zone or top corners; nothing critical in the middle band the thumb covers.
- **B6 Subject presence:** the story subject of a shot (the character or object the
  beat is about) must occupy **≥ 12%** of canvas height, measured by projecting its
  world position and top point through the live camera
  (`world.projectEntity(id, [0, height, 0])`). A passing UI budget with a thumbnail
  subject is still a failed shot — wide "map view" framings read as content, not
  story. Related world rule: props must be **planted inside the terrain they stand
  on** (trunk position within the plate footprint); a floating prop is a defect even
  when it never enters a framed shot.
- **B7 Marker declutter:** visible anchored world labels must not overlap each
  other (4px tolerance) and must not cover the projected body box of the scene's
  subject (>8% of it). The reusable measurement is `projectedEntityBox` in
  `web/world-marker-layout.js`: games seed the marker layout's avoid rects with the
  current subject box so labels relocate around it with edge cues instead of
  burying it. The 21 September/22 September failure this blocks: four relay labels
  stacked into one column over the receiver at the payoff beat — under B2/B3/B1 the
  state measured clean because those check single surfaces, not mutual marker
  collision or subject occlusion by labels.
- **B8 Control surface (interaction model):** in a motion-allowed cinematic/story
  state, **no painted DOM control may sit in the bottom-centre nav band**, and **no
  painted DOM button may carry a world/story verb** (its accessible name must not
  match the beat's action/handoff label) — those actions belong to a diegetic world
  marker. Only system verbs in the corner cluster (menu / audio / pause / skip /
  look-back) are permitted as persistent chrome. The reduced-motion single-control
  carve-out (I6) is declared in the scenario (`reduced_motion: true`) and exempts
  exactly one action control. The site-wide keyboard skip link (`.skip`) is an
  accessibility escape hatch parked off-screen until focus, not painted game chrome,
  so it is allow-listed like the corner cluster and world markers. This is the mechanical gate that was missing when
  geometry-only budgets certified a permanent bottom button bar as "≤ 15% coverage,
  passed."
- **B8 also governs live play, not only cinematics.** A world verb may have **exactly
  one live surface at a time** (I1 + I3): if the same `data-action` is painted both on
  a world marker and on a DOM control outside the marker layer, a panel *about* the
  machine competes with the machine itself. `check_presentation_budget.py` measures this
  `dupCarriers` set in every state that names a marker layer. The 22 September second
  rejection was exactly this: the tutorial auto-summoned the message-machine card over
  the play space *and* kept its world-verb marker and a duplicate DOM "Connect the power
  lead" button on screen together — a state the cinematic-only B8 never measured. A
  tutorial must fold to the same opt-in toggle the mission uses; an auto-summoned panel
  over the play space is a P3/B1 defect in any mode, and it may not claim the raised
  opt-in `coverage_max` without declaring that the player opened it.

Budget violations are defects, not preferences. A critic may rate `hud_readability`
or `presentation_integration` ≥ 9 only with a passing budget report on the exact
candidate plus live observation. Run the complete scenario with `--candidate` set to
the committed 40-character SHA when preparing review evidence. A draft run without
that flag or a partial `--only` run can guide repairs but cannot qualify a review.
The review gate reads the report itself: its candidate, measured state list, pass
result and zero violations must agree. Declared focal, presence and subject checks
that cannot be measured fail as evidence gaps. A narrow sheet's allowance is tied to
the current page's observed player opening and expires when the sheet closes.

## Interaction design in the world

**Rule I1 (act on the thing).** If the fiction says the player operates a machine,
gate, or note, the click/tap target is the **world object** (or its spatial marker),
never a DOM button *describing* that object. DOM buttons are for menu, camera and
system verbs only.

**Rule I2 (affordance before instruction).** An interactable signals availability in
the world first (highlight/glow/sound on approach or gaze), then a contextual prompt
names the verb. A paragraph never substitutes for the signal. Tutorial steps may
briefly pin one prompt; the pin dismisses on success.

**Rule I3 (one decision per moment).** Exactly one primary action is offered per
state; alternatives appear on inspection or after the primary resolves. Overlapping
markers that each need reading are a defect (see B2/B4/B7). Once a world ephemera's
decision is consumed, its label folds away — the physical prop may stay in the
world, but spent notes must never keep competing with the payoff they produced.

**Rule I4 (reversible camera, never gated reading).** Information may be spatially
placed, but camera dexterity must never be a prerequisite to finish a step: markers
relocate to a free anchor or a transient status line repeats the content (rung 5).

**Rule I5 (failure talks in world language).** Error/recovery feedback is one short
line near the failed action, naming what to do next; no stack of alerts, no
jargon, no state loss (Hades pattern bounded by `LEARNING-DESIGN-GATE.md`).

**Rule I6 (ambient, world-first control surface).** Advancement and story actions are
performed *in the world*, never from a persistent control bar. Concretely, in a
cinematic/story state:

- There is **no persistent bottom-centre control bar** and **no permanent "Back /
  Next" nav pair**. A always-visible nav button is the exact "permanent dashboard"
  P3 forbids; the 22 September rejection ("what is this Take control / Back at the
  bottom centre?") is this defect resurfacing because the shared opening controller
  hard-coded a `.rgi-nav` bar.
- A plain beat advances **ambiently** (auto once motion settles + a content-paced
  dwell), or by tapping the world, or by keyboard. It shows no advance control.
- A story-action beat ("raise the lantern") is performed by **acting on the world
  object** — its diegetic spatial marker (rung 3/4) or tapping the object itself —
  not a DOM button that *names* the world verb. A DOM button describing a world
  action violates I1 even when it is the only way to proceed.
- The final **handoff is ambient**: the world simply becomes live and direct-control
  begins; at most a brief fading cue (rung 5), never a painted "Take control" button.
- **Accessibility carve-out (not a loophole):** when the player has
  `prefers-reduced-motion`, ambient auto-advance is suppressed (WCAG 2.2.2 Pause, Stop, Hide), so a
  *single* clearly-labelled visible control is **required** and is correct, not a
  defect. Reduced-motion play may show exactly one explicit action control per beat;
  motion-allowed play must show zero painted action/advance chrome.

**Rule I7 (recovery never re-offers the failed choice).** A recovery beat names the next
attempt in world language (I5); the options presented with it must be only the choices the
player has *not* already resolved into this exact output. Offering the spent choice again
makes the words on the card ("supply a better sign") contradict the controls, and a replayed
identical input produces a byte-identical failure — the player pays for the machine's
determinism and learns nothing new. Determinism stays available in the world itself (the
sign board is still there to re-scan deliberately); the panel's job at the moment of
recovery is the open question, not the answered one. The 23 September cold observer walked
into this seven times: "Wrong route" → supply the same old sign → identical sentence →
identical "Wrong route".

**Rule I8 (a narrow viewport never receives an unasked sheet).** On a viewport under
700px, no beat may auto-open a panel: the result line rides the world-anchored opt-in
carrier (rung 3/4) and the player decides whether to open the surface. The reason is
arithmetic, not taste — a readable decision sheet on a phone costs 25–40% of the screen
(B1 narrow-sheet clause), so an unasked one *is* the obstructing-panel defect at a size the
desktop budget was never written to describe. Auto-open stays permitted on wide viewports,
where the same panel fits the 22% opt-in figure. `check_presentation_budget.py` enforces the
consequence: on a narrow viewport an opened surface may only claim its raised budget with a
flush bottom-sheet geometry **and** a scenario step proving the player clicked the opt-in
control. The 23 September defect: the wrong-route beat auto-summoned the mission card over
the character on a phone.

**Rule I9 (a beat keeps its carriers when the screen shrinks).** Every rule above polices
*over*-delivery, so the mirror-image failure passes them all: on 23 September the phone
build hid all three world route boards — their labels no longer fitted the narrow safe band,
so the placement system hid them — and coverage, clipping and overlap each reported a clean
number while the mission's central decision had no readable surface anywhere on screen. A
declared carrier of a beat's decision may slide to the nearest free space and edge-cue back
to its world object; it may not be deleted for lack of room. Mark such labels in the world
layer (this game: `data-carrier`) and let `placeWorldMarker(..., {parkWhenFull:true})` do the
sliding. `check_presentation_budget.py` enforces the consequence with a scenario-declared
`carriers` floor (`{selector, min}`): a measured state that paints fewer carriers than the
beat owes fails. Off-camera is not off the hook — a carrier whose object is out of frame
still owes the player an arrow, so declare it as placeable from `inFront`, not `visible`.

**Rule I10 (a bounded surface sheds before it scrolls).** Every budget above is
measured at the build's own text size, and that is where the 23 September blind spot
was: the phone sheet passed all of them at 100% text and, at the WCAG 1.4.4
accessibility viewport (200% text), put its third decision option 123px below the
bottom of the screen. A player who has to scroll a decision to finish reading it has
not been given that decision, so the surface adapts instead of the budget moving:

- The scenario measures each decision beat a second time with `"text_scale": 2`. The
  tool stamps the enlarged text on the live page *before* the beat's steps run, lets the
  game re-layout, then measures the same B1/B2/B3/I9 figures. No ceiling is relaxed for
  the enlarged state, and asking for one fails (see the narrow-sheet clause above).
- A height-bounded surface ranks its own optional sections by rung with
  `data-shed-item="<rank>"` (lowest rung first) and calls
  `fitBoundedSurface(surface)` from `web/surface-fit.js` after it renders and on a slow
  timer while open (a player's text size fires no event). The fitter hides ranks, lowest
  first, until the content fits, and converges in one pass in both directions: when room
  returns it takes back everything it can afford and keeps only the shed it still needs,
  so the surface never spends several ticks wearing the previous text size's layout.
- What may shed: framing the world already carries (chapter eyebrow, prose detail,
  captions, the readout duplicated by a world object, an option's quoted text when its
  name identifies the choice). What may never shed: the question, an option's own name,
  any control that is the only way to perform the beat, and **anything the game teaches**
  — a learning hint opts out of the ladder with `data-critical`, the same marker the
  world layer uses for a carrier that must not fold. A hint the player has to ask for and
  that then vanishes for lack of room is not a smaller hint, it is a hint that never
  happened, so the beat that cannot fit it is the beat with too much text on it. Shed
  text stays in the element's accessible label, so assistive tech and the tests keep the
  full sentence — an unshedable line does not get that escape, so its authored length is
  the thing that changes.
- Rank by what else carries the meaning, not by what is longest. A beat's causal line —
  the sentence that says *why* this happened — outranks an option's quoted world text,
  because the sign board in the scene already shows that text while nothing else repeats
  the lesson. Where two rungs cannot both fit, the ladder decides which half of the beat
  survives, so that ordering is a learning-quality decision, not a layout one.
- Ranking is *exhaustive or the rule is decorative*: every child of a bounded surface
  that is not the decision itself carries a rank, including prose the beat appends into
  the button container at run time. The 24 September repair was exactly this — a
  five-line "why it failed" paragraph dropped into the decision container had no rank,
  so the fitter could not see the 168px that was pushing the choice off the screen, and
  the ladder reported "everything shed" while still overflowing.
- A shed declaration outranks layout. `[data-shed-item].shed{display:none}` must win
  over a per-viewport rule that happens to set `display` on the same node, or a rung
  keeps its height while claiming to be gone; the shared stylesheet carries that as
  `!important` on the one rule, with the reason beside it.
- If everything sheddable has shed and the decision still does not fit, the beat has too
  much text on it at that size — fix the authored labels or split the beat. Report the
  overflow; do not raise the number. The checker says which of the two causes it is: a
  B3 overflow violation carries the surface's own tree, every child labelled with its
  rank, its `CRITICAL` opt-out or `UNRANKED`, and its height, so the answer is in the
  report rather than in a re-run.
- The never-shed claim needs a number behind it, so declare the instruction line as an
  `I9` carrier floor in the same state (`{"selector": "#actions [data-learning-hint]",
  "min": 1}`). Then the two failures the ladder can produce are both measured: the beat
  that hides its own teaching, and the beat that keeps it by pushing a choice off the
  bottom. The 24 September beat failed the second one until its three option labels lost
  a "Predict:" prefix the question above them already said, and its hint lost a sentence
  the INPUT line already showed.

**Rule I11 (a control is its effect, not its flag).** A preference the player can set
(mute, reduced motion, and each future one) has **one reading rendered everywhere it
appears**: the module that owns the preference exports the glyph, label and pressed
state, and every surface paints from that. Hand-written copies drift — the 24 September
mute check found the opening's corner button spelling "muted" with a different combining
stroke than the masthead's, wearing a static `Toggle opening sound` label for a
preference that is in fact global and survives a reload. And the gate measures what the
control **does**: reading `preferences.muted` after a click only proves a boolean moved.
Play the real output — decode the game's own master-bus capture and assert its sample
peak collapses while the score is still running, then confirm the same preference is
still in force after a reload. A button that changes only its own icon passes a
flag-check and is broken.

One control is not enough either: a preference must be **declared** in one registry and
**applied** by it. `web/preferences.js` owns the id, default, effective reading (the
operating-system signal is the default, an in-game choice overrides it), glyph, label and
storage key for every preference a game offers, and it writes the consequence into the
document — `html[data-motion]` for motion, `body.xp-hidden` for XP. Stylesheets key off
that one hook, not off a private `@media (prefers-reduced-motion)` restatement: a copy
that watches the OS signal alone gives the player's own toggle no force, which is the
same defect as an icon that flips nothing. A surface carries a preference by marking its
control `data-preference="<id>"` and letting the registry paint it; nothing else chooses
a glyph, a word or a `checked` state. Because the registry enumerates its own ids, the
gate compares every painted carrier against the registry reading (`prefDrift` in
`tools/check_presentation_budget.py`) instead of a hand-listed set of buttons, and a
control that disagrees is reported per state.

**Rule I12 (a sentence the player must know reaches the eye).** Rungs 1–6 are a
ladder of *where* information lives; none of them says information may live **only**
in the screen-reader channel. Text parked at zero area, off-viewport or clipped out
of sight is invisible to every count that measures painted surface — coverage, word
budget, carrier floors — so a game can satisfy all of them while its story and its
instructions exist for exactly one sense. That is the 24 September defect: the
opening's scene caption was moved *into* `aria-live` "for accessibility", which left
`#rgi-title` and `#rgi-body` painted nowhere while the world played on, and no
metric moved. Narrative, goal and consequence must be painted for a sighted player
hearing nothing, and the announcement is the duplicate, not the original.

The checker measures this structurally: for each in-tree, visible, non-zero-area
text node it compares that node's content words against the corpus of **painted text
nodes only**, and a line whose words appear nowhere on screen is a violation. Two
exemptions are deliberate. `aria-label` is excluded from the painted corpus, because
the world object's own label otherwise restates the scene and masks the defect. And
an element carrying `aria-live` is **not** a candidate: an always-present narration
region is audio description of the world, which is correct practice, and flagging it
would push a build toward removing the access instead of adding the picture.

**Residual hole, stated:** the exemption means an instruction that exists *only*
inside a live narration region is not caught here. It is caught by I9's declared
carrier floors and by a critic who plays the beat — see CP13.

**Why this matters** (the evidence behind I1/I6): diegetic, lowest-rung delivery is
what keeps the player *inside* the fiction. Persistent non-diegetic chrome is the
strongest immersion breaker there is — it forces a "cognitive separation between
player and character" and reminds the player they are "manipulating software rather
than surviving a lived environment" (diegetic-UI analyses; Dead Space / Metro). The
BOTW/ToTK opening hours teach and advance through the world with almost no UI; a
bottom bar that talks to the player is the pattern those games deliberately removed.

## Information presentation (what goes where)

- **Goal** → world signal + (phone only) one-line transient status; never a card
  header that persists for a whole stage.
- **Narrative/dialogue** → anchored to the speaker (speech bubble or in-world
  display), ≤ one sentence visible, full transcript in the opt-in log. A cinematic
  line that has no speaker to anchor to rides one **ephemeral painted band** above
  the world: one line group at a time, held for its own reading time, briefly cleared
  between groups, last line held until the beat advances. Stacking the groups is a
  card (B1); absolutely positioning them independently lets two land on each other.
- **Learning content (the machine, the evidence)** → inspection view opened *from
  the object*, visibly belonging to it (title names the object), closable, returns
  to the same camera state. It may be rich — it is opt-in.
- **Progress** → diegetic where possible (door opened, light restored); a stage
  counter is at most a rung-5 line.
- **System (pause/menu/audio/reset/accessibility)** → one corner menu; secondary,
  allowed as overlay (P3 budget).

## Stage-specific shapes

- **Entry plaque:** ≤ 1 sentence + 1 action. Fades into the world; not a landing page.
- **Prologue/cinematic:** letterboxed world, rungs 1–3 only; controls reduced to Back/Skip per UI-UX rules; zero gameplay chrome visible. Story text rides the ephemeral painted band above (I12) — never an announcement-only channel, and pacing that sequence so the band cannot drift out of step with what is painted. Plain beats carry **no persistent advance control**: the beat advances ambiently once its motion settles and a content-paced dwell elapses (tap-anywhere and keyboard advance it sooner); pause holds a beat indefinitely; reduced-motion play never auto-advances (WCAG 2.2.2); story-action and final handoff beats keep an explicit affordance. A pinned "Continue" button on plain beats is a defect.
- **Tutorial:** demonstrate in-world, prompt contextually (≤ 6 words), success is
  the teaching; text explains nothing the player didn't just do. The tutorial uses the
  **same opt-in machine toggle as the mission** — its decision panel stays folded behind
  the world marker that carries the verb, and never auto-summons over the play space.
  Only the transient floating control-practice prompt (rung 4) rides the character; the
  teaching panel is opened by the player, exactly as in the mission shape below.
- **Mission:** world-first; objective line fades after ~5s; markers ≤ 2 words;
  machine/learning UI appears only via inspection of the machine. Canonical shape
  (validated in First Words, reuse it): a world-anchored toggle on the focal object
  carries the current goal as its label (rung 3) and opens the decision panel
  (rung 5); the panel folds back to the toggle; status feedback re-opens the panel
  once so the ephemeral cue is seen **on a wide viewport only** — on a phone the beat
  leaves the panel folded and the toggle carries the result line (rule I8), where an
  opened panel is a flush bottom sheet that yields the move stick and stops below the
  character's focal ring (B1 narrow-sheet clause); a focused dialog folds the panel
  away so only
  one primary action is ever on screen; while the panel is open its own world choice
  markers fold away too (the panel owns that decision — Rule I3); with the panel folded
  every option the beat asks about stays stated on screen at both viewports, parked with
  an edge cue if it no longer fits (Rule I9). Auto-summoned
  persistent panels over the play space are a P3/B1 defect, not a style choice.
- **Payoff/recap:** opt-in panel is fine here (player is not navigating); keep B1/B3.

The first best-guess implementation of these shapes is recorded in
`PRESENTATION-EXPERIMENT-ZELDA-20260922.md` (decisions, measurements and open questions).

## Worker checklist (before submitting any chunk)

1. Name the rung for every piece of info in the chunk; justify any rung ≥ 5.
2. Play it; capture 1280×720 + 390×844 at every state; run the budget tool; fix
   violations before writing the review record.
3. Ask: "If I delete this text, does the player still know what to do?" If yes,
   delete it; if no, stage it in the world instead.
4. Check every overlay against B2 while the character moves and the camera orbits.
5. Check every opening/cinematic beat against B6 in a live capture: is the subject
   big enough to read emotion, and are its feet (and nearby props) on the ground?
6. Reach every recovery/failure beat in play and check its option list against I7 and
   B3 reachability: spent choices must not be re-offered as open questions, and no
   decision option may depend on scrolling. Cover these states in the budget scenario,
   and pin the option list with a browser assertion so it cannot regress. Give each
   phone state its own `viewport` + `goto` + walk rather than a mid-walk `resize`:
   `resize` re-runs the media queries on a DOM the player never met at that size, so it
   measures a layout the game does not actually produce.
7. Play the whole chunk at 390×844 and name every panel that appeared without being
   opened (I8). Then open each one yourself and check it is a flush bottom sheet: below
   the character's focal ring, full-bleed, under the height cap, with the move stick and
   camera cluster gone (B1 narrow-sheet clause).
8. At the narrow viewport of each decision beat, count the carriers you declared in the
   budget scenario and confirm they are all on screen (I9). A beat whose world labels
   vanished because they did not fit is under-delivery, not tidiness: park them with an
   edge cue toward their object instead.
9. Give every phone decision beat a `"text_scale": 2` twin state in the budget scenario,
   rank the sheet's optional sections with `data-shed-item`, and play the beat at 200%
   text yourself: the question and every option name must be painted, and nothing may
   need scrolling inside the sheet (I10). If the sheet cannot fit them, shorten what the
   options *say* — do not touch a budget number.
10. Set every preference the game offers, then reload, and judge each one by what the
    experience does with it (I11) — sound is measured from the captured output, motion
    from what the world renders — not from the flag the button wrote. Check that all
    surfaces offering that preference read identically in glyph, label and pressed state,
    and that the label does not claim a narrower scope than the setting has.

## Critic probes (fresh context, actual play — not source reading)

- CP1: Point at the screen: "Where do you look to know what to do?" An answer of
  "the box" instead of "the world/the machine" fails P1.
- CP2: While moving the camera, does any UI cover the character or the current
  target, or clip off-screen? (B2/B3 — reproduce, don't assume.)
- CP3: During the prologue, count paragraphs and permanently visible buttons. Any
  paragraph > 24 words or > 2 always-visible utility buttons fails P2/P3.
- CP4: Try to perform the fiction's core verb (operate the machine). Does the player
  click the machine or a panel about the machine? Panel-first fails I1.
- CP5: Hide all DOM text (runtime toggle). Can the player still infer goal + first
  action within 30 seconds? Total dependence on text fails P1 for that state.
- CP6: Read every visible button label: is each currently actionable? Disabled or
  future-stage controls visible fails P3.
- CP7: In **live play** (tutorial/mission, not only the cinematic), does any verb the
  fiction performs in the world appear on a DOM control *while its world marker is also
  on screen*, or does a panel summon itself over the play space without the player
  opening it? Either fails I1/I3/B8 — reproduce in the tutorial's first beat, the state
  a cinematic-only check misses.
- CP8: After the game's hardest decision, deliberately repeat it unchanged. Does the
  game re-offer that same choice as if it were still open, and does repeating it produce
  an identical failure with no new signal? Fails I7. Then check every option the panel
  offers is fully visible at the current viewport without scrolling; a reachable-only-by-
  scrolling option fails B3 reachability even though the panel "contains" it.
- CP9: On a phone viewport, reach the beat the game most wants to explain (its failure
  beat). Did a panel appear that nobody opened? Fails I8. Now open it yourself: does it
  cover the character, float with a gap at the bottom, keep the move stick painted under
  itself, or push an option out of its own scroll area? Any of those fails the B1
  narrow-sheet clause — the raised budget is bought with sheet geometry, not granted.
- CP10: On a phone viewport, at each beat that asks the player to choose, read the screen
  with the panel closed: is every option still stated somewhere — a world label, an edge
  cue, one anchored line? If the choice has simply disappeared because its labels did not
  fit, the beat fails I9. Numbers that only measure how much UI is *present* will report
  this as an improvement, so check it by looking.
- CP11: On a phone viewport, set the text to 200% and reach a beat that asks the player
  to choose between three or more options. Is every option painted without scrolling, and
  is the surface the same size it was at normal text? An option below the fold fails I10;
  so does a sheet that got taller to fit them — that trades the decision for the world.
- CP12: Operate every preference control in the running game, then reload. Did the thing
  it claims to change actually change — is the sound really absent, does the reduced-motion
  world really stop moving — and is the setting still applied after the reload? Then find
  a second control for the same preference and compare glyph, label and pressed state. A
  control verified only by the flag it writes, or two surfaces that spell the same state
  differently, fails I11.
- CP13: Mute the sound, or play with the assistive channel off, and watch a story beat
  and an instruction beat from start to end. Write down the sentences you actually saw
  painted, then compare them to the sentences the game means you to have — open the
  announcement channel or read the beat's text if you need the source. Any required
  sentence that arrived only as an announcement fails I12. Then do the inverse: is a
  *required* instruction present only inside a narration region that I12 exempts? That
  one is your finding, not the tool's, and it fails I9.

A critic that cannot demonstrate a probe on the running candidate records it as
unassessed; screenshots of a static frame do not certify B2 (movement/orbit required).

## Enforcement map

| Rule | Mechanism |
| --- | --- |
| P1–P3, I1–I10, I12, B1–B8 | `tools/check_presentation_budget.py` (mechanical, exact candidate) + live critic observation |
| I11 | `web/preferences.js` is the only owner of a preference's reading, wording and document effect; `tools/check_presentation_budget.py` enumerates its `data-preference` carriers and reports `prefDrift` against the registry, while the game's own browser gate decodes captured output across the control instead of asserting the flag |
| Design-time surface declaration | `tools/check_learning_design.py` (existing attention/focus contract) |
| Review-time certification | `presentation_integration` criterion in `check_critic_review.py` V2 gates — requires budget report + interactive trace + cold-observer + live capture |
| Worker behavior | this section referenced from `AGENTS.md` build order and `GAME-UX-SYSTEM.md` |

## Anti-overfit note

Nothing here names Bellweather, Zip, the message machine or the first-words spec.
The rules apply to any generated game; the current track is simply the first
fixture. When a future game's fiction legitimately needs a different shape (e.g. a
text-adventure lane), the rung ladder still applies and the deviation is recorded in
that game's design package with a reason — not silently patched in code.
