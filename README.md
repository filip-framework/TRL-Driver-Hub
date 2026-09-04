# TRL Driver Hub

A complete, self-contained website for an F1 sim-racing league: championship standings, driver and team profiles, race calendar, full results, stewarding and penalty log, registration, news, gallery and league info.

It is a static site (plain HTML, CSS and JavaScript, no build step). All league data lives in editable files under `data/`, and every table, chart and countdown on the site is computed from that data in the browser.

## Quick start

```bash
# any static server works; for example:
python3 -m http.server 8080
# or
npx serve .
```

Then open <http://localhost:8080>. Opening `index.html` straight from disk also works (the live-stream embed needs a real hostname, everything else runs from `file://`).

## What's included

| Page | What it does |
| --- | --- |
| `index.html` | Hero, next-race countdown (localised to the visitor's timezone), latest podiums per tier, standings snapshot, upcoming rounds, live stream block, news, partners, sign-up call to action |
| `standings.html` | Drivers' and constructors' championships per tier, season selector, summary and round-by-round views, sortable columns, position movement, countback tie-breaks, driver highlight |
| `drivers.html` / `driver.html` | Driver grid with tier/team/role filters and search; profiles with season stats, position chart, results by round, teammate head-to-head, licence points, stewards' decisions, career history across seasons |
| `teams.html` / `team.html` | Team cards and profiles with line-ups per tier, standings and points by round |
| `calendar.html` | Full calendar with per-tier session times in local time, status badges, circuit info, `.ics` export (season or single round) |
| `results.html` | Race, qualifying and sprint classifications, grid deltas, fastest lap, penalties, points, podium, race report, stewards' decisions, previous/next navigation |
| `penalties.html` | Filterable penalty log, licence-point table with warning/ban thresholds, incident report form |
| `rules.html` | Sporting regulations with points, tiers and thresholds filled from config |
| `register.html` | Driver registration form with validation, taken-number check, Discord webhook / endpoint / email delivery |
| `news.html` | News list with category filter and article view |
| `gallery.html` | Filterable gallery with keyboard-navigable lightbox |
| `about.html` | League info, staff, partners, FAQ, contact |
| `404.html` | Not-found page |

Placeholder artwork is used everywhere an image would go (logo, hero, driver photos, liveries, track maps, gallery, news). Drop in real files and point the data at them (see below).

## Project structure

```
assets/css/styles.css      design tokens + all styling (re-brand by editing :root)
assets/js/engine.js        standings/stats engine (pure functions over the data)
assets/js/app.js           shared runtime: header/footer, helpers, forms, iCal, placeholders
assets/js/pages/*.js       one script per page
assets/img/                logo.svg, favicon.svg, track-placeholder.svg
data/config.js             league identity, socials, form endpoints, points systems, staff, partners, FAQ
data/seasons/<id>.js       one file per season: tiers, teams, drivers, rounds, results, penalties
data/news.js               articles
data/gallery.js            gallery items
tools/generate-sample-data.js  deterministic sample-season generator (optional)
tools/mkpage*.sh           page scaffolding helpers used to build the HTML files
```

## Editing your league

### 1. Identity, socials and forms — `data/config.js`

Set the league name, tagline, description, Discord invite, social links and Twitch channel. To receive registrations and incident reports without a backend, create a Discord channel webhook and paste it into `forms.registration.discordWebhook` / `forms.incident.discordWebhook`. Any JSON endpoint (Formspree, Netlify Forms, your own API) works through `formEndpoint`. With neither set, the forms fall back to a pre-filled email.

Points systems live in `pointsSystems`; each season picks one by key.

### 2. Season data — `data/seasons/<season>.js`

Each season file pushes one object onto `window.TRL_DATA.seasons`. The important shapes:

```js
tiers:   [{ id: "t1", name: "Tier 1", shortName: "T1", raceDay: "Tuesday", raceTime: "20:00 UK", color: "#e8002d", order: 1, description: "..." }]
teams:   [{ id: "mclaren", name: "McLaren", shortName: "MCL", color: "#FF8000", livery: null }]
drivers: [{ id: "alex-vance", name: "Alex Vance", tag: "AVance7", number: 7, nationality: "GB", tier: "t1", team: "mclaren", role: "driver" | "reserve", platform: "PC", input: "Wheel", joined: 2025, bio: "...", socials: { twitch: "..." }, photo: null }]
rounds:  [{ id: "r1", round: 1, name: "Bahrain Grand Prix", circuit: "...", location: "Sakhir", country: "BH", laps: 29, fullLaps: 57, length: 5.412, format: "50%", sprint: false,
            sessions: { t1: "2026-07-28T20:00:00+01:00", t2: "2026-07-29T20:00:00+01:00" }, map: null, notes: "" }]
results: [{ round: "r1", tier: "t1",
            qualifying: [{ position: 1, driver: "alex-vance", team: "mclaren", time: "1:31.204" }],
            sprint: null | [{ position: 1, driver: "...", team: "...", laps: 8, status: "Finished", time: "..." }],
            race: [{ position: 1, driver: "alex-vance", team: "mclaren", grid: 1, laps: 29, status: "Finished" | "DNF" | "DSQ", time: "44:12.301" | "+3.212" | "+1 lap", fastestLap: true, fastestLapTime: "1:33.100", penaltySeconds: 0 }],
            dotd: "alex-vance", report: "Optional race report text", stream: null }]
penalties: [{ id: "p1", round: "r1", tier: "t1", driver: "...", against: "..." | null, lap: 12, incident: "Causing a collision", decision: "5s time penalty", points: 2, status: "Decided" | "Under review" | "Overturned" }]
```

Standings, stats, movement arrows, licence points and the calendar status are all derived from these. To add a season, copy a file, change `id`/`name`/`year`, set `current: true` on the active one, and add a `<script>` tag for it in each HTML page (next to the existing season scripts).

Session times accept any ISO 8601 string with an offset; the site converts them to the visitor's timezone.

### 3. Images

Set `photo` (drivers), `livery` (teams), `map` (rounds), `image` (news/gallery), `logo` (partners) or `avatar` (staff) to a path such as `assets/img/drivers/alex-vance.jpg`. Replace `assets/img/logo.svg` and `favicon.svg` with your own logo. The hero artwork placeholder is rendered in `assets/js/pages/home.js`.

### 4. Colours and fonts

All tokens are at the top of `assets/css/styles.css` (`--accent`, `--bg`, fonts, radii). Fonts load from Google Fonts with system fallbacks.

## Sample data

The included seasons are generated sample data (fictional drivers, real circuits and team names). Regenerate with:

```bash
node tools/generate-sample-data.js
```

or delete the generated files and write your own following the shapes above.

## Deploying

The site is static, so GitHub Pages, Netlify, Vercel or any web host works. For GitHub Pages: Settings → Pages → deploy from the branch root (a `.nojekyll` file is included).
