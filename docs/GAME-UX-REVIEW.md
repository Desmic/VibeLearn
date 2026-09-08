# VibeLearn game critic — active 9/10 acceptance gate

Controlling user amendment: [GAME-ACCEPTANCE-9.md](GAME-ACCEPTANCE-9.md), 8 September 2026. The implementation agent and critic must be genuinely separate. The user performs the final review only after the independent agent gate; no agent verdict overrules user rejection.

## Review it as a game

**Would a curious kid/younger non-specialist or an older teen/young adult choose to keep playing without being assigned a lesson?** Review both lenses separately, state reading/prior-knowledge assumptions and identify the likely first quit point. Do not equate cute art, low difficulty, XP or engineering reliability with engagement. Preserve serious conceptual depth.

The critic must inspect real rendered interaction on a frozen candidate: fresh entry, first meaningful action, a discovery, a mistake/recovery, progressive missions, constructed-policy boss, ending and a working replay variation. Hide XP for a pass through the core loop. Record what causes curiosity, what decisions matter, what consequences are legible and what actually earns another attempt. Screenshots alone cannot establish the whole loop; the author's feature list cannot replace a playthrough.

An agent's assessment of audience appeal is a hypothesis, not proof of child/young-adult enjoyment. No external audience test is authorized yet.

## Non-negotiable pass rule

- **Unrounded weighted total >=9.0/10**, with the unchanged weights below.
- Both audience-lens engagement verdicts pass, with a concrete reason to continue without XP.
- No critical blocker in engagement, comprehension, progression, learning integrity, accessibility, persistence or isolation.
- Reviewer identity/configuration and genuine independence are recorded. A separately prompted pass by the builder does not fulfill this user's requirement.
- Executable results and rendered evidence refer to this exact candidate, not an older successful version.

If no separate agent can run, use `independent_critic_pending`, numeric score **null**. A source-only code review is not a game-experience pass. Never tune the rubric, round up a sub-9 score or hide failed journeys to rescue a build.

## Frozen weighted rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Game identity vs website residue | 15% | The primary experience is an engaging playable game, not ordinary cards/forms with game labels. |
| HUD and information at a glance | 15% | Plain immediate objective, meaningful state, progress and useful tools are legible; secondary details are contextual. |
| Core loop clarity and immediacy | 15% | A non-specialist understands the situation, acts directly, experiments and receives clear consequences. |
| Progression and difficulty curve | 15% | Easy success precedes variation and combination; tools/mechanics are taught before an earned boss; next-route focus is predictable. |
| Feedback, game feel and responsiveness | 12% | Meaningful inputs, causal transitions, setbacks, recovery and success have satisfying, understandable feedback. |
| Theme and visual cohesion | 10% | World, character, story, typography, objects, vocabulary and motion belong together and serve the mechanics. |
| Learning integrity | 10% | Rewards do not distort evidence or mastery; observed help, unknown declarations, prior exposure and limited assessment scope remain honest. |
| Accessibility and responsiveness | 8% | Keyboard/touch, narrow screens, enlarged text, contrast and reduced motion remain usable; no essential audio/color/motion-only meaning. |

Calculate `sum(area_score * weight) / 100` from the eight raw /10 values. Do not use the historical scores as a prior target.

## Critical blockers and comprehension pre-gate

A plain objective must precede specialist jargon where a faithful intuitive model is feasible. The player must identify who wants what, what changed and why their action matters. The story's causal model must match the assessed mechanism and bridge into formal terminology rather than replace it with an inaccurate metaphor.

Any of these blocks acceptance regardless of the average:

- A primarily read-card/answer-form loop when the subject supports direct play; no convincing reason to continue with XP hidden.
- Required knowledge or interaction first appearing as an unexplained boss demand; difficulty rising mainly through reading burden.
- No meaningful setback/recovery, world resolution or working replay variation for this expedition reference.
- A mission clear for an unsafe constructed policy just because unrelated count answers are correct.
- Lost saved work through normal navigation/reload; forged mission unlock; cross-learner access; mutable submitted evidence.
- XP or self-report changing mastery, evidence strength or learning unlock correctness.
- Unknown outside-help declaration labeled assisted without observed/declared help; prior exposure mislabeled current assistance; simulation feedback represented as fresh independent work.
- Required actions unusable on keyboard/touch/narrow screen or meaning available only through motion, sound or color.
- Unclear immediate goal, misleading story causality, uncontrolled early tool/jargon overload or raw network/implementation errors shown to the player.
- Successful sequential clears focusing an earlier node rather than the intended newly available route; unpredictable retry focus after failure.

Reversible rehearsal is a game affordance, not a claim that real purchases are reversible. In the retry model, missing acknowledgements mean uncertainty; retained identity has a finite window; authoritative reconciliation is an additional explicit capability. Unknown must never be silently treated as absent.

## Evidence required before scoring

Inspect signed-out/login behavior; fresh map and locks; first meaningful action; causal feedback and reduced-motion equivalent; a wrong experiment and recovery; save/reload/process resume; the four assistance/exposure meanings where applicable; sequential focus and increasing reasoning demand; boss construction and unsafe counterexamples; ending and real detour; XP-hidden play; keyboard, touch, 320/390px layout and actual text enlargement; saved assessment scope and immutable history.

For each audience lens record compelling moments, boring/confusing moments, first likely abandonment point, reason to continue and whether another replay is earned. Cite specific actions/artifacts. Keep deficiencies visible even when other areas score highly.

## Current review status

Baseline shopping campaign: user **6.5/10**, later agent **7.5/10**, not accepted. Historical **8.8** and **9.1** were superseded and are preserved unchanged in [history/GAME-UX-REVIEW-before-nine-20260908.md](history/GAME-UX-REVIEW-before-nine-20260908.md).

Expedition candidate: **no independent score yet**. The GitHub Codex integration replied that `Desmic/VibeLearn` needs a Codex cloud environment. Status is `independent_critic_pending`, not passed. Consult [STATE.md](STATE.md) for exact candidate and verification status.

## Generation and repair loop

Future generated courses must also pass structural/learning, content/source and accessibility validators. Their separate game critic uses this gate and GAME-ACCEPTANCE-9.md on the rendered game. A generator cannot self-certify. Return evidence-backed defects to the author, revise the actual experience and re-review the frozen revision. Keep the configured bounded repair budget; an exhausted failing candidate remains `draft_needs_review`. The user's final decision still controls product acceptance.
