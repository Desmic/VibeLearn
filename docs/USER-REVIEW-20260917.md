# User review — Level 1

**Date:** 17 September 2026 IST  
**Review build:** Render commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e` (runtime game candidate `6fea8287aa5f078a5836902478320699e54571a9`)  
**Status:** **review in progress / needs revision**

This is the running record of the current user's final Level 1 review. The user's product judgment overrides the prior internal `ready_for_user_review` recommendation. Do not reinterpret these findings as minor polish and do not begin Level 2 while this review remains open.

## Findings so far

### UR-01 — Duplicate / ambiguous Zip character in the opening

Observed in the first opening beat: the scene visibly presents two Zip-like robot characters. One is labelled `ZIP`; another similar character stands near the middle/table area. This makes the character identity ambiguous immediately.

The extra middle character also visibly intersects/clips through the central table, making the opening world look broken rather than intentional.

**Required correction:** the opening must contain one unambiguous protagonist presentation. Remove or clearly differentiate other robots; fix transforms/collision/placement so no character intersects the central table or props. Verify the full opening from multiple camera angles, not only the authored default frame.

### UR-02 — Opening does not establish the story/world clearly enough

The opening currently begins with `Every adventure needs a friend.` and a short line about Zip's lantern, but the user reports that the story does not meaningfully begin to explain itself there.

This means the current three-beat opening is still too dependent on the reviewer already knowing the intended Bellweather/Zip/Warden context. It does not sufficiently establish the world, protagonist, disruption, antagonist and immediate stakes for a cold-start player.

**Required correction:** redesign the prologue/opening so story, world, relationship and immediate stakes are understandable from the experience itself. Do not solve this by stacking long exposition panels; use staged world events, concise dialogue/captions, character motion and tutorialized interaction.

### UR-03 — A tutorial embedded inside Level 1 is not the requested tutorial structure

The current build enters `The First Words` and then shows `TUTORIAL · 1/3` inside that level. The user expected a distinct Tutorial/Prologue **before Level 1**, so the player learns how to play before Level 1 begins.

The distinction matters for progression: Tutorial/Prologue should teach basic movement/look/interact/game-menu semantics and the core learning mechanic with low/no failure pressure. Level 1 should then feel like the first actual mission, not the tutorial itself.

**Required correction:** introduce a distinct Tutorial/Prologue stage before Level 1. It should teach only the reusable controls and interaction/learning loop needed to start the game, grant a clean success, and then transition into Level 1. Level 1 can assume those basics and focus on its story/problem. Keep the established `easy to play, hard to master` progression contract.

### UR-04 — Text and animation must jointly convey the written story and stakes

The user explicitly asked the product team to compare the live experience against the story and progression already written in the docs: **does the game itself convey that story, and does it follow that progression?** Their answer for the current review build is plainly **no**.

The intended standard is not a static lore card followed by unrelated animation. Text, dialogue, camera, character animation, world-state changes and player actions should advance the same narrative beat together. A player should be able to infer most of the story from what visibly happens; short text should reinforce and clarify those events, not substitute for them.

**Required correction:** storyboard the complete prologue as a sequence of observable causes and consequences. For each beat, define what changes in the world, what the player sees a character do, what minimal line/caption appears at that moment, what the player does next, and what new information/stake that beat communicates. Then verify the rendered sequence against the written story beat-by-beat rather than checking only that all captions/animations exist.

### UR-05 — Current progression does not match the documented progression contract

The written progression says the player should be oriented, shown how to play, given an easy/clean success, and only then exposed to increasing challenge. The current live experience still feels like `look at this world -> infer what the controls/meaning are`, which is not the progression we documented.

**Required correction:** make the progression boundary explicit and testable: `prologue/story orientation -> tutorial controls/core loop -> guaranteed practice success -> Level 1 mission -> recoverable challenge -> payoff`. Level 1 must not double as basic onboarding. Later episodes can become harder through deeper LLM reasoning and fading scaffolding, not through unexplained interaction complexity.

### UR-06 — Kid-engagement test currently fails, but visual attraction is a real positive signal

User verdict: **a kid would not play this current build, but would look at it.** Treat both halves as important.

This means the visual/world layer has crossed a meaningful threshold: it can attract attention. That is a genuine achievement and should be preserved. But attraction has not yet converted into understandable, rewarding play. The missing bridge is clearer story causality, faster onboarding, obvious actions, satisfying immediate success, and a stronger reason to keep interacting.

**Required correction:** future internal review must explicitly ask two separate questions instead of conflating them: `Would a kid/young player stop and look?` and `Would they understand what to do and want to keep playing?` A candidate is not >=9 game experience if only the first answer is yes.

### UR-07 — Current play area is too congested

The user describes the current world/play area as congested/constipated. Importantly, they believe **simply making the playable world larger while keeping essentially the same content would materially improve the experience**.

This is an art/world-direction problem, not a request to add more scenery. The current footprint compresses characters, props, landmarks and interactions into a small diorama, which makes the world less pleasant to inhabit and increases visual collisions/ambiguity.

**Required correction:** enlarge the playable spatial footprint and introduce deliberate negative space. Preserve useful landmarks/props but spread them so movement, camera orbit and focal interactions have breathing room. Add world-density/spacing parameters to the reusable world system so future generated games do not default to compact prop piles.

### UR-08 — Player embodiment is wrong: control the protagonist directly

The phrase “help Zip” was incorrectly realized as a literal separate `you`/helper character. The user did **not** intend a second player avatar in the fiction.

For this track, keep the robot protagonist and its friends; **the player controls the protagonist directly**. There should not be a separate literal helper/avatar unless a future game explicitly chooses that embodiment model.

**Required correction:** remove the separate player-character fiction/visual from this track. Story, camera, controls and dialogue should all assume direct protagonist control. The platform must make player embodiment an explicit design/spec decision rather than inferring an avatar from second-person wording.

### UR-09 — New opening direction: happiness -> violent disruption -> limbo/prison -> speech theft -> control

The user proposed a clearer cinematic causal chain:

1. show Bellweather alive, happy and normal; the protagonist and friends are together;
2. a dramatic interruption (for example a thunderstrike/violent supernatural-technological event) suddenly breaks that normality;
3. the protagonist and friends are teleported/displaced away;
4. cut to the protagonist alone in a dark limbo-like space;
5. lights come on and reveal an unknown place with a large locked/blocked exit door;
6. an evil robot arrives and removes the protagonist's speech engine;
7. transition into direct player control of the protagonist;
8. the Tutorial/Prologue teaches movement/interact/core speech-repair loop and lets the protagonist restore enough speech/open the first way forward;
9. **Level 1 starts after those basics are learned.**

This direction has a readable before/after contrast, an inciting incident, mystery, concrete imprisonment, a visible antagonist action and an immediate personal reason to learn the speech mechanic.

**Required correction:** use this as the working opening/prologue direction for the next design pass unless a clearly stronger alternative is produced and reviewed. Story text, animation, lighting, camera and player control must all reinforce the same causal sequence.

### UR-10 — Add an independent art/world-direction critic

The existing internal critic passed a build that still had cramped spatial composition, duplicate/ambiguous characters and visible character/prop intersection. Story/gameplay/learning review did not catch the art-direction failure adequately.

**Required correction:** add a separate art/world-direction critic covering spatial scale, negative space, focal hierarchy, silhouette/identity, prop density, geometry/intersections, camera sweep, landmark readability, palette/material cohesion, atmosphere, reusable-asset composition and phone/desktop world readability. `ART-WORLD-DIRECTION-CRITIC.md` is now an active hard gate.

### UR-11 — Use pop culture as inspiration more deliberately, while keeping the game original

The user wants stronger cultural inspiration during story/character ideation—for example a memorable robot name or personality that feels like it belongs in the same cultural conversation as famous movie/game robots rather than a generic placeholder such as `Zip`.

A “Wall-G”-style wordplay/reference is an example of the *kind of recognizability* they mean, not a requirement to copy a protected character/design.

**Required correction:** add a deliberate pop-culture/literature/game inspiration pass before story freeze. Extract naming energy, archetypes, pacing, humor and motifs, then produce original characters/assets/story. References should reward recognition but never be required for comprehension.

### UR-12 — The product is a game-creation platform; this track is the proof case

The user re-emphasized that VibeLearn is **not primarily one game**. The goal is a platform that can create learning games quickly from reusable worlds, assets, mechanics, progression patterns and runtime systems.

The current LLM learning track exists to prove the model end-to-end. Do not derail the proof by prematurely implementing the full generator/orchestrator, but every accepted implementation should leave behind reusable, parameterized components rather than one-off campaign glue.

**Required correction:** future architecture/game-generation docs must treat reusable world kits, characters, cinematic beats, mechanics, HUD/tutorial patterns, progression and critic/test templates as first-class platform assets. Reuse must support meaningful variation in layout, scale, art direction and story rather than producing reskinned copies.

### UR-13 — Future platform should support agents across the creation/review/release pipeline

Longer term, the platform should support agents for ideation, research, story/game creation, art/world direction, implementation, critics, testing and CI/CD/release orchestration.

This is **planned future capability**, not the current implementation priority. The immediate priority is still to prove the system through one excellent game/learning track.

**Required correction:** preserve agent-friendly boundaries now—versioned specs, explicit artifacts, reproducible tests/evidence and independent critic roles—without stopping current game work to build the full multi-agent system.

## Internal-review misses exposed by this user review

The prior internal critic record gave all four gate groups a minimum 9, yet it did not catch:

- duplicate/ambiguous protagonist presentation;
- character-table clipping visible under camera movement;
- insufficient story establishment for a first-time player;
- the mismatch between an in-Level tutorial and the intended pre-Level tutorial/prologue structure;
- failure of the actual rendered story to communicate the written story/stakes beat-by-beat;
- failure of the live progression to match the documented onboarding/progression contract;
- the distinction between visual attraction (`would look`) and sustained playability (`would play`);
- cramped world scale/insufficient negative space;
- the wrong player-embodiment model;
- absence of a dedicated art/world-direction review gate.

Therefore the current internal-review process is not sufficient by itself. Future candidates must explicitly inspect character identity, world-object intersections from alternate camera angles, cold-start story comprehension, text-animation synchronization, tutorial-vs-Level-1 progression boundaries, attraction-vs-playability, spatial density/breathing room and declared player embodiment.

## Review status

**Needs revision.** Continue recording user feedback in this file during the review. Do not mark Level 1 ready again until all findings are repaired, retested, and the user reviews the new candidate.
