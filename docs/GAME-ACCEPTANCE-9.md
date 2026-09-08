# Game acceptance contract — 9/10, game-first, youth-engaging

Status: active user amendment, 8 September 2026. Applies to the current Phase 1 refinement and to future generated courses. This is a product requirement, not a claim of acceptance or child playtesting.

## Authority and scope

The user explicitly resumed implementation/research after the previous documentation-only checkpoint and raised the critic threshold from 8 to **9.0/10**. The critic must review VibeLearn **as a game that even a kid or young adult would voluntarily engage with**, not as an educational website, engineering demonstration or compliance checklist.

This amendment supersedes conflicting 8/10 thresholds, same-agent fallback acceptance and the previous stop-after-docs instruction in active repository documents. It does not open Phase 2/3 implementation, permit paid infrastructure, authorize external testers or override the user's final product decision. The checksummed historical design bundle and prior learning evidence stay immutable.

Latest established baseline remains user **6.5/10**, later agent **7.5/10**. Historical 8.8/9.1 scores do not approve a new candidate. Do not reuse them or raise a score simply because the requested target increased.

## The review question

Would a curious young player who was not assigned this lesson choose to keep playing? What in the actual game earns that choice?

Do not assume that a child and a young adult have identical abilities or tastes. Use two explicit review lenses: a curious younger non-specialist and an older teen/young adult. State assumptions about reading and prior knowledge. No childlike art, patronizing dialogue, forced reflex tests or removal of eventual technical rigor is required. Approachability and substantive depth must coexist.

An agent's audience prediction is a **design hypothesis**, not evidence that children enjoyed the game. Actual age-specific validation remains unperformed until appropriately authorized human playtests occur. The user remains the final reviewer before broader testing.

## Mandatory engagement observations

The critic must inspect an actual playable candidate, including a fresh start, a setback, the boss, the ending and a genuine replay variation. Record concrete actions, screenshots/video identifiers and likely abandonment points, not just the author's feature list.

1. **Hook and motivation.** A plain goal and someone/something worth helping appear before specialist terminology. A player can say what they are trying to change and why it matters.
2. **Play before reading.** The first meaningful action changes the scene; it is not merely Next, selecting a quiz answer or opening a text panel. Use 30 seconds to first meaningful action as a diagnostic design target, not a fabricated measured fact or a punitive countdown. Note unavoidable hosting/sign-in delays separately.
3. **Agency and curiosity.** Inspecting, experimenting and choosing produce distinct, legible consequences. At least one useful discovery is available through play rather than compulsory exposition. A safe retry/rewind supports experimentation without erasing help/exposure history or pretending real purchases can be undone.
4. **Earned progression.** One easy success precedes variation, combination and a boss. New tools expand what the player can do. Difficulty rises through reasoning and interaction, not longer forms or untaught vocabulary.
5. **Feel and emotional payoff.** Inputs have immediate acknowledgement; motion explains causality. Character reactions are specific to what happened. A consequential ending changes the world and resolves the stated goal.
6. **Voluntary replay.** There is one working variation that changes the reasoning or strategy, not just wording, colors, XP or an unavailable future quest.
7. **XP-hidden test.** Hide XP/rank and reassess the core loop. The reason to play must survive. No streak anxiety, shame, fake urgency, loot-box mechanics or coercive retention substitutes for fun.
8. **Accessible play.** Required interactions work with keyboard and touch, at a narrow viewport and enlarged text, with motion reduced and sound off. Explain unknown state honestly; do not make color, audio or animation the sole carrier of meaning.

For each audience lens, the critic writes: compelling moments, boring/confusing moments, likely first quit point, reason to continue, and whether the replay earns another attempt. Engineering reliability is necessary but does not compensate for a weak game loop.

## Numeric and blocking gates

Retain the existing weighted rubric: game identity 15%, HUD 15%, core loop 15%, progression 15%, feedback/game feel 12%, theme/cohesion 10%, learning integrity 10%, accessibility 8%.

