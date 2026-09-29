# Story, play and learning: core-design review

**Subsequent user sequencing clarification — 28 September:** Finish world/art and
engaging play first, then move to deeper learning work. The request for this audit
was an important interruption, not authorization to switch away from the active
world/art milestone. Priority-switch recommendations below are superseded; the
research, diagnosis and draft storyboard remain useful for the following stage.
Preserve existing learning integrity while completing the world experience.


28 September 2026. Requested by the user after the opening graphics/access pass.
This is a research-backed design audit and proposed next checkpoint, not a new
approved learning design or a claim of learner efficacy. Root Astra owns synthesis;
Sol audited implementation and evidence paths without playing or modifying them.

## Judgment

We have useful foundations, but have not demonstrated an excellent combined game
and learning experience. The recent work improves a small prologue. The exact v8
design review approves **only `opening`, at prototype stage** (`design/review.json`).
It does not approve the tutorial/Level 1 teaching sequence or certify its runtime.
The full learning promise is deliberately narrow: growing generation input and
relevant, source-supported context. Calling this a complete course in AI internals
would be inaccurate.

The problem is not an absence of pedagogical documents. `GAME-AS-COURSE.md` already
requires outcome → mechanic → decision → feedback → practice → transfer;
`GAME-OPENING-PROGRESSION.md` already requires a storyboard; the operational
architecture's stages 2–5 put learning, game design, topology and greybox before
art production. Those principles have not yet been demonstrated together across
the actual first chapter. Root has spent too much recent iteration on local
opening composition and presentation, relative to resolving this core uncertainty.
Completing real access repairs is necessary, but another visual iteration is not
the highest-value next proof.

Keep the accepted far-future graphic techno-fantasy direction, direct protagonist,
opening causal structure and separate tutorial. The initial recommendation to pause world/art work for the tutorial/Level 1
learning loop is superseded by the user clarification above. Complete the active
world/art/engagement milestone first, then return to that teaching-loop review.
This does not authorize Level 2 implementation or promote the current candidate.

## What is present, and what remains unproven

| Area | Current evidence | Judgment / missing proof |
| --- | --- | --- |
| Story | A shared signal, partner response, interrupted destination, separation, prison and visible voice theft. Current opening implementation in `web/first-words-world.js`; older rescue treatments are partly historical. | Understandable causal intent, but attachment, character specificity and satisfying chapter payoff still need actual cold observation. An invitation to a distant unwalkable place is not exploration. |
| Tutorial | Guided connect/scan/generate/speak loop, separate from movement/camera practice (`web/first-words-world.js:419`; design `sequence-demo`). | A clean supported demonstration is appropriate. Following its instructions does not establish independent understanding. |
| Level 1 | Inspect/stage/commit a sign; predict growing input; infer which gate the supplied source supports; run the prepared output and test the world (`web/first-words.js:254`, `:465`). | Source selection, source support and task success are separated. But the fixed example may reward label/position/recency habits or following the sequence. Need observable reasoning and bypass probes. |
| Changed case | Mira/Tavi notes; location inference; original input vs latest word vs complete generated history (`app/first_words.py:420`). | A useful near-transfer attempt, not broad generalization. One changed case with known prior practice and unknown relay assistance cannot support mastery. |
| Evidence integrity | First decisions retained across retries; immutable moves; completion and transfer observations separate; `mastery: unknown` (`app/first_words.py:163`, `:409`; `app/service.py:238`). | Preserve these strengths. Better storytelling must not weaken evidence or rewrite old saves. |
| System checks | Validator requires introduced/practiced/transferred outcomes but explicitly returns quality/alignment unassessed (`tools/check_learning_design.py:42`, `:129`). | Field presence is not valid teaching. Missing explicit step → runtime decision → evidence-field traceability and proof that answers are not exposed early. |
| Long-term learning | Follow-up state can request fresh activity (`app/assessment.py:92`). | No demonstrated delayed-retention activity or novice learning study. Do not equate AI reviewer competence with novice learning. |

## Research that changes decisions

Sources accessed 28 September. Research results, practitioner techniques and our
adaptations have different evidential weight. No study below proves this game works.

