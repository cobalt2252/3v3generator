// Run with:  npm test      (or: node --test tests/*.test.js)
const test = require("node:test");
const assert = require("node:assert");
const E = require("../js/engine.js");

const mk = (n, c) => ({ name: n, players: Array.from({ length: c }, (_, i) => n[0] + (i + 1)) });
const base = {
  gameTime: 8, restTime: 2, bufferTime: 0, totalSession: 90, startTime: "09:00",
  numPitches: 3, teamSize: 3, spareHandling: "subs", teamFormation: "rotate",
  matchup: "cross", pitchFormatMode: "auto", noRest: false, noRestMode: "strict",
};
const gen = (squads, over) => E.generateFixtures(Object.assign({}, base, { squads }, over));
const two = (a, b, over) => gen([mk("A", a), mk("B", b)], over);
const pool = (n, over) => gen([mk("A", n)], Object.assign({ matchup: "mixed", numPitches: 1 }, over));
const games = (r) => r.rounds.flatMap((rd) => rd.matches.filter((m) => !m.empty));
const shape = (m) => `${m.teamA.playerIds.length}v${m.teamB.playerIds.length}`;
const ids = (m) => m.teamA.playerIds.concat(m.teamB.playerIds);

/* ---------- DEFECT 1: equal-sided formations ---------- */

test("parseTeamSize accepts whole numbers 1..11 and equal-sided NvN", () => {
  for (let n = 1; n <= 11; n++) {
    assert.deepStrictEqual(E.parseTeamSize(n), { ok: true, size: n });
    assert.deepStrictEqual(E.parseTeamSize(String(n)), { ok: true, size: n });
    assert.deepStrictEqual(E.parseTeamSize(`${n}v${n}`), { ok: true, size: n });
  }
  assert.strictEqual(E.parseTeamSize(" 7 V 7 ").size, 7);
});

test("parseTeamSize rejects asymmetric, zero, negative, decimal, non-numeric and oversized input", () => {
  for (const bad of ["7v5", "4v3", "7v8", "40v40", "12", 12, "0", 0, "-3", -3, "3.5", 3.5, "abc", "", "  ", "3v", "v3", "3v3v3", null, undefined, NaN, {}, "1e1"]) {
    const r = E.parseTeamSize(bad);
    assert.strictEqual(r.ok, false, `should reject ${JSON.stringify(bad)}`);
    assert.ok(r.error && r.error.length > 10);
  }
});

test("asymmetric text is never silently turned into a symmetric match", () => {
  for (const f of ["7v5", "4v3", "40v40", "abc"]) {
    const r = two(30, 30, { pitchFormatMode: "manual", manualFormats: [f, f, f], numPitches: 3 });
    assert.strictEqual(r.ok, false, f);
    assert.strictEqual(r.summary.totalMatches, 0, f);
    assert.ok(r.errors.some((e) => /Pitch 1/.test(e)));
  }
});

test("engine rejects an invalid team size and pitch count rather than clamping", () => {
  assert.strictEqual(two(30, 30, { teamSize: 40 }).ok, false);
  assert.strictEqual(two(30, 30, { teamSize: 7.5 }).ok, false);
  assert.strictEqual(two(30, 30, { numPitches: 0 }).ok, false);
});

test("every formation 1v1 .. 11v11 generates exactly that formation (Everyone plays OFF)", () => {
  for (let n = 1; n <= 11; n++) {
    const r = two(2 * n, 2 * n, { teamSize: n, numPitches: 1 });
    assert.ok(r.ok, `${n}v${n}`);
    games(r).forEach((m) => { assert.strictEqual(m.format, `${n}v${n}`); assert.strictEqual(shape(m), `${n}v${n}`); });
  }
});

test("Everyone plays OFF never generates uneven matches (all modes, pitches, match-ups)", () => {
  for (const pm of ["auto", "balanced", "manual"]) for (const mu of ["cross", "separate", "mixed"])
    for (const cnt of [[8, 11], [10, 11], [7, 9], [15, 16], [5, 14]]) for (const pit of [1, 2, 3, 4]) for (const size of [2, 3, 5]) {
      const r = two(cnt[0], cnt[1], { pitchFormatMode: pm, matchup: mu, numPitches: pit, teamSize: size, manualFormats: Array(pit).fill(size) });
      if (!r.ok) continue;
      games(r).forEach((m) => assert.strictEqual(m.teamA.playerIds.length, size) || assert.strictEqual(m.teamB.playerIds.length, size));
    }
});

