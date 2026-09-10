# Story generation and story critic — mandatory pre-game gate

Active user direction — 10 September 2026. Read with [STATE.md](STATE.md), [GAME-AS-COURSE.md](GAME-AS-COURSE.md), [GAME-UX-SYSTEM.md](GAME-UX-SYSTEM.md), [GAME-UX-REVIEW.md](GAME-UX-REVIEW.md), and [COURSE-GENERATION-GAME-SYSTEM.md](COURSE-GENERATION-GAME-SYSTEM.md).

## Why this exists

VibeLearn should not begin by generating mechanics, lessons, HUD, slides, or technical exposition and then wrap them in a thin story. **For every course/subject, first generate a compelling story/fantasy/world premise that can carry the learning experience.** The story is a product subsystem with its own quality gate.

The current Relay Rescue opening failed the user's first-touch review. The user's current story/first-touch rating is **3/10**. Specific failures: no back navigation through the opening sequence, automatic beats move too quickly, the story is told lazily, causality and context remain unclear, and the sequence feels like a slide deck rather than an engaging game opening. Any previous game critic pass is superseded for acceptance by this direct user verdict.

The current user is the sole real product reviewer during private refinement. Their verdict overrides story critic, game critic, automation, and historical scores.

## Story-first generation pipeline

Before gameplay realization, generate and version a single story candidate with:

- audience assumptions;
- intended emotional tone and genre/fantasy frame;
- protagonist or focal actor;
- world premise and immediately understandable rules;
- desire/need and stakes;
- inciting event;
- clear causal chain of what happened before the player arrives;
- mystery/tension/question that makes the player want the next beat;
- escalation/progression across chapters or missions;
- moments of discovery, reversal, consequence, recovery, and payoff;
- how the player belongs in the story rather than merely observing it;
- how the course concepts can naturally become conflicts, tools, puzzles, powers, systems, relationships, or world rules;
- an ending/resolution that feels earned and opens a meaningful next possibility.

The story should be understandable to a bright child while still emotionally and aesthetically credible to a teen/young adult. “Accessible” must not mean childish, generic, or patronizing.

## Personalization direction

The long-term course generator should generate story/fantasy based on user preference. Story preferences can include genre, tone, favorite kinds of worlds, realism vs fantasy, character style, visual style, humor, darkness, pace, exploration vs action, and narrative density.

Until preference infrastructure exists, use a strong broad-audience default and keep the story package renderer-neutral. Do not hard-code all courses to Pip, valleys, fantasy, or one visual grammar. Personalization changes the story/world; it must not weaken learning integrity or assessment semantics.

## Separate story critic

A **story critic evaluates exactly one frozen story candidate at a time**. It does not grade implementation effort, browser tests, code quality, learning evidence, Three.js sophistication, or game mechanics. Those belong to later gates.

The critic asks: *Would this story, as told, capture and hold the attention/affection of kids, teens, and young adults strongly enough that they want to inhabit the world and discover what happens next?*

Use the current product quality target: unrounded **>=9.0/10**, no story blocker, before the story is considered ready for gameplay realization. A story critic pass is still only a pre-gate; the current user's explicit story verdict overrides it.

### Frozen story rubric

| Area | Weight | 10/10 means |
|---|---:|---|
| Hook / first impression | 15% | The first beat creates immediate curiosity, wonder, tension, humor, beauty, or emotional interest without requiring explanation. |
| Clarity and causality | 15% | The audience understands who/what matters, what happened, what changed, and why the next event follows. No repository/docs knowledge is required. |
| Character attachment | 12% | The focal character/actor has readable desire, personality, vulnerability/strength, and gives the audience a reason to care. |
| World/fantasy appeal | 12% | The world has a distinct identity and discoverable rules/possibilities that invite imagination rather than feeling like a reskinned lesson. |
| Storytelling quality | 12% | Information is dramatized through action, image, dialogue, discovery, or consequence rather than dumped as captions/slides. |
| Pacing and progression | 12% | Beats have room to land, escalation is deliberate, quiet/action moments are balanced, and each chapter changes the situation. |
| Stakes, tension, and choices | 8% | The audience understands why events matter and anticipates consequences; the player's role can become meaningful. |
| Payoff and forward pull | 7% | Resolutions feel earned while creating a strong reason to continue into the next mission/chapter. |
| Cross-age engagement | 7% | A bright child can follow it while a teen/young adult can still find it stylish, emotionally credible, and non-childish. |

Calculate `sum(area_score * weight) / 100`. Record concrete weaknesses and likely abandonment points. Do not round a sub-9 score into a pass.

### Story blockers

Any of these blocks the story regardless of average:

- Core premise, actor, need, inciting event, or causal chain remains unclear after the opening.
- Story is mostly a sequence of explanatory slides/cards/captions rather than dramatized events.
- The audience has no reason to care about a character, world, mystery, conflict, or outcome.
- Progression is repetition with new text instead of meaningful escalation/change.
- Story exists only to rename technical terms and feels interchangeable with any lesson.
- Essential understanding depends on fast autoplay, audio alone, motion alone, or prior technical knowledge.
- The critic can only justify engagement by citing XP, grades, streaks, curriculum value, implementation difficulty, or graphics technology.

## First-touch story controls

The story player itself must respect the audience. For first-run story/cinematic sequences:

- **Back / previous beat is mandatory.** The player can revisit the immediately previous beat without restarting the whole sequence.
- **User-paced progression is the default.** Do not force a fresh player through rapidly timed slides.
- Provide next/continue, pause/resume when animation is running, skip, replay, and a visible sense of progress/chapter position.
- If autoplay is offered, it is optional and must allow enough time for the beat to land; interaction pauses the timer. Never advance while the player is trying to inspect or read something.
- Reduced-motion mode preserves the same causal story and all navigation controls.
- Going backward/forward must restore the correct visual/story state rather than showing contradictory objects or dialogue.
- Do not make the player rewatch long exposition after failure; checkpoints/replay should be intentional.

A cinematic that looks attractive but gives the player poor temporal/navigation control fails first-touch UX.

## Storytelling medium: 2D, 2.5D, or Three.js 3D

Three.js is now a **serious option to evaluate for attention, immersion, character/world attachment, spatial storytelling, and direct play**, especially for the kid/teen/young-adult audience. It is not restricted only to cases where 3D is mathematically necessary for the learning mechanic.

For each generated story, explicitly consider at least these realization options: authored 2D/illustrated animation, 2.5D/parallax, and interactive Three.js 3D. Choose based on the story, audience preference, subject, device budget, and what makes the world feel most alive.

3D still does not rescue weak writing. A beautiful Three.js scene with a lazy/unclear story fails the story gate. If 3D is used, keep local pinned assets, same-origin runtime, accessible controls, reduced-motion behavior, usable fallback, and realistic mobile performance targets. The renderer never determines assessment/evidence.

## Relationship to later game and learning gates

The pipeline is intentionally separated:

`course intent/outcomes -> user/audience preferences -> story/fantasy candidate -> story critic >=9 -> gameplay/world realization -> game critic >=9 -> learning/transfer gate >=9 where claimed -> current user review -> user acceptance`

Passing the story critic does not prove the game is fun. Passing the game critic does not prove course-level learning. Passing all machine/critic gates does not override the current user.

## Current reference implication

Do not repair Relay Rescue by merely slowing the existing six slides. The next candidate needs a substantially better story treatment: clearer causal staging, stronger character/world hook, better emotional/visual progression, user-controlled pacing/back navigation, and a serious evaluation of whether an interactive 3D/2.5D realization would create a more compelling first touch.
