(function () {
  "use strict";

  /* ============ Icons (inline SVG, no emoji) ============ */
  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    chevL: '<path d="M15 18l-6-6 6-6"/>',
    chevR: '<path d="M9 18l6-6-6-6"/>',
    home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.2a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.8-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.6 1.6 0 004 15a2 2 0 01-2-2 2 2 0 012-2 1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1A1.6 1.6 0 009 4.6a2 2 0 014 0 1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1A1.6 1.6 0 0020 11a2 2 0 010 4z"/>',
    users: '<path d="M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6"/>',
    pause: '<rect x="7" y="5" width="4" height="14" rx="1"/><rect x="13" y="5" width="4" height="14" rx="1"/>',
    play: '<path d="M7 4l12 8-12 8z"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M11 21l1.5-6L9 12l1-5 4 2 3 1"/><path d="M10 16l-2 5"/>',
    shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    rotate: '<path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 3v6h-6"/>',
    save: '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    export: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    history: '<path d="M3 12a9 9 0 103-6.7"/><path d="M3 3v6h6"/><path d="M12 8v4l3 2"/>',
    skip: '<path d="M5 4l10 8-10 8z"/><path d="M19 5v14"/>',
    volume: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14"/>',
    mute: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    moon: '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  };
  function paintIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach((el) => {
      const k = el.getAttribute("data-icon");
      if (!ICONS[k] || el.dataset.painted === k) return;
      el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
      el.dataset.painted = k;
    });
  }

  /* ============ State ============ */
  const MAX_SQUADS = 4;
  const STORE = "3v3-setups-v2";
  const THEME = "3v3-theme-pref";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let squads = [
    { name: "Squad A", count: 10, players: "" },
    { name: "Squad B", count: 11, players: "" },
  ];
  let opts = { spare: "subs", teamSize: 3, matchup: "cross", formation: "rotate", pitchMode: "auto", manual: [], noRest: false, noRestMode: "strict", fairPriority: true };
  let result = null, fair = [], scheduleView = "full", scheduleFilter = 0, saveTemplate = false;
  let currentScreen = null;
  const SESSION = "3v3-session-v1";
  let timer = null, tickId = null, wakeLock = null, audioCtx = null;

  /* ============ Navigation ============ */
  // Screens are pushed onto browser history so the Android/hardware back button
  // (and browser back) steps back through the app instead of closing it.
  function navigate(id, opt) {
    if (currentScreen === id) return;
    history.pushState({ screen: id, opt: opt || null }, "");
    show(id, opt);
  }

  function show(id, opt) {
    currentScreen = id;
    document.querySelectorAll(".screen").forEach((s) => (s.hidden = true));
    const el = $("s-" + id);
    if (!el) return;
    el.hidden = false;
    const tab = el.dataset.tab;
    document.querySelectorAll(".tab").forEach((t) =>
      t.dataset.tab === tab ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current"));
    if (id === "schedule") { if (opt) scheduleView = opt; renderSchedule(); }
    if (id === "fairness") renderFairness();
    if (id === "saved") renderSaved();
    if (id === "create") { renderSquadRows(); renderSquadEditors(); }
    if (id === "session" || id === "options" || id === "create") syncAllControls();
    if (id === "options" && pendingNotes.length) { showOptionsProblems(pendingNotes); }
    if (id === "home") renderHome();
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) {
      const target = go.dataset.go;
      if (target === "create" && go.closest("#s-home, #s-complete")) {   // a new session starts with everyone present
        squads.forEach((s) => (s.absent = [])); renderAttendance(); saveDraft();
      }
      if ((target === "schedule" || target === "fairness") && !result) { navigate("create"); return; }
      navigate(target, go.dataset.view);
      return;
    }
    const back = e.target.closest("[data-back]");
    if (back) { if (history.length > 1) history.back(); else navigate(back.dataset.back); }
  });
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      const k = t.dataset.tab;
      if (k === "fixtures") navigate(result ? "schedule" : "create");
      else if (k === "fairness") navigate(result ? "fairness" : "create");
      else navigate(k === "home" ? "home" : "settings");
    }));

  /* ============ Step 1: squads ============ */
  const MAX_PLAYERS = 30;
  function renderSquadRows() {
    $("squadRows").innerHTML = squads.map((s, i) => `
      <div class="squad-row">
        <span class="squad-dot sq-${i}"></span>
        <span class="squad-row-text"><strong>${esc(s.name)}</strong><small>${s.count} player${s.count === 1 ? "" : "s"}</small></span>
        ${squads.length > 2 ? `<button type="button" class="step-btn ghost" data-remove="${i}" aria-label="Remove ${esc(s.name)}"><span data-icon="trash"></span></button>` : ""}
        <span class="stepper">
          <button type="button" class="step-btn" data-dec="${i}" ${s.count <= 1 ? "disabled" : ""} aria-label="Fewer players"><span data-icon="minus"></span></button>
          <span class="step-val">${s.count}</span>
          <button type="button" class="step-btn" data-inc="${i}" ${s.count >= MAX_PLAYERS ? "disabled" : ""} aria-label="More players"><span data-icon="plus"></span></button>
        </span>
      </div>`).join("");
    $("addSquadBtn").disabled = squads.length >= MAX_SQUADS;
    $("squadHint").textContent = squads.length >= MAX_SQUADS
      ? "Maximum of 4 squads reached." : `You can add up to ${MAX_SQUADS} squads.`;
    paintIcons($("squadRows"));
  }

  /* ============ Attendance ============ */
  const rosterOf = (s) => {
    const lines = s.players.split("\n").map((x) => x.trim()).filter(Boolean);
    return Array.from({ length: s.count }, (_, n) => lines[n] || `Player ${n + 1}`);
  };
  const presentOf = (s) => { const ab = new Set(s.absent || []); return rosterOf(s).filter((_, n) => !ab.has(n)); };
  function renderAttendance() {
    const total = squads.reduce((t, s) => t + s.count, 0);
    const here = squads.reduce((t, s) => t + presentOf(s).length, 0);
    $("attSummary").textContent = `${here} of ${total} players here today`;
    $("attendance").innerHTML = squads.map((s, i) => {
      const ab = new Set(s.absent || []);
      return `<div class="att-squad"><p class="att-name"><span class="squad-dot sq-${i}"></span>${esc(s.name)}<small>${s.count - ab.size} / ${s.count}</small></p>
        <div class="att-chips">${rosterOf(s).map((n, k) =>
          `<button type="button" class="att-chip" data-s="${i}" data-p="${k}" aria-pressed="${!ab.has(k)}">${esc(n)}</button>`).join("")}</div></div>`;
    }).join("");
  }
  $("attendance").addEventListener("click", (e) => {
    const b = e.target.closest(".att-chip"); if (!b) return;
    const s = squads[+b.dataset.s], k = +b.dataset.p, ab = new Set(s.absent || []);
    if (ab.has(k)) ab.delete(k); else ab.add(k);
    s.absent = [...ab]; renderAttendance(); saveDraft();
  });
  $("attAllBtn").addEventListener("click", () => { squads.forEach((s) => (s.absent = [])); renderAttendance(); saveDraft(); });

  /* ---- draft: keeps the setup form across reloads ---- */
  const DRAFT = "3v3-draft-v1";
  const readForm = () => { const f = {}; FORM_FIELDS.forEach((k) => (f[k] = $(k).value)); return f; };
  function saveDraft() { try { localStorage.setItem(DRAFT, JSON.stringify({ v: 2, squads, opts, form: readForm() })); } catch (e) {} }
  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || "null");
      const clean = sanitizeSetup(d, true);
      if (clean) {
        squads = clean.squads; opts = clean.opts;   // attendance is deliberately not restored
        FORM_FIELDS.forEach((k) => { if (clean[k] !== undefined) $(k).value = clean[k]; });
        pendingNotes = pendingNotes.concat(clean.notes);
      }
    } catch (e) {}
  }

  function renderSquadEditors() {
    $("squadNameEditors").innerHTML = squads.map((s, i) => `
      <div class="squad-edit" data-sq="${i}">
        <label>Squad ${i + 1} name</label>
        <input type="text" class="sq-name" value="${esc(s.name)}" placeholder="Squad ${i + 1}" />
        <label>Player names (one per line, optional)</label>
        <textarea class="sq-players" placeholder="Leave blank to number players automatically">${esc(s.players)}</textarea>
      </div>`).join("");
  }

  $("squadRows").addEventListener("click", (e) => {
    const rem = e.target.closest("[data-remove]");
    if (rem) {
      if (squads.length <= 2) return;
      squads.splice(+rem.dataset.remove, 1);
      renderSquadRows(); renderSquadEditors(); renderAttendance(); saveDraft(); return;
    }
    const dec = e.target.closest("[data-dec]"), inc = e.target.closest("[data-inc]");
    if (dec) squads[+dec.dataset.dec].count = Math.max(1, squads[+dec.dataset.dec].count - 1);
    else if (inc) squads[+inc.dataset.inc].count = Math.min(MAX_PLAYERS, squads[+inc.dataset.inc].count + 1);
    else return;
    const sq = squads[+(dec ? dec.dataset.dec : inc.dataset.inc)];
    sq.absent = (sq.absent || []).filter((k) => k < sq.count);
    renderSquadRows(); renderAttendance(); saveDraft();
  });
  $("addSquadBtn").addEventListener("click", () => {
    if (squads.length >= MAX_SQUADS) return;
    squads.push({ name: "Squad " + String.fromCharCode(65 + squads.length), count: 10, players: "" });
    renderSquadRows(); renderSquadEditors(); renderAttendance(); saveDraft();
  });
  $("squadNameEditors").addEventListener("input", (e) => {
    const box = e.target.closest("[data-sq]"); if (!box) return;
    const i = +box.dataset.sq;
    if (e.target.classList.contains("sq-name")) { squads[i].name = e.target.value || "Squad " + (i + 1); renderSquadRows(); renderAttendance(); }
    if (e.target.classList.contains("sq-players")) { squads[i].players = e.target.value; renderAttendance(); }
    saveDraft();
  });

  /* ============ Step 3: options ============ */
  const MATCHUP_HINT = {
    cross: "Squads always play a different squad, never themselves. Needs at least 2 squads.",
    separate: "Squads only ever play against themselves. Each squad needs enough players for two teams.",
    mixed: "Everyone goes into one pool and teams are drawn across all squads.",
  };
  const PITCH_HINT = {
    auto: "Every pitch uses the team size above.",
    balanced: "Equal-sided teams on every pitch. Uneven teams only happen when Everyone plays is on.",
    manual: "Set the team size for each pitch yourself: one number per team, 1 to 11.",
  };
  const NR_MODE_HINT = {
    strict: "Every match keeps your match-up rule. If that cannot fit everyone, you will be told why.",
    relax: "If your match-up rule cannot fit everyone, squads may be mixed inside teams so that everyone plays.",
  };
  const ENUMS = {
    spare: ["subs", "rest"], matchup: ["cross", "separate", "mixed"], formation: ["rotate", "together"],
    pitchMode: ["auto", "balanced", "manual"], noRestMode: ["strict", "relax"],
  };
  const DEFAULT_OPTS = () => ({ spare: "subs", teamSize: 3, matchup: "cross", formation: "rotate", pitchMode: "auto", manual: [], noRest: false, noRestMode: "strict", fairPriority: true });
  const FORM_FIELDS = ["gameTime", "restTime", "bufferTime", "totalSession", "startTime", "numPitches"];
  const FORM_DEFAULTS = { gameTime: 8, restTime: 2, bufferTime: 0, totalSession: 90, startTime: "09:00", numPitches: 3 };
  let pendingNotes = [];   // problems found in saved data, shown until the organiser corrects them

  const manualValue = (p) => (opts.manual[p] === undefined || opts.manual[p] === null ? String(opts.teamSize) : String(opts.manual[p]));
  const manualError = (p) => { const r = window.FixtureEngine.parseTeamSize(manualValue(p)); return r.ok ? "" : r.error; };
  const pitchCount = () => Math.max(1, Math.min(8, Math.round(+$("numPitches").value) || 1));

  function setSeg(id, attr, val) { [...$(id).children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr] === String(val)))); }

  function renderManual() {
    const n = pitchCount();
    $("manualFormats").innerHTML = Array.from({ length: n }, (_, p) => {
      const parsed = window.FixtureEngine.parseTeamSize(manualValue(p)), ok = parsed.ok, err = ok ? "" : parsed.error;
      return `<label><span>Pitch ${p + 1}</span><span class="m-row"><input type="number" min="1" max="11" step="1" inputmode="numeric" data-p="${p}" value="${ok ? parsed.size : ""}" aria-label="Players per team on pitch ${p + 1}" aria-invalid="${!ok}" /><b class="m-fmt">${ok ? parsed.size + "v" + parsed.size : ""}</b></span>${ok ? "" : `<span class="m-err">${esc(err)}</span>`}</label>`;
    }).join("");
  }

  // The ONE function that paints every settings control from `opts` and the session form.
  function syncAllControls() {
    const n = opts.teamSize;
    if (document.activeElement !== $("teamSizeInput")) $("teamSizeInput").value = n;   // never rewrite it mid-typing
    $("sizeLabel").textContent = n + "v" + n;
    [...$("formationSeg").children].forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.size === n)));
    $("sizeDec").disabled = n <= 1; $("sizeInc").disabled = n >= 11;
    const ex = Math.min(n, 10);
    $("formationHint").textContent = opts.noRest
      ? `All available players will be included where possible. Some matches may have one additional player, such as ${ex}v${ex + 1}.`
      : "Games use equal-sized teams. Additional players rotate between rounds.";
    setSeg("matchupSeg", "matchup", opts.matchup);
    setSeg("formationTypeSeg", "formation", opts.formation);
    setSeg("pitchModeSeg", "pmode", opts.pitchMode);
    setSeg("noRestModeSeg", "nrmode", opts.noRestMode);
    [...$("spareOptions").children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.spare === opts.spare)));
    $("fairSwitch").setAttribute("aria-checked", String(opts.fairPriority !== false));
    $("noRestSwitch").setAttribute("aria-checked", String(!!opts.noRest));
    $("noRestModeWrap").hidden = !opts.noRest;
    $("noRestModeSeg").hidden = opts.matchup === "mixed";
    $("noRestHint").textContent = opts.matchup === "mixed"
      ? "Everyone is spread across all pitches. A side may have one extra player."
      : NR_MODE_HINT[opts.noRestMode];
    $("spareOptions").classList.toggle("is-off", !!opts.noRest);
    $("matchupHint").textContent = MATCHUP_HINT[opts.matchup];
    $("pitchModeHint").textContent = PITCH_HINT[opts.pitchMode];
    $("manualFormats").hidden = opts.pitchMode !== "manual";
    if (opts.pitchMode === "manual") renderManual();
    renderSummaryRows();
  }

  // What the screen currently shows, read back from the DOM (used to prove screen and state agree).
  function uiMismatches() {
    const bad = [];
    const pressed = (id, attr) => { const b = [...$(id).children].find((x) => x.getAttribute("aria-pressed") === "true"); return b ? b.dataset[attr] : null; };
    const cmp = (label, shown, actual) => { if (String(shown) !== String(actual)) bad.push(`${label} shows ${shown} but is set to ${actual}`); };
    cmp("Team size", $("teamSizeInput").value, opts.teamSize);
    cmp("Match-up", pressed("matchupSeg", "matchup"), opts.matchup);
    cmp("Team-mates", pressed("formationTypeSeg", "formation"), opts.formation);
    cmp("Pitch formats", pressed("pitchModeSeg", "pmode"), opts.pitchMode);
    cmp("Everyone plays", $("noRestSwitch").getAttribute("aria-checked"), !!opts.noRest);
    cmp("Fewest games first", $("fairSwitch").getAttribute("aria-checked"), opts.fairPriority !== false);
    cmp("Spare players", ([...$("spareOptions").children].find((b) => b.getAttribute("aria-pressed") === "true") || { dataset: {} }).dataset.spare, opts.spare);
    cmp("Everyone plays mode", pressed("noRestModeSeg", "nrmode"), opts.noRestMode);
    if (opts.pitchMode === "manual") $("manualFormats").querySelectorAll("input").forEach((inp) => { const p = +inp.dataset.p; const r = window.FixtureEngine.parseTeamSize(manualValue(p)); if (r.ok) cmp(`Pitch ${p + 1} size`, inp.value, r.size); });
    return bad;
  }

  function setTeamSize(n) {
    const r = window.FixtureEngine.parseTeamSize(String(n));
    if (!r.ok) return;
    opts.teamSize = r.size; syncAllControls(); saveDraft();
  }
  $("formationSeg").addEventListener("click", (e) => { const b = e.target.closest(".seg-btn"); if (b) setTeamSize(b.dataset.size); });
  $("sizeDec").addEventListener("click", () => setTeamSize(opts.teamSize - 1));
  $("sizeInc").addEventListener("click", () => setTeamSize(opts.teamSize + 1));
  $("teamSizeInput").addEventListener("input", (e) => {
    const v = e.target.value, r = window.FixtureEngine.parseTeamSize(v);
    if (r.ok) { opts.teamSize = r.size; syncAllControls(); saveDraft(); }
    else { $("optionsWarn").textContent = v === "" ? "" : r.error; }
  });
  $("teamSizeInput").addEventListener("blur", () => { syncAllControls(); });

  function segHandler(id, attr, apply) {
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest(".seg-btn"); if (!b) return;
      apply(b.dataset[attr]); syncAllControls(); saveDraft();
    });
  }
  segHandler("matchupSeg", "matchup", (v) => { opts.matchup = v; });
  segHandler("formationTypeSeg", "formation", (v) => { opts.formation = v; });
  segHandler("pitchModeSeg", "pmode", (v) => { opts.pitchMode = v; });
  segHandler("noRestModeSeg", "nrmode", (v) => { opts.noRestMode = v; });
  $("spareOptions").addEventListener("click", (e) => {
    const p = e.target.closest(".pick"); if (!p) return;
    opts.spare = p.dataset.spare; syncAllControls(); saveDraft();
  });
  $("fairSwitch").addEventListener("click", () => { opts.fairPriority = opts.fairPriority === false; syncAllControls(); saveDraft(); });
  $("noRestSwitch").addEventListener("click", () => { opts.noRest = !opts.noRest; syncAllControls(); saveDraft(); });
  $("saveTemplateSwitch").addEventListener("click", () => {
    saveTemplate = !saveTemplate;
    $("saveTemplateSwitch").setAttribute("aria-checked", String(saveTemplate));
    $("templateName").hidden = !saveTemplate;
  });

  // Manual pitch sizes: one whole number per pitch, shown back as NvN.
  $("manualFormats").addEventListener("input", (e) => {
    const inp = e.target.closest("input[data-p]"); if (!inp) return;
    const p = +inp.dataset.p;
    for (let i = 0; i < p; i++) if (opts.manual[i] === undefined) opts.manual[i] = null;
    opts.manual[p] = inp.value;
    const parsed = window.FixtureEngine.parseTeamSize(opts.manual[p]), err = parsed.ok ? "" : parsed.error, row = inp.closest("label");
    row.querySelector(".m-fmt").textContent = err ? "" : parsed.size + "v" + parsed.size;
    let msg = row.querySelector(".m-err");
    if (err) { if (!msg) { msg = document.createElement("span"); msg.className = "m-err"; row.appendChild(msg); } msg.textContent = err; }
    else if (msg) msg.remove();
    inp.setAttribute("aria-invalid", String(!!err));
    saveDraft();
  });
  $("numPitches").addEventListener("input", () => { if (opts.pitchMode === "manual") renderManual(); });
  FORM_FIELDS.forEach((k) => { $(k).addEventListener("change", saveDraft); $(k).addEventListener("input", saveDraft); });

  function renderSummaryRows() {
    $("sumFormation").textContent = opts.teamSize + "v" + opts.teamSize;
    $("sumMatchup").textContent = { cross: "Squad v squad", separate: "Within squad", mixed: "Mixed" }[opts.matchup];
    $("sumPitchFormats").textContent = { auto: "Automatic", balanced: "Balance uneven", manual: "Manual" }[opts.pitchMode];
  }

  /* ============ Generate ============ */
  /* ---- input validation ---- */
  const LIMITS = {
    gameTime: { label: "Game duration", min: 1, max: 60, def: 8 },
    restTime: { label: "Rest time", min: 0, max: 30, def: 2 },
    bufferTime: { label: "Pitch-change buffer", min: 0, max: 15, def: 0 },
    totalSession: { label: "Total session", min: 1, max: 600, def: 90 },
    numPitches: { label: "Number of pitches", min: 1, max: 8, def: 3 },
  };
  // Clamp every setting field into its allowed range, write the fixed value back,
  // and return a list of plain-English notes about anything that was changed.
  function validateInputs(only) {
    const notes = [];
    Object.keys(LIMITS).forEach((k) => {
      if (only && only !== k) return;
      const L = LIMITS[k], el = $(k), raw = el.value, n = Number(raw);
      let v;
      if (raw === "" || !Number.isFinite(n)) { v = L.def; notes.push(`${L.label} was empty, so it was set to ${v}.`); }
      else {
        v = Math.round(n);
        if (v < L.min) { v = L.min; notes.push(`${L.label} must be at least ${L.min}, so it was set to ${v}.`); }
        else if (v > L.max) { v = L.max; notes.push(`${L.label} can be at most ${L.max}, so it was set to ${v}.`); }
        else if (v !== n) notes.push(`${L.label} was rounded to ${v}.`);
      }
      el.value = v;
    });
    if ((!only || only === "startTime") && !/^([01]\d|2[0-3]):[0-5]\d$/.test($("startTime").value)) {
      $("startTime").value = "09:00"; notes.push("Start time was not valid, so it was set to 09:00.");
    }
    return notes;
  }
  const fieldNotes = {};
  Object.keys(LIMITS).concat(["startTime"]).forEach((k) => $(k).addEventListener("change", () => {
    fieldNotes[k] = validateInputs(k).join(" ");
    $("sessionWarn").textContent = Object.keys(fieldNotes).map((x) => fieldNotes[x]).filter(Boolean).join(" ");
  }));

  function buildSettings() {
    validateInputs();
    const manual = Array.from({ length: pitchCount() }, (_, p) => manualValue(p));
    return {
      squads: squads.map((s, i) => ({ name: s.name || "Squad " + (i + 1), players: presentOf(s), colorIndex: i }))
        .filter((s) => s.players.length > 0),
      gameTime: +$("gameTime").value,
      restTime: +$("restTime").value,
      bufferTime: +$("bufferTime").value,
      totalSession: +$("totalSession").value,
      startTime: $("startTime").value,
      numPitches: +$("numPitches").value,
      teamSize: opts.teamSize,
      spareHandling: opts.spare,
      noRest: !!opts.noRest,
      noRestMode: opts.noRestMode || "strict",
      fairPriority: opts.fairPriority !== false,
      teamFormation: opts.formation,
      matchup: opts.matchup,
      pitchFormatMode: opts.pitchMode,
      manualFormats: manual,
    };
  }

  function computeFair(res) {
    const avg = res.players.reduce((s, p) => s + p.gamesPlayed, 0) / Math.max(1, res.players.length) || 1;
    const idx = {}; res.squads.forEach((s, i) => (idx[s.name] = i));
    return res.players.map((p) => {
      const ratio = (p.gamesPlayed / avg) * 100;
      const pct = Math.min(100, Math.round(ratio));
      let tone = "bad", label = "Underplayed";
      if (ratio >= 98) { tone = "ok"; label = "Fully played"; }
      else if (ratio >= 88) { tone = "ok"; label = "Fair"; }
      else if (ratio >= 75) { tone = "warn"; label = "Slightly underplayed"; }
      const rounds = res.rounds.map((r) => r.matches.some((m) =>
        !m.empty && (m.teamA.playerIds.indexOf(p.id) !== -1 || m.teamB.playerIds.indexOf(p.id) !== -1)));
      return Object.assign({}, p, { pct, tone, label, squadIndex: cix(p.colorClass), rounds, avg });
    });
  }

  function showOptionsProblems(lines) {
    const box = $("optionsWarn");
    box.innerHTML = lines.map((l) => `<span class="warn-line">${esc(l)}</span>`).join("");
  }

  $("generateBtn").addEventListener("click", () => {
    // 1. The screen must show exactly what will be submitted.
    const stale = uiMismatches();
    if (stale.length) {
      syncAllControls();
      showOptionsProblems(["The screen was out of date with your settings and has been refreshed. Check the options shown, then press Generate fixtures again."]);
      return;
    }
    // 2. Saved settings that are no longer valid must be corrected first.
    const bad = [];
    if (opts.pitchMode === "manual") for (let p = 0; p < pitchCount(); p++) { const e = manualError(p); if (e) bad.push(`Pitch ${p + 1}: ${e}`); }
    if (bad.length) { showOptionsProblems(["Please correct the pitch sizes before generating."].concat(bad)); return; }
    const fixNotes = validateInputs();
    const settings = buildSettings();
    $("sessionWarn").textContent = fixNotes.join(" ");
    Object.keys(fieldNotes).forEach((k) => delete fieldNotes[k]);
    if (settings.gameTime > settings.totalSession) {
      $("optionsWarn").textContent = `Game duration (${settings.gameTime} min) is longer than the total session (${settings.totalSession} min). Change it on the session settings step.`;
      return;
    }
    if (settings.squads.reduce((t, s) => t + s.players.length, 0) < 2) {
      $("optionsWarn").textContent = "At least 2 players need to be marked as here. Check attendance on the first step.";
      return;
    }
    const res = window.FixtureEngine.generateFixtures(settings);
    if (!res.ok || res.summary.totalMatches < 1 || res.summary.totalRounds < 1) {
      // Never show the success screen, never replace the previous session.
      showOptionsProblems(["Unable to generate fixtures."].concat(res.errors.length ? res.errors : ["Your settings do not allow any valid matches."]));
      return;
    }
    $("optionsWarn").textContent = res.warnings.join(" ");
    pendingNotes = [];
    res.absent = squads.reduce((l, s) => {
      const ab = new Set(s.absent || []);
      rosterOf(s).forEach((n, k) => { if (ab.has(k)) l.push({ name: n, squadName: s.name }); });
      return l;
    }, []);
    result = res; fair = computeFair(res); scheduleFilter = 0;
    initTimer(null); saveSession();

    if (saveTemplate) {
      const name = ($("templateName").value || "").trim() || "Template " + new Date().toLocaleDateString("en-GB");
      const all = loadStore(); all[name] = snapshot(); saveStore(all);
    }

    navigate("generating");
    const items = [...$("genList").children];
    items.forEach((li) => li.classList.remove("on"));
    items.forEach((li, i) => setTimeout(() => li.classList.add("on"), 260 + i * 240));
    setTimeout(() => {
      $("doneSummary").textContent =
        `${res.summary.totalRounds} rounds · ${res.summary.totalMatches} matches · ${res.summary.totalPlayers} players · ${res.summary.sessionStart}–${res.summary.sessionEnd}`;
      $("completeNotice").innerHTML = pitchNoticeHTML(); paintIcons($("completeNotice"));
      history.replaceState({ screen: "complete", opt: null }, ""); show("complete");
    }, 1500);
  });

  /* ============ Home ============ */
  function renderHome() {
    const el = $("homeCurrent");
    // With a live session the timer is what matters pitch-side, so the hero
    // collapses and the timer moves above everything else.
    $("s-home").classList.toggle("has-session", !!result);
    if (!result) { el.innerHTML = ""; return; }
    const s = result.summary;
    el.innerHTML = `
      <p class="sec-label">Match day timer</p>
      ${liveCardHTML()}
      <p class="sec-label">Current session</p>
      <button type="button" class="fx" data-go="schedule">
        <span class="list-ico" data-icon="calendar"></span>
        <span class="fx-main">
          <span class="fx-teams"><span class="fx-team">${s.totalRounds} rounds · ${s.totalMatches} matches</span></span>
          <span class="fx-meta">${s.sessionStart}–${s.sessionEnd} · ${s.totalPlayers} players · ${s.pitchesUsed} pitches</span>
        </span>
        <span class="fx-chev" data-icon="chevR"></span>
      </button>`;
    paintIcons(el); updateLive();
  }

  /* ============ Schedule ============ */
  const cix = (cls) => ({ "squad-a": 0, "squad-b": 1, "squad-c": 2, "squad-d": 3 }[cls] || 0);
  const sqIdx = (name) => { for (let i = 0; i < result.squads.length; i++) if (result.squads[i].name === name) return i; return 0; };

  function teamLabel(t) {
    const map = { "squad-a": 0, "squad-b": 1, "squad-c": 2, "squad-d": 3 };
    const cls = t.colorClass in map ? "sq-" + map[t.colorClass] : "";
    return `<span class="fx-team"><span class="squad-dot ${cls}" style="width:12px;height:12px"></span>${esc(t.squadName)}</span>`;
  }

  // Tells the organiser when a pitch is going unused, and offers a one-tap fix.
  function pitchNoticeHTML() {
    const unused = (result.pitchUsage || []).filter((u) => u.emptyRounds > 0);
    if (!unused.length) return "";
    const total = result.rounds.length, st = result.settings;
    const names = unused.map((u) => "Pitch " + u.pitch);
    const all = unused.every((u) => u.emptyRounds === total);
    const what = `${names.join(" and ")} ${unused.length > 1 ? "are" : "is"} empty ${all ? "in every round" : "in some rounds"}.`;
    const canFix = !st.noRest && st.matchup !== "separate";
    return `<div class="pitch-note" role="status"><span data-icon="info"></span><span><b>${esc(what)}</b> ${canFix
      ? "Some players are sitting out while a pitch is free. Try Everyone plays to put them on it."
      : "There are not enough players present to fill it."}</span>${canFix
      ? `<button type="button" class="btn btn-soft" id="useAllPitches">Use all pitches</button>` : ""}</div>`;
  }
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#useAllPitches")) return;
    opts.noRest = true; syncAllControls(); saveDraft();
    navigate("options");            // any problem is explained here, where the settings are
    $("generateBtn").click();
  });

  function renderSchedule() {
    if (!result) return;
    const st = result.settings, s = result.summary;
    $("scheduleMeta").textContent = `${st.totalSession} mins · ${st.numPitches} pitches · ${st.gameTime} min games · ${st.restTime} min rest`;
    [...$("scheduleTabs").children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === scheduleView)));

    $("scheduleLive").innerHTML = liveCardHTML(true);
    const filters = $("scheduleFilters"), list = $("scheduleList");
    if (scheduleView === "full") {
      filters.innerHTML = "";
      const cur = currentRoundInfo();
      const home = (result.absent || []).length
        ? `<div class="home-note"><span data-icon="users"></span><span><b>Staying home (${result.absent.length}):</b> ${esc(result.absent.map((x) => x.name + " (" + x.squadName + ")").join(", "))}</span></div>` : "";
      list.innerHTML = pitchNoticeHTML() + home + result.rounds.map((r) => {
        let badge = "";
        if (cur.round === r.index) badge = `<span class="badge ${cur.phase === "play" ? "now" : "next"}">${cur.phase === "play" ? "Playing" : "Up next"}</span>`;
        else if (cur.round && cur.phase === "play" && r.index === cur.round + 1) badge = `<span class="badge next">Next</span>`;
        const rows = r.matches.filter((m) => !m.empty).map((m) => `
          <button type="button" class="fx fx-in" data-match="${r.index}-${m.pitch}">
            <span class="fx-pitch">P${m.pitch}</span>
            <span class="fx-main">
              <span class="fx-teams">${teamLabel(m.teamA)}<span class="fx-vs">vs</span>${teamLabel(m.teamB)}</span>
              <span class="fx-meta">${esc(m.format)}</span>
            </span>
            <span class="fx-chev" data-icon="chevR"></span>
          </button>`).join("");
        const resting = r.resting.length
          ? `<p class="rest-line"><span data-icon="pause"></span><span><b>Not playing (${r.resting.length}):</b> ${esc(r.resting.map((x) => x.name).join(", "))}</span></p>` : "";
        return `<div class="round-group${cur.round === r.index ? " is-current" : ""}">
          <div class="round-head"><span class="round-name">Round ${r.index}</span><span class="round-time">${r.startTime}–${r.endTime}</span>${badge}</div>
          ${rows}${resting}
        </div>`;
      }).join("");
    } else if (scheduleView === "team") {
      filters.innerHTML = result.squads.map((sq, i) =>
        `<button type="button" class="chip" data-f="${i}" aria-pressed="${scheduleFilter === i}">${esc(sq.name)}</button>`).join("");
      const name = result.squads[scheduleFilter] ? result.squads[scheduleFilter].name : "";
      const rows = [];
      result.rounds.forEach((r) => r.matches.forEach((m) => {
        if (m.empty) return;
        const has = (t) => t.squadName.split(" + ").indexOf(name) !== -1;
        const a = has(m.teamA), b = has(m.teamB);
        if (!a && !b) return;
        const opp = a ? m.teamB : m.teamA;
        rows.push(`<button type="button" class="fx" data-match="${r.index}-${m.pitch}">
          <span class="fx-time"><strong>${r.startTime}</strong><small>R${r.index}</small></span>
          <span class="fx-main"><span class="fx-teams"><span class="fx-vs">vs</span>${teamLabel(opp)}</span>
          <span class="fx-meta">Pitch ${m.pitch} · ${esc((a ? m.teamA : m.teamB).players.join(", "))}</span></span>
          <span class="fx-chev" data-icon="chevR"></span></button>`);
      }));
      list.innerHTML = rows.join("") || `<div class="empty"><p class="hint">No fixtures for this squad.</p></div>`;
    } else {
      const n = result.settings.numPitches;
      filters.innerHTML = Array.from({ length: n }, (_, i) =>
        `<button type="button" class="chip" data-f="${i}" aria-pressed="${scheduleFilter === i}">Pitch ${i + 1}</button>`).join("");
      const p = scheduleFilter + 1;
      list.innerHTML = result.rounds.map((r) => {
        const m = r.matches.filter((x) => x.pitch === p && !x.empty)[0];
        if (!m) return "";
        return `<button type="button" class="fx" data-match="${r.index}-${m.pitch}">
          <span class="fx-time"><strong>${r.startTime}</strong><small>R${r.index}</small></span>
          <span class="fx-main"><span class="fx-teams">${teamLabel(m.teamA)}<span class="fx-vs">vs</span>${teamLabel(m.teamB)}</span>
          <span class="fx-meta">${esc(m.format)}</span></span>
          <span class="fx-chev" data-icon="chevR"></span></button>`;
      }).join("") || `<div class="empty"><p class="hint">No fixtures on this pitch.</p></div>`;
    }
    paintIcons(list); paintIcons($("scheduleLive")); updateLive();
  }

  $("scheduleTabs").addEventListener("click", (e) => {
    const b = e.target.closest(".tabpill"); if (!b) return;
    scheduleView = b.dataset.view; scheduleFilter = 0; renderSchedule();
  });
  $("scheduleFilters").addEventListener("click", (e) => {
    const c = e.target.closest("[data-f]"); if (!c) return;
    scheduleFilter = +c.dataset.f; renderSchedule();
  });
  $("scheduleList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-match]"); if (!b) return;
    const [ri, pi] = b.dataset.match.split("-").map(Number);
    openMatch(ri, pi);
  });

  // Explains uneven game counts between squads instead of leaving the organiser guessing.
  function squadGapNoteHTML() {
    const sq = result.squads.filter((s) => s.playerCount > 0);
    if (sq.length < 2) return "";
    const hi = sq.reduce((x, y) => (y.avgGames > x.avgGames ? y : x)), lo = sq.reduce((x, y) => (y.avgGames < x.avgGames ? y : x));
    const gap = hi.avgGames - lo.avgGames;
    if (gap < 0.9) return "";
    const fix = result.settings.noRest ? "" : " To even it out, turn on Everyone plays.";
    return `<div class="pitch-note" role="status"><span data-icon="info"></span><span><b>Games are uneven between squads.</b> ${esc(hi.name)} players average ${hi.avgGames.toFixed(1)} games and ${esc(lo.name)} players ${lo.avgGames.toFixed(1)}. Squad v squad games need the same number on each side, so the larger squad's extra players sit out more often.${fix}</span></div>`;
  }

  function openMatch(roundIndex, pitch) {
    const r = result.rounds.filter((x) => x.index === roundIndex)[0];
    if (!r) return;
    const m = r.matches.filter((x) => x.pitch === pitch)[0];
    if (!m || m.empty) return;
    const side = (t) => `<div class="card"><p class="card-title">${esc(t.squadName)}</p>
      <p class="hint">${esc(t.players.join(", "))}</p></div>`;
    $("matchBody").innerHTML = `
      <div class="card" style="text-align:center">
        <p class="hint">Round ${r.index} · Pitch ${m.pitch} · ${esc(m.format)}</p>
        <p class="metric-num">${r.startTime}</p>
        <p class="hint">Ends ${r.endTime}</p>
      </div>
      ${side(m.teamA)}
      <p class="sec-label" style="text-align:center">versus</p>
      ${side(m.teamB)}
      ${r.resting.length ? `<div class="card"><p class="card-title">Not playing this round (${r.resting.length})</p><p class="hint">${esc(r.resting.map((x) => x.name).join(", "))}</p></div>` : ""}`;
    navigate("match");
  }

  /* ============ Fairness ============ */
  function renderFairness() {
    if (!result) return;
    const body = $("fairnessBody");
    const ok = fair.filter((p) => p.tone === "ok").length;
    const squadPct = Math.round((ok / Math.max(1, fair.length)) * 100);
    const playerPct = Math.round(fair.reduce((s, p) => s + p.pct, 0) / Math.max(1, fair.length));
    const balanceWord = squadPct >= 90 ? "Well balanced" : squadPct >= 75 ? "Fairly close" : "Uneven";
    const tone = (v) => (v >= 90 ? "ok" : v >= 75 ? "warn" : "bad");

    body.innerHTML = `
      <div class="metric-row">
        <div class="metric">
          <span class="metric-head"><span class="list-ico" data-icon="users"></span>Squad fairness</span>
          <p class="metric-num ${tone(squadPct)}">${squadPct}%</p>
          <p class="metric-sub">${balanceWord}</p>
        </div>
        <div class="metric">
          <span class="metric-head"><span class="list-ico" data-icon="target"></span>Player fairness</span>
          <p class="metric-num ${tone(playerPct)}">${playerPct}%</p>
          <p class="metric-sub">On average</p>
        </div>
      </div>
      ${squadGapNoteHTML()}
      <p class="sec-label">Squad comparison</p>
      <div class="cmp-row">
        ${result.squads.map((s, i) => `
          <div class="cmp">
            <span class="cmp-badge sq-${cix(s.colorClass)}">${esc(squadBadge(s.name))}</span>
            <p class="cmp-name">${esc(s.name)}</p>
            <p class="cmp-num">${s.avgGames.toFixed(1)}</p>
            <p class="cmp-unit">avg games / player</p>
            <p class="cmp-meta"><span class="squad-dot sq-${cix(s.colorClass)}" style="width:9px;height:9px"></span>${s.playerCount} players</p>
          </div>`).join("")}
      </div>
      <p class="sec-label">Player fairness</p>
      <div class="stack">
        ${fair.slice().sort((a, b) => a.pct - b.pct).map((p) => `
          <div class="pf">
            <span class="pf-badge sq-${p.squadIndex}">${esc(initials(p.name))}</span>
            <span class="pf-main">
              <span class="pf-top"><span class="pf-name">${esc(p.name)} <span>(${esc(p.squadName)})</span></span>
              <span class="pf-pct t-${p.tone}">${p.pct}%</span></span>
              <span class="pf-bar"><span class="pf-fill ${p.tone === "ok" ? "" : p.tone}" style="width:${p.pct}%"></span></span>
              <span class="pf-games">${p.gamesPlayed} games · sat out ${p.sitOuts == null ? p.restCount : p.sitOuts} · ${esc(p.label)}</span>
            </span>
          </div>`).join("")}
      </div>`;
    paintIcons(body);
  }
  function initials(n) {
    const m = String(n).match(/\d+/);
    if (m) return "P" + m[0];
    return String(n).slice(0, 2).toUpperCase();
  }
  function squadBadge(n) {
    const w = String(n).trim().split(/\s+/).filter(Boolean);
    if (w.length > 1) return (w[0][0] + w[w.length - 1][0]).toUpperCase();
    return String(n).slice(0, 2).toUpperCase();
  }

  /* ============ Match day timer ============
     Driven by the wall clock (Date.now), not by counting ticks. Counting ticks
     drifts or stalls when a phone locks or the tab is backgrounded; measuring
     elapsed real time does not, and it lets the timer resume correctly after
     a reload or relaunch of the installed app. */
  function buildPhases(res) {
    const st = res.settings;
    const brk = ((st.restTime || 0) + (st.bufferTime || 0)) * 60;
    const out = [];
    res.rounds.forEach((r, i) => {
      out.push({ type: "play", round: r.index, seconds: Math.max(1, st.gameTime * 60) });
      if (i < res.rounds.length - 1 && brk > 0) out.push({ type: "break", round: r.index + 1, seconds: brk });
    });
    return out;
  }

  function initTimer(saved) {
    stopTick();
    if (!result) { timer = null; return; }
    timer = { phases: buildPhases(result), banked: 0, startedAt: null, running: false, muted: false, lastIdx: 0 };
    if (saved) {
      timer.banked = saved.banked || 0;
      timer.muted = !!saved.muted;
      if (saved.running && saved.startedAt) { timer.running = true; timer.startedAt = saved.startedAt; }
    }
    timer.lastIdx = locate().idx;
    if (timer.running) { startTick(); requestWake(); }
  }

  const elapsedMs = () => timer.banked + (timer.running ? Date.now() - timer.startedAt : 0);

  function locate() {
    let t = elapsedMs() / 1000;
    const ph = timer.phases;
    for (let i = 0; i < ph.length; i++) {
      if (t < ph[i].seconds) return { idx: i, phase: ph[i], remaining: ph[i].seconds - t, frac: t / ph[i].seconds };
      t -= ph[i].seconds;
    }
    return { idx: ph.length, phase: null, remaining: 0, frac: 1 };
  }

  function currentRoundInfo() {
    if (!timer || (!timer.running && timer.banked === 0)) return { round: null, phase: null };
    const l = locate();
    return l.phase ? { round: l.phase.round, phase: l.phase.type } : { round: null, phase: null };
  }

  const mmss = (s) => {
    s = Math.max(0, Math.ceil(s));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  };

  function liveCardHTML(compact) {
    return `<div class="live${compact ? " compact" : ""}" data-live="card">
      <div class="live-top">
        <span class="live-chip"><span class="live-dot"></span><span data-live="status">Ready</span></span>
        <span class="live-round" data-live="round"></span>
      </div>
      <div class="live-mid">
        <div class="live-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="lr-track" cx="60" cy="60" r="52"/><circle class="lr-arc" data-live="arc" cx="60" cy="60" r="52"/></svg>
          <span class="live-clock" data-live="clock" aria-live="off">00:00</span>
        </div>
        <div class="live-info">
          <p class="live-phase" data-live="phase">Ready to start</p>
          <p class="live-next" data-live="next"></p>
        </div>
      </div>
      <div class="live-ctrl">
        <button type="button" class="lc-btn" data-timer="restart" aria-label="Restart session clock"><span data-icon="rotate"></span></button>
        <button type="button" class="lc-play" data-timer="toggle" aria-label="Start"><span data-live="playicon" data-icon="play"></span></button>
        <button type="button" class="lc-btn" data-timer="skip" aria-label="Skip to next phase"><span data-icon="skip"></span></button>
        <button type="button" class="lc-btn" data-timer="mute" aria-label="Mute alerts"><span data-live="muteicon" data-icon="volume"></span></button>
      </div>
    </div>`;
  }

  const ARC = 2 * Math.PI * 52;
  function updateLive() {
    const cards = document.querySelectorAll('[data-live="card"]');
    if (!cards.length || !timer) return;
    const l = locate();
    const done = !l.phase;
    const started = timer.running || timer.banked > 0;
    const total = result.summary.totalRounds;

    let status = "Ready", phaseTxt = "Ready to start", nextTxt = "", roundTxt = `Round 1 of ${total}`;
    if (done) { status = "Finished"; phaseTxt = "Session complete"; roundTxt = `All ${total} rounds played`; }
    else {
      roundTxt = `Round ${l.phase.round} of ${total}`;
      if (l.phase.type === "play") {
        phaseTxt = started ? "Playing" : "Ready to start";
        const nr = result.rounds.filter((r) => r.index === l.phase.round + 1)[0];
        nextTxt = nr ? `Next: round ${nr.index} at ${nr.startTime}` : "Final round";
      } else {
        phaseTxt = "Break — change pitches";
        const nr = result.rounds.filter((r) => r.index === l.phase.round)[0];
        nextTxt = nr ? `Round ${nr.index} starts ${nr.startTime}` : "";
      }
      if (started) status = timer.running ? "Live" : "Paused";
    }

    cards.forEach((c) => {
      c.classList.toggle("is-running", timer.running);
      c.classList.toggle("is-break", !!(l.phase && l.phase.type === "break"));
      c.classList.toggle("is-done", done);
      c.querySelector('[data-live="status"]').textContent = status;
      c.querySelector('[data-live="round"]').textContent = roundTxt;
      c.querySelector('[data-live="phase"]').textContent = phaseTxt;
      c.querySelector('[data-live="next"]').textContent = nextTxt;
      c.querySelector('[data-live="clock"]').textContent = done ? "00:00" : mmss(l.remaining);
      c.querySelector('[data-live="arc"]').style.strokeDashoffset = String(ARC * (done ? 1 : l.frac));
      const pb = c.querySelector('[data-timer="toggle"]');
      pb.setAttribute("aria-label", timer.running ? "Pause" : "Start");
      pb.disabled = done;
      const pi = c.querySelector('[data-live="playicon"]');
      const want = timer.running ? "pause" : "play";
      if (pi.getAttribute("data-icon") !== want) { pi.setAttribute("data-icon", want); paintIcons(c); }
      const mi = c.querySelector('[data-live="muteicon"]');
      const mw = timer.muted ? "mute" : "volume";
      if (mi.getAttribute("data-icon") !== mw) { mi.setAttribute("data-icon", mw); paintIcons(c); }
      c.querySelector('[data-timer="mute"]').setAttribute("aria-pressed", String(timer.muted));
    });
  }

  function onTick() {
    if (!timer) return;
    const l = locate();
    if (l.idx !== timer.lastIdx) {
      timer.lastIdx = l.idx;
      if (!l.phase) {
        // session over: freeze the clock at the end
        timer.banked = timer.phases.reduce((s, p) => s + p.seconds, 0) * 1000;
        timer.running = false; timer.startedAt = null;
        stopTick(); releaseWake(); playAlert("done");
      } else playAlert(l.phase.type);
      saveSession();
      if (currentScreen === "schedule" && scheduleView === "full") renderSchedule();
    }
    updateLive();
  }

  function startTick() { if (!tickId) tickId = setInterval(onTick, 250); }
  function stopTick() { if (tickId) { clearInterval(tickId); tickId = null; } }

  function toggleTimer() {
    if (!timer || !locate().phase) return;
    unlockAudio();
    if (timer.running) {
      timer.banked += Date.now() - timer.startedAt;
      timer.running = false; timer.startedAt = null;
      stopTick(); releaseWake();
    } else {
      timer.running = true; timer.startedAt = Date.now();
      startTick(); requestWake();
      if (!toggleTimer.told) { toggleTimer.told = true; toast("Keep this screen on so the chime can sound."); }
    }
    saveSession(); onTick(); updateLive();
  }

  function restartTimer() {
    if (!timer) return;
    if ((timer.running || timer.banked > 0) && !confirm("Restart the session clock from round 1?")) return;
    stopTick(); releaseWake();
    timer.banked = 0; timer.running = false; timer.startedAt = null; timer.lastIdx = 0;
    saveSession(); updateLive();
    if (currentScreen === "schedule") renderSchedule();
  }

  function skipPhase() {
    if (!timer) return;
    const l = locate();
    if (!l.phase) return;
    let start = 0;
    for (let i = 0; i < l.idx; i++) start += timer.phases[i].seconds;
    timer.banked = (start + l.phase.seconds) * 1000;
    if (timer.running) timer.startedAt = Date.now();
    onTick(); saveSession(); updateLive();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-timer]");
    if (!b) return;
    const act = b.dataset.timer;
    if (act === "toggle") toggleTimer();
    else if (act === "restart") restartTimer();
    else if (act === "skip") skipPhase();
    else if (act === "mute") { timer.muted = !timer.muted; saveSession(); updateLive(); }
  });

  /* ---- Sound + vibration. Browsers cannot play the phone's own ringtone, so
     the chime is synthesised. Audio must be unlocked by a tap (iOS rule). ---- */
  function unlockAudio() {
    try {
      if (!audioCtx) { const C = window.AudioContext || window.webkitAudioContext; if (C) audioCtx = new C(); }
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) {}
  }
  function tone(freq, dur, when) {
    if (!audioCtx) return;
    try {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      const t = audioCtx.currentTime + when;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  function playAlert(kind) {
    if (!timer || timer.muted) return;
    if (kind === "play") { tone(880, .2, 0); tone(1175, .25, .24); }
    else if (kind === "break") { tone(523, .4, 0); }
    else { tone(659, .2, 0); tone(880, .2, .25); tone(1175, .45, .5); }
    try { if (navigator.vibrate) navigator.vibrate(kind === "done" ? [200, 100, 200, 100, 400] : [250, 120, 250]); } catch (e) {}
  }

  /* ---- Keep the screen awake while the clock runs (Screen Wake Lock API). ---- */
  async function requestWake() {
    try { if ("wakeLock" in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); } } catch (e) {}
  }
  function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) {} wakeLock = null; }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && timer) {
      if (timer.running) requestWake();
      onTick();   // catch up instantly after the phone was locked
    }
  });

  /* ============ Session persistence ============ */
  function saveSession() {
    try {
      localStorage.setItem(SESSION, JSON.stringify({
        result,
        timer: timer ? { banked: timer.banked, startedAt: timer.startedAt, running: timer.running, muted: timer.muted } : null,
      }));
    } catch (e) {}
  }
  function loadSession() {
    try {
      const d = JSON.parse(localStorage.getItem(SESSION) || "null");
      if (d && d.result && d.result.rounds) { result = d.result; fair = computeFair(result); initTimer(d.timer); }
    } catch (e) { result = null; }
  }

  /* ============ Saved setups ============ */
  const loadStore = () => { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } };
  const saveStore = (o) => { try { localStorage.setItem(STORE, JSON.stringify(o)); return true; } catch (e) { return false; } };

  function snapshot() {
    return {
      v: 2,
      squads: JSON.parse(JSON.stringify(squads)).map((s) => { delete s.absent; return s; }), opts: JSON.parse(JSON.stringify(opts)),
      gameTime: $("gameTime").value, restTime: $("restTime").value, bufferTime: $("bufferTime").value,
      totalSession: $("totalSession").value, startTime: $("startTime").value, numPitches: $("numPitches").value,
    };
  }

  // Only accept a well-formed setup. Anything out of range is fixed or flagged (never silently
  // reinterpreted), and older saves that lack newer properties fall back to safe defaults.
  function sanitizeSetup(cfg, fromDraft) {
    if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.squads)) return null;
    if (cfg.squads.length < 2 || cfg.squads.length > MAX_SQUADS) return null;
    const clampN = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
    const pick = (v, list, d) => (list.indexOf(v) !== -1 ? v : d);
    const notes = [];
    const out = { squads: [], opts: DEFAULT_OPTS(), notes };
    for (let i = 0; i < cfg.squads.length; i++) {
      const s = cfg.squads[i];
      if (!s || typeof s !== "object") return null;
      out.squads.push({
        name: String(s.name == null ? "" : s.name).slice(0, 40) || "Squad " + (i + 1),
        count: clampN(s.count, 1, MAX_PLAYERS, 10),
        players: String(s.players == null ? "" : s.players).slice(0, 3000),
      });
    }
    const o = (cfg.opts && typeof cfg.opts === "object") ? cfg.opts : {};
    const d = out.opts;
    d.spare = pick(o.spare, ENUMS.spare, d.spare);
    d.matchup = pick(o.matchup, ENUMS.matchup, d.matchup);
    d.formation = pick(o.formation, ENUMS.formation, d.formation);
    d.pitchMode = pick(o.pitchMode, ENUMS.pitchMode, d.pitchMode);
    d.noRest = o.noRest === true;
    d.fairPriority = o.fairPriority !== false;
    // team size: must be a whole number 1..11
    if (o.teamSize !== undefined) {
      const r = window.FixtureEngine.parseTeamSize(o.teamSize);
      if (r.ok) d.teamSize = r.size;
      else { d.teamSize = clampN(o.teamSize, 1, 11, 3); notes.push(`The saved team size (${String(o.teamSize).slice(0, 12)}) is not allowed, so it was set to ${d.teamSize}v${d.teamSize}. Please check it.`); }
    }
    // Everyone-plays mode: the old "spare"/"join" modes quietly let squads mix, so they do not carry over.
    if (o.noRestMode === "strict" || o.noRestMode === "relax") d.noRestMode = o.noRestMode;
    else if (o.noRest === true && (o.noRestMode === "spare" || o.noRestMode === "join")) notes.push("Everyone plays now keeps your match-up rule unless you choose 'Allow mixing squads if needed'. Check that option.");
    // manual pitch sizes: keep as typed; invalid ones (e.g. an old "7v5") are flagged for correction
    if (Array.isArray(o.manual)) {
      d.manual = o.manual.slice(0, 8).map((v) => (v === null || v === undefined ? null : typeof v === "number" ? String(v) : String(v).slice(0, 12)));   // null = follow the team size above
      d.manual.forEach((v, p) => { if (v !== null && v !== "" && !window.FixtureEngine.parseTeamSize(v).ok && d.pitchMode === "manual") notes.push(`Pitch ${p + 1} was saved as "${v}", which is not an equal-sided team size. Enter one number per team.`); });
    }
    Object.keys(LIMITS).forEach((k) => { const L = LIMITS[k]; if (cfg[k] !== undefined && cfg[k] !== "") out[k] = clampN(cfg[k], L.min, L.max, L.def); });
    const form = (fromDraft && cfg.form && typeof cfg.form === "object") ? cfg.form : cfg;
    if (form !== cfg) Object.keys(LIMITS).forEach((k) => { if (form[k] !== undefined && form[k] !== "") out[k] = clampN(form[k], LIMITS[k].min, LIMITS[k].max, LIMITS[k].def); });
    out.startTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(form.startTime) ? form.startTime : (/^([01]\d|2[0-3]):[0-5]\d$/.test(cfg.startTime) ? cfg.startTime : FORM_DEFAULTS.startTime);
    return out;
  }

  // Load a saved setup / template / imported file and repaint the whole screen from it.
  function restore(raw) {
    const cfg = sanitizeSetup(raw);
    if (!cfg) return false;
    squads = cfg.squads; opts = cfg.opts;
    FORM_FIELDS.forEach((k) => { if (cfg[k] !== undefined) $(k).value = cfg[k]; });
    pendingNotes = cfg.notes.slice();
    renderSquadRows(); renderSquadEditors(); renderAttendance(); syncAllControls(); saveDraft();
    return true;
  }

  function resetSettings() {
    opts = DEFAULT_OPTS();
    FORM_FIELDS.forEach((k) => ($(k).value = FORM_DEFAULTS[k]));
    pendingNotes = [];
    $("optionsWarn").textContent = ""; $("sessionWarn").textContent = "";
    syncAllControls(); saveDraft();
  }
  $("resetSettingsRow").addEventListener("click", () => { resetSettings(); toast("Session settings reset to their defaults."); });

  function renderSaved() {
    const all = loadStore(), names = Object.keys(all).sort();
    $("savedList").innerHTML = names.length ? names.map((n) => `
      <div class="squad-row">
        <span class="list-ico" data-icon="save"></span>
        <span class="squad-row-text"><strong>${esc(n)}</strong><small>${(all[n].squads || []).length} squads</small></span>
        <span class="stepper">
          <button type="button" class="btn btn-soft" style="padding:8px 14px;font-size:.8rem" data-load="${esc(n)}">Load</button>
          <button type="button" class="step-btn" data-del="${esc(n)}" aria-label="Delete"><span data-icon="minus"></span></button>
        </span>
      </div>`).join("") : `<div class="empty"><p class="hint">No saved setups yet. Turn on "Save as template" when you generate fixtures.</p></div>`;
    paintIcons($("savedList"));
  }

  $("savedList").addEventListener("click", (e) => {
    const l = e.target.closest("[data-load]"), d = e.target.closest("[data-del]");
    if (l) {
      if (restore(loadStore()[l.dataset.load])) { $("savedStatus").textContent = `Loaded "${l.dataset.load}".`; navigate("create"); }
      else $("savedStatus").textContent = `"${l.dataset.load}" could not be loaded because it is not a valid setup.`;
    }
    else if (d) { const all = loadStore(); delete all[d.dataset.del]; saveStore(all); renderSaved(); $("savedStatus").textContent = `Deleted "${d.dataset.del}".`; }
  });

  $("exportSetupBtn").addEventListener("click", () => download(JSON.stringify(snapshot(), null, 2), "3v3-setup.json", "application/json"));
  $("importSetupInput").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { $("savedStatus").textContent = restore(JSON.parse(r.result)) ? "Setup imported." : "That file is not a valid setup (it needs 2 to 4 squads)."; } catch (err) { $("savedStatus").textContent = "That file could not be read as a setup."; } };
    r.readAsText(f); e.target.value = "";
  });

  /* ============ Export ============ */
  function download(text, filename, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  function exportCSV() {
    if (!result) { navigate("create"); return; }
    download(window.FixtureEngine.toCSV(result), "3v3-fixture-schedule.csv", "text/csv;charset=utf-8;");
  }
  ["homeExportBtn", "completeExportBtn", "settingsExportBtn"].forEach((id) => $(id).addEventListener("click", exportCSV));

  /* ============ Theme ============ */
  const isDark = () => {
    const ex = document.documentElement.getAttribute("data-theme");
    if (ex) return ex === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  function paintTheme() {
    const d = isDark();
    $("themeLabel").textContent = d ? "Dark mode" : "Light mode";
    $("themeSwitch").setAttribute("aria-checked", String(d));
    const ico = $("themeRow").querySelector(".list-ico");
    ico.setAttribute("data-icon", d ? "sun" : "moon");
    paintIcons($("themeRow"));
  }
  $("themeRow").addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME, next); } catch (e) {}
    paintTheme();
  });
  if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => { if (!document.documentElement.getAttribute("data-theme")) paintTheme(); });

  /* ============ Init ============ */
  paintIcons();
  loadDraft();
  renderSquadRows(); renderSquadEditors(); renderAttendance(); paintTheme();
  syncAllControls();
  window.addEventListener("popstate", (e) => {
    const st = e.state;
    if (st && st.screen) show(st.screen, st.opt);
    else show("home");
  });

  loadSession();
  history.replaceState({ screen: "home", opt: null }, "");
  show("home");

  /* ============ Offline & updates ============ */
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2600);
  }
  window.addEventListener("offline", () => toast("You are offline. The app still works."));
  window.addEventListener("online", () => toast("Back online."));
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
    let wantReload = false;
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      const offer = (w) => { if (w && navigator.serviceWorker.controller) { $("updateBar").hidden = false; $("updateReload").onclick = () => { wantReload = true; w.postMessage("skipWaiting"); }; } };
      if (reg.waiting) offer(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing; if (!w) return;
        w.addEventListener("statechange", () => { if (w.state === "installed") offer(w); });
      });
    }).catch(() => {});
    $("updateLater").addEventListener("click", () => ($("updateBar").hidden = true));
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (wantReload) location.reload(); });
  }
})();
