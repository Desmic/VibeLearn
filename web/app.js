"use strict";
const $ = (selector) => document.querySelector(selector);
const REQUEST_TIMEOUT_MS = 25000;
let hosted = false;
let state = null;
let attempt = null;
let busy = false;
let pending = null;
let editVersion = 0;
let dirty = false;
let selectedMissionId = null;
let campaignView = false;
const LEGACY_VIEW = new URLSearchParams(location.search).has("legacy");
function expeditionHandlers() {
  return {
    start: id => send("start", {mode: "LEARN", mission_id: id}),
    resume: showRun, campaign: showCampaign, save: () => send("save"),
    submit: () => send("submit"), edit: retainDraft, error: showError,
  };
}

function showError(message) { $("#notice").textContent = message; $("#notice").hidden = false; }
function clearError() { $("#notice").hidden = true; }
function draftKey() { return `learning-draft:${state.learner_id}:${attempt.id}`; }
function response() {
  const value = {prediction: $("#prediction").value, diagnosis: $("#diagnosis").value, aid_declaration: $("#aid-declaration").value};
  if (attempt?.snapshot?.expedition) value.game = Expedition.response();
  return value;
}
function setSaveState(text, stateName = "saved") {
  $("#save-status").textContent = text;
  $("#hud-save-value").textContent = stateName === "dirty" ? "Unsaved" : stateName === "error" ? "Retry" : "Synced";
  $("#hud-save-value").dataset.state = stateName;
}
function predictionParts(count) {
  const raw = $("#prediction").value ? $("#prediction").value.split(",") : [];
  return Array.from({length: count}, (_, index) => raw[index]?.trim() || "");
}
function fillResponse(value) {
  if (attempt?.snapshot?.expedition) Expedition.setResponse(value.game);
  $("#prediction").value = value.prediction || "";
  $("#diagnosis").value = value.diagnosis || "";
  $("#aid-declaration").value = value.aid_declaration || "unknown";
  if (attempt) renderPredictionBoard(attempt.snapshot);
}
function retainDraft() {
  dirty = true;
  editVersion += 1;
  if (!attempt || attempt.status !== "draft") return;
  try { localStorage.setItem(draftKey(), JSON.stringify({ response: response(), revision: attempt.revision })); }
  catch { showError("Recovery storage is unavailable. Keep this tab open and use the HUD Save control."); }
  setSaveState("Unsaved changes · retained on this device", "dirty");
  $("#dock-save").disabled = false;
}
async function api(path, body, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await fetch(path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json", "X-Learning-Command": "1" } : {}, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    const data = await result.json();
    if (!result.ok) { const error = new Error(data.message || data.error); error.status = result.status; error.requestId = data.request_id; throw error; }
    return data;
  } catch (error) {
    const message = String(error?.message || "");
    if (error?.name === "AbortError" || (/signal/i.test(message) && /abort/i.test(message))) {
      const timeoutError = new Error("The connection took too long. Please try again.");
      timeoutError.code = "REQUEST_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally { clearTimeout(timeout); }
}
function campaignMissions() { return (LEGACY_VIEW || (!campaignView && attempt && !attempt.snapshot.expedition) ? state?.course?.campaign : state?.course?.expedition) || []; }
function activeMissionMeta() { return attempt?.snapshot?.mission || null; }
function missionHintTotal(snapshot) { return Number(snapshot?.mission?.hint_count ?? 3); }
function xpValue() { return Number(attempt?.practice_xp || 0); }
function playerRank(xp) { return Math.max(1, Math.floor(xp / 20) + 1); }
function currentProgressPercent() {
  const missions = campaignMissions();
  if (!missions.length) return 0;
  return Math.round(100 * missions.filter(item => item.status === "cleared").length / missions.length);
}
function updateHud(snapshot = attempt?.snapshot) {
  const meta = snapshot?.mission;
  const xp = xpValue();
  $("#hud-xp-value").textContent = String(xp);
  $("#campaign-xp").textContent = `${xp} XP · Rank ${playerRank(xp)}`;
  const missions = campaignMissions();
  const cleared = missions.filter(item => item.status === "cleared").length;
  $("#campaign-clear-count").textContent = `${cleared} / ${missions.length || 4} cleared`;
  $("#hud-progress-bar").style.width = `${currentProgressPercent()}%`;
  if (meta) {
    $("#hud-level").textContent = meta.boss ? "BOSS" : `LV ${meta.number}`;
    $("#hud-difficulty").textContent = meta.difficulty;
    $("#hud-mission-title").textContent = meta.plain_objective || meta.objective || snapshot.title;
  } else {
    $("#hud-level").textContent = "MAP";
    $("#hud-difficulty").textContent = "Campaign";
    $("#hud-mission-title").textContent = LEGACY_VIEW ? "One dumbbell. One charge." : "Help Pip reopen the valley.";
  }
}
function closeDrawers() {
  for (const drawer of document.querySelectorAll(".hud-drawer")) drawer.hidden = true;
  for (const button of document.querySelectorAll(".dock-button[aria-expanded]")) button.setAttribute("aria-expanded", "false");
}
function toggleDrawer(drawerId, button) {
  const drawer = document.getElementById(drawerId);
  const opening = drawer.hidden;
  closeDrawers();
  if (opening) {
    drawer.hidden = false;
    button.setAttribute("aria-expanded", "true");
    drawer.querySelector(".drawer-close")?.focus();
  }
}
function configureModes(meta, selected = "LEARN") {
  const available = meta?.available_modes || ["LEARN", "PAIR", "BUILD"];
  for (const select of [$("#start-mode"), $("#working-mode")]) {
    const desired = available.includes(selected) ? selected : available[0];
    select.replaceChildren(...available.map(mode => { const option = document.createElement("option"); option.value = mode; option.textContent = mode; return option; }));
    select.value = desired;
  }
  $("#dock-mode").disabled = available.length <= 1 || attempt?.status === "submitted";
  $("#dock-mode-label").textContent = attempt?.mode || available[0];
  $("#mode-controls").hidden = available.length <= 1 || attempt?.status === "submitted";
}
function chooseMission(missionId) {
  const mission = campaignMissions().find(item => item.id === missionId);
  if (!mission || mission.status === "locked") return;
  selectedMissionId = missionId;
  for (const node of document.querySelectorAll(".mission-node")) node.classList.toggle("selected", node.dataset.missionId === missionId);
  $("#entry-level").textContent = mission.boss ? "BOSS MISSION" : `LEVEL ${mission.number}`;
  $("#entry-difficulty").textContent = mission.difficulty.toUpperCase();
  $("#entry-title").textContent = mission.title;
  $("#entry-objective").textContent = mission.plain_objective || mission.objective;
  configureModes(mission, mission.available_modes?.[0] || "LEARN");
  $("#entry-mode-description").textContent = state.modes[$("#start-mode").value]?.description || "";
}
function recommendedMission(missions) {
  return [...missions].reverse().find(item => item.status === "unlocked") || [...missions].reverse().find(item => item.status === "cleared") || missions[0];
}
function renderCampaign() {
  if (!LEGACY_VIEW && state?.course?.expedition) {
    if (campaignView || !attempt) {
      $("#entry").hidden = true; $("#episode").hidden = true; $("#recap").hidden = true;
      Expedition.renderMap(state.course.expedition, attempt, expeditionHandlers());
    }
    updateHud(campaignView ? null : attempt?.snapshot);
    return;
  }
  const missions = campaignMissions();
  if (!missions.length) return;
  const activeId = attempt?.status === "draft" ? activeMissionMeta()?.id : null;
  const preferred = missions.find(item => item.id === activeId && item.status !== "locked") || recommendedMission(missions);
  if (!selectedMissionId || !missions.some(item => item.id === selectedMissionId && item.status !== "locked")) selectedMissionId = preferred.id;
  $("#campaign-track").replaceChildren(...missions.map(mission => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mission-node";
    button.dataset.level = String(mission.number);
    button.dataset.status = mission.status;
    button.dataset.boss = String(Boolean(mission.boss));
    button.dataset.missionId = mission.id;
    button.disabled = mission.status === "locked";
    const difficulty = document.createElement("span"); difficulty.className = "mission-difficulty"; difficulty.textContent = mission.difficulty;
    const title = document.createElement("h3"); title.textContent = mission.title;
    const objective = document.createElement("p"); objective.textContent = mission.plain_objective || mission.objective;
    const status = document.createElement("span"); status.className = "mission-status"; status.textContent = mission.status === "cleared" ? "✓ Cleared" : mission.status === "locked" ? "Locked" : "Ready";
    button.append(difficulty, title, objective, status);
    button.addEventListener("click", () => chooseMission(mission.id));
    return button;
  }));
  chooseMission(selectedMissionId);
  const active = attempt?.status === "draft";
  $("#start").hidden = active;
  $("#return-to-run").hidden = !active;
  updateHud();
}
function showCampaign() {
  campaignView = true;
  if (attempt?.status === "submitted" && attempt?.assessment?.outcome === "correct" && selectedMissionId === activeMissionMeta()?.id) selectedMissionId = null;
  closeDrawers();
  clearError();
  $("#entry").hidden = false;
  $("#episode").hidden = true;
  $("#recap").hidden = true;
  renderCampaign();
  $("#workspace").focus();
  window.scrollTo({top: 0, behavior: "smooth"});
}
function showRun() { campaignView = false; renderAttempt(); }
function renderStory(snapshot) {
  const fallback = [
    {icon: "🤖", title: "Agent acts", text: "A real-world action succeeds."},
    {icon: "📡", title: "Message is lost", text: "The agent is unsure whether it worked."},
    {icon: "🔁", title: "Agent retries", text: "Now the retry must be safe."},
  ];
  const beats = Array.isArray(snapshot?.story) && snapshot.story.length ? snapshot.story : fallback;
  $("#storyboard").replaceChildren(...beats.map((beat, index) => {
    const item = document.createElement("div");
    item.className = "story-beat";
    item.style.setProperty("--story-index", String(index));
    const icon = document.createElement("span"); icon.className = "story-icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = beat.icon || "•";
    const copy = document.createElement("div");
    const title = document.createElement("strong"); title.textContent = beat.title || `Step ${index + 1}`;
    const text = document.createElement("small"); text.textContent = beat.text || "";
    copy.append(title, text); item.append(icon, copy); return item;
  }));
}
function renderPredictionBoard(snapshot) {
  const board = $("#prediction-board");
  if (!board || !snapshot?.trace) return;
  const values = predictionParts(snapshot.trace.length);
  board.replaceChildren(...snapshot.trace.map((trace, index) => {
    const row = document.createElement("section"); row.className = "decision-row";
    const head = document.createElement("div"); head.className = "decision-row-head";
    const title = document.createElement("strong"); title.textContent = `${trace.label} · ${trace.name}`;
    const keys = document.createElement("small"); keys.textContent = `${trace.first} → ${trace.retry} · ${trace.elapsed_seconds < 3600 ? `${trace.elapsed_seconds}s` : `${Math.round(trace.elapsed_seconds / 3600)}h`}`;
    head.append(title, keys);
    const options = document.createElement("div"); options.className = "decision-options";
    for (const value of [1, 2]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "decision-option";
      button.textContent = `${value} charge${value === 1 ? "" : "s"}`;
      button.setAttribute("aria-pressed", String(values[index] === String(value)));
      button.setAttribute("aria-label", `${trace.label}: ${value} total charge${value === 1 ? "" : "s"}`);
      button.disabled = attempt?.status === "submitted";
      button.addEventListener("click", () => {
        const next = predictionParts(snapshot.trace.length);
        next[index] = String(value);
        $("#prediction").value = next.join(",");
        retainDraft();
        renderPredictionBoard(snapshot);
      });
      options.append(button);
    }
    row.append(head, options);
    return row;
  }));
}
async function send(action, extra = {}) {
  if (busy) return false;
  busy = true;
  clearError();
  document.querySelectorAll("button").forEach(button => { button.disabled = true; });
  const body = { command_id: crypto.randomUUID(), expected_revision: action === "start" ? 0 : attempt?.revision || 0, ...extra };
  if (action !== "start") { body.attempt_id = attempt.id; body.response = response(); retainDraft(); }
  const signature = JSON.stringify({action, ...body, command_id: undefined});
  if (pending?.signature === signature) body.command_id = pending.command_id;
  pending = {signature, command_id: body.command_id};
  const sentEditVersion = editVersion;
  const inputIds = ["diagnosis", "aid-declaration"];
  if (["hint", "mode", "source", "submit"].includes(action)) inputIds.forEach(id => { $(`#${id}`).disabled = true; });
  try {
    const result = await api(`/api/commands/${action}`, body);
    const newerResponse = editVersion !== sentEditVersion && action !== "start" ? response() : null;
    attempt = result;
    pending = null;
    try { if (action !== "start") localStorage.removeItem(draftKey()); } catch { /* database save succeeded */ }
    dirty = false;
    if (action === "submit") {
      state = await api("/api/session", {});
      attempt = state.attempt;
      closeDrawers();
    }
    campaignView = false;
    renderAttempt();
    if (newerResponse && attempt.status === "draft") { fillResponse(newerResponse); retainDraft(); }
    if (action === "hint") { $("#hints").lastElementChild?.scrollIntoView({block: "nearest"}); $("#drawer-hint").hidden = false; }
    if (action === "start") { $("#workspace").focus(); window.scrollTo({top: 0}); }
    if (action === "submit") { const target = attempt?.snapshot?.expedition ? $("#expedition") : $("#recap"); target.focus(); target.scrollIntoView({block: "start"}); }
    setSaveState(dirty ? "New edits retained · save again when ready" : attempt.status === "submitted" ? "Mission result retained" : hosted ? "Progress saved to your account" : "Progress saved to local database", dirty ? "dirty" : "saved");
    return true;
  } catch (error) {
    if (error.status && error.status < 500) pending = null;
    if (hosted && error.status === 401) showSignIn();
    showError(`${error.status ? error.message : "The connection was interrupted before saving could be confirmed"}. Your visible answer is retained. Retry when ready.`);
    setSaveState("Not saved · answer retained", "error");
    return false;
  } finally {
    busy = false;
    document.querySelectorAll("button").forEach(button => { button.disabled = false; });
    for (const id of inputIds) $(`#${id}`).disabled = attempt?.status === "submitted";
    syncControls();
    renderCampaign();
  }
}
function syncControls() {
  Expedition.sync(busy, attempt);
  if (!attempt) {
    $("#dock-hint").disabled = true;
    $("#dock-source").disabled = true;
    $("#dock-mode").disabled = true;
    $("#dock-save").disabled = true;
    return;
  }
  const snapshot = attempt.snapshot;
  const meta = snapshot.mission || {};
  const hintTotal = missionHintTotal(snapshot);
  const used = attempt.hints.length;
  $("#hint").hidden = attempt.status === "submitted" || used >= hintTotal;
  $("#hint-limit").hidden = used < hintTotal;
  $("#hint").textContent = used < hintTotal ? `Reveal hint ${used + 1} / ${hintTotal}` : "All hints revealed";
  $("#dock-hint-label").textContent = hintTotal ? `Hint ${used}/${hintTotal}` : "Hint";
  $("#dock-hint").disabled = attempt.status === "submitted" || used >= hintTotal;
  const sourceEnabled = meta.source_enabled ?? true;
  $("#dock-source").hidden = !sourceEnabled;
  $("#source").disabled = !attempt.source_allowed;
  $("#source").hidden = !sourceEnabled || Boolean(attempt.source);
  $("#dock-save").disabled = attempt.status === "submitted";
  configureModes(meta, attempt.mode);
  renderPredictionBoard(snapshot);
}
function renderAttempt() {
  if (!attempt?.snapshot?.expedition) Expedition.hide();
  if (campaignView) { showCampaign(); return; }
  $("#entry").hidden = Boolean(attempt);
  $("#episode").hidden = !attempt || attempt.status === "submitted";
  $("#recap").hidden = !attempt || attempt.status !== "submitted";
  if (!attempt) { renderCampaign(); updateHud(); syncControls(); return; }
  const snapshot = attempt.snapshot;
  const meta = snapshot.mission || {};
  for (const key of ["intro", "assumptions", "prompt"]) $(`#${key}`).textContent = snapshot[key];
  $("#scene-title").textContent = snapshot.title;
  $("#objective-text").textContent = meta.plain_objective || meta.objective || "Predict the outcome and explain the retry contract.";
  renderStory(snapshot);
  $("#trace-caption").textContent = meta.id ? `${snapshot.trace.length} purchase case${snapshot.trace.length === 1 ? "" : "s"} · the tickets below are what the store can see` : `${snapshot.trace.length} pinned run${snapshot.trace.length === 1 ? "" : "s"} · deterministic retry model`;
  $("#traces").replaceChildren(...snapshot.trace.map(trace => {
    const tr = document.createElement("tr");
    for (const text of [`${trace.label} · ${trace.name}`, `${trace.first} → ${trace.retry}`, trace.elapsed_seconds < 3600 ? `${trace.elapsed_seconds} seconds` : `${Math.round(trace.elapsed_seconds / 3600)} hours`]) {
      const td = document.createElement("td"); td.textContent = text; tr.append(td);
    }
    return tr;
  }));
  $("#mode-label").textContent = attempt.mode;
  $("#mode-description").textContent = snapshot.mode_contracts[attempt.mode].description;
  fillResponse(attempt.response);
  const currentHelp = attempt.assistance.filter(event => event.affects_independence && event.kind !== "prior_family_exposure");
  const priorExposure = attempt.assistance.some(event => event.kind === "prior_family_exposure");
  $("#assistance-status").textContent = currentHelp.length ? "Help used in this run · that exposure stays attached to the evidence." : priorExposure ? "Previously exposed to this mission family · not counted as help used in this run." : "No in-game assistance revealed.";
  $("#hints").replaceChildren(...attempt.hints.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
  $("#worked-example").hidden = !attempt.worked_example;
  $("#worked-example").textContent = attempt.worked_example ? `Worked example · ${attempt.worked_example}` : "";
  const sourceEnabled = meta.source_enabled ?? true;
  $("#source-gate").textContent = !sourceEnabled ? "Intel sources unlock in later levels." : attempt.source ? "Intel revealed. This exposure stays recorded with the run." : attempt.source_allowed ? "Reveal the source when you want more context; doing so records assistance." : "Intel unlocks after this clear in LEARN, or earlier in an assisted play style.";
  $("#source-panel").hidden = !attempt.source;
  if (attempt.source) {
    $("#source-summary").textContent = attempt.source.summary;
    $("#source-link").href = attempt.source.url;
    $("#source-access").textContent = "External reading opens in a new tab; reading outside the game is not observed.";
  }
  $("#diagnosis-wrap").hidden = meta.requires_diagnosis === false;
  $("#reflection-title").textContent = meta.requires_diagnosis === false ? "Rule unlocked" : "Your reasoning stays yours";
  $("#reflection-copy").textContent = meta.number === 1 ? "The store remembers the purchase ticket, so the retry returns the old result instead of charging again. Engineers call this idempotent retry behavior." : meta.number === 2 ? "The human intent stayed the same, but the ticket changed. The store therefore sees a new purchase and charges again." : meta.number === 3 ? "Keeping the same ticket helps only while the store still remembers it. A very late retry needs an explicit recovery rule." : "A safe shopping agent needs one stable ID for the human's purchase intent, rules for changed purchase details, a known memory window, and a safe way to resolve very late uncertainty.";
  updateHud(snapshot);
  syncControls();
  const submitted = attempt.status === "submitted";
  $("#diagnosis").disabled = submitted;
  $("#aid-declaration").disabled = submitted;
  $("#save").hidden = submitted;
  $("#submit").hidden = submitted;
  if (snapshot.expedition) {
    $("#episode").hidden = true; $("#recap").hidden = true;
    Expedition.render(attempt, expeditionHandlers());
    Expedition.sync(busy, attempt);
    return;
  }
  if (submitted) {
    const result = attempt.assessment;
    const cleared = result.outcome === "correct";
    setSaveState("Mission result retained", "saved");
    $("#recap-kicker").textContent = cleared ? "MISSION CLEAR" : "MISSION RETRY";
    $("#recap-title").textContent = `${result.correct_count} of ${result.total_count || snapshot.trace.length} outcomes correct`;
    $("#evidence-condition").textContent = result.independence.replaceAll("_", " ");
    $("#recap-scope").textContent = result.scope;
    $("#feedback-rows").replaceChildren(...result.rows.map(row => {
      const div = document.createElement("div"); div.className = "feedback-row";
      const heading = document.createElement("strong"); heading.textContent = `${row.run} · ${row.correct ? "CLEAR" : "RETRY"} · ${row.expected} total charge${row.expected === 1 ? "" : "s"}`;
      const description = document.createElement("p"); description.textContent = `You chose ${row.actual}. ${row.reason}`;
      div.append(heading, description); return div;
    }));
    $("#reasoning-status").textContent = meta.requires_diagnosis === false ? "This early level checks only the pinned outcome choice." : result.reasoning.message;
    $("#review-target").textContent = attempt.review.frame.name;
    $("#review-due").textContent = `Recall quest after ${new Date(attempt.review.due_at).toLocaleString([], {dateStyle: "medium", timeStyle: "short"})}`;
    $("#evidence-meta").textContent = `Partial practice · mastery provisional · ${snapshot.validation.basis}`;
    if (cleared) {
      $("#reward-message").textContent = attempt.reward ? `+${attempt.reward} XP · Level ${meta.number || "prototype"} clear` : "Replay clear · no duplicate XP";
      $("#repeat").textContent = "Continue campaign →";
    } else {
      $("#reward-message").textContent = attempt.reward ? `+${attempt.reward} practice XP · attempt recorded · level not cleared` : "Attempt recorded · level not cleared";
      $("#repeat").textContent = "Retry mission →";
    }
    $("#checkpoint-list").replaceChildren(...attempt.checkpoints.map(checkpoint => {
      const section = document.createElement("section"); section.className = "checkpoint";
      const heading = document.createElement("h3"); heading.textContent = checkpoint.kind.replaceAll("_", " ");
      const answer = document.createElement("p"); answer.textContent = `Prediction: ${checkpoint.response.prediction || "No answer yet"} · ${(checkpoint.assessment.independence || "not observed").replaceAll("_", " ")}`;
      const diagnosis = document.createElement("p"); diagnosis.textContent = checkpoint.response.diagnosis || "No written diagnosis required.";
      const helpCount = checkpoint.assistance.filter(event => event.affects_independence && event.kind !== "prior_family_exposure").length;
      const exposed = checkpoint.assistance.some(event => event.kind === "prior_family_exposure");
      const condition = document.createElement("small"); condition.textContent = `${checkpoint.mode} · ${helpCount} help event${helpCount === 1 ? "" : "s"}${exposed ? " · previously exposed" : ""} · ${checkpoint.assessment.outcome}`;
      section.append(heading, answer, diagnosis, condition); return section;
    }));
    $("#evidence-json").textContent = JSON.stringify({evidence: attempt.evidence, assessment: result, checkpoints: attempt.checkpoints}, null, 2);
  }
}
function showSignIn() {
  Expedition.hide();
  campaignView = false;
  closeDrawers();
  $("#sign-in").hidden = false;
  $("#entry").hidden = true;
  $("#episode").hidden = true;
  $("#recap").hidden = true;
  $("#sign-out").hidden = true;
}
async function boot() {
  try {
    const config = await api("/api/config"); hosted = config.hosted;
    state = await api("/api/session", {}); attempt = state.attempt;
    $("#sign-in").hidden = true;
    $("#sign-out").hidden = !hosted;
    campaignView = !attempt || (attempt.status === "submitted" && (!LEGACY_VIEW || !attempt.snapshot.mission));
    renderCampaign();
    renderAttempt();
    if (attempt?.status === "draft") {
      let draft = null;
      try { draft = JSON.parse(localStorage.getItem(draftKey()) || "null"); }
      catch { showError("Recovery storage is unavailable. Your database progress is still loaded."); }
      if (draft && JSON.stringify(draft.response) !== JSON.stringify(attempt.response)) {
        fillResponse(draft.response);
        dirty = true;
        showError("Recovered unsaved progress from this device. Review it before saving; another tab may have a different version.");
        setSaveState("Recovered local progress", "dirty");
        $("#dock-save").disabled = false;
        Expedition.sync(busy, attempt);
      } else setSaveState(hosted ? "Resumed from your account" : "Resumed from local database", "saved");
    }
    try { await api("/api/health", undefined, 12000); } catch { /* health is diagnostic only */ }
    return true;
  } catch (error) {
    if (hosted && error.status === 401) { showSignIn(); return false; }
    showError(`Could not open the campaign: ${error.message}. Reload to retry.`);
    return false;
  }
}

$("#campaign-button").addEventListener("click", showCampaign);
$("#return-to-run").addEventListener("click", showRun);
$("#start").addEventListener("click", () => send("start", {mode: $("#start-mode").value, mission_id: selectedMissionId}));
$("#start-mode").addEventListener("change", () => { $("#entry-mode-description").textContent = state.modes[$("#start-mode").value]?.description || ""; });
$("#hint").addEventListener("click", () => send("hint"));
$("#source").addEventListener("click", () => send("source"));
$("#switch-mode").addEventListener("click", () => send("mode", {mode: $("#working-mode").value}));
$("#repeat").addEventListener("click", showCampaign);
$("#submit").addEventListener("click", () => send("submit"));
$("#save").addEventListener("click", () => send("save"));
$("#dock-save").addEventListener("click", () => send("save"));
$("#dock-hint").addEventListener("click", event => toggleDrawer("drawer-hint", event.currentTarget));
$("#dock-source").addEventListener("click", event => toggleDrawer("drawer-source", event.currentTarget));
$("#dock-mode").addEventListener("click", event => toggleDrawer("drawer-mode", event.currentTarget));
for (const button of document.querySelectorAll(".drawer-close")) button.addEventListener("click", closeDrawers);
$("#answer-form").addEventListener("submit", event => event.preventDefault());
for (const id of ["diagnosis", "aid-declaration"]) $(`#${id}`).addEventListener("input", retainDraft);
window.addEventListener("beforeunload", event => { if (busy) { event.preventDefault(); event.returnValue = ""; } });

if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  window.addEventListener("pagehide", () => lifecycle.abort(), {once: true});
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: "save_current_learning_draft",
      title: "Save current mission progress",
      description: "Save the answer currently visible in the active mission. Does not submit, grade or reveal help.",
      inputSchema: {type: "object", properties: {}, additionalProperties: false},
      annotations: {readOnlyHint: false},
      async execute(input) {
        if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length || !attempt || attempt.status !== "draft" || busy) throw new Error("An active idle mission and empty input object are required.");
        if (!await send("save")) throw new Error("Progress save failed. Visible answer retained.");
        return {attempt_id: attempt.id, revision: attempt.revision, status: "saved"};
      }
    }, {signal: lifecycle.signal})).catch(() => {});
  } catch { /* optional browser feature */ }
}
function setPasswordVisibility(button, visible) {
  const input = document.getElementById(button.dataset.passwordToggle);
  if (!input) return;
  input.type = visible ? "text" : "password";
  button.textContent = visible ? "Hide password" : "Show password";
  button.setAttribute("aria-pressed", String(visible));
}
function hidePassword(inputId) {
  const button = document.querySelector(`[data-password-toggle="${inputId}"]`);
  if (button) setPasswordVisibility(button, false);
}
document.querySelectorAll("[data-password-toggle]").forEach(button => button.addEventListener("click", () => {
  const input = document.getElementById(button.dataset.passwordToggle);
  setPasswordVisibility(button, input?.type === "password");
}));
$("#sign-in-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $('#sign-in-form button[type="submit"]');
  button.disabled = true;
  clearError();
  hidePassword("login-password");
  try {
    await api("/api/auth/login", {email: $("#login-email").value, password: $("#login-password").value});
    $("#login-password").value = "";
    await boot();
  } catch (error) {
    if (!error.status && await boot()) { clearError(); $("#login-password").value = ""; return; }
    showError((error.message || "Sign-in failed. Please retry.") + (error.requestId ? ` Reference: ${error.requestId}` : ""));
  } finally { button.disabled = false; }
});
$("#sign-out").addEventListener("click", async () => {
  if (busy) return;
  if (dirty) { showError("Save your mission progress before signing out."); return; }
  try { await api("/api/auth/logout", {}); }
  catch (error) { if (error.status !== 401) { showError(error.message); return; } }
  state = null; attempt = null; pending = null; selectedMissionId = null;
  $("#evidence-json").textContent = "";
  $("#checkpoint-list").replaceChildren();
  clearError();
  showSignIn();
});
const recoveryFragment = new URLSearchParams(location.hash.slice(1));
let recovery = recoveryFragment.get("type") === "recovery" ? {access_token: recoveryFragment.get("access_token"), refresh_token: recoveryFragment.get("refresh_token")} : null;
if (recoveryFragment.has("access_token") || recoveryFragment.has("error")) history.replaceState(null, "", location.pathname);
recoveryFragment.delete("access_token"); recoveryFragment.delete("refresh_token");
$("#request-reset").addEventListener("click", async () => {
  if (!$("#login-email").reportValidity()) return;
  const button = $("#request-reset"); button.disabled = true;
  try { const result = await api("/api/auth/request-reset", {email: $("#login-email").value}); showError(result.message); }
  catch (error) { showError(error.message + (error.requestId ? ` Reference: ${error.requestId}` : "")); }
  finally { button.disabled = false; }
});
$("#reset-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $('#reset-form button[type="submit"]'); button.disabled = true; hidePassword("new-password");
  try {
    if (!recovery?.access_token || !recovery?.refresh_token) throw new Error("Request a new reset link.");
    await api("/api/auth/reset-password", {...recovery, password: $("#new-password").value});
    recovery = null; $("#new-password").value = ""; $("#password-reset").hidden = true;
    await boot(); showError("Password updated. Sign in with your new password.");
  } catch (error) { $("#reset-status").textContent = error.message + (error.requestId ? ` Reference: ${error.requestId}` : ""); }
  finally { button.disabled = false; }
});
if (recovery) $("#password-reset").hidden = false;
else boot().then(() => { if (recoveryFragment.has("error")) showError("This reset link has expired or is invalid. Request a new link."); });