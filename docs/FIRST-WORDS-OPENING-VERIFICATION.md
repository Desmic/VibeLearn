# Opening checkpoint — 16 September 2026

The user explicitly required the opening to be completed/tested before the full level. Level extension and the earlier full-level browser run were stopped while this checkpoint was repaired. The opening is now implemented and its dedicated technical gate passed; this is not the user's acceptance of the rendered game.

## Implemented sequence

1. Zip catches and returns the pair-lantern; the player gives a hand tap.
2. The Warden descends beside a caged singer, removes the visible voice module and raises the captive.
3. Zip pushes the player clear, is trapped behind the Moon gate and loses their voice module. The repair socket is visible outside the bars. Continue/Skip leads to the power-lead tutorial in the same runtime.

## Repairs made before passing the checkpoint

- Removed inherited grid bands and the overextended caption background from the full-screen opening.
- Replaced a vague lifting ring with a visible barred cage.
- Separated Warden and captive positions so the voice theft is readable.
- Animated Zip's stolen module from the chest to the Warden and enlarged the module for phone visibility.
- Added the player arm response to the hand tap.
- Moved opening camera controls left, away from the captive on the right.
- Added opening mute state and synchronized scene pause with the audio controller.
- Corrected the presentation clock: elapsed time is no longer capped at 50 ms per frame, which made slow-frame scenes last too long. Background visibility and pause reset the clock anchor and suspend presentation.

## Executed checks

`python -m tests.first_words_opening_browser` passed after these changes. Report: `artifacts/first-words-opening-report.json`; images: `artifacts/opening-*.png`. The gate covers friendship/capture/voice loss, pause/resume, mute, same-runtime tutorial handoff, replay preserving a draft, reload without automatic replay, fresh reduced-motion 360/430/desktop layouts, caption/control bounds and Skip into the tutorial. The default animated path is inspected at 390 px. No page errors were recorded.

Hands-on browser use also played the opening, paused the Warden scene, continued muted, observed Zip's capture and returned to the unchanged saved `Open the` sequence. Final manual image: `artifacts/first-words-manual/opening-final-390.png`.

## Limits and next gate

These are desktop-browser phone viewports, not physical phones or a novice study. Audio generation, pause and mute are technically verified; subjective listening quality is not certified. Enlarged-text and full-level failure/recovery coverage remain part of the integrated review. The working tree is not yet a frozen deployment candidate; final build/commit evidence must be recorded at that gate. Now resume full Level 1 verification, keeping this opening as a regression gate. No deployment or later-level implementation occurred at this checkpoint.
