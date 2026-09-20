# One Astra reviewer, separate critic lanes

Active user decision, 20 September 2026. Supersedes Luna-first routing.

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
Provide only a minimal public task packet: exact build, disposable entry URL,
audience, scope, checkpoints, tools and action/time ceilings. No winning actions,
source, story treatment, prior findings or scores before cold observations.
The reviewer may read generic tool instructions; record accidental context leaks.

1. Preflight actual browser input, screenshots and recording/inspection capabilities.
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
