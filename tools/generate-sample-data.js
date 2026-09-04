#!/usr/bin/env node
/*
 * Generates deterministic SAMPLE season data into data/seasons/*.js
 * Run:  node tools/generate-sample-data.js
 * Replace the generated files with your real data whenever you like —
 * the site only cares about the shape of the objects, not this script.
 */
const fs = require("fs");
const path = require("path");

// ---------- deterministic RNG ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260904);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const gauss = () => { let u = 0, v = 0; while (u === 0) u = rand(); while (v === 0) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------- reference lists ----------
const FIRST = ["Alex", "Jordan", "Mateo", "Liam", "Noah", "Ethan", "Lucas", "Mason", "Leo", "Kai", "Finn", "Theo", "Hugo", "Elias", "Luca", "Oscar", "Felix", "Jonas", "Rafael", "Diego", "Marco", "Nico", "Max", "Tom", "Ben", "Sam", "Jake", "Ryan", "Owen", "Cole", "Zane", "Ezra", "Ivan", "Arlo", "Milo", "Rui", "Tariq", "Yusuf", "Kenji", "Hiro", "Santi", "Dani", "Emil", "Axel", "Rhys", "Callum", "Dylan", "Aiden", "Louis", "Pascal"];
const LAST = ["Vance", "Mercer", "Okafor", "Lindqvist", "Moreau", "Castellano", "Brandt", "Kowalski", "Ferreira", "Nakamura", "Petrov", "Haddad", "Silva", "Reyes", "Novak", "Fischer", "Dubois", "Rossi", "Jensen", "Andersson", "Byrne", "Walsh", "Hughes", "Carter", "Bennett", "Fletcher", "Holloway", "Sinclair", "Thornton", "Whitfield", "Ashby", "Kerr", "Marsh", "Quinn", "Tate", "Voss", "Weber", "Zimmer", "Laurent", "Iversen", "Grant", "Doyle", "Pryce", "Ochoa", "Sato", "Marin", "Lund", "Kral", "Baros", "Ekström"];
const NATIONS = ["GB", "GB", "GB", "GB", "US", "US", "DE", "NL", "ES", "IT", "FR", "BR", "AU", "CA", "CA", "IE", "PT", "BE", "SE", "PL", "MX", "JP", "IN", "ZA", "AR", "FI", "DK", "NO", "AT", "CH", "NZ", "TR", "GR", "CZ"];
const PLATFORMS = ["PC", "PC", "PlayStation", "PlayStation", "Xbox"];
const INPUTS = ["Wheel", "Wheel", "Pad"];

const TEAMS = [
  { id: "mclaren", name: "McLaren", shortName: "MCL", color: "#FF8000" },
  { id: "ferrari", name: "Ferrari", shortName: "FER", color: "#E80020" },
  { id: "redbull", name: "Red Bull Racing", shortName: "RBR", color: "#3671C6" },
  { id: "mercedes", name: "Mercedes", shortName: "MER", color: "#27F4D2" },
  { id: "astonmartin", name: "Aston Martin", shortName: "AMR", color: "#229971" },
  { id: "alpine", name: "Alpine", shortName: "ALP", color: "#0093CC" },
  { id: "williams", name: "Williams", shortName: "WIL", color: "#64C4FF" },
  { id: "racingbulls", name: "Racing Bulls", shortName: "VRB", color: "#6692FF" },
  { id: "haas", name: "Haas", shortName: "HAA", color: "#B6BABD" },
  { id: "sauber", name: "Kick Sauber", shortName: "SAU", color: "#52E252" }
];

