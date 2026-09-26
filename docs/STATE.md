# Current state — LLM learning-game proof track

**26 September 2026.** This file is the current status. Older narratives live in
`docs/history/STATE-20260921-24.md` and `docs/history/STATE-20260918-20.md`.
Automated checks, critic judgment and user acceptance are separate claims.

## Candidate

- Development branch `docs-readthrough-20260921`; frozen repair commit `38e88f1`.
  `main` remains the canonical development destination. This checkpoint has not
  yet been merged or pushed. `deploy/render-supabase` remains pinned separately.
- The candidate repairs the cold critic's missing tutorial input/history with a
  carried, world-anchored readout; adds a reachable Level 1 speech station;
  makes its action visibly say OPEN ENGINE; and compacts phone markers without
  shortening the learning clues. The optional panel remains available.
- The system now enforces a visible learning carrier before the next action,
  checks its presence on narrow and desktop states, measures touch-control and
  informational coverage separately, and refuses a prose-only budget raise.
  The play harness re-applies and verifies viewport size on every step, persists
  resize, bounds its frame probe, records browser ownership and verifies cleanup.

## Evidence on or leading to this candidate

| Claim | Status |
| --- | --- |
| Build and design structure | `python manage.py build` passed on the pre-commit tree; learning-design quality and runtime alignment remain unassessed by that structural command. |
| Application tests | 438 tests passed (7 PostgreSQL skips) before the final browser-launch and viewport test edits; 40 focused harness/presentation contract tests passed afterward. Full suite on frozen `38e88f1` is pending. |
| Active browser groups | All six groups passed sequentially on the code that became `38e88f1`: opening, tutorial, controls/physicality, chapter, 200% readability and hosted lifecycle. A transient tutorial reload heading required a bounded 30-second wait; the saved LOOK step then appeared and passed. |
| Presentation budget | A 19-state targeted run after the final game layout passed. Tutorial phone: 19.3% total, 13.6% informational; Level 1 first decision phone: 19.2% total, 13.6% informational, all 3 route carriers visible. A previous 25-state run passed before the final compact layout. The required 25-state `--candidate 38e88f1` report is pending. |
| CPU/GPU review | Direct3D 11 identified the Intel UHD GPU and measured about 2.2 CPU cores plus 36% GPU on a 390px active scene. Bounded SwiftShader comparison used about 8.3 CPU cores and 0% measured GPU; its WebGL renderer query did not complete, so these are workload samples rather than a same-frame benchmark. The GPU switch improves responsiveness but moves work to the GPU; the self-ending frame probe and reliable process cleanup remove avoidable work/leaks. |
| Browser harness integrity | A real `start` said 390x844 while a later `step` saw 484px wide. Reapply-on-step repair was verified across separate commands: 390x844, then 360x800 after resize, still 360x800 on the next connection. A direct Windows `start` sometimes stalls at CDP; an empty PowerShell pipeline has launched it, and failed starts are now cleaned up. This host-specific launch gap is not resolved. |
| Experience review | One prior fresh-context Astra pass across lanes rated the pre-repair candidate `96f7d81` needs revision (tutorial readability, Level 1 object focus and action affordance). A focused phone replay on the repair observed readable request, clue and generated words through the tutorial, then reached Level 1; it ended at the reviewer's usage limit before B2/B3 judgment. No exact-`38e88f1` cold critic verdict exists yet. Motion and audio remain parked and unassessed. |
| User acceptance | Not yet obtained; the user's earlier rejection remains the final human verdict. |

## Next gate

1. Run full application tests and the entire 25-state presentation budget on
   `38e88f1` with `--candidate`; inspect the phone screenshots as well as numbers.
2. Use the same single fresh-context Astra reviewer for the remaining focused
   Level 1 live-play recheck and all critic lanes. Preserve earlier cold evidence;
   do not turn the partial replay into a passing score.
3. Repair any demonstrated blocker, re-freeze and repeat affected gates. Merge
   reviewed development work into `main` when the candidate is ready. No Level 2
   or deployment promotion before the existing review and user gates.
