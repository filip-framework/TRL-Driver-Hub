/* =============================================================
   TRL Driver Hub — Standings engine
   Pure functions over window.TRL_DATA / window.TRL_CONFIG.
   Computes championships, stats, schedule status and careers.
   ============================================================= */
window.TRL_ENGINE = (function () {
  "use strict";
  const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000; // a session counts as "live" for 3h after its start
  const cache = new Map();

  const data = () => window.TRL_DATA || { seasons: [] };
  const config = () => window.TRL_CONFIG || {};

  function seasons() {
    return (data().seasons || []).slice().sort((a, b) => (b.year - a.year) || String(b.id).localeCompare(String(a.id)));
  }
  function currentSeason() { const all = seasons(); return all.find((s) => s.current) || all[0] || null; }
  function getSeason(id) { return seasons().find((s) => String(s.id) === String(id)) || currentSeason(); }

  function pointsSystem(season) {
    const systems = config().pointsSystems || {};
    return systems[season && season.pointsSystem] || systems.f1 || { race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], sprint: [8, 7, 6, 5, 4, 3, 2, 1], fastestLap: 1, fastestLapTop10Only: true, pole: 0 };
  }

  const tiers = (season) => (season.tiers || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const tier = (season, id) => (season.tiers || []).find((t) => t.id === id) || null;
  const team = (season, id) => (season.teams || []).find((t) => t.id === id) || null;
  const driver = (season, id) => (season.drivers || []).find((d) => d.id === id) || null;
  const round = (season, id) => (season.rounds || []).find((r) => r.id === id) || null;
  const rounds = (season) => (season.rounds || []).slice().sort((a, b) => a.round - b.round);
  const sheet = (season, roundId, tierId) => (season.results || []).find((r) => r.round === roundId && r.tier === tierId) || null;
  const tierSheets = (season, tierId) => (season.results || []).filter((r) => r.tier === tierId).sort((a, b) => (round(season, a.round) || {}).round - (round(season, b.round) || {}).round);
  const tierDrivers = (season, tierId, role) => (season.drivers || []).filter((d) => d.tier === tierId && (!role || d.role === role));

  /** Most recent season that has this driver. */
  function driverAnySeason(driverId) {
    for (const s of seasons()) { const d = driver(s, driverId); if (d) return { driver: d, season: s }; }
    return null;
  }

  function sessionDate(season, roundObj, tierId) {
    const s = roundObj.sessions || {};
    const iso = tierId ? s[tierId] : Object.values(s).sort()[0];
    return iso ? new Date(iso) : null;
  }

  function roundStatus(season, roundObj, tierId, now) {
    now = now || Date.now();
    const done = tierId ? !!sheet(season, roundObj.id, tierId) : tiers(season).every((t) => !!sheet(season, roundObj.id, t.id));
    if (done) return "completed";
    const date = sessionDate(season, roundObj, tierId);
    if (date && now >= date.getTime() && now < date.getTime() + LIVE_WINDOW_MS) return "live";
    if (date && now >= date.getTime() + LIVE_WINDOW_MS) return "pending"; // raced, results not entered yet
    return "upcoming";
  }

  /** Next race for a tier (or across all tiers when tierId is omitted). */
  function nextSession(season, tierId, now) {
    now = now || Date.now();
    const list = [];
    tiers(season).filter((t) => !tierId || t.id === tierId).forEach((t) => {
      rounds(season).forEach((r) => {
        if (sheet(season, r.id, t.id)) return;
        const date = sessionDate(season, r, t.id);
        if (!date) return;
        if (date.getTime() + LIVE_WINDOW_MS < now) return;
        list.push({ round: r, tier: t, date, live: now >= date.getTime() });
      });
    });
    list.sort((a, b) => a.date - b.date);
    return list[0] || null;
  }
  function liveNow(season, now) { const n = nextSession(season, null, now); return n && n.live ? n : null; }

  function lastCompleted(season, tierId) {
    const sheets = tierSheets(season, tierId);
    if (!sheets.length) return null;
    const s = sheets[sheets.length - 1];
    return { sheet: s, round: round(season, s.round) };
  }

  // ---------- standings ----------
  function countback(a, b) {
    for (let i = 0; i < 30; i++) { if ((a.positions[i] || 0) !== (b.positions[i] || 0)) return (b.positions[i] || 0) - (a.positions[i] || 0); }
    return 0;
  }
  const byPoints = (a, b) => (b.points - a.points) || countback(a, b) || String(a.name || "").localeCompare(String(b.name || ""));

  function computeStandings(season, tierId, opts) {
    opts = opts || {};
    const key = `${season.id}|${tierId}|${opts.upToRound == null ? "all" : opts.upToRound}`;
    if (!opts.noCache && cache.has(key)) return cache.get(key);

    const ps = pointsSystem(season);
    const sheets = tierSheets(season, tierId);
    const included = opts.upToRound == null ? sheets : sheets.slice(0, opts.upToRound);
    const dmap = new Map(), tmap = new Map();

    const ensureD = (id) => {
      if (!dmap.has(id)) {
        const d = driver(season, id);
        dmap.set(id, { driverId: id, driver: d, name: d ? d.name : id, teamId: null, role: d ? d.role : "driver", points: 0, rawPoints: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, dnfs: 0, starts: 0, bestFinish: null, finishSum: 0, finishes: 0, results: {}, positions: new Array(30).fill(0), roundPoints: [], dropped: [] });
      }
      return dmap.get(id);
    };
    const ensureT = (id) => {
      if (!tmap.has(id)) { const t = team(season, id); tmap.set(id, { teamId: id, team: t, name: t ? t.name : id, points: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, positions: new Array(30).fill(0), results: {}, drivers: new Set() }); }
      return tmap.get(id);
    };

    included.forEach((sh) => {
      const rnd = round(season, sh.round);
      if (!rnd) return;
      const pole = (sh.qualifying || []).find((q) => q.position === 1);
      (sh.sprint || []).forEach((row) => {
        const pts = row.status === "Finished" ? (ps.sprint[row.position - 1] || 0) : 0;
        const d = ensureD(row.driver);
        const teamId = row.team || (d.driver && d.driver.team);
        d.points += pts; d.rawPoints += pts;
        d.results[rnd.id] = Object.assign(d.results[rnd.id] || {}, { sprintPosition: row.position, sprintPoints: pts, sprintStatus: row.status });
        if (teamId) { const t = ensureT(teamId); t.points += pts; t.results[rnd.id] = (t.results[rnd.id] || 0) + pts; }
      });
      (sh.race || []).forEach((row) => {
        const d = ensureD(row.driver);
        const teamId = row.team || (d.driver && d.driver.team) || null;
        d.teamId = teamId;
        const finished = row.status === "Finished";
        let pts = 0;
        if (finished) {
          pts = ps.race[row.position - 1] || 0;
          if (row.fastestLap && ps.fastestLap && (!ps.fastestLapTop10Only || row.position <= 10)) pts += ps.fastestLap;
        }
        const isPole = !!(pole && pole.driver === row.driver);
        if (isPole && ps.pole) pts += ps.pole;
        d.starts++; d.points += pts; d.rawPoints += pts;
        if (finished) {
          d.positions[row.position - 1]++;
          if (row.position === 1) d.wins++;
          if (row.position <= 3) d.podiums++;
          d.finishSum += row.position; d.finishes++;
          d.bestFinish = d.bestFinish == null ? row.position : Math.min(d.bestFinish, row.position);
        } else if (row.status === "DNF" || row.status === "DSQ" || row.status === "DNS") d.dnfs++;
        if (row.fastestLap) d.fastestLaps++;
        if (isPole) d.poles++;
        const prev = d.results[rnd.id] || {};
        const total = pts + (prev.sprintPoints || 0);
        d.results[rnd.id] = Object.assign(prev, { position: row.position, status: row.status, racePoints: pts, points: total, grid: row.grid, fastestLap: !!row.fastestLap, pole: isPole, team: teamId, penaltySeconds: row.penaltySeconds || 0 });
        d.roundPoints.push({ round: rnd.id, points: total });
        if (teamId) {
          const t = ensureT(teamId);
          t.points += pts; t.results[rnd.id] = (t.results[rnd.id] || 0) + pts; t.drivers.add(row.driver);
          if (finished) { t.positions[row.position - 1]++; if (row.position === 1) t.wins++; if (row.position <= 3) t.podiums++; }
          if (row.fastestLap) t.fastestLaps++; if (isPole) t.poles++;
        }
      });
    });

    // every full-time driver and every team appears, even with zero points
    tierDrivers(season, tierId, "driver").forEach((d) => { const e = ensureD(d.id); if (!e.teamId) e.teamId = d.team; });
    (season.teams || []).forEach((t) => ensureT(t.id));

    // drop rounds (if enabled for the season)
    const drop = Number(season.dropRounds || 0);
    if (drop > 0) {
      dmap.forEach((d) => {
        const sorted = d.roundPoints.slice().sort((a, b) => a.points - b.points);
        d.dropped = sorted.slice(0, Math.min(drop, Math.max(0, sorted.length - 1)));
        d.points = d.rawPoints - d.dropped.reduce((s, x) => s + x.points, 0);
      });
    }

    const drivers = Array.from(dmap.values()).sort(byPoints);
    drivers.forEach((d, i) => { d.position = i + 1; d.avgFinish = d.finishes ? d.finishSum / d.finishes : null; d.team = d.teamId ? team(season, d.teamId) : null; });
    const teamsArr = Array.from(tmap.values()).sort(byPoints);
    teamsArr.forEach((t, i) => { t.position = i + 1; t.drivers = Array.from(t.drivers); });
    const leaderPts = drivers.length ? drivers[0].points : 0;
    drivers.forEach((d) => { d.gapToLeader = leaderPts - d.points; });

    // movement vs. before the last completed round
    if (!opts.noMovement && included.length > 1) {
      const prev = computeStandings(season, tierId, { upToRound: included.length - 1, noMovement: true });
      const prevPos = new Map(prev.drivers.map((d) => [d.driverId, d.position]));
      drivers.forEach((d) => { d.movement = prevPos.has(d.driverId) ? prevPos.get(d.driverId) - d.position : 0; });
      const prevT = new Map(prev.teams.map((t) => [t.teamId, t.position]));
      teamsArr.forEach((t) => { t.movement = prevT.has(t.teamId) ? prevT.get(t.teamId) - t.position : 0; });
    } else {
      drivers.forEach((d) => { d.movement = 0; }); teamsArr.forEach((t) => { t.movement = 0; });
    }

    const result = { season, tierId, drivers, teams: teamsArr, rounds: included.map((s) => round(season, s.round)).filter(Boolean), pointsSystem: ps };
    if (!opts.noCache) cache.set(key, result);
    return result;
  }

  function highlights(season, tierId) {
    const st = computeStandings(season, tierId);
    const top = (key) => st.drivers.slice().sort((a, b) => b[key] - a[key] || a.position - b.position)[0];
    return { leader: st.drivers[0] || null, mostWins: top("wins"), mostPoles: top("poles"), mostFastestLaps: top("fastestLaps"), mostPodiums: top("podiums"), team: st.teams[0] || null, rounds: st.rounds.length };
  }

  /** All standings entries for a driver in a season (a driver may have raced in more than one tier). */
  function driverSeason(season, driverId) {
    const out = [];
    tiers(season).forEach((t) => {
      const st = computeStandings(season, t.id);
      const e = st.drivers.find((d) => d.driverId === driverId);
      if (e) out.push({ tier: t, entry: e, standings: st });
    });
    return out;
  }

  function career(driverId) {
    const out = [];
    seasons().forEach((s) => {
      driverSeason(s, driverId).forEach((x) => out.push({ season: s, tier: x.tier, entry: x.entry, position: x.entry.position, of: x.standings.drivers.length, team: x.entry.team }));
    });
    const totals = out.reduce((acc, x) => { const e = x.entry; acc.starts += e.starts; acc.wins += e.wins; acc.podiums += e.podiums; acc.poles += e.poles; acc.fastestLaps += e.fastestLaps; acc.points += e.points; acc.dnfs += e.dnfs; acc.titles += (e.position === 1 && !x.season.current) ? 1 : 0; return acc; }, { starts: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, points: 0, dnfs: 0, titles: 0, seasons: out.length });
    return { entries: out, totals };
  }

  // ---------- penalties ----------
  function penalties(season, filter) {
    filter = filter || {};
    return (season.penalties || []).filter((p) => (!filter.tier || p.tier === filter.tier) && (!filter.driver || p.driver === filter.driver || p.against === filter.driver) && (!filter.round || p.round === filter.round))
      .sort((a, b) => ((round(season, b.round) || {}).round - (round(season, a.round) || {}).round) || String(b.id).localeCompare(String(a.id)));
  }
  function penaltyPoints(season, driverId) {
    return (season.penalties || []).filter((p) => p.driver === driverId && p.status !== "Overturned").reduce((s, p) => s + (Number(p.points) || 0), 0);
  }
  function licenceTable(season, tierId) {
    const drivers = tierDrivers(season, tierId);
    return drivers.map((d) => ({ driver: d, points: penaltyPoints(season, d.id), count: (season.penalties || []).filter((p) => p.driver === d.id).length })).sort((a, b) => b.points - a.points || b.count - a.count || a.driver.name.localeCompare(b.driver.name));
  }

  function teamDrivers(season, teamId, tierId) {
    return (season.drivers || []).filter((d) => d.team === teamId && (!tierId || d.tier === tierId));
  }

  return { seasons, currentSeason, getSeason, pointsSystem, tiers, tier, team, driver, round, rounds, sheet, tierSheets, tierDrivers, teamDrivers, driverAnySeason, sessionDate, roundStatus, nextSession, liveNow, lastCompleted, computeStandings, highlights, driverSeason, career, penalties, penaltyPoints, licenceTable, LIVE_WINDOW_MS };
})();
