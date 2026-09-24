# One Astra reviewer, separate critic lanes

**Upstream design gate — 21 September 2026:** Before game implementation, review
`LEARNING-DESIGN-GATE.md` and the exact learning design independently. This is a
design review, not cold gameplay evidence. Later GUI review must still begin cold;
only its intent-comparison pass receives the design and compares each step.

**Active scope update — 20 September 2026:** The user temporarily parks motion-quality
and audio review, trusting the engine/code for motion provisionally. Continue native
GUI play and broader art/world review now. Record motion/audio as deferred and
unassessed, never passed; do not pursue media-provider integration for this scope.
This does not defer composition across camera positions, visual world-state contrast,
controls or spatial readability. Full readiness remains distinct from this scoped
art pass; Level 2 and deployment promotion remain gated.

Active user decision, 20 September 2026. Supersedes Luna-first routing.

**A lane is a column of the report, not a run.** One agent plays the whole game once,
capturing recording, screenshots and the action trace as it goes, and scores every
required lane inside that single pass. There is no per-lane scheduling decision to make
and nothing to parallelise: the run is one, the findings are many. Independence lives in
the findings (and in observations preceding rationale), never in separate critic sessions.
Read "separate critic lanes", "independent disciplines" and "independent gates" in every
document as describing report structure. Cost and time savings are the reason for this
shape: one real GUI walk is the expensive object, and repeating it per lane multiplies it
for no additional evidence.

Use one fresh GPT-6 Astra reviewer for the main generated-game review. Keep every
critic profile and separate findings/ratings; art/world direction is mandatory.
Do not fan out one agent per lane or require a second opinion merely because
one reviewer can make mistakes. Luna experiments remain useful historical data,
not the default production path. Measure total accepted-review effort before
reintroducing a cheaper model for a narrow task.

## Execution now

Use the existing signed-in Codex app's subagent capability, with Astra and
`fork_turns="none"`. This starts without the parent's conversation history.
It does not erase system/tool instructions or create filesystem isolation.
On this host the child session can lack a browser provider even when the parent
has one. A user-authorized fresh top-level projectless Astra task successfully
passed blank-page creation, accessibility and screenshot checks on 20 September.
Use that verified session path when child-provider preflight fails; actual game
input must still be checked. Creating a new user-owned task requires the user's
explicit request. Do not fork implementation history into the reviewer.
Provide only a minimal public task packet: exact build, disposable entry URL,
audience, scope, checkpoints, tools and action/time ceilings. No winning actions,
source, story treatment, prior findings or scores before cold observations.
The reviewer may read generic tool instructions; record accidental context leaks.

1. Preflight actual browser input, screenshots and recording/inspection capabilities.
   Use `tools/play_session.py` (`start` / `step` / `stop`) as the play harness: it keeps
   one browser alive between commands, takes real hold/drag/resize input, and appends
   every action to `action-trace.jsonl` as the review's action evidence. A reviewer that
   writes its own driver is a system defect report, not a workaround — two have already
   had to (22 and 23 September), which is why the harness is shared now.
   Invocation: `python -m tools.play_session start --serve --root artifacts/play-<lane>
   --path first-words --viewport 390 844`, then repeated `step --file <steps>.json`, then
   `stop`. Pass `--path` without its leading slash (Git Bash rewrites `/x` into a Windows
   path), and prefer the step kinds `settle`/`dump`/`buttons`/`eval` over fixed waits —
   headless software WebGL renders a few frames per second, so a millisecond-timed input
   window starves movement.
2. Play from entry through the full assigned ending. Record observations, choices,
   uncertainty and evidence references. Exercise mistakes, recovery and save/resume.
3. Save the cold report before receiving intent or prior evidence. Do not rewrite it.
4. Supply the intended design and authoritative learning records. The same reviewer
   evaluates all lanes, revisits specific scenes through GUI, and inspects recordings.
5. Produce separate lane findings and scores only after evidence assessment. A strong
   lane cannot compensate for an unassessed or failing one. Unknown stays unknown.
6. Repair concrete findings and replay the affected behavior. Preserve the original
   report and bind the recheck to the changed build. The user remains final critic.

This is one reviewer across lanes, independent of the implementation context.
The existing repair-return validator's worker/reviewer identity check still applies
when using that separate evidence-repair protocol; it does not require a different
reviewer per critic lane. Technical scripts and deterministic evidence checks are
supporting tools, not extra creative critics.

