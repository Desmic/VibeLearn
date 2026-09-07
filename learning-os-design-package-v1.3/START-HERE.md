# Learning OS — design package 1.3

**6 September 2026 · Architecture/product design and implementation handoff only**

## Start here

Read [CODEX-IMPLEMENTATION-PLAN.md](CODEX-IMPLEMENTATION-PLAN.md) for the single current build sequence and verification gates. Read [SOURCE-STEERING.md](SOURCE-STEERING.md) for learner-directed research, source-access distinctions, and fourteen acceptance cases. The learner may name sources during onboarding or course changes; preserve those preferences as explicit scoped data, not hidden chat context.

Use [handoff/AGENTS.template.md](handoff/AGENTS.template.md) as short guidance to merge with an actual repository's instructions, and [handoff/PHASE-REPORT.template.md](handoff/PHASE-REPORT.template.md) to record observed verification, real feedback, and current activation state. Do not blindly replace existing repository guidance or invent run commands.

## Precedence: no competing milestone lists

The 1.3 implementation plan supersedes all earlier build orders and definitions of the first release. The 1.3 source contract adds explicit selection semantics to the course brief/research pipeline. Other applicable decisions remain governed by 1.2, then 1.1, then baseline 1.0. Preserve stronger safety, privacy, evidence, and acceptance invariants; a later phase is not permission to postpone checks until after its risk appears.

The phase sequence is: baseline/capability probes; a usable persisted episode; early replacement/isolation/restore proof; conversational source-grounded generation; personal UI and course collaboration; one genuine verified code-generated component; then pilot consolidation. Each phase is split into small integrated increments, not implemented as one giant subsystem. No claimed live integration is complete through mocks alone.

This sequence tests meaningful UI/UX early rather than delivering only a CLI. It also tests learner/course decoupling before broad generation and tests real tool assumptions before many dependent consumers. User feedback is required at product checkpoints; no answer is not acceptance. Failed design assumptions should trigger bounded correction before dependent expansion.

## Supporting specifications: retrieve only what the current increment needs

| File | Purpose |
|---|---|
| [PRODUCT-AMENDMENT-1.1.md](PRODUCT-AMENDMENT-1.1.md) | Reuse across people/courses, onboarding, Surprise me, generated content, UI/gamification |
| [COLLABORATIVE-EVOLUTION-1.2.md](COLLABORATIVE-EVOLUTION-1.2.md) | Feedback/change/verification/review/activation loop and code/UI context |
| [collaboration/CHANGE-CONTRACTS.md](collaboration/CHANGE-CONTRACTS.md) | Candidate, context, check, review, and activation contracts |
| [collaboration/COLLABORATIVE-ACCEPTANCE.md](collaboration/COLLABORATIVE-ACCEPTANCE.md) | 36 collaboration scenarios and real demonstrations |
| [learning-os-design/ARCHITECTURE.md](learning-os-design/ARCHITECTURE.md) | Core ownership, competency/evidence, assessment, persistence, and retrieval |
| [learning-os-design/contracts/INTERFACES.md](learning-os-design/contracts/INTERFACES.md) | Baseline semantic interfaces and invariants |
| [learning-os-design/acceptance/ACCEPTANCE.md](learning-os-design/acceptance/ACCEPTANCE.md) | Core acceptance requirements |
| [learning-os-design/examples/INDEX.md](learning-os-design/examples/INDEX.md) | Synthetic course/content fixtures, not validated production assessments |

The baseline JSON Schemas remain revision 1.0. Extend the relevant schemas when an increment first consumes a new contract; do not claim old schema validation covers 1.1–1.3. Do not prebuild the complete future ontology/workflow model before the first episode.

## Current status and authorization

No application, database migration, frontend, runtime integration, course generator, code runner, sandbox, or application acceptance test was implemented or executed for this revision. Only handoff documents and archives were created and checked. [DOCUMENT-CHECKS-1.3.md](DOCUMENT-CHECKS-1.3.md) records those checks. `BUNDLE-CHECKSUMS.txt` describes the current archive; historical reports/checksums describe their original revisions and layouts.

The current conversation remains in design mode. A coding agent should begin application implementation only after authorization. Default deployment remains local single-owner development until the deployment decision is resolved; fixture learner switching is not production authentication. Real identity/security gates must precede any hosted multi-user exposure.
