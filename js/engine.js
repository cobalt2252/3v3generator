/**
 * 3v3 Fixture Engine
 * ------------------
 * Pure scheduling logic — no DOM access, so it can run in the browser
 * or under Node for testing.
 *
 * Public entry point: generateFixtures(settings) -> Result
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.FixtureEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SQUAD_COLORS = ["squad-a", "squad-b", "squad-c", "squad-d"];
  // A squad keeps its colour even if an earlier squad is dropped (e.g. nobody present).
  function colorFor(squads, i) {
    const c = squads && squads[i] && squads[i].colorIndex;
    return SQUAD_COLORS[(c == null ? i : c) % SQUAD_COLORS.length];
  }

  /** Format minutes-from-midnight as HH:MM (24h) */
  function fmtTime(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.round(mins % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  function parseTimeToMinutes(hhmm) {
    const parts = String(hhmm || "09:00").split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  const MAX_TEAM = 11;      // most players one team may have
  const MAX_PITCHES = 8;

  /**
   * Parse ONE team size: whole number 1..11 ("7" or the equal-sided "7v7").
   * Never guesses: asymmetric ("7v5"), decimal, negative, zero, non-numeric or
   * too-large input is rejected with a message the organiser can act on.
   */
  function parseTeamSize(value) {
    const fail = (error) => ({ ok: false, error });
    const range = (n, shown) => (n >= 1 && n <= MAX_TEAM
      ? { ok: true, size: n }
      : fail(`Team size must be a whole number from 1 to ${MAX_TEAM} (you entered ${shown}).`));
    if (typeof value === "number") {
      if (!Number.isFinite(value) || !Number.isInteger(value)) return fail(`Team size must be a whole number from 1 to ${MAX_TEAM} (you entered ${value}).`);
      return range(value, value);
    }
    if (typeof value !== "string") return fail(`Enter the number of players per team (1 to ${MAX_TEAM}).`);
    const raw = value.trim();
    const s = raw.toLowerCase().replace(/\s+/g, "");
    if (s === "") return fail(`Enter the number of players per team (1 to ${MAX_TEAM}).`);
    let m = s.match(/^(\d+)$/);
    if (m) return range(Number(m[1]), raw);
    m = s.match(/^(\d+)v(\d+)$/);
    if (m) {
      if (Number(m[1]) !== Number(m[2])) {
        return fail(`"${raw}" is not an equal-sided format. Enter one number of players per team (for example ${Math.min(MAX_TEAM, Number(m[1]) || 7)} for ${Math.min(MAX_TEAM, Number(m[1]) || 7)}v${Math.min(MAX_TEAM, Number(m[1]) || 7)}). Uneven teams only happen automatically when Everyone plays is on.`);
      }
      return range(Number(m[1]), raw);
    }
    return fail(`"${raw}" is not a valid team size. Enter a whole number from 1 to ${MAX_TEAM}.`);
  }

  /**
   * Build the flat player list from squad definitions.
   * squads: [{ name, players: [names] }]
   */
  function buildPlayers(squads) {
    const players = [];
    squads.forEach((squad, sIdx) => {
      const names = squad.players.slice();
      names.forEach((name, pIdx) => {
        players.push({
          id: `s${sIdx}p${pIdx}`,
          name: name || `Player ${pIdx + 1}`,
          squadIndex: sIdx,
          squadName: squad.name || `Squad ${String.fromCharCode(65 + sIdx)}`,
          colorClass: colorFor(squads, sIdx),
          gamesPlayed: 0,
          restCount: 0,
          sitOuts: 0,
          extraCount: 0,
          firstGameTime: null,
          lastGameTime: null,
        });
      });
    });
    return players;
  }

  /** Sort a list of players by "should play next" priority (fewest games first). */
  function baseByFairness(a, b) {
    if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
    if (a.restCount !== b.restCount) return b.restCount - a.restCount; // resting longer -> higher priority
    return a._tiebreak - b._tiebreak;
  }
  function randomOrder(a, b) { return a._tiebreak - b._tiebreak; }
  let byFairness = baseByFairness;

  function withTiebreak(players) {
    players.forEach((p) => {
      p._tiebreak = Math.random();
    });
    return players;
  }

  /**
   * Build fixed teams once per squad, for "keep team-mates together" mode.
   */
  function buildFixedTeams(squadsPlayers, teamSize) {
    const teamsBySquad = [];
    const sparesBySquad = [];
    squadsPlayers.forEach((players) => {
      const shuffled = withTiebreak(players.slice()).sort((a, b) => a._tiebreak - b._tiebreak);
      const teams = [];
      let i = 0;
      while (i + teamSize <= shuffled.length) {
        teams.push({ players: shuffled.slice(i, i + teamSize), roster: shuffled.slice(i, i + teamSize) });
        i += teamSize;
      }
      const spares = shuffled.slice(i);
      spares.forEach((sp, idx) => {
        if (teams.length > 0) teams[idx % teams.length].roster.push(sp);
      });
      teamsBySquad.push(teams);
      sparesBySquad.push(spares);
    });
    return { teamsBySquad, sparesBySquad };
  }

  function pickActiveFromRoster(team, size, spareHandling) {
    const pool = withTiebreak(team.roster.slice());
    pool.sort(byFairness);
    if (spareHandling === "rest") {
      const originals = withTiebreak(team.players.slice()).sort(byFairness);
      return originals.slice(0, size);
    }
    return pool.slice(0, size);
  }


  /* ---------------------------------------------------------------
   * "Everyone plays" planning.
   * Every present player is placed on a pitch in every round. Rules:
   *   - sides differ by at most ONE player,
   *   - no side has more than MAX_TEAM players,
   *   - never more games than pitches,
   *   - the selected match-up (squad v squad / within squad / mixed) is kept,
   *     unless the organiser has explicitly allowed mixing ("relax").
   * Plans are lists of { sa, sb, a, b } (squad index of each side, or -1 = mixed).
   * ------------------------------------------------------------- */
  const evenSplit = (n, m) => {
    const base = Math.floor(n / m), r = n % m;
    return Array.from({ length: m }, (_, i) => base + (i < r ? 1 : 0));
  };
  const plural = (n, one, many) => (n === 1 ? one : many);

  // One pool of n players split into g games (2g sides). Returns best g nearest the target size.
  function planPool(n, P, t) {
    let best = null;
    for (let g = 1; g <= P; g++) {
      if (n < 2 * g || n > 2 * MAX_TEAM * g) continue;
      const cost = Math.abs(n / (2 * g) - t);
      if (!best || cost < best.cost - 1e-9) best = { g, cost };
    }
    if (!best) return null;
    const sizes = evenSplit(n, 2 * best.g);
    const games = [];
    for (let i = 0; i < best.g; i++) games.push({ a: sizes[2 * i], b: sizes[2 * i + 1] });
    return { games, cost: best.cost };
  }

  function planSeparate(present, P, t) {
    // present: [{i, n}] squads with players; each plays itself on g_s pitches.
    let best = null;
    const walk = (idx, used, cost, picks) => {
      if (idx === present.length) { if (!best || cost < best.cost) best = { cost, picks: picks.slice() }; return; }
      const { n } = present[idx];
      for (let g = 1; used + g <= P - (present.length - idx - 1); g++) {
        if (n < 2 * g || n > 2 * MAX_TEAM * g) continue;
        picks.push(g);
        walk(idx + 1, used + g, cost + n * Math.abs(n / (2 * g) - t), picks);
        picks.pop();
      }
    };
    walk(0, 0, 0, []);
    if (!best) return null;
    const games = [];
    present.forEach((sq, k) => {
      const sizes = evenSplit(sq.n, 2 * best.picks[k]);
      for (let i = 0; i < best.picks[k]; i++) games.push({ sa: sq.i, sb: sq.i, a: sizes[2 * i], b: sizes[2 * i + 1] });
    });
    return games;
  }

  function planCross(present, P, t) {
    if (present.length === 2) {
      const [X, Y] = present;
      let best = null;
      for (let g = 1; g <= P; g++) {
        if (X.n < g || Y.n < g) continue;
        const A = evenSplit(X.n, g), B = evenSplit(Y.n, g);
        if (A[0] > MAX_TEAM || B[0] > MAX_TEAM) continue;
        if (A.some((v, i) => Math.abs(v - B[i]) > 1)) continue;
        const cost = (X.n * Math.abs(X.n / g - t) + Y.n * Math.abs(Y.n / g - t)) / (X.n + Y.n);
        if (!best || cost < best.cost - 1e-9) best = { g, cost, A, B };
      }
      if (!best) return null;
      return best.A.map((a, i) => ({ sa: X.i, sb: Y.i, a, b: best.B[i] }));
    }
    // 3-4 squads: randomised search over which squads meet on each pitch.
    const k = present.length, need = Math.ceil(k / 2);
    if (P < need) return null;
    const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let best = null;
    for (let trial = 0; trial < 800; trial++) {
      const order = shuffle(present.map((_, x) => x)), pairs = [];
      for (let x = 0; x + 1 < k; x += 2) pairs.push([order[x], order[x + 1]]);
      if (k % 2) { let o; do { o = Math.floor(Math.random() * k); } while (o === order[k - 1]); pairs.push([order[k - 1], o]); }
      const g = Math.min(P, Math.max(pairs.length, pairs.length + Math.floor(Math.random() * (P - pairs.length + 1))));
      while (pairs.length < g) {
        const x = Math.floor(Math.random() * k); let y; do { y = Math.floor(Math.random() * k); } while (y === x);
        pairs.push([x, y]);
      }
      const slots = present.map(() => []);                       // [squad] -> [{game, side}]
      pairs.forEach((pr, gi) => { slots[pr[0]].push({ gi, side: "a" }); slots[pr[1]].push({ gi, side: "b" }); });
      const sizeOf = pairs.map(() => ({}));
      let ok = true;
      present.forEach((sq, x) => {
        if (!ok) return;
        const m = slots[x].length;
        if (sq.n < m || Math.ceil(sq.n / m) > MAX_TEAM) { ok = false; return; }
        shuffle(evenSplit(sq.n, m)).forEach((sz, idx) => { sizeOf[slots[x][idx].gi][slots[x][idx].side] = sz; });
      });
      if (!ok || sizeOf.some((s) => Math.abs(s.a - s.b) > 1)) continue;
      const cost = present.reduce((tot, sq, x) => tot + sq.n * Math.abs(sq.n / slots[x].length - t), 0) / present.reduce((a, b) => a + b.n, 0);
      if (!best || cost < best.cost) best = { cost, games: pairs.map((pr, gi) => ({ sa: present[pr[0]].i, sb: present[pr[1]].i, a: sizeOf[gi].a, b: sizeOf[gi].b })) };
    }
    return best ? best.games : null;
  }

  function planEveryone(counts, names, matchup, relax, P, t) {
    const present = counts.map((n, i) => ({ i, n })).filter((x) => x.n > 0);
    const total = present.reduce((a, b) => a + b.n, 0);
    const pitchesTxt = `${P} ${plural(P, "pitch", "pitches")}`;
    if (total < 2) return { error: "Everyone plays needs at least 2 players present." };
    const mixAdvice = relax ? "" : " You can also choose 'Allow mixing squads if needed' under Everyone plays.";
    let games = null, why = "";
    if (matchup === "mixed") {
      const r = planPool(total, P, t);
      if (r) games = r.games.map((g) => ({ sa: -1, sb: -1, a: g.a, b: g.b }));
    } else if (matchup === "separate") {
      const ones = present.filter((x) => x.n === 1);
      if (ones.length) {
        why = ones.length === present.length
          ? "Each squad has only one player, so a within-squad match cannot be formed."
          : `${ones.map((x) => names[x.i]).join(" and ")} ${plural(ones.length, "has", "have")} only one player, so a within-squad match cannot be formed for ${plural(ones.length, "that squad", "those squads")}.`;
        why += ` Add more players or choose Squad v squad or Mixed.${mixAdvice}`;
      } else if (present.length > P) {
        why = `Within-squad matches need a pitch for every squad (${present.length} squads, ${pitchesTxt}). Add pitches or choose Squad v squad or Mixed.${mixAdvice}`;
      } else {
        games = planSeparate(present, P, t);
        if (!games) why = `Everyone plays cannot fit every squad's players into within-squad games on ${pitchesTxt} (a team holds at most ${MAX_TEAM}). Add pitches, mark some players absent, or choose Mixed.${mixAdvice}`;
      }
    } else {
      if (present.length < 2) {
        why = `Squad v squad needs players from at least two squads, but only ${names[present[0].i]} has players present. Mark more players as here, or choose Within squad or Mixed.`;
      } else {
        games = planCross(present, P, t);
        if (!games) why = `With squad v squad and everyone playing, the two sides on a pitch can differ by at most one player. ${present.map((x) => `${names[x.i]} has ${x.n}`).join(" and ")}, which cannot be shared across ${pitchesTxt} that way (teams are also limited to ${MAX_TEAM}). Add pitches, mark some players absent, or choose Mixed.${mixAdvice}`;
      }
    }
    if (games) return { plan: games, relaxed: false };
    if (relax) {
      const r = planPool(total, P, t);
      if (r) return { plan: r.games.map((g) => ({ sa: -1, sb: -1, a: g.a, b: g.b })), relaxed: true };
      return { error: `${total} players cannot all play at once: ${pitchesTxt} ${P === 1 ? "holds" : "hold"} at most ${2 * MAX_TEAM * P} (${MAX_TEAM} v ${MAX_TEAM} each). Add pitches, mark some players absent, or turn off Everyone plays.` };
    }
    if (!why) why = `${total} players cannot all play at once on ${pitchesTxt} (at most ${2 * MAX_TEAM * P}). Add pitches, mark some players absent, or turn off Everyone plays.`;
    return { error: why };
  }

  // Why a normal (equal-sided) session would contain no matches at all.
  function explainNoMatches(matchup, t, counts, names, P) {
    const present = counts.map((n, i) => ({ i, n })).filter((x) => x.n > 0);
    const total = present.reduce((a, b) => a + b.n, 0);
    const need = `${t}v${t}`;
    if (total < 2 * t) return `A ${need} match needs ${2 * t} players but only ${total} ${plural(total, "is", "are")} present. Add players, choose a smaller team size, or turn on Everyone plays.`;
    if (matchup === "separate") {
      if (present.every((x) => x.n === 1)) return "Each squad has only one player, so a within-squad match cannot be formed. Add more players or choose Squad v squad or Mixed.";
      return `A within-squad ${need} needs ${2 * t} players in one squad; the biggest squad has ${Math.max(...present.map((x) => x.n))}. Add players, choose a smaller team size, or choose Squad v squad or Mixed.`;
    }
    if (matchup === "cross") {
      return `Squad v squad ${need} needs two squads with at least ${t} players each, but ${present.length < 2 ? "only one squad has players present" : "that is not the case here (" + present.map((x) => names[x.i] + " " + x.n).join(", ") + ")"}. Add players, choose a smaller team size, or choose Mixed.`;
    }
    return `No ${need} match can be formed with ${total} players on ${P} ${plural(P, "pitch", "pitches")}.`;
  }

  function buildMatchRecord(pitchNum, teamAPlayers, teamBPlayers, squadA, squadB, settings) {
    const label = (idx) => settings.squads[idx].name || `Squad ${String.fromCharCode(65 + idx)}`;
    return {
      pitch: pitchNum,
      format: `${teamAPlayers.length}v${teamBPlayers.length}`,
      teamA: {
        squadName: squadA === -1 ? "Mixed" : label(squadA),
        colorClass: squadA === -1 ? "squad-mixed" : colorFor(settings.squads, squadA),
        players: teamAPlayers.map((pl) => pl.name),
        playerIds: teamAPlayers.map((pl) => pl.id),
      },
      teamB: {
        squadName: squadB === -1 ? "Mixed" : label(squadB),
        colorClass: squadB === -1 ? "squad-mixed" : colorFor(settings.squads, squadB),
        players: teamBPlayers.map((pl) => pl.name),
        playerIds: teamBPlayers.map((pl) => pl.id),
      },
    };
  }

  /**
   * Main scheduling entry point.
   * settings: {
   *   squads: [{ name, players: [names], colorIndex? }]
   *   gameTime, restTime, bufferTime, totalSession: minutes
   *   startTime: "HH:MM", numPitches: 1..8
   *   teamSize: 1..11 (players per team; teams are always equal-sided unless noRest)
   *   pitchFormatMode: 'auto' | 'balanced' | 'manual'   (all equal-sided when noRest is off)
   *   manualFormats: [size,...]   one team size (1..11) per pitch, manual mode only
   *   matchup: 'cross' | 'separate' | 'mixed'
   *   teamFormation: 'rotate' | 'together',  spareHandling: 'subs' | 'rest'
   *   noRest: boolean            everyone plays: sides may differ by one player
   *   noRestMode: 'strict' | 'relax'   relax = organiser allows mixing squads to fit everyone
   *   fairPriority: false to pick randomly instead of fewest-games-first
   * }
   * Returns { ok, errors, warnings, rounds, players, squads, summary, ... }.
   * ok === false means the session must NOT be treated as generated.
   */
  function generateFixtures(settings) {
    const warnings = [];
    const errors = [];
    byFairness = settings.fairPriority === false ? randomOrder : baseByFairness;

    const squadsIn = Array.isArray(settings.squads) ? settings.squads : [];
    const noRest = !!settings.noRest;
    const relax = settings.noRestMode === "relax";
    const matchup = settings.matchup === undefined ? "cross" : settings.matchup;
    if (["cross", "separate", "mixed"].indexOf(matchup) === -1) errors.push(`Unknown match-up format "${settings.matchup}".`);

    let teamSizeDefault = 3;
    if (settings.teamSize !== undefined && settings.teamSize !== null) {
      const p = parseTeamSize(settings.teamSize);
      if (p.ok) teamSizeDefault = p.size; else errors.push(p.error);
    }
    let numPitches = settings.numPitches === undefined ? 1 : settings.numPitches;
    if (!Number.isInteger(numPitches) || numPitches < 1 || numPitches > MAX_PITCHES) {
      errors.push(`Number of pitches must be a whole number from 1 to ${MAX_PITCHES}.`);
      numPitches = 1;
    }
    const mode = ["auto", "manual", "balanced"].indexOf(settings.pitchFormatMode) === -1 ? "auto" : settings.pitchFormatMode;

    const pitchTeamSize = [];
    for (let p = 0; p < numPitches; p++) {
      if (mode === "manual") {
        const raw = settings.manualFormats ? settings.manualFormats[p] : undefined;
        const parsed = parseTeamSize(raw === undefined || raw === null ? "" : raw);
        if (parsed.ok) pitchTeamSize.push(parsed.size);
        else { errors.push(`Pitch ${p + 1}: ${parsed.error}`); pitchTeamSize.push(teamSizeDefault); }
      } else {
        pitchTeamSize.push(teamSizeDefault);
      }
    }
    if (settings.teamFormation === "together" && !noRest && pitchTeamSize.some((s) => s !== pitchTeamSize[0])) {
      errors.push("Keeping team-mates together needs the same team size on every pitch. Use the same size on each pitch or choose 'Rotate each round'.");
    }

    const names = squadsIn.map((s, i) => s.name || `Squad ${String.fromCharCode(65 + i)}`);
    const sset = Object.assign({}, settings, { squads: squadsIn });
    const players = buildPlayers(squadsIn);
    const playersById = new Map(players.map((p) => [p.id, p]));
    const squadsPlayers = squadsIn.map((squad, sIdx) => players.filter((p) => p.squadIndex === sIdx));
    const counts = squadsPlayers.map((sp) => sp.length);

    const gameTime = Math.max(1, settings.gameTime || 10);
    const restTime = Math.max(0, settings.restTime || 0);
    const bufferTime = Math.max(0, settings.bufferTime || 0);
    const totalSession = Math.max(1, settings.totalSession || gameTime);
    const startMinutes = parseTimeToMinutes(settings.startTime);
    const slot = gameTime + restTime + bufferTime;
    let numRounds = Math.floor((totalSession + restTime + bufferTime) / slot);
    if (numRounds < 1) numRounds = totalSession >= gameTime ? 1 : 0;
    if (numRounds < 1) errors.push("The total session time is shorter than a single game, so no fixtures can be generated.");

    // ---- Everyone plays: plan the shape of every round up front ----
    let plan = null, relaxedMix = false;
    if (noRest && !errors.length) {
      const tEff = Math.max(1, Math.round(pitchTeamSize.reduce((a, b) => a + b, 0) / pitchTeamSize.length));
      const r = planEveryone(counts, names, matchup, relax, numPitches, tEff);
      if (r.error) errors.push(r.error);
      else {
        plan = r.plan; relaxedMix = r.relaxed;
        if (relaxedMix) warnings.push("Squads are mixed in some teams so that everyone can play, as you allowed.");
      }
    }

    const rounds = [];
    const mates = new Map();
    const mkey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
    const mateCount = (a, b) => mates.get(mkey(a.id, b.id)) || 0;
    function recordTeam(team) {
      for (let i = 0; i < team.length; i++) for (let j = i + 1; j < team.length; j++) {
        const k = mkey(team[i].id, team[j].id); mates.set(k, (mates.get(k) || 0) + 1);
      }
    }

    if (!errors.length) {
      if (!noRest) {
        squadsPlayers.forEach((sp, i) => {
          const minSize = Math.min(...pitchTeamSize);
          if (matchup !== "mixed" && sp.length > 0 && sp.length < minSize) warnings.push(`${names[i]} has fewer players (${sp.length}) than the smallest team size (${minSize}). It may sit out often.`);
        });
      }

      let fixedTeams = null;
      if (settings.teamFormation === "together" && !noRest) fixedTeams = buildFixedTeams(squadsPlayers, teamSizeDefault);
      let squadCursor = 0;
      const fixedTeamCursor = squadsIn.map(() => 0);
      const numSquads = squadsIn.length;

      const unusedPlayers = (squadIdx, usedIds) => squadsPlayers[squadIdx].filter((p) => !usedIds.has(p.id));

      // Fairness decides WHO is eligible (fewest games, longest rest). Among players tied at the
      // cut-off, prefer those who have been team-mates with the chosen group least.
      function pickRotatePlayers(squadIdx, size, usedIds) {
        const pool = withTiebreak(unusedPlayers(squadIdx, usedIds)).sort(byFairness);
        if (pool.length < size) return null;
        if (settings.fairPriority === false || pool.length === size) return pool.slice(0, size);
        const edge = pool[size - 1];
        const same = (p) => p.gamesPlayed === edge.gamesPlayed && p.restCount === edge.restCount;
        const chosen = pool.filter((p, i) => i < size && !same(p));
        const flex = pool.filter(same);
        while (chosen.length < size && flex.length) {
          let best = 0, bestScore = Infinity;
          flex.forEach((c, i) => {
            const score = chosen.reduce((t, m) => t + mateCount(c, m), 0);
            if (score < bestScore) { bestScore = score; best = i; }
          });
          chosen.push(flex.splice(best, 1)[0]);
        }
        return chosen;
      }
      function pickTogetherTeam(squadIdx, size, usedIds) {
        const teams = (fixedTeams && fixedTeams.teamsBySquad[squadIdx]) || [];
        if (!teams.length) return null;
        for (let attempts = 0; attempts < teams.length; attempts++) {
          const idx = (fixedTeamCursor[squadIdx] + attempts) % teams.length;
          const team = teams[idx];
          if (team.players.length !== size) continue;
          const active = pickActiveFromRoster(team, size, settings.spareHandling);
          if (active.some((p) => usedIds.has(p.id))) continue;
          fixedTeamCursor[squadIdx] = (idx + 1) % teams.length;
          return active;
        }
        return null;
      }
      const pickTeam = (squadIdx, size, usedIds) => (settings.teamFormation === "together" ? pickTogetherTeam(squadIdx, size, usedIds) : pickRotatePlayers(squadIdx, size, usedIds));
      const squadHasEnough = (squadIdx, size, usedIds) => {
        if (settings.teamFormation === "together") return ((fixedTeams && fixedTeams.teamsBySquad[squadIdx]) || []).some((t) => t.players.length === size);
        return unusedPlayers(squadIdx, usedIds).length >= size;
      };

      // One round of "Everyone plays": fill the planned slots with every present player.
      function everyoneRound(r) {
        const games = plan.map((g) => Object.assign({}, g));
        if (r % 2 === 1) games.forEach((g) => { const x = g.sa; g.sa = g.sb; g.sb = x; const y = g.a; g.a = g.b; g.b = y; });
        const slots = [];
        games.forEach((g, gi) => {
          slots.push({ gi, side: "a", size: g.a, squad: g.sa, larger: g.a > g.b ? 1 : 0 });
          slots.push({ gi, side: "b", size: g.b, squad: g.sb, larger: g.b > g.a ? 1 : 0 });
        });
        const filled = games.map(() => ({ a: [], b: [] }));
        const keys = Array.from(new Set(slots.map((s) => s.squad)));
        keys.forEach((key) => {
          const pool = withTiebreak(key === -1 ? players.slice() : squadsPlayers[key].slice());
          if (key === -1 && relaxedMix) pool.sort((x, y) => x.squadIndex - y.squadIndex || x._tiebreak - y._tiebreak);
          else pool.sort((x, y) => (x.extraCount - y.extraCount) || (x._tiebreak - y._tiebreak));
          const mine = slots.filter((s) => s.squad === key);
          mine.forEach((s) => { s._t = Math.random(); });
          mine.sort((x, y) => (y.larger - x.larger) || (x._t - y._t));
          let at = 0;
          mine.forEach((s) => { filled[s.gi][s.side] = pool.slice(at, at + s.size); at += s.size; });
        });
        // Larger sides carry the extra player: remember who, so the extra rotates.
        games.forEach((g, gi) => {
          if (g.a > g.b) filled[gi].a.forEach((p) => p.extraCount++);
          if (g.b > g.a) filled[gi].b.forEach((p) => p.extraCount++);
        });
        const order = games.map((g, gi) => gi).sort((x, y) => (games[y].a + games[y].b) - (games[x].a + games[x].b));
        const pitchOrder = Array.from({ length: numPitches }, (_, p) => p).sort((x, y) => pitchTeamSize[y] - pitchTeamSize[x] || x - y);
        const out = Array.from({ length: numPitches }, (_, p) => ({ pitch: p + 1, format: "", empty: true }));
        order.forEach((gi, k) => {
          const g = games[gi], p = pitchOrder[k];
          out[p] = buildMatchRecord(p + 1, filled[gi].a, filled[gi].b, g.sa, g.sb, sset);
        });
        return out;
      }

      for (let r = 0; r < numRounds; r++) {
        const roundStart = startMinutes + r * slot;
        const roundEnd = roundStart + gameTime;
        const usedIds = new Set();
        let matches = [];

        if (noRest) {
          matches = everyoneRound(r);
        } else {
          // Equal-sided teams only. A pitch with too few players stays unused.
          for (let p = 0; p < numPitches; p++) {
            const size = pitchTeamSize[p];
            let teamA = null, teamB = null, squadA = -1, squadB = -1;
            const squadOrder = [];
            for (let i = 0; i < numSquads; i++) squadOrder.push((squadCursor + i) % numSquads);

            if (matchup === "mixed") {
              const allUnused = withTiebreak(players.filter((pl) => !usedIds.has(pl.id))).sort(byFairness);
              if (allUnused.length >= size * 2) { teamA = allUnused.slice(0, size); teamB = allUnused.slice(size, size * 2); }
            } else if (matchup === "cross") {
              const avail = squadOrder.filter((sIdx) => squadHasEnough(sIdx, size, usedIds));
              if (avail.length >= 2) {
                const first = pickTeam(avail[0], size, usedIds);
                if (first) {
                  const tmp = new Set(usedIds); first.forEach((pl) => tmp.add(pl.id));
                  for (let k = 1; k < avail.length; k++) {
                    if (!squadHasEnough(avail[k], size, tmp)) continue;
                    const second = pickTeam(avail[k], size, tmp);
                    if (second) { teamA = first; teamB = second; squadA = avail[0]; squadB = avail[k]; break; }
                  }
                }
              }
            } else {
              for (const sIdx of squadOrder) {
                if (!squadHasEnough(sIdx, size, usedIds)) continue;
                const first = pickTeam(sIdx, size, usedIds);
                if (!first) continue;
                const tmp = new Set(usedIds); first.forEach((pl) => tmp.add(pl.id));
                if (squadHasEnough(sIdx, size, tmp)) {
                  const second = pickTeam(sIdx, size, tmp);
                  if (second) { teamA = first; teamB = second; squadA = sIdx; squadB = sIdx; break; }
                }
              }
            }
            if (teamA && teamB) {
              teamA.forEach((pl) => usedIds.add(pl.id)); teamB.forEach((pl) => usedIds.add(pl.id));
              matches.push(buildMatchRecord(p + 1, teamA, teamB, squadA, squadB, sset));
            } else {
              matches.push({ pitch: p + 1, format: `${size}v${size}`, empty: true });
            }
          }
          squadCursor = (squadCursor + 1) % Math.max(1, numSquads);
        }

        matches.forEach((m) => {
          if (m.empty) return;
          m.teamA.playerIds.concat(m.teamB.playerIds).forEach((id) => usedIds.add(id));
          [m.teamA, m.teamB].forEach((t) => recordTeam(t.playerIds.map((id) => playersById.get(id)).filter(Boolean)));
        });
        usedIds.forEach((id) => {
          const pl = playersById.get(id);
          if (!pl) return;
          pl.gamesPlayed += 1; pl.restCount = 0;
          if (pl.firstGameTime === null) pl.firstGameTime = roundStart;
          pl.lastGameTime = roundStart;
        });
        const resting = players.filter((pl) => !usedIds.has(pl.id));
        resting.forEach((pl) => { pl.restCount += 1; pl.sitOuts += 1; });
        rounds.push({
          index: r + 1, startTime: fmtTime(roundStart), endTime: fmtTime(roundEnd), matches,
          resting: resting.map((pl) => ({ id: pl.id, name: pl.name, squadName: pl.squadName, colorClass: pl.colorClass })),
        });
      }
    }

    // ---- Validate what was generated: a schedule that fails here is never "successful" ----
    const totalMatches = rounds.reduce((sum, r) => sum + r.matches.filter((m) => !m.empty).length, 0);
    if (!errors.length) {
      if (totalMatches === 0) {
        errors.push(noRest ? "No valid matches could be formed with these settings." : explainNoMatches(matchup, Math.min(...pitchTeamSize), counts, names, numPitches));
      }
      const problems = [];
      rounds.forEach((rd) => {
        const seen = new Set();
        rd.matches.forEach((m) => {
          if (m.empty) return;
          const a = m.teamA.playerIds, b = m.teamB.playerIds;
          a.concat(b).forEach((id) => {
            if (!playersById.has(id)) problems.push(`Round ${rd.index} pitch ${m.pitch} references an unknown player.`);
            if (seen.has(id)) problems.push(`Round ${rd.index}: a player is on two pitches.`);
            seen.add(id);
          });
          if (m.format !== `${a.length}v${b.length}`) problems.push(`Round ${rd.index} pitch ${m.pitch}: label ${m.format} does not match ${a.length}v${b.length}.`);
          if (a.length > MAX_TEAM || b.length > MAX_TEAM) problems.push(`Round ${rd.index} pitch ${m.pitch}: a team has more than ${MAX_TEAM} players.`);
          if (noRest) { if (Math.abs(a.length - b.length) > 1 || !a.length || !b.length) problems.push(`Round ${rd.index} pitch ${m.pitch}: sides differ by more than one player.`); }
          else if (a.length !== b.length || a.length !== pitchTeamSize[m.pitch - 1]) problems.push(`Round ${rd.index} pitch ${m.pitch}: teams are not the selected equal size.`);
          const sq = (ids) => Array.from(new Set(ids.map((id) => playersById.get(id) && playersById.get(id).squadIndex)));
          if (!relaxedMix && matchup === "cross" && (sq(a).length !== 1 || sq(b).length !== 1 || sq(a)[0] === sq(b)[0])) problems.push(`Round ${rd.index} pitch ${m.pitch}: breaks squad v squad.`);
          if (!relaxedMix && matchup === "separate" && (sq(a.concat(b)).length !== 1)) problems.push(`Round ${rd.index} pitch ${m.pitch}: breaks within-squad.`);
        });
        if (noRest && rd.resting.length) problems.push(`Round ${rd.index}: ${rd.resting.length} players were left out although Everyone plays is on.`);
      });
      if (problems.length) errors.push("The generated schedule failed its own checks and was discarded: " + problems.slice(0, 3).join(" "));
    }

    const sessionEnd = numRounds > 0 ? startMinutes + (numRounds - 1) * slot + gameTime : startMinutes;
    const plannedEnd = startMinutes + totalSession;
    squadsPlayers.forEach((sp, i) => {
      if (!errors.length && sp.length > 0 && sp.every((p) => p.gamesPlayed === 0)) warnings.push(`${names[i]} never got a fixture. Check its player count against the team size and pitch formats.`);
    });

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      settings: { numPitches, pitchTeamSize, gameTime, restTime, bufferTime, totalSession, startTime: fmtTime(startMinutes), noRest, matchup },
      rounds,
      pitchUsage: Array.from({ length: numPitches }, (_, p) => ({
        pitch: p + 1,
        emptyRounds: rounds.filter((rd) => rd.matches[p] && rd.matches[p].empty).length,
      })),
      players: players.map((p) => ({
        id: p.id, name: p.name, squadName: p.squadName, colorClass: p.colorClass,
        gamesPlayed: p.gamesPlayed, restCount: p.restCount, sitOuts: p.sitOuts, extraTeamGames: p.extraCount,
        firstGameTime: p.firstGameTime === null ? null : fmtTime(p.firstGameTime),
        lastGameTime: p.lastGameTime === null ? null : fmtTime(p.lastGameTime),
      })),
      squads: squadsIn.map((squad, i) => {
        const sp = players.filter((p) => p.squadIndex === i);
        const total = sp.reduce((sum, p) => sum + p.gamesPlayed, 0);
        return {
          name: names[i], colorClass: colorFor(squadsIn, i), playerCount: sp.length, totalGames: total,
          avgGames: sp.length ? total / sp.length : 0,
          minGames: sp.length ? Math.min(...sp.map((p) => p.gamesPlayed)) : 0,
          maxGames: sp.length ? Math.max(...sp.map((p) => p.gamesPlayed)) : 0,
        };
      }),
      summary: {
        totalRounds: numRounds, totalMatches, totalPlayers: players.length, pitchesUsed: numPitches,
        sessionStart: fmtTime(startMinutes), sessionEnd: fmtTime(sessionEnd), plannedEnd: fmtTime(plannedEnd),
      },
    };
  }

  function toCSV(result) {
    const rows = [["Round", "Start", "End", "Pitch", "Format", "Team A (Squad)", "Team A Players", "Team B (Squad)", "Team B Players"]];
    result.rounds.forEach((round) => {
      round.matches.forEach((m) => {
        if (m.empty) {
          rows.push([round.index, round.startTime, round.endTime, m.pitch, m.format || "-", "No fixture", "", "", ""]);
        } else {
          rows.push([
            round.index,
            round.startTime,
            round.endTime,
            m.pitch,
            m.format,
            m.teamA.squadName,
            m.teamA.players.join(" / "),
            m.teamB.squadName,
            m.teamB.players.join(" / "),
          ]);
        }
      });
      if (round.resting.length) {
        rows.push([round.index, round.startTime, round.endTime, "-", "Resting", "", round.resting.map((r) => r.name).join(" / "), "", ""]);
      }
    });
    return rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
  }

  return { generateFixtures, toCSV, fmtTime, parseTimeToMinutes, parseTeamSize, MAX_TEAM };
});
