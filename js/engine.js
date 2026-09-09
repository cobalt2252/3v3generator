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

  /** Parse a manual format string like "4v4" or "4" into a team size */
  function parseFormat(str, fallback) {
    if (!str) return fallback;
    const match = String(str).match(/\d+/);
    if (!match) return fallback;
    const n = parseInt(match[0], 10);
    return n > 0 ? n : fallback;
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
          colorClass: SQUAD_COLORS[sIdx % SQUAD_COLORS.length],
          gamesPlayed: 0,
          restCount: 0,
          firstGameTime: null,
          lastGameTime: null,
        });
      });
    });
    return players;
  }

  /** Sort a list of players by "should play next" priority (fewest games first). */
  function byFairness(a, b) {
    if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
    if (a.restCount !== b.restCount) return b.restCount - a.restCount; // resting longer -> higher priority
    return a._tiebreak - b._tiebreak;
  }

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
   * Balanced-mode helpers — used when pitchFormatMode === 'balanced'.
   * Goal: nobody sits out just because the squad size doesn't divide
   * evenly by the target team size. Team sizes flex (e.g. 3v2) instead.
   * ------------------------------------------------------------- */

  /** How many simultaneous matches to run for `total` players, aiming
   *  for `target` players per team but never exceeding `maxPitches`. */
  function idealMatchCount(total, target, maxPitches) {
    if (total < 2 || maxPitches < 1) return 0;
    const raw = Math.round(total / (2 * Math.max(1, target)));
    const ideal = Math.max(1, raw);
    return Math.min(maxPitches, ideal, Math.floor(total / 2));
  }

  /** Split `total` players as evenly as possible into `numMatches` matches.
   *  Returns an array of [sizeA, sizeB] pairs. Larger teams are paired with
   *  the next-largest so no single match is far more lopsided than another. */
  function splitIntoTeams(total, numMatches) {
    if (numMatches < 1 || total < 2) return [];
    const numTeams = numMatches * 2;
    const base = Math.floor(total / numTeams);
    const remainder = total % numTeams;
    const sizes = [];
    for (let i = 0; i < numTeams; i++) sizes.push(base + (i < remainder ? 1 : 0));
    sizes.sort((a, b) => b - a);
    const pairs = [];
    for (let i = 0; i < numTeams; i += 2) pairs.push([sizes[i], sizes[i + 1] || 0]);
    return pairs.filter((pair) => pair[0] > 0 && pair[1] > 0);
  }

  /** Share `numMatches` matches out across squads proportional to their
   *  weighted size, never giving a squad more matches than it can field
   *  on its own (floor(count/2)). Uses the D'Hondt method. */
  function apportionMatches(weightedCounts, rawCounts, numMatches) {
    const n = rawCounts.length;
    const caps = rawCounts.map((c) => Math.floor(c / 2));
    const alloc = rawCounts.map(() => 0);
    const totalCap = caps.reduce((a, b) => a + b, 0);
    const target = Math.min(numMatches, totalCap);
    for (let m = 0; m < target; m++) {
      let best = -1,
        bestRatio = -1;
      for (let i = 0; i < n; i++) {
        if (alloc[i] >= caps[i]) continue;
        const ratio = weightedCounts[i] / (alloc[i] + 1);
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = i;
        }
      }
      if (best === -1) break;
      alloc[best]++;
    }
    return alloc;
  }

  function buildMatchRecord(pitchNum, teamAPlayers, teamBPlayers, squadA, squadB, settings) {
    const label = (idx) => settings.squads[idx].name || `Squad ${String.fromCharCode(65 + idx)}`;
    return {
      pitch: pitchNum,
      format: `${teamAPlayers.length}v${teamBPlayers.length}`,
      teamA: {
        squadName: squadA === -1 ? "Mixed" : label(squadA),
        colorClass: squadA === -1 ? "squad-mixed" : SQUAD_COLORS[squadA % SQUAD_COLORS.length],
        players: teamAPlayers.map((pl) => pl.name),
        playerIds: teamAPlayers.map((pl) => pl.id),
      },
      teamB: {
        squadName: squadB === -1 ? "Mixed" : label(squadB),
        colorClass: squadB === -1 ? "squad-mixed" : SQUAD_COLORS[squadB % SQUAD_COLORS.length],
        players: teamBPlayers.map((pl) => pl.name),
        playerIds: teamBPlayers.map((pl) => pl.id),
      },
    };
  }

  /**
   * Main scheduling entry point.
   * settings: {
   *   squads: [{ name, players: [names] }]  (2-4 entries)
   *   gameTime, restTime, totalSession: minutes (numbers)
   *   startTime: "HH:MM"
   *   numPitches: number
   *   spareHandling: 'subs' | 'rest'
   *   teamFormation: 'rotate' | 'together'
   *   matchup: 'separate' | 'same' | 'mixed'
   *   pitchFormatMode: 'auto' | 'manual' | 'balanced'
   *   teamSize: number (target players per team)
   *   manualFormats: [string,...] length numPitches (only used when pitchFormatMode === 'manual')
   * }
   */
  function generateFixtures(settings) {
    const warnings = [];
    const teamSizeDefault = Math.max(1, settings.teamSize || 3);
    const numPitches = Math.max(1, settings.numPitches || 1);
    const balanced = settings.pitchFormatMode === "balanced";

    const pitchTeamSize = [];
    for (let p = 0; p < numPitches; p++) {
      if (settings.pitchFormatMode === "manual" && settings.manualFormats && settings.manualFormats[p]) {
        pitchTeamSize.push(parseFormat(settings.manualFormats[p], teamSizeDefault));
      } else {
        pitchTeamSize.push(teamSizeDefault);
      }
    }

    const players = buildPlayers(settings.squads);
    const playersById = new Map(players.map((p) => [p.id, p]));
    const squadsPlayers = settings.squads.map((squad, sIdx) => players.filter((p) => p.squadIndex === sIdx));
    const numSquads = settings.squads.length;

    if (!balanced) {
      squadsPlayers.forEach((sp, i) => {
        const minSize = Math.min(...pitchTeamSize);
        if (sp.length < minSize) {
          warnings.push(
            `${settings.squads[i].name || "Squad " + String.fromCharCode(65 + i)} has fewer players (${sp.length}) than the smallest team size (${minSize}). It may sit out often.`
          );
        }
      });
    }

    const gameTime = Math.max(1, settings.gameTime || 10);
    const restTime = Math.max(0, settings.restTime || 0);
    const bufferTime = Math.max(0, settings.bufferTime || 0);
    const totalSession = Math.max(1, settings.totalSession || gameTime);
    const startMinutes = parseTimeToMinutes(settings.startTime);
    const slot = gameTime + restTime + bufferTime;

    let numRounds = Math.floor((totalSession + restTime + bufferTime) / slot);
    if (numRounds < 1) numRounds = totalSession >= gameTime ? 1 : 0;
    if (numRounds < 1) {
      warnings.push("Total session time is shorter than a single game. No fixtures generated.");
    }

    const rounds = [];

    let fixedTeams = null;
    if (settings.teamFormation === "together" && !balanced) {
      fixedTeams = buildFixedTeams(squadsPlayers, teamSizeDefault);
    }

    let squadCursor = 0;
    const fixedTeamCursor = settings.squads.map(() => 0);
    const squadCarry = settings.squads.map(() => 0); // balanced-mode fairness: squads shut out get priority next round

    function unusedPlayers(squadIdx, usedIds) {
      return squadsPlayers[squadIdx].filter((p) => !usedIds.has(p.id));
    }

    function pickRotatePlayers(squadIdx, size, usedIds) {
      const pool = withTiebreak(unusedPlayers(squadIdx, usedIds)).sort(byFairness);
      if (pool.length < size) return null;
      return pool.slice(0, size);
    }

    function pickTogetherTeam(squadIdx, size, usedIds) {
      const teams = (fixedTeams && fixedTeams.teamsBySquad[squadIdx]) || [];
      if (teams.length === 0) return null;
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

    function pickTeam(squadIdx, size, usedIds) {
      if (settings.teamFormation === "together") {
        return pickTogetherTeam(squadIdx, size, usedIds);
      }
      return pickRotatePlayers(squadIdx, size, usedIds);
    }

    function squadHasEnough(squadIdx, size, usedIds) {
      if (settings.teamFormation === "together") {
        const teams = (fixedTeams && fixedTeams.teamsBySquad[squadIdx]) || [];
        return teams.some((t) => t.players.length === size);
      }
      return unusedPlayers(squadIdx, usedIds).length >= size;
    }

    for (let r = 0; r < numRounds; r++) {
      const roundStart = startMinutes + r * slot;
      const roundEnd = roundStart + gameTime;
      const usedIds = new Set();
      const matches = [];

      if (balanced) {
        if (settings.matchup === "mixed") {
          const pool = withTiebreak(players.slice()).sort(byFairness);
          const numMatches = idealMatchCount(pool.length, teamSizeDefault, numPitches);
          const pairs = splitIntoTeams(pool.length, numMatches);
          let idx = 0;
          pairs.forEach((pair, mIdx) => {
            const teamA = pool.slice(idx, idx + pair[0]);
            idx += pair[0];
            const teamB = pool.slice(idx, idx + pair[1]);
            idx += pair[1];
            matches.push(buildMatchRecord(mIdx + 1, teamA, teamB, -1, -1, settings));
          });
          for (let p = matches.length; p < numPitches; p++) matches.push({ pitch: p + 1, format: "", empty: true });
        } else {
          // separate / same: share matches across squads proportional to size
          const rawCounts = squadsPlayers.map((sp) => sp.length);
          const totalPlayers = rawCounts.reduce((a, b) => a + b, 0);
          const numMatches = idealMatchCount(totalPlayers, teamSizeDefault, numPitches);
          const weighted = rawCounts.map((c, i) => c * (1 + squadCarry[i]));
          const alloc = apportionMatches(weighted, rawCounts, numMatches);

          let pitchCursor = 0;
          const leftoverPlayers = [];
          const squadGotGame = rawCounts.map(() => false);

          for (let i = 0; i < numSquads; i++) {
            const sorted = withTiebreak(squadsPlayers[i].slice()).sort(byFairness);
            const pairs = splitIntoTeams(sorted.length, alloc[i]);
            let idx = 0;
            pairs.forEach((pair) => {
              const teamA = sorted.slice(idx, idx + pair[0]);
              idx += pair[0];
              const teamB = sorted.slice(idx, idx + pair[1]);
              idx += pair[1];
              pitchCursor++;
              matches.push(buildMatchRecord(pitchCursor, teamA, teamB, i, i, settings));
              squadGotGame[i] = true;
            });
            leftoverPlayers.push(...sorted.slice(idx));
          }

          const sparePitches = numPitches - pitchCursor;
          if (settings.matchup === "same" && sparePitches > 0 && leftoverPlayers.length >= 2) {
            const pool = withTiebreak(leftoverPlayers).sort(byFairness);
            const extraMatches = Math.min(sparePitches, Math.floor(pool.length / 2));
            const pairs = splitIntoTeams(pool.length, extraMatches);
            let idx = 0;
            pairs.forEach((pair) => {
              const teamA = pool.slice(idx, idx + pair[0]);
              idx += pair[0];
              const teamB = pool.slice(idx, idx + pair[1]);
              idx += pair[1];
              pitchCursor++;
              matches.push(buildMatchRecord(pitchCursor, teamA, teamB, -1, -1, settings));
            });
          }

          for (let p = pitchCursor; p < numPitches; p++) matches.push({ pitch: p + 1, format: "", empty: true });

          for (let i = 0; i < numSquads; i++) {
            squadCarry[i] = squadGotGame[i] ? 0 : squadCarry[i] + 1;
          }
        }

        matches.forEach((m) => {
          if (m.empty) return;
          m.teamA.playerIds.forEach((id) => usedIds.add(id));
          m.teamB.playerIds.forEach((id) => usedIds.add(id));
        });
      } else {
        // Fixed team-size scheduling (auto or manual pitch formats)
        for (let p = 0; p < numPitches; p++) {
          const size = pitchTeamSize[p];
          let teamA = null,
            teamB = null,
            squadA = -1,
            squadB = -1;

          const squadOrder = [];
          for (let i = 0; i < numSquads; i++) squadOrder.push((squadCursor + i) % numSquads);

          if (settings.matchup === "mixed") {
            const allUnused = withTiebreak(players.filter((pl) => !usedIds.has(pl.id))).sort(byFairness);
            if (allUnused.length >= size * 2) {
              teamA = allUnused.slice(0, size);
              teamB = allUnused.slice(size, size * 2);
            }
          } else {
            for (const sIdx of squadOrder) {
              if (squadHasEnough(sIdx, size, usedIds)) {
                const first = pickTeam(sIdx, size, usedIds);
                if (!first) continue;
                const tmpUsed = new Set(usedIds);
                first.forEach((pl) => tmpUsed.add(pl.id));
                if (squadHasEnough(sIdx, size, tmpUsed)) {
                  const second = pickTeam(sIdx, size, tmpUsed);
                  if (second) {
                    teamA = first;
                    teamB = second;
                    squadA = sIdx;
                    squadB = sIdx;
                    break;
                  }
                }
              }
            }

            if (!teamA && settings.matchup === "same") {
              const candidates = squadOrder.filter((sIdx) => squadHasEnough(sIdx, size, usedIds));
              if (candidates.length >= 2) {
                const first = pickTeam(candidates[0], size, usedIds);
                const tmpUsed = new Set(usedIds);
                if (first) first.forEach((pl) => tmpUsed.add(pl.id));
                const secondSquad = candidates.find((s, i) => i > 0 && squadHasEnough(s, size, tmpUsed));
                if (first && secondSquad !== undefined) {
                  const second = pickTeam(secondSquad, size, tmpUsed);
                  if (second) {
                    teamA = first;
                    teamB = second;
                    squadA = candidates[0];
                    squadB = secondSquad;
                  }
                }
              }
            }
          }

          if (teamA && teamB) {
            teamA.forEach((pl) => usedIds.add(pl.id));
            teamB.forEach((pl) => usedIds.add(pl.id));
            matches.push(buildMatchRecord(p + 1, teamA, teamB, squadA, squadB, settings));
          } else {
            matches.push({ pitch: p + 1, format: `${size}v${size}`, empty: true });
          }
        }
        squadCursor = (squadCursor + 1) % numSquads;
      }

      usedIds.forEach((id) => {
        const pl = playersById.get(id);
        if (!pl) return;
        pl.gamesPlayed += 1;
        pl.restCount = 0;
        if (pl.firstGameTime === null) pl.firstGameTime = roundStart;
        pl.lastGameTime = roundStart;
      });

      const resting = players.filter((pl) => !usedIds.has(pl.id));
      resting.forEach((pl) => {
        pl.restCount += 1;
      });

      rounds.push({
        index: r + 1,
        startTime: fmtTime(roundStart),
        endTime: fmtTime(roundEnd),
        matches,
        resting: resting.map((pl) => ({ id: pl.id, name: pl.name, squadName: pl.squadName, colorClass: pl.colorClass })),
      });
    }

    const sessionEnd = numRounds > 0 ? startMinutes + (numRounds - 1) * slot + gameTime : startMinutes;
    const plannedEnd = startMinutes + totalSession;

    squadsPlayers.forEach((sp, i) => {
      if (sp.length > 0 && sp.every((p) => p.gamesPlayed === 0)) {
        const label = settings.squads[i].name || `Squad ${String.fromCharCode(65 + i)}`;
        if (settings.matchup === "separate") {
          warnings.push(`${label} never got a fixture — with "keep squads separate" a squad needs enough players for two full teams. Try "same where possible", "mix squads throughout", or "balanced" instead.`);
        } else {
          warnings.push(`${label} never got a fixture. Check its player count against the team size and pitch formats.`);
        }
      }
    });

    return {
      warnings,
      settings: {
        numPitches,
        pitchTeamSize,
        gameTime,
        restTime,
        bufferTime,
        totalSession,
        startTime: fmtTime(startMinutes),
      },
      rounds,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        squadName: p.squadName,
        colorClass: p.colorClass,
        gamesPlayed: p.gamesPlayed,
        restCount: p.restCount,
        firstGameTime: p.firstGameTime === null ? null : fmtTime(p.firstGameTime),
        lastGameTime: p.lastGameTime === null ? null : fmtTime(p.lastGameTime),
      })),
      squads: settings.squads.map((squad, i) => {
        const sp = players.filter((p) => p.squadIndex === i);
        const total = sp.reduce((sum, p) => sum + p.gamesPlayed, 0);
        const avg = sp.length ? total / sp.length : 0;
        const min = sp.length ? Math.min(...sp.map((p) => p.gamesPlayed)) : 0;
        const max = sp.length ? Math.max(...sp.map((p) => p.gamesPlayed)) : 0;
        return {
          name: squad.name || `Squad ${String.fromCharCode(65 + i)}`,
          colorClass: SQUAD_COLORS[i % SQUAD_COLORS.length],
          playerCount: sp.length,
          totalGames: total,
          avgGames: avg,
          minGames: min,
          maxGames: max,
        };
      }),
      summary: {
        totalRounds: numRounds,
        totalMatches: rounds.reduce((sum, r) => sum + r.matches.filter((m) => !m.empty).length, 0),
        totalPlayers: players.length,
        pitchesUsed: numPitches,
        sessionStart: fmtTime(startMinutes),
        sessionEnd: fmtTime(sessionEnd),
        plannedEnd: fmtTime(plannedEnd),
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

  return { generateFixtures, toCSV, fmtTime, parseTimeToMinutes, parseFormat };
});
