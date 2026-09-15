# Inside the Word Machine — an ongoing How LLMs Work series

**Selected by the user's direction, 15 September 2026.** Teach AI, especially how LLMs work, as an appealing ongoing game series. This supersedes the provisional circuits choice. The series below is a concrete content/design plan; no new episode or live model integration is implemented by this change.

## The promise

**Build a little language machine, discover why it makes surprising mistakes, and learn to make it more useful.**

The player is a young inventor in a lively message workshop. A small delivery robot carries the messages the machine produces. Each episode changes what the player can see and control inside that same machine: first the next piece, then its vocabulary, training, context, and finally tools and evaluation. The mystery grows from “How did it choose that?” to “What would make it reliable?”

Use a warm, tactile science-fiction workshop: moving type pieces, visible input/output paths, expressive but restrained robot reactions, and a world that responds to what is sent. Aim for something a teen would willingly explore and a younger newcomer could follow. No unexplained guilds, fantasy terminology or lecture panels are needed to establish the premise. Appeal remains a design judgment until the current user reviews actual play.

## First season

Episodes are linked by the same workshop, companion and progressively revealed machine. Each needs a self-contained payoff and a small unanswered question. The durations below are **design targets**, not measured play times. Start with one short 5–8 minute episode; do not mass-produce the season before the opening works.

| Episode | Playable question and mechanic | Learning target | Fresh challenge / evidence |
|---|---|---|---|
| 1. The Missing Message | Operate a next-piece machine, add missing context, send a message and see where the robot goes | Autoregressive generation repeatedly chooses a next token conditioned on available context; a plausible continuation can be wrong | Diagnose a different incomplete message; predict what extra context changes and why |
| 2. Pieces, Not Words | Feed short messages through a visible tokenizer; reconstruct strings from pieces, including punctuation and word fragments | Tokens are vocabulary units, not necessarily whole words; token IDs represent text pieces | Segment/reconstruct a new string with the specified toy tokenizer, without claiming a universal segmentation |
| 3. Teaching the Machine | Curate a tiny dataset, run prediction -> error -> parameter update rounds, compare an unseen validation set | Training adjusts parameters from examples; memorizing training examples differs from generalizing | Improve held-out performance without leaking the answer into training; preserve the test split |
| 4. What Connects to What? | Probe a small representation map and investigate which features change a model's response | Learned numeric representations encode task-relevant relationships; a 2D map is only a projection | Compare a new pair/context and explain a model-relevant similarity without claiming human understanding |
| 5. The Clue Across the Room | Reveal attention connections from the next prediction back into a longer message; compare relevant and distracting context | Attention combines information from available positions; transformer layers transform representations | Resolve a new reference/dependency with a different clue position; explain what attention alone does not prove |
| 6. Several Plausible Futures | Branch one prompt into sampled continuations; change a controlled sampling setting and compare outcomes | A model assigns a distribution, not a truth label; decoding affects variation | Choose an appropriate strategy for a new creative vs exact task; explain why confidence is not correctness |
| 7. A Helpful Assistant | Compare a base completion model with an instruction-tuned toy; sort demonstrations/preferences and test a held-out instruction | Post-training can shape behavior; prompting/context does not ordinarily retrain weights | Distinguish a prompt change from a training update and find an instruction-following counterexample |
| 8. Beyond the Machine | Add a retrieved note or a calculator, inspect provenance, then run a small failure-focused test suite | Retrieval/tools provide external information/computation; fluent unsupported output remains possible | Solve a fresh source-backed task, identify a wrong/stale retrieval, and state what remains unverified |

Further seasons can explore data quality/bias, evaluation design, multimodal models, efficiency and agent workflows. These are roadmap ideas, not Phase 2 authorization or promises of shipped content. Revisit a previous idea at each episode opening with a new situation and faded help. Keep optional deeper math for interested learners; it must not obstruct the main world.

## Episode 1 — The Missing Message

### One-minute opening, one continuous scene

1. **Establish the place and role.** Start behind the player at an open workshop bench, with the delivery robot waiting beside a glowing message machine. Two nearby destinations and the outgoing path are visible. The first line is a goal, not lore: **“Help the robot deliver this message.”**
2. **Show the machine act.** A short input strip enters the machine. One output piece is selected, appended, and fed back before the next piece appears. The robot reads the destination. Do not jump straight from prompt to finished answer; make the repeated operation visible.
3. **Show the problem.** The robot heads to the wrong nearby door. A recipient at the other door waves with a short note. The camera keeps the source, robot and consequence readable. The machine's input lacked that destination clue; do not imply that it secretly saw the whole world.
4. **Give the player one useful verb.** The player brings the note to the input tray using one contextual action. The relevant short text joins the context; the next-piece candidates change. One cue: **“Give it the missing clue.”**
5. **Let the player test and choose to send.** The machine constructs a new message step by step; the robot reaches the intended door and returns with a visible thank-you. The player can rewind the machine and compare the two contexts. A concise optional explanation names context and token after the effect is clear.

The exact sentences and destination names are authored as a tiny validated puzzle set during implementation, then tested for ambiguous readings. Do not award success solely for a correct English guess. Require the player to inspect/change what the machine received and observe the prediction change.

