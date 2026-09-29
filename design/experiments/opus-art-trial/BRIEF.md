# Bellweather: one place worth inhabiting

You are the visual implementation builder for a bounded original browser-game
experiment. Produce a beautiful playable place, not a concept-art image or a
technical demonstration. Study `reference/bellweather-graphic-utopia.png` before
designing. The image sets the art/world ambition; it is not an exact floorplan.

## The experience

The player directly embodies Zip, a small expressive robot, in Bellweather before
a later story rupture. Bellweather is a far-future techno-fantasy utopia: bright,
free, socially inhabited and worth exploring. Mira is Zip's companion. Build a
short continuous journey from a sheltered arrival, through a garden lightwell,
to a physically reachable overlook where Mira waits after their shared action.
The complete interaction contract is the opening entry in
`design/bellweather-world-trial.json`; other entries are future context only.

The strongest first frame should make the player want to walk into it. Consider
the reference's sculpted architecture with real thickness, sheltered recesses,
occupied balconies, long cast shadows, foliage framing and a path unfolding into
a larger world. Compose near, middle and distant space around readable human
and robot scale. Architecture should look built and used; plants should have
recognizable growth, branching and distinct crowns. Let the distant city suggest
possibility while the local destination actually rewards travel.

Use expressive graphic-animation shape and material design with convincing
illumination, contact and depth. Light stone, deep cool shadow, selective warm
metal and vegetation can form a coherent palette; the reference is the authority
over this shorthand. Let the player see volumetric form from changed camera
angles. Design the geometry and surface treatment together. You have freedom to
choose construction and rendering techniques that best achieve this.

One or two local inhabitants should visibly have something to do and somewhere
to go. At the lightwell, the player's explicit action wakes a visible connected
water/light response. Mira acknowledges it and follows the available route to
the overlook. The player can approach and inspect the consequence indefinitely.
Arrival at the overlook reveals more of the place and a brief partner response.
This is an attachment and exploration opening, not an LLM lesson or mastery test.

## What must work

- One connected traversable route, direct movement/look, stable camera and
  collisions/contact. The player can explore early and return without dead ends.
- Wake is voluntary and idempotent. Guided travel never activates it; guidance
  reaches the same stations as manual play. Joint payoff waits for activation
  and both characters' arrival. Return preserves state; Restart resets only the
  disposable experiment. Pause cancels travel and blocks background actions.
- Primary guidance and responses belong beside the relevant character/object.
  Use brief contextual prompts and accessible equivalents. Secondary help and
  settings may use menus. Preserve readable 390px portrait and enlarged text.
- Reduced motion provides explicit settled station states. Continuous motion
  and audio quality are not review requirements, but controls and physical
  contact still have to work. Stop unnecessary rendering when hidden/paused.
- Aim for a responsive 1080p experience on an RTX 3060 laptop, with a lighter
  setting. Measure the result; do not claim phone performance from desktop data.

## Scope and implementation freedom

This is a standalone Three.js research exception, not a production migration.
The supplied Summer Cycle source is a pinned MIT reuse resource, not a required
layout, cycling mechanic, visual theme or architectural wrapper. Reuse useful
material/light/vegetation code and existing engine features with attribution.
Build original forms as needed. A static image backdrop cannot substitute for
the playable environment. No automatic mandate to use Blender or generate assets.

Keep code, assets and build outputs within the trial output directory. No
accounts, learner data, persistence, production network calls, deployment,
tutorial, Level 1 expansion or later levels. Do not read files outside the
provided packet. No new external downloads, paid generation or additional
agents unless the operator separately provides them under the execution policy.
The supplied art image is guidance, not a texture to project over the scene.

## Delivery

Read `EXECUTION-POLICY.json` before work. A pending policy means prepare only;
do not start a provider run. Once authorized, first save a brief composition and
construction plan, then implement the initial playable result. Spend the effort
on visible form, space and responsiveness rather than architecture paperwork.
Do not silently repair the initial result before the operator preserves it.

Provide runnable source, exact build/preview commands, source/license credits,
known shortcomings, and a short record of actual work and checks. Preserve an
initial checkpoint before at most two explicitly assigned substantial repairs.
Do not mark yourself accepted. The operator will play through the GUI and judge
the result against the reference. Report anything you could not observe honestly.
