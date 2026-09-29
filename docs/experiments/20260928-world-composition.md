# World composition and access regression checkpoint

Continues the verified `97d6816...` opening repair. Scope is existing v8 opening
art/staging and its access contracts; no new route, assessment, learning outcome,
reachable destination or later level. The approved design remains unchanged.

## Observable improvement

The initial and reverse inspection views should read as parts of one inhabited
place: a transit line connects architectural supports, near/middle/far forms have
clear silhouettes, and the landmark tree reads as foliage rather than stacked
blocks. Keep the playable clearing, both signal objects and people unobstructed.
Do not fill breathing room merely to remove empty pixels. Partner contribution
must remain visible through staging and the existing world response.

Root Astra owns art composition and native visual comparison. Sol audits and
closes behavioral testing gaps in the shared opening/access contract; a separate
Sol asset task investigates one suitable licensed foliage replacement. Existing
engine, materials, authored world kit, asset vendor and Harbor fixture are reused.
No extra renderer, commodity asset generator or orchestration layer is proposed.

## Verification plan

Preserve baseline captures and source fingerprint. Root actively plays desktop
and phone choices/inspections and checks the new background from reverse views.
Sol adds meaningful missing coverage for pending-inspection pause/resize/dwell,
keyboard operation, 200% phone text and fresh/saved exits, without inventing
game-specific runtime rules. One browser workload runs at a time; close owned
previews and browsers between stages. After content freeze, run build/application
checks, affected browser regressions and the exact presentation budget. Broaden
only for a new failure or affected behavior, not by habit. Record content costs
using comparable world-state counters; no CPU/GPU utilization claim from draw calls.

Implementation evidence does not close cold comprehension, art/world quality or
full journey readiness. Motion/audio quality remains deferred. No deployment,
Level 2 or live Terminal PM run is authorized by this checkpoint.

## Implemented art and reuse choices

Repositioned existing sky gardens and horizon buildings so the reverse balcony
view has a district with depth. Added foundations under the two newly exposed
building bases, extended the existing transit beam between its supports, and gave
the train its missing reverse window. The playable floor and traversal boundary
are unchanged. The existing marker/camera system still owns both choices.

The existing hand meshes now have branch-specific static gestures, carried by
ordinary WorldSpec transform patches. Mira raises a hand toward the sky signal;
Tavi holds the garden response at his side. Native play caught the first ring pose
covering Tavi's face; it was lowered and reduced before freeze. Rest, branch carry
and replay use the same authored pose data. No new animation controller was added.

Kept one Quaternius BirchTree_5 as the receiver landmark after direct runtime
comparison. It replaces the block-shaped landmark canopy while retaining the
existing near trees. Delivery is a deterministic 1,276,252-byte GLB with original
bark/leaf textures, 4,520 triangles and no optional 22,721,595-byte normal map.
Leaf alpha blending is preserved; texture and overdraw costs are not assumed free.
The vendor pins four source files and the packaged output, using the existing
local/hosted allowlists. See
`web/assets/QUATERNIUS-STYLIZED-NATURE-BIRCH-TREE-5-LICENSE.txt`: the 2022 pack's
specific CC0 label and the newer general QAL page are recorded separately, not
generalized to every asset from that creator. The full network vendor command was
not rerun on this restricted host; verified downloaded bytes were repackaged and
served locally, with focused integrity tests. No raster editing, new dependency,
new renderer, full catalog download in the player package or custom tree generator.

## Native worker play

Root actively used the local 8053 preview at desktop 1280×720 and phone 390×844,
chose both routes, inspected both destinations, paused and replayed. Preserved
captures in `artifacts/world-composition-20260928/`:
`desktop-opening.png`, `phone-garden-response.png`,
`phone-garden-inspection.png`, `phone-sky-response.png`, and
`phone-balcony-inspection.png`. `reverse-city-draft.png` is explicitly an earlier
composition draft. Final art content was frozen as WorldSpec version 17 afterward.
Both owned preview processes (48440, then 45164 after the asset-route reload) were
stopped; all root tabs closed and viewport reset before Sol's combined checks.

These are informed observations, not a cold critic pass. The blocky near foliage,
simple companion construction and architectural sparsity still limit reference
fidelity. A richer vista alone does not prove a living or explorable world; neither
distant destination became walkable. Scoped worker results follow; independent acceptance remains open.

