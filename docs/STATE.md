# Current state — LLM learning-game proof track

One authoritative status. Anything older lives in `docs/history/STATE-20260921-24.md` or
`docs/history/STATE-20260918-20.md`; those are narrative, not authority. "Automated checks
passed", "experience review passed" and "user accepted" are three different claims below and
are never merged into one.

## Candidate under review

- Branch `docs-readthrough-20260921`. Last measured candidate `05f3988f9c0c2248cee21f874dac9df1ff6f4feb`;
  machine-level harness work has landed since (`96f7d81`, `417a32e`), which changes no player-facing
  surface. Not merged to `main`, not pushed; that happens only on the user's word.
- **No candidate is reviewable right now.** The working tree carries another agent's uncommitted
  gameplay, test and fixture edits, so there is no SHA that equals the tree a playthrough would
  observe. The review gate requires `--candidate` on a clean tree for exactly this reason: freeze
  first, then play.
- Player-facing content since the user's last look at the game: the opening's story text is painted
  in the world band instead of living only in the screen-reader channel (`ec8789a`), and preferences
  (sound, music, effects, motion, XP) have one owner that also applies them, so an in-game toggle has
  force instead of only flipping its own icon (`05f3988`).
- One cold critic pass has since observed this content and scored it below the bar (see Evidence
  status). The user has not seen any of it.

## Evidence status

| Claim | State |
| --- | --- |
| Automated checks on `05f3988` | Passed: 426 unit tests (7 skipped), full 23-state presentation scenario 0 violations with `prefDrift=0` and `announcedOnly=0` in every state, `first-words-opening` browser group passed |
| Automated checks on the dirty tree (25 Sep, re-measured) | Passed: `manage.py build`, 434 unit tests OK (7 skipped) in 71 s. Not a candidate measurement — it includes uncommitted work |
| Automated checks not yet re-run | The five other active Level 1 browser groups (tutorial, controls, chapter, readability, lifecycle) were last run on `ec8789a`; they need the frozen SHA, not a rescheduled slot |
| Machine-level harness repair (25 Sep) | Passed, measured: ownership is the browser process not its port (`list`/`--reclaim` can no longer mistake a reused 9333 for a live owner); the frame probe stops repainting when nobody polls; `start` now sets the page box over CDP and refuses to run if the reported `innerWidth/innerHeight` disagree with the requested viewport (it previously produced 484x644 for a 390x844 request); rasterisation moved from SwiftShader to the host's GPU path, measured 9fps to 144fps. Unit-tested and exercised live. A pre-repair orphan (1.76 GB, driver dead) was reaped |
| Experience review | **Ran 25 Sep, and the candidate is not ready.** One fresh-context cold observer, one pass, phone 390x844 then desktop, all five lanes scored in that pass, motion and audio recorded unassessed. Scores: story 7/7, art-world 6/7, gameplay 6/7, learning 7/7, **presentation 4 phone / 6 desktop** — every lane below the 9 bar. Report: `artifacts/cold-pass-report.md`, evidence under `artifacts/cold-pass-phone/` |
| Experience review — caveats | That pass started its phone beats at the broken 484x644 box, so shots `01`-`04` are not phone evidence; its desktop pass was truncated at the mission decision |
| Reproduction of the review's load-bearing claims (25 Sep, live GPU phone session at a true 390x844) | **One confirmed, one confirmed at source, one not reproducible.** (a) The invisible information node is confirmed in live play: `p#scene-description` measures `[0,16 1x1]` while its text is the only copy of the instruction. (b) The decision-sheet chrome removal is confirmed by the reviewer's own frame `25-power-lead-click.png` (stick and `◎ + − ? ◉` column absent) and by its mechanism in source, `web/first-words.css:107`, which sets `display:none` on `.game-view-tools`, `.game-move-stick` and `.game-controls-help` under `.sheet-mode`. (c) Replaying the recorded trace to reach that beat failed as an instrument: 110 steps reported `ok` and the world never left control practice, so `ok` means "the call did not throw", not "the game responded". A trace recorded through the pre-repair viewport is not replayable evidence, and the harness has no state-change assertion to catch that. |
| In-flight repairs already in the dirty tree | Another agent's uncommitted work adds a visible `#learning-readout` world carrier (the cold pass found the causal explanation and beat counter living only in 1x1px nodes) and a `launch_browser` opt-in for headed checks. Neither is mine to edit, and neither has been measured or played. `tests/browser_check.py` and `tools/check_presentation_budget.py` still default to SwiftShader, i.e. the 9fps raster path the play harness just left |
| Harness can now certify a beat (26 Sep) | Added an `expect` step: a step passes only if words a **player can see** contain a string, where a 1x1 node is deliberately too small to answer. Exercised live on a fresh disposable session at phone 390x844: `One lantern. Three friends.` passes, `1 / 8` fails, `Replay the prologue` (closed menu) fails. That run also reproduced the review's invisible-node finding in current play: `small#rgi-step` measures `[0,0 1x1]`. A failing step no longer gets the key-name hint appended. 437 unit tests OK (7 skipped) in 55 s |
| User acceptance | Not requested. The user's latest verdict on the game is a rejection and stands until they say otherwise |

## Not verified

Stated as measured, not inferred:

- No player-facing content in this tree has been observed in play by the user.
- The five deferred Level 1 browser groups, and every gate, on any SHA that contains the in-flight edits.
- The viewport-mismatch refusal path and the harness `--software` fallback: written, never exercised.
- The two 1x1 nodes are reproduced live; the rest of the cold pass's remaining findings
  (unlabelled `◎ ◉` column, 21x21px phone stick arrows, `clickrole "☰"` having no accessible
  name) are quoted from the reviewer's own dumps and have not been re-measured.
- An earlier "idle chromium costs 10.5 cores" figure was retracted as unattributed; the attributed
  cost was one renderer at 871% of a core, caused by the frame probe that is now fixed.

## Confirmed blockers

- Mechanical: none outstanding on the last measured candidate; the four gate failures found earlier
  are fixed and unit-pinned.
- Demonstrated in play, not yet repaired on a frozen SHA: a bottom sheet removes the view chrome
  (`web/first-words.css:107`) in states whose prompt asks the player to look at the world, and
  primary instruction text still reaches a sighted player only when a world marker happens to be
  placed. Both need a bounded repair plus a measurement that would have caught them — the budget
  tool has no rule for "an opened carrier took away an affordance the beat depends on".
- The open question is not measurement but whether the whole journey works for a new player, which
  no checker can answer. Every lane scored below the 9 bar in the one cold pass that ran.

## Next actions, in order

1. Land or hand off the in-flight working-tree edits so one SHA equals what gets played.
   When that edit lands, correct its preflight paragraph: `docs/ASTRA-REVIEW-WORKFLOW.md`
   still tells a reviewer that the harness's default headless mode forces SwiftShader
   software WebGL. It does not since `7666075` — the GPU path is the default and
   `--software` is the opt-in — and sending critics onto the 9fps path is how a lane gets
   recorded unassessed.
2. Cold playthrough completes in one pass, driven by batched step files rather than one action
   per turn, with an `expect` step at every beat the review later cites → collect scores,
   confusion log and blockers. Nothing reaches the player until it has been seen in this step.
3. Design-intent comparison against those observations, not against the docs.
4. Repair only demonstrated blockers, each as its own bounded change, re-running only the
   checks that repair touches.
5. Re-run the five deferred browser groups on the frozen SHA, then present to the user.
