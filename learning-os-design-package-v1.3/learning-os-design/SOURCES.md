# Research and standards register

Accessed/reviewed for this design on 6 September 2026. These sources inform specific choices; none validates the entire proposed personal learning system or its numerical policy defaults. Only primary research, original specifications, and first-party engineering material are used here. Source candidate metadata is not equivalent to retained source bytes or claim-level answer-key verification.

## R1 — Competency identity and change management

1EdTech, *Competencies and Academic Standards Exchange (CASE) v1.1 Best Practice and Implementation Guide*, section 4.3, Competency Change Management.

`https://www.imsglobal.org/spec/CASE/v1p1/impl`

Used for persistent competency identifiers, deprecation, and the distinction between editorial and substantive changes. The internal contract is not asserted to be CASE-conformant. No full external ontology is required in v1.

## R2 — Immutable learning statements and correction

ADL, *xAPI Specification: Experience API Data*, statement lifecycle, immutability, and voiding.

`https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md`

Used as precedent for preserving occurrence history and separately invalidating an interpretation. xAPI activity definitions can have different mutability treatment; this design therefore requires additional pinned interpretation snapshots. No xAPI implementation or standards-conformance claim is made.

## R3 — Model-based judgment limitations

Zheng et al. (2023), *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, arXiv:2306.05685.

`https://arxiv.org/html/2306.05685v4`

Used for concerns about position, verbosity, and self-enhancement bias. Its model-preference evaluation results do not establish educational grading accuracy. No numerical agreement result is used to set assessor reliability in this design.

## R4 — Retrieval practice

Karpicke and Blunt (2011), *Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping*, Science, DOI 10.1126/science.1199327.

`https://pubmed.ncbi.nlm.nih.gov/21252317/`

Used to motivate active retrieval and delayed outcome measurement. Does not establish the proposed 1/3/7/14/30/60-day schedule or engineering transfer effectiveness. The design intervals and thresholds are explicitly provisional policy choices.

## R5 — Provenance model

W3C (2013), *PROV-DM: The PROV Data Model*.

`https://www.w3.org/TR/prov-dm/`

Used for entities, activities, agents, and derivation lineage. A relational representation is sufficient; RDF and a graph service are not required.

## R6 — Feeling versus measured learning

Deslauriers et al. (2019), *Measuring actual learning versus feeling of learning in response to being actively engaged in the classroom*, PNAS, DOI 10.1073/pnas.1821936116.

`https://www.pnas.org/doi/10.1073/pnas.1821936116`

`https://pmc.ncbi.nlm.nih.gov/articles/PMC6765278/`

Used for separating subjective experience from measured outcomes. The original classroom context does not directly establish effectiveness for an experienced engineer using an AI tutor. The publisher page was not fully accessible in the browsing environment; bibliographic/search records and the primary article's indexed description were available. No detailed numerical result is relied upon.

## R7 — Retry/idempotency source candidate

Amazon Builders’ Library, *Making retries safe with idempotent APIs*.

`https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/`

Used as an authoritative source candidate for the narrow initial curriculum, not as a blanket answer key. Course authoring must resolve relevant passages and check the applicability of assumptions before accepting assessment claims.

Related source candidate: Marc Brooker, *Exponential Backoff And Jitter*, AWS Architecture Blog, 4 March 2015, with later update.

`https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/`

## R8 — Transaction semantics

PostgreSQL documentation, *Transaction Isolation*, current documentation as accessed.

`https://www.postgresql.org/docs/current/transaction-iso.html`

Used as the first-party implementation reference for locking/isolation decisions. The design does not claim that its proposed transaction protocol has been implemented or tested. The future implementation must pin its actual database version.

## R9 — Lease/authority source candidate

Mike Burrows (2006), *The Chubby Lock Service for Loosely-Coupled Distributed Systems*, OSDI 2006, USENIX.

`https://www.usenix.org/conference/osdi-06/chubby-lock-service-loosely-coupled-distributed-systems`

The publication page/abstract was checked. This design does not claim a completed source-span analysis of the paper or a validated fencing answer key. The authoring reviewer should inspect the relevant full-paper sections before approving exercises based on it.
