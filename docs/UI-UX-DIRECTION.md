# VibeLearn UI/UX direction — premium, slightly gameful

Status: adopted direction for the Phase 1 refinement pass.

## Product feeling

VibeLearn should feel like a premium interactive learning product for serious technical
work: inviting enough that practice feels rewarding, but calm enough that the learner
can reason for 10–20 minutes without fighting the interface.

The target is **not** a developer dashboard with XP attached and **not** a cartoon game
for engineers. The working blend is:

- Brilliant-like focus on learning by doing, immediate feedback, and visible progress.
- Duolingo-like craft around progression, tactile feedback, consistency, and selective
  moments of delight.
- A quieter productivity-tool baseline for dense technical content.

Reference principles, not assets:

- Duolingo's recent UI craft write-up: simplify typography, normalize spacing, use
  whitespace intentionally, and keep visual systems consistent across surfaces:
  https://blog.duolingo.com/core-tabs-redesign/
- Brilliant's current product model: hands-on interactive lessons, immediate feedback,
  daily progress/streaks/XP, guided paths, and challenge rather than passive reading:
  https://brilliant.org/help/using-brilliant/how-do-i-get-started-on-brilliant/
  https://brilliant.org/

## Design principles

### 1. Learning is the hero

The incident, question, response, and feedback should dominate the page. Navigation,
mode controls, source controls, hosting status, and system metadata should recede until
needed.

### 2. Gameful through consequence, not decoration

Use stronger visual treatment for meaningful moments:

- beginning a challenge;
- saving meaningful progress;
- revealing help;
- completing an episode;
- earning bounded practice XP;
- surfacing a future retrieval need.

Do not turn every label, card, or status into a badge.

### 3. Premium means fewer, better surfaces

Prefer hierarchy from whitespace, typography, tint, depth, and grouping. Borders are
for controls and genuine containment—not a default around every piece of content.

### 4. One interaction language

- Primary action: solid, tactile, high-confidence.
- Secondary action: quieter surface or outline.
- Tertiary utility: icon/text control with little visual weight.
- Field utility: lives inside or immediately adjacent to the field, never competing
  with form submission.

### 5. Friendly geometry, precise typography

Use a small radius scale and a small type scale. Rounded geometry should feel warm and
interactive, while body copy stays crisp enough for technical material.

### 6. Delight must preserve accessibility

Gameful animation and visual feedback must respect reduced motion, keyboard operation,
focus visibility, touch targets, contrast, zoom, and narrow screens.

## Visual system v0.1

### Palette

- Ink: deep blue-black, not pure black.
- Canvas: cool off-white with a very subtle blue/lime atmosphere.
- Primary accent: electric lime for progress and positive learning moments.
- Secondary accent: violet/indigo for depth and premium contrast.
- Warm accent: amber only for genuine attention/warning states.
- Error and success states must be semantically distinct.

The lime accent is intentionally retained from the original VibeLearn identity, but it
should appear in fewer, more meaningful places.

### Geometry

Use four radius tiers only:

- 10px — inputs and compact controls
- 14px — small cards/panels
- 20px — major surfaces
- 999px — pills only

### Depth

Major surfaces may use a soft ambient shadow plus a very small edge highlight. Avoid
stacking border + dark shadow + tinted background on the same component unless it is a
reward/completion moment.

### Typography

Keep three meaningful text hierarchies:

1. display / challenge title;
2. section title / action title;
3. body / metadata.

Uppercase eyebrow labels remain available but should be used selectively, not as the
default heading for every component.

## Current inconsistencies to remove

- Too many white bordered cards in the main workspace.
- Sidebar contrast stronger than the learning content.
- Too many tiny uppercase labels and tags.
- Mixed symbol vocabulary (`↗`, `◈`, `✦`, `◎`, `↻`, arrows, dots) rather than one
  icon language.
- Informational/success/error messages sharing the same notice styling.
- Right rail showing mode, help, source, and philosophy with similar visual weight.

Resolved in the current refinement layer:

- Password visibility is now a field utility rather than a full secondary button.
- Forgot-password is now tertiary instead of competing with the primary CTA.
- Radius, depth, focus and accent tokens are centralized in `web/premium.css`.

## Implementation sequence and current state

### UI-1 — Auth and tokens — implemented

- Premium palette, radius, shadow and action tokens are layered over the known-good
  Phase 1 stylesheet.
- Authentication is a focused product state rather than a lesson-shell card.
- Password visibility uses an inline icon utility inside both password fields.
- Forgot-password is tertiary.
- Focus, hover and pressed states are more coherent.

Acceptance: 390px browser overflow check, keyboard controls and both password-toggle
flows pass in real Chromium CI.

### UI-2 — Hint + source rail — implemented

This was intentionally refined before the broader shell.

- Mode selection is visually demoted to a compact system control.
- Hints use a lime learning-assistance language with progressive numbered reveals.
- Hint actions are tactile but quieter than primary task actions.
- Source/resource access uses violet as the secondary learning accent.
- The source card has visibly different locked and available states.
- Revealed source content gets its own compact reading panel instead of expanding as
  unstructured card text.
- Help/resources share a coherent rail language while remaining semantically distinct.

### UI-3 — Submission + XP feedback — implemented

- The recap becomes a deliberate completion surface rather than another white card.
- Feedback rows are easier to scan and visually anchored without pretending that one
  exercise establishes mastery.
- The future-review surface uses the violet retrieval/progression language.
- Practice XP gets a bounded celebratory surface with lime emphasis, but remains
  explicitly separate from mastery/evidence.
- Evidence/checkpoint details remain available and visually quieter than the learning
  summary.

### UI-4 — Workspace + sidebar — implemented first pass

- Desktop sidebar width and visual contrast are reduced.
- The current journey step gets a restrained highlighted path treatment.
- Practice status in the sidebar is grouped as a quiet progress surface rather than
  another navigation item.
- Top bar is shorter and less visually dominant.
- Main learning width increases; the problem and response columns receive more space.
- The contextual rail is wider but quieter and becomes sticky on large screens.
- Core task/response cards retain enough containment for dense technical material while
  using lighter borders/shadows than before.

This is intentionally a first shell pass. Icon normalization and removal of additional
uppercase metadata should happen after the live visual trial so we do not churn the
entire interface before seeing the new hierarchy in use.

### UI-5 — Progress and identity — after learner feedback

Explore a light journey/progress layer: episode progress, practice rhythm, retrieval
readiness, and bounded XP. Do not let these signals affect mastery claims or evidence
quality. Avoid streak-pressure mechanics until there is evidence they improve the
learning experience rather than merely increasing engagement.

## Current product rule

**Progress and reward moments may use color and depth; utility and system controls
should become quieter.** Gamefulness should increase the felt consequence of learning
actions, not the number of decorative objects on screen.

## Non-goals for this pass

- Copying Duolingo/Brilliant layouts or artwork.
- Adding mascots merely for personality.
- Building leaderboards, streak pressure, currency, or monetization UI.
- Replacing the Phase 1 learning model.
- Hiding evidence/provenance behind game mechanics.
