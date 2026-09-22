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
in real play states at 1280×720 and 390×844:

- **B1 Coverage:** visible screen-space UI (DOM outside the canvas, excluding
  sr-only) covers **≤ 15%** of the viewport in any gameplay state, **≤ 22%** in a
  player-opened focused panel. On a touch viewport a scenario may raise the limit
  to **≤ 20%** solely to afford on-screen direct-input controls (move stick, camera
  cluster) that no other input mode needs; the informational surfaces alone must
  still clear 15%, and the scenario must state the reason (`coverage_max_reason`).
- **B2 Focal clearance:** no UI element intersects the projected screen box of the
  current focal entity (player character during movement; interaction target while
  prompting) plus a 24px margin. The focal band (central 50%×60%) stays UI-free
  during movement and camera orbit.
- **B3 Containment:** every visible UI element is fully inside the viewport — no
  clipping at any edge, at any supported size.
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

Budget violations are defects, not preferences. A critic may rate `hud_readability`
or `presentation_integration` ≥ 9 only with a passing budget report on the exact
candidate plus live observation.

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
  `prefers-reduced-motion`, ambient auto-advance is suppressed (WCAG 2.2.4), so a
  *single* clearly-labelled visible control is **required** and is correct, not a
  defect. Reduced-motion play may show exactly one explicit action control per beat;
  motion-allowed play must show zero painted action/advance chrome.

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
  display), ≤ one sentence visible, full transcript in the opt-in log.
- **Learning content (the machine, the evidence)** → inspection view opened *from
  the object*, visibly belonging to it (title names the object), closable, returns
  to the same camera state. It may be rich — it is opt-in.
- **Progress** → diegetic where possible (door opened, light restored); a stage
  counter is at most a rung-5 line.
- **System (pause/menu/audio/reset/accessibility)** → one corner menu; secondary,
  allowed as overlay (P3 budget).

## Stage-specific shapes

- **Entry plaque:** ≤ 1 sentence + 1 action. Fades into the world; not a landing page.
- **Prologue/cinematic:** letterboxed world, rungs 1–3 only; controls reduced to Back/Skip per UI-UX rules; zero gameplay chrome visible. Plain beats carry **no persistent advance control**: the beat advances ambiently once its motion settles and a content-paced dwell elapses (tap-anywhere and keyboard advance it sooner); pause holds a beat indefinitely; reduced-motion play never auto-advances (WCAG 2.2.4); story-action and final handoff beats keep an explicit affordance. A pinned "Continue" button on plain beats is a defect.
- **Tutorial:** demonstrate in-world, prompt contextually (≤ 6 words), success is
  the teaching; text explains nothing the player didn't just do.
- **Mission:** world-first; objective line fades after ~5s; markers ≤ 2 words;
  machine/learning UI appears only via inspection of the machine. Canonical shape
  (validated in First Words, reuse it): a world-anchored toggle on the focal object
  carries the current goal as its label (rung 3) and opens the decision panel
  (rung 5); the panel folds back to the toggle; status feedback re-opens the panel
  once so the ephemeral cue is seen; a focused dialog folds the panel away so only
  one primary action is ever on screen; while the panel is open its own world choice
  markers fold away too (the panel owns that decision — Rule I3). Auto-summoned
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

A critic that cannot demonstrate a probe on the running candidate records it as
unassessed; screenshots of a static frame do not certify B2 (movement/orbit required).

## Enforcement map

| Rule | Mechanism |
| --- | --- |
| P1–P3, I1–I6, B1–B8 | `tools/check_presentation_budget.py` (mechanical, exact candidate) + live critic observation |
| Design-time surface declaration | `tools/check_learning_design.py` (existing attention/focus contract) |
| Review-time certification | `presentation_integration` criterion in `check_critic_review.py` V2 gates — requires budget report + interactive trace + cold-observer + live capture |
| Worker behavior | this section referenced from `AGENTS.md` build order and `GAME-UX-SYSTEM.md` |

## Anti-overfit note

Nothing here names Bellweather, Zip, the message machine or the first-words spec.
The rules apply to any generated game; the current track is simply the first
fixture. When a future game's fiction legitimately needs a different shape (e.g. a
text-adventure lane), the rung ladder still applies and the deviation is recorded in
that game's design package with a reason — not silently patched in code.