### What makes it appealing

The machine is an inspectable contraption with moving pieces, not a text chat box. Let the player stop it between pieces, peek at two or three plausible candidates, rewind, and produce harmless funny messages in an optional sandbox. The robot responds to sent messages in the world. Consequences are quick, legible and recoverable; no punishment timer, XP pressure or long explanation is required.

Use a few short text pieces because language is the subject. They belong on the machine/input/message objects, with readable accessible equivalents. Keep the normal HUD to one goal plus the relevant action. Put probability detail, terminology and explanations in optional inspection; never stack them over the actor and target. Keep a stable phone camera for each action/result. Audio is optional and never the sole carrier of meaning.

### Narrow learning contract

| Outcome | Action that requires it | Assessment limit |
|---|---|---|
| Explain the repeated next-piece loop | Stop after one output, identify the enlarged context, predict the next step, then resume | Watching an animation alone is participation, not evidence |
| Distinguish available context from outside-world knowledge | Choose which missing information to add and compare before/after predictions | A highlighted solution is assisted practice |
| Distinguish plausible from correct | Find a message consistent with the shown context that still fails the recipient's actual need | One incorrect generation does not prove all models behave identically |
| Apply the idea to a new situation | Diagnose a fresh missing-context message with different nouns, cue position and candidate ordering before feedback | Replaying the same repair sequence is not independent transfer |

Record predictions, semantic actions, explanations when requested, assistance and feedback exposure separately. Do not claim learning from completing the route or the robot reaching a door. Delayed retention remains untested until a later actual return.

### Honest toy model

Episode 1 uses a small, deterministic or seeded **toy language model**, with inspectable authored distributions and a bounded vocabulary. Its purpose is to reveal the autoregressive loop and dependence on context. It is **not a miniature trained LLM**, and a frequency table is not presented as a transformer. Mark authored probabilities as illustrative rather than measurements from a real service.

Use word-sized pieces initially for readability and explain that this toy's pieces are whole words; real tokenizers can use word fragments and punctuation. Episode 2 makes that limitation concrete. Do not depict next-token generation as whole-answer database lookup, mind-reading, a fact checker or a universally greedy choice. An output can reflect learned information while still being unsupported in a particular case. Avoid saying “LLMs only guess words” as a complete account of their capabilities.

The core conceptual loop is context -> model scores -> next-piece choice -> appended context -> repeat. The physical presentation may use a selector/branching track, but should not imply literal wheels/gears inside a neural network. Modern inference can optimize execution with techniques such as speculative decoding; the lesson concerns the autoregressive distribution, not a claim that every implementation performs exactly one physical computation per visible token.

### Episode 1 implementation boundary

Use existing PlayCanvas/runtime and server-authoritative semantic actions for append-context, step, rewind, compare and send. New canonical AI competency/content/assessment identities are required. Keep existing retry submissions, evidence and replay intact; do not relabel them as AI learning. No schema migration or old-course replacement occurs in this planning/policy change.

First implement one continuous opening -> player action -> meaningful visible result. Use a bounded local toy and supplied content; no external model API, learner-data upload, untrusted code runner, arbitrary generation or broad engine rewrite is needed. Validate one behavior across storage and browser before extending. All later episodes remain a series plan until that first unit satisfies actual-play review and the user's direction.

## Critic additions for this series

Apply [CRITIC-POLICY.md](CRITIC-POLICY.md) to each exact playable episode. In addition:

- Can the reviewer describe what the machine receives, what the player changes and how that affects output using the scene?
- Does manipulating the machine teach an AI idea, or is this a vocabulary quiz with animated scenery?
- Are model-generated predictions visually distinct from verified facts, user choices and scripted story events?
- Does each analogy state its boundary without requiring a lecture before play?
- Is the next episode interesting because a visible unanswered question remains, not because a locked progress map says so?
- Can a new assessment defeat memorized button order and expose the intended misconception?

No written design score is assigned. The sole current human product critic remains the user.

## Primary references and factual boundaries

- [Google Research: Mechanics of Next Token Prediction with Transformers](https://research.google/pubs/mechanics-of-next-token-prediction-with-transformers/): source for the prediction/training framing. Our scene and curriculum are design proposals, not validated by that paper.
- [Vaswani et al., Attention Is All You Need](https://arxiv.org/abs/1706.03762): architecture foundation for the later attention/transformer episode. The original encoder-decoder architecture is not identical to every modern decoder-only LLM.
- [Google Research: Looking back at speculative decoding](https://research.google/blog/looking-back-at-speculative-decoding/): source for next-token distributions and the distinction between autoregressive semantics and optimized execution.

Each later episode needs its own precise source-grounded model, misconceptions and executable learning contract before implementation. The table is a season outline, not a claim that eight educational experiences already work.

## Implementation status — 15 September 2026

Episode 1 is a bounded local prototype with two guided context experiments and the existing framework reused. See LLM-EPISODE-1-IMPLEMENTATION.md, REUSABLE-ASSETS.md and LLM-EPISODE-1-VERIFICATION.md. Episodes 2–8 remain planned. No model API, tokenizer/training engine or general course generator has been introduced. Stop at the current user's Phase 1 review checkpoint.
