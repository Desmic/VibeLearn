# Shared renderer lifecycle repair — 19 September 2026

Final remote verification: candidate `471de882a01690fa50ac39455ad603fffd39cfdc`,
CI run `35440122451`, all seven suites and review-index passed. Sealed review
artifact `10583163540` is retained through 19 October. The local observations
below preceded that commit; independent criticism and user acceptance remain open.

## Scope and reproduction

The user authorized continuing the reliability/reuse pass, including actual
browser play. Earlier diagnostic play recorded incomplete-framebuffer warnings.
The shared renderer's AUTO resolution mode reads canvas client dimensions on
every frame; hidden and detached elements report zero even after the backend
has clamped a resize callback to positive dimensions.

An unrelated primitive orchard fixture reproduces the failure without game
characters, story IDs, HUD assumptions or mission rules. Before repair, both
hidden and detached phases produced a 0 x 0 drawing buffer and WebGL error 1286.
The before evidence is `artifacts/renderer-lifecycle-before.json` and
`artifacts/renderer-lifecycle-before.log`. Ordinary replay did not reproduce the
warning every time; the isolated lifecycle test supplies the deterministic case.

## Repair and reusable boundary

The shared PlayCanvas backend now uses explicit buffer resolution, sizes it
from the connected visible host, and retains its last valid size while hidden
or detached. It starts rendering after initial scene/camera/size setup.
ResizeObserver continues to handle visible size changes. No story data,
learning semantics, saved state or engine vendor source changed.

`tests/renderer_lifecycle_browser.py` runs the real backend through visible,
hidden, shown, detached and landscape-remount phases. It checks positive buffer
dimensions, GL errors, framebuffer warnings and agreement with the visible
container. It now belongs to the foundation browser group. The active opening
suite also fails on incomplete-framebuffer messages, which pageerror alone did
not capture.

## Evidence and limits

After repair, the orchard retained 390 x 420 buffers while hidden/detached,
resized to 900 x 360 on remount, and reported no GL errors or graphics warnings.
See `artifacts/renderer-lifecycle.json` and `renderer-lifecycle-after.log`.
The application suite also includes the materially different Harbor Relay
contract fixture; this proves reusable contracts, not a complete second game.

Manual browser play at 390 x 844 covered fresh lantern release, all eight
replay beats, return to tutorial and movement. Fresh launch/release produced no
framebuffer warnings; moving after return preserved serialized learning state.
Opening and tutorial screenshots were visually inspected:
`artifacts/renderer-opening-manual-390.png` and
`artifacts/renderer-tutorial-manual-390.png`.
Manual resizing to 1280 x 800 followed by camera zoom also retained a single
canvas with matching CSS/buffer dimensions. Its screenshot was inspected:
`artifacts/renderer-tutorial-manual-1280.png`.

Build and 265 application tests passed (seven skips). All seven active browser
groups passed, including the new shared lifecycle check in foundation and the
opening framebuffer guard. Integrated browser verification is recorded in
`artifacts/renderer-repair-browser.log`.
Build log: `artifacts/renderer-repair-build.log`; application log:
`artifacts/renderer-repair-tests.log`.
Runtime source digest:
`c7780cd477c40d31b4bb152d4a8422d7ab7e7826871dfb6bb877a8d6e478891f`.

These are local working-tree observations on base e328760, including the prior
marker repair. They are not exact-SHA CI evidence or independent criticism.
The frozen 92a5ecbd review bundle cannot certify this modified runtime. A new
candidate and its CI bundle, valid isolated reviewers, and user review remain
required before promotion. No deployment, production data change, Level 2 or
live Terminal PM integration is included.