A candidate is eligible for the user's final review only when all of the following are true:

- A **genuinely separate critic agent** has evaluated the frozen candidate and supplied its own evidence-backed scores. A separately prompted pass by the implementation agent is useful internal QA, but cannot satisfy this user's independent-critic requirement.
- The unrounded weighted total is **>=9.0/10**. A rounded 9 from 8.95 is not a pass.
- Both younger-player and young-adult engagement lens verdicts pass, with a concrete reason to continue without XP. A primarily educational-form experience fails regardless of its weighted average.
- No critical blocker remains in game engagement/comprehension, learning integrity, progression, persistence, isolation or accessibility. A boss that accepts an unsafe constructed policy because counts happen to be correct is a blocker.
- The exact candidate has executable verification evidence. A previous commit's checks are not current-build checks. Tests and screenshots are not independent human enjoyment evidence.

If a separate agent cannot be invoked, record `independent_critic_pending`; do not invent an agent, self-award an independent score or claim >=9 completion. Continue useful implementation and QA while keeping acceptance blocked. A source-only code reviewer cannot certify the game experience.

The critic must be free to reject repeatedly. Do not prime it to produce a passing number, remove difficult criteria, hide failed playthroughs or stop at a cosmetic score increase. Revise the actual experience from its findings. Keep candidate-to-candidate defect and evidence history.

The user's final review happens **after** this agent gate; an agent pass is not user acceptance. Do not initiate outside testing while it is deferred.

## Required review record

Record candidate commit/build, reviewer identity/configuration and independence, play environment, routes/actions inspected, artifacts, the eight raw numeric scores and calculation, both audience-lens verdicts, blockers, uncertainty, changes since last review and final status (`needs_revision`, `independent_critic_pending`, `ready_for_user_review`, `user_rejected`, `user_accepted`). Do not fill an absent score with zero or nine: use null.

## Course-generation inheritance

Every generated playable course must carry the same engagement contract in addition to the existing learning/source/accessibility contracts. Its package specifies target audience assumptions, first meaningful action, core learning mechanic, curiosity/agency opportunities, confidence curve, failure/recovery behavior, character/world payoff, replay variation and XP-hidden rationale. The independent critic evaluates the **rendered interaction**, not just the generated manifest. Reuse the principles, not a compulsory fantasy theme or fixed four-mission pattern.

The existing bounded automatic-repair rule for future generation remains: a failing candidate stays `draft_needs_review` after its configured repair budget. Never lower the 9/10 gate to label a generated course validated.

## Research continued for this refinement

These are design inputs and inferences, not promises of engagement:

- Celia Hodent, *The Gamer's Brain, Part 2: UX of Onboarding and Player Engagement*: teach actions in context, establish why the goal matters, limit early load, and avoid punishing players while introducing a mechanic. Applied here as direct scene interaction before explanation and a recoverable first setback. https://celiahodent.com/gamers-brain-ux-onboarding/
- Zachtronics, *Zachademics*: the developer describes iterative problem solving and the design-feedback loop in its construction games. Applied here as build/test/revise, not a recommendation to copy their mature themes or complexity. https://zachtronics.com/zachademics/
- Hempuli, *Baba Is You*: the creator describes changing the rules through objects in the playfield. Applied here as a small inspectable system whose rules can be tried, not another answer-selection screen. https://hempuli.com/baba/
- Game Accessibility Guidelines: interactive tutorials, clear language, stable targets and redundant non-audio/non-motion information guide the interface. https://gameaccessibilityguidelines.com/full-list/
- AWS Builders Library, *Making retries safe with idempotent APIs*: caller intent, retained identity, changed parameters and late arrivals constrain the retry model. A fantasy workshop must not imply infinite deduplication or that a missing acknowledgement proves failure. https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/

All five sources were opened during this refinement on 8 September 2026. The expedition implementation and audience response still require their own verification and criticism.