test("original scenario, Everyone plays OFF: 8 v 11, 3v3, 3 pitches -> two 3v3 and an unused pitch", () => {
  const r = two(8, 11);
  assert.ok(r.ok);
  r.rounds.forEach((rd) => {
    assert.deepStrictEqual(rd.matches.map((m) => (m.empty ? "empty" : m.format)), ["3v3", "3v3", "empty"]);
    assert.strictEqual(rd.resting.length, 19 - 12);
  });
  games(r).forEach((m) => assert.notStrictEqual(m.format, "3v2"));
  assert.strictEqual(r.pitchUsage.find((u) => u.pitch === 3).emptyRounds, r.rounds.length);
});

test("OFF: surplus players rotate fairly (fewest games first)", () => {
  const r = two(8, 11, { totalSession: 200 });
  const g = r.players.map((p) => p.gamesPlayed);
  assert.ok(Math.max(...g.slice(0, 8)) - Math.min(...g.slice(0, 8)) <= 1, "squad A");
  assert.ok(Math.max(...g.slice(8)) - Math.min(...g.slice(8)) <= 1, "squad B");
  assert.ok(r.players.every((p) => p.sitOuts >= 0));
});

/* ---------- Everyone plays ON: controlled uneven teams ---------- */

const table = [
  // players, size, ON, expected formation on the single pitch (or null = must fail)
  [6, 3, false, "3v3"], [7, 3, false, "3v3"], [7, 3, true, "3v4"], [8, 3, true, "4v4"],
  [14, 7, false, "7v7"], [15, 7, false, "7v7"], [15, 7, true, "7v8"], [16, 7, true, "8v8"],
  [22, 11, false, "11v11"], [23, 11, true, null],
];
for (const [n, size, on, expected] of table) {
  test(`spec table: ${n} players, ${size}v${size}, Everyone plays ${on ? "ON" : "OFF"} -> ${expected || "cannot fit"}`, () => {
    const r = pool(n, { teamSize: size, noRest: on });
    if (expected === null) {
      assert.strictEqual(r.ok, false);
      assert.match(r.errors.join(" "), /cannot all play|at most 22/);
      return;
    }
    assert.ok(r.ok);
    r.rounds.forEach((rd) => {
      const m = rd.matches[0];
      const got = [m.teamA.playerIds.length, m.teamB.playerIds.length].sort((a, b) => a - b).join("v");
      const want = expected.split("v").map(Number).sort((a, b) => a - b).join("v");
      assert.strictEqual(got, want);
      assert.strictEqual(rd.resting.length, on ? 0 : n - 2 * size);
    });
  });
}

test("ON: sides differ by at most one, never exceed 11, nobody is left out, no one is double-booked", () => {
  for (const mu of ["cross", "separate", "mixed"]) for (const cnt of [[8, 11], [10, 11], [11, 6], [15, 15], [22, 22], [5, 5], [7, 9], [3, 12]])
    for (const pit of [1, 2, 3, 4]) for (const size of [1, 3, 5, 7, 11]) for (const pm of ["auto", "balanced", "manual"]) {
      const r = two(cnt[0], cnt[1], { noRest: true, matchup: mu, numPitches: pit, teamSize: size, pitchFormatMode: pm, manualFormats: Array(pit).fill(size) });
      if (!r.ok) { assert.ok(r.errors.length > 0 && r.summary.totalMatches >= 0); continue; }
      r.rounds.forEach((rd) => {
        assert.strictEqual(rd.resting.length, 0, "everyone plays");
        const seen = new Set();
        rd.matches.filter((m) => !m.empty).forEach((m) => {
          assert.ok(Math.abs(m.teamA.playerIds.length - m.teamB.playerIds.length) <= 1, `${m.format}`);
          assert.ok(m.teamA.playerIds.length <= 11 && m.teamB.playerIds.length <= 11);
          ids(m).forEach((id) => { assert.ok(!seen.has(id)); seen.add(id); });
        });
        assert.ok(rd.matches.length <= pit);
      });
    }
});

