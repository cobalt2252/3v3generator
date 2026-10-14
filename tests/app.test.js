// Interface tests: the real index.html + js run inside jsdom.
// Needs jsdom (npm install). Skipped automatically when it is not installed.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

let JSDOM = null;
try { ({ JSDOM } = require("jsdom")); } catch (e) { /* skipped below */ }
const opt = { skip: JSDOM ? false : "jsdom not installed (run npm install)" };

const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const DRAFT = "3v3-draft-v1", SETUPS = "3v3-setups-v2", SESSION = "3v3-session-v1";

function boot(storage) {
  const html = read("index.html")
    .replace('<script src="js/engine.js"></script>', () => `<script>${read("js/engine.js")}</script>`)
    .replace('<script src="js/app.js"></script>', () => `<script>${read("js/app.js")}</script>`);
  const dom = new JSDOM(html, {
    runScripts: "dangerously", url: "http://localhost/", pretendToBeVisual: true,
    beforeParse(w) {
      w.scrollTo = () => {};
      Object.keys(storage || {}).forEach((k) => w.localStorage.setItem(k, typeof storage[k] === "string" ? storage[k] : JSON.stringify(storage[k])));
    },
  });
  const w = dom.window, d = w.document;
  const $ = (id) => d.getElementById(id);
  const api = {
    w, d, $,
    go: (screen) => { d.querySelector(`[data-go="${screen}"]`).click(); },
    click: (sel) => { const el = d.querySelector(sel); assert.ok(el, "missing " + sel); el.click(); },
    type: (sel, v) => { const el = d.querySelector(sel); el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); el.dispatchEvent(new w.Event("change", { bubbles: true })); },
    pressed: (id, attr) => { const b = [...$(id).children].find((x) => x.getAttribute("aria-pressed") === "true"); return b && b.dataset[attr]; },
    store: (k) => JSON.parse(w.localStorage.getItem(k) || "null"),
    visible: () => [...d.querySelectorAll(".screen")].filter((s) => !s.hidden).map((s) => s.id),
    // everything the options screen displays
    shown: () => ({
      teamSize: $("teamSizeInput").value, label: $("sizeLabel").textContent,
      matchup: api.pressed("matchupSeg", "matchup"), formation: api.pressed("formationTypeSeg", "formation"),
      pitchMode: api.pressed("pitchModeSeg", "pmode"), noRestMode: api.pressed("noRestModeSeg", "nrmode"),
      spare: [...$("spareOptions").children].find((b) => b.getAttribute("aria-pressed") === "true").dataset.spare,
      fair: $("fairSwitch").getAttribute("aria-checked"), noRest: $("noRestSwitch").getAttribute("aria-checked"),
      modeWrapHidden: $("noRestModeWrap").hidden, manualHidden: $("manualFormats").hidden,
      manual: [...$("manualFormats").querySelectorAll("input")].map((i) => i.value),
      matchupHint: $("matchupHint").textContent, pitchHint: $("pitchModeHint").textContent,
      formationHint: $("formationHint").textContent, sumFormation: $("sumFormation").textContent,
      gameTime: $("gameTime").value, restTime: $("restTime").value, bufferTime: $("bufferTime").value,
      totalSession: $("totalSession").value, startTime: $("startTime").value, numPitches: $("numPitches").value,
    }),
    close: () => w.close(),
  };
  return api;
}

// A setup touching every option, with non-default values everywhere.
const custom = () => ({
  v: 2,
  squads: [{ name: "Reds", count: 9, players: "" }, { name: "Blues", count: 12, players: "" }],
  opts: { spare: "rest", teamSize: 7, matchup: "mixed", formation: "together", pitchMode: "manual", manual: ["5", "7", "11"], noRest: true, noRestMode: "relax", fairPriority: false },
  form: { gameTime: 12, restTime: 4, bufferTime: 3, totalSession: 120, startTime: "18:30", numPitches: 3 },
});

function expectCustom(s) {
  assert.strictEqual(s.teamSize, "7"); assert.strictEqual(s.label, "7v7"); assert.strictEqual(s.sumFormation, "7v7");
  assert.strictEqual(s.matchup, "mixed"); assert.strictEqual(s.formation, "together"); assert.strictEqual(s.pitchMode, "manual");
  assert.strictEqual(s.spare, "rest"); assert.strictEqual(s.fair, "false"); assert.strictEqual(s.noRest, "true");
  assert.strictEqual(s.modeWrapHidden, false); assert.strictEqual(s.manualHidden, false);
  assert.deepStrictEqual(s.manual, ["5", "7", "11"]);
  assert.strictEqual(s.matchupHint, "Everyone goes into one pool and teams are drawn across all squads.");
  assert.match(s.pitchHint, /one number per team/);
  assert.match(s.formationHint, /All available players will be included where possible.*7v8/);
  assert.deepStrictEqual([s.gameTime, s.restTime, s.bufferTime, s.totalSession, s.startTime, s.numPitches], ["12", "4", "3", "120", "18:30", "3"]);
}

