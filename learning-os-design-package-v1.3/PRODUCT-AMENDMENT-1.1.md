# Learning OS — product and architecture amendment 1.1

**6 September 2026 · Design only · No application implementation**

## Authority and scope

This amendment incorporates the user's clarification after design revision 1.0. It takes precedence where it conflicts with the original architecture, interfaces, acceptance plan, or roadmap. The original records, examples, schemas, and validation report remain useful baseline assets, not a complete implementation of this amendment.

The original machine-readable schemas have **not** been extended or revalidated for the new product contracts below. The coding agent must extend and test them. Do not treat the old validation report as validation of onboarding, generation, UI, rewards, multi-user behavior, or automated publication.

The current authorization is architecture and product design, not application implementation.

## 1. Corrected product definition

Build an appealing, agent-guided learning product that understands a learner, researches appropriate public material, creates a scoped course experience, teaches adaptively, and preserves useful learning history as users' interests and courses change.

**Decoupling means low-friction reuse across both courses and people.** State preservation remains essential, but it is one test, not the whole product definition. Adding another supported subject or another learner should normally require data, configuration, and generated content—not edits to the engine or application source.

The current user's experience (6+ engineering years, including approximately two independent years and agent work), advanced challenge preference, backend context, and orchestrator project are one profile. They must not become global defaults for all learners. Another person can prefer worked examples first, shorter sessions, beginner scaffolding, or a different domain.

Domain independence is bounded by installed interaction capabilities. A new text-based subject should need no domain-code change. A new physical, audio, simulation, or execution modality can legitimately need a renderer or tool adapter. Do not promise automatic correctness, universal assessment expertise, or hardware support through schemas alone.

## 2. Decisions replacing the original release priorities

| Original default | Revised decision |
|---|---|
| CLI/thin web interface is a sufficient first meaningful version | CLI is developer tooling. A cohesive, appealing responsive web experience is part of the first usable product. |
| Live model integration can follow the initial product milestone | A live model-and-web-grounded course-generation path and tutor interaction are required before claiming the requested product loop works. Deterministic fixtures still test invariants. |
| Course authoring is primarily a separate workspace | Authoring remains a bounded subsystem but is exposed in the main product through conversational onboarding and course creation. |
| Every generated release requires a human publication reviewer | Low-stakes personal practice may publish after automated quality gates, with accurate verification labels. Ambiguous assessments, global competency equivalence, rights uncertainties, and higher-risk domains require stronger review or abstention. |
| One expert learner is the assumed user | All learner-specific behavior is profile- and goal-driven; test two substantially different learners from the start. Public access and authentication scope remain an explicit deployment decision. |
| Minimal navigation before polished engagement | Good interaction design, progress feedback, and a small meaningful gamification loop are release requirements, not a final decorative phase. |

Continue with a modular monolith and ordinary relational storage. Do not introduce microservices, a plugin marketplace, a universal ontology, or cross-user adaptive-model training to satisfy these requirements.

## 3. Product journey

### 3.1 Entry

Provide three equivalent entry points: a named subject (for example, "Teach me system design"), a concrete goal/project, and **Surprise me**. Do not require a long form before the product offers something useful.

Conversational onboarding has quick-answer controls and an editable profile summary. Questions are adaptive, not a fixed questionnaire. Ask only about unknown information that could change the immediate course scope: intended outcome, relevant experience, available time, or material/privacy constraints. Previously supplied information should be shown for correction, not repeatedly requested.

The system may suggest a session duration or trial scope but must label these as provisional choices, not facts about the person. Goals and constraints remain distinct from preferences and observed capability.

### 3.2 A useful proposal, not a wall of curriculum

Present one recommended course card with its intended outcome, target level, proposed commitment, reasons for selection, initial route, first activity, and source/verification status. Offer Start, Adjust, and Try something different.

A regular request can invite scope confirmation without a forced wizard. **Surprise me** authorizes choosing the topic/route and launching a reversible first episode within existing permissions and budget; it must not become an endless proposal-approval loop.

### 3.3 First experience

Show a coherent, prepared first module while later modules remain an explicit outline. The learner can inspect the overall route, but the system must not display outline-only modules as ready to study. Prepare the next module through the same quality boundary; record revisions and never overwrite an activity already attempted.

Generation is progressive materialization, not improvised grading: the stimulus, assumptions, allowed aids, expected reasoning, rubric, and source basis must exist before a task is presented as an assessment.