## Required lanes

Scored in the same single play pass, as separate findings (see "a lane is a column of
the report, not a run" above):

Cold observation; rendered story/cinematic causality; art/world direction;
motion/animation; physicality; tutorial/transitions; audio/atmosphere;
learning/transfer; design-intent comparison. Art/world explicitly covers scale,
negative space, focal hierarchy, silhouettes, geometry, landmarks, camera angles,
phone composition, palette/material cohesion and atmosphere.

## Video recordings and inspection

Actual computer/browser play collaborates with video recordings, screenshots,
action traces and immutable learning evidence. Retain video identity and timestamps
for cited segments. A recording file existing is not proof the reviewer watched it.
Astra's current documented API supports images but not direct video/audio input.
A supported temporal inspection path must therefore deliver ordered timed frames
at sufficient density for the claim, or another verified playback observation
capability. Sparse stills cannot certify continuous motion. Audio quality requires
actual listening; captions, source and amplitude statistics cannot substitute.
Record exactly what was inspected and flag unsupported lanes to the user.

Capability research and the proposed media calibration experiment are recorded in
`experiments/20260920-media-review-capabilities.md`. No documented Astra flag enables
direct audio/video input. A future qualified media analyzer may supply timestamped
observations to the single Astra reviewer; distinguish that indirect evidence from
the reviewer's own perception. This does not authorize external inference.

Preflight the actual reviewer session, not just the parent: provider discovery,
tab creation, visible input response, screenshots, capture, temporal inspection and
audio inspection are separate checks. On unavailable browser providers, retain the
exact failure and allow one documented recovery before stopping that review run.
An empty tab list is normal; an empty provider list is a different failure.
The supervised execution bridge now enforces a session/build/assignment/model-bound
preflight. See `NATIVE-PLAY-EXECUTION-CONTRACT.md`; media capture and inspection are
separate requirements. This does not authenticate supervisor-supplied observations.

## Verification costs, measured on this machine

Software-WebGL Chromium renders a few frames per second, so every gate here is a real
play walk, not a unit run. The numbers below are what the commands actually took on
24 September 2026; size a wait for the run, and never guess a duration from the size of
the scenario.

| Gate | Command | Wall clock |
| --- | --- | --- |
| Presentation budget, one beat chain | `python -m tools.check_presentation_budget --only <contiguous prefix>` | **41s** for 5 states |
| Presentation budget, whole scenario | `python -m tools.check_presentation_budget` | **277s** for 21 states |
| Unit suite | `python manage.py test` | ~70s for 411 tests |
| Active browser matrix | `python manage.py browser` | ~26min for 10 modules |

What follows from those numbers, without relaxing anything:

- **Iterate on the prefix, certify on the whole.** A `--only` chain that starts at a
  `goto` state answers a layout question in under a minute; the full scenario is the
  record, not the workbench. Re-running 21 states to read one number costs 236 seconds
  of nothing.
- **Never re-drive the browser to see what the last run already knew.** The checker
  attaches the bounded surface's ranked/unranked children to any B3 overflow violation
  (`attach_shed_diagnostic`), because rebuilding that view by hand cost four full walks
  when this rule was not yet enforced.
- **Commit the body as soon as its gates are green.** A long session's real risk is not
  elapsed time, it is hours of verified work sitting in an uncommitted tree.
- **Report a duration or a count only after measuring it.** A figure carried forward from
  a summary is a guess with the authority of evidence behind it.

## Quota and future orchestrator

Use current Codex account usage for this supervised work. Do not introduce API-key
requests, API-funded workers or an embedded orchestrator merely to obtain fresh
context. The Agents API is separately billed at API rates. No API call or live
Terminal PM dispatch is authorized by this workflow.

Later the separate Terminal PM/orchestrator owns goal/task scheduling, budgets,
execution, verification and artifact delivery. VibeLearn supplies versioned tasks,
critic profiles and consumes bound reviews/evidence through its existing thin
adapter. Do not copy the orchestrator's runtime into this repository.

References checked 20 September 2026:
- https://learn.chatgpt.com/docs/agent-configuration/subagents
- https://developers.openai.com/api/docs/guides/agents-api/overview
- https://developers.openai.com/api/docs/models/gpt-6-astra
