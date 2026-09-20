# Motion/audio review and browser access research

Research date: 20 September 2026. No paid inference, upload, deployment or product
acceptance occurred. This is a capability investigation, not a model benchmark.

## Findings

- Astra supports text/image input, but its documented API explicitly excludes
  direct audio/video input. No documented flag was found that changes this.
  [Official model reference](https://developers.openai.com/api/docs/models/gpt-6-astra).
- Gemini accepts video with audio, offers timestamped analysis and configurable
  frame sampling. Default 1 FPS can miss fast action. Gemini 3.8 Flash is a
  documented candidate; adaptive video inspection is also available. These
  features establish input support, not reliable game-quality judgment.
  [Video guide](https://ai.google.dev/gemini-api/docs/video-understanding).
- Gemini also documents non-speech sound understanding. Its audio preprocessing
  combines channels, so do not infer stereo/spatial fidelity certification.
  [Audio guide](https://ai.google.dev/gemini-api/docs/audio).
- GPT-Audio-1.5 accepts audio through Chat Completions and is an audio-only
  candidate. GPT-Realtime-2 supports audio and image input, but not direct video;
  a streaming connection adds complexity we do not yet need. The older GPT-Audio
  entry is marked deprecated in the current catalog. None has been evaluated
  here for game music, mix quality or sound-effect criticism.
  [Audio model](https://developers.openai.com/api/docs/models/gpt-audio-1.5),
  [Realtime model](https://developers.openai.com/api/docs/models/gpt-realtime-2),
  [Catalog](https://developers.openai.com/api/docs/models/all).

## Local evidence and constraints

The parent CUA session exposes browser input, accessibility state and screenshots.
Its advertised browser capabilities are visibility/viewport; tab capabilities are
pageAssets/webmcp. No continuous video-to-model or audio-to-model capability is
advertised. Playing a file in that browser does not establish that Astra received
its sound or every frame. Native desktop apps are disabled in this tool session.

The repository already records WebAudio from the final master bus through
MediaRecorder in `web/game-audio.js`, exercised by the opening browser test.
`artifacts/prologue-event-audio.webm` exists (614620 bytes during investigation).
That is captured signal, not a listening verdict or proof of physical speaker
output. Existing video and audio assets must not be assumed synchronized merely
because their names match. The retained town motion file also exists.

## Recommended experiment

Keep one fresh-context Astra as the GUI player and final critic across all lanes,
including art/world. A media analyzer is a supporting tool that returns observations,
not another autonomous creative critic. Preserve whether a finding is direct Astra
observation, analyzer evidence or human listening; Astra must not claim to have
heard an analyzer's text report itself.

1. Capture the actual reviewer-directed run with video, final mixed audio and a
   shared monotonic time origin. Bind build, session, hashes, start offsets, dropped
   frames, audio channels and capture coverage. Keep original media.
2. Evaluate short clips with known injected defects and clean controls: frozen pose,
   transient clipping, camera jump, missing cue, delayed cue, masked cue, repeated
   sound and abrupt music cut. Include unfamiliar layouts/themes. Keep answers
   hidden from the analyzer. Test localized timestamps and honest abstention.
3. Compare Astra's ordered dense frames plus timing measurements against Gemini
   video/audio observations; optionally compare GPT-Audio-1.5 on the same audio.
   Use sufficient temporal density for each defect, not a universal FPS promise.
   One-frame defects and subtle smoothness still need appropriate frame coverage.
4. Measure misses, false positives on clean clips, timing error, uncertainty,
   latency and actual billed cost. Do not select based only on model branding.
5. Only after calibration let qualified observations support critic criteria.
   Unknown coverage and failed calibration remain unassessed. Human listening
   remains useful for subjective music/atmosphere and device sound quality.

Under the current subscription-only policy, prepare local evidence and improve
Astra's temporal inspection now. External media inference requires an explicit
provider/budget policy before execution. This research does not enable dispatch.

## Browser diagnostic

Previous reviewer failures are retained in
`artifacts/readiness-20260920/town-critic-recheck.md` and the speech recheck.
The reviewer had an empty browser inventory and failed the documented `iab`
entry point, not just a stale parent tab ID.

During this investigation the parent returned one available IAB provider and
successfully opened then closed `about:blank` through the same documented entry
point. A blank-page probe removes game/server/port availability from the test.
The existing reviewer checked the same operation before and after resetting its
CUA JavaScript session. Both inventories were exactly `{apps:[],browsers:[]}`.
Both blank-tab attempts returned `Browser is not available: iab`. The reset itself
succeeded (`js kernel reset`); both CUA tools were callable. No tab was created.
This rules out a stale JavaScript binding as a sufficient explanation/recovery.

The working hypothesis is a persistent child-session browser-provider attachment problem,
not a game defect. The exact host-side cause is not established. Do not invent
configuration flags, change security permissions, or substitute scripted tests for
the required native play. A fresh top-level reviewer task is a possible workaround,
but is untested and must pass the same preflight before consuming review time.

Preflight must distinguish: tool callable; provider present; tab creation works;
visible input changes observed; screenshots work; recordings captured; temporal
inspection works; audio inspection works. A tool name alone establishes none of
the later capabilities. Fail once, allow one documented recovery, then retain a
reproduction report instead of repeatedly rerunning the full review.

## Implemented follow-up

The user authorized a separate fresh review task. Projectless Astra task
`01a0bf3a-deed-7be1-8506-cb7172269bdc` received no repository/prior-review context.
It successfully created a blank IAB tab, obtained AX and a screenshot, then closed
it. This establishes a working top-level-session path on this host, not a repair
to child-provider attachment. It still advertises no audio/continuous-video feed.
It subsequently received a disposable game URL on port 8067 for cold entry,
prologue and tutorial play against runtime candidate `817598c50abd706712c8c5279bce6cc0468b9e5b`.
The cold review completed in that task, reaching enabled Begin Level 1 with no
progression blocker: 20 game inputs, 30 screenshots, all eight prologue scenes,
control practice, repair and handoff. A 390x844 prologue check fit text/controls
but cropped the world laterally; mobile gameplay was not tested. Viewport reset
and temporary-tab cleanup completed. The following is a parent summary; the
unaltered cold report and native tool history remain in the source task.

The reviewer perceived a lantern celebration, distinct robot silhouettes, a warm
town/dark prison contrast, a stolen chest module and an empty socket/crossed speech
bubble. Friendship, names, abduction causality and speech function remained more
dependent on captions. It did not perceive the flower delivery as ordinary town
activity. This is a perception gap, not proof the animation failed to execute.
Some dark forms merged with the prison background and panels dominated attention.
Movement, camera drag, menu and tutorial-action responses worked. The generated
words visibly accumulated as input, but technical vocabulary may burden beginners.
At repair step 4 the Scan Moon and Speak world markers overlapped; the bottom
button remained usable. After the camera drag Zip faced away, reducing chest-repair
visibility. These concrete findings need reproduction before repair.

No native-run video was captured, audio was not inspected, and continuous motion
was not rated. Candidate identity was supplied, not independently attested by the
reviewer. No source, previous review or creator rationale was read. The completed
cold report is the authority for scope/findings; no acceptance follows from browser
success. Remaining next steps: reproduce overlapping markers/camera composition,
repair shared behavior where appropriate, then recheck. Full media calibration
and Level 1 review remain outstanding for this new session.

`tools/native_preflight.py` now validates supervisor observations scoped to the
candidate, assignment, reviewer session and model. New supervised bridge runs
require it before issuing any game-input permit. Missing provider/input checks,
parent-to-child report reuse and missing media inspection fail closed. Capture
and inspection are distinct checks; low-level guard users and direct CUA remain
outside this bridge enforcement. Reports trust the supervisor; they do not
cryptographically authenticate the GUI tools or rate product quality.

The actual child failure is retained as a supervisor transcription in
`artifacts/readiness-20260920/child-browser-preflight.json`; the checker returns
`ready:false`, no verified gameplay capabilities, dispatch false and product
acceptance undetermined. Build passed; 365 application tests passed with seven
skips. Nine new preflight tests cover identity mismatch, absent/unavailable checks,
recording without inspection, empty evidence and refusal before run creation.
