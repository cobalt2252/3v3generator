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
  let opts = { spare: "subs", teamSize: 3, matchup: "cross", formation: "rotate", pitchMode: "auto", manual: [] };
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
    if (id === "session") renderSummaryRows();
    if (id === "home") renderHome();
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) {
      const target = go.dataset.go;
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
  function renderSquadRows() {
    $("squadRows").innerHTML = squads.map((s, i) => `
      <div class="squad-row">
        <span class="squad-dot sq-${i}"></span>
        <span class="squad-row-text"><strong>${esc(s.name)}</strong><small>${s.count} player${s.count === 1 ? "" : "s"}</small></span>
        ${squads.length > 2 ? `<button type="button" class="step-btn ghost" data-remove="${i}" aria-label="Remove ${esc(s.name)}"><span data-icon="trash"></span></button>` : ""}
        <span class="stepper">
          <button type="button" class="step-btn" data-dec="${i}" ${s.count <= 1 ? "disabled" : ""} aria-label="Fewer players"><span data-icon="minus"></span></button>
          <span class="step-val">${s.count}</span>
          <button type="button" class="step-btn" data-inc="${i}" ${s.count >= 15 ? "disabled" : ""} aria-label="More players"><span data-icon="plus"></span></button>
        </span>
      </div>`).join("");
    $("addSquadBtn").disabled = squads.length >= MAX_SQUADS;
    $("squadHint").textContent = squads.length >= MAX_SQUADS
      ? "Maximum of 4 squads reached." : `You can add up to ${MAX_SQUADS} squads.`;
    paintIcons($("squadRows"));
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
      renderSquadRows(); renderSquadEditors(); return;
    }
    const dec = e.target.closest("[data-dec]"), inc = e.target.closest("[data-inc]");
    if (dec) squads[+dec.dataset.dec].count = Math.max(1, squads[+dec.dataset.dec].count - 1);
    else if (inc) squads[+inc.dataset.inc].count = Math.min(15, squads[+inc.dataset.inc].count + 1);
    else return;
    renderSquadRows();
  });
  $("addSquadBtn").addEventListener("click", () => {
    if (squads.length >= MAX_SQUADS) return;
    squads.push({ name: "Squad " + String.fromCharCode(65 + squads.length), count: 10, players: "" });
    renderSquadRows(); renderSquadEditors();
  });
  $("squadNameEditors").addEventListener("input", (e) => {
    const box = e.target.closest("[data-sq]"); if (!box) return;
    const i = +box.dataset.sq;
    if (e.target.classList.contains("sq-name")) { squads[i].name = e.target.value || "Squad " + (i + 1); renderSquadRows(); }
    if (e.target.classList.contains("sq-players")) squads[i].players = e.target.value;
  });

  /* ============ Step 3: options ============ */
  const MATCHUP_HINT = {
    cross: "Squads always play a different squad, never themselves. Needs at least 2 squads.",
    separate: "Squads only ever play against themselves. Each squad needs enough players for two teams.",
    mixed: "Everyone goes into one pool and teams are drawn across all squads.",
  };
  const PITCH_HINT = {
    auto: "Every pitch uses the team size above.",
    balanced: "Splits everyone across every pitch each round (e.g. 3v3, 3v3, 3v2, 2v2) so nobody sits out when numbers are odd.",
    manual: "Set the team size for each pitch yourself.",
  };

  function segHandler(id, attr, apply) {
    $(id).addEventListener("click", (e) => {
      const b = e.target.closest(".seg-btn"); if (!b) return;
      [...$(id).children].forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
      apply(b.dataset[attr]);
    });
  }
  segHandler("formationSeg", "size", (v) => { opts.teamSize = +v; });
  segHandler("matchupSeg", "matchup", (v) => { opts.matchup = v; $("matchupHint").textContent = MATCHUP_HINT[v]; });
  segHandler("formationTypeSeg", "formation", (v) => { opts.formation = v; });
  segHandler("pitchModeSeg", "pmode", (v) => {
    opts.pitchMode = v;
    $("pitchModeHint").textContent = PITCH_HINT[v];
    $("manualFormats").hidden = v !== "manual";
    if (v === "manual") renderManual();
  });

  function renderManual() {
    const n = Math.max(1, Math.min(8, +$("numPitches").value || 1));
    const prev = {};
    $("manualFormats").querySelectorAll("input").forEach((i) => (prev[i.dataset.p] = i.value));
    $("manualFormats").innerHTML = Array.from({ length: n }, (_, p) =>
      `<label><span>Pitch ${p + 1}</span><input type="text" data-p="${p}" value="${esc(prev[p] || opts.teamSize + "v" + opts.teamSize)}" /></label>`).join("");
  }
  $("numPitches").addEventListener("input", () => { if (opts.pitchMode === "manual") renderManual(); });

  $("spareOptions").addEventListener("click", (e) => {
    const p = e.target.closest(".pick"); if (!p) return;
    [...$("spareOptions").children].forEach((x) => x.setAttribute("aria-pressed", x === p ? "true" : "false"));
    opts.spare = p.dataset.spare;
  });

  $("saveTemplateSwitch").addEventListener("click", () => {
    saveTemplate = !saveTemplate;
    $("saveTemplateSwitch").setAttribute("aria-checked", String(saveTemplate));
    $("templateName").hidden = !saveTemplate;
  });

  function renderSummaryRows() {
    $("sumFormation").textContent = opts.teamSize + "v" + opts.teamSize;
    $("sumMatchup").textContent = { cross: "Squad v squad", separate: "Within squad", mixed: "Mixed" }[opts.matchup];
    $("sumPitchFormats").textContent = { auto: "Automatic", balanced: "Balance uneven", manual: "Manual" }[opts.pitchMode];
  }

  /* ============ Generate ============ */
  function buildSettings() {
    const manual = [];
    $("manualFormats").querySelectorAll("input").forEach((i) => manual.push(i.value));
    return {
      squads: squads.map((s, i) => {
        const lines = s.players.split("\n").map((x) => x.trim()).filter(Boolean);
        const players = [];
        for (let n = 0; n < s.count; n++) players.push(lines[n] || `Player ${n + 1}`);
        return { name: s.name || "Squad " + (i + 1), players };
      }),
      gameTime: +$("gameTime").value || 8,
      restTime: +$("restTime").value || 0,
      bufferTime: +$("bufferTime").value || 0,
      totalSession: +$("totalSession").value || 60,
      startTime: $("startTime").value || "09:00",
      numPitches: Math.max(1, Math.min(8, +$("numPitches").value || 1)),
      teamSize: opts.teamSize,
      spareHandling: opts.spare,
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
      return Object.assign({}, p, { pct, tone, label, squadIndex: idx[p.squadName] || 0, rounds, avg });
    });
  }

  $("generateBtn").addEventListener("click", () => {
    const settings = buildSettings();
    const res = window.FixtureEngine.generateFixtures(settings);
    if (res.summary.totalRounds < 1) {
      $("optionsWarn").textContent = "No fixtures fit these settings — try a longer session or a shorter game time.";
      return;
    }
    $("optionsWarn").textContent = res.warnings.join(" ");
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
  const sqIdx = (name) => { for (let i = 0; i < result.squads.length; i++) if (result.squads[i].name === name) return i; return 0; };

  function teamLabel(t) {
    const cls = t.colorClass === "squad-mixed" ? "" : "sq-" + sqIdx(t.squadName);
    return `<span class="fx-team"><span class="squad-dot ${cls}" style="width:12px;height:12px"></span>${esc(t.squadName)}</span>`;
  }

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
      list.innerHTML = result.rounds.map((r) => {
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
          ? `<p class="rest-line"><span data-icon="pause"></span>Resting: ${esc(r.resting.map((x) => x.name).join(", "))}</p>` : "";
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
        const a = m.teamA.squadName === name, b = m.teamB.squadName === name;
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
      ${r.resting.length ? `<div class="card"><p class="card-title">Resting this round</p><p class="hint">${esc(r.resting.map((x) => x.name).join(", "))}</p></div>` : ""}`;
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
      <p class="sec-label">Squad comparison</p>
      <div class="cmp-row">
        ${result.squads.map((s, i) => `
          <div class="cmp">
            <span class="cmp-badge sq-${i}">${esc(squadBadge(s.name))}</span>
            <p class="cmp-name">${esc(s.name)}</p>
            <p class="cmp-num">${s.avgGames.toFixed(1)}</p>
            <p class="cmp-unit">avg games / player</p>
            <p class="cmp-meta"><span class="squad-dot sq-${i}" style="width:9px;height:9px"></span>${s.playerCount} players</p>
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
              <span class="pf-games">${p.gamesPlayed} games · ${p.restCount} rest · ${esc(p.label)}</span>
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
        stopTick(); releaseWake(); alert("done");
      } else alert(l.phase.type);
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
  function alert(kind) {
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
      squads: JSON.parse(JSON.stringify(squads)), opts: JSON.parse(JSON.stringify(opts)),
      gameTime: $("gameTime").value, restTime: $("restTime").value, bufferTime: $("bufferTime").value,
      totalSession: $("totalSession").value, startTime: $("startTime").value, numPitches: $("numPitches").value,
    };
  }
  function restore(cfg) {
    if (!cfg) return;
    if (cfg.squads) squads = cfg.squads;
    if (cfg.opts) opts = Object.assign(opts, cfg.opts);
    ["gameTime", "restTime", "bufferTime", "totalSession", "startTime", "numPitches"].forEach((k) => {
      if (cfg[k] !== undefined && cfg[k] !== "") $(k).value = cfg[k];
    });
    [["formationSeg", "size", String(opts.teamSize)], ["matchupSeg", "matchup", opts.matchup],
     ["formationTypeSeg", "formation", opts.formation], ["pitchModeSeg", "pmode", opts.pitchMode]].forEach(([id, attr, val]) => {
      [...$(id).children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr] === val)));
    });
    [...$("spareOptions").children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.spare === opts.spare)));
    $("matchupHint").textContent = MATCHUP_HINT[opts.matchup];
    $("pitchModeHint").textContent = PITCH_HINT[opts.pitchMode];
    $("manualFormats").hidden = opts.pitchMode !== "manual";
    renderSquadRows(); renderSquadEditors();
  }

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
    if (l) { restore(loadStore()[l.dataset.load]); $("savedStatus").textContent = `Loaded "${l.dataset.load}".`; navigate("create"); }
    else if (d) { const all = loadStore(); delete all[d.dataset.del]; saveStore(all); renderSaved(); $("savedStatus").textContent = `Deleted "${d.dataset.del}".`; }
  });

  $("exportSetupBtn").addEventListener("click", () => download(JSON.stringify(snapshot(), null, 2), "3v3-setup.json", "application/json"));
  $("importSetupInput").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { restore(JSON.parse(r.result)); $("savedStatus").textContent = "Setup imported."; } catch (err) { $("savedStatus").textContent = "That file could not be read as a setup."; } };
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
  renderSquadRows(); renderSquadEditors(); renderSummaryRows(); paintTheme();
  $("matchupHint").textContent = MATCHUP_HINT[opts.matchup];
  $("pitchModeHint").textContent = PITCH_HINT[opts.pitchMode];
  window.addEventListener("popstate", (e) => {
    const st = e.state;
    if (st && st.screen) show(st.screen, st.opt);
    else show("home");
  });

  loadSession();
  history.replaceState({ screen: "home", opt: null }, "");
  show("home");
})();
