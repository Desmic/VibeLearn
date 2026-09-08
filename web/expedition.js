/* The scene is presentation; Python replays every move and owns clears/evidence. */
"use strict";
window.Expedition = (() => {
  let game = {moves: [], policy: {}}, root, callbacks = {}, current = null, sound = false, audio;
  const labels = {send: "Send the order", retry: "Resend this ticket", restart: "Restart Pip", restore: "Use journal ticket", new_ticket: "Try a new ticket", wait: "Wait out the storm", inspect: "Check order register", collect: "Collect the gear", rewind: "Rewind rehearsal", test: "Run storm tests"};
  const icons = {send: "↗", retry: "↻", restart: "⏻", restore: "▤", new_ticket: "+", wait: "◷", inspect: "⌕", collect: "✦", rewind: "↶", test: "▷"};
  const knowledge = {not_sent: "Order not sent", unknown: "? No confirmation", confirmed: "✓ Gear confirmed", absent: "✓ Order proven absent", policy: "Rules under test"};
  const esc = text => String(text).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));
  function ensure() {
    if (!root) {
      root = document.createElement("section"); root.id = "expedition"; root.tabIndex = -1;
      document.querySelector("#workspace").append(root);
      try { sound = localStorage.getItem("expedition-sound") === "on"; } catch { /* optional preference */ }
    }
    root.hidden = false; document.body.classList.add("expedition-active");
    return root;
  }
  function hide() { if (root) root.hidden = true; document.body.classList.remove("expedition-active"); }
  function setResponse(value) { game = structuredClone(value || {moves: [], policy: {}}); }
  function response() { return structuredClone(game); }
  function tone(success = false) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
      for (const [i, f] of (success ? [392, 494, 587] : [330]).entries()) {
        const o = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + i * .09;
        o.type = "sine"; o.frequency.value = f; gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.035, start + .01); gain.gain.exponentialRampToValueAtTime(.001, start + .18);
        o.connect(gain); gain.connect(audio.destination); o.start(start); o.stop(start + .2);
      }
    } catch { /* visual feedback always carries the same meaning */ }
  }
  function preferences() {
    return `<div class="exp-preferences"><button type="button" id="exp-sound" aria-pressed="${sound}">${sound ? "Sound on" : "Sound off"}</button><button type="button" id="exp-xp" aria-pressed="${document.body.classList.contains("xp-hidden")}">Hide XP</button></div>`;
  }
  function bindPreferences() {
    root.querySelector("#exp-sound").onclick = event => {
      sound = !sound; event.currentTarget.textContent = sound ? "Sound on" : "Sound off"; event.currentTarget.setAttribute("aria-pressed", String(sound));
      try { localStorage.setItem("expedition-sound", sound ? "on" : "off"); } catch { /* optional */ }
      if (sound) tone();
    };
    const button = root.querySelector("#exp-xp");
    const refresh = () => { const hidden = document.body.classList.contains("xp-hidden"); button.textContent = hidden ? "Show XP" : "Hide XP"; button.setAttribute("aria-pressed", String(hidden)); };
    refresh(); button.onclick = () => { document.body.classList.toggle("xp-hidden"); refresh(); };
  }
  function world(state = {}, ending = false) {
    const parts = state.parts || 0;
    const move = state.trail?.at(-1)?.action || "";
    return `<div class="exp-world ${ending ? "is-restored" : ""}" data-last-move="${esc(move)}">
      <svg viewBox="0 0 1200 470" role="img" aria-label="${ending ? "The bridge is repaired. Pip can reach the lantern village." : "Pip waits beside a broken bridge. The workshop is across the valley."}">
       <defs>
        <linearGradient id="exp-sky" x2="0" y2="1"><stop stop-color="#18324b"/><stop offset="1" stop-color="#629695"/></linearGradient>
        <linearGradient id="exp-river" x2="0" y2="1"><stop stop-color="#6cb4b0"/><stop offset="1" stop-color="#174552"/></linearGradient>
        <radialGradient id="exp-light"><stop stop-color="#ffe7a3" stop-opacity=".8"/><stop offset="1" stop-color="#ffcc65" stop-opacity="0"/></radialGradient>
        <g id="exp-gear"><path d="M-8-22H8L10-15L16-18L23-8L18-3L22 3L17 15L10 14L6 22H-6L-10 14L-17 15L-22 3L-18-3L-23-8L-16-18L-10-15Z" fill="#e8b86d" stroke="#553a32" stroke-width="3"/><circle r="7" fill="#263e4a"/></g>
       </defs>
       <rect width="1200" height="470" fill="url(#exp-sky)"/>
       <circle cx="990" cy="80" r="36" fill="#eee7c5" opacity=".92"/>
       <g fill="#e8dfb6" opacity=".8"><circle cx="100" cy="62" r="2"/><circle cx="310" cy="90" r="2"/><circle cx="540" cy="55" r="2"/><circle cx="780" cy="95" r="2"/><circle cx="1140" cy="44" r="2"/><circle cx="675" cy="33" r="2"/></g>
       <path d="M0 235L145 105L320 256L438 127L610 241L733 85L924 242L1097 114L1200 222V470H0Z" fill="#315569"/>
       <path d="M100 149L145 105L199 154L164 139L147 145L132 135Z M682 151L733 85L807 155L755 134L736 143L719 126Z" fill="#91aba8" opacity=".8"/>
       <path d="M0 300L140 224L300 311L443 226L590 334L720 227L900 304L1070 226L1200 300V470H0Z" fill="#3c7276"/>
       <path d="M595 265C730 317 445 355 685 470H952C690 363 864 331 672 265Z" fill="url(#exp-river)"/>
       <path d="M0 295Q176 260 355 284L485 315L456 364L476 407L398 470H0Z" fill="#243d43"/>
       <path d="M0 294Q176 261 354 284L483 314L461 331Q280 295 0 323Z" fill="#73a08c"/>
       <path d="M819 309L890 285Q1049 258 1200 278V470H858L830 401L850 358Z" fill="#243d43"/>
       <path d="M819 309L890 285Q1049 258 1200 278V302Q1038 284 873 308L845 331Z" fill="#73a08c"/>
       <g stroke="#1e363e" stroke-width="8"><path d="M60 182V291M112 193V290M1110 173V282M1156 195V278"/></g>
       <g fill="#274a4f"><path d="M24 218L60 130L96 218ZM75 226L112 155L146 226ZM1074 210L1110 120L1146 210ZM1124 228L1156 161L1188 228Z"/></g>
       <g class="exp-bridge" stroke="#c39a68" stroke-width="6" fill="none"><path d="M423 289Q650 353 880 290" stroke="#67564a"/>
        ${ending ? '<path d="M439 326Q650 365 858 326" stroke-width="18"/><path d="M451 311V340M481 317V345M511 325V350M541 329V354M571 333V357M601 336V361M631 337V361M661 337V361M691 336V360M721 333V357M751 329V353M781 323V349M811 316V343M840 310V339"/>' : '<path d="M430 326L485 340M810 340L869 326" stroke-width="16"/><path d="M479 342L490 375M817 340L804 370"/>'}
        <path d="M430 270V346M868 270V346" stroke-width="10"/>
       </g>
       <g class="exp-workshop"><rect x="933" y="202" width="120" height="97" rx="5" fill="#b19477"/><path d="M915 210L991 145L1072 210Z" fill="#3a4b57"/><rect x="1017" y="148" width="18" height="49" fill="#a28973"/><rect x="975" y="240" width="35" height="59" rx="18" fill="#294450"/><rect x="941" y="222" width="24" height="28" rx="4" fill="#f3d491"/><circle cx="953" cy="235" r="53" fill="url(#exp-light)"/>
        ${Array.from({length: Math.min(parts, 3)}, (_, i) => `<use href="#exp-gear" transform="translate(${931 + i * 51} 294) scale(.7)"/>`).join("")}
       </g>
       <g class="exp-pip" transform="translate(${ending ? 781 : 342} 272)"><ellipse cy="38" rx="35" ry="8" fill="#183038" opacity=".65"/><path d="M-17 14L-23 34M16 14L23 34" stroke="#e9c586" stroke-width="11" stroke-linecap="round"/><rect x="-25" y="-10" width="50" height="38" rx="13" fill="#e7b76b"/><path d="M-21 1L-47 9M24 0L41-12" stroke="#e7b76b" stroke-width="10" stroke-linecap="round"/><rect x="-28" y="-45" width="56" height="42" rx="17" fill="#efcf93"/><rect x="-22" y="-36" width="44" height="23" rx="10" fill="#193d49"/><circle cx="-9" cy="-25" r="4" fill="#9be1da"/><circle cx="9" cy="-25" r="4" fill="#9be1da"/><path d="M0-45V-57" stroke="#efcf93" stroke-width="4"/><circle cy="-60" r="5" fill="#92d6c8"/><path d="M-27-5L24-5L15 6L-24 3L-36 21L-43 14Z" fill="#c66852"/></g>
       <g transform="translate(225 289)"><path d="M-26 5L-19-34L10-40L31-20L27 12Z" fill="#6e5a47"/><path d="M-20-31L19-31L22 1L-22 4Z" fill="#e4cd9f"/><path d="M-11-18L13-19M-11-8L12-9" stroke="#8b765d" stroke-width="3"/></g>
       <g class="exp-message"><rect x="454" y="244" width="35" height="25" rx="3" fill="#f2dda8"/><path d="M454 244L471 258L489 244" fill="none" stroke="#8b725a" stroke-width="2"/></g>
       <g fill="#d7bd83"><circle cx="167" cy="271" r="3"/><circle cx="890" cy="267" r="3"/><circle cx="1049" cy="275" r="3"/></g>
      </svg>
      <span class="exp-place exp-home">PIP &amp; THE JOURNAL</span><span class="exp-place exp-forge">THE WORKSHOP</span>
      ${state.level && state.level !== 4 ? `<div class="exp-world-state"><span><small>What happened</small><strong id="exp-parts">${parts} gear${parts === 1 ? "" : "s"} made</strong></span><span><small>What Pip knows</small><strong id="exp-knowledge">${esc(knowledge[state.known] || state.known)}</strong></span></div>` : ""}
     </div>`;
  }
  function renderMap(missions, attempt, handlers) {
    ensure(); current = null; callbacks = handlers;
    const ready = missions.find(m => m.status === "unlocked") || missions.at(-1);
    const completed = missions.filter(m => m.status === "cleared").length;
    const active = attempt?.status === "draft";
    const ending = missions[3]?.status === "cleared";
    root.innerHTML = `<div class="exp-topline"><span>VIBELEARN / AN INTERACTIVE EXPEDITION</span>${preferences()}</div>
      <header class="exp-map-header"><p class="exp-kicker">CHAPTER ONE · THE MISSING DELIVERY</p><h1>${ending ? "The valley is open again." : "A bridge. A storm.<br>One missing gear."}</h1><p>${ending ? "Pip's bridge is repaired. Beyond it, a lookout lift has a different kind of missing order." : "Help a small courier get one gear across a very unreliable valley. Learn the rules by changing what happens."}</p></header>
      ${world({}, ending)}
      <nav class="exp-route" aria-label="Expedition route">${missions.map((m, i) => `<button type="button" data-exp-mission="${esc(m.id)}" data-status="${m.status}" ${m.status === "locked" ? "disabled" : ""}><span class="exp-route-node">${m.status === "cleared" ? "✓" : m.status === "locked" ? "◇" : i === 3 ? "✦" : i + 1}</span><span>${esc(m.title)}</span><small>${m.status === "locked" ? "Clear the previous stop" : m.status === "cleared" ? "Replay available" : m.difficulty}</small></button>`).join("")}</nav>
      <div class="exp-map-cta"><div><p class="exp-kicker">${completed} / ${missions.length} STOPS CLEARED</p><h2>${esc(active ? "Your expedition is saved." : ready?.title || "Explore again")}</h2><p>${esc(active ? "Return to the exact move you left. Your earlier evidence stays intact." : ready?.plain_objective || "")}</p></div><button type="button" class="exp-primary" id="exp-launch">${active ? "Resume saved run" : ending ? "Take the detour" : completed ? "Continue with Pip" : "Help Pip"}<span aria-hidden="true">↗</span></button></div>
      <details class="exp-notes"><summary>About this expedition &amp; earlier practice</summary><p>A bounded teaching simulation, not a real purchase system. Guided feedback is recorded as assistance; game progress does not prove mastery. Your historical shopping-agent attempts are unchanged.</p><a href="/?legacy=1">Open the original practice campaign</a></details>`;
    bindPreferences();
    root.querySelector("#exp-launch").onclick = () => active ? callbacks.resume() : callbacks.start(ready.id);
    for (const button of root.querySelectorAll("[data-exp-mission]")) button.onclick = () => active ? callbacks.resume() : callbacks.start(button.dataset.expMission);
  }
  function render(attempt, handlers) {
    ensure(); current = attempt; callbacks = handlers;
    const s = attempt.game_state, meta = attempt.snapshot.mission, submitted = attempt.status === "submitted";
    const clear = submitted && attempt.assessment.outcome === "correct";
    const ending = clear && s.level === 4;
    root.innerHTML = `<div class="exp-topline"><span>${esc(meta.difficulty.toUpperCase())} / STOP ${s.level} OF 5</span>${preferences()}</div>
      <header class="exp-play-header"><p class="exp-kicker">THE MISSING DELIVERY</p><h1>${ending ? "You brought the valley back together." : esc(attempt.snapshot.title)}</h1><p>${esc(meta.plain_objective)}</p></header>
      ${world(s, ending || (clear && s.level === 5))}
      <div class="exp-dialogue" role="status" aria-live="polite"><span class="exp-avatar" aria-hidden="true">P</span><div><strong>${ending ? "PIP · BRIDGEKEEPER" : "PIP · EXPEDITION COURIER"}</strong><p id="exp-feedback">${esc(ending ? "You didn't just find a gear. You taught me when to try again—and when not to guess. Come on. There's a whole valley out there." : s.feedback)}</p></div></div>
      ${s.level !== 4 ? `<div class="exp-inventory" aria-label="Courier state"><span>Ticket <strong id="exp-ticket">${esc(s.ticket)}</strong></span><span>Elapsed <strong>${s.hours}h</strong></span><span>Memory window <strong>${s.retention}h</strong></span><span>Rehearsal rewinds <strong>${s.rewinds}</strong></span></div>` : policyBoard(attempt)}
      <div id="exp-actions" class="exp-actions" aria-label="Actions in the valley"></div>
      <p id="exp-pending" role="status" hidden>This move is retained on this device but not confirmed saved. Retry Save; do not repeat the move.</p><button type="button" id="exp-retry-save" class="exp-primary" hidden>Retry saving move</button>
      ${submitted ? `<section class="exp-resolution"><p class="exp-kicker">${clear ? "EXPEDITION CLEAR" : "KEEP EXPERIMENTING"}</p><h2>${clear ? s.level === 4 ? "Bridge repaired. New route discovered." : "One small courier. One real insight." : "A setback is a clue."}</h2><p>${esc(attempt.snapshot.expedition.lesson)}</p><button type="button" class="exp-primary" id="exp-continue">${clear ? s.level === 4 ? "Discover the lookout detour" : "Continue the expedition" : "Try this stop again"}<span aria-hidden="true">→</span></button><p class="exp-xp-copy">${attempt.reward ? `+${attempt.reward} practice XP` : "No duplicate XP"} · progress, not mastery</p></section>` : `<button type="button" class="exp-primary exp-lock" id="exp-submit" ${s.complete || s.moves >= 80 ? "" : "disabled"}>${s.moves >= 80 && !s.complete ? "Record attempt and restart" : s.level === 4 ? "Seal the storm rules" : "Save this expedition clear"} <span aria-hidden="true">✓</span></button>`}
      <details class="exp-notes"><summary>What the game is teaching</summary><p>${esc(attempt.snapshot.expedition.lesson)}</p><p>${esc(attempt.snapshot.assumptions)}</p></details>
      <details class="exp-notes"><summary>Evidence, help &amp; saved history</summary><p>${esc(submitted ? attempt.assessment.scope : "Interactive consequences are guided feedback, recorded as assistance. No mastery claim is made.")}</p><p id="exp-evidence-label">${esc(submitted ? attempt.assessment.independence.replaceAll("_", " ") : attempt.assistance.length ? "Feedback/help history attached to this run." : "Outside help not declared. No simulation feedback yet.")}</p><label for="exp-aid">Outside help <select id="exp-aid" ${submitted ? "disabled" : ""}><option value="unknown">Not declared</option><option value="none">No outside help</option><option value="external">Yes, outside help</option></select></label><pre id="exp-evidence"></pre></details>`;
    bindPreferences();
    root.querySelector("#exp-evidence").textContent = JSON.stringify({evidence: attempt.evidence, assessment: attempt.assessment, moves: game.moves, checkpoints: attempt.checkpoints}, null, 2);
    root.querySelector("#exp-aid").value = attempt.response.aid_declaration;
    root.querySelector("#exp-aid").onchange = event => { document.querySelector("#aid-declaration").value = event.target.value; callbacks.edit(); };
    if (!submitted) {
      const actions = root.querySelector("#exp-actions");
      for (const action of s.available) {
        const button = document.createElement("button"); button.type = "button"; button.dataset.action = action;
        button.className = action === "rewind" || action === "new_ticket" ? "exp-secondary" : "exp-action";
        button.innerHTML = `<span aria-hidden="true">${icons[action]}</span>${labels[action]}`;
        button.onclick = () => move(action); actions.append(button);
      }
      root.querySelector("#exp-submit").onclick = () => callbacks.submit();
    } else root.querySelector("#exp-continue").onclick = () => callbacks.campaign();
    root.querySelector("#exp-retry-save").onclick = () => callbacks.save();
    for (const button of root.querySelectorAll("[data-policy-field]")) button.onclick = () => {
      if (submitted) return;
      game.policy[button.dataset.policyField] = button.dataset.policyValue;
      for (const other of root.querySelectorAll(`[data-policy-field="${button.dataset.policyField}"]`)) other.setAttribute("aria-pressed", String(other === button));
      callbacks.edit();
      root.querySelector("#exp-submit").disabled = true;
      root.querySelector("#exp-feedback").textContent = "Rule changed. Run the storm tests to see what this version does.";
    };
  }
  function policyBoard(attempt) {
    const fields = {identity: "1 · After Pip restarts", payload: "2 · If gear details change", expiry: "3 · After memory expires", unknown: "4 · If the register is unavailable"};
    return `<section class="exp-policy" aria-label="Storm rule engine">${Object.entries(attempt.snapshot.expedition.policy_options).map(([key, values]) => `<fieldset><legend>${fields[key]}</legend>${Object.entries(values).map(([value, label]) => `<button type="button" data-policy-field="${key}" data-policy-value="${value}" aria-pressed="${game.policy[key] === value}" ${attempt.status === "submitted" ? "disabled" : ""}>${esc(label)}</button>`).join("")}</fieldset>`).join("")}</section><div class="exp-storm-results" aria-live="polite">${attempt.game_state.rows.map(row => `<section class="exp-test-case ${row.correct ? "passed" : "failed"}"><strong>${row.correct ? "✓" : "!"} ${esc(row.run)}</strong><span>${esc(row.actual)}</span><p>${esc(row.reason)}</p></section>`).join("")}</div>`;
  }
  async function move(action) {
    if (!current || current.status !== "draft") return;
    if (game.moves.length >= 80) { callbacks.error("This rehearsal is full. Record the current attempt before starting another."); return; }
    if (game.moves.length !== current.response.game.moves.length) { callbacks.error("Save the pending move before taking another action."); return; }
    game.moves.push(action === "test" ? {action: "test", policy: structuredClone(game.policy)} : action);
    root.querySelector("#exp-feedback").textContent = action === "test" ? "Running the storm engine…" : "Pip is making the move…";
    tone(action === "collect");
    await callbacks.save();
  }
  function sync(busy, attempt) {
    if (!root || root.hidden || !attempt?.snapshot?.expedition || !current) return;
    const pending = game.moves.length !== attempt.response.game.moves.length;
    for (const button of root.querySelectorAll("[data-action], [data-policy-field]")) button.disabled = busy || pending || attempt.status === "submitted";
    const submit = root.querySelector("#exp-submit");
    if (submit) submit.disabled = busy || pending || (!attempt.game_state.complete && attempt.game_state.moves < 80) || JSON.stringify(game.policy) !== JSON.stringify(attempt.response.game.policy);
    root.querySelector("#exp-pending").hidden = !pending || busy;
    root.querySelector("#exp-retry-save").hidden = !pending || busy;
    const save = root.querySelector("#exp-retry-save"); save.disabled = busy;
  }
  return {render, renderMap, hide, response, setResponse, sync};
})();
