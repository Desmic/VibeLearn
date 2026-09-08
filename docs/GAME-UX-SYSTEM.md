# VibeLearn game UX system — expedition refinement

Active user direction, 8 September 2026. Read [GAME-ACCEPTANCE-9.md](GAME-ACCEPTANCE-9.md) and [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md) with this document.

## North star and audience

VibeLearn is a **learning game whose mechanics teach serious ideas**, not a website with XP labels. A curious kid or young adult should have a reason to voluntarily keep playing. The critic must evaluate younger non-specialist and older teen/young-adult engagement separately. Approachability is not childishness; eventual rigor is not optional. Neither automated checks nor an agent's audience prediction establish actual child enjoyment.

A genuinely separate critic must score the frozen playable candidate **>=9.0/10 unrounded**, both audience lenses must pass and no critical blocker may remain before the user's final review. Older 8/10 gates and documentation-only stop instructions are superseded. No acceptance is claimed by this document.

## Design principles

**Story and intuition before abstraction.** Establish a clear goal, someone/something worth helping, a change and a meaningful action before specialist vocabulary. Narrative is useful only when it carries causality, motivation or clues. Do not replace formal truth with a comforting but inaccurate metaphor.

**Learning embedded in play.** Let players send, inspect, manipulate, construct, test and recover where those operations embody the subject. Actions must visibly change relevant state. Reading, dialogue and explanation can support the loop; they should not become the loop by default.

**Confidence before complexity.** Teach -> easy success -> variation -> combine -> boss -> relief -> new possibility. Difficulty rises through interactions, uncertainty and tradeoffs, not larger forms. Do not introduce an untaught rule only when grading the boss.

**Earned agency and payoff.** Consistent rules should invite useful experiments. Mistakes expose consequences and suggest a new hypothesis. Recoverable setbacks preserve evidence. An ending changes the world and resolves the stated goal; replay changes the strategy or reasoning. Test whether this remains interesting with XP hidden. Avoid pressure-based retention, shame, streak anxiety and fake urgency.

## Current reference implementation

The original four-mission Shopping Agent campaign remains historical practice. The separate candidate **The Missing Delivery** is implemented in `app/expedition.py`, `web/expedition.js` and `web/expedition.css`; its acceptance is pending.

Pip needs one gear to repair the bridge. The workshop receives an order, but the storm can lose its reply—or, in the detour, the order itself. The player acts in one illustrated valley, with Pip, journal, workshop, gear count and bridge. What actually happened and what Pip knows are separate states.

| Stop | Direct interaction | Learning operation |
|---|---|---|
| A message in the storm | Send, observe missing reply, resend same ticket, collect | Distinguish failed acknowledgement from failed effect; retained idempotency |
| Pip loses the ticket | Restart, try new identity, recover journal ticket, rewind a duplicate | Durable business intent versus process identity |
| When the workshop forgets | Advance beyond retention, inspect durable order register | Bounded deduplication and explicit reconciliation |
| The storm engine | Construct four rules; execute seven disruptions; revise | Combine identity, payload binding, expiry and uncertainty handling |
| Detour | Two-hour window; order never arrived; authoritative absence permits a new attempt | Transfer to a materially different failure, not cosmetic replay |

A safe boss policy repairs the bridge and opens the detour. `Retry forever` is tested against executable counterexamples, not accepted because the player also entered correct legacy counts. Passing proves only the bounded simulated cases, not general system safety or mastery.

## Interface and feedback

Keep the main playfield open. A persistent HUD carries the plain objective, progress and save state; secondary aid/source/evidence details are contextual. Show immediately relevant actions beside the game. Stable tap/keyboard targets are required; motion must not move a target while the player selects it.

Use cause-driven transitions for orders, retries, collection and the restored bridge. Optional sound is off until chosen. Essential meaning remains in semantic text/state with motion reduced and sound off. Native buttons and textual world/knowledge labels are primary controls; SVG is not the sole accessible interface. Small-screen and enlarged-text verification must inspect actual computed sizes, not merely set a CSS value that leaves fixed-pixel text unchanged.

Selecting a different boss rule invalidates the old test result until the new policy is executed. A pending save retains the move, blocks a duplicate next action and offers retry of the same command. Normal navigation must not erase a pending choice. Completed sequential missions point to the next unlocked stop; failed missions remain the retry target.

## Learning and persistence contracts

Game progression and learning evidence are different systems. XP, animation and clears are presentation/motivation, never mastery. Commands carry learner identity, command ID and expected revision; the server replays the pinned model, validates progression and preserves immutable submissions. New assessment meaning receives new activity/frame/family identities. Historical content remains unchanged.

Feedback from experimentation is observed assistance, recorded before a guided result. An empty earlier checkpoint remains not observed. Unknown declaration, current assistance and prior exposure remain distinguishable. Rewind resets a rehearsal but never deletes prior move/help history. Free prose is not graded by keywords or a counts-only evaluator.

The durable order register is a separate explicit service from retry memory. At/after retention expiry, a matching old ticket alone does not guarantee deduplication. A confirmed committed order, authoritative absence with no in-flight request, and an unavailable register must yield different safe behaviors.

## Research and inheritance

The new acceptance contract records continued primary-source research from Celia Hodent (onboarding), Zachtronics (iterative construction), Hempuli (rules embodied in play), Game Accessibility Guidelines and AWS Builders Library (retry semantics). These are design inputs; they do not promise youth engagement.

The earlier Expedition 33, Witcher 3 and Breath of the Wild inspiration, detailed HUD/story principles, original campaign description and historical implementation order are preserved verbatim in [history/GAME-UX-SYSTEM-before-nine-20260908.md](history/GAME-UX-SYSTEM-before-nine-20260908.md). Its earlier threshold/stop status is historical.

Future course generation must produce a coherent playable teaching system—not only lesson prose. [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md) remains the detailed package contract, amended by the newer **youth-engagement, genuine independent critic and >=9.0 gate** in GAME-ACCEPTANCE-9.md. Specify audience assumptions, first meaningful action, curiosity/experimentation, progression, feedback/recovery, ending/replay, assistance and validation evidence. Inherit these principles, not mandatory fantasy artwork, a fixed number of nodes or one universal mechanic.

The current work remains private Phase 1 refinement. Course-generation implementation, broader testers and paid infrastructure have not been opened. Consult STATE.md for executed checks and the independent-critic prerequisite.
