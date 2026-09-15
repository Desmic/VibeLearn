# 3D opening, tutorial and progression — current product contract

**Current authority — 15 September 2026:** [CRITIC-POLICY.md](CRITIC-POLICY.md) supersedes older score formulas, gate order and review-preview exceptions below. The sole human product critic is the current user. Review the whole playable candidate, use observed evidence and hard blockers, and keep preview/readiness/user acceptance distinct. The user selected an ongoing How LLMs Work series; see [NEXT-TEACHING-DESIGN.md](NEXT-TEACHING-DESIGN.md). Preserve existing retry evidence; the new topic needs new learning identities.

**Current review amendment — 14 September 2026:** Keep the skippable first-entry opening, later-level resume and non-destructive replay. After the opening, teach third-person movement/look briefly and introduce task controls progressively. Story framing is recoverable; gameplay uses player-controlled camera movement. Read [GAME-CAMERA-INPUT.md](GAME-CAMERA-INPUT.md).

Confirmed by the user on 13 September 2026 (14 September IST). This contract supersedes conflicting active 2D/2.5D/Three.js-selection and gameplay-fallback guidance. The deployed `16a655e` experience is **user_rejected / needs_revision**; no new numeric user score was supplied. Its passing tests and successful deployment remain engineering evidence only.

## Required experience

Deliver a fully 3D PlayCanvas game throughout the opening, tutorial and Signals 1–7. The world is the primary surface, with a game HUD, spatial markers and contextual helpers. A small 3D viewport embedded among lesson panels does not satisfy this requirement.

Use Zelda/Witcher as references for how a game establishes a world, gives the player a reason to care and teaches through progressive play. This is a design reference, not a request for their characters, assets, open-world scope or AAA production values.

Author in this order: story/setting and stakes -> progression and information schedule -> opening/tutorial -> Level 1 and subsequent challenges -> rendered review. Do not start with controls and retrofit story captions.

## Entry, skip, resume and replay

| Player state | Required behavior |
|---|---|
| First authenticated campaign entry, no existing play | Automatically enter the 3D opening before the campaign/mission interface. |
| Opening completed or explicitly skipped | Continue into the tutorial/Level 1. Do not restart the opening on refresh or next login. |
| Unfinished Level 1 | Resume the saved attempt and its appropriate tutorial step; no automatic cinematic interruption. |
| Level 2 or later, including a new browser/device | Resume current progress. Never auto-play the opening because local storage is empty. |
| Explicit Replay opening from the game menu | Play the opening, then return to the exact prior map/mission and draft. Never launch Level 1, reset progression or award XP/evidence. |
| Different learner on the same browser | One learner's intro dismissal must not suppress another learner's first opening. |

Authoritative campaign progress takes precedence over presentation preferences. Presentation completion/skip must be scoped to the learner and campaign/version; it is not mastery, a mission clear or an assessment. Persist using the existing authenticated save model where possible; device-only preferences must not be described as cross-device guarantees.

Skip is always available. Skipping the cinematic does not skip the essential first-action tutorial. Replay is optional at every level. Back, Continue, scene replay and Pause/Resume preserve deliberate pacing; reduced motion retains visible causal states and equivalent controls.

## Opening and tutorial design

The player must understand, without specialist knowledge:

1. Where am I, and what makes this world worth entering?
2. Who is Pip, what does Pip want, and why should I care?
3. What happened to the crossing, and why does it matter to the valley?
4. What is my role, what can I do, and what is my immediate goal?

Teach only what is needed for the next action. Short dialogue/subtitles support character acting, environmental events, camera focus and visible consequences. They must not become a six-page explanation pasted over scenery. Do not explain the whole course at the opening.

Stage the existing Echo Forge story in a continuous world: homeward valley -> bridge breaks -> one gear ordered -> reply lost -> scarce ember stakes -> Signal Keeper awakens. Respect player-versus-character knowledge and preserve uncertainty required by the later task. `CURRENT-STORY-CANDIDATE.md` owns the exact treatment.

Give the player an immediate, safe success through an obvious world interaction and visible acknowledgement before asking them to reason about uncertain outcomes. The opening/tutorial flows directly into Signal 1; it must not end on a dense campaign selection page. First meaningful success changes the world and earns a clear reaction from Pip.

## Progression and cognitive-load budget

