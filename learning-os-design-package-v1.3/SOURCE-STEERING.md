# Learning OS — user-directed source selection 1.3

**6 September 2026 · Semantic design contract; not an implemented integration**

## 1. Product requirement

During onboarding, generation, and course expansion, a learner may recommend sites, exact pages, books, repositories, syllabi, or uploaded material and explain their intended role. The agent must preserve and act on that guidance, report what happened, and allow correction. It must not depend on a source name remaining inside a provider chat thread.

Example: “For coding interview preparation, look at GeeksforGeeks and LeetCode.” Interpret this as preferred places to investigate, not exclusive sources, a blanket copyright/access grant, or a claim that every item on either site is authoritative. GeeksforGeeks publishes interview-preparation material [R1]; the user's instruction determines its role in this course, not a hard-coded platform ranking.

A suitable confirmation is: “I’ll prioritize those for interview practice, and use other suitable sources where they help explain a gap. I’ll show anything I couldn’t inspect.” No compulsory extra question is needed for this reversible default. An explicit only-listed or required-use instruction is stricter and must be honored or reported as unmet.

Scope the preference to the current request/course unless the learner explicitly asks to save a broader preference. A site recommendation does not become a permanent learner trait.

## 2. Minimal contract, reusing the course brief

Add a versioned value object to `CourseBrief`, not another independent microservice or a site-specific branch in the learning core.

```text
SourceSelectionPolicy
  id, revision, owner_scope, applies_to_ref
  derived_from_message_refs[]        # private provenance, not shared course text
  search_boundary: open | only_listed
  directives[]:
    id
    target: { kind: domain | url | catalog_ref, value }
    effect: consider | prefer | must_include | exclude
    roles[]: explanation | reference | worked_example | practice | syllabus
    selector_scope: exact | domain_and_subdomains | catalog_item
    interpretation_note?
  constraints:
    paid_access: disallowed | explicit_grant_required
    unavailable_required: block_affected_output | ask_for_substitute
  unresolved_conflicts[]
```

`owner_scope` identifies the authorized learner/workspace. `applies_to_ref` identifies a private brief, change request, or explicit saved preference. Reuse existing opaque IDs, immutable references, and privacy types. Do not invent a second identity system. A new instruction produces a new policy/brief revision; preserve the original wording as private provenance and show the effective interpretation.

`consider`: investigate suitability and report disposition within the research budget; do not force inclusion. `prefer`: rank suitable permitted items ahead of equivalent alternatives; do not silently discard the preference. `must_include`: at least one eligible item from the target must be included in each specified role or the affected deliverable is not ready. A directory link cannot satisfy a required worked example. `exclude`: do not retrieve, use, embed, or offer items from that target in the new candidate; retained historical evidence is not erased.

`only_listed` confines research and selected supporting sources to positively listed targets. It is not merely a filter applied to the final bibliography after unconstrained browsing. Do not follow outbound citations into unlisted domains without asking to revise the constraint. Ordinary generation may connect and explain the permitted evidence, but must not smuggle unsupported outside claims into a source-grounded answer key.

Avoid secret precedence rules. A more specific explicit course request can revise a saved preference, visibly and within permissions. Conflicting hard directives produce an actionable conflict. An exclusion cannot override a security restriction in the opposite direction: user instructions never grant forbidden access. A required source that is also excluded is not resolved by model intuition.

The initial implementation may encode roles as validated strings/enums and the policy as a brief JSON field. A generic search/fetch boundary plus existing source records is sufficient. Add dedicated adapters only when an actual authorized interaction requires them.

## 3. Source preference, access, inspection, use, and trust are separate

Reconcile the effective selection policy with an application-controlled access policy. A preferred or required target remains subject to permission, access restrictions, fetch safety, disclosure limits, and supported capabilities.

```text
SourceConsideration  # reuse the existing GenerationRun research audit
  run_ref, source_policy_ref, directive_refs[]
  source_ref_or_resolved_target
  discovery_basis
  access_state: permitted | requires_grant | restricted | unknown | unreachable
  inspection: not_attempted | metadata_only | excerpt | relevant_sections | full
  disposition: selected | not_selected | unavailable | blocked | budget_deferred
  selected_roles[]
  presentation: link | approved_embed | permitted_excerpt | generated_explanation
  consulted_at?, inspected_locators[], source_edition_ref?, permitted_snapshot_ref?
  reason, limitations[]
```

A link selected for external practice may have `inspection=metadata_only` or `not_attempted` if that is all the system actually knows. It is then a suggested external resource, not inspected support for an answer key. A search result/snippet is not a claim of reading the complete page. Source authority/claim support remain the existing content-validation attestations, not a consequence of user preference.

Store source-policy and brief revisions on each `GenerationRun`, and retain source-selection results. Reuse these references in `ChangePlan`, content provenance, and candidate read sets rather than copying raw preferences across every object.

Give the learner a short source report with “used,” “linked only,” “not selected,” and “could not inspect,” including why. Unvisited suggestions are not reported as considered. In a tight budget, show what was deferred rather than silently dropping it.

### Access constraints for the examples

LeetCode's published Terms of Service prohibit crawling/scraping/spidering and assert restrictions over platform content [R2]. Do not build a bulk LeetCode importer or presume an official API/embed exists. The default design path is an appropriate external practice link; inspect/import content only through an actually authorized route whose scope has been verified. A search proxy, mirror, or another model is not a bypass for a known access restriction.

Do not presume unrestricted copying, embedding, adaptation, or redistribution for GeeksforGeeks or any other public site either. Resolve permissions separately for the action actually requested. Unknown permission is not a blanket technical failure: link-only suggestions may remain useful, with honest inspection limits. An inaccessible required reference blocks claims relying on it rather than producing fictional citations.

