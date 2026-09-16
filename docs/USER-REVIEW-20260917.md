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

## Internal-review misses exposed by this user review

The prior internal critic record gave all four gate groups a minimum 9, yet it did not catch:

- duplicate/ambiguous Zip presentation;
- character-table clipping visible under camera movement;
- insufficient story establishment for a first-time player;
- the mismatch between an in-Level tutorial and the intended pre-Level tutorial/prologue structure.

Therefore the current internal-review process is not sufficient by itself. Update its counterexamples/evidence so future candidates explicitly inspect duplicate character identity, world-object intersections from alternate camera angles, story comprehension from a cold start, and tutorial-vs-Level-1 progression boundaries.

## Review status

**Needs revision.** Continue recording user feedback in this file during the review. Do not mark Level 1 ready again until all findings are repaired, retested, and the user reviews the new candidate.
