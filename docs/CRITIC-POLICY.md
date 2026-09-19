# Critic policy — observed play, independent disciplines, then the user's verdict

**Current execution target — 19 September 2026:** candidate `92a5ecbdc803362ee1554fca6ae811adb155bc26`, exact run `35434565005`, sealed assignment/capsule artifact `10581437727`. Execute the ready post-CI passes through `CRITIC-HANDOFF.md`; do not silently substitute later documentation heads. The current chat is contaminated by design intent/prior feedback and is **not** a valid cold observer.

**Active policy — 17 September 2026.** The September 17 user review invalidated the prior internal `ready_for_user_review` recommendation for candidate `6fea828...`. The internal checker passed a build with duplicate/ambiguous characters, visible clipping, insufficient story communication, wrong tutorial boundary, cramped world scale and the wrong player-embodiment model. That proves the checker/critic process was necessary but insufficient.

The user is the sole final human product critic. Their explicit verdict overrides every internal score, agent judgment, CI result and deployment state.

## Critic disciplines are independent

Every serious candidate is reviewed through separate disciplines:

1. **Story/rendered narrative critic** — does the actual scene communicate world, role, cause, stakes and forward pull?
2. **Art/world-direction critic** — does the world have intentional scale, negative space, hierarchy, silhouettes, geometry, landmarks, atmosphere and visual cohesion? See `ART-WORLD-DIRECTION-CRITIC.md`.
3. **Gameplay/first-touch critic** — can a newcomer understand what to do and enjoy doing it?
4. **Whole-chapter/progression critic** — does play deepen coherently, recover from mistakes and produce payoff?
5. **Learning/transfer critic** — does the mechanic faithfully embody the idea and require it in changed situations?
6. **Technical/accessibility gate** — build/runtime/state/auth/save/device behaviors are verified independently.

A candidate fails if any required discipline has a blocker. Do not average them.

## Attraction versus playability

Internal review must explicitly answer two separate questions:

- **Would a kid/young player stop and look?**
- **Would they understand what to do and want to keep playing?**

The current rejected build achieved some visual attraction but failed the second question. “Looks good” is not a gameplay pass.

## Review workflow

1. Freeze the exact candidate SHA and environment.
2. Read the active product/story/progression specs, but disclose reviewer prior knowledge.
3. Review the fresh prologue cold where possible. Before interpreting intent, write what the rendered scene actually communicated.
4. Compare the written storyboard to rendered causality beat-by-beat: world-before -> event -> reaction -> text/sound/camera -> world-after -> newcomer takeaway.
5. Run the art/world-direction pass: alternate camera angles, orbit/zoom/walk, density/negative space, clipping/intersections, protagonist identity, landmarks and phone/desktop compositions.
6. Play the separate tutorial. Verify reusable controls/core interaction grammar and a clean first success **before Level 1**.
7. Play Level 1 and the whole available chapter: first mission, mistake, recovery, harder decision, payoff, transfer, replay, save/resume and lifecycle controls.
8. Exercise desktop and 360/390/430 portrait, touch/keyboard, enlarged text and reduced motion where applicable. Browser emulation is not a physical-device study.
9. Write failures and likely quit points **before** assigning numbers.
10. For each 9+ judgment, record a strong counterexample attempt.
11. Run technical checks/record validators. They validate evidence structure/runtime behavior, not fun, art direction or comprehension.
12. Fix blockers and replay the failed sequence on the changed candidate.
13. Only after all internal disciplines pass may the candidate be recommended for user review. The user's verdict remains final.

## Rating calibration

Use whole numbers 0–10 for diagnostic criteria. No decimals or weighted averages.

| Rating | Anchor |
|---|---|
| 0–2 | Missing/misleading/unusable. |
| 3–4 | Progress requires explanation, guessing or workaround; basic requirement fails. |
| 5–6 | Understandable but meaningfully frictional/weak. |
| 7–8 | Clear and competent; material weaknesses remain. |
| 9 | Convincing across required observed states; no material weakness found; strongest counterexample attempted and recorded. |
| 10 | Exceptional sustained execution; explain what exceeds 9. |

`null` means not assessed. Unknown is not a pass or a zero.

## Legacy executable criteria

The current JSON checker still validates these eleven criteria:

