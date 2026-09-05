#!/usr/bin/env node
/*
 * Generates deterministic SAMPLE data: data/seasons/2026.js (F1) and data/endurance.js.
 * Run: node tools/generate-sample-data.js
 * Replace the generated files with real data any time — only the shapes matter.
 */
const fs = require("fs");
const path = require("path");
function mulberry32(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = mulberry32(20260905);
const pick = (a) => a[Math.floor(rand() * a.length)];
const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const fmtLap = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, "0")}`;
const fmtRace = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, "0")}`;

const TAGS = ["Fenwick", "S4MMY", "Vortex_Kai", "Rudi_Tempo", "Blaze47", "MarloweGT", "OwenRacer", "TwoStop", "ApexAndre", "Nix_Rossi", "PitLaneP", "Bruno_M", "ChicaneCal", "Hexley", "Torque_T", "LeoMonza", "SkidRow", "HalfTank", "Iverson", "DRS_Dan", "Kurt_K", "Mika_V", "Slipstream_J", "Zed", "Rafa_L", "Quinn9", "Undercut_U", "PolePat", "Brakes", "LockUpLuke", "Yannick", "Enzo_B", "Silverline", "Tempest", "Rocco", "Nando_H", "Gridwalker", "Ballast", "Ferris", "Kimi_Z", "Maverick", "Oxide", "Tarmac_Tom", "Sector3", "WetWeatherW", "LateBraker", "Carbon", "Fabio_R", "Dusty", "Hairpin", "Jetstream", "KerbRider", "Lucky_L", "MSport_Mo", "Nitro", "Overtake_O", "PurpleSector", "Quali_Q", "Ramon", "Stint", "Titan", "Velo", "Wingman", "Xander", "Yago", "Zoom", "Aero_Ash", "Boxbox", "Clutch_C", "Dirty_Air"];
const NATIONS = [["us", "United States"], ["us", "United States"], ["us", "United States"], ["gb-eng", "England"], ["gb-sct", "Scotland"], ["ca", "Canada"], ["ca", "Canada"], ["de", "Germany"], ["es", "Spain"], ["it", "Italy"], ["fr", "France"], ["br", "Brazil"], ["au", "Australia"], ["nl", "Netherlands"], ["mx", "Mexico"], ["rs", "Serbia"], ["in", "India"], ["nz", "New Zealand"], ["cu", "Cuba"], ["co", "Colombia"], ["cn", "China"], ["se", "Sweden"], ["pt", "Portugal"], ["ie", "Ireland"], ["ar", "Argentina"], ["jp", "Japan"], ["za", "South Africa"], ["fi", "Finland"], ["be", "Belgium"], ["at", "Austria"], ["pl", "Poland"], ["tr", "Türkiye"]];
const TZS = ["Eastern", "Central", "Pacific", "GMT", "CET", "AEST", "Mountain"];

const TEAMS = [
  { id: "alpine", name: "Alpine", short: "ALP", color: "#ff6ac7", hq: { city: "Enstone", country: "England", cc: "gb-eng" } },
  { id: "aston-martin", name: "Aston Martin", short: "AMR", color: "#3fb489", hq: { city: "Silverstone", country: "England", cc: "gb-eng" } },
  { id: "audi", name: "Audi", short: "AUD", color: "#ff3b3b", hq: { city: "Hinwil", country: "Switzerland", cc: "ch" } },
  { id: "cadillac", name: "Cadillac", short: "CAD", color: "#d8c38a", hq: { city: "Silverstone", country: "England", cc: "gb-eng" } },
  { id: "ferrari", name: "Ferrari", short: "FER", color: "#ff2a3c", hq: { city: "Maranello", country: "Italy", cc: "it" } },
  { id: "haas", name: "Haas", short: "HAA", color: "#c9ccd6", hq: { city: "Kannapolis", country: "United States", cc: "us" } },
  { id: "mclaren", name: "McLaren", short: "MCL", color: "#ff8a00", hq: { city: "Woking", country: "England", cc: "gb-eng" } },
  { id: "mercedes", name: "Mercedes", short: "MER", color: "#2ee6c5", hq: { city: "Brackley", country: "England", cc: "gb-eng" } },
  { id: "racing-bulls", name: "Racing Bulls", short: "VRB", color: "#5c8dff", hq: { city: "Faenza", country: "Italy", cc: "it" } },
  { id: "red-bull", name: "Red Bull Racing", short: "RBR", color: "#3b6fe0", hq: { city: "Milton Keynes", country: "England", cc: "gb-eng" } },
  { id: "williams", name: "Williams", short: "WIL", color: "#3d9bff", hq: { city: "Grove", country: "England", cc: "gb-eng" } }
];

