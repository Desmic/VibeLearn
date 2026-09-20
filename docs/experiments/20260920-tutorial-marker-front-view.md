# Tutorial target and character-view repair

Base: `7962ec7`, local main. Scope: two findings from the fresh top-level Astra
cold opening/tutorial review. No level expansion, hosted change or live API call.

The tutorial's Scan and Speak actions share a Moon-gate anchor. Both remain valid
server actions in some states; marker visibility previously matched only the
anchor. It now also matches the tutorial spec's primary action. Availability is
still checked, and server rules/evidence are unchanged. No game-specific action
names were added to the selection condition.

Native root play reproduced the chest visibility issue: a forward key turns the
protagonist away, obscuring the restored module. An opt-in shared camera-profile
setting, `inspectCharacter`, exposes View character from front. It chooses the
actor's current facing as camera bearing and retains the existing camera collision
solver. It does not rotate/teleport the actor or commit a game command. The current
world opts in; other packages keep their existing controls. Recenter still restores
the authored gameplay view. Compact toolbar layout uses its actual button count.

Root native replay confirmed the chest becomes visible after turning away. The
same fresh top-level Astra task independently rechecked both changes with GUI
inputs on a new disposable database at port 8068. It saw only Speak at repair 4/4
on desktop and 390x844 phone, operated the world marker, used phone movement to
turn away, inspected the chest, recentered and completed the tutorial. It reported
19 inputs, no control overlap, viewport reset and tab cleanup. This is an informed
repair recheck, not a new cold pass or integrated acceptance.

Exact reviewer response: `artifacts/readiness-20260920/marker-front-critic-recheck.md`.
Source task: `01a0bf3a-deed-7be1-8506-cb7172269bdc`.

Two smaller concerns remain: the new circular icon resembles Recenter, and phone
front view can keep a Speak cue visible while the gate is outside the view. The
reviewer could not establish whether the latter is new. Recenter restores clear
spatial composition. These remain inputs to broader art/world and interaction
review; no audio or continuous-motion rating follows from this recheck.

Validation: build and 365 application tests passed (seven skips); active controls
and 200% text readability checks passed. The tutorial test now exercises the
shared anchor through the final repair stage at four widths. Two initial runs
hit the old five-second cold-load assertion before repair assertions; retained
logs document both. The setup wait is now bounded at 20 seconds, consistent with
other cold-start checks, without changing the interaction expectations.
The final tutorial run passed at 1280, 390, 360 and 430px, including one visible
current-action marker at the shared gate anchor. Original failure logs remain
alongside `marker-repair-browser-final.log`; no failure was relabelled as a pass.