### Rendered story
- `world_role_stakes`
- `visible_causality`
- `attachment_pull`

### First touch
- `orientation_action`
- `hud_readability`
- `controls`

### Whole chapter
- `meaningful_agency`
- `progression_recovery`
- `world_continuity`

### Learning
- `concept_fidelity`
- `fresh_transfer`

Every legacy criterion must still be >=9 with complete required coverage for an internal recommendation.

**However:** the September 17 review proved those criteria/checker did not sufficiently enforce art/world direction, declared embodiment, spatial scale or prologue/tutorial/Level-1 boundaries. Therefore a passing JSON checker is no longer sufficient by itself.

Until the checker is extended, the following are **manual/internal hard gates**:

- `ART-WORLD-DIRECTION-CRITIC.md` has no unresolved blocker;
- player embodiment is explicitly declared and matches the rendered character/camera/control model;
- prologue, separate tutorial and Level 1 boundaries match `GAME-OPENING-PROGRESSION.md`;
- rendered story communicates the active written storyboard without relying on design-doc knowledge;
- attraction and sustained playability are judged separately.

## Non-negotiable probes

### World / story / role
Within the opening, identify from visible events and concise cues:

- what the normal world feels like;
- who the player controls;
- what disruption occurred;
- what the antagonist did;
- what the immediate obstacle/need is;
- what the player can do next.

A synopsis in a caption does not substitute for visible staging.

### Player embodiment
The declared protagonist/control model must be obvious. Duplicate protagonist-looking actors, a mysterious extra `you` avatar or camera/control behavior contradicting the story are blockers.

### Spatial composition
Inspect whether simply enlarging the world/spacing props would materially improve play. If yes, current density/scale is a blocker. Check negative space, path width, camera occlusion and landmark spacing.

### Geometry / alternate cameras
Orbit/zoom/walk beyond hero screenshots. Visible character-table intersections, doors crossing actors, floating props, camera penetration or compositions that only work from one angle are blockers.

### Prologue versus tutorial versus Level 1
The prologue establishes world/inciting event/stakes. The separate tutorial teaches reusable controls/core interaction and grants a clean success. Level 1 is the first actual mission. Collapsing these into one confusing onboarding level is a blocker when the active design requires separation.

### Story synchronization
Text, animation, camera, sound, lighting and player action must advance the same beat. Captions describing actions the world does not visibly perform fail `visible_causality`.

### HUD and controls
One short current goal/contextual action. Optional detail remains secondary. Controls remain usable after saves/reloads. No overlapping/nested reading surface for the immediate action.

### Meaningful progression
Difficulty grows through reasoning, uncertainty, trade-offs, combined mechanics and fading help—not denser UI, longer prose or repeated answer patterns.

### Transfer
Attempt a changed layout/context with faded prompts before feedback. Repeating the just-demonstrated recipe does not establish independent transfer.

### Sound
If atmosphere/music is part of the candidate, actual listening is required before quality claims. Muted play must preserve essential meaning.

## Pop-culture/reference review

Research and cultural references are valid ideation inputs. Review must ensure:

- the experience works for a player who recognizes none of them;
- references do not replace story causality or clues;
- shipped characters/names/designs/dialogue/music remain original rather than confusingly derivative;
- references support personality/joy rather than becoming a collage of borrowed IP.

## Future critic agents

VibeLearn may later use independent agents for story, art/world, gameplay, learning, test and CI/CD review. Creator agents must not self-certify their own output. Agent outputs need exact candidate IDs, evidence and reproducible counterexamples.

This is future platform work; current proof-track quality comes first.

## Technical checker boundary

`tools/check_critic_review.py` validates the legacy record structure/evidence and exact SHA. It does not inspect pixels, orbit cameras, detect clipping, judge world scale, listen to audio or determine user acceptance. Do not describe its `ready_for_user_review` output as sufficient after September 17 without the additional art/world and progression gates above.

Historical numeric records stay attached to their historical candidates. Never carry a score to a changed build.

## Scope

Private proof-track refinement only. No external tester panel, paid resource, broad rollout, live generation model or multi-agent orchestration platform is authorized by this policy. The user may request a preview at any time; preview is not acceptance.


## 18 September correction — visual world-building and motion direction

