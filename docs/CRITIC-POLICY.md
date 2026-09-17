# Critic policy — observed play, independent disciplines, then the user's verdict

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