const TRACKS = [
  { name: "Season 0: Driver Showcase", circuit: "Circuit of the Americas", location: "Austin, USA", cc: "us", laps: 28, fullLaps: 56, base: 96.4, coords: [30.1328, -97.6411], preseason: true },
  { name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", location: "Sakhir, Bahrain", cc: "bh", laps: 29, fullLaps: 57, base: 91.4, coords: [26.0325, 50.5106] },
  { name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", location: "Jeddah, Saudi Arabia", cc: "sa", laps: 25, fullLaps: 50, base: 89.7, coords: [21.6319, 39.1044] },
  { name: "Gran Premio de Barcelona-Catalunya", circuit: "Circuit de Barcelona-Catalunya", location: "Barcelona, Spain", cc: "es", laps: 33, fullLaps: 66, base: 76.6, coords: [41.57, 2.2611] },
  { name: "Austrian Grand Prix", circuit: "Red Bull Ring", location: "Spielberg, Austria", cc: "at", laps: 36, fullLaps: 71, base: 65.6, coords: [47.2197, 14.7647] },
  { name: "British Grand Prix", circuit: "Silverstone Circuit", location: "Silverstone, Northamptonshire, United Kingdom", cc: "gb-eng", laps: 26, fullLaps: 52, base: 88.2, coords: [52.0786, -1.0169] },
  { name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", location: "Stavelot, Belgium", cc: "be", laps: 22, fullLaps: 44, base: 106.3, coords: [50.4372, 5.9714] },
  { name: "Miami Grand Prix", circuit: "Miami International Autodrome", location: "Miami Gardens, Florida, USA", cc: "us", laps: 29, fullLaps: 57, base: 88.9, coords: [25.9581, -80.2389] },
  { name: "Grande Prêmio de São Paulo", circuit: "Autódromo José Carlos Pace", location: "São Paulo, Brazil", cc: "br", laps: 36, fullLaps: 71, base: 71.6, coords: [-23.7036, -46.6997] },
  { name: "Qatar Grand Prix", circuit: "Lusail International Circuit", location: "Lusail, Qatar", cc: "qa", laps: 29, fullLaps: 57, base: 84.1, coords: [25.49, 51.4542] },
  { name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", location: "Yas Island, Abu Dhabi, United Arab Emirates", cc: "ae", laps: 29, fullLaps: 58, base: 86.1, coords: [24.4672, 54.6031] }
];
const INCIDENTS = [["Causing a collision", 2, 5], ["Forcing another driver off track", 2, 5], ["Unsafe rejoin", 1, 3], ["Ignoring blue flags", 1, 3], ["Overtaking under the safety car", 2, 10], ["Dangerous driving", 3, 10], ["Weaving on the straight", 1, 3]];
const BIOS = ["Consistent points scorer who thrives in wheel-to-wheel battles.", "Qualifying specialist with a knack for one-lap pace.", "Strategy-minded racer who makes tyre offsets work.", "Aggressive on the opening lap, calm under pressure at the end.", "Endurance convert who adapted quickly to sprint racing.", "Clean racer who rarely troubles the stewards.", "Comeback specialist with a habit of recovery drives.", "Rain master — hand this driver a wet track and watch the gaps grow.", ""];

// ---------- driver pool ----------
const pool = [];
const usedNums = new Set();
shuffle(TAGS).slice(0, 62).forEach((tag, i) => {
  let n; do { n = 1 + Math.floor(rand() * 98); } while (usedNums.has(n)); usedNums.add(n);
  const [cc, nation] = pick(NATIONS);
  pool.push({ id: slug(tag), name: tag, number: n, cc, nation, skill: 0.98 - (i / 62) * 0.5 + gauss() * 0.02, tz: pick(TZS), bio: pick(BIOS),
    ea: rand() < 0.8 ? tag.replace(/_/g, "") + (rand() < 0.5 ? "" : String(1 + Math.floor(rand() * 99))) : null,
    discord: { id: null, handle: tag.toLowerCase(), avatar: null },
    socials: { twitch: rand() < 0.25 ? `https://twitch.tv/${slug(tag)}` : null, youtube: rand() < 0.15 ? `https://youtube.com/@${slug(tag)}` : null, tiktok: null } });
});
// some drivers ("no nation set") like the reference
pool.filter((_, i) => i % 9 === 4).forEach((d) => { d.cc = null; d.nation = null; });

// ---------- season structure ----------
const divisions = [{ id: "d1", name: "Division I", short: "DIV I", order: 1 }, { id: "d2", name: "Division II", short: "DIV II", order: 2 }];
const teamOrder1 = shuffle(TEAMS), teamOrder2 = shuffle(TEAMS);
const drivers = [];
const d1Pool = pool.slice(0, 22), d2Pool = pool.slice(22, 36), rest = pool.slice(36);
d1Pool.forEach((d, i) => drivers.push({ ...d, division: "d1", team: teamOrder1[Math.floor(i / 2)].id, role: "driver", principal: false, contract: null }));
d2Pool.forEach((d, i) => drivers.push({ ...d, division: "d2", team: teamOrder2[Math.floor(i / 2)].id, role: "driver", principal: false, contract: null }));
rest.forEach((d, i) => { if (i % 3 === 0) d.skill += 0.12; drivers.push({ ...d, division: null, team: null, role: i % 3 === 0 ? "reserve" : "driver", principal: false, contract: null, unsigned: true }); });
// team principals: one per team, prefer a Div I driver of that team, otherwise a free agent
const principals = {};
TEAMS.forEach((t, i) => {
  const cand = drivers.find((d) => d.team === t.id && d.division === "d1" && rand() < 0.75) || drivers.find((d) => d.team === t.id) || rest[i];
  const dr = drivers.find((d) => d.id === cand.id); dr.principal = true; principals[t.id] = dr.id;
});
// contracts from showcase order (assigned after showcase result below)

// ---------- rounds ----------
const start = new Date("2026-08-02T20:30:00-04:00"); // showcase Sunday
const rounds = TRACKS.map((t, i) => {
  const date = new Date(start.getTime() + i * 7 * 86400000);
  const iso = date.toISOString().replace(/\.\d{3}Z$/, "Z");
  // store in ET offset for readability
  const et = new Date(date.getTime() - 4 * 3600000).toISOString().replace(/\.\d{3}Z$/, "-04:00");
  return { id: t.preseason ? "pre" : `r${i}`, round: t.preseason ? 0 : i, preseason: !!t.preseason, name: t.name, circuit: t.circuit, location: t.location, cc: t.cc, laps: t.laps, fullLaps: t.fullLaps, format: i === 7 ? "100%" : "50%", date: et, coords: t.coords, published: false, base: t.base };
});
const COMPLETED = 5; // showcase + R1..R4
rounds.forEach((r, i) => { if (i < COMPLETED) r.published = true; });

// ---------- results ----------
const results = [], penalties = [], transactions = [];
let penId = 0;
function raceFor(round, divId) {
  const full = drivers.filter((d) => d.division === divId && d.role === "driver" && !d.unsigned);
  const reservesPool = drivers.filter((d) => d.unsigned && d.role === "reserve");
  let field = full.map((d) => ({ d, team: d.team, reserve: false }));
  // 1–2 absences covered by reserves
  const absences = rand() < 0.6 ? 1 + Math.floor(rand() * 2) : 0;
  for (let i = 0; i < absences; i++) {
    const idx = Math.floor(rand() * field.length); const res = pick(reservesPool);
    if (!field.some((f) => f.d.id === res.id)) { field[idx] = { d: res, team: field[idx].team, reserve: true }; transactions.push({ team: field[idx].team, type: "reserve", amount: 2, driver: res.id, round: round.id, note: "One-race reserve contract" }); }
  }
  if (round.preseason) { // showcase: everyone unsigned races too (free agents), no reserves
    field = drivers.filter((d) => d.division === divId || (divId === "d1" && d.unsigned && !d.role.includes("x"))).slice(0, 26).map((d) => ({ d, team: d.unsigned ? null : d.team, reserve: false }));
  }
  const q = field.map((e) => ({ e, s: e.d.skill + gauss() * 0.06 })).sort((a, b) => b.s - a.s);
  const poleT = round.base + 1.6 + rand() * 0.5;
  const quali = {}; q.forEach((x, i) => { quali[x.e.d.id] = { grid: i + 1, time: fmtLap(poleT + i * (0.1 + rand() * 0.2)) }; });
  const r = field.map((e) => { const grid = quali[e.d.id].grid; const roll = rand(); const status = roll < 0.09 ? "DNF" : roll < 0.095 ? "DSQ" : "Finished"; return { e, grid, s: e.d.skill * 0.68 + (1 - (grid - 1) / field.length) * 0.32 + gauss() * 0.1, status, lapsDone: status === "Finished" ? round.laps : Math.max(1, Math.floor(rand() * (round.laps - 1))) }; });
  const fin = r.filter((x) => x.status === "Finished").sort((a, b) => b.s - a.s);
  const out = r.filter((x) => x.status !== "Finished").sort((a, b) => b.lapsDone - a.lapsDone);
  const avgLap = round.base + 2.7, winT = round.laps * avgLap + rand() * 30;
  let cum = 0;
  const race = [];
  fin.forEach((x, i) => {
    if (i) cum += 0.3 + Math.pow(rand(), 0.7) * (i < 6 ? 4 : 8);
    const lapped = Math.floor(cum / avgLap);
    const tl = rand() < 0.4 ? pick([3, 3, 6, 9, 12]) : 0;
    race.push({ position: i + 1, driver: x.e.d.id, team: x.e.team, grid: x.grid, quali: quali[x.e.d.id].time, time: i === 0 ? fmtRace(winT) : lapped ? `+${lapped} lap${lapped > 1 ? "s" : ""}` : `+${cum.toFixed(3)}`, gapSeconds: i === 0 ? 0 : cum, status: "Finished", laps: round.laps - lapped, trackLimits: tl, penalties: [], fastestLap: false, reserve: x.e.reserve });
  });
  out.forEach((x, i) => race.push({ position: fin.length + i + 1, driver: x.e.d.id, team: x.e.team, grid: x.grid, quali: rand() < 0.85 ? quali[x.e.d.id].time : null, time: null, gapSeconds: null, status: x.status, laps: x.lapsDone, trackLimits: rand() < 0.3 ? 6 : 0, penalties: [], fastestLap: false, reserve: x.e.reserve }));
  const flPool = race.filter((x) => x.status === "Finished").slice(0, 8);
  const fl = flPool[Math.min(flPool.length - 1, Math.floor(Math.pow(rand(), 1.6) * flPool.length))];
  if (fl) { fl.fastestLap = true; fl.fastestLapTime = fmtLap(round.base + 2.0 + rand() * 0.8); }
  // stewards' penalties
  const n = round.preseason ? 0 : Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const inc = pick(INCIDENTS); const row = pick(race); const other = pick(race.filter((x) => x.driver !== row.driver));
    row.penalties.push({ seconds: inc[2], reason: inc[0] });
    penalties.push({ id: `p${++penId}`, round: round.id, division: divId, driver: row.driver, against: other ? other.driver : null, lap: 1 + Math.floor(rand() * round.laps), incident: inc[0], decision: `${inc[2]}s time penalty`, licencePoints: inc[1], status: "Decided" });
  }
  const dotdPool = race.filter((x) => x.status === "Finished").slice(0, 10);
  return { round: round.id, division: divId, published: true, race, dotd: pick(dotdPool).driver, stream: null };
}
rounds.filter((r) => r.published).forEach((r) => { divisions.forEach((dv) => { if (r.preseason && dv.id === "d2") return; results.push(raceFor(r, dv.id)); }); });

// contracts: showcase order sets contract positions; reserves/free agents have none
const showcase = results.find((x) => x.round === "pre");
const showOrder = showcase.race.map((x) => x.driver);
const salary = (p) => window_cfg_salary(p);
function window_cfg_salary(p) { const t = [30, 27, 25, 23, 21, 19, 18, 17, 16, 15, 14, 13.5, 12, 11.5, 10, 9.5, 8, 7.5, 6, 5.5, 4, 3]; return t[Math.min(t.length, Math.max(1, p)) - 1]; }
// contract position = showcase finishing order among the division's own drivers (Div II is ranked on pace), so performance adjustments stay realistic
divisions.forEach((dv) => {
  const members = drivers.filter((d) => d.division === dv.id && d.role === "driver" && !d.unsigned);
  const ranked = members.slice().sort((a, b) => { const ia = showOrder.indexOf(a.id), ib = showOrder.indexOf(b.id); if (ia >= 0 && ib >= 0) return ia - ib; if (ia >= 0) return -1; if (ib >= 0) return 1; return b.skill - a.skill; });
  const offset = dv.id === "d1" ? 0 : 12; // lower divisions sign cheaper contracts
  ranked.forEach((d, i) => { const pos = Math.min(22, offset + i + 1 + (rand() < 0.35 ? Math.floor(rand() * 3) - 1 : 0)); d.contract = { position: Math.max(1, pos), salary: salary(Math.max(1, pos)), type: "full-time" }; });
});
drivers.forEach((d) => { if (d.unsigned || d.role !== "driver") d.contract = null; });
// a couple of waivers for realism
[teamOrder1[3].id, teamOrder2[6].id].forEach((teamId, i) => transactions.push({ team: teamId, type: "waiver", amount: 2, driver: rest[i].id, round: "r2", note: "Driver waived" }));

const season = {
  id: "s1", name: "Season 1", year: 2026, game: "F1 25", current: true, pointsSystem: "trl",
  description: "Two divisions, ten rounds, one preseason showcase.",
  divisions, teams: TEAMS.map((t) => ({ ...t, principal: principals[t.id], logo: null, watermark: null })),
  drivers: drivers.map((d) => { const { skill, ...rest2 } = d; return { ...rest2, unsigned: !!d.unsigned, licenceNote: "" }; }),
  rounds: rounds.map((r) => { const { base, ...rest3 } = r; return rest3; }),
  results, penalties, transactions,
  highlights: []
};

// ---------- endurance ----------
const SERIES = [["Global Endurance Tour", "Circuit des 24 Heures du Mans", "iracing"], ["Creventic Endurance Series", "Nürburgring Grand-Prix-Strecke", "iracing"], ["Creventic Endurance Series", "Circuit de Barcelona-Catalunya", "iracing"], ["GT Endurance Series", "Suzuka International Racing Course", "iracing"], ["Production Endurance Challenge", "Charlotte Motor Speedway Roval", "iracing"], ["Nürburgring Endurance Championship", "Nürburgring Combined Gesamtstrecke", "iracing"], ["IMSA Endurance Series", "Daytona International Speedway", "iracing"], ["LMU Endurance Cup", "Circuit de la Sarthe", "lmu"], ["LMU Endurance Cup", "Autodromo Nazionale Monza", "lmu"], ["Portimão 1000km", "Algarve International Circuit", "lmu"]];
const LENS = [["24H", 24], ["12H", 12], ["24H", 24], ["3H", 3], ["2H", 2], ["4H", 4], ["6H", 6], ["6H", 6], ["1000KM", 6], ["1000KM", 6]];
const eStart = new Date("2026-08-29T12:00:00Z");
const events = SERIES.map(([series, track, platform], i) => {
  const date = new Date(eStart.getTime() + i * 6 * 86400000 + (i % 3) * 3600000 * 5);
  const interested = shuffle(rest).slice(0, Math.floor(rand() * 4)).map((d) => d.name);
  return { id: `e${i + 1}`, series, track, platform, length: LENS[i][0], hours: LENS[i][1], type: LENS[i][1] >= 3 ? "team" : "solo", date: date.toISOString().replace(/\.\d{3}Z$/, "Z"), headline: LENS[i][1] >= 6, cars: [], interested, notes: "" };
});
const eDrivers = shuffle(pool).slice(0, 9).map((d, i) => ({ name: d.name, platforms: i % 3 === 0 ? ["iracing", "lmu"] : i % 3 === 1 ? ["iracing"] : ["lmu"], classes: pick(["All", "GT3", "LMP2", "GTP", "GT4"]), timezone: d.tz, discord: d.discord.handle }));
const endurance = { events, drivers: eDrivers, liveries: [] };

// ---------- write ----------
const outDir = path.join(__dirname, "..", "data");
fs.mkdirSync(path.join(outDir, "seasons"), { recursive: true });
fs.writeFileSync(path.join(outDir, "seasons", "2026.js"), `/* Sample data generated by tools/generate-sample-data.js — replace with your real season. */\nwindow.TRL_DATA = window.TRL_DATA || {};\nwindow.TRL_DATA.seasons = window.TRL_DATA.seasons || [];\nwindow.TRL_DATA.seasons.push(${JSON.stringify(season, null, 2)});\n`);
fs.writeFileSync(path.join(outDir, "endurance.js"), `/* Sample endurance data generated by tools/generate-sample-data.js — replace with your real events. */\nwindow.TRL_DATA = window.TRL_DATA || {};\nwindow.TRL_DATA.endurance = ${JSON.stringify(endurance, null, 2)};\n`);
console.log(`season: ${season.drivers.length} drivers (${season.drivers.filter((d) => d.unsigned).length} free agents), ${season.rounds.length} rounds, ${season.results.length} result sheets, ${season.penalties.length} penalties, ${season.transactions.length} transactions`);
console.log(`endurance: ${events.length} events, ${eDrivers.length} drivers`);
