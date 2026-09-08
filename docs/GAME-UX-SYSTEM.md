# VibeLearn game UX system

Status: adopted product direction after the 8 September 2026 learner reviews.

## North star

VibeLearn should feel like a **learning game whose mechanics happen to teach serious ideas**, not a website with XP, missions, and game vocabulary added on top.

The learning model stays rigorous underneath. Game progression, XP, animation, mission clears and unlocks are motivational/presentation systems; they must never silently become evidence or mastery claims.

This is not only a UI rule for the current retry chapter. It is a **course-generation invariant**. Generated courses must satisfy the contract in `docs/COURSE-GENERATION-GAME-SYSTEM.md`; the retry campaign is the first reference implementation, not a one-off skin.

## Narrative before abstraction

A good learning game should usually make the player care about and understand a concrete situation before asking them to decode specialist terminology.

Where the subject permits it, start chapters with a compelling real-life, professional, scientific, historical, fantasy or simulated scenario. The story must carry the learning mechanic rather than merely decorate the screen. Before jargon, the player should understand:

- who/what has a goal;
- what success looks like;
- what went wrong or changed;
- what decision or action the player must make.

Use a `plain_objective` in the HUD and briefing, then progressively bridge into the formal competency/frame language. Aim for an intuitive presentation that a motivated middle-school/high-school learner could follow when the domain permits it, without lowering the eventual rigor of the problem.

Simple animation/story beats should reveal **causality**: actor -> action -> failure/change -> consequence -> player decision. The same causal structure must remain understandable with reduced motion. Technical language should be introduced as a name for something the learner already understands intuitively, not as the entry ticket to understanding the scenario.

A course may use a non-narrative intuitive model when story would distort the subject, but jargon-first exposition should require a deliberate reason.

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
- **plain immediate mission objective**;
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

Generated courses may rename or theme these surfaces, but important player state must remain glanceable and secondary detail should stay contextual rather than becoming permanent website chrome.

### 2. Playfield is the centre

The central screen is where the player experiences the situation and makes decisions. When a narrative model exists, show its causal beats before or alongside the formal data representation.

Core retry predictions are direct game choices (`1 charge` / `2 charges`) rather than comma-separated form entry. Written explanations only appear when the mission is meant to exercise explanation/design.

For generated courses, prefer interactions that embody the target thinking: choose, arrange, simulate, compare, manipulate, debug, construct, trace, classify, sequence or make trade-offs. Do not default every generated competency to a textarea merely because forms are easy to render.

### 3. Campaign map is macro progression

The current reference chapter is **The Shopping Agent — Safe Retries**.

| Level | Difficulty | Intuitive mechanic | Formal concept | Cognitive load |
|---|---|---|---|---|
| 1 — The missing receipt | Tutorial | Same purchase ticket is still remembered | Retained idempotency key | One story, one decision |
| 2 — A new ticket, a second charge | Easy | Restarted agent invents a new purchase ticket | Business intent vs worker identity | One story, one decision |
| 3 — The store forgot | Medium | Store forgets old tickets after 24h | Retention boundary | Two outcomes + short explanation |
| 4 — One dumbbell, no duplicates | Boss | Make the shopping agent safe in every case | Full identity + retention contract | Three cases + design diagnosis |

Unlocks are sequential and enforced server-side. A player cannot start a locked mission simply by forging a client request.

The historical Phase-1 three-trace episode remains immutable as old evidence. The story-first campaign is a new activity revision of the campaign material; old attempt snapshots keep their exact meaning.

A generated chapter does not have to contain exactly four nodes, but it must express a deliberate confidence/difficulty curve, explicit unlock meaning, and a combine/boss or equivalent transfer checkpoint when appropriate.

**Progression focus is part of UX.** After a successful clear, select/focus the intended newly unlocked next node—normally the highest recommended unlocked mission. Do not unexpectedly reset the player to Level 1 or the just-cleared node. After failure, keep the current mission as the normal retry focus unless the campaign explicitly branches elsewhere.

### 4. Micro progression inside a mission

