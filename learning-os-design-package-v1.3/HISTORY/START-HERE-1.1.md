# Learning OS design package 1.1 — start here

This is a design handoff, not an implemented application.

## Reading order and precedence

1. PRODUCT-AMENDMENT-1.1.md: the user's clarified product direction and revised release gates. It overrides conflicting requirements in revision 1.0.
2. learning-os-design/ARCHITECTURE.md and contracts/INTERFACES.md: the retained baseline architecture and semantic contracts.
3. learning-os-design/acceptance/ACCEPTANCE.md plus amendment acceptance tests P01–P16.
4. The original schemas and examples: baseline fixtures that must be extended for the amendment.

The original bundle's files are retained byte-for-byte. Its validation report covers only the earlier baseline checks; it does not establish any new UI, multi-user, onboarding, generation, reward, or runtime behavior. New contracts are design-level descriptions, not an updated machine-readable schema. The coding agent must reconcile these descriptions into implementation contracts and tests.

No application implementation is authorized by this clarification. The deployment question—single initial learner or multiple people signing in—is open. The design requires isolated learner identities and tests either way; public deployment needs proper authentication and authorization.

BUNDLE-CHECKSUMS.txt covers every included file except itself. It is a packaging integrity record, not a runtime test report.
