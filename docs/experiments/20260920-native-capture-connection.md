# Native capture connection proof — 20 September 2026

The supervised pipeline now retains actual native browser screenshot bytes,
checks typed before/after coverage, and produces an actionable missing-capture
follow-up. This tests the reusable system boundary, not the game or Luna's skill.

Astra operated CUA on a fresh tab of the unchanged `route.html?case=m7` fixture,
served only at loopback port 8053. Fixture SHA-256 remained
`e754946140c0f8d5fc07820a9b1595b397b4b41476c481847430ca103a91b796`.
The assigned task was one visible interaction with screenshots before and after;
it did not require solving the game. Root knew the fixture and is not a cold
critic. Candidate SHA in the diagnostic config is only the repository base;
this is not a sealed candidate review or promotion receipt.

## Observed end-to-end sequence

1. Native screenshot showed the player at Start, a key on the next tile,
   inventory empty and the gate locked. CUA returned JPEG bytes.
2. On a separate local inbox tab, the supervisor pasted the base64 representation
   of exactly those bytes and submitted the form. The inbox retained a JPEG and
   returned its ref/hash. No screenshot was redrawn or reconstructed.
3. A deliberate text-only checkpoint was submitted to the guard, then a click
   requested. The guard refused it: required pre-input capture missing. No game
   input occurred and the attempt counter remained unused.
4. The actual before-image was imported and independently checked; the guard
   permitted a click. Root refreshed AX and clicked the visible Move right button.
5. Native AX and screenshot showed the player on the Key tile, key collected,
   gate open and movement counter 1. The bridge acknowledged successful dispatch.
   Its follow-up requested `collect_and_verify` for the after-interaction image.
6. The actual after-image was transferred through the same local form, imported,
   and verified. Coverage and follow-up gaps became empty. A further requested
   click was rejected before any game input because the checkpoints were complete.

Final record: **1 successful game input, 3 observations (1 AX + 2 JPEG), zero
missing checkpoints, zero capture gaps, final observation present**. Artifact
hash verification passed. The inbox required four auxiliary UI inputs (two
pastes, two submits), excluded from gameplay count, plus temporary tab setup.
Both temporary tabs and servers were closed/stopped after verification.

## Retained artifacts

Run folder: `artifacts/native-capture-20260920-run1/` contains config,
execution/dispatch records, coverage, follow-up and retained observations.
`observation-002.jpg` is the before image; `observation-003.jpg` is the after image.

- Before: `2cb931136e54ba27f2a0c2990d5e0b2adb5fd0c3a519b9f91a6440884fc98f67`, 37,499 bytes.
- After: `c45cc2457dccd3f034e0c24a6de5f4e2db60dd07589315d5e3eeaba72a0c8674`, 40,008 bytes.

Rejection messages and the intermediate missing-capture follow-up were observed
in tool output. Final JSON snapshots do not claim to be a complete immutable
history of intermediate coverage states. Staging copies remain available under
`artifacts/native-capture-20260920-staging/`.

## Limits and validation

95 focused tests passed across intake/import, capture rules, native guard,
supervision, routing, assignment/receipt/capsule/result checks. The native browser
run additionally proves actual acquisition, UI transfer, retention and guarded
dispatch occurred together. This is still manual trusted supervision: direct
CUA access is not isolated; image headers do not authenticate source or capture
time; screenshot meaning is externally checked. Motion/audio acquisition and
automatic provider dispatch are not implemented by this change.

No product runtime, learner data, deployment or live Terminal PM integration
changed. Next integration should consume the evidence follow-ups through the
existing worker/reviewer boundary, not introduce game-specific recovery logic
or copy the external orchestrator's session/runtime internals.
