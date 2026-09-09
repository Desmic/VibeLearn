# VibeLearn commercial game bar — user authority and release gate

**Active product authority — 9 September 2026.** This document records the user's latest product decision and must be read with `STATE.md`, `GAME-AS-COURSE.md`, `GAME-ACCEPTANCE-9.md`, `GAME-UX-SYSTEM.md`, `GAME-UX-REVIEW.md` and `COURSE-GENERATION-GAME-SYSTEM.md`.

## 1. The user is the authoritative product reviewer

At the current stage there is one real user/product owner. **That user's judgment overrides every agent, critic, automated score and historical review.** Do not average the user's score with an agent score, use a higher critic score to overrule a rejection, or describe a candidate as accepted because automation passed.

The critic gate is an engineering/product-quality pre-gate only:

- an unrounded critic score below **9.0/10** or any critical blocker means `needs_revision`;
- critic >=9.0 with no blocker may advance only to `ready_for_user_review`;
- any explicit user rejection returns the candidate to `user_rejected` / `needs_revision`, regardless of critic score;
- only explicit user acceptance may set `user_accepted`;
- no silence, lack of response, test pass, deployment, screenshot, review artifact or historical score counts as user acceptance.

The latest user direction is positive about the new story/progression/UI but is **not acceptance**. Historical 5/10 and agent scores remain evidence, not the current release decision.

## 2. Do not open the experience to other users yet

VibeLearn stays a private product-refinement environment until the current user explicitly judges the experience acceptable. **Do not recruit, invite, expose, or use external learners/testers as a substitute for fixing a product the sole current user has not accepted.** Existing infrastructure verification accounts are not product playtest authorization.

External-user testing becomes a later, separately authorized stage after `user_accepted`. The purpose of that later stage is to learn how the accepted design generalizes, not to outsource the current acceptance decision.

## 3. The quality bar is a real commercial game, not a gamified website

The learner-facing experience must feel like **a game someone could credibly expect to install from the Play Store or download/buy on Steam**. This is a standard for interaction, onboarding, pacing, feedback, cohesion and polish; it does not require AAA art scope, cinematic budget, combat, free-roaming 3D or a particular genre.

A candidate fails this bar when its primary impression is still a website, dashboard, course page, card stack, form workflow or quiz with game vocabulary layered on top. A renderer, animated background, XP, badges or a campaign map cannot by themselves make it a game.

A credible commercial-game experience normally has:

- an immediately understandable premise and player role;
- a playfield or game scene as the primary surface, with HUD/context around play rather than web chrome dominating it;
- responsive controls and obvious input acknowledgement;
- actions that visibly change the world/state and create consequences;
- coherent visual, motion, sound/haptic intent and feedback language;
- clear goals, progression, unlocks/tools/capabilities and rising challenge;
- recoverable failure, satisfying success and an earned ending;
- menus, pause/resume, save/load and settings that feel like parts of the game rather than admin forms;
- replay/variation that changes reasoning or strategy;
- accessibility and fallbacks that preserve the same required play.

Learning evidence, provenance and assessment may remain rigorous underneath this surface. They must not force the learner-facing loop back into SaaS/reporting UI.

## 4. First-minute comprehension is a hard product requirement

The current Missing Delivery reference failed because the player did not immediately understand the world, Pip, the storm, the missing acknowledgement, the duplicate-delivery risk or the player's role. That is simultaneously a game-design failure and a learning-design failure.

For the current reference, implement a short **approximately 15–20 second skippable/replayable opening story sequence** before normal play. It should communicate visually and with minimal text:

1. **World / character:** Pip is the valley courier and the workshop supplies what the valley needs.
2. **Inciting event:** Pip already sent an order for one bridge gear; a storm swallowed the reply.
3. **Risk / stakes:** blindly sending again may produce two deliveries when only one was wanted.
4. **Player role / goal:** help Pip discover what happened, restore the network/signals and learn how one intent can safely lead to one result.
5. **Transfer bridge:** make it clear, at the right moment, that the same uncertainty/retry problem appears in real software systems.

Reduced-motion mode must preserve the same causal sequence without relying on animation. `Skip intro` must not skip essential knowledge; the concise static equivalent must remain available, and the intro must be replayable from a game menu/help surface.

After the opening, move quickly into a meaningful action. Do not follow the animation with another exposition wall or a website-like briefing page.

## 5. The first chapter must establish a usable world model

The newest user feedback raises the bar beyond the opening hook. **By the end of Chapter/Signal 1, the player should understand the story well enough to reason inside it without guessing what the nouns mean.**

For every important early actor/object/resource/state, Chapter 1 should make clear:

- what it is;
- what it does;
- who needs or uses it;
- why it matters;
- what visible consequence follows when it is missing, duplicated or wrong;
- how it connects to the character/system asking for help.

For Relay Rescue, the minimum inventory is Pip/courier, workshop, footbridge, bridge gear, job ticket and reply/acknowledgement. The player should see that one gear repairs the bridge, Pip needs the bridge route reopened, the workshop makes the gear, the ticket identifies the job, and a lost reply creates uncertainty even if the gear already exists. The exact vocabulary is reference-specific; generated games need their own domain-faithful inventory.

Prefer **simple causal animation and direct interaction** over a glossary or explanation wall: show the gear affecting the bridge, the order/ticket travelling, the workshop acting, the reply disappearing, and the duplicate consequence. Keep a concise in-world key/reference afterward when later decisions still depend on those objects.

This is a comprehension/coverage requirement, not a claim that an automated text-presence assertion proves the human learned it. The user remains the real judge.

## 6. Game continuity includes login and recovery

Authentication, recovery, loading, save/resume and settings are part of the perceived product. A polished game should not abruptly become a generic SaaS form before play begins. **Hosted sign-in/recovery should preserve the game's visual language, world and sense of continuity while keeping conventional security semantics clear.**

Do not gamify credentials or obscure what an email/password/reset action does. The correct pattern is game-world framing around a familiar, accessible authentication form: recognizable controls, visible error/recovery states, keyboard/mobile support and unchanged security boundaries underneath.

## 7. The opening pattern generalizes; the exact story does not

Generated subjects do not all need Pip, a valley, a storm, animation, fantasy or a 20-second cutscene. They **do** need an equivalent game-quality onboarding contract: establish the world/context, player role, meaningful objective, stakes/change and first actionable problem before specialist abstraction where faithful to the domain.

Choose the best opening form for the subject: animated cold-open, interactive incident, playable tutorial beat, dialogue scene, simulation event, mystery reveal, construction failure, scientific observation, professional emergency or another coherent device. The opening should teach causality and motivation, not merely decorate the course.

## 8. Commercial game feel is continuous, not a one-time intro polish pass

The intro cannot compensate for a weak loop. Every mission should preserve:

`understand situation -> act -> see causal consequence -> form/update hypothesis -> use or unlock capability -> face harder variation -> recover/adjust -> earn resolution`

The player should progressively gain agency. New mechanics/tools should let the learner do something new, not simply expose more terminology or larger forms. Bosses recombine taught rules and operations rather than introducing surprise UI/prerequisites. Endings should resolve the situation and make competence visible, then offer a meaningful next possibility.

## 9. Review implication

The frozen critic must review the product against credible commercial game expectations, not against the previous VibeLearn build or educational-web competitors alone. A score >=9 is meaningful only if the reviewer can defend that the experience has crossed from **"gamified learning website"** into **"actual learning game"** in the complete rendered journey.

The critic should explicitly include first-minute comprehension, first-chapter world-model comprehension, login/recovery continuity, direct playfield interaction, progression and ending quality. The user remains the final judge after that gate.