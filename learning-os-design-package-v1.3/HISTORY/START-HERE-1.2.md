# Learning OS — design package 1.2

**6 September 2026 · Architecture and product design only**

## Read these first

1. `COLLABORATIVE-EVOLUTION-1.2.md`: the conversational feedback/change/verification/user-acceptance loop; state-aware code and UI context; scoped changes; course expansion; safety; release and rollback.
2. `collaboration/CHANGE-CONTRACTS.md`: concrete records, ports, readiness/completion predicates, authority, transactions, and errors.
3. `collaboration/COLLABORATIVE-ACCEPTANCE.md`: 36 unexecuted scenarios and three real-world demonstration requirements.
4. `PRODUCT-AMENDMENT-1.1.md`: reusable learner/course product, onboarding, Surprise me, source-grounded generation, UI and gamification.
5. `learning-os-design/ARCHITECTURE.md` and `learning-os-design/contracts/INTERFACES.md`: baseline learning/evidence/assessment/identity invariants, with priorities overridden where necessary by 1.1/1.2.
6. `learning-os-design/examples/` and `learning-os-design/acceptance/ACCEPTANCE.md`: synthetic baseline fixtures and acceptance scenarios.

Normative precedence: 1.2, then 1.1, then baseline 1.0. Historical README and validation reports describe their own revisions.

## Changes in 1.2

The product must accept UI/UX and course feedback, inspect actual relevant code/rendered state, construct a suitable change, verify it, let the learner try it, and obtain explicit acceptance. Supported settings/content changes take a lightweight path. Genuine new capabilities take a real isolated code-build-test-preview-release path; a settings chatbot alone does not fulfill this requirement. Scope, machine verification, user acceptance, and release/activation status remain separate.

The chosen initial visual direction is a balanced hybrid: a polished workspace with gameful progression, iterated from real feedback. Personal requests do not silently change other users' experience. Shared code release defaults to product-owner authority. Local single-owner development remains the default pending the previously unresolved deployment decision; this document does not authorize public hosting.

## Implementation status

No application, database, UI, live model integration, browser workflow, code-generation runner, verification suite, deployment, or user acceptance session was implemented or run for this amendment. New contracts are language-neutral design specifications. The original machine-readable JSON Schemas remain revision 1.0 and still need extension for 1.1/1.2. Do not claim old example validation establishes the new product's behavior.

`DOCUMENT-CHECKS-1.2.md` records only the document/archive checks actually performed. `BUNDLE-CHECKSUMS.txt` describes this bundle. `HISTORY/` preserves superseded 1.1 bundle guidance; its checksums refer to the original 1.1 archive layout, not the new root.

Current authorization remains design only. A coding agent should implement only after subsequent authorization.
