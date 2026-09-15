# Critic policy — observed play, then the user's verdict

**Active from 15 September 2026.** This is the authority for review methods, ratings and readiness. It replaces conflicting weighted-score rules, sequential review restrictions and review-candidate exceptions in older documents. It does not authorize deployment or another phase.

## Who decides

There is currently **one human product critic: the current user**. Their explicit verdict is final. Do not invent a panel, child study, user score, approval or new review requirement involving other people. Agents and tools are fallible internal reviewers. Even a separate agent is not audience validation.

The user may inspect a draft whenever they want and may reject or accept it regardless of internal scores. A requested preview is a preview, not a recommendation or acceptance. No internal score, green CI run, deploy, missing response or completed level changes the user's verdict. Acceptance must cite the user's actual statement and identify its candidate/scope; do not infer it from this validator.

## Why the old process failed

The audit of deployed `337db573d87c417aca42f55894a2c6e807df21ed` found:

- There is no running critic model/service or quality-scoring step in CI. The critics were prompts, documents and manually entered ratings. Browser reports deliberately say `critic_pending`; they verify behavior, not enjoyment.
- The **9.059** story score judged a written story candidate. An older **9.37** treatment review described intended visual clarity with unwarranted confidence. Neither established that the actual opening communicated its world.
- **8.528** was a historical, limited first-touch review, not a pass for this deployed revision. No complete current story/game/learning acceptance existed.
- A bounded review-deployment exception allowed a technically verified preview below 9. The PR disclosed its browser limitations. However, “free of identified blockers” was too weak when the relevant interactions had not actually been inspected.
- Weighted averages, optimistic 9.x descriptions and screenshot selection obscured basic failures. Requiring first touch to pass before inspecting later play also left later problems unexamined.

Historical records remain historical; do not silently rewrite their numbers. The actual seven-signal playthrough and limitations are in [PLAYTEST-20260915.md](PLAYTEST-20260915.md). This build is **needs_revision**. The user supplied qualitative changes, not a new numerical rating.

## Review workflow

1. Freeze the exact candidate commit and identify package/content versions, environment and disposable learner state. Record prior knowledge, assistance, restarts and any source inspection before play.
2. Review the learning premise and written story for contradictions, prerequisites and production risks. Call this a **design review**, never a rendered story pass. A promising paragraph cannot earn game-quality points.
3. Play the fresh opening without a walkthrough. Record what the screen communicates before reading source explanations. If the reviewer already knows the design, disclose that bias. Imagining a novice is useful criticism, not a novice study.
4. Inspect the whole playable chapter even when the opening fails. Exercise first action, mistake, recovery, harder decisions, payoff, transfer, replay, save/resume and controls after a saved action. Stop only where an actual blocker prevents progress; mark the rest unobserved. Document reloads/workarounds rather than counting them as smooth play.
5. Use desktop and 360/390/430 CSS-pixel portrait evidence. Check moving cause/effect and before/after states, not just attractive stills. Record touch/keyboard, text enlargement and reduced-motion checks separately; desktop viewport emulation is not a physical phone test.
6. Write failures and likely abandonment points **before** numbers. For each criterion cite exact visible evidence, give an integer rating or leave it unassessed, explain its limit, and state a concrete repair/retest condition.
7. Run the record checker. Fix blockers before recommending another candidate. A source-only fix or a passing existence/bounds test cannot close a perceptual or interaction finding; replay the failing sequence on the changed candidate.
8. Present an honest recommendation and known limits to the current user. Their verdict remains final. Do not repeatedly polish to chase numbers after the user gives different direction.

## Rating calibration

Use **whole numbers from 0 to 10**, per criterion. No decimal precision or weighted averages. `null` means not assessed; missing evidence is not a zero or failure. These are internal judgments about the observed experience, not measured audience scores.

| Rating | Anchor |
|---|---|
| 0–2 | Missing, misleading or unusable; the intended activity cannot be followed. |
| 3–4 | A reviewer can progress through substantial explanation, guessing or workarounds; a basic requirement fails. |
| 5–6 | Understandable with noticeable friction, weak motivation or repeated scaffolding. |
| 7–8 | Clear and competent across inspected states; meaningful weaknesses remain. |
| 9 | Convincing across the required observed states, no material weakness found; cite the strongest counterexample attempted. |
| 10 | Exceptional sustained execution across the chapter; explain what exceeds 9. This remains an opinion, not human validation. |

