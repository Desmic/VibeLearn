# User review — Level 1

**Date:** 17 September 2026 IST  
**Review build:** Render commit `6de1f0ccb234507c1db2dccbe007c7cabfaf397e` (runtime game candidate `6fea8287aa5f078a5836902478320699e54571a9`)  
**Status:** **review in progress / needs revision**

This is the running record of the current user's final Level 1 review. The user's product judgment overrides the prior internal `ready_for_user_review` recommendation. Do not reinterpret these findings as minor polish and do not begin Level 2 while this review remains open.

## Findings so far

### UR-01 — Duplicate / ambiguous Zip character in the opening

Observed in the first opening beat: the scene visibly presents two Zip-like robot characters. One is labelled `ZIP`; another similar character stands near the middle/table area. This makes the character identity ambiguous immediately.

The extra middle character also visibly intersects/clips through the central table, making the opening world look broken rather than intentional.

**Required correction:** the opening must contain one unambiguous Zip presentation. Remove or clearly differentiate any other similar robot; fix transforms/collision/placement so no character intersects the central table or props. Verify the full opening from multiple camera angles, not only the authored default frame.

### UR-02 — Opening does not establish the story/world clearly enough

The opening currently begins with `Every adventure needs a friend.` and a short line about Zip's lantern, but the user reports that the story does not meaningfully begin to explain itself there.

This means the current three-beat opening is still too dependent on the reviewer already knowing the intended Bellweather/Zip/Warden context. It does not sufficiently establish what Bellweather is, who the player/Zip are, what is happening tonight, why the Warden matters, and why the player should care before asking for interaction.

**Required correction:** redesign the prologue/opening so story, world, relationship and immediate stakes are understandable from the experience itself. Do not solve this by stacking long exposition panels; use staged world events, concise dialogue/captions, character motion and tutorialized interaction.

### UR-03 — A tutorial embedded inside Level 1 is not the requested tutorial structure

The current build enters `The First Words` and then shows `TUTORIAL · 1/3` inside that level. The user expected a tutorial/prologue **before Level 1**, so the player learns how to play before Level 1 begins.

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

## Internal-review misses exposed by this user review

The prior internal critic record gave all four gate groups a minimum 9, yet it did not catch:

- duplicate/ambiguous Zip presentation;
- character-table clipping visible under camera movement;
- insufficient story establishment for a first-time player;
- the mismatch between an in-Level tutorial and the intended pre-Level tutorial/prologue structure;
- failure of the actual rendered story to communicate the written story/stakes beat-by-beat;
- failure of the live progression to match the documented onboarding/progression contract;
- the distinction between visual attraction (`would look`) and sustained playability (`would play`).

Therefore the current internal-review process is not sufficient by itself. Update its counterexamples/evidence so future candidates explicitly inspect duplicate character identity, world-object intersections from alternate camera angles, cold-start story comprehension, text-animation synchronization, tutorial-vs-Level-1 progression boundaries, and separate attraction-vs-playability judgments.

## Review status

**Needs revision.** Continue recording user feedback in this file during the review. Do not mark Level 1 ready again until all findings are repaired, retested, and the user reviews the new candidate.
