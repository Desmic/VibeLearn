# The game is the course

Active user amendment — 9 September 2026. Read this before interpreting older acceptance blockers. The user authorized reviewing with available tools while Codex is unavailable and clarified the product: a game whose completion delivers the intended course outcomes, ideally better, with the experience treated as essential.

## Review method override

For the current private Phase 1 refinement, Codex availability is **not a blocker to useful review or iteration**. Use a deliberately separated, frozen-rubric internal critic pass informed by actual rendered browser journeys, screenshots, traces, adverse-path tests and code. State exactly what the reviewer could observe. Label that method `internal_tool_assisted`, never a separate agent, independent model or human playtest. A source-only review is still insufficient for a game score.

The target remains **>=9.0/10 before rounding**, both younger-player and young-adult engagement lenses passing, no critical blocker, and the user's final judgment. This temporary method exception changes who can review, not the quality standard or the evidence required. No automatic passing number follows from the tool constraint. Use `needs_revision` for a rejected candidate; do not keep requiring Codex setup from the user. Genuine independent review remains desirable when available. Future unattended course generation does not receive blanket permission to self-certify.

This section supersedes the earlier no-same-agent-fallback wording in AGENTS.md, STATE.md, GAME-ACCEPTANCE-9.md, GAME-UX-REVIEW.md and CRITIC-HANDOFF.md for this current refinement only. Other learning, privacy, phase and infrastructure boundaries are unchanged.

## Product promise and honest limits

The intended product is **a game that teaches through what the player does**, not an ordinary course interrupted by minigames, and not a lesson interface with a 3D background. Gameplay, world responses, puzzles, construction, investigation and decisions carry the target thinking. Explanations, dialogue and references support those experiences at the point of need. A serious game may be quiet, strategic, conversational or investigative; combat, reflex challenges and free walking are not mandatory.

The desired learning endpoint is the same useful knowledge and capabilities that a well-specified course promises. Matching a syllabus's words is not matching its outcomes. A five-stop retry rehearsal is a small reference slice, **not a replacement for a full distributed-systems or reliability course**. Equivalent or superior learning effectiveness remains unvalidated until appropriately designed learner evaluation exists. Engagement predictions are likewise hypotheses, not child-testing evidence.

## Two independent product gates

1. **Game experience:** a player understands the goal, wants to act, explores meaningful choices, receives satisfying feedback, learns consistent rules, recovers from failure and earns a resolution. The reason to continue survives hiding XP. Evaluate the complete journey, not only the best screenshot or successful test path.
2. **Learning outcomes:** every intended capability has supported content, purposeful practice and defensible assessment. The player must be able to apply the idea beyond the exact rehearsed sequence, with help/exposure accounted for, and demonstrate retention later where claimed.

Do not average these gates together. A delightful but shallow game fails the learning promise; a correct but tedious lesson fails the product. Rewards and story completion are not mastery. Missing evidence is not failure, and guided success is not a fresh independent result.

## Course-to-game coverage contract

Each versioned course package must include a coverage ledger:

`outcome -> prerequisite -> mechanic -> player decision -> causal feedback -> varied practice -> transfer assessment -> delayed retrieval -> evidence limits`

For every row, specify what the learner should actually be able to predict, explain, diagnose, construct or implement. Specify which game action demands that operation rather than merely displaying the term. State where scaffolding fades and which rule combinations are new. Track assistance separately from repetitions and family exposure. Identify unassessed outcomes explicitly. No course-equivalence label while required outcomes are unassessed.

The player-facing progression remains readable: discover one rule -> easy application -> meaningful variation -> combine rules -> unfamiliar challenge -> resolution. Underneath it, the course has an inspectable competency/assessment blueprint. For technical skills, an authentic terminal, code editor or design artifact can be part of the game when relevant; immersion must not replace real implementation ability with clicking similarly named props.

## Current retry reference: what must be taught and checked

