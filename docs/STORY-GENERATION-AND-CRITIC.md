# Story generation and story critic — mandatory pre-game gate

**Current user contract — 13 September 2026:** Read [GAME-OPENING-PROGRESSION.md](GAME-OPENING-PROGRESSION.md) before implementation or review. The `16a655e` experience was user-rejected. Require a first-entry skippable 3D opening, tutorial with early success, gradual progression, optional non-destructive replay at every level, and no automatic opening for Level 2+ players. Remove the 2D gameplay fallback; preserve accessible HUD controls and honest 3D recovery. This amendment supersedes conflicting legacy guidance below.

**Active user direction · updated 12 September 2026.** Read with `STATE.md`, `GAME-AS-COURSE.md`, `GAME-UX-SYSTEM.md`, `GAME-UX-REVIEW.md`, `COURSE-GENERATION-GAME-SYSTEM.md`, `PLAY-CANVAS.md`, and `THREE-STORY-FRAMEWORK.md`.

## Why this exists

VibeLearn must not generate lesson mechanics/UI first and then wrap them in a thin story. **For every course/subject, first generate a compelling story/fantasy/world premise capable of carrying the learning experience.** Story is a first-class artifact with its own quality gate.

The predecessor Relay Rescue opening was rejected by the user at **3/10** for first-touch/story quality. The failure was not merely timing: Back navigation was missing, beats advanced too quickly, storytelling was lazy/slide-like, causal context/stakes were unclear, and the opening did not create enough attachment/beauty/forward pull for kids, teens and young adults.

The current user is the sole real product reviewer during private refinement. Their verdict overrides every critic or automated score.

## Story artifact: StoryWorldSpec

Before gameplay realization, freeze one versioned `StoryWorldSpec` containing at least:

- intended audience assumptions;
- emotional tone and genre/fantasy frame;
- protagonist/focal actor with desire, personality and vulnerability/strength;
- world premise and understandable rules;
- important places, objects/resources and what they do;
- stakes and opportunity cost;
- inciting event;
- causal chain of what happened before player entry;
- mystery/tension/question that creates forward pull;
- meaningful player role;
- chapter progression/escalation;
- discovery, reversal, consequence, recovery and payoff;
- mapping from story/world semantics to LearningSpec concepts/relationships;
- earned resolution plus a next possibility.

`StoryWorldSpec` is **renderer-neutral**. It may describe that a reply is destroyed, a bridge breaks, a creature changes state, a resource dims, or a character reacts. It must not encode Three.js renderer loops, DOM selectors or platform-specific implementation details.

A bright child should be able to follow the causal story while a teen/young adult can still find it stylish and emotionally credible. Accessible does not mean childish or generic.

## Current input vs future personalization

**Current rule:** story is generated from the **course topic, intended outcomes, source-grounded causal structure and a broad cross-age quality target**. Creative learner preference is not implemented yet. Do not infer it from unrelated personal/profile data.

**Future rule:** add explicit learner-controlled/versioned `StoryPreferenceProfile` constraints for genre, tone, favorite world types, realism/fantasy, character style, visual style, humor/darkness, pace, exploration/action balance and narrative density.

Preferences are creative state, separate from mastery/evidence. They may produce a different StoryWorldSpec/GameExperienceSpec/world package while preserving required learning outcomes and legitimate learner history.

## Separate story critic

A **story critic evaluates exactly one frozen story candidate at a time**. It ignores renderer sophistication, Play Canvas implementation, Three.js framework quality, code/tests, learning evidence and engineering effort.

Question: *Would this story, as told, capture and hold the attention/affection of kids, teens and young adults strongly enough that they want to inhabit the world and discover what happens next?*

Pass target: unrounded **>=9.0/10 with no story blocker**. A critic pass is only permission to proceed to game realization; the user can still reject it.

### Frozen story rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Hook / first impression | 15% | The first beat creates immediate curiosity, wonder, tension, humor, beauty or emotional interest without requiring explanation. |
| Clarity and causality | 15% | Audience understands who/what matters, what happened, what changed and why the next event follows. |
| Character attachment | 12% | Focal actor has readable desire/personality/vulnerability/strength and gives a reason to care. |
| World/fantasy appeal | 12% | World has a distinct identity and discoverable possibilities instead of feeling like a reskinned lesson. |
| Storytelling quality | 12% | Information is dramatized through action, image, dialogue, discovery or consequence rather than exposition cards. |
| Pacing and progression | 12% | Beats have room to land; escalation changes the situation rather than adding facts. |
| Stakes, tension and choices | 8% | Audience understands why events matter and anticipates consequences. |
| Payoff and forward pull | 7% | Resolution feels earned and creates a strong reason to continue. |
| Cross-age engagement | 7% | Bright child can follow it while teen/young adult still finds it stylish/non-childish. |

Calculate `sum(area_score * weight) / 100`. Record strongest hook, weakest beat, likely abandonment point and prioritized revisions. Never round a sub-9 into a pass.

### Story blockers

Any of these fails regardless of average:

- core premise, actor, need, inciting event or causal chain remains unclear;
- story is mainly explanatory slides/cards/captions rather than dramatized events;
- audience has no reason to care about character/world/mystery/conflict/outcome;
- progression is repetition with new text rather than meaningful change;
- story merely renames technical terms;
- essential understanding depends on fast autoplay, audio alone, motion alone or prior specialist knowledge;
- critic can defend engagement only with XP/grades/curriculum value/implementation difficulty/graphics technology.

## First-touch temporal UX is part of story quality

For first-run narrative/cinematic experiences:

- **Back / previous is mandatory.**
- Progression is **user-paced by default**.
- Continue/Next, Skip, Replay and visible progress are available.
- Pause/Resume exists while motion runs.
- Optional autoplay is secondary, slow enough for the beat to land, and pauses on interaction.
- Back/forward reconstructs coherent story/world state.
- Reduced-motion preserves the same causal information/navigation.
- Ordinary failure/resume should not force needless long exposition replay.

A beautiful cinematic with poor temporal control still fails first touch.

## From story to 3D game realization

After the frozen story passes its separate gate, GameDesignSpec and RuntimeExperienceSpec stage a continuous 3D PlayCanvas opening/tutorial/game. Do not reopen 2D versus 3D selection for this Phase 1 brief.

The opening must make the world desirable and its causal situation understandable, then give a safe first interaction/success before demanding a consequential choice. Zelda/Witcher are references for staged introduction and progression, not a scope or asset-copy requirement.

GameWorldSpec/WorldSpec owns reusable scene/entity/camera/interaction data. Engine-neutral semantic state stays separate from canonical assessment. Generation must supply first-entry, skip, later-level resume and explicit replay rules under GAME-OPENING-PROGRESSION.md. A story-only pass cannot certify the rendered opening.

## Relationship to later gates

Pipeline:

`course/outcomes -> StoryWorldSpec -> story critic >=9 -> GameExperienceSpec/Play Canvas realization -> first-touch critic >=9 -> whole-chapter critic >=9 -> learning/transfer >=9 -> current user review`

Passing story does not prove the game is fun. Passing game does not prove durable learning. Passing every critic still does not override the user.

## Current reference implication

Relay Rescue: The Echo Forge remains the current story treatment. It should be realized as a continuous world inside the persistent Play Canvas, with formal retry terminology deferred until the concrete model exists.

Do not repair a weak realization by only changing timers or adding more captions. The implementation must make the story feel lived through character behavior, environmental change, direct interaction, visible cause/effect and world response.

## Foundation: games generated from learning needs and preferences

User reaffirmed the ultimate product goal on 13 September 2026: generate games on demand from what a user needs to learn and their explicit preferences. Echo Forge is the reference, not the framework. LearningSpec, explicit UserPreference/StoryPreference inputs, StoryWorldSpec, GameDesignSpec, GameRulesSpec, WorldSpec, RuntimeExperienceSpec and versioned AssetRefs must compose through shared validators/runtime. Canonical learning and evidence cannot depend on theme, assets or engine. Preferences may influence setting, tone, presentation, pace and interaction style without weakening outcomes or assessment. Never infer unstated preferences.

Implement the opening/tutorial/HUD/progression as reusable, spec-driven capabilities and assets; keep Echo Forge dialogue, beats, cameras and object IDs in the reference package. New games must not require copied opening controllers or new renderer lifecycles. Prove a materially different fixture through shared components. This foundations work does not claim that an on-demand generator/model integration is already implemented or authorize unrelated Phase 2 work.
