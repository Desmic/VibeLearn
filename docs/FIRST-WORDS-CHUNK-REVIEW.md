# First Words â€” chunk review, 16 September 2026

## Scope and candidate

Local rescue working tree on `codex/critic-evidence-reset`, based on `3102519`;
not a frozen or deployed candidate. Render deployment is paused. No Level 2
implementation or additional sound work is part of this review.

Workflow: `../CODEX.md`. Chunk boundaries are chosen around coherent player
experiences and can combine story, animation, controls and sound. Existing
later code does not bypass a gate.

## 1. Opening gate

See [dedicated evidence](FIRST-WORDS-OPENING-VERIFICATION.md): implemented and
technically checked first after the execution correction. Human acceptance and
subjective audio quality remain unverified. Preserve it as a regression gate.

## 2. First words, wrong hatch, repair and reunion

Pass conditions: the wrong sentence opens the wrong hatch without losing progress;
scanning the cell clue changes the engine input and next-word scores; generating
and speaking the corrected sentence visibly frees Zip; save/reload and accessible
scene descriptions agree with the world.

Observed through computer/browser use at 390 x 844: resumed the saved wrong Sun
command, scanned Moon, generated `Open the`, inspected Moon 90% / Sun 10%, finished
`Open the Moon gate`, watched the bars rise and Zip move beside the player, then
reloaded the saved reunion. The engine input grows visibly with each word. The
optional inspection explains that these are authored toy scores, not a trained LLM.

Found and repaired: the accessible scene description still called Zip trapped
after the rescue. The world label and live scene summary now follow rescue state;
manual reload confirms the corrected description. The historical input still
contains the original cell clue, correctly preserving what the engine received.
Screenshot: [saved reunion](first-words-playtest-20260916/reunion-390.png).

Critique: the causal mistake/repair is readable, but this tutorial is deliberately
heavily guided. Repeated generation clicks alone cannot prove understanding. The
reunion is a short movement/visual reward; emotional impact needs user feedback.
Phone input text is small; enlarged-text framing remains an integrated review item.
No novice study, physical-device check or subjective audio endorsement is claimed.

Checks executed: 12 focused rules/storage tests passed. The full application suite
ran 153 tests successfully with six local PostgreSQL skips. Build also passed after the button-state repair.

The focused browser check exposed two issues during verification: its first
accessibility assertion incorrectly rejected the historical input clue (corrected
to assert the current scene prefix), then rapid generation exposed a brief enabled
button during animation. New action buttons now start with their actual blocked
state rather than waiting for the next animation frame. The browser helper waits
for the specific command response, not an already-visible previous Saved label.
The final focused rescue rerun passed, including opening, wrong hatch, repair,
reunion, accessible descriptions and reload. Report:
`artifacts/first-words-rescue-report.json`. Manual reduced-motion switching also
preserved the rescued world. This chunk is functionally verified; its product
limitations above remain explicit. Proceed to the tower challenge.

## 3. Tower challenge and ending

Pass conditions: predict before feedback, recover from the stale route without
rewriting first answers, keep Zip free, show the correct exit, finish and reload.

Manual play at 390 x 844 selected the old Moon sign, predicted Moon and incorrectly
predicted unchanged input, generated the wrong command, then scanned today's Star
notice and generated the corrected command. The Star gate rose and Zip walked to
the steps. Completion feedback retained the initial mistake and explained the
loop; the ending survived reload. See
[ending screenshot](first-words-playtest-20260916/ending-390.png).

Repairs found in this chunk: the Star marker was above the readable phone area;
its anchor now sits on the doorway. The wrong-route ring previously pointed at the
Sun hatch even for Moon output; it now points at Moon. Both were visually checked
on reload. The Star marker now hides once the gate is open to avoid overlapping
Zip's arrival label; final regression/manual check remains pending.

Critique: context choice changes the outcome and mistakes remain recoverable.
The current route notice strongly signposts the useful choice, and the ending is
text-led. This is a bounded introduction, not independent mastery or evidence of
consumer engagement. No Level 2 implementation has begun.

## Integrated gate

Full-level browser rerun and a 200% text-size probe are in progress. After observed
repairs, run build and the complete browser suite. The earlier application suite
passed 153 tests with six PostgreSQL skips; no server/rule code changed since.
Deployment is conditional on <=10% five-hour allowance remaining; the latest
observed allowance after reset was 86%. Render service access is connected and
auto-deploy remains off. No deployment occurred. User review remains final.
