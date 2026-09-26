# Learning and interaction design before implementation

Active direction, 21 September 2026: repair the general system before rebuilding
the game. The user rejected convoluted progression and a detached bottom workbench
plus upper-left mission text. The attached completion screenshot is visual evidence
of split attention, not evidence of how an earlier interaction played.

## What failed

GAME-AS-COURSE already specified outcome -> prerequisite -> mechanic -> decision ->
feedback -> practice -> transfer. GAME-UX-SYSTEM already preferred one obvious
world action. GAME-REFERENCE-STUDY section 6 recorded Portal's lesson redesign when
waiting could produce success without the intended decision. These remained prose;
we enforced runtime/spec compatibility and evidence integrity without an upstream
reviewed teaching sequence. Repeated local repairs did not reopen this design.

Research was not absent. Its application was incomplete. Do not add more reference
count or critic agents as a substitute for resolving the design.

## Current executable boundary

`design/learning-design.json` is a proposed, versioned design, not a description of
the shipped implementation. It identifies audience, starting knowledge, narrow
learning promise, limitations, outcomes and prerequisites; an ordered sequence
links introduction, supported practice and changed-case use. Each encounter records
a player goal, decision, consequence, recovery, assistance and evidence limits.
Every learning encounter requires a complete worked example: starting state,
player action, visible result, causal explanation and misconception response.
Its assessment boundary names what remains hidden before a choice, what is retained,
and how predictions stay separate from authoritative results.
Orientation/control practice must not claim a conceptual outcome. Every promised
outcome must have a transfer attempt before feedback; completion is not mastery.

Each encounter also declares its primary focus and surfaces for goal, action and
feedback. Primary gameplay information belongs to that focus through a world anchor,
character dialogue or deliberate object inspection. It cannot depend on a detached
screen-corner goal or permanent bottom dashboard. An inspection view is opened from
the object, visibly belongs to it, and returns to the world. It is not the existing
workbench renamed. A semantic HTML control can be world-anchored; this rule does not
require drawing accessible text into a 3D texture.

Secondary menus, audio controls and accessibility alternatives may remain overlays.
Keyboard, touch, enlarged-text readability, reveal/dismiss behavior and offscreen
recovery must be designed. World placement must not hide critical instructions
behind geometry, shrink text to illegibility, or make camera dexterity a prerequisite.

Research decisions cite a source locator, distinguish observation from adaptation,
and bind a failure probe to named encounters. The validator checks this mapping,
not source truth or the wisdom of a technique. The user-requested situated interface
is our design decision; the cited Portal study does not prove all HUDs must be 3D.

## Gate and verification order

1. Write/revise the small design before editing gameplay. Run
   `python manage.py design-gate --stage structure`. This checks references and
   ordering; output explicitly says quality and runtime alignment are unassessed.
2. One context-separated Astra reviewer examines the design and counterexamples
   across progression, concept fidelity, decision necessity, attention/access and
   research application. Record unresolved questions, not a generous aggregate score.
   `design/review.json` binds the exact canonical design digest. A design edit
   invalidates the old review. Author and reviewer must differ; identity strings
   record accountability, not cryptographic proof of independence.
3. Run `python manage.py design-gate --review design/review.json`. Without a passing
   design review this fails. This is the authoring/prototype boundary; there is no
   autonomous generator to intercept yet. System/tool repairs and design iteration
   remain allowed while it fails. Do not bypass it by calling game work a repair.
   Before merging implementation that covers the full designed journey, run
   `python manage.py design-gate --stage implementation --review design/review.json`.
   CI now checks this separately from technical tests: the review digest must match
   the current design, and `approved_steps` must cover every step with
   `approval_stage: implementation`. A prototype-only approval cannot authorize
   the remaining mission/payoff; the release gate still needs exact-candidate
   native alignment after implementation.
4. Prototype one coherent teaching loop after the design passes, preserving the
   original learning/evidence identities and saves. Native GUI review starts without
   answer keys or the design, then compares the preserved cold observations to intent.
   Reopen design when confusion requires a different sequence or mechanic.