| Source and locator | Supported finding / limitation | Our design decision and falsification probe |
| --- | --- | --- |
| [Habgood & Ainsworth, 2011, *Motivating Children to Learn Effectively*](https://shura.shu.ac.uk/3556/1/Habgood_Ainsworth_final.pdf), abstract and discussion pp. 28–34 of manuscript | Their mathematics game studies compared learning inside the core mechanic with separate questions between play. Results favored intrinsic integration in that setting. Samples were children and one specific game, not adult AI learners. | Make understanding the machine necessary to solve the rescue problem. Remove the learning reasoning in a counterfactual playthrough: if identical decisions and rewards remain, integration is weak. Moving a quiz onto a machine is insufficient. |
| [Mislevy, Almond & Lukas, 2003, *A Brief Introduction to Evidence-Centered Design*](https://onlinelibrary.wiley.com/doi/10.1002/j.2333-8504.2003.tb01908.x), abstract / conceptual assessment framework | Assessment is an argument from observed performance to an otherwise unobserved capability. It does not automatically validate a score or task. | For each claim, name observable evidence and competing explanations: guessing, exposed answers, remembered position, hints or motor skill. Require an unseen decision before feedback; retain uncertainty when the evidence cannot distinguish them. |
| [Mayer & Moreno, 2003, *Nine Ways to Reduce Cognitive Load in Multimedia Learning*](https://carpentries.github.io/instructor-training/files/papers/mayer-reduce-cognitive-load-2003.pdf), introduction and overload strategies | The paper addresses limited processing capacity and evaluates instructional treatments using transfer problems. Segmentation, pretraining and reducing incidental processing are relevant; it does not prescribe a 3D HUD or our percentage budgets. | Teach controls before conceptual decisions; keep request, source and generated history together when comparing them. Remove decorative motion during demanding inspection. Probe whether the player can explain a change without remembering text from a vanished view. |
| [Karpicke & Roediger, 2008, *The Critical Importance of Retrieval for Learning*](https://learninglab.psych.purdue.edu/downloads/2008/2008_Karpicke_Roediger_Science.pdf), abstract / experiment | Repeated retrieval improved delayed vocabulary recall in the studied conditions; learners' predictions did not track their later performance. This is not a trial of conceptual learning in games. | Include a later fresh application and distinguish confidence, immediate success and retention. A retry of the same revealed answer earns recovery evidence, not an independent first attempt. Delayed learning remains unknown until a later session is observed. |
| [Kelsey Beachum, GDC 2021, *Sparking Curiosity-Driven Exploration Through Narrative in Outer Wilds*](https://gdcvault.com/play/1027008/Independent-Games-Summit-Sparking-Curiosity), official session overview; [author's talk listing](https://kelseybeachum.com/projects) | The practitioner describes narrative serving curiosity and player-directed exploration. This audit inspected the official overview and indexed slide excerpt, not the full talk/video; it is design inspiration, not learning-effect evidence. | A discovery should answer one question and create an actionable next question. Keep accessible immediate goals for beginners rather than importing total nonlinearity. Ask what players wanted to investigate, not merely whether they found the required button. |
| [Cho et al., 2024, *Transformer Explainer*, v1](https://arxiv.org/html/2408.04619v1), §§2–3 | A live GPT-2 visualization supports custom input, progressive detail and parameter experimentation. This version explicitly lists user efficacy studies as future work. | Borrow inspectable cause/effect and progressive abstraction, not a claim of proven learning. Reuse/inspect existing educational implementations before inventing an attention visualizer. Do not add browser inference or a large model download to the current game solely for authenticity. |

Technical fidelity reference: [Vaswani et al., *Attention Is All You Need*, §3](https://arxiv.org/html/1706.03762v7)
explicitly describes autoregressive generation consuming previously generated
symbols, and separate learned attention/feed-forward machinery. It supports the
narrow growing-input model, not treating the authored word toy as an implementation
of a modern LLM or treating every architecture as the original encoder–decoder.

Reuse the existing ten-game study rather than repeating it: its
[Portal 2 section](../GAME-REFERENCE-STUDY.md#6-portal-2-design-for-understanding-not-passive-success)
records the previously read developer-commentary passage about a lesson players
could pass by waiting. Its Hades section records retry as continuing relationship.
These are prior research records, not newly watched videos in this audit. Apply
those concrete probes to our first-choice and recovery design before collecting
more inspirational titles.

The Sky Reach play study provides a separate **game-experience** lesson: the world
supports verbs with actual spatial consequences and scale transitions. It supplies
no evidence of learning efficacy. Procedural geography can vary future worlds;
the concept dependencies, valid tasks and assessment boundaries need deliberate
design. Generate variation inside those constraints, not random pedagogy.

## What the first chapter should and should not teach

Keep two primary outcomes for this first proof. A beginner should be able to:

1. Reconstruct the next generation input from the original supplied material and
   **all** pieces generated so far; diagnose an omitted earlier piece on a new case.
2. Select relevant supplied information, distinguish what that source supports
   from what the task needs, and explain why a fluent command can still fail.

Tutorial completion means the player can operate the controls and has seen a
successful guided example. Level 1 should require decisions with support reduced,
then change the purpose/content of the problem before its payoff. It should not
promise training, embeddings, attention or comprehensive LLM understanding.

The broader AI-internals curriculum needs a dependency map, not an arbitrary list
of themed rooms. Proposed future sequence for review: generation/input boundary →
tokenization and probability/sampling → training versus inference → learned
representations and contextual attention → instruction tuning and retrieved/tool
information → reliability/evaluation. This is a curriculum hypothesis, not a fixed
level order, permission to build later levels, or a claim that every model has the
same architecture. Preserve a high-level end-to-end model, then reveal mechanisms
as a question requires them. Do not teach every abstraction simultaneously.

### Fidelity and metaphor checks

- A real model does **not** know only the text in the supplied notes: learned
  parameters also influence its output. Our task asks what a specific source
  supports and distinguishes the player's outside observations from supplied input.
- The toy's whole words and prepared continuations illustrate a loop. They are not
  a tokenizer, a neural-network computation or a universal deterministic response.
  The introductory boundary should be visible when the mechanism is taught, not
  hidden solely in optional documentation.
- Text generation, spoken sound and robot personhood are different things.
  Recovering a command machine does not imply restoring Zip's natural voice or
  prove that real models have intentions/consciousness.
- The door validates an authored command. It does not certify a language model's
  general truthfulness. A source-supported old instruction can still fail the
  current task; newest information need not be relevant or reliable.
- Later attention lessons must avoid treating attention weights as a complete
  explanation. Later temperature lessons must avoid presenting a creativity or
  truth dial. Source those mechanisms when their teaching prototypes are designed.

## Story improvement: give the learning a dramatic job

The rescue premise is usable; another wholesale premise change is unnecessary.
The current risk is a beautiful beginning followed by operating instructions.
Mira needs to be a specific partner whose behavior changes the situation, not a
name added to success text. Zip needs opportunities to investigate and decide;
the Warden needs legible intent or a deliberately framed mystery, not an unexplained
sequence of effects. We should not resolve every mystery before giving control.

Proposed chapter spine: a shared future plan in Bellweather is interrupted; Zip
regains a limited means of communicating, uses it to navigate conflicting evidence,
then makes actual contact with Mira. The reply should carry a recognizable callback
to their shared action and reveal that Mira is doing something to help too. That
gives this chapter its own emotional consequence without falsely claiming a rescue
or implementing the next level. Exact acting/dialogue remains a design candidate.

Match the young-adult/adult aspiration with curiosity, warmth and specificity.
Simple language and approachable robots need not mean infantile stakes or constant
praise. Let the player experience competence through a changed world and a partner's
response. Keep humor in character behavior, not lengthy tutorials.

## Yes: an integrated storyboard, plus a playable learning prototype

A cinematic storyboard alone is insufficient. Extend the existing storyboard into
an **experience board** covering story, player reasoning and evidence together.
This is a small authoring artifact under the current design gate, not another
agent topology, engine, schema hierarchy or source of learner truth.

Each beat needs: before-state/frame; player desire/question; available verbs;
information available before commitment; concept/prerequisite; decision; world
consequence; mistaken path/recovery; what support fades; evidence/assistance;
takeaway and a cold-player probe. A rough shot sketch helps composition, but only
a greybox can test timing, agency and reasoning.

Draft chapter board below preserves the current causal structure. It is a
proposal for review, not newly approved implementation:

| Beat | Frame / story question | Player reasoning and action | Consequence / proof |
| --- | --- | --- | --- |
| Shared signal | Zip and Mira act across the same sightline; the selected destination answers. Why might I want to go there? | Explore or use the equivalent semantic action; notice the partner's contribution and inspect the destination. | A distinct invitation; no learning credit. Cold account must identify Zip, partner contribution and wanted place without being told the intended meaning. |
| Rupture and loss | Preserve visual continuity from home to confinement; intact module precedes theft. What happened, and what still works? | Observe; skip/replay remain safe. Direct control arrives with one local repair opportunity. | Loss is comprehensible in muted/static states. No invented conceptual test during an emotional beat. |
| First repair | Lock, scanner and machine form one readable workspace. Can I make anything happen? | Learn local interaction grammar, supply the obvious lock identifier, step through a complete successful command. | Door responds; the input history visibly grows. Guided success, not mastery. No simultaneous camera challenge or surprise quiz. |
| An incomplete picture | Neutral route evidence and conflicting signs. What has this machine actually received? | Inspect freely, stage/cancel, then commit a relevant source; distinguish observing a sign from supplying it. | Input changes only on commitment. The selected source stays visible; no answer highlight precedes the reasoning decision. |
| Make the next step work | Original request, supplied source and generated piece share one focus. What belongs in the next input? | Predict or assemble the complete next-input bundle, then judge what the source supports. An assistance path remains available. | Reveal the actual next input only afterward. A mistaken attempt produces a causal diagnosis and recoverable world response, not just a red cross. |
| Contact someone, not another lock | Receiver offers a new purpose and different message history. Where is Mira, and what supports that belief? | Apply both ideas with reduced support; compare a relevant note with stale and irrelevant evidence, retaining an unsupported/unknown option. | First choices and assistance remain separate from repaired success. Counterbalance superficial cues in a fresh fixture; one case remains bounded evidence. |
| Earned reply | The receiver answers; the world visibly changes in a way the player caused. Was the effort worth it? | Inspect Mira's reply/callback and choose when to leave the moment. | Contact and renewed agency are this chapter's payoff. No claim of reunion, natural voice restoration or mastery. Stop at the existing user checkpoint. |

Before approving a visual version, conduct two cheap counterfactuals: remove
assessment widgets and ask whether the verbs still require the target reasoning;
replace art with simple forms and ask whether the decisions/consequences remain
interesting. These are design probes, not requirements to ship ugly or test-free
content. Strong art should deepen an already coherent activity.

## System improvements and next order of work

1. Finish/record the bounded access verification already running. Freeze its
   artifacts; do not call its success story or learning approval.
2. Create the complete chapter experience board and a concise dependency/evidence
   map within the current learning design. Resolve the narrative payoff and
   information timing before revising gameplay. Review the exact revised design
   through the existing gate; v8 opening approval must not silently cover it.
3. Add explicit traceability for each assessed decision: design step/outcome,
   runtime action/version, first-choice field, assistance field, feedback exposure,
   evaluator and new-case fixture. Reuse the existing immutable evidence pipeline.
   A source review checks meaning; a test checks identity/order/invariants; neither
   alone proves learning. Only add validator fields after this concrete map shows
   what cannot be checked with existing contracts.
4. Prototype the weakest coherent teaching loop with existing PlayCanvas objects
   and controls. Use one fresh Astra reviewer across all lanes; preserve cold
   observations before intent. Test mistaken reasoning and shortcut solutions, not
   just a correct walkthrough. Existing browser-access rules still apply.
5. Separate three outcomes in the report: functional reliability; observed game
   appeal/comprehension; evidence of learner understanding. No average can erase a
   blocker. A technically valid beautiful opening cannot stand in for the chapter.
6. Plan a small formative study with actual target beginners: prior knowledge,
   unaided play, explanation/changed case after play, and a later fresh revisit.
   A small convenience sample diagnoses confusion, not a statistical efficacy
   claim. Recruitment, dates and numbers are not arranged by this document.
   To claim superiority over another learning method later, use a suitable
   comparison and evaluation design. AI critics cannot provide that result.

### Initial traceability map from current code (not a new approval)

| Design step | Current runtime / retained observation | Required interpretation / next probe |
| --- | --- | --- |
| `context-contrast` | First committed `scan-*`; `transfer_observations.context_choice` and `relevant_context` | Inspect/stage must not overwrite the first committed source. Relevance is not identical to whether an inference matches that source. |
| `sequence-practice` | First loop prediction; `transfer_observations.loop_correct` | Needs a fresh case with a missing earlier generated piece; no answer highlight before commitment. A correct binary choice alone is weak evidence of explanation. |
| `context-practice` | First `infer-*`; `source_inference`, `source_support`, `inference_matches_source` | Evaluate against the selected source, separately from the prepared continuation and the gate's world validation. |
| `changed-problem` | First `relay-context-*`, `relay-infer-*`, `relay-input-*`; `relay_transfer_observations`; feedback begins at `relay-run` | Preserve first choices and `prior_guided_practice`. `assistance: unknown` remains unknown; do not label this independent mastery. |
| `consequence` | Completed authoritative replay and chapter completion row | Contact with Mira is story success. It must not replace or upgrade the separate observations above. |

This map is a starting audit of `app/first_words.py`, not a new event schema.
Future revisions must retain old version evaluators and immutable evidence.

Technical testing should include unrevealed first commitments, immutable retries,
hint attribution, independent source/inference/output checks, equivalent keyboard
and touch evidence, accessibility of the complete input, and varied superficial
layouts. A learner failing a knowledge probe must not lose story progress or have
old evidence silently relabeled. Missing observations stay unknown.

Reuse opportunities: existing semantic game rules, first-choice evaluators,
checkpoints, Harbor contract fixture, presentation checker and critic intake.
Use published teaching tools as mechanism references when relevant; inspect their
licenses and suitability before adoption. Do not build a curriculum generator,
novice simulator, custom neural engine or additional reviewer fleet to avoid
proving this one chapter.

Open decisions: exact depth of the eventual AI-internals course; amount of optional
technical inspection; the preferred character tone. For this next proof assume
beginner young adults/adults, two narrow outcomes, optional depth, and no new level.
These assumptions are visible here and do not change the user's product vision.
