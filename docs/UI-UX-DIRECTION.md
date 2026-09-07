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

- Password visibility rendered as a full secondary button beside a primary login CTA.
- Forgot-password rendered with button weight instead of utility-link weight.
- Too many white bordered cards in the main workspace.
- Sidebar contrast stronger than the learning content.
- Too many tiny uppercase labels and tags.
- Mixed symbol vocabulary (`↗`, `◈`, `✦`, `◎`, `↻`, arrows, dots) rather than one
  icon language.
- Inconsistent radii and surface treatments.
- Informational/success/error messages sharing the same notice styling.
- Right rail showing mode, help, source, and philosophy simultaneously instead of
  progressively revealing context.

## Implementation sequence

### UI-1 — Auth and tokens

- Establish premium palette, radius, shadow and action tokens without rewriting the
  entire existing stylesheet.
- Make authentication a focused state rather than a card inside the lesson shell.
- Move password visibility to an icon utility inside the field.
- Reduce forgot-password to a tertiary action.
- Improve focus, hover, pressed and loading feel.

Acceptance: no horizontal overflow at 390px; keyboard controls remain usable; password
visibility retains accessible Show/Hide naming; existing auth behavior is unchanged.

### UI-2 — Workspace hierarchy

- Quiet the sidebar and top bar.
- Reduce card count/border density.
- Increase content width and breathing room for the actual problem.
- Convert the right rail into a calmer contextual tool area.
- Normalize typography and iconography.

### UI-3 — Learning feedback

- Create distinctive but restrained states for saved progress, hint exposure,
  submission, correct/revisit feedback, review scheduling, and XP.
- Add small motion only where it communicates state change.

### UI-4 — Progress and identity

After real learner feedback, explore a light journey/progress layer: episode progress,
practice rhythm, retrieval readiness, and bounded XP. Do not let these signals affect
mastery claims or evidence quality.

## Non-goals for this pass

- Copying Duolingo/Brilliant layouts or artwork.
- Adding mascots merely for personality.
- Building leaderboards, streak pressure, currency, or monetization UI.
- Replacing the Phase 1 learning model.
- Hiding evidence/provenance behind game mechanics.