| Segment | New demand | Support and visible payoff |
|---|---|---|
| Opening/tutorial | Notice, focus and interact with one marked object | One highlighted target, one instruction, immediate world response; no assessment jargon. |
| Signal 1 | Inspect the Forge and order; recover one gear safely | Guided inspections, clear same-order choice, recoverable mistake, bridge/character payoff. |
| Signal 2 | Keep job identity across a worker restart | Reuse familiar objects/actions; introduce only the changed worker. |
| Signal 3 | Keep the order’s meaning consistent | Introduce changed payload and show why the old seal cannot name a different job. |
| Signal 4 | Recognize that memory expires | Introduce time/retention and reconcile against the authoritative record after identity and meaning are understood. |
| Signal 5 | Handle an unavailable authoritative record | Distinguish unknown from absence and introduce safe pause; do not invent success. |
| Signal 6 | Combine the learned recovery rules | Spatial route construction, storm tests, visible feedback; contextual help rather than a page-sized manual. |
| Signal 7 | Transfer the policy to a new setting | Deliberate 3D world transition, reduced scaffolding, preserved independent/assisted evidence semantics. |

New tools, markers and HUD elements appear when useful. Raise difficulty through reasoning, uncertainty and reduced support, not more text. Journals, evidence and technical debrief stay available as secondary views. Early success is practice, not a claim of mastery.

## No 2D gameplay fallback

Remove the runtime switch to the old SVG/CSS/DOM game when PlayCanvas fails. An engine/module/context failure must show an honest loading/recovery screen with Retry and safe navigation; retain saved progress and block invisible game actions. Missing required deployed assets must fail verification. Never silently continue into a different 2D game.

DOM-based HUD buttons, subtitles, labels, keyboard/screen-reader semantics, menus and login remain valid accessibility/UI layers over the 3D experience. These are not a second gameplay renderer. Reduced motion still uses 3D. An explicitly declared simplified **3D** asset representation is distinct from the removed 2D gameplay fallback and cannot excuse a broken essential scene.

## Executable acceptance and product review

Verify fresh authenticated entry, skip -> tutorial, reload, returning Level 1, Level 2+ with empty local storage, account isolation, and explicit replay from an active later-level draft. Replay must preserve attempt/route/progress and produce no learning reward.

Exercise missing engine/module, context loss/restoration and asset delivery. Prove that no 2D game becomes playable and that Retry recovers the 3D path without discarding progress.

Inspect exact desktop and 360/390/430px rendered opening, tutorial, first choice, first success, later-level HUD and transfer evidence, including touch, keyboard, text enlargement and reduced motion. Check markers against the objects they label and actual tap targets, not just canvas existence.

Keep the full unit/PostgreSQL/static/browser gates. Story, first-touch, whole-game and learning critics remain separate; no historical score transfers automatically. The user's current rejection is final until a new candidate is explicitly reviewed. A source document, engine tag, CI success or deployment SHA does not establish engagement or comprehension.

## Documentation ownership

This file owns the entry/progression/no-2D contract. The root implementation plan and AGENTS carry execution order; story candidate and story critic own narrative; runtime/rules docs own state boundaries; UX/design/generation docs carry HUD and load scheduling; acceptance/critic docs carry tests and product gates; STATE records actual verification and the latest user verdict; HOSTING records deployment/asset checks. Historical snapshots remain historical and cannot override this contract.

## Foundation: games generated from learning needs and preferences

User reaffirmed the ultimate product goal on 13 September 2026: generate games on demand from what a user needs to learn and their explicit preferences. Echo Forge is the reference, not the framework. LearningSpec, explicit UserPreference/StoryPreference inputs, StoryWorldSpec, GameDesignSpec, GameRulesSpec, WorldSpec, RuntimeExperienceSpec and versioned AssetRefs must compose through shared validators/runtime. Canonical learning and evidence cannot depend on theme, assets or engine. Preferences may influence setting, tone, presentation, pace and interaction style without weakening outcomes or assessment. Never infer unstated preferences.

Implement the opening/tutorial/HUD/progression as reusable, spec-driven capabilities and assets; keep Echo Forge dialogue, beats, cameras and object IDs in the reference package. New games must not require copied opening controllers or new renderer lifecycles. Prove a materially different fixture through shared components. This foundations work does not claim that an on-demand generator/model integration is already implemented or authorize unrelated Phase 2 work.


## Current user review checkpoint

**15 September 2026:** [CRITIC-POLICY.md](CRITIC-POLICY.md) controls review. The user may inspect a draft at any time; a preview is not an internal ready recommendation, acceptance or deployment authorization. The current user is the sole human product critic and final authority.