test("ON never produces 7v9 or 3v5 style gaps", () => {
  for (let n = 2; n <= 44; n++) {
    const r = pool(n, { noRest: true, teamSize: 7, numPitches: 2 });
    if (!r.ok) continue;
    games(r).forEach((m) => assert.ok(Math.abs(m.teamA.playerIds.length - m.teamB.playerIds.length) <= 1));
  }
});

test("original scenario, Everyone plays ON: 8 v 11 -> all 19 play, squad v squad kept, actual formations shown", () => {
  const r = two(8, 11, { noRest: true });
  assert.ok(r.ok);
  r.rounds.forEach((rd) => {
    assert.strictEqual(rd.resting.length, 0);
    const played = rd.matches.flatMap(ids);
    assert.strictEqual(new Set(played).size, 19);
    rd.matches.forEach((m) => {
      assert.notStrictEqual(m.teamA.squadName, m.teamB.squadName, "squad v squad");
      assert.strictEqual(m.format, shape(m), "label equals real sizes");
      assert.ok(Math.abs(m.teamA.playerIds.length - m.teamB.playerIds.length) <= 1);
    });
  });
});

test("ON: the extra player rotates instead of always favouring the same players", () => {
  const r = pool(15, { noRest: true, teamSize: 7, totalSession: 400 });
  const extra = r.players.map((p) => p.extraTeamGames);
  assert.ok(Math.max(...extra) - Math.min(...extra) <= 1, JSON.stringify(extra));
});

test("ON: squad restrictions are kept; if they cannot fit everyone the engine explains instead of relaxing", () => {
  const r = two(3, 12, { noRest: true, numPitches: 3 });
  assert.strictEqual(r.ok, false);
  assert.match(r.errors[0], /Allow mixing squads|differ by at most one/);
  const relaxed = two(3, 12, { noRest: true, numPitches: 3, noRestMode: "relax" });
  assert.ok(relaxed.ok, "organiser explicitly allowed mixing");
  assert.ok(relaxed.warnings.some((w) => /mixed/i.test(w)));
});

test("ON + within squad / mixed / squad v squad each keep their own rule", () => {
  const sep = gen([mk("A", 9), mk("B", 10)], { matchup: "separate", noRest: true });
  assert.ok(sep.ok);
  games(sep).forEach((m) => assert.strictEqual(m.teamA.squadName, m.teamB.squadName));
  const mix = gen([mk("A", 9), mk("B", 10)], { matchup: "mixed", noRest: true });
  assert.ok(mix.ok);
  const cross = gen([mk("A", 9), mk("B", 10), mk("C", 8)], { matchup: "cross", noRest: true, numPitches: 4 });
  if (cross.ok) games(cross).forEach((m) => assert.notStrictEqual(m.teamA.squadName, m.teamB.squadName));
});

/* ---------- DEFECT 2: zero-match sessions ---------- */

test("1 v 1 within-squad with Everyone plays ON is rejected with an actionable message", () => {
  const r = gen([mk("A", 1), mk("B", 1)], { matchup: "separate", noRest: true, numPitches: 3 });
  assert.strictEqual(r.ok, false);
  assert.match(r.errors[0], /Each squad has only one player, so a within-squad match cannot be formed/);
  assert.match(r.errors[0], /Squad v squad or Mixed/);
});

test("zero-match sessions are never ok, in any mode", () => {
  for (const nr of [false, true]) for (const mu of ["cross", "separate", "mixed"]) for (const size of [1, 3, 11]) {
    const r = gen([mk("A", 1), mk("B", 1)], { matchup: mu, noRest: nr, teamSize: size });
    if (r.summary.totalMatches === 0) assert.strictEqual(r.ok, false, `${mu} ${nr} ${size}`);
    if (r.ok) assert.ok(r.summary.totalMatches > 0);
  }
});

test("insufficient players: explains how many are needed", () => {
  const r = pool(5, { teamSize: 3 });
  assert.strictEqual(r.ok, false);
  assert.match(r.errors[0], /needs 6 players but only 5/);
});