The new source manifest includes every current self-hosted model/license payload
and its vendor script in addition to the preceding runtime/design set. This makes
the new asset part of candidate identity rather than relying only on its URL.
`artifacts/world-composition-20260928/source-manifest.json` currently records 96
file hashes; the final identity is recorded below. Earlier candidate manifests remain unchanged.

The seven configured application skips are specifically `tests/test_postgres.py`:
real PostgreSQL concurrency, stale writes, evidence/history permissions, rollback
and learner isolation require `TEST_DATABASE_URL` pointing to an explicitly
disposable local `*_test` database. No such database is configured for this run.
Keep those as a hosted-release gate; the local SQLite suite and browser state
comparisons do not replace them. Never run them against learner production data.

## Defects found by the added access tests

Keyboard activation replaced the focused marker and dropped focus. Shared opening
refresh now transfers it to the stable overlay, including while the next action
is unavailable during a timed response. Tab can reach available controls and
Escape remains usable. The Harbor world exercises this without game-specific IDs.

At 200% text, auto-width marker fitting changed the label width when its left
position changed, causing visible oscillation. A content-sized width capped by
the viewport breaks that feedback loop. ResizeObserver invalidates cached fitting
on real marker dimension changes; placement does not add per-frame layout reads.
A 24-frame diagnostic changed from oscillation to identical geometry.

The enlarged presentation also exposed redundant route narration competing with
the Look prompt. The route name stays on the world action; Mira now says “It
answered!” / “Our balcony!” and the inspected invitations are “Sit with me.” /
“Stay awhile?”. Destination captions are “Two shaded seats.” / “Trains pass
below.”. This keeps response and invitation distinct without shrinking text,
raising budgets or clearing a sentence before the player finishes reading.
The final test must measure both response and inspected speech on both routes.

## Final worker verification

Runtime/design/asset source fingerprint: `5e25605df3996b6a1b632f9582b3ee3ccb85812fdfd9f3b2c84f52a410c25b68` (96 files).
`verification-manifest.json` alongside it also hashes the final test fixtures and
reports, without treating test-source identity as critic acceptance.

- Build passed after the final repairs.
- Application suite: 468 tests passed, seven PostgreSQL skips described above.
  This run preceded the last JS/CSS focus/fitting/quote-style repairs; affected
  Harbor/WebGL and held-input checks passed after those repairs.
- `python -m tests.first_words_opening_browser --behavior-only` passed: both
  opening routes, pending and inspected replay exits, authoritative saved-state
  preservation, timed keyboard Escape, reduced-motion 360/430/1280 and tutorial
  handoff. Report: `artifacts/first-words-opening-behavior-report.json`.
  This new bounded mode keeps the normal full gate intact and omits duplicate
  caption-blind recording; no new motion/audio-quality evidence is claimed.
- `artifacts/presentation-budget-opening-v17-final.json`: 18/18 states passed,
  zero violations. `artifacts/presentation-budget-opening-v17-garden-reentry.json`:
  the remaining 1x destination passed after fresh route selection and Look.
  A sequential fixture had previously measured the next beat after the inspected
  text's dwell expired; the canonical 19-state fixture now uses fresh re-entry.
  No game timing was changed to satisfy this test. These split runs cover all 19
  states but are not one final 19-state/candidate-bound critic qualification.
- At 200% phone text, garden/sky replies cover 14.5%/14.3%, inspected captions 8.3%,
  inspected speech 8.9%/9.1%; zero clipping or unreachable actions in these states.
  The descriptive Look labels remain. `.rgi-speech` now resets inherited page
  blockquote padding/border; text size and meaning were not reduced to fix styling.
- Root inspected the final enlarged-text captures. Earlier native desktop/phone
  actions establish art/staging observations; they are not a fresh cold review of
  the final copy. Reduced-motion and remaining prologue phases were not all
  presentation-budget tested at 200%; no full accessibility certification follows.
- All worker-owned browser/server contexts and root previews are closed.
  No CPU/GPU saving claim, commit, deployment or later-level expansion.

The [core story/learning audit](20260928-story-learning-core-review.md) is retained
for the following stage. The user subsequently clarified that world/art and engaging
play should be completed first. These technical results settle neither appeal nor
learning quality.