| Intended capability | Suitable play | Required assessment beyond rehearsal |
|---|---|---|
| Distinguish an unknown acknowledgement from a failed effect | Observe the courier and workshop separately; investigate the missing message | A fresh case without a revealed answer; explain the uncertainty |
| Preserve business intent through restarts | Recover and reuse an order ticket across courier changes | Diagnose a different process-identity failure and construct durable intent handling |
| Respect finite deduplication retention | Manipulate time; see an expired ticket behave differently | Boundary and late-arrival cases with unfamiliar timing |
| Keep ticket identity bound to payload meaning | Alter the order and observe a conflict, not a silent overwrite | A changed-parameters case before any worked result is shown |
| Reconcile outcomes and preserve unknown state | Inspect a distinct authoritative register, distinguish committed/absent/unavailable | Safe AND live behavior on novel known-absent and uncertain cases |
| Build a defensible retry contract | Construct rules, run disruptions and revise from causal feedback | Fresh policy counterexamples and a real implementation/design artifact where the course promises that skill |
| Retain and transfer the idea | Return later to a new situation with less scaffolding | Delayed retrieval and a non-shopping/non-gear context, not replay of memorized counts |

The current reference implements guided pieces of this map; it does not yet satisfy the full rightmost column. Payload changes and unavailable-register behavior need stronger hands-on teaching before the boss. A list of correct policy options does not alone solve that gap.

## Experience assurance in practice

Use one small playable slice as the acceptance unit. Freeze the build and rubric, observe a fresh start, an error, recovery, a harder encounter, the ending and a genuine replay. Record likely abandonment points for younger non-specialists and older teens/young adults separately. Improve the actual interaction before increasing art scope. Re-run persistence, isolation and accessibility checks after game changes.

Design targets, not fabricated measurements: meaningful first action within about 30 seconds of entering play; stable input acknowledgement; no forced timer for untimed reasoning; no repeated confirmation forms between every trivial action; familiar rules recombined before new ones appear. On the supported device set, measure frame timing, input delay, load/recovery behavior and text/control legibility. Headless desktop rendering does not establish phone GPU performance.

Human final review is essential. No process can guarantee that every person finds a game enjoyable; what the team can enforce is a demanding evidence-backed acceptance standard and refuse to ship obvious friction as 'polish later'. Do not substitute streak pressure, shame, fake urgency, excessive grinding or compulsory rewards for curiosity and earned competence.

## Three.js decision

Explore an authored, stylized 2.5D/3D scene when direct object manipulation, spatial relationships or visible system behavior improve the learning action. Three.js is a renderer/scene library, not a replacement for game rules, input design, progression or assessment. The renderer projects authoritative state; it never awards learning evidence.

The opt-in valley prototype is a technical probe, not proof that the game is now good. Promote it only after meaningful interactions, clear targets, mobile behavior and visual quality beat the existing presentation. Keep equivalent keyboard/touch semantics and a usable fallback. Do not force all generated subjects into 3D or one fantasy template. See THREEJS-SPIKE.md for implementation and verification.

## Source-grounded design inputs

- Three.js official *Making a Game* distinguishes rendering from the other game systems developers must supply: https://threejs.org/manual/en/game.html . Its picking, responsive rendering and cleanup manuals inform the prototype, not a claim of audience engagement.
- Habgood and Ainsworth's study *Motivating children to learn effectively: exploring the value of intrinsic integration in educational games* examines integrating learning into the core mechanic: https://shura.shu.ac.uk/3556/ . Application here is a design hypothesis; the study does not validate VibeLearn or every topic/audience.
- Roediger and Karpicke, *Test-Enhanced Learning*, examines delayed retention after retrieval practice: https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/ . This motivates checking later retrieval instead of equating immediate successful play with durable knowledge.
- Celia Hodent, onboarding and engagement: https://celiahodent.com/gamers-brain-ux-onboarding/ . Apply contextual teaching and controlled early load rather than an exposition wall.
- AWS Builders Library, retry semantics: https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/ . The workshop metaphor must preserve caller intent, changed parameters and bounded/late uncertainty.

These are primary author/developer/research sources inspected during this refinement. They inform the design; they do not establish course equivalence, superiority or youth enjoyment.

## Scope

This amends current Phase 1 product refinement and future course-generation requirements, not authorization to implement Phase 2/3. Preserve historical content/evidence and the checksummed design bundle. No new external testers, paid resources, public rollout, production data mutation or relaxation of hosted security is authorized.
