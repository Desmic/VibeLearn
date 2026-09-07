# Learning OS — guidance to merge into the repository's AGENTS.md

This is a template, not permission to overwrite existing instructions or begin implementation. First inspect the repository and honor its applicable instructions. Resolve actual run/test commands during Phase 0; do not substitute plausible commands or report unrun checks as passed.

Read the design package's `START-HERE.md` and the current phase in `CODEX-IMPLEMENTATION-PLAN.md`. That plan supersedes historical milestone sequences. Read only the additional contracts relevant to the current task. Use the package examples as synthetic fixtures, not validated course content or evidence about a real user.

## Work in small verified increments

Implement one user-visible behavior with explicit acceptance criteria and excluded scope. Integrate it with the real persistence and interface path before expanding. Keep one active risky shared-contract change at a time. Probe real external capabilities before building broad dependencies around them. Mocks and recorded fixtures are useful but are not proof that a live integration works.

Before editing, inspect the actual source, working tree, schema, running UI/config versions where relevant, and tests. Preserve unrelated work. A chat summary, code index, or Git HEAD does not establish deployed state.

After editing, run focused checks and the persistent boundary suite; exercise actual browser interactions for UI changes. Inspect errors and correct them. Run the full implemented suite at phase/release gates and after critical shared-contract changes. Do not disable tests, weaken gates, blanket-approve baselines, fabricate logs, or bury a regression to advance a milestone.

## Keep the product boundaries

Learner evidence and retrieval survive course deletion/replacement. Published assessment context is immutable. Learner/site/course names do not appear as special cases in core learning logic. Source suggestions are versioned course-brief data, not import permission or automatic authority. Reward state, self-report, and agent-generated judgments do not silently establish independent mastery.

Personal UI/content changes do not authorize shared code release or private-data access. The candidate builder cannot grant itself production credentials or verifier/release authority. A worktree is not a sandbox. Keep the last accepted experience available. Undoing a course/UI change must preserve real learner work and exposure.

## Define completion honestly

Report exact commands, environments, versions, outcomes, artifacts, limitations, and migration/rollback effects. Keep machine verification, real user feedback, and active served state separate. Synthetic acceptance is not human feedback; silence is not approval. Await relevant feedback before compounding a disputed product choice, while allowing independent reversible work.

Update a short current-task/state record after each integrated increment with the next bounded task. If a design assumption fails, save a regression case, amend the decision, repair the smallest affected boundary, and reverify before dependent expansion. Ask only when an ambiguity is consequential and not resolvable from the permitted current context.
