# Presentation experiment — Zelda-style non-invasive delivery (22 September 2026)

Decision record for the user's directive: *"keep HUD/controls non-invasive, help in
game, don't obstruct; a sense of belonging to the world so I'm not thinking 'I have
to read this card now then continue with the game'. Take inspiration from Zelda
games. Experiment, take the most sensible guess now, document it."*
This record complements (does not replace) `GAME-PRESENTATION-GUIDE.md`; budgets and
rungs live there. Numbers come from `tools/check_presentation_budget.py` reports
(`artifacts/presentation-budget-5d0e8c2.json` before,
`artifacts/presentation-budget-redesign.json` after).

## What the research says (condensed)

- **Tears of the Kingdom / Breath of the Wild**: the HUD is "informative,
  functional, almost invisible". One short objective line at the bottom that fades
  while you play; all deep information lives in **one diegetic opt-in device**
  (Sheikah Slate) that exists *inside* the fiction; the opening hours teach through
  the world (shrine = tutorial room, Great Fairy = control lesson), not through
  text panels; the openings are nearly textless — the visuals carry the story.
- **Dead Space / Metro**: fully diegetic UI keeps tension because the player never
  leaves the world to consult an interface.
- **Player reaction pattern** (Elden Ring/BOTW discussions): players accept
  *discovery* uncertainty ("what do I do next?") but revolt at *interface*
  uncertainty ("where is this panel telling me things?"). Big DOM text overlays
  read as "a slideshow wearing game art" — exactly the rejected card behavior.

## Best-guess decisions taken now (each reversible after play)

1. **Opening = world + one fading subtitle line.** Title/kicker/dialogue moved to
   sr-only (screen readers keep the full text); the visible layer is a single
   bottom-centred line that fades after ~5.5s while the scene keeps playing.
   *Zelda basis: near-textless openings; read while watching, not instead of
   watching.* (game-opening.js, rescue-intro.css)
2. **Opening camera owns the frame.** Gameplay camera tools (recenter/zoom/help)
   never ride the cinematic; masthead and gameplay markers hide underneath.
   *Zelda basis: cutscenes expose no editor chrome.*
3. **Icon corner cluster replaces the utility bar.** ♪  ⏸ Skip as four small
   translucent icons top-right — the only always-available opening utilities.
   Back hides when there is nowhere to go; no dead buttons (P3).
4. **Control practice = floating prompt at the character, not a panel.** The stage
   card becomes transparent text anchored at Zip (≤ ~12 words), with the one action
   button; the world stays fully visible behind it. *Zelda basis: shrine-room
   teaching — do the thing, read almost nothing.* (`.stage-card.prompt`)
5. **Progress = hairline.** Story progress is a 3px segmented line at the bottom;
   the former 5-button bottom bar is gone.
6. **Thin dark band under the world removed** — full-bleed visual with floating
   controls, so nothing frames the world as a document.

## Measured outcome (real rendered pages, 1280×720 / 390×844)

| State | Before (5d0e8c2) | After | B1 ≤ 15% |
| --- | --- | --- | --- |
| Prologue opening — desktop | 38.4% | **6.1%** | pass |
| Prologue rupture — desktop | 36.6% | **6.6%** | pass |
| Prologue opening — phone | 43.3% | **12.8%** | pass |
| Tutorial prompt — desktop | n/a | **7.9%** | pass |
| Tutorial prompt — phone | n/a | **19.2%** | touch allowance ≤ 20% (input affordances only; see guide B1 note) |

Clipped elements, over-length text blocks and disabled visible controls: **0** in
all five measured states. Focal clearance measured clean (focal=0 hits).

## Honest caveats / next chunk

- This is the *most sensible guess*, not a validated convention. The player still
  pauses to press "Send up our lantern" / "Continue →" — a true Zelda pass would
  make story advancement itself ambient (auto-advance on beat completion, input
  only to skip). Try next: tap-anywhere-to-advance + auto-advance, removing the
  Continue button entirely.
- The learning machine is still an anchored card during missions. The guide's
  target is a **diegetic opt-in device** (inspect the machine in-world → focused
  panel, rung 5). Not yet built; B1's 22% panel budget exists for it.
- Phone tutorial prompt keeps the stick + camera cluster on screen (they are the
  lesson); the 20% touch allowance is an experiment, flagged for the next review.
- `word-machine.css` still carries dead selectors from the old opening skin; the
  shared shell change should be swept there before the next title reuses it.
- Legacy suites `opening_contract_browser` / `word_machine_browser` fail on routes
  retired in `c1be3ec` (pre-existing; they live in `legacy-*` groups, not the
  active gate).
- Reduced-motion keeps the subtitle permanently visible (correct per WCAG);
  auto-advance experiments must respect the same setting.

## Reuse (system, not game)

Every decision above lives in the **shared** layer: `game-opening.js` markup/
timers, `rescue-intro.css` presentation, the `.prompt`/`.parked` card modes, and
the budget tool's scenario schema (`coverage_max` + `coverage_max_reason` for
documented touch allowances). The next title inherits them by importing the same
two files; nothing here is first-words-specific except the copy.
