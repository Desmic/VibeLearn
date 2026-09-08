# High clarity and real-world application — Stormworks contract

Active user clarification, 9 September 2026: work toward >=9/10 in our own review, keep clarity high, and enable the learner to apply knowledge to real situations. This supplements GAME-AS-COURSE.md, GAME-ACCEPTANCE-9.md and COURSE-GENERATION-GAME-SYSTEM.md. It does not open Phase 2/3 or authorize a public rollout.

## What the player must understand

At every encounter, make the immediate goal, available meaningful actions, relevant facts and outcome of the last action legible together. Unknown is a real state, not a hidden synonym for failure. Distinguish the world's actual effects from what the actor can justify from its observations. Technical terms should name an already understandable model, not precede it as an entry test.

A useful wrong idea must produce comprehensible consequences and a recovery path. Prefer bounded experiments, visible causal routes and revisable construction over long explanations. Do not make the only plausible action the answer the player is supposed to discover. Keep input targets stable and reachable on touch and keyboard, including enlarged text. Avoid rewarding a lucky outcome caused by an unjustified unsafe action.

The current implementation is an eight-stop reference, not a universal format for courses. The primary route is /storm on branch game/stormworks-clarity-transfer. It remains a draft candidate, not accepted or deployed.

## Capability-to-play-to-application ledger

| Capability | Concrete practice | Transfer/application now present | Evidence still missing |
|---|---|---|---|
| Distinguish unknown acknowledgement from failed work | First order commits but receipt disappears; world and courier state shown separately | Reservation API timeout with a different retention contract | Independent explanation in an unfamiliar unrestricted situation |
| Preserve business intent through restarts | Recover the original journal ticket instead of using a restarted worker's ID | Webhook event versus delivery identity; local request_key repair | Learner-authored durable production integration |
| Respect finite retention | Late retry visibly duplicates; inspect a distinct durable order record | Payment/provisioning timing cases; exact-boundary lab test | Arbitrary provider behavior and concurrency coverage |
| Bind parameters and distinguish new intent | Changed lamp/bell request conflicts; hold it or explicitly authorize an additional order | Changed reservation quantity; identical-but-separately-authorized job; lab parameter test | Real authorization and payload canonicalization implementation |
| Preserve uncertainty while eventually progressing | Unavailable record remains pending; reconnect, establish final absence, then send | Late unreachable provider versus final-absence fulfilment case; next_action repair | Recovery under real eventual consistency and concurrent requests |
| Construct and diagnose a strategy | Six-condition tool routing, partial experiments, executed traces and follow-wire navigation | Different incident conditions and an exported deployment checklist | Learner-created general program/design, beyond choosing supplied actions |
| Scope identity correctly | Formal bridge from order identity to scoped real-service intent | Event/tenant/operation cases and unambiguous-key lab tests | A dedicated earlier hands-on multi-tenant encounter and learner implementation evidence |
| Retain and transfer knowledge later | Current night shift changes context and timings | A second immediate scenario set and local extension tasks | Delayed retrieval is not measured; this immediate replay must not be labeled spaced retention |

The rightmost column stays visible to the system. A capable learner endpoint is not demonstrated by showing every term or awarding every light. Do not claim course equivalence while required outcomes remain unassessed.

## Practical repair lab

web/retry-lab.py is a Python 3.10+ standard-library-only exercise. It uses a disposable local SQLite receiver, not real purchases, credentials or network requests. The --demo path produces actual local duplicate effects and illustrates finite cache retention. The --test path initially fails; the learner repairs request_key and next_action without changing tests.

The eleven tests cover restart-stable identity, distinct authorized intents, tenant/operation scope, unambiguous key encoding, a real local duplicate effect, an in-window retry, exact expiry, changed parameters, confirmed late intent, unavailable outcome and strong final absence. The project's RepairLabTests verifies that the broken starter fails and a reference repair passes. It does not observe a learner completing the lab or prove the repaired dispatcher is production-ready.

The in-game JSON runbook carries the player's decisions, bounded assessment and help history, plus an explicit production checklist. It labels production integration, implementation skill, delayed retrieval and course-equivalent mastery as unverified. Download/export actions do not unlock mastery.

## Fidelity limits the metaphor must preserve

The workshop uses a declared atomic local effect-plus-retry-record model and a finite memory window. Its separate authoritative order records are an extra capability, not infinite deduplication. In the absence fixture, the provider explicitly guarantees both no prior effect and no in-flight request. An ordinary 404 or stale empty read is not that guarantee. A local database transaction cannot make an arbitrary remote provider call atomic.

Hold means pending resolution, not permanent abandonment. A strategy must deliver when justified as well as avoid duplicate effects. Changed parameters cannot silently overwrite an old intent. Two separately authorized identical requests can be two legitimate intents. The user of the real system must check its actual provider-specific contract, not copy the game's 24-hour window as a universal rule.

## Research grounding

Inspected primary sources used as design constraints, not claims of VibeLearn effectiveness:

- AWS Builders Library, Malcolm Featonby, Making retries safe with idempotent APIs: caller intent, retry identity, semantic equivalence, changed parameters and late-arrival constraints. https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
- Stripe API, Idempotent requests: a concrete provider contract for retained results, parameter consistency and key pruning; it does not establish universal guarantees for other services. https://docs.stripe.com/api/idempotent_requests
- Celia Hodent, The Gamer's Brain Part 2: contextual onboarding, player understanding and engagement. Used to reduce early load and connect actions with meaning, not to certify that a young audience will enjoy this candidate. https://celiahodent.com/gamers-brain-ux-onboarding/

## Acceptance and generated-course inheritance

Retain the fixed eight game-review weights, unrounded >=9 threshold, both audience lenses, no critical blockers and the user's final review. The current authorized method is internal_tool_assisted; label it accurately. No separate agent or human enjoyment evidence is implied.

Future course packages must include this capability ledger, a readable first encounter, fading scaffolding, varied practice, fresh-context assessment, an authentic application artifact where promised, and scheduled retrieval evidence where retention is claimed. A technical course that promises implementation must eventually assess implementation, not only symbolic clicking. A delightful shallow game and a correct tedious lesson both fail. Do not compensate for an experience deficit by lowering learning rigor.
