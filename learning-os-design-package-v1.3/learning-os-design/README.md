# Personal Learning OS — architecture handoff

**Design revision:** 1.0 — 6 September 2026  
**Status:** Architecture and product design only. No application, database migration, provider integration, or learning-engine implementation has been created or run.

## Reading order

1. `ARCHITECTURE.md`: normative product decisions, boundaries, algorithms, transactions, lifecycle rules, and implementation sequence.
2. `contracts/contracts.schema.json`: JSON Schema definitions for the most important interchange and learning records. This is a design contract, not a server implementation.
3. `contracts/INTERFACES.md`: application commands, pure domain ports, validation rules, errors, and database constraints.
4. `examples/`: synthetic registry/content records and two different course routes. Nothing here is evidence about the actual learner.
5. `acceptance/ACCEPTANCE.md`: behavioral acceptance scenarios for a coding agent to automate.
6. `SOURCES.md`: primary-source research used to inform, but not empirically validate, the proposed design.
7. `VALIDATION.md`: checks actually performed on the documentation and contract examples; distinguish these from unimplemented application tests.

## Most important rule

Course removal must not change the active learning evidence, its interpretation, or an existing competency-scoped retrieval obligation. The availability and choice of future content may change. A history snapshot is retained evidence, not an installed course.

## Authority and scope

The user's current instruction is **do not implement yet**. The quoted future instructions to implement do not override it. The next coding agent should implement only when subsequently authorized.

No project repository was mounted in the inspected environment. `/mnt/data` was empty before this package was written; checked workspace locations did not expose a Git repository or project manifest. This is not a review of a remote or otherwise inaccessible repository.

The learner reports **6+ years of engineering experience, including approximately 2 years working independently, including agent work**. Experience and preferences are self-reported context, not verified mastery.

Normative order: ARCHITECTURE decisions and INTERFACES semantic invariants constrain all examples. JSON Schema validates structure, not truth, safety, referential integrity, rubric validity, or educational efficacy. Examples deliberately include draft, unvalidated assessment content. They must not silently be promoted to production-approved assessments.

## First implementation target

A modular monolith; one relational database; a CLI or thin UI; reviewed static activities; recorded attempts; explicit judgments; rebuildable competency evidence; a deterministic planner and retrieval scheduler. No automatic repository execution, universal course generator, vector database requirement, multi-agent runtime, or trained knowledge-tracing model is required.