test("defaults: every control shows its default", opt, () => {
  const a = boot();
  const s = a.shown();
  assert.deepStrictEqual([s.teamSize, s.label, s.matchup, s.formation, s.pitchMode, s.spare, s.fair, s.noRest], ["3", "3v3", "cross", "rotate", "pitch" === "" ? "" : "auto", "subs", "true", "false"]);
  assert.strictEqual(s.noRestMode, "strict"); assert.strictEqual(s.modeWrapHidden, true); assert.strictEqual(s.manualHidden, true);
  assert.match(s.formationHint, /equal-sized teams. Additional players rotate between rounds/);
  a.close();
});

test("saved draft is restored into every visible control after a refresh", opt, () => {
  const a = boot({ [DRAFT]: custom() });
  expectCustom(a.shown());
  a.close();
});

test("changing options is saved and shown identically after a reload (every option)", opt, () => {
  const a = boot();
  a.go("create"); a.go("session"); a.go("options");
  a.click('[data-matchup="separate"]'); a.click('[data-formation="together"]'); a.click('[data-pmode="manual"]');
  a.click('[data-spare="rest"]'); a.click("#fairSwitch"); a.click("#noRestSwitch"); a.click('[data-nrmode="relax"]');
  a.type("#teamSizeInput", "9");
  a.type('#manualFormats input[data-p="1"]', "4");
  const before = a.shown();
  const draft = a.store(DRAFT);
  a.close();
  const b = boot({ [DRAFT]: draft });
  assert.deepStrictEqual(b.shown(), before);
  assert.strictEqual(before.matchup, "separate"); assert.strictEqual(before.teamSize, "9"); assert.deepStrictEqual(before.manual, ["9", "4", "9"]);
  b.close();
});

test("session fields (durations, start time, pitches) are restored from the draft", opt, () => {
  const a = boot({ [DRAFT]: custom() });
  const s = a.shown();
  assert.strictEqual(s.gameTime, "12"); assert.strictEqual(s.startTime, "18:30"); assert.strictEqual(s.numPitches, "3");
  a.close();
});

test("navigating back and forth never changes the settings", opt, () => {
  const a = boot({ [DRAFT]: custom() });
  a.go("create"); a.go("session"); a.go("options");
  const first = a.shown();
  a.w.history.back(); a.w.history.back();
  a.go("session"); a.go("options");
  assert.deepStrictEqual(a.shown(), first);
  expectCustom(first);
  a.close();
});

test("saved template loads and displays its own values", opt, () => {
  const tpl = custom(); delete tpl.form; Object.assign(tpl, tpl.form || {}, { gameTime: 12, restTime: 4, bufferTime: 3, totalSession: 120, startTime: "18:30", numPitches: 3 });
  const a = boot({ [SETUPS]: { "Tuesday U9s": tpl } });
  a.go("saved"); a.click("[data-load]");
  expectCustom(a.shown());
  a.close();
});

test("imported file displays its stored values", opt, async () => {
  const cfg = custom(); Object.assign(cfg, cfg.form);
  const a = boot();
  const input = a.$("importSetupInput");
  const file = new a.w.File([JSON.stringify(cfg)], "setup.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file] });
  input.dispatchEvent(new a.w.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 150));
  assert.match(a.$("savedStatus").textContent, /imported/i);
  expectCustom(a.shown());
  a.close();
});

test("invalid import is refused and changes nothing", opt, async () => {
  const a = boot();
  const before = a.shown();
  const input = a.$("importSetupInput");
  Object.defineProperty(input, "files", { value: [new a.w.File(['{"squads":"nope"}'], "bad.json")] });
  input.dispatchEvent(new a.w.Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 150));
  assert.match(a.$("savedStatus").textContent, /not a valid setup/);
  assert.deepStrictEqual(a.shown(), before);
  a.close();
});

