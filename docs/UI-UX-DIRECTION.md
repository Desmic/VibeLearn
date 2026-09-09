# VibeLearn UI/UX direction — commercial game first, serious learning underneath

Status: active direction after user review on 9 September 2026. Read [COMMERCIAL-GAME-BAR.md](COMMERCIAL-GAME-BAR.md) first.

## Product feeling

VibeLearn should feel like **a real learning game for serious technical skills**, with a learner-facing experience credible against the interaction/onboarding/pacing/polish expectations of Play Store or Steam games. It must not feel like a premium SaaS/course website that happens to contain XP, missions, cards or a 3D scene.

This is not a requirement for AAA visuals, combat, free-roaming 3D or one genre. It is a requirement that the primary experience is game-like: coherent world/context, clear player role, direct actions, visible consequences, responsive feedback, growing agency, recoverable failure, progression, satisfying resolution and coherent game menus.

The evidence model, persistence, provenance and assessment rules remain rigorous under the surface. Those systems should not dominate the learner-facing presentation with implementation/admin language.

## User authority

The user is currently the only real product user/reviewer. Their latest explicit judgment overrides all agent/critic/automated scores for product acceptance. A critic >=9.0 can only make a candidate ready for user review; explicit user acceptance is required for acceptance. Do not open to other users before acceptance and later explicit authorization.

Latest user verdict on the current experience: **5/10 game experience and 5/10 learning experience**. The largest immediate problem is lack of clarity about what the game is, who Pip is, what happened, why retrying may create duplicates and what the player's goal is.

## First-minute direction

The first minute must make the player understand the world/problem before jargon. For the current Missing Delivery reference, add an approximately **15–20 second skippable/replayable story sequence**:

1. Pip is the valley courier; the workshop supplies needed parts.
2. Pip has already sent an order for one bridge gear.
3. A storm swallows the reply, making the result uncertain.
4. Sending again blindly may produce two gears when only one is wanted.
5. The player is asked to help Pip discover the truth, restore the signals/network and make one intent lead safely to one result.
6. At the right moment, bridge the intuitive story to the same retry/uncertainty problem in real software.

The reduced-motion/skip path must preserve the same causal explanation. The intro is replayable from a game menu/help surface. After the opening, move into meaningful interaction quickly instead of another briefing wall.

Generated courses inherit this **opening comprehension contract**, not the exact Pip/storm story or duration.

## Design principles

### 1. Playfield first

The main surface should feel like the game world/playfield. HUD and contextual controls support the action. Avoid giant web-page headings, dense cards, dashboards, forms, tables and persistent utility chrome dominating the view.

### 2. The player has a role, not merely a lesson task

Each chapter establishes who/what the player is in relation to the situation, what matters, what changed and what success means. The role may be investigator, operator, builder, scientist, strategist, debugger, designer or another domain-appropriate identity. Do not force one fantasy template.

### 3. Clarity before decoration

Motion and visual staging should communicate causality:

- show what happened and why;
- show state transitions and consequences;
- make saves/resume settle visibly;
- make hints feel optional, not required paperwork;
- make committing a decision feel consequential;
- make failure readable and recoverable;
- make completion feel earned.

Pure decorative motion is lower priority.

### 4. Gamefulness is continuous

Do not concentrate all game feel in the intro, map or reward screen. The core loop itself must remain game-like:

`understand -> act -> see consequence -> update hypothesis -> gain/use capability -> face variation -> recover/adjust -> resolve`

### 5. Agency grows with progression

New missions should unlock new interactions, tools, viewpoints or strategic options. Merely adding more text, more fields or more answer choices is not meaningful progression.

### 6. Menus are part of the game

Pause, resume, replay intro, controls, accessibility, help and save state should feel like coherent game menus. Avoid learner-facing terms such as draft revision, backend mode, evidence schema or database state unless genuinely necessary and translated into player language.

### 7. Serious learning remains underneath the game

XP does not determine mastery. Assistance remains recorded. Evidence remains inspectable and immutable. Repeated familiar practice does not become independent mastery because the game celebrates it.

### 8. Saving must be obvious

Use player language such as **Save progress**, **Resume run** and **Continue mission**. A learner should immediately understand that progress persists. Submitted/finished runs should not expose irrelevant save controls.

### 9. Motion and interaction are accessible

All animation must respect `prefers-reduced-motion`; essential meaning must also work with sound off. Preserve keyboard operation, touch targets, contrast, text enlargement, narrow layouts and renderer fallbacks.

## Interaction hierarchy

- **primary game action** — tactile, obvious, high-energy where appropriate;
- **context action/tool** — visible near the affected object/state;
- **optional help/intel** — discoverable but subordinate;
- **game menu/system utility** — quiet and consistent;
- **evidence/admin detail** — normally hidden from the primary game loop unless requested.

## Current implementation interpretation

The current illustrated/Three.js Missing Delivery candidate is still a prototype. A map, renderer and animated scene do not prove the commercial-game bar. The next product work should prioritize first-minute comprehension, playfield hierarchy, meaningful alternative actions, causal world response, growing agency and satisfying failure/recovery before adding more scenery.

## Explicit non-goals

- copying commercial game assets/UI verbatim;
- adding 3D just to appear game-like;
- manipulative streak loss, shame or fake urgency;
- grind, currencies, shops or leaderboards used to mask a weak loop;
- hiding uncertainty/evidence problems under celebration;
- simplifying technical rigor merely to maintain flow;
- opening to additional users before the current user accepts the experience.