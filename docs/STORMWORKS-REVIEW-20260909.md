# Stormworks internal game review — 9 September 2026

## Verdict

**8.574/10 unrounded (8.6 displayed): NEEDS REVISION. Target >=9.0 not met.**

Method: internal_tool_assisted, authorized by the user while Codex is unavailable. Reviewer: the implementation agent in a frozen-candidate critique pass, using real automated browser journeys, rendered screenshots, traces, reports and code. Not a separate agent/model, unrestricted personal playthrough, authenticated production journey or youth playtest. Audience appeal is a design hypothesis, not measured enjoyment.

Frozen runtime: **039bf542b213fd172fab3d91103ebb135a0da3d4**. Tree: e535eb62189a4f7fda6170b7041c17a38e4f4374. Branch game/stormworks-clarity-transfer, draft PR #3, route /storm. Later documentation changes do not alter this reviewed runtime.

This review concerns Stormworks, not concurrent Relay Rescue on PR #2. The historical 7.02 expedition score describes a different candidate. The difference is not a controlled user-study effect size.

## Verified evidence

GitHub Actions **run 180 / 34275884154**, job **102228644977**, completed successfully. Pinned vendor step, build, **93 Python/hosted/PostgreSQL tests** and **four browser modules** passed. Chromium 138.0.7204.23; the Stormworks report contains no page errors.

The run's synthetic merge is **6e130ad1a9f4c3bbe964a684ecdf1c5ec2dc7643**. Source artifact **10075673597**; rendered evidence artifact **10075739281**. Both were downloaded; source and rendered outputs were inspected. GitHub artifacts expire and are not permanent evidence storage.

The browser journey uses real temporary local HTTP servers/databases, actual server-process restart and deliberately lost responses after actual commits. It tests native scene sending and journal recovery, visible duplicates/rewind, payload conflict, unavailable records, final absence, partial strategy experiments, a failing all-retry plan and repaired plan, follow-wire focus, mobile wiring, dirty navigation/reload, ordered sockets, failed route refresh after a committed result, incident answer withholding, failed-transfer locks, prior-exposure semantics, exports, night shift, old-route compatibility, 320/390px touch and actual 200% feedback-text enlargement. These game journeys use disposable local databases; hosted/PostgreSQL tests are separate and do not establish a new production playthrough.

Run 177's full new journey reached its final mobile isolation assertion but failed because that assertion expected a still-locked second mission after the same test had cleared the first mission. The expectation was corrected with both progression and isolation checks preserved. Run 178 passed expanded recovery checks; visual review then exposed mobile tool-to-socket scrolling friction. Run 180 adds a reachable toolbelt, partial plans, scene controls and trace-to-wire focus. Failed runs are not hidden or counted as passing evidence.

Representative artifacts: storm-first-action.png, storm-setback.png, storm-payload-conflict.png, storm-unknown.png, storm-engine-passed.png, storm-partial-plan-mobile.png, storm-harbour-restored.png, storm-real-incident.png, storm-incident-mobile.png, storm-mobile-390.png, storm-mobile-320.png, storm-mobile-200.png, storm-trace.zip, storm-browser-report.json and storm-runbook-example.json.

A local browser attempt was administrator-blocked; that policy was not bypassed. Headless automation is not a physical-phone, screen-reader or free-form human playtest. Automated first-action timing is not a human onboarding measurement. No frame-rate or youth-retention claim is made.

## Frozen scores

| Area | Weight | Raw /10 | Evidence and remaining criticism |
|---|---:|---:|---|
| Game identity | 15% | 8.2 | Native scene objects change the simulation; lights and restored harbour provide an arc. Later encounters still expose substantial condition/answer-panel structure. |
| HUD / clarity | 15% | 9.0 | Immediate objective, actual effects, actor knowledge, ticket details and current actions are readable together. First action is above the tested desktop fold; larger mobile decision text and reachable tools improve use. Dense later terminology remains a concern. |
| Core loop | 15% | 8.5 | Experiments, meaningful mistakes, alternative legitimate resolutions, partial plans and trace-to-wire repair give more ownership. The finite authored conditions still limit discovery and strategy depth. |
| Progression | 15% | 8.7 | Changed requests and unavailable records now have hands-on preparation before construction; real-service cases change the context. Scoped multi-tenant identity has less concrete early preparation, and the incident transition risks feeling like an exam after the game. |
| Feedback / game feel | 12% | 8.1 | Clear causal outcomes, retained success explanations, visible effects, route inspection and recoverable failures support understanding. Feedback remains modest; the later rhythm is still often choose, run, read rather than sustained immersive play. |
| Theme / cohesion | 10% | 8.5 | Pip, journal, storm and harbour lights form a coherent reference. Illustrated construction monitor matches the world better. The incident desk is useful but a noticeable shift into a conventional panel interface. |
| Learning integrity | 10% | 9.2 | Server replay, all 4,096 complete plan combinations, safety/liveness, lucky-unsafe rejection, withheld transfer feedback, immutable evidence and help/exposure semantics are strong. This score rewards truthful evidence boundaries, not demonstrated course equivalence. |
| Accessibility / responsiveness | 8% | 8.4 | Native controls, 44px scene targets, keyboard focus, optional dragging, reduced motion, narrow touch use and doubled text were checked. Full assistive-technology and physical-device behavior remain unvalidated; long mobile construction/incident surfaces still deserve scrutiny. |

Calculation: (8.2*15 + 9*15 + 8.5*15 + 8.7*15 + 8.1*12 + 8.5*10 + 9.2*10 + 8.4*8) / 100 = **8.574**. The decimal places are arithmetic, not psychological precision. No points were awarded merely for code volume, passing tests or adding an external lab.

## Audience hypotheses

**Younger non-specialist — needs revision.** Assume comfort with short English instructions and curiosity, not prior backend knowledge. Sending via a visible post, seeing the receipt disappear, making an extra lamp and recovering the journal can sustain early interest. Lights offer a comprehensible goal. Likely first serious friction is managing six abstract condition labels, followed by technical incident prose. The reason to see the harbour restored is stronger than the reason to replay the fixed cases once solved. Not a confident >=9 voluntary-play verdict.

**Older teen / young adult — needs revision.** A player interested in systems can explore alternatives, distinguish safety from liveness and debug a partially built plan. The real-service incidents and runnable coding task give the session practical relevance. But many choices remain finite and recognizable; after finding a safe routing policy, replay adds limited strategic freedom. Likely abandonment is when the ending leads into conventional answer selection rather than another compelling application encounter. Useful is not automatically irresistible.

Both lenses were considered with XP hidden by default. These are our predictions, not statements that children or young adults actually played or enjoyed the game.

## Remaining blockers toward >=9

**G1 — Later play remains too panel-driven.** Construction is more interactive than the old four-choice boss, but still approximates condition/tool matching. The next improvement should require manipulating a small working system, inspecting resulting traces and discovering a repair, not merely adding more sockets or visual scenery.

**G2 — Practical transfer interrupts the game rhythm.** The incident desk withholds feedback correctly and changes the problem context, but it visibly returns to a question/answer interface. Preserve assessment rigor while turning the endpoint into an application encounter whose decisions change the system being repaired.

**G3 — Voluntary replay needs richer decisions.** Different contexts exist, but a fixed small set of cases is not enough to claim that either audience will choose another run. Improve strategic alternatives and meaningful variations rather than rely on XP, grinding or cosmetic novelty.

**L1 — Demonstrated implementation and retention remain incomplete.** The provided repair lab is executable and its tests meaningful. The app has not observed the learner completing it, defending a design, integrating a provider or remembering the ideas later. This does not invalidate the current bounded scenario evidence, but it blocks a broad course-equivalent mastery claim.

## Concrete gains in this iteration

The implementation now teaches formerly underprepared edge cases, rejects lucky unsafe behavior, lets the player test partial strategies, follows failures back to a specific rule, recovers clearing results after lost responses, and separates committed results from failed map refreshes. It provides fresh-context decisions and a real code-repair artifact without falsely grading downloads as skill. These are substantive gains, not final acceptance.

Current state remains needs_revision, independent score null, user final review pending. No live deployment or production data changes. Preserve concurrent PR #2 while deciding how to consolidate the candidate experience later.