Do not ask the learner for passwords or session cookies. Any future authenticated integration uses an explicit permitted credential/grant workflow and must not transmit unrelated private data. Public-web queries use the topic and a minimal audience summary, not the private course brief.

URL handling is an application security boundary: accept supported schemes, normalize hostname/path deliberately, reject private/local/metadata destinations and credentials, and revalidate redirects and actual network targets. A hostname ending in an attacker-controlled lookalike is not an approved domain. Parser/string validation alone does not prevent unsafe network access.

## 4. Mid-course collaboration and history

A request such as “Expand this with more examples from this site” creates a new change request or revision and a new source policy. The authoring pipeline prepares a candidate under that exact policy. Adoption checks whether a newer relevant instruction exists. Old completed artifacts may be retained as drafts, but cannot be represented as satisfying the newer request without reconciliation and applicable verification.

Preserve old course versions, pinned assessments, exposure history, evidence, and review debt. Selecting a new source cannot rewrite an old rubric or erase learned capability. Sharing reusable content can retain public citations and ordinary audience metadata while removing private directives, message IDs, learner identities, and project context.

External IDs, site topic tags, and platform difficulty ratings are source metadata, not competency IDs or mastery standards. An agent can propose a reviewed mapping to canonical frames, but no platform-specific mapping is executable core logic.

Opening a practice link is not a solution attempt. A learner's statement that they solved a problem is self-reported evidence, not silently a verified unassisted result. A future integration may import an authorized observed outcome, preserving what the observation actually establishes. An independent in-product follow-up can establish capability under a known aid contract.

External solution/editorial access may be incompletely observable. Record what was actually opened or declared, do not assume a redirected problem page was the only material seen, and do not invent surveillance. Generated near-duplicates of an exposed problem retain family/derivation lineage; cosmetic rewriting does not restore novelty.

## 5. Interface additions

| Existing interface | Addition |
|---|---|
| `Onboarding.respond` | Extract proposed source guidance; render a concise editable interpretation; keep request scope explicit |
| `Experience.request` | Pin brief and source-policy references plus existing access/budget grants |
| Research adapter | Accept effective scoped research constraints, not a private profile dump; return observed inspection and limitations |
| `CourseGenerator.advance` | Select permitted evidence under the pinned policy; record each directive's disposition; flag unmet hard constraints |
| `CourseEditor.propose` | Apply source revisions through the same authoring boundary; produce coverage/source/workload differences |
| Content validation | Verify actual support, access/presentation status, and hard-source constraints separately |
| `ActivationController.activate` | Check relevant source-policy/brief versions; do not adopt stale meaning silently |

Suggested failure codes: `SOURCE_CONSTRAINT_CONFLICT`, `REQUIRED_SOURCE_UNAVAILABLE`, `SOURCE_ACCESS_RESTRICTED`, `SOURCE_SCOPE_VIOLATION`, `SOURCE_INSPECTION_INSUFFICIENT`, `SOURCE_POLICY_STALE`, and `SOURCE_BUDGET_EXHAUSTED`. Use the existing error envelope with the affected scope and recovery action. A hard constraint can block one section while leaving explicitly independent, clearly labeled material usable; never mark the whole requested course complete when required work is missing.

## 6. Acceptance scenarios (unexecuted)

| ID | Scenario | Expected result |
|---|---|---|
| SS01 | Learner names GeeksforGeeks and LeetCode without saying “only” | Saved course-scoped preferences; additional suitable permitted sources remain allowed |
| SS02 | Learner says “only these sources” | Search, fetch, citation following, and selected grounding stay inside the explicit boundary; insufficiency reported |
| SS03 | A preferred source is unsuitable or budget-deferred | It receives an honest disposition and reason, not a fictional inspection claim |
| SS04 | A required source is unavailable or insufficiently inspected for its role | Affected output blocked or explicitly renegotiated; no substitute silently treated as satisfying it |
| SS05 | Same target is both required and excluded | Actionable conflict; no arbitrary model-selected precedence |
| SS06 | New user supplies different sites | Same generic authoring/runtime path; no engine edits or cross-user preference leakage |
| SS07 | Named platform lacks verified import/embed permission | Approved link/fallback or blocked action; no scraping/mirror/API assumption |
| SS08 | Source text requests secret access, tool changes, or grade edits | Content remains data; application permissions reject those actions |
| SS09 | User revises source guidance while generation is running | Old policy remains auditable; stale candidate cannot silently satisfy the new request |
| SS10 | Source guidance changes after completed work | Old assessments/evidence/retrieval unchanged; new candidates use new refs |
| SS11 | User clicks a platform problem or claims a solve | No automatic verified mastery or duplicate XP; self-report is labeled as such |
| SS12 | New variant derives from a previously exposed external problem | Lineage/exposure remain; no automatic “novel transfer” credit |
| SS13 | Only-listed site redirects to an unlisted/private/lookalike target | Scope and network validation enforce boundary; no private fetch or credential leakage |
| SS14 | Course becomes shareable or another learner requests similar sources | Public citations may be reused where allowed; private brief/messages, policies, and learner context do not leak |

## 7. Status and sources

These are proposed contracts and tests. No source importer, source-selection application behavior, or provider/platform integration was implemented or verified. The current web checks establish the cited documentation's contents, not the availability of an integration.

[R1] GeeksforGeeks, Interview Preparation. https://www.geeksforgeeks.org/blogs/interview-preparation/ — consulted 6 September 2026.

[R2] LeetCode, Terms of Service. https://leetcode.com/terms/ — consulted 6 September 2026. Recheck before implementation; this handoff is not a grant of content rights or legal advice.