test("backwards compatibility: a v1 draft with missing newer fields loads with safe defaults", opt, () => {
  const legacy = { squads: [{ name: "Old A", count: 10, players: "" }, { name: "Old B", count: 11, players: "" }], opts: { spare: "subs", teamSize: 4, matchup: "separate", formation: "rotate", pitchMode: "auto", manual: [], noRest: false } };
  const a = boot({ [DRAFT]: legacy });
  const s = a.shown();
  assert.strictEqual(s.teamSize, "4"); assert.strictEqual(s.matchup, "separate");
  assert.strictEqual(s.fair, "true"); assert.strictEqual(s.noRestMode, "strict");
  assert.strictEqual(s.gameTime, "8"); assert.strictEqual(a.$("squadRows").textContent.includes("Old A"), true);
  a.close();
});

test("legacy data that breaks the new rules is flagged, not silently reinterpreted", opt, () => {
  const legacy = {
    squads: [{ name: "A", count: 10, players: "" }, { name: "B", count: 10, players: "" }],
    opts: { teamSize: 15, matchup: "cross", pitchMode: "manual", manual: ["4", "7v5", "3v3"], noRest: true, noRestMode: "join" },
  };
  const a = boot({ [DRAFT]: legacy });
  a.go("create"); a.go("session"); a.go("options");
  const s = a.shown();
  assert.strictEqual(s.teamSize, "11", "capped at the limit");
  assert.deepStrictEqual(s.manual, ["4", "", "3"], "the 7v5 field is left empty for correction");
  assert.strictEqual(s.noRestMode, "strict", "old mixing mode does not carry over");
  const notes = a.$("optionsWarn").textContent;
  assert.match(notes, /team size \(15\) is not allowed/);
  assert.match(notes, /7v5/);
  assert.match(notes, /Allow mixing squads/);
  assert.match(a.$("manualFormats").textContent, /not an equal-sided format/);
  // generating is blocked until corrected
  a.click("#generateBtn");
  assert.deepStrictEqual(a.visible(), ["s-options"]);
  assert.match(a.$("optionsWarn").textContent, /correct the pitch sizes/i);
  a.close();
});

test("manual pitch entry: asymmetric or out-of-range values are flagged live and block generation", opt, () => {
  const a = boot();
  a.go("create"); a.go("session"); a.go("options");
  a.click('[data-pmode="manual"]');
  a.type('#manualFormats input[data-p="0"]', "40");
  assert.match(a.$("manualFormats").textContent, /1 to 11/);
  a.click("#generateBtn");
  assert.deepStrictEqual(a.visible(), ["s-options"]);
  a.type('#manualFormats input[data-p="0"]', "7");
  assert.strictEqual(a.d.querySelector("#manualFormats .m-fmt").textContent, "7v7");
  assert.strictEqual(a.d.querySelector("#manualFormats .m-err"), null);
  a.close();
});

test("team size input shows NvN and rejects invalid values", opt, () => {
  const a = boot();
  a.go("create"); a.go("session"); a.go("options");
  a.type("#teamSizeInput", "7"); assert.strictEqual(a.$("sizeLabel").textContent, "7v7");
  a.type("#teamSizeInput", "12"); assert.strictEqual(a.$("sizeLabel").textContent, "7v7"); assert.match(a.$("optionsWarn").textContent, /1 to 11/);
  a.type("#teamSizeInput", "3.5"); assert.strictEqual(a.$("sizeLabel").textContent, "7v7");
  a.type("#teamSizeInput", "0"); assert.strictEqual(a.$("sizeLabel").textContent, "7v7");
  a.click('[data-size="11"]'); assert.strictEqual(a.$("sizeLabel").textContent, "11v11"); assert.strictEqual(a.$("sizeInc").disabled, true);
  a.close();
});

test("Everyone plays toggles the hint and its dependent controls", opt, () => {
  const a = boot();
  a.go("create"); a.go("session"); a.go("options");
  assert.strictEqual(a.$("noRestModeWrap").hidden, true);
  a.click("#noRestSwitch");
  assert.strictEqual(a.$("noRestModeWrap").hidden, false);
  assert.strictEqual(a.$("noRestSwitch").getAttribute("aria-checked"), "true");
  assert.match(a.$("formationHint").textContent, /3v4/);
  assert.ok(a.$("spareOptions").classList.contains("is-off"));
  a.click('[data-matchup="mixed"]');
  assert.strictEqual(a.$("noRestModeSeg").hidden, true, "no match-up rule to relax in mixed mode");
  a.click("#noRestSwitch");
  assert.match(a.$("formationHint").textContent, /equal-sized teams/);
  assert.ok(!a.$("spareOptions").classList.contains("is-off"));
  a.close();
});