5. A release also needs exact-candidate native alignment for every designed step,
   observations and action-relative before/after screenshot checkpoints, plus all
   existing critic/release checks. Alignment references the existing native assignment,
   execution receipt and raw critic result; these are revalidated with the existing
   validators, not inferred from an arbitrary artifact hash. The assignment binds
   the design digest; observations cite unique checkpoints surrounding the same action.
   The promotion workflow reads the design from the candidate commit, not just main.
   Normal preview override does not waive this gate. Deployment is not acceptance.
   For a sequence step, the before/after checkpoints must show the actual input and
   generated history legibly at the active focus **before the next learner action**.
   Include an ordinary camera change and a narrow viewport in the active-play probe;
   source state, screen-reader-only text and an optional inspection panel cannot
   prove the player saw the worked example at the moment it was taught.

`manage.py build` checks structure while keeping draft repairs technically buildable.
`check_release_gate` enforces design review/alignment under the active quality policy.
No runtime asset/HUD change follows merely from a structural pass. Existing motion
and audio deferrals remain in effect. The future Terminal PM can invoke this small
boundary; no new orchestrator, provider or generation pipeline is introduced.

## Review probes that matter

- Can a newcomer state the immediate goal, locate the available action and notice
  the result while attending to the relevant object/character?
- Does an action require the target reasoning, or can highlighting, recency, waiting,
  memorized position or repeated clicking produce apparently independent success?
- What new concept is introduced here, what was already practiced, and what support
  is removed? Does more interface replace genuine conceptual progression?
- Does the simplified model teach a false universal rule? Make its limits explicit.
- Try a mistaken choice and a new example; do feedback and recovery explain cause?
- Check phone and desktop, camera movement, keyboard and enlarged text. Merely
  placing a label in the world does not prove integration or readability.
- For a game that declares direct control and an explorable world, can the player
  finish every meaningful choice while standing still in a detached panel after
  control practice? If so, the design review must explain why the world and
  embodiment matter to those choices or send the mechanic back for revision.
  A deliberate stationary puzzle may be sound; the declared experience decides.

Expert AI play can find confusion and bypasses; it cannot certify novice learning or
retention. Learner comprehension remains an empirical question, not a schema field.

## Next proof, not a game rewrite yet

The active draft narrows the promise to growing sequence and relevant context.
Control teaching and story orientation are separate. It proposes demonstration,
supported decisions and one changed communication problem; these are design steps,
not a requirement for nine separate screens. Independent review may merge, reorder
or remove them before a prototype. The current game remains noncompliant. The user's
screenshot guides the attention rule but is not being cosmetically patched first.

## Independent audit and remaining work

A fresh Astra design audit rejected the draft before prototype approval: it lacks
complete concrete examples and step-specific interaction presentation. This verdict
is retained in design/review.json. The audit also found the initial new gate could
accept arbitrary hash-matching files as native evidence; that path was removed in
favor of existing validated assignments/receipts/results and action-bound captures.
Shared object names alone were insufficient, so presentation and focus-transition
contracts are now explicit. These checks still cannot judge actual visual composition.

The audit also found generic ingestion dropped native receipt v2 and failed to
forward native requirements when regenerating assignments. Both are repaired with
a CLI round-trip regression. Supply the same --native-requirements file used for
assignment creation; omitting it fails identity validation rather than downgrading
the run. This is a tested ingestion repair, not a claim of a new live review run.

Distinct design steps cannot reuse one native action or capture under multiple
checkpoint names. The gate verifies sequence order and the existing sealed capsule,
and requires cold-observer and source evidence in the later comparison. These are
trusted-harness records, not a security boundary against a process fabricating all
inputs. Reviewer judgment and preserved observations remain necessary.

Assignment creation and ingestion accept --learning-design-sha256 for the later
intent-comparison pass only. Use the digest from the structural check and preserve
the same --native-requirements on ingestion. The cold assignment is unchanged by
design binding. Alignment native_review references assignment_ref, result_ref,
receipt_ref and capsule_dir under the retained evidence root; every step cites
its distinct before_checkpoint and after_checkpoint.