The `ad14c5a` review exposed another false positive. The internal story/art
critic could reconstruct the intended causal chain from ordered screenshots,
yet the user still found that the opening did not make sense as a world/setting.
It also passed Zip's stock/default idle loop without judging whether that motion
belonged to the game's style or audience.

This changes the critic contract.

### Visual-first world comprehension is required

Before reading captions, lore or the design doc, the critic must inspect the
opening as moving visual media and answer:

- What kind of place is this?
- Who lives here?
- What normal activities are happening?
- Which characters have relationships with each other?
- What landmarks/functions organize the space?
- What changes when the inciting incident happens?
- What has been lost after the transition?

A list of correct storyboard beats is **not** enough. If a reviewer can only
understand the world because they already know the intended story, the rendered
story/creative-direction gate fails.

Where practical, perform a **caption-blind pass** first: hide/ignore explanatory
captions and judge what the visuals, environmental animation, character acting,
camera and world-state changes communicate on their own. Text may clarify a
visually established beat; it may not supply the missing setting.

### Motion/animation direction is required

Review characters and environments in motion, not only screenshots.

For each recurring animation family—idle/rest, locomotion, interaction,
reaction, cinematic acting—judge:

- theme/genre fit;
- character/personality fit;
- physical plausibility within the chosen style;
- repetition/frequency/amplitude;
- whether the loop becomes distracting or uncanny;
- target-audience emotional read, especially for kids/young adults;
- consistency with the rest of the game's motion language.

Stock/default animation is not neutral. A retro-game exaggerated idle, realistic
breathing loop, anime anticipation pose and mechanical servo-rest all communicate
different creative directions. Reused assets must be retargeted/reselected when
their motion language conflicts with the current game.

### New hard blockers

Any of these blocks internal readiness:

- setting/world cannot be identified from visuals/behavior without explanatory
  text;
- opening world feels like a static set rather than an inhabited place when the
  story depends on caring about that place;
- captions are doing primary world-building that animation/environment should do;
- character animation belongs to a visibly different genre/style than the game;
- an idle/rest loop reads as uncanny, creepy, hyperactive or distracting for the
  target audience without deliberate narrative intent;
- critic evidence consists mainly of still screenshots for an animation/motion
  quality claim.

The critic must state separately:
1. what the composition communicates as a still;
2. what the scene communicates over time through motion and environmental life.

Passing one does not compensate for failing the other.

## 18 September correction — causality, physicality and handoff evidence

The final `ad14c5a` user review exposed additional false positives.

### Major-event causality

For every major story event, critics must observe the event in motion and record:
- perceived cause/source;
- anticipation/setup;
- character reaction;
- environment reaction;
- camera/focus;
- VFX/lighting/atmosphere change;
- SFX/music/narration contribution;
- persistent consequence.

If intended causal attribution is known (for example an antagonist caused the
event), compare that intent with what a cold viewer actually infers. Do not infer
the cause from the storyboard.

**Blocker:** narrative magnitude is high but rendered magnitude is low, or the
intended cause is not perceptible and ambiguity was not intentional.

### Semantic-object readability

Important story/mechanic objects must be reviewed by appearance/behavior before
their semantic IDs are revealed. A generic primitive does not automatically
communicate "voice", "memory", "key", "power core", etc.

**Blocker:** a major object only makes sense after reading its label/source ID.

### Physicality

Critics must actively attempt to walk through/into major props, walls, doors and
interactables. Camera collision is tested separately.

**Blocker:** visible solid geometry can be penetrated in ordinary play unless
intentionally non-solid and visually communicated as such.

### Experience-mode and handoff integrity

At any transition, only one experience mode may communicate goals/actions:
opening, handoff, tutorial, mission, result, etc.

The reviewer must answer:
- who/what do I control now?
- what changed?
- what is the current goal?
- what can I do?
- what is the recommended next action?
- what visible feedback proves success?

**Blocker:** two modes present conflicting prompts, or the player must infer the
interaction grammar at a handoff.

### Tutorial evidence

Tutorial quality requires an actual fresh-path observation. For each step record:
target/control -> player action -> success detector -> feedback -> next state.

Presence of tutorial copy or an automated state transition is not a tutorial
quality pass.