const TRACKS = [
  { name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", location: "Sakhir", country: "BH", countryName: "Bahrain", fullLaps: 57, length: 5.412, baseLap: 91.4 },
  { name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", location: "Jeddah", country: "SA", countryName: "Saudi Arabia", fullLaps: 50, length: 6.174, baseLap: 89.7 },
  { name: "Australian Grand Prix", circuit: "Albert Park Circuit", location: "Melbourne", country: "AU", countryName: "Australia", fullLaps: 58, length: 5.278, baseLap: 79.8 },
  { name: "Japanese Grand Prix", circuit: "Suzuka International Racing Course", location: "Suzuka", country: "JP", countryName: "Japan", fullLaps: 53, length: 5.807, baseLap: 90.9 },
  { name: "Miami Grand Prix", circuit: "Miami International Autodrome", location: "Miami", country: "US", countryName: "United States", fullLaps: 57, length: 5.412, baseLap: 88.9 },
  { name: "Emilia Romagna Grand Prix", circuit: "Autodromo Enzo e Dino Ferrari", location: "Imola", country: "IT", countryName: "Italy", fullLaps: 63, length: 4.909, baseLap: 76.3 },
  { name: "Monaco Grand Prix", circuit: "Circuit de Monaco", location: "Monte Carlo", country: "MC", countryName: "Monaco", fullLaps: 78, length: 3.337, baseLap: 72.9 },
  { name: "Spanish Grand Prix", circuit: "Circuit de Barcelona-Catalunya", location: "Barcelona", country: "ES", countryName: "Spain", fullLaps: 66, length: 4.657, baseLap: 76.6 },
  { name: "British Grand Prix", circuit: "Silverstone Circuit", location: "Silverstone", country: "GB", countryName: "United Kingdom", fullLaps: 52, length: 5.891, baseLap: 88.2 },
  { name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", location: "Stavelot", country: "BE", countryName: "Belgium", fullLaps: 44, length: 7.004, baseLap: 106.3 },
  { name: "Italian Grand Prix", circuit: "Autodromo Nazionale Monza", location: "Monza", country: "IT", countryName: "Italy", fullLaps: 53, length: 5.793, baseLap: 81.5 },
  { name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", location: "Abu Dhabi", country: "AE", countryName: "United Arab Emirates", fullLaps: 58, length: 5.281, baseLap: 86.1 },
  { name: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", location: "Montreal", country: "CA", countryName: "Canada", fullLaps: 70, length: 4.361, baseLap: 73.9 },
  { name: "Austrian Grand Prix", circuit: "Red Bull Ring", location: "Spielberg", country: "AT", countryName: "Austria", fullLaps: 71, length: 4.318, baseLap: 65.6 },
  { name: "Hungarian Grand Prix", circuit: "Hungaroring", location: "Budapest", country: "HU", countryName: "Hungary", fullLaps: 70, length: 4.381, baseLap: 77.3 },
  { name: "Dutch Grand Prix", circuit: "Circuit Zandvoort", location: "Zandvoort", country: "NL", countryName: "Netherlands", fullLaps: 72, length: 4.259, baseLap: 71.4 },
  { name: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", location: "Singapore", country: "SG", countryName: "Singapore", fullLaps: 62, length: 4.940, baseLap: 91.2 },
  { name: "United States Grand Prix", circuit: "Circuit of the Americas", location: "Austin", country: "US", countryName: "United States", fullLaps: 56, length: 5.513, baseLap: 96.2 },
  { name: "Mexico City Grand Prix", circuit: "Autódromo Hermanos Rodríguez", location: "Mexico City", country: "MX", countryName: "Mexico", fullLaps: 71, length: 4.304, baseLap: 77.5 },
  { name: "São Paulo Grand Prix", circuit: "Autódromo José Carlos Pace", location: "São Paulo", country: "BR", countryName: "Brazil", fullLaps: 71, length: 4.309, baseLap: 71.6 }
];

const INCIDENTS = [
  ["Causing a collision", 2], ["Causing a collision", 3], ["Forcing another driver off track", 2], ["Unsafe rejoin", 1],
  ["Track limits abuse (4+ warnings)", 1], ["Ignoring blue flags", 1], ["Corner cutting to gain an advantage", 1],
  ["Overtaking under the safety car", 2], ["Weaving on the straight", 1], ["Impeding in qualifying", 1], ["Dangerous driving", 3],
  ["Failing to slow under yellow flags", 1]
];
const DECISIONS = {
  1: ["Warning", "Reprimand", "5s time penalty", "Lap time deleted"],
  2: ["5s time penalty", "10s time penalty", "3-place grid drop (next round)"],
  3: ["10s time penalty", "5-place grid drop (next round)", "Drive-through equivalent (20s)"]
};

// ---------- helpers ----------
const fmtLap = (s) => { const m = Math.floor(s / 60); const r = s - m * 60; return `${m}:${r.toFixed(3).padStart(6, "0")}`; };
const fmtRace = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s - h * 3600 - m * 60; return `${h ? h + ":" : ""}${String(m).padStart(2, "0")}:${r.toFixed(3).padStart(6, "0")}`; };
const fmtGap = (s) => `+${s.toFixed(3)}`;
const isoAt = (date, hour, offset) => { const d = new Date(date); const y = d.getUTCFullYear(); const mo = String(d.getUTCMonth() + 1).padStart(2, "0"); const da = String(d.getUTCDate()).padStart(2, "0"); return `${y}-${mo}-${da}T${String(hour).padStart(2, "0")}:00:00${offset}`; };
const addDays = (date, n) => { const d = new Date(date); d.setUTCDate(d.getUTCDate() + n); return d; };

// ---------- driver pool ----------
function buildDriverPool(count) {
  const used = new Set(); const usedNumbers = new Set([1]);
  const pool = [];
  while (pool.length < count) {
    const first = pick(FIRST), last = pick(LAST); const name = `${first} ${last}`;
    if (used.has(name)) continue; used.add(name);
    let number; do { number = 2 + Math.floor(rand() * 97); } while (usedNumbers.has(number)); usedNumbers.add(number);
    const nationality = pick(NATIONS);
    pool.push({
      id: slug(name), name, tag: `${first[0]}${last.replace(/[^A-Za-z]/g, "")}${number}`.replace(/ö/g, "o"), number, nationality,
      platform: pick(PLATFORMS), input: pick(INPUTS),
      skill: 0, // filled later
      joined: 0,
      bio: "",
      socials: rand() < 0.35 ? { twitch: `https://twitch.tv/${slug(name).replace(/-/g, "")}` } : {},
      photo: null
    });
  }
  // skill descending with the index so the pool is "ranked"
  pool.forEach((d, i) => { d.skill = 0.98 - (i / count) * 0.6 + gauss() * 0.02; });
  return pool;
}

const BIOS = [
  "Consistent points scorer who thrives in wheel-to-wheel battles.",
  "Qualifying specialist with a knack for one-lap pace.",
  "Strategy-minded racer who makes tyre offsets work.",
  "Aggressive on the opening lap, calm under pressure at the end.",
  "Joined from an endurance background and adapted quickly to F1 racing.",
  "Known for clean racing and rarely appearing in the stewards' room.",
  "Comeback specialist: has more recovery drives than anyone on the grid.",
  "Rain master. Give this driver a wet track and watch the gaps grow.",
  "Team player with a reputation for fair, hard racing."
];

// ---------- season builders ----------
function buildTiers(defs) {
  return defs.map((t, i) => ({ id: t.id, name: t.name, shortName: t.shortName, raceDay: t.day, raceTime: "20:00 UK", color: t.color, order: i + 1, description: t.description }));
}

function assignSeats(drivers, tiers, teams) {
  // 20 drivers per tier -> 10 teams x 2
  const seats = [];
  tiers.forEach((tier, ti) => {
    const group = drivers.slice(ti * 20, ti * 20 + 20);
    const teamOrder = shuffle(teams);
    group.forEach((d, i) => { seats.push({ driver: d, tier: tier.id, team: teamOrder[Math.floor(i / 2)].id, role: "driver" }); });
  });
  return seats;
}

function generateRound(track, index, baseDate, tiers, dayOffsets, sprint) {
  const laps = Math.round(track.fullLaps * 0.5);
  const sessions = {};
  tiers.forEach((t, i) => { sessions[t.id] = isoAt(addDays(baseDate, dayOffsets[i]), 20, "+01:00"); });
  return {
    id: `r${index + 1}`, round: index + 1, name: track.name, circuit: track.circuit, location: track.location, country: track.country, countryName: track.countryName,
    laps, fullLaps: track.fullLaps, length: track.length, format: "50%", sprint, sessions, map: null,
    notes: sprint ? "Sprint weekend: 8-lap sprint on Saturday + 50% Grand Prix." : ""
  };
}

function generateResult(round, track, tierId, entrants, reserves, penaltiesOut, penaltyIdRef) {
  // occasionally a reserve stands in
  const field = entrants.map((e) => ({ ...e }));
  if (rand() < 0.35 && reserves.length) {
    const idx = Math.floor(rand() * field.length);
    const reserve = pick(reserves);
    field[idx] = { driver: reserve, tier: tierId, team: field[idx].team, role: "reserve" };
  }
  // qualifying
  const q = field.map((e) => ({ e, score: e.driver.skill + gauss() * 0.06 }));
  q.sort((a, b) => b.score - a.score);
  const poleTime = track.baseLap + 1.2 + rand() * 0.6;
  const qualifying = q.map((x, i) => ({ position: i + 1, driver: x.e.driver.id, team: x.e.team, time: fmtLap(poleTime + i * (0.12 + rand() * 0.18) + (i > 14 ? 0.4 : 0)) }));
  const gridOf = {}; qualifying.forEach((r) => { gridOf[r.driver] = r.position; });

  // sprint (optional)
  let sprint = null;
  if (round.sprint) {
    const s = field.map((e) => ({ e, score: e.driver.skill * 0.65 + (1 - (gridOf[e.driver.id] - 1) / 20) * 0.35 + gauss() * 0.07 }));
    s.sort((a, b) => b.score - a.score);
    let cum = 0;
    sprint = s.map((x, i) => { cum += i === 0 ? 0 : 0.4 + rand() * 1.8; return { position: i + 1, driver: x.e.driver.id, team: x.e.team, laps: 8, status: "Finished", time: i === 0 ? fmtRace(8 * (track.baseLap + 2.4)) : fmtGap(cum) }; });
  }

  // race
  const r = field.map((e) => {
    const grid = gridOf[e.driver.id];
    const score = e.driver.skill * 0.7 + (1 - (grid - 1) / 20) * 0.3 + gauss() * 0.09;
    const roll = rand();
    const status = roll < 0.07 ? "DNF" : roll < 0.078 ? "DSQ" : "Finished";
    return { e, grid, score, status, lapsDone: status === "Finished" ? round.laps : Math.max(1, Math.floor(rand() * (round.laps - 1))) };
  });
  const finishers = r.filter((x) => x.status === "Finished").sort((a, b) => b.score - a.score);
  const others = r.filter((x) => x.status !== "Finished").sort((a, b) => b.lapsDone - a.lapsDone);
  const avgLap = track.baseLap + 2.6;
  const winnerTime = round.laps * avgLap + rand() * 20;
  let cum = 0;
  const race = [];
  finishers.forEach((x, i) => {
    if (i > 0) cum += 0.3 + Math.pow(rand(), 0.6) * (i < 5 ? 3 : 6);
    const lappedLaps = Math.floor(cum / avgLap);
    race.push({
      position: i + 1, driver: x.e.driver.id, team: x.e.team, grid: x.grid, laps: round.laps - lappedLaps, status: "Finished",
      time: i === 0 ? fmtRace(winnerTime) : lappedLaps > 0 ? `+${lappedLaps} lap${lappedLaps > 1 ? "s" : ""}` : fmtGap(cum),
      fastestLap: false, penaltySeconds: 0
    });
  });
  others.forEach((x, i) => {
    race.push({ position: finishers.length + i + 1, driver: x.e.driver.id, team: x.e.team, grid: x.grid, laps: x.lapsDone, status: x.status, time: x.status === "DSQ" ? "DSQ" : "DNF", fastestLap: false, penaltySeconds: 0 });
  });
  // fastest lap: weighted to the front
  const flCandidates = race.filter((x) => x.status === "Finished").slice(0, 10);
  const fl = flCandidates[Math.min(flCandidates.length - 1, Math.floor(Math.pow(rand(), 1.8) * flCandidates.length))];
  if (fl) { fl.fastestLap = true; fl.fastestLapTime = fmtLap(track.baseLap + 1.8 + rand() * 0.9); }
  // driver of the day
  const dotdPool = race.filter((x) => x.status === "Finished").slice(0, 10);
  const dotd = pick(dotdPool).driver;

  // penalties
  const nPen = Math.floor(rand() * 4);
  for (let i = 0; i < nPen; i++) {
    const inc = pick(INCIDENTS);
    const offender = pick(race);
    const other = rand() < 0.6 ? pick(race.filter((x) => x.driver !== offender.driver)) : null;
    const decision = pick(DECISIONS[inc[1]]);
    const secs = /^(\d+)s/.exec(decision); if (secs && offender.status === "Finished") offender.penaltySeconds += Number(secs[1]);
    penaltiesOut.push({
      id: `p${++penaltyIdRef.n}`, round: round.id, tier: tierId, driver: offender.driver, against: other ? other.driver : null,
      lap: 1 + Math.floor(rand() * round.laps), incident: inc[0], decision, points: inc[1] === 1 && /Warning|Reprimand/.test(decision) ? 0 : inc[1],
      status: "Decided", steward: "Stewards Panel"
    });
  }

  const winner = race[0], second = race[1], third = race[2];
  const nameOf = (id) => field.find((f) => f.driver.id === id).driver.name;
  const report = `${nameOf(winner.driver)} converted P${winner.grid} on the grid into victory at ${track.circuit}, finishing ${second ? second.time + " clear of " + nameOf(second.driver) : "unchallenged"}. ${third ? nameOf(third.driver) + " completed the podium" : ""}${fl ? ", while " + nameOf(fl.driver) + " took the fastest lap" : ""}.`;

  return { round: round.id, tier: tierId, qualifying, sprint, race, dotd, report, stream: null };
}

function buildSeason(opts, pool) {
  const tiers = buildTiers(opts.tiers);
  const seatDrivers = opts.pickDrivers(pool);
  const seats = assignSeats(seatDrivers, tiers, TEAMS);
  const reservesByTier = {};
  const reserves = opts.pickReserves(pool);
  tiers.forEach((t, i) => { reservesByTier[t.id] = reserves.slice(i * 4, i * 4 + 4); });

  const drivers = [];
  seats.forEach((s) => drivers.push({ id: s.driver.id, name: s.driver.name, tag: s.driver.tag, number: s.driver.number, nationality: s.driver.nationality, tier: s.tier, team: s.team, role: "driver", platform: s.driver.platform, input: s.driver.input, joined: s.driver.joined || opts.year, bio: pick(BIOS), socials: s.driver.socials, photo: null }));
  tiers.forEach((t) => reservesByTier[t.id].forEach((d) => drivers.push({ id: d.id, name: d.name, tag: d.tag, number: d.number, nationality: d.nationality, tier: t.id, team: null, role: "reserve", platform: d.platform, input: d.input, joined: d.joined || opts.year, bio: "Reserve driver — available to stand in for absent drivers.", socials: d.socials, photo: null })));

  const dayOffsets = tiers.map((_, i) => i);
  const rounds = opts.tracks.map((track, i) => generateRound(track, i, addDays(opts.start, i * 7), tiers, dayOffsets, opts.sprintRounds.includes(i + 1)));

  const results = []; const penalties = []; const pref = { n: 0 };
  rounds.forEach((round, ri) => {
    if (ri + 1 > opts.completedRounds) return;
    const track = opts.tracks[ri];
    tiers.forEach((tier) => {
      const entrants = seats.filter((s) => s.tier === tier.id);
      results.push(generateResult(round, track, tier.id, entrants, reservesByTier[tier.id], penalties, pref));
    });
  });
  // last round's late penalties are still under review
  penalties.filter((p) => p.round === `r${opts.completedRounds}`).slice(-2).forEach((p) => { p.status = "Under review"; });

  return {
    id: opts.id, name: opts.name, year: opts.year, game: opts.game, current: !!opts.current, pointsSystem: "f1", dropRounds: 0,
    description: opts.description, tiers, teams: TEAMS, drivers, rounds, results, penalties
  };
}

// ---------- run ----------
const pool = buildDriverPool(76);
pool.forEach((d, i) => { d.joined = i % 3 === 0 ? 2024 : i % 3 === 1 ? 2025 : 2026; });

const seasons = [
  buildSeason({
    id: "2025", name: "Season 2", year: 2025, game: "F1 24", current: false,
    description: "Two tiers, ten rounds. The season that put the league on the map.",
    tiers: [
      { id: "t1", name: "Tier 1", shortName: "T1", day: "Tuesday", color: "#e8002d", description: "The top split. Fastest drivers, tightest margins." },
      { id: "t2", name: "Tier 2", shortName: "T2", day: "Wednesday", color: "#3b82f6", description: "Competitive racing for drivers pushing for promotion." }
    ],
    tracks: [TRACKS[12], TRACKS[13], TRACKS[14], TRACKS[15], TRACKS[10], TRACKS[16], TRACKS[17], TRACKS[18], TRACKS[19], TRACKS[11]],
    start: "2025-09-02", completedRounds: 10, sprintRounds: [4, 8],
    pickDrivers: (p) => p.slice(4, 44),
    pickReserves: (p) => p.slice(60, 68)
  }, pool),
  buildSeason({
    id: "2026", name: "Season 3", year: 2026, game: "F1 25", current: true,
    description: "Three tiers, twelve rounds, sprint weekends and full broadcasts every race night.",
    tiers: [
      { id: "t1", name: "Tier 1", shortName: "T1", day: "Tuesday", color: "#e8002d", description: "The top split. Fastest drivers, tightest margins." },
      { id: "t2", name: "Tier 2", shortName: "T2", day: "Wednesday", color: "#3b82f6", description: "Competitive racing for drivers pushing for promotion." },
      { id: "t3", name: "Tier 3", shortName: "T3", day: "Thursday", color: "#22c55e", description: "The development tier. Learn race craft in a clean, supportive field." }
    ],
    tracks: TRACKS.slice(0, 12),
    start: "2026-07-28", completedRounds: 6, sprintRounds: [5, 10],
    pickDrivers: (p) => p.slice(0, 60),
    pickReserves: (p) => p.slice(60, 72)
  }, pool)
];

const outDir = path.join(__dirname, "..", "data", "seasons");
fs.mkdirSync(outDir, { recursive: true });
seasons.forEach((s) => {
  const file = path.join(outDir, `${s.id}.js`);
  const body = `/* Sample data generated by tools/generate-sample-data.js — replace with your real season. */\n` +
    `window.TRL_DATA = window.TRL_DATA || {};\n` +
    `window.TRL_DATA.seasons = window.TRL_DATA.seasons || [];\n` +
    `window.TRL_DATA.seasons.push(${JSON.stringify(s, null, 2)});\n`;
  fs.writeFileSync(file, body);
  console.log(`wrote ${path.relative(process.cwd(), file)} — ${s.drivers.length} drivers, ${s.rounds.length} rounds, ${s.results.length} result sheets, ${s.penalties.length} penalties`);
});
