/* =============================================================
   TRL Driver Hub — engine
   Pure functions over window.TRL_DATA / window.TRL_CONFIG:
   standings with bonus points, contracts & salary cap, licences,
   schedule status, race history, analysis and endurance helpers.
   ============================================================= */
window.TRL_ENGINE = (function () {
  "use strict";
  const LIVE_MS = 3 * 60 * 60 * 1000;
  const cache = new Map();
  const data = () => window.TRL_DATA || {};
  const cfg = () => window.TRL_CONFIG || {};

  // ---------- lookups ----------
  const seasons = () => (data().seasons || []).slice().sort((a, b) => (b.year - a.year) || String(b.id).localeCompare(String(a.id)));
  const currentSeason = () => seasons().find((s) => s.current) || seasons()[0] || null;
  const getSeason = (id) => seasons().find((s) => String(s.id) === String(id)) || currentSeason();
  const divisions = (s) => (s.divisions || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const division = (s, id) => (s.divisions || []).find((d) => d.id === id) || null;
  const teams = (s) => (s.teams || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const team = (s, id) => (s.teams || []).find((t) => t.id === id) || null;
  const drivers = (s) => s.drivers || [];
  const driver = (s, id) => (s.drivers || []).find((d) => d.id === id) || null;
  const rounds = (s) => (s.rounds || []).slice().sort((a, b) => (a.preseason ? -1 : 0) - (b.preseason ? -1 : 0) || a.round - b.round);
  const round = (s, id) => (s.rounds || []).find((r) => r.id === id) || null;
  const sheet = (s, roundId, divId) => (s.results || []).find((r) => r.round === roundId && r.division === divId) || null;
  const sheets = (s, divId) => (s.results || []).filter((r) => (!divId || r.division === divId) && r.published !== false).sort((a, b) => { const ra = round(s, a.round) || {}, rb = round(s, b.round) || {}; return ((ra.preseason ? -1 : ra.round) - (rb.preseason ? -1 : rb.round)); });
  const pointsSystem = (s) => (cfg().pointsSystems || {})[s.pointsSystem] || Object.values(cfg().pointsSystems || {})[0] || { race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], bonuses: {} };
  const capRules = () => cfg().cap || { limit: 60, seatsPerTeam: 4, fullTimePerDivision: 2, reserveFee: 2, waiverFee: 2, performancePerPosition: 2, salaryTable: [] };
  const licenceRules = () => cfg().licence || { activeMax: 7, provisionalMax: 11 };
  const salaryFor = (pos) => { const t = capRules().salaryTable || []; if (!pos || !t.length) return 0; return t[Math.min(t.length, Math.max(1, pos)) - 1]; };

  // ---------- time helpers ----------
  const toSeconds = (t) => { if (!t) return null; const m = /^\+?(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(String(t).trim()); if (!m) return null; return (Number(m[1] || 0) * 60) + Number(m[2]); };

  // ---------- schedule ----------
  function roundStatus(s, r, now) {
    now = now || Date.now();
    const done = (s.results || []).some((x) => x.round === r.id && x.published !== false);
    if (done) return "completed";
    const t = r.date ? new Date(r.date).getTime() : null;
    if (t != null && now >= t && now < t + LIVE_MS) return "live";
    if (t != null && now >= t + LIVE_MS) return "pending";
    return "upcoming";
  }
  function nextRound(s, now) {
    now = now || Date.now();
    const list = rounds(s).filter((r) => roundStatus(s, r, now) !== "completed" && r.date && new Date(r.date).getTime() + LIVE_MS >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
    return list[0] || null;
  }
  const isLive = (s, r, now) => roundStatus(s, r, now) === "live";
  const championshipRounds = (s) => rounds(s).filter((r) => !r.preseason);
  const preseasonRounds = (s) => rounds(s).filter((r) => r.preseason);

  // ---------- results helpers ----------
  const classified = (row) => row.status === "Finished";
  function bonusesFor(sh, row, ps) {
    const b = ps.bonuses || {};
    const out = [];
    if (!classified(row)) return out;
    if (b.pole && row.grid === 1) out.push({ key: "pole", label: "Pole", points: b.pole });
    if (b.fastestLap && row.fastestLap) out.push({ key: "fl", label: "FL", points: b.fastestLap, detail: row.fastestLapTime || "" });
    if (b.dotd && sh.dotd === row.driver) out.push({ key: "dotd", label: "DOTD", points: b.dotd });
    if (b.mostGained && sh._mostGained === row.driver) out.push({ key: "gain", label: "Gain", points: b.mostGained });
    return out;
  }
  function mostGained(sh) {
    let best = null;
    (sh.race || []).forEach((row) => { if (!classified(row) || !row.grid) return; const g = row.grid - row.position; if (g > 0 && (!best || g > best.g || (g === best.g && row.position < best.position))) best = { driver: row.driver, g, position: row.position }; });
    return best ? best.driver : null;
  }
  /** Points for one classification row (race points + bonuses). Preseason rounds score nothing. */
  function rowPoints(s, sh, row) {
    const r = round(s, sh.round);
    if (!r || r.preseason) return { base: 0, bonuses: bonusesFor(sh, row, pointsSystem(s)).map((b) => ({ ...b, points: 0 })), total: 0 };
    const ps = pointsSystem(s);
    if (sh._mostGained === undefined) sh._mostGained = mostGained(sh);
    const base = classified(row) ? (ps.race[row.position - 1] || 0) : 0;
    const bonuses = bonusesFor(sh, row, ps);
    return { base, bonuses, total: base + bonuses.reduce((a, b) => a + b.points, 0) };
  }

  // ---------- standings ----------
  function computeStandings(s, divId) {
    const key = `${s.id}|${divId}`;
    if (cache.has(key)) return cache.get(key);
    const ps = pointsSystem(s);
    const dmap = new Map(), tmap = new Map();
    const ensureD = (id) => { if (!dmap.has(id)) { const d = driver(s, id); dmap.set(id, { driverId: id, driver: d, name: d ? d.name : id, teamId: d ? d.team : null, points: 0, wins: 0, podiums: 0, poles: 0, top5: 0, fastestLaps: 0, dotd: 0, starts: 0, dnfs: 0, positions: new Array(40).fill(0), results: {} }); } return dmap.get(id); };
    const ensureT = (id) => { if (!tmap.has(id)) { const t = team(s, id); tmap.set(id, { teamId: id, team: t, name: t ? t.name : id, points: 0, wins: 0, podiums: 0, positions: new Array(40).fill(0), results: {} }); } return tmap.get(id); };
    sheets(s, divId).forEach((sh) => {
      const r = round(s, sh.round); if (!r) return;
      (sh.race || []).forEach((row) => {
        if (r.preseason && !dmap.has(row.driver) && !drivers(s).some((d) => d.id === row.driver && d.division === divId && !d.unsigned)) return; // showcase-only entrants do not enter the table
        const d = ensureD(row.driver);
        const pts = rowPoints(s, sh, row);
        const res = { round: r.id, position: row.position, grid: row.grid, status: row.status, points: pts.total, base: pts.base, bonuses: pts.bonuses, team: row.team, reserve: !!row.reserve, fastestLap: !!row.fastestLap, preseason: !!r.preseason };
        d.results[r.id] = res;
        if (r.preseason) return; // showcase: no championship stats
        d.starts++; d.points += pts.total;
        if (row.team && !row.reserve) d.teamId = row.team;
        if (classified(row)) { d.positions[row.position - 1]++; if (row.position === 1) d.wins++; if (row.position <= 3) d.podiums++; if (row.position <= 5) d.top5++; } else d.dnfs++;
        if (row.grid === 1 && classified(row)) d.poles++;
        if (row.fastestLap) d.fastestLaps++;
        if (sh.dotd === row.driver) d.dotd++;
        if (row.team && (!row.reserve || ps.reservesScoreConstructors)) {
          const t = ensureT(row.team); t.points += pts.total; t.results[r.id] = (t.results[r.id] || 0) + pts.total;
          if (classified(row)) { t.positions[row.position - 1]++; if (row.position === 1) t.wins++; if (row.position <= 3) t.podiums++; }
        }
      });
    });
    drivers(s).filter((d) => d.division === divId && d.role === "driver" && !d.unsigned).forEach((d) => ensureD(d.id));
    teams(s).forEach((t) => ensureT(t.id));
    const countback = (a, b) => { for (let i = 0; i < 40; i++) if (a.positions[i] !== b.positions[i]) return b.positions[i] - a.positions[i]; return 0; };
    const sortFn = (a, b) => (b.points - a.points) || countback(a, b) || String(a.name).localeCompare(String(b.name));
    const dl = Array.from(dmap.values()).sort(sortFn);
    dl.forEach((d, i) => { d.position = i + 1; d.team = d.teamId ? team(s, d.teamId) : null; d.gap = i ? dl[0].points - d.points : 0; });
    const tl = Array.from(tmap.values()).sort(sortFn);
    tl.forEach((t, i) => { t.position = i + 1; t.gap = i ? tl[0].points - t.points : 0; });
    const out = { season: s, divisionId: divId, drivers: dl, teams: tl, rounds: sheets(s, divId).map((x) => round(s, x.round)).filter((r) => r && !r.preseason), pointsSystem: ps };
    cache.set(key, out);
    return out;
  }
  function standingsEntry(s, driverId) {
    for (const dv of divisions(s)) { const e = computeStandings(s, dv.id).drivers.find((d) => d.driverId === driverId); if (e) return { entry: e, division: dv }; }
    return null;
  }
  const leaders = (s, divId, n) => computeStandings(s, divId).drivers.slice(0, n || 3);
  const classifiedCount = (s, divId) => computeStandings(s, divId).drivers.length;
  function teamTotal(s, teamId) { return divisions(s).reduce((a, dv) => { const t = computeStandings(s, dv.id).teams.find((x) => x.teamId === teamId); return a + (t ? t.points : 0); }, 0); }
  function teamWins(s, teamId) { return divisions(s).reduce((a, dv) => { const t = computeStandings(s, dv.id).teams.find((x) => x.teamId === teamId); return a + (t ? t.wins : 0); }, 0); }

  // ---------- rosters / contracts / cap ----------
  const roster = (s, teamId, divId) => drivers(s).filter((d) => d.team === teamId && d.role === "driver" && !d.unsigned && (!divId || d.division === divId));
  const freeAgents = (s) => drivers(s).filter((d) => d.unsigned || !d.team).sort((a, b) => a.name.localeCompare(b.name));
  function rosters(s, divId) {
    const byTeam = teams(s).map((t) => ({ team: t, drivers: roster(s, t.id, divId).sort((a, b) => a.name.localeCompare(b.name)) })).filter((x) => x.drivers.length);
    return { byTeam, freeAgents: freeAgents(s) };
  }
  function contractType(d) { if (!d) return "—"; if (d.contract && d.contract.type === "full-time") return "Full-time"; if (d.role === "reserve") return "Reserve"; return "Free agent"; }
  function performanceFor(s, d) {
    if (!d || !d.contract || !d.division) return 0;
    const pd = capRules().performanceDivision; if (pd && d.division !== pd) return 0;
    const e = computeStandings(s, d.division).drivers.find((x) => x.driverId === d.id);
    if (!e) return 0;
    return Math.max(0, d.contract.position - e.position) * (capRules().performancePerPosition || 0);
  }
  function teamCap(s, teamId) {
    const rules = capRules();
    const full = roster(s, teamId);
    const rosterRows = full.map((d) => { const e = d.division ? computeStandings(s, d.division).drivers.find((x) => x.driverId === d.id) : null; return { driver: d, division: division(s, d.division), contract: d.contract, salary: d.contract ? d.contract.salary : 0, standing: e || null, perf: performanceFor(s, d) }; });
    const tx = (s.transactions || []).filter((t) => t.team === teamId);
    const reserves = tx.filter((t) => t.type === "reserve");
    const contracts = rosterRows.reduce((a, r) => a + (r.salary || 0), 0);
    const reservesAmt = reserves.reduce((a, t) => a + (Number(t.amount) || rules.reserveFee), 0);
    const waivers = tx.filter((t) => t.type === "waiver").reduce((a, t) => a + (Number(t.amount) || rules.waiverFee), 0);
    const performance = rosterRows.reduce((a, r) => a + r.perf, 0);
    const penalties = tx.filter((t) => t.type === "penalty").reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const total = contracts + reservesAmt + waivers + performance + penalties;
    return { limit: rules.limit, contracts, reserves: reservesAmt, waivers, performance, penalties, total, remaining: rules.limit - total, over: Math.max(0, total - rules.limit), seatsUsed: full.length, seats: rules.seatsPerTeam, roster: rosterRows, reserveTx: reserves };
  }
  const money = (n) => `$${Number.isInteger(n) ? n : Number(n).toFixed(1).replace(/\.0$/, "")}M`;

  // ---------- licences ----------
  function licencePoints(s, driverId) { return (s.penalties || []).filter((p) => p.driver === driverId && p.status !== "Overturned").reduce((a, p) => a + (Number(p.licencePoints) || 0), 0); }
  function licence(s, d) {
    const rules = licenceRules();
    const pts = licencePoints(s, d.id);
    const status = pts <= rules.activeMax ? "Active" : pts <= rules.provisionalMax ? "Provisional" : "Suspended";
    return { points: pts, status, contract: contractType(d), thresholds: rules };
  }
  const penaltiesFor = (s, driverId) => (s.penalties || []).filter((p) => p.driver === driverId || p.against === driverId);

  // ---------- driver history ----------
  function driverHistory(s, driverId) {
    const out = [];
    (s.results || []).filter((sh) => sh.published !== false).forEach((sh) => {
      const row = (sh.race || []).find((x) => x.driver === driverId); if (!row) return;
      const r = round(s, sh.round); if (!r) return;
      const pts = rowPoints(s, sh, row);
      out.push({ round: r, division: division(s, sh.division), sheet: sh, row, points: pts.total, bonuses: pts.bonuses });
    });
    return out.sort((a, b) => ((b.round.preseason ? -1 : b.round.round) - (a.round.preseason ? -1 : a.round.round)));
  }
  function driverStats(s, driverId) {
    const se = standingsEntry(s, driverId);
    const d = driver(s, driverId);
    return { points: se ? se.entry.points : 0, wins: se ? se.entry.wins : 0, podiums: se ? se.entry.podiums : 0, position: se ? se.entry.position : null, division: se ? se.division : (d && d.division ? division(s, d.division) : null), of: se ? computeStandings(s, se.division.id).drivers.length : 0 };
  }

  // ---------- analysis ----------
  function analysis(s, roundId, divId) {
    const sh = sheet(s, roundId, divId); if (!sh) return null;
    const race = sh.race || [];
    const winner = race[0];
    const rows = race.map((row) => {
      const pts = rowPoints(s, sh, row);
      const gap = row.status === "Finished" ? (row.gapSeconds != null ? row.gapSeconds : toSeconds(row.time && row.time.startsWith("+") && !/lap/.test(row.time) ? row.time : null)) : null;
      const penaltyTotal = (row.trackLimits || 0) + (row.penalties || []).reduce((a, p) => a + (p.seconds || 0), 0);
      return { row, driverId: row.driver, gained: row.grid ? row.grid - row.position : 0, gap, penaltyTotal, points: pts.total, bonuses: pts.bonuses, quali: toSeconds(row.quali) };
    });
    const pole = rows.map((x) => x.quali).filter((x) => x != null).sort((a, b) => a - b)[0] || null;
    rows.forEach((x) => { x.qualiGap = x.quali != null && pole != null ? x.quali - pole : null; });
    return { sheet: sh, rows, winner, mostGained: sh._mostGained === undefined ? mostGained(sh) : sh._mostGained, finishers: rows.filter((x) => x.row.status === "Finished").length, retirements: rows.filter((x) => x.row.status !== "Finished").length, penalised: rows.filter((x) => x.penaltyTotal > 0).length };
  }

  // ---------- endurance ----------
  function enduranceEvents(now) {
    now = now || Date.now();
    const ev = ((data().endurance || {}).events || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcoming = ev.filter((e) => new Date(e.date).getTime() + (e.hours || 2) * 3600000 >= now);
    const nextId = upcoming.length ? upcoming[0].id : null;
    return ev.map((e) => ({ ...e, status: new Date(e.date).getTime() + (e.hours || 2) * 3600000 < now ? "completed" : e.id === nextId ? "next" : "upcoming" }));
  }
  const enduranceEvent = (id, now) => enduranceEvents(now).find((e) => e.id === id) || null;
  const nextHeadline = (now) => enduranceEvents(now).find((e) => e.headline && e.status !== "completed") || enduranceEvents(now).find((e) => e.status !== "completed") || null;

  return { seasons, currentSeason, getSeason, divisions, division, teams, team, drivers, driver, rounds, round, sheet, sheets, pointsSystem, capRules, licenceRules, salaryFor, toSeconds, roundStatus, nextRound, isLive, championshipRounds, preseasonRounds, rowPoints, mostGained, computeStandings, standingsEntry, leaders, classifiedCount, teamTotal, teamWins, roster, freeAgents, rosters, contractType, performanceFor, teamCap, money, licencePoints, licence, penaltiesFor, driverHistory, driverStats, analysis, enduranceEvents, enduranceEvent, nextHeadline, LIVE_MS };
})();
