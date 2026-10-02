# Saves and learning records: server and client (proposal, 1 Oct 2026)

**Status:** proposal for Desmic's decision. Nothing here is wired yet. Today Bellweather keeps
its save and learning record only in the browser (`src/save.ts`).

**Direction given (1 Oct):** keep data on the server and on the client, so players can resume
from a save, without making a client-side file a way to cheat.

## The principle

Anything on the player's device can be edited. So the device keeps a **copy** (fast resume,
play without a connection) and an **outbox** (actions not yet sent). The server keeps the
**record**: it decides what counts, and its answer wins when the two disagree.

This is the pattern the server in `app/` already uses for the earlier missions: commands with
an id (sent twice, counted once), action logs that can only grow, a snapshot sealed before
feedback is shown, evidence rows the database refuses to change, and a revision number that
catches a second tab.

## What lives where

| Data | Server (the record) | Device (a copy) |
| --- | --- | --- |
| Where to resume (checkpoint) | Advances only when the station actions that reach it are on file (e.g. `land` needs the skiff's rules to reach `awake`) | Cached for an instant "Continue", and for play without a connection |
| Each station's action log | Append-only; replayed with `app/game_rules.py` on the same rules the browser ran | Outbox until the server confirms |
| Learning evidence (first tries, choices) | Worked out by the server from the replay. The first judged answer it receives is the first try, for good | Shown, never trusted |
| Stars | Worked out from the evidence and the rules' objectives | Shown |
| Position, camera, graphics settings | Not needed | Device only |

The browser and the server already run the same rules: `src/kit/game-rules.ts` is a port of
`app/game_rules.py`, and `tools/rules-parity.mjs` shows they agree (3 rule sets, 36,000 random
steps, 39 deliberately broken specs).

## Ways to cheat, and what stops each

1. **Editing the saved checkpoint to skip ahead.** Only the local view moves. The server's
   checkpoint needs the actions that earn it, so the next sync puts the player back where the
   record says.
2. **Answering wrong, reloading, answering right** (reload-scumming). The wrong answer is
   sent before the feedback is shown ("commit before reveal"), so the server already has it.
   The puzzles already pause about a second while the machine "thinks"; the send fits in that
   pause. The browser already refuses this today for stars and evidence (the breaker checks it).
3. **Editing the outbox while offline** (changing an answer after seeing the feedback).
   Answers made offline are marked `offline`. They still move the story forward, but they are
   not counted as first-try evidence, because the server could not see them before the feedback.
4. **Sending made-up requests to the server.** Each action must be legal in the server's replay
   (no opening the gate without notes), and correctness comes from the rules, never from the
   request. Someone who already knows the answer can still give it first time; no system can
   stop that. Later stops guard against it with changed problems the server picks (the earlier
   missions do this with sealed snapshots).
5. **Two tabs or two devices at once.** The revision number refuses the older one; the player is
   asked to reload.
6. **Copying someone else's save.** Records belong to a learner on the server; a copied
   browser file only changes the copy.

## Who the learner is (needs your decision)

- **A. Anonymous to start (recommended).** The server creates a learner id on first play and
  keeps it in a secure cookie. No name, no email. Resume works on that device. Later, the
  player can link an account to resume on other devices (the server already has Supabase sign-in).
- **B. Account first.** Sign in before playing. Resume works everywhere from the start, but it
  adds a step before the fun, and needs a decision on children's data if the audience includes
  under-18s.

## How it fits the existing server

- One new activity type for Bellweather stations, using the existing command endpoint:
  `POST /api/commands/act` with `{command_id, expected_revision, attempt_id, station, action,
  offline}`.
- The attempt's sealed snapshot holds the rules spec id, version and digest, so a later
  change to the rules can't rewrite past evidence.
- A new append-only table for station actions; evidence rows reuse the existing immutable
  `evidence` table.
- `GET /api/state` adds Bellweather progress: checkpoint, stars and stations done.

## Building it (after your decision)

1. Client `src/progress.ts`: outbox in the browser, send with retries, the server's answer wins;
   off unless the game is served with a server (the claude.ai copy stays device-only).
2. Server `app/bellweather.py`: replay checks with `game_rules.py`, the new table, the command,
   and progress in `/api/state`; Python tests using the same rules files the browser uses.
3. Checks: the parity check, server unit tests, and a flowcheck run against a local server,
   including the cheats above.