A mission should expose only the current objective, current scenario and immediately useful tools.

Feedback hierarchy:

1. understand the situation/story goal;
2. causal state/story beat reveal;
3. input acknowledgement;
4. decision selected;
5. progress saved;
6. hint/intel reveal;
7. answer lock-in;
8. clear/retry result;
9. XP / next mission unlock and focus;
10. later recall quest.

Each meaningful action should receive perceptible visual feedback. Motion should communicate causality/state change, not merely decorate the screen.

Generated courses must also plan **interface and vocabulary progression**. Early levels should not expose the entire assistance/tool surface or the whole specialist vocabulary. New controls/terms appear when their learning purpose becomes relevant; the course specification records when and why they unlock.

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

A generated course must not use participation XP as the success signal for competency progression. A wrong answer may receive bounded practice recognition while the learning gate remains locked.

### 6. Assistance/exposure labels must be precise

Do not collapse every non-fresh condition into “assisted.” The UI and evidence model distinguish:

- `declared_independent`: learner explicitly declared no outside help and no relevant help/exposure invalidates the claim;
- `unknown`: outside help was not declared and no observed help establishes assistance;
- `assisted`: current-attempt VibeLearn help/source/worked example was used, or outside help was explicitly declared;
- `previously_exposed`: the learner has prior family/result exposure, but did not necessarily use help on this attempt.

Prior exposure may weaken a fresh-independence claim; it is still not the same statement as “you used help this time.” UI copy, badges and generated course logic must preserve this distinction.

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

For experienced learners, generated campaigns may offer a diagnostic/test-out path. This may change routing/scaffolding, but self-report alone does not create mastery evidence and bypasses must remain explicit.

## Motion / game feel budget

Use animation for:

- story/causal beat reveal;
- mission launch;
- selection confirmation;
- HUD progress movement;
- unlock reveal;
- mission clear;
- XP gain;
- boss reveal.

Do not animate precise click targets while they are being selected. Respect `prefers-reduced-motion`; later add an explicit motion setting if animation density increases. Story comprehension must not rely exclusively on animation.

Generated course manifests should include motion/feedback intent for meaningful state changes. Optional sound/haptics may enrich supported platforms, but visible and accessible feedback remains required.

## Course-generation inheritance

The course generator must produce more than lesson text. It is responsible for a coherent package containing:

- source-grounded learning targets and assessment bindings;
- intuitive/narrative teaching model and plain objectives;
- campaign/progression graph and recommended next-node focus;
- mission mechanics and interaction types;
- HUD/tool exposure schedule;
- hint/intel/assistance/exposure semantics;
- reward/unlock semantics;
- feedback/motion plan;
- persistence/resume requirements;
- accessibility requirements;
- generated verification fixtures;
- critic reports and readiness state.

The complete contract is `docs/COURSE-GENERATION-GAME-SYSTEM.md`.

The authoring/generation loop is:

**brief → research → learning map → intuitive/narrative model → campaign design → mission design → validation → independent critic passes → preview → learner feedback → immutable release**.

A generator cannot self-certify the experience merely because its schema validates.

## Next progression layers

After the shopping-agent retry chapter is validated:

- chapter map across competencies;
- player rank derived from game XP only;
- boss missions that recombine earlier mechanics;
- optional side quests / retrieval quests;
- challenge modifiers for replayability;
- richer story worlds/scenario continuity where they aid comprehension;
- cosmetic/profile identity only after the core loop is fun.

Avoid streak pressure, currencies, shops, leaderboards or social competition until there is evidence they improve learning rather than merely engagement.

## Ship gate

Any major game-UX pass **and every generated course candidate presented as playable/validated** must be reviewed against `docs/GAME-UX-REVIEW.md` or a versioned successor.

**Do not ship/pass the design if the game-UX/comprehension critic score is below 8.0 / 10.**

This numeric game-UX gate does not replace factual, source-grounding, assessment-integrity or accessibility pass/fail gates. A beautiful 9/10 game with invalid learning content still fails release.