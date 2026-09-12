# Story generation and story critic — mandatory pre-game gate

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

## From story to Play Canvas realization

Only after the story gate does `GameExperienceSpec` choose how the story becomes play inside the **Play Canvas**.

For important candidates compare authored 2D, 2.5D/parallax and interactive Three.js. Choose the medium because it improves world presence, clarity, interaction or audience engagement—not because 3D itself scores points.

If Three.js is chosen, StoryWorldSpec semantics map into a versioned world package under `THREE-STORY-FRAMEWORK.md`. The story generator should not emit renderer lifecycle boilerplate.

### Relationship to future generated world packages

Long term, story/world semantics should compile/map cleanly into a validated data-first `WorldPackageSpec` containing scene/entity data, visual states, camera compositions, interaction anchors, approved assets and semantic fallback.

This separation matters because:

- one StoryWorldSpec could be realized differently (2D/2.5D/3D);
- a future StoryPreferenceProfile can regenerate presentation without rewriting learning identity;
- framework/platform code remains stable across fantasy settings;
- the generator does not need arbitrary client JavaScript to express most worlds.

A custom adapter extension may exist when a genuinely new engine capability is required, but it is not the default story-generation output.

## Relationship to later gates

Pipeline:

`course/outcomes -> StoryWorldSpec -> story critic >=9 -> GameExperienceSpec/Play Canvas realization -> first-touch critic >=9 -> whole-chapter critic >=9 -> learning/transfer >=9 -> current user review`

Passing story does not prove the game is fun. Passing game does not prove durable learning. Passing every critic still does not override the user.

## Current reference implication

Relay Rescue: The Echo Forge remains the current story treatment. It should be realized as a continuous world inside the persistent Play Canvas, with formal retry terminology deferred until the concrete model exists.

Do not repair a weak realization by only changing timers or adding more captions. The implementation must make the story feel lived through character behavior, environmental change, direct interaction, visible cause/effect and world response.