test("incompatible match-up modes are explained", () => {
  const sep = gen([mk("A", 4), mk("B", 4)], { matchup: "separate", teamSize: 3 });
  assert.strictEqual(sep.ok, false);
  assert.match(sep.errors[0], /within-squad 3v3 needs 6 players/);
  const cross = gen([mk("A", 8)], { matchup: "cross" });
  assert.strictEqual(cross.ok, false);
  assert.match(cross.errors[0], /Squad v squad/);
});

test("no-rest impossible configurations are rejected, never silently leaving players out", () => {
  assert.strictEqual(pool(1, { noRest: true }).ok, false);
  assert.strictEqual(pool(23, { noRest: true, teamSize: 11 }).ok, false);
  assert.strictEqual(gen([mk("A", 1), mk("B", 9)], { matchup: "separate", noRest: true }).ok, false);
  assert.strictEqual(gen([mk("A", 5), mk("B", 5), mk("C", 5)], { matchup: "separate", noRest: true, numPitches: 2 }).ok, false);
  for (let n = 2; n < 30; n++) {
    const r = pool(n, { noRest: true, numPitches: 2 });
    if (r.ok) r.rounds.forEach((rd) => assert.strictEqual(rd.resting.length, 0));
  }
});

test("a session shorter than one game is not ok", () => {
  const r = two(8, 11, { totalSession: 1 });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.rounds.length, 0);
});

test("every successful result has at least one match and consistent labels", () => {
  for (const nr of [false, true]) for (const size of [1, 2, 3, 5, 7, 11]) for (const cnt of [[8, 11], [4, 4], [2, 30]]) {
    const r = two(cnt[0], cnt[1], { noRest: nr, teamSize: size });
    if (!r.ok) continue;
    assert.ok(r.summary.totalMatches > 0);
    games(r).forEach((m) => assert.strictEqual(m.format, shape(m)));
  }
});

/* ---------- General rules that must survive ---------- */

test("squad v squad never pairs a squad with itself", () => {
  for (const [a, b] of [[8, 11], [10, 11], [11, 6], [15, 15]]) games(two(a, b)).forEach((m) => assert.notStrictEqual(m.teamA.squadName, m.teamB.squadName));
});

test("keep-together teams still work and stay equal-sided", () => {
  const r = two(9, 9, { teamFormation: "together" });
  assert.ok(r.ok);
  games(r).forEach((m) => assert.strictEqual(m.format, "3v3"));
});

test("keep-together with different manual sizes is rejected, not silently skipped", () => {
  const r = two(12, 12, { teamFormation: "together", pitchFormatMode: "manual", manualFormats: [3, 4, 3], numPitches: 3 });
  assert.strictEqual(r.ok, false);
});

test("manual pitch sizes are respected pitch by pitch", () => {
  const r = two(20, 20, { pitchFormatMode: "manual", manualFormats: ["2", "4v4", 5], numPitches: 3 });
  assert.ok(r.ok);
  r.rounds.forEach((rd) => assert.deepStrictEqual(rd.matches.map((m) => m.format), ["2v2", "4v4", "5v5"]));
});

test("fewest-games-first off still never breaks the format rules", () => {
  const r = two(8, 11, { fairPriority: false });
  assert.ok(r.ok);
  games(r).forEach((m) => assert.strictEqual(m.format, "3v3"));
});

test("squads keep their colour when an earlier squad is dropped", () => {
  const r = gen([{ name: "B", players: ["b1", "b2", "b3"], colorIndex: 1 }, { name: "C", players: ["c1", "c2", "c3"], colorIndex: 2 }], {});
  assert.strictEqual(r.squads[0].colorClass, "squad-b");
  assert.strictEqual(r.squads[1].colorClass, "squad-c");
});

test("sit-outs are recorded per player", () => {
  const r = pool(15, { teamSize: 7 });
  assert.strictEqual(r.players.reduce((t, p) => t + p.sitOuts, 0), r.rounds.reduce((t, rd) => t + rd.resting.length, 0));
});

test("CSV export still works", () => {
  const csv = E.toCSV(two(8, 11));
  assert.ok(csv.split("\r\n").length > 5);
  assert.match(csv, /3v3/);
});