test("settings submitted to the engine equal the displayed ones", opt, async () => {
  const a = boot({ [DRAFT]: custom() });
  a.go("create"); a.go("session"); a.go("options");
  const shown = a.shown();
  a.click("#generateBtn");
  await new Promise((r) => setTimeout(r, 1800));
  assert.deepStrictEqual(a.visible(), ["s-complete"]);
  const res = a.store(SESSION).result;
  assert.strictEqual(res.settings.matchup, shown.matchup);
  assert.strictEqual(res.settings.noRest, true);
  assert.deepStrictEqual(res.settings.pitchTeamSize, shown.manual.map(Number));
  assert.strictEqual(res.settings.gameTime, +shown.gameTime);
  assert.strictEqual(res.settings.startTime, shown.startTime);
  assert.strictEqual(res.settings.numPitches, +shown.numPitches);
  res.rounds.forEach((rd) => rd.matches.forEach((m) => { if (!m.empty) assert.ok(Math.abs(m.teamA.playerIds.length - m.teamB.playerIds.length) <= 1); }));
  a.close();
});

test("if the screen and state ever disagree, generation stops and the screen is refreshed", opt, () => {
  const a = boot();
  a.go("create"); a.go("session"); a.go("options");
  // simulate a stale control: it claims Mixed while the state is Squad v squad
  a.d.querySelector('[data-matchup="cross"]').setAttribute("aria-pressed", "false");
  a.d.querySelector('[data-matchup="mixed"]').setAttribute("aria-pressed", "true");
  a.click("#generateBtn");
  assert.deepStrictEqual(a.visible(), ["s-options"]);
  assert.match(a.$("optionsWarn").textContent, /out of date/);
  assert.strictEqual(a.pressed("matchupSeg", "matchup"), "cross", "screen repainted from state");
  a.close();
});

test("impossible session cannot reach the success screen or overwrite the saved session", opt, async () => {
  const draft = custom();
  draft.squads = [{ name: "A", count: 1, players: "" }, { name: "B", count: 1, players: "" }];
  draft.opts = Object.assign(draft.opts, { matchup: "separate", noRest: true, noRestMode: "strict", pitchMode: "auto", teamSize: 3 });
  const a = boot({ [DRAFT]: draft });
  a.go("create"); a.go("session"); a.go("options");
  a.click("#generateBtn");
  await new Promise((r) => setTimeout(r, 1800));
  assert.deepStrictEqual(a.visible(), ["s-options"]);
  assert.match(a.$("optionsWarn").textContent, /Unable to generate fixtures/);
  assert.match(a.$("optionsWarn").textContent, /Each squad has only one player, so a within-squad match cannot be formed/);
  assert.strictEqual(a.store(SESSION), null, "no completed session is saved");
  a.close();
});

test("a failed generation keeps the previous good session", opt, async () => {
  const a = boot();
  a.go("create"); a.go("session"); a.go("options");
  a.click("#generateBtn");
  await new Promise((r) => setTimeout(r, 1800));
  const good = a.store(SESSION);
  assert.ok(good && good.result.summary.totalMatches > 0);
  a.go("create"); a.go("session"); a.go("options");
  a.click('[data-size="11"]');       // 11v11 needs 22 players; the default squads have 21
  a.click("#generateBtn");
  assert.match(a.$("optionsWarn").textContent, /Unable to generate fixtures/);
  assert.deepStrictEqual(a.store(SESSION).result.summary, good.result.summary);
  a.close();
});

test("reset puts every option and field back to its default", opt, () => {
  const a = boot({ [DRAFT]: custom() });
  a.go("settings".replace("settings", "saved")); // any navigation
  a.click("#resetSettingsRow");
  const s = a.shown();
  assert.deepStrictEqual([s.teamSize, s.matchup, s.formation, s.pitchMode, s.spare, s.fair, s.noRest, s.noRestMode, s.gameTime, s.startTime, s.numPitches],
    ["3", "cross", "rotate", "auto", "subs", "true", "false", "strict", "8", "09:00", "3"]);
  assert.deepStrictEqual(a.store(DRAFT).opts.teamSize, 3);
  a.close();
});

test("attendance is not carried into a restored draft", opt, () => {
  const d = custom(); d.squads[0].absent = [0, 1];
  const a = boot({ [DRAFT]: d });
  assert.match(a.$("attSummary").textContent, /^21 of 21/);
  a.close();
});
