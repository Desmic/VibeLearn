# VibeLearn game UX system

Status: adopted product direction after the 8 September 2026 learner review.

## North star

VibeLearn should feel like a **learning game whose mechanics happen to teach serious technical ideas**, not a website with XP, missions, and game vocabulary added on top.

The learning model stays rigorous underneath. Game progression, XP, animation, mission clears and unlocks are motivational/presentation systems; they must never silently become evidence or mastery claims.

## Research basis

The current direction is grounded in game-UX references rather than SaaS UI references:

- Celia Hodent, *The Gamer's Brain — UX of Onboarding and Player Engagement*:
  https://celiahodent.com/gamers-brain-ux-onboarding/
  - teach by doing;
  - keep early cognitive load very low;
  - teach one thing at a time;
  - make the purpose/goal clear;
  - make short-, medium- and long-term progression visible;
  - future/empty slots can tease what the player will unlock.
- Celia Hodent, *Developing UX Practices at Epic Games*:
  https://celiahodent.com/ux-practices-epic-games/
  - inviting signs draw attention;
  - informative signs stay legible without stealing attention;
  - every input needs meaningful feedback;
  - consistency reduces relearning/friction.
- Game Developer, *6 examples of UI design every game developer should study*:
  https://www.gamedeveloper.com/audio/6-examples-of-ui-design-that-every-game-developer-should-study
  - HUD design shapes player behavior;
  - the best HUDs feel intrinsic to the experience rather than like an overlayed website.
- David Candland, Destiny UI/UX:
  https://www.cand.land/destiny/
  - persistent HUD information stays minimal and legible;
  - contextual information appears only when needed;
  - keep the main playfield open.
- Game Developer, *Gameplay progression* and difficulty-curve material:
  https://www.gamedeveloper.com/design/gameplay-design-fundamentals-gameplay-progression
  https://www.gamedeveloper.com/design/difficulty-curves-how-to-get-the-right-balance-
  - give players an early easy win;
  - raise challenge with competence;
  - avoid difficulty walls/spikes;
  - periodically let players feel powerful before raising difficulty again.
- Game Accessibility Guidelines:
  https://gameaccessibilityguidelines.com/full-list/
  - interactive tutorials;
  - clear language and readable defaults;
  - large/spaced controls;
  - do not rely on colour alone;
  - allow reduced motion / avoid unnecessary background movement.

## UI architecture

### 1. HUD, not website navigation

Persistent top HUD:

- current level / boss state;
- mission title and objective;
- chapter completion meter;
- XP;
- save/sync state;
- campaign-map access.

Persistent bottom tool dock:

- Hint / power-up;
- Intel / source;
- Play style;
- Save.

Tools open compact HUD drawers. They do not occupy a permanent right-hand website rail.

### 2. Playfield is the centre

The central screen is where the player reads the incident, observes the trace and makes decisions.

Core predictions are direct game choices (`1 charge` / `2 charges`) rather than comma-separated form entry. Written explanations only appear when the mission is meant to exercise explanation/design.

### 3. Campaign map is macro progression

The first chapter is **Reliable Agents — Retry Control**.

| Level | Difficulty | Core mechanic | Cognitive load | Unlock purpose |
|---|---|---|---|---|
| 1 — Replay, don't repay | Tutorial | Same retained key replays | One run, one decision | Establish first easy clear |
| 2 — The key changed | Easy | Worker ID is not business intent | One run, one decision | Contrast identity failure |
| 3 — The record expired | Medium | Retention boundary | Two runs + short explanation | Combine identity with time |
| 4 — The retry that charged twice | Boss | Full identity + retention contract | Three runs + design diagnosis | Recombine prior mechanics |

Unlocks are sequential and enforced server-side. A player cannot start a locked mission simply by forging a client request.

The historical Phase-1 three-trace episode remains immutable as old evidence. The campaign uses new activity/family IDs.

### 4. Micro progression inside a mission

A mission should expose only the current objective, current scenario and immediately useful tools.

Feedback hierarchy:

1. input acknowledgement;
2. decision selected;
3. progress saved;
4. hint/intel reveal;
5. answer lock-in;
6. clear/retry result;
7. XP / next mission unlock;
8. later recall quest.

Each meaningful action should receive perceptible visual feedback. Motion should communicate causality/state change, not merely decorate the screen.

### 5. Game progression vs learning evidence

Keep these systems separate:

**Game progression**
- mission clear;
- XP;
- rank;
- chapter unlock;
- cosmetic/game presentation.

**Learning evidence**
- pinned task snapshot;
- answer;
- help/exposure history;
- deterministic criterion result;
- checkpoint/evidence record;
- review need.

XP never changes mastery, evidence strength, review scheduling or a skip decision.

## Difficulty / confidence curve

The player should repeatedly cycle through:

**teach → easy success → variation → combine → boss → release → new mechanic**.

For later chapters, do not simply make prompts longer. Increase difficulty through meaningful dimensions:

- more interacting rules;
- incomplete information;
- conflicting constraints;
- delayed/uncertain outcomes;
- design trade-offs;
- transfer to a new context;
- less scaffolding;
- stronger requirement to explain/defend choices.

A harder mission should feel like increased mastery demand, not increased reading burden.

## Motion / game feel budget

Use animation for:

- mission launch;
- causal trace sequence;
- selection confirmation;
- HUD progress movement;
- unlock reveal;
- mission clear;
- XP gain;
- boss reveal.

Do not animate precise click targets while they are being selected. Respect `prefers-reduced-motion`; later add an explicit motion setting if animation density increases.

## Next progression layers

After the retry chapter is validated:

- chapter map across competencies;
- player rank derived from game XP only;
- boss missions that recombine earlier mechanics;
- optional side quests / retrieval quests;
- challenge modifiers for replayability;
- cosmetic/profile identity only after the core loop is fun.

Avoid streak pressure, currencies, shops, leaderboards or social competition until there is evidence they improve learning rather than merely engagement.

## Ship gate

Any major game-UX pass must be reviewed against `docs/GAME-UX-REVIEW.md`.

**Do not ship/pass the design if the critic score is below 8.0 / 10.**
