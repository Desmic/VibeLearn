# VibeLearn UI/UX direction — game-first, premium learning

Status: adopted direction after live learner feedback on 8 September 2026.

## Product feeling

VibeLearn should feel like **a learning game for serious technical skills**, not a
premium SaaS website that happens to contain XP.

The evidence model, persistence, provenance and assessment rules remain rigorous under
the surface. The learner-facing experience should be playful, energetic, visual and
motivating enough that doing difficult practice feels intrinsically fun.

The working blend is:

- Brilliant-like learning by doing and rapid feedback;
- Duolingo-like mission/progression craft, tactile interactions and moments of delight;
- technical depth that never gets simplified merely to make the screen look playful.

Reference principles, not assets:

- https://blog.duolingo.com/core-tabs-redesign/
- https://brilliant.org/

## Learner feedback that changed the direction

The first premium refinement was accepted aesthetically, but the live learner trial
surfaced three stronger product issues:

1. the challenge itself could be presented more clearly;
2. the experience needs more purposeful animation and visual causality;
3. the interface still felt more like a polished website than a game.

The learner also could not discover the old `Save draft` behavior. That is treated as
a UX failure even though the backend persistence feature worked: implementation
terminology should never be required to understand the learning flow.

## Design principles

### 1. The learner is on a mission

Practice activities should have an objective, stakes, stages and a clear finish. Use
language such as mission, run, stage, challenge, power-up and debrief where it improves
clarity. Do not gamify database/evidence terminology.

### 2. Clarity before decoration

Animation should explain what happened or what changed:

- reveal the causal sequence of an incident;
- show mission progression;
- make a saved state visibly settle;
- make hints feel like optional assistance;
- make submission feel like committing a decision;
- make completion/reward feel earned.

Purely decorative motion is lower priority.

### 3. Gamefulness should be present throughout the learning loop

The earlier rule restricted strong visual treatment mostly to rewards. That was too
conservative. The new rule is:

**The core learning loop may feel gameful at every stage, while system/admin controls
remain quiet.**

The problem, prediction, hints, source discovery, submission and debrief can all use
color, motion, staging and tactile feedback.

### 4. Serious learning remains underneath the game

XP does not determine mastery. Assistance remains recorded. Evidence remains
inspectable and immutable. Repeated familiar practice does not become independent
mastery merely because the game celebrates it.

### 5. Saving must be understandable without implementation vocabulary

Learner-facing copy uses **Save progress**, not `Save draft`. A learner should
immediately understand that saving lets them pause an active run and resume it later.
Submitted runs do not show a save action; starting another run creates a new savable
state.

### 6. Motion is accessible

All animation must respect `prefers-reduced-motion`, keyboard operation, touch targets,
contrast, zoom and narrow screens.

## Visual/game language

### Core accents

- electric lime — progress, assistance, success, mission energy;
- violet — exploration, resources, depth, future progression;
- deep navy — mission HUD, committed actions, technical seriousness;
- amber — genuine warning/uncertainty only.

### Interaction hierarchy

- mission action — tactile, high-energy primary control;
- secondary learning action — visible but clearly subordinate;
- power-up/help — playful but optional;
- utility/system action — visually quiet.

## Current implementation state

### Auth

- focused login state;
- inline password visibility controls;
- tertiary password recovery;
- raw browser AbortSignal/timeout messages are normalized to a learner-facing retry
  message;
- client timeout budget is increased for free-tier wakeups;
- after a transport failure during login, the client checks whether the authenticated
  session actually succeeded server-side before reporting failure.

### Mission entry

- the episode is framed as `MISSION 01`;
- objective is `Defuse the duplicate charge`;
- the learner sees three explicit goals before starting;
- first-clear XP is visible without implying mastery;
- LEARN/PAIR/BUILD is framed as a play style rather than a backend mode selector.

### Active mission

- mission HUD shows stage/progress;
- incident objective is explicit;
- timeline elements reveal sequentially to reinforce causal order;
- `Save progress` includes the explanation `Pause here and resume this run later`;
- submission is framed as `Lock in answer`;
- hints are framed as optional power-ups;
- source access remains optional exploration.

### Completion

- completion advances the mission bar to 100%;
- feedback rows stage in after submission;
- reward surface gets a stronger completion animation;
- replay is framed as `Play another run` while keeping familiar-practice evidence rules.

## Next refinements as the product grows

Refine game feel alongside product features rather than doing another isolated polish
cycle. Candidate directions:

- richer animated system traces and state transitions;
- interactive diagrams/simulations instead of static tables when useful;
- clearer challenge maps and progression between activities;
- retrieval/review missions;
- stronger moment-to-moment feedback while solving;
- sound/haptics only if platform support and learner preference justify them;
- identity/progression systems that celebrate practice without corrupting mastery
  signals.

## Explicit non-goals for now

- copying Duolingo/Brilliant artwork or layouts;
- manipulative streak loss or punishment mechanics;
- leaderboards before we know they help learning;
- currencies/shops merely to increase engagement;
- hiding evidence or uncertainty behind celebratory UI;
- making technical material easier than it should be just to preserve flow.
