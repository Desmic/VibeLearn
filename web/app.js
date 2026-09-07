"use strict";
const $ = (selector) => document.querySelector(selector);
let hosted = false;
let state = null;
let attempt = null;
let busy = false;
let pending = null;
let editVersion = 0;
let dirty = false;
function showError(message) { $("#notice").textContent = message; $("#notice").hidden = false; }
function clearError() { $("#notice").hidden = true; }
function draftKey() { return `learning-draft:${state.learner_id}:${attempt.id}`; }
function response() { return { prediction: $("#prediction").value, diagnosis: $("#diagnosis").value, aid_declaration: $("#aid-declaration").value }; }
function fillResponse(value) { $("#prediction").value = value.prediction; $("#diagnosis").value = value.diagnosis; $("#aid-declaration").value = value.aid_declaration; }
function retainDraft() {
  dirty = true; editVersion += 1;
  if (!attempt || attempt.status !== "draft") return;
  try { localStorage.setItem(draftKey(), JSON.stringify({ response: response(), revision: attempt.revision })); }
  catch { showError("Browser recovery storage is unavailable. Keep this tab open and use Save draft."); }
  $("#save-status").textContent = "Unsaved changes · retained on this device";
}
async function api(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const result = await fetch(path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json", "X-Learning-Command": "1" } : {}, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    const data = await result.json();
    if (!result.ok) { const error = new Error(data.message || data.error); error.status = result.status; error.requestId = data.request_id; throw error; }
    return data;
  } finally { clearTimeout(timeout); }
}
async function send(action, extra = {}) {
  if (busy) return false;
  busy = true; clearError();
  document.querySelectorAll("button").forEach(button => { button.disabled = true; });
  const body = { command_id: crypto.randomUUID(), expected_revision: action === "start" ? 0 : attempt?.revision || 0, ...extra };
  if (action !== "start") { body.attempt_id = attempt.id; body.response = response(); retainDraft(); }
  const signature = JSON.stringify({action, ...body, command_id: undefined});
  if (pending?.signature === signature) body.command_id = pending.command_id;
  pending = {signature, command_id: body.command_id};
  const sentEditVersion = editVersion;
  const inputIds = ["prediction", "diagnosis", "aid-declaration"];
  if (["hint", "mode", "source", "submit"].includes(action)) inputIds.forEach(id => { $(`#${id}`).disabled = true; });
  try {
    const result = await api(`/api/commands/${action}`, body);
    const newerResponse = editVersion !== sentEditVersion ? response() : null;
    attempt = result;
    pending = null;
    try { localStorage.removeItem(draftKey()); } catch { /* Database save already succeeded. */ }
    dirty = false;
    renderAttempt();
    if (newerResponse && attempt.status === "draft") { fillResponse(newerResponse); retainDraft(); }
    if (action === "hint") $("#hints").lastElementChild?.scrollIntoView({block: "nearest"});
    if (action === "start") { $("#workspace").focus(); $("#workspace").scrollIntoView({block: "start"}); }
    if (action === "submit") { $("#recap").focus(); $("#recap").scrollIntoView({block: "start"}); }
    $("#save-status").textContent = dirty ? "New edits retained · save again when ready" : attempt.status === "submitted" ? "Submission retained" : (hosted ? "Saved to your account" : "Saved to local database");
    return true;
  } catch (error) {
    if (error.status && error.status < 500) pending = null;
    if (hosted && error.status === 401) showSignIn();
    showError(`${error.message || "Connection failed"}. Your answer is retained on this device. Retry when ready.`);
    $("#save-status").textContent = "Not saved · answer retained";
    return false;
  } finally {
    busy = false;
    document.querySelectorAll("button").forEach(button => { button.disabled = false; });
    for (const id of inputIds) $(`#${id}`).disabled = attempt?.status === "submitted";
    syncControls();
  }
}
function syncControls() {
  if (!attempt) return;
  $("#hint").hidden = attempt.status === "submitted" || attempt.hints.length >= 3;
  $("#hint-limit").hidden = attempt.hints.length < 3;
  $("#mode-controls").hidden = attempt.status === "submitted";
  $("#source").disabled = !attempt.source_allowed;
  $("#source").hidden = Boolean(attempt.source);
}
function renderAttempt() {
  $("#entry").hidden = Boolean(attempt); $("#episode").hidden = !attempt;
  if (!attempt) return;
  const snapshot = attempt.snapshot;
  for (const key of ["intro", "assumptions", "prompt"]) $(`#${key}`).textContent = snapshot[key];
  $("#traces").replaceChildren(...snapshot.trace.map(trace => {
    const tr = document.createElement("tr");
    for (const text of [`${trace.label} · ${trace.name}`, `${trace.first} → ${trace.retry}`, trace.elapsed_seconds === 30 ? "30 seconds" : "48 hours"]) {
      const td = document.createElement("td"); td.textContent = text; tr.append(td);
    }
    return tr;
  }));
  $("#mode-label").textContent = attempt.mode;
  $("#mode-description").textContent = snapshot.mode_contracts[attempt.mode].description;
  fillResponse(attempt.response);
  $("#working-mode").value = attempt.mode;
  $("#assistance-status").textContent = attempt.assistance.some(event => event.affects_independence) ? "Assisted practice · help stays recorded when you change mode." : "No in-workspace help revealed.";
  $("#hints").replaceChildren(...attempt.hints.map(text => { const li = document.createElement("li"); li.textContent = text; return li; }));
  $("#hint").textContent = `Reveal hint ${attempt.hints.length + 1} of 3`;
  $("#worked-example").hidden = !attempt.worked_example;
  $("#worked-example").textContent = attempt.worked_example ? `Worked example · ${attempt.worked_example}` : "";
  $("#source-gate").textContent = attempt.source ? "Already revealed. This source exposure stays recorded when you change modes." : attempt.source_allowed ? "Opening this companion records a source exposure. External reading is not observed." : "LEARN keeps the source closed until submission. Switch to PAIR if you want to read it now.";
  $("#source-panel").hidden = !attempt.source;
  if (attempt.source) {
    $("#source-summary").textContent = attempt.source.summary;
    $("#source-link").href = attempt.source.url;
    $("#source-access").textContent = "External article · opens in a new tab. Reading outside this workspace is not observed.";
  }
  $("#practice-label").textContent = attempt.practice_xp ? `${attempt.practice_xp} practice XP · keep going thoughtfully.` : "A little practice, well spent.";
  syncControls();
  const submitted = attempt.status === "submitted";
  for (const id of ["prediction", "diagnosis", "aid-declaration"]) $(`#${id}`).disabled = submitted;
  $("#save").hidden = submitted; $("#submit").hidden = submitted;
  $("#recap").hidden = !submitted;
  $("#step-task").classList.toggle("current", !submitted);
  $("#step-recap").classList.toggle("current", submitted);
  if (submitted) {
    const result = attempt.assessment;
    $("#save-status").textContent = "Submission retained";
    $("#recap-title").textContent = `${result.correct_count} of 3 trace predictions match`;
    $("#evidence-condition").textContent = result.independence.replaceAll("_", " ");
    $("#recap-scope").textContent = result.scope;
    $("#feedback-rows").replaceChildren(...result.rows.map(row => {
      const div = document.createElement("div"); div.className = "feedback-row";
      const heading = document.createElement("strong"); heading.textContent = `${row.run} · ${row.correct ? "Matches" : "Revisit"} · ${row.expected} total charge${row.expected === 1 ? "" : "s"}`;
      const description = document.createElement("p"); description.textContent = `You predicted ${row.actual}. ${row.reason}`;
      div.append(heading, description); return div;
    }));
    $("#reasoning-status").textContent = result.reasoning.message;
    $("#review-target").textContent = attempt.review.frame.name;
    $("#review-due").textContent = `Review after ${new Date(attempt.review.due_at).toLocaleString([], {dateStyle: "medium", timeStyle: "short"})}`;
    $("#evidence-meta").textContent = `Partial practice · mastery provisional · ${snapshot.validation.basis}`;
    $("#reward-message").textContent = attempt.reward ? `+${attempt.reward} practice XP · first episode completed` : "Familiar practice, retained for reflection";
    $("#checkpoint-list").replaceChildren(...attempt.checkpoints.map(checkpoint => {
      const section = document.createElement("section"); section.className = "checkpoint";
      const heading = document.createElement("h3"); heading.textContent = checkpoint.kind.replaceAll("_", " ");
      const answer = document.createElement("p"); answer.textContent = `Prediction: ${checkpoint.response.prediction || "No answer yet"} · ${checkpoint.assessment.independence || "not observed"}`;
      const diagnosis = document.createElement("p"); diagnosis.textContent = checkpoint.response.diagnosis || "No diagnosis yet.";
      const condition = document.createElement("small"); condition.textContent = `${checkpoint.mode} · ${checkpoint.assistance.filter(event => event.affects_independence).length} recorded aids at this checkpoint · ${checkpoint.assessment.outcome}`;
      section.append(heading, answer, diagnosis, condition); return section;
    }));
    $("#evidence-json").textContent = JSON.stringify({evidence: attempt.evidence, assessment: result, checkpoints: attempt.checkpoints}, null, 2);
  }
}
function showSignIn() {
  $("#sign-in").hidden = false;
  $("#entry").hidden = true; $("#episode").hidden = true; $("#recap").hidden = true;
  $("#sign-out").hidden = true;
}
async function boot() {
  try {
    const config = await api("/api/config"); hosted = config.hosted;
    $("#hosting-label").textContent = hosted ? "PRIVATE PILOT" : "LOCAL · PRIVATE";
    $("#space-label").textContent = hosted ? "Private learning space" : "Local learning space";
    state = await api("/api/session", {}); attempt = state.attempt;
    $("#sign-in").hidden = true; $("#sign-out").hidden = !hosted;
    renderAttempt();
    $("#entry-mode-description").textContent = state.modes[$("#start-mode").value].description;
    if (attempt?.status === "draft") {
      let draft = null;
      try { draft = JSON.parse(localStorage.getItem(draftKey()) || "null"); } catch { showError("Browser recovery storage is unavailable. Your database draft is still loaded."); }
      if (draft && Object.keys(attempt.response).some(key => draft.response[key] !== attempt.response[key])) {
        fillResponse(draft.response); dirty = true;
        showError("Recovered an unsaved answer from this device. Review it before saving; another tab may have a different version.");
        $("#save-status").textContent = "Recovered local draft";
      } else $("#save-status").textContent = (hosted ? "Resumed from your account" : "Resumed from local database");
    }
    const health = await api("/api/health");
    $("#build-label").textContent = `vibeLearn · ${health.version}`;
  } catch (error) {
    if (hosted && error.status === 401) { showSignIn(); return; }
    showError(`Could not open the workspace: ${error.message}. Reload to retry.`);
  }
}
$("#start").addEventListener("click", () => send("start", {mode: $("#start-mode").value}));
$("#start-mode").addEventListener("change", () => { $("#entry-mode-description").textContent = state.modes[$("#start-mode").value].description; });
$("#hint").addEventListener("click", () => send("hint"));
$("#source").addEventListener("click", () => send("source"));
$("#switch-mode").addEventListener("click", () => send("mode", {mode: $("#working-mode").value}));
$("#repeat").addEventListener("click", () => send("start", {mode: attempt.mode}));
$("#submit").addEventListener("click", () => send("submit"));
$("#save").addEventListener("click", () => send("save"));
$("#answer-form").addEventListener("submit", event => event.preventDefault());
for (const id of ["prediction", "diagnosis", "aid-declaration"]) $(`#${id}`).addEventListener("input", retainDraft);
window.addEventListener("beforeunload", event => { if (busy) { event.preventDefault(); event.returnValue = ""; } });
// Optional WebMCP: the exact same save action, never an alternate grading path.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  window.addEventListener("pagehide", () => lifecycle.abort(), {once: true});
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: "save_current_learning_draft", title: "Save current learning draft",
      description: "Save the text currently visible in the learner's draft. Does not submit, grade or reveal help.",
      inputSchema: {type: "object", properties: {}, additionalProperties: false},
      annotations: {readOnlyHint: false},
      async execute(input) {
        if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length || !attempt || attempt.status !== "draft" || busy) throw new Error("An active idle draft and empty input object are required.");
        if (!await send("save")) throw new Error("Draft save failed. Visible answer retained.");
        return {attempt_id: attempt.id, revision: attempt.revision, status: "saved"};
      }
    }, {signal: lifecycle.signal})).catch(() => {});
  } catch { /* Optional browser feature; normal UI remains available. */ }
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
document.querySelectorAll("[data-password-toggle]").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    setPasswordVisibility(button, input?.type === "password");
  });
});
$("#sign-in-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $('#sign-in-form button[type="submit"]'); button.disabled = true; clearError(); hidePassword("login-password");
  try {
    await api("/api/auth/login", {email: $("#login-email").value, password: $("#login-password").value});
    $("#login-password").value = "";
    await boot();
  } catch (error) { showError((error.message || "Sign-in failed. Please retry.") + (error.requestId ? ` Reference: ${error.requestId}` : "")); }
  finally { button.disabled = false; }
});
$("#sign-out").addEventListener("click", async () => {
  if (busy) return;
  if (dirty) { showError("Save your draft before signing out."); return; }
  try {
    await api("/api/auth/logout", {});
  } catch (error) { if (error.status !== 401) { showError(error.message); return; } }
  state = null; attempt = null; pending = null;
  fillResponse({prediction: "", diagnosis: "", aid_declaration: "unknown"});
  $("#evidence-json").textContent = ""; $("#checkpoint-list").replaceChildren();
  $("#practice-label").textContent = "A little practice, well spent.";
  clearError(); showSignIn();
});
// Supabase recovery tokens stay in memory only; remove them from the address bar.
const recoveryFragment = new URLSearchParams(location.hash.slice(1));
let recovery = recoveryFragment.get("type") === "recovery" ? {
  access_token: recoveryFragment.get("access_token"), refresh_token: recoveryFragment.get("refresh_token")
} : null;
if (recoveryFragment.has("access_token") || recoveryFragment.has("error")) history.replaceState(null, "", location.pathname);
recoveryFragment.delete("access_token"); recoveryFragment.delete("refresh_token");
$("#request-reset").addEventListener("click", async () => {
  if (!$("#login-email").reportValidity()) return;
  const button = $("#request-reset"); button.disabled = true;
  try {
    const result = await api("/api/auth/request-reset", {email: $("#login-email").value});
    showError(result.message);
  } catch (error) { showError(error.message + (error.requestId ? ` Reference: ${error.requestId}` : "")); }
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
else {
  boot().then(() => { if (recoveryFragment.has("error")) showError("This reset link has expired or is invalid. Request a new link."); });
}