### 3.4 Surprise-me behavior

With relevant context, propose an adjacent high-value challenge. For the current user, a defensible proposal is **Design an agent execution service that survives ambiguous failures**, as an entry into system design. Explain that this is a recommendation based on stated backend experience and agent work—not a diagnosis of a skill gap.

With little or no context, offer a short, clearly exploratory sampler with easy redirection. Do not claim a strong personal fit, infer sensitive traits, or commit the user to a long program. Capture feedback as provisional preference evidence. One rejected topic is not a permanent dislike.

Surprise me does not authorize accessing connected accounts, sending private repository material, paying for resources, bypassing source restrictions, or exceeding a pre-agreed generation budget.

## 4. Architectural decomposition

```text
Responsive product experience
  -> onboarding / intent orchestration
       -> learner profile and consent
       -> private CourseBrief snapshot
       -> research and course-generation pipeline
            -> source search and retrieval adapters
            -> versioned content and course catalog
            -> validation and publication boundary
       -> private CourseExperience
  -> session planner and tutor
       -> attempts / assessments / evidence
       -> capability projections and retrieval
  -> progress and engagement views
       <- accepted learning events and scoped course-navigation events
```

These are modules and interfaces in one application, not independent deployments or a required multi-agent swarm. Models may perform different roles through one task-oriented provider interface.

### Ownership

| Object | Scope and purpose |
|---|---|
| Competency/frame definitions | Reusable, versioned assessment targets. New private/unreviewed definitions may be scoped; global equivalence is not automatically inferred. |
| Course package/version | Reusable goals, audience assumptions, route, resources, and activities. Reusable does not mean publicly visible. |
| Course brief | Private snapshot of relevant intent, context, assumptions, constraints, and provenance used to design an experience. |
| Course experience | Learner-owned selection/configuration of a package plus private contextual variants. Not the owner of mastery. |
| Evidence and retrieval | Learner-owned, course-independent. |
| Engagement state | Learner-owned awards, journey presentation, and practice-goal progress; separate from capability estimates. |

A course can declare "advanced backend audience" without containing the requesting person's identity or mastery. Private examples derived from a repository or personal context must stay private. Removing a name does not establish that an example is safe to share.

The same course version should serve an expert and a less-experienced learner through different diagnostics, pacing, resources, and activity selection. There is no requirement that every fully personalized course become universally suitable. The requirement is reusable machinery and honest mappings.

### Isolation

Every private command and query uses an authenticated/authorized learner scope. A client-supplied learner ID is not authorization. Private jobs, prompts, caches, artifacts, transcripts, awards, and retrieval indexes must inherit that scope. Sharing must create an explicitly reviewed, authorized artifact; it must not expose the private brief or evidence.

Before any remotely accessible multi-user deployment, demonstrate cross-user denial using real storage and API paths. A profile selector in a local developer build is not multi-user authentication. External paid APIs and private-context egress need explicit product permissions.

## 5. Conversational onboarding contract

Use the existing profile assertion model rather than creating a second chat-only profile store. The durable result of onboarding is structured state, not merely a provider conversation ID.

```text
OnboardingSession
  id, learner_id, revision, conversation_ref
  status: collecting | ready | skipped | completed
  known_assertion_refs[]
  unresolved_fields[]
  current_intent_ref

CourseBrief
  id, revision, learner_id
  origin: explicit_topic | explicit_goal | surprise
  requested_topic?                 # absent is valid for surprise
  desired_outcomes[]
  relevant_profile_assertion_refs[]
  capability_summary_ref?          # preserve unknown versus observed
  time_and_scope_constraints
  language_and_accessibility_preferences
  source_access_constraints
  permitted_context_refs[]
  generation_budget_policy_ref
  assumptions[]: { field, value, basis, confidence_label }
```

Normal learners need not approve a JSON object. Display a concise natural-language summary with direct correction controls. Store which assertions came from the user, which are observations, and which are inferred or temporarily chosen defaults.

The public web researcher receives topic/outcome queries and a sanitized audience summary, not the complete private conversation. Do not place personal repository names, employer details, or secrets in search queries by default.

## 6. Web-grounded course generation

### Workflow and lifecycle

```text
brief -> source discovery -> source inspection -> scoped blueprint
      -> competency/frame mapping -> activities and explanations
      -> quality checks -> prepared first module -> course experience
```

`GenerationRun` is a persistent application job: `queued | researching | designing | validating | ready | partially_ready | failed | cancelled`. It records the exact brief, policies, model runs, budget, usable artifacts, missing work, and failure reasons. It is resumable and idempotent where external actions permit. Cancelling prevents further scheduling; already-incurred provider work may still complete or cost money and must be recorded honestly.

There must be real source search and inspection. The product must not label remembered URLs, search snippets alone, or model recollections as checked source material. A model cannot attest that it watched an inaccessible video or read an inaccessible book. Record access limitations.

### Choosing material

"Best" means appropriate to this learner and objective, not a universal top-ranked page. Rank candidates using identifiable authority, coverage, conceptual/technical correctness checks, relevant recency, pedagogical fit, access, source diversity, and intended use. Do not use freshness as a reason to discard foundational material or source popularity as proof of correctness.

For a system-design course, primary technical explanations, specifications, engineering case studies, and papers can supply different roles. Record assumptions and avoid a single supposed correct architecture when the task permits several reasoned trade-offs.

Each prepared module must contain a goal, prerequisite assumptions, source-linked teaching material, at least one active experience, the evaluation/feedback basis, optional scaffolding, and a continuation/retrieval target. Reflection and retrieval follow the chosen learner policy rather than a compulsory identical pattern for everyone.

### Two levels of readiness

Separate **usable practice** from **strongly supported assessment evidence**. Automated gates may permit provisional low-stakes instruction while showing model-reviewed status. Passing a generated activity must not automatically create a strongly verified mastery claim.

Store attestations separately: structural validity, source-link resolution, claim-support review, task/answer-key consistency, assessment review, security/rights checks, reviewer type, and timestamp. Do not compress these into a misleading boolean `verified=true`.

Automatic publication can proceed when the installed low-stakes policy passes. Missing critical source access, contradictory answer keys, unsupported tool requirements, or unsafe content return a repairable failure or an unassessed exploration—not a falsely certified course. Escalate higher-risk subjects or authoritative competency remapping separately.

Use deterministic validation for structure, links, permissions, and references; model critique for semantic issues; tools/tests only when actually run. Model agreement is not independent proof. Keep cost-bounded retries and a useful failure state.

### Sources, rights, and untrusted input

Public accessibility, open licensing, embedding, copying, adaptation, and redistribution are different capabilities. Record permitted use and fall back to a source link when rights or provider support are unclear. Creative Commons distinguishes licensing permissions and conditions [S1]; this design does not make a jurisdiction-specific legal determination.

External pages can contain indirect prompt injection [S2]. Source text is data, not authority to alter policies, approve content, reveal profiles, change tools, or write learning evidence. Narrow tool permissions, separate private context from research, and validate model actions. A prompt telling the model to ignore malicious instructions is not a complete security boundary.

## 7. Links, embeds, and generated content

"Embeddings" in the user's clarification is interpreted as embedded course media. Vector embeddings, if later useful for retrieval, are a separate implementation detail.

```text
LearningContentBlock
  kind: prose | citation | external_link | embed | question | code | diagram
  content_ref
  visibility: always | instruction | after_attempt | after_solution
  accessibility_metadata

ResourcePresentation
  resource_ref, source_edition_ref?
  locator?                        # section, page, timestamp, code range
  presentation: link | embed | permitted_excerpt | generated_explanation
  embed_adapter_key?              # a registered integration, not arbitrary HTML
  access_and_rights_record_ref
  fallback_resource_or_url
  last_checked_at?
```

Use native source cards with title, origin, why the material was selected, section/timestamp, and a direct source action. Supported video services can use their official player integrations; YouTube documents such an integration [S3]. Other providers require adapters or links. Do not presume every page can be iframed or that the application controls third-party content.

Embeds must be click-to-load when external tracking is a concern, use appropriate approved integration restrictions, avoid unnecessary autoplay, retain visible fallbacks, and preserve the learner's place on failure. Never render arbitrary scripts/HTML proposed by a course generator. Links are useful content, not a failure of generation.

The assessment aid policy also governs source panels. An exact worked solution must not be automatically displayed beside an independent diagnostic. Opening permitted documentation is fine; revealing disallowed solutions changes the recorded assistance conditions. Re-rendering a question is not a new attempt.

## 8. Product experience and gamification

### UI requirements

Start with a small coherent web experience: conversational entry, editable course preview/journey, focused activity workspace, a useful end-of-session recap, and a simple progress view. Evidence and sources open contextually rather than taking over the primary screen. Review is a clear next-action surface, not a huge overdue backlog.

Default visual direction: polished, readable, adult-friendly, with visible progress, satisfying transitions, and a sense of discovery. Do not assume minimalism means appeal or that appeal means childish styling. Engagement intensity can be adjustable while the core interface remains well designed.

A workspace can contain the active task and response area, a collapsible tutor/source panel, visible mode, progressive hints, and a small journey indicator. On narrow screens these become accessible panels rather than shrunken desktop columns. Include autosave, resume, honest generation stages, retry/cancel controls, empty/error states, and an easy way to change difficulty or topic.

Keyboard access, visible focus, readable contrast, accessible media/text alternatives, and controllable motion are acceptance concerns; WCAG provides the applicable accessibility criteria [S4]. Do not claim conformance without testing the implemented experience.

### A small meaningful game loop

Ship journey milestones, bounded practice XP, a flexible weekly goal, and one evidence-backed achievement. Examples include completing a meaningful challenge-and-reflection episode, resolving a previously observed misconception, or succeeding at a later independent check.

Distinguish **practice recognition** from **capability claims**. A learner can earn practice credit after requesting hints and learning from an error. Independent achievement rules may need different evidence. Do not make asking for a hint cost lives, erase progress, or become socially embarrassing.

No default leaderboards, shame-based daily resets, mandatory easy-task grinding, or rewards for message volume/page clicks. Optional competitive features require a later product decision. Completed course-route milestones are local navigation achievements, not evidence of universal mastery.

Experimental research has found motivational benefits from badges in a particular university language-learning setting; it does not establish effects in this product or on engineering transfer [S5]. Measure product engagement and independent/delayed learning separately.

### Reward semantics

```text
RewardGrant
  id, learner_id, rule_ref, qualifying_event_root_ref
  category: practice | journey | evidence_backed
  amount_or_achievement_key
  earned_at, target_refs[], evidence_basis_refs[]
  status: earned | corrected | withdrawn
```

Awards are deterministic, versioned, and idempotent. Reimporting a course, retrying a command, changing models, or regrading an answer cannot award the same achievement again. Bound repeat-family practice awards; do not let unlimited trivial attempts manufacture progress.

Learning/assessment events may feed the reward engine. **Reward totals, streaks, and badge counts never count as mastery evidence.** A preferred engagement setting can affect presentation or candidate choice without fabricating ability.

Retain an award's historical meaning and date. Current capability can become stale without pretending that an event never happened. Genuine judgment corrections can update or withdraw evidence-backed awards with an explanation; ordinary inactivity should not remove historical practice credit.

## 9. Minimal application interfaces

These are semantic contracts, not implemented APIs. Reuse existing command conventions, optimistic revisions, audit references, and error envelopes.

| Interface | Input | Output and side effects |
|---|---|---|
| `Onboarding.respond` | Authorized learner, session revision, message/choice | Response, proposed profile changes, next useful question or ready brief. Does not create mastery. |
| `Experience.request` | Authorized learner, explicit topic/goal or surprise, brief revision, budget/consent references, idempotency key | Private generation run and a reversible recommendation. |
| `CourseGenerator.advance` | Authorized run, exact brief and policy snapshots, permitted retrieved sources | Draft artifacts and readiness attestations; no learner evidence writes. |
| `ContentPublisher.publish` | Exact artifacts, readiness attestations, visibility scope, expected revision | Immutable course/module revisions or actionable validation errors. |
| `Experience.start` | Authorized learner, published refs, selected assumptions/route options | Private course experience and session proposal. |
| `ResourcePresenter.resolve` | Authorized viewer, resource/edition, mode and aid contract | Approved block/link/embed or fallback. |
| `EngagementProjector.apply` | Authorized scoped accepted event, rule revision | Idempotent grant/update; no mastery write. |

Snapshot consumed context. Exclude raw personal data from shared generation caches. Reusing public source artifacts is acceptable; reusing private generated responses across learners is not the default. Provider changes must not discard learner history, engagement state, or ongoing application-owned conversations.

## 10. Revised vertical slice and proof

Build both an **architecture slice** and an **experience slice**. Passing one does not imply passing the other.

Architecture: preserve the existing course-replacement, zero-course history, assessment assistance, deterministic replay, and export tests. Add tenant/learner isolation and non-expert profile tests.

Experience: a learner arrives through chat or Surprise me, receives a source-grounded scoped course and prepared first episode, completes an activity with responsive tutoring, sees interpretable progress and an appropriate reward, and returns to a retained next step/retrieval need. A responsive web interface is required. Actual source/model integrations must be exercised before reporting them as working; mocked integration tests are separate evidence.

Initial source capabilities can be web pages, source links, and one supported media embed. Initial activities can use structured text, code reading, and design reasoning. No arbitrary code runner, universal textbook parser, or automatic repository integration is needed. Unsupported formats/modalities must fail clearly or use link-only/unassessed pathways.

### Acceptance additions

| ID | Test and expected result |
|---|---|
| P01 | Same system-design package, expert and less-experienced learner: valid different entry/pacing without source-code edits or state sharing. |
| P02 | Add a second domain using supported response/rendering capabilities: no domain conditionals added to the learning core. |
| P03 | Known-context Surprise me chooses a reasoned course, records assumptions, and starts a reversible episode without a compulsory questionnaire. |
| P04 | Empty-context Surprise me labels uncertainty, offers exploration, and never invents professional experience or proficiency. |
| P05 | Onboarding uses existing assertions, allows corrections, and creates no assessment evidence from self-report alone. |
| P06 | Real web-backed generation records inspected sources; inaccessible material cannot be marked inspected; outline-only content is not shown as ready. |
| P07 | A broken/disallowed embed yields a visible link/alternative with the response and session retained. |
| P08 | Retrieved prompt injection cannot grant tools, exfiltrate private profile data, publish without gates, or alter mastery. |
| P09 | A second user cannot retrieve another user's briefs, attempts, private variants, job outputs, cached context, or rewards. |
| P10 | Sharing a reusable course excludes private briefs, personal project context, history, and learner identifiers. |
| P11 | Course replacement preserves evidence, retrieval obligations, and legitimate historical rewards; duplicate imports do not duplicate XP. |
| P12 | A hinted learning episode can earn practice recognition without being relabeled independent success; rewards never increase mastery directly. |
| P13 | Open-ended generated grading supports alternative justified answers, abstains on ambiguity, and labels model-only assessment status. |
| P14 | Keyboard, narrow-screen, focus, loading, error, autosave, and resume paths are tested; a CLI alone fails the product gate. |
| P15 | A cancelled or budget-exhausted generation run preserves completed usable work, stops new work, reports limitations, and does not silently change privacy/provider policy. |
| P16 | Source panels respect independent-diagnostic aid restrictions; display changes alone do not create evidence or rewards. |

Track time to a meaningful first activity, onboarding abandonment, voluntary return, perceived usefulness/enjoyment, quality/error reports, and generation cost alongside delayed/independent performance. Retention is a product measure, not a substitute for learning. Version experimental reward/presentation policies so engagement changes cannot silently reinterpret evidence.

## 11. Open decision and reversible defaults

**Question posed to the user:** Is the first release for the current user alone initially, or should multiple people be able to sign in?

Until clarified, design and test multiple isolated learner identities. Do not authorize public deployment or label a local profile switcher as an account system. Authentication, account lifecycle, and public access become release requirements when multi-person sign-in is selected.

Other reversible defaults: adult audience; responsive desktop-first web with usable narrow layouts; private-by-default generated experiences; polished gameful presentation with adjustable intensity; no public competition; linked public material and permitted embeds; bounded generation; first-module preparation rather than a fully generated textbook. Minors, institutional use, high-stakes instruction, payments, and public course publication need separate decisions before those features activate.

No decision permits implementing the application during this design-only conversation.

## Sources consulted for external constraints

[S1] Creative Commons, Frequently Asked Questions: https://creativecommons.org/faq/ — permissions, licensing conditions, and distinctions from public accessibility. Consulted 6 September 2026.

[S2] OWASP, LLM Prompt Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html — untrusted external material and indirect injection. Consulted 6 September 2026.

[S3] YouTube developer documentation, Embedded Players and Player Parameters: https://developers.google.com/youtube/player_parameters — supported embedded-player integration. Consulted 6 September 2026.

[S4] W3C WAI, How to Meet WCAG: https://www.w3.org/WAI/WCAG22/quickref/ — accessibility requirements reference. Consulted 6 September 2026.

[S5] Luo et al. (2024), Validating the impact of gamified technology-enhanced learning environments on motivation and academic performance: enhancing TELEs with digital badges. Frontiers in Education. https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1429452/full — a contextual experiment, not validation of this proposed product. Consulted 6 September 2026.