The >=9 aspiration remains. Each required criterion must reach 9, with no blocker and complete required evidence, before an internal **ready_for_user_review** recommendation. The gate summary is its **lowest** criterion, never an average; do not publish one blended game score. A 10 for beauty cannot offset a 3 for understanding the goal. Unknown criteria make readiness incomplete. Criteria below 9 or concrete blockers mean needs_revision. Missing technical checks prevent readiness without pretending the checks failed.

### Required criteria

| Gate | Criteria |
|---|---|
| Rendered story | `world_role_stakes`: who/where/what matters; `visible_causality`: events communicate why; `attachment_pull`: a visible reason to care and continue. |
| First touch | `orientation_action`: locate self/goal/first action; `hud_readability`: useful markers and unobstructed play; `controls`: movement/camera/action remain operable. |
| Whole chapter | `meaningful_agency`: choices affect the world; `progression_recovery`: challenge changes and recovery teaches; `world_continuity`: later play stays coherent and tangible. |
| Learning | `concept_fidelity`: mechanic embodies the declared idea faithfully; `fresh_transfer`: a new situation requires the idea without copying the just-shown answer. |

A learning-design review assesses opportunity and evidence quality. It does not establish that anyone learned. Delayed retention and audience enjoyment remain untested until actual evidence exists. XP, completion, assistance and animation do not establish mastery.

## Non-negotiable checks and blockers

These questions operationalize the criteria. Failing one is a blocker even if a reviewer likes the art. They are reviewer probes, not claims that a real child passed them.

| Check | Evidence required / failure condition |
|---|---|
| World and role | In the first minute, identify where we are, who the player controls, who needs help, what changed and what to do next using visible events and brief accessible cues. A glossary or several exposition cards supplying the premise fails. |
| Opening is a scene | Show a causal event and character/world response in a coherent space. Repeated Continue over substantially the same diorama, with captions carrying the action, fails. Back/Skip/Replay/accessibility remain available. |
| Phone framing | At each required action and consequence, player, relevant target and visible result fit the authored view. A marker contradicting the target direction or a key consequence offscreen fails. |
| HUD and text | Default play has one short current goal and contextual action cues. No duplicate instruction stack, text over the manipulated object, nested reading area required for the immediate task, or control overlap. Optional detail stays available; accessible labels remain. |
| Action survives save | Inspect/interact, wait for save, then actually use movement and every camera control without reloading. Disabled or intercepted controls fail even if their positions pass tests. |
| State matches explanation | Object/payload, marker, objective, chosen action and resulting world agree. A stale “one gear” panel during a “three gears” problem fails. |
| Meaningful progression | Inspect a middle and final challenge. Longer prose and renamed nouns with the same answer pattern do not count as increasing depth. |
| Transfer | Attempt a novel layout/context with faded prompts before feedback. A recipe copied from the preceding worked task cannot certify independent transfer. Disclose prior exposure and assistance. |

Do not remove all text or semantic HTML to chase this rubric. Inspect the world without expanded help as a diagnostic, then verify equivalent concise information through accessible controls and descriptions.

## Evidence and executable check

Use [reviews/2026-09-15-render-337db57.json](reviews/2026-09-15-render-337db57.json) as the format example. Every score/coverage claim references existing repository evidence. The record contains exact SHA, reviewer method, environment, limitations, coverage, criterion ratings and unresolved blockers.

```
python tools/check_critic_review.py docs/reviews/2026-09-15-render-337db57.json --candidate 337db573d87c417aca42f55894a2c6e807df21ed
```

Exit 0 = internally ready for user review; 1 = valid record but needs revision/incomplete; 2 = invalid/stale record. `--validate-only` checks record structure/evidence references without implying readiness. The checker rejects mismatched revisions, missing evidence and fractional ratings. It cannot verify honesty, inspect pixels, judge enjoyment, or accept a product for the user. It is an explicit review command, **not a Render deployment hook or automated critic service**.

When a candidate changes, make a new review record. Keep prior review scores attached to their old revision. Link unchanged evidence only with an explicit scope argument and fresh checks of the affected behavior. Do not count fictional test fixtures as real review evidence.

## Scope and recovery

Private Phase 1 only. Use disposable local/test data; preserve Supabase identity, allowlist, RLS, immutable learner evidence and assessment contracts. No new external testers, critic/model service, paid resources or public rollout. Policy/tool changes are reversible in Git; historical reports and learner data are not rewritten. The next topic choice is in [NEXT-TEACHING-DESIGN.md](NEXT-TEACHING-DESIGN.md).
