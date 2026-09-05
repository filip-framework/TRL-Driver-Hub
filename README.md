# TRL Driver Hub

A complete website for a sim-racing club with a flagship F1 league and an endurance programme, built as a static site (plain HTML, CSS and JavaScript, no build step). Everything is driven by editable data files, and every table, cap figure and calendar row is computed in the browser.

## Quick start

```bash
python3 -m http.server 8080      # or: npx serve .
```

Open <http://localhost:8080>. Deploy anywhere static files are served (GitHub Pages, Netlify, Vercel, any web host).

## Deploying to GitHub Pages

`.github/workflows/pages.yml` publishes the site with GitHub Actions on every push to `main` (and the development branch). The first run enables Pages automatically. If the deploy step reports that the branch is not allowed to deploy to the `github-pages` environment, either merge to `main` or add the branch under **Settings → Environments → github-pages → Deployment branches**. If Pages is not enabled at all, set **Settings → Pages → Source** to **GitHub Actions** and re-run the workflow. The site is then served at `https://<owner>.github.io/<repo>/`.

## Site map

| Section | Pages |
| --- | --- |
| Hub | `index.html` (hero, season strip, F1 spotlight with next round and forecast, endurance ventures, driver entry), `faq.html`, `login.html`, `team-principal.html`, `404.html` |
| F1 | `f1/index.html` (next race, title fight, driver directory preview, constructors), `f1/standings.html`, `f1/drivers.html`, `f1/driver.html?id=…`, `f1/schedule.html`, `f1/results.html?round=…&div=…`, `f1/analysis.html?round=…&div=…`, `f1/teams.html?c=…`, `f1/rulebook.html`, `f1/signup.html` |
| Endurance | `endurance/index.html`, `endurance/races.html`, `endurance/race.html?id=…` (race desk: garage, fuel calculator, stint planner, prep checklist), `endurance/drivers.html`, `endurance/liveries.html`, `endurance/signup.html` |

## Features

- **Championships by division** with a configurable points system and bonus points (pole, fastest lap, driver of the day, most positions gained). Reserves score drivers' points only.
- **Teams & contracts**: team principals, headquarters, roster with contract position and salary, one-race reserves, waivers, performance adjustments, the end-of-season projected cap with a visual cap bar and over-cap zone.
- **Driver profiles**: division badge, team and nation, EA/Discord/social handles, avatar with team-coloured ring, season stats, licence status with thresholds, race history, highlights.
- **Calendar**: preseason showcase and championship groups, published rounds link to the classification, next round shows a live weather forecast (Open-Meteo, no key needed), lights-out shown in the visitor's timezone, `.ics` export.
- **Results**: podium cards, official classification with grid deltas, qualifying with pole highlight, track-limits and stewards' penalty chips, bonus chips, driver of the day, retired rows, mobile card layout, and a race analysis page (positions gained, gap to winner, qualifying gap, penalty time).
- **Sign-in with Discord** (OAuth2 implicit grant, browser only): user menu with FAQ, Team Principal office and sign-out; role detection when a guild id is configured.
- **Team Principal office**: seats per division, cap panel, signing / reserve / waiver requests sent to Race Control via webhook.
- **Endurance**: headline race, filterable calendar, "I'm interested" per race, race desk tools, driver list, liveries, sign-up.
- **Forms** post to Discord webhooks or any JSON endpoint, with an email fallback.
- Dev banner, PWA manifest, responsive layout down to phone widths, placeholder marks wherever artwork would go.

## Project structure

```
assets/css/styles.css           theme (edit :root to re-brand)
assets/js/engine.js             standings, bonus points, cap maths, licences, analysis, endurance helpers
assets/js/app.js                chrome (header/footer per section), Discord sign-in, forecast, shared renderers
assets/js/pages/*.js            one script per page
assets/img/logo.svg             brand mark placeholder (also used as the hero watermark and favicon)
data/config.js                  brand, dev banner, Discord, ventures, forms, points, cap and licence rules
data/seasons/2026.js            F1 season: divisions, teams, drivers, rounds, results, penalties, transactions
data/endurance.js               endurance events, driver list, liveries
tools/generate-sample-data.js   deterministic sample-data generator (optional)
tools/mkpage.sh                 page scaffolding helper
```

## Editing your league

### Brand, Discord and rules — `data/config.js`

- `brand`: name, wordmark lines, tagline, hero lines, version shown in the footer.
- `devBanner`: the strip at the top of every page.
- `discord.invite`: used by every Discord button. `discord.clientId` (plus `redirect` = your `login.html` URL added in the Discord developer portal) enables **Sign in with Discord**; add `guildId` and `roleIds` to detect Team Principal / Race Control roles.
- `f1` and `endurance`: section copy, race night, platforms.
- `forms`: Discord webhooks (or JSON endpoints) for F1 sign-up, endurance sign-up, interest marks and Team Principal requests; `email` is the fallback.
- `pointsSystems`, `cap` (limit, seats, fees, salary table, performance adjustment, over-cap brackets) and `licence` thresholds.

### Season data — `data/seasons/2026.js`

```js
divisions: [{ id: "d1", name: "Division I", short: "DIV I", order: 1 }]
teams:     [{ id: "mclaren", name: "McLaren", short: "MCL", color: "#ff8a00", hq: { city, country, cc }, principal: "<driver id>", logo: null, watermark: null }]
drivers:   [{ id, name, number, cc: "gb-eng", nation: "England", division: "d1" | null, team: "mclaren" | null, role: "driver" | "reserve",
              principal: false, unsigned: false, contract: { position: 5, salary: 21, type: "full-time" } | null,
              ea: "…", discord: { id, handle, avatar }, socials: { twitch, youtube, tiktok }, bio: "", photo: null, highlights: [] }]
rounds:    [{ id: "r1", round: 1, preseason: false, name, circuit, location, cc, laps, format: "50%", date: "2026-08-09T20:30:00-04:00", coords: [lat, lon], published: true }]
results:   [{ round: "r1", division: "d1", published: true, dotd: "<driver id>",
              race: [{ position, driver, team, grid, quali: "1:27.816", time: "47:25.499" | "+5.275" | "+1 lap" | null, gapSeconds,
                       status: "Finished" | "DNF" | "DSQ", laps, trackLimits: 3, penalties: [{ seconds, reason }], fastestLap, fastestLapTime, reserve }] }]
penalties: [{ id, round, division, driver, against, lap, incident, decision, licencePoints, status: "Decided" | "Overturned" }]
transactions: [{ team, type: "reserve" | "waiver" | "penalty", amount, driver, round, note }]
```

Contract salaries come from the salary table by contract position. Performance adjustment = positions finished above the contract position × the configured amount (top division only by default). Cap remaining = limit − (contracts + reserves + waivers + performance + penalties).

### Endurance data — `data/endurance.js`

`events` (series, track, platform, length, hours, type, date, headline, cars, interested), `drivers` (name, platforms, classes, timezone) and `liveries` (name, number, car, class, drivers, image).

### Images

Set `logo`/`watermark` on teams, `photo` or `discord.avatar` on drivers, `image` on liveries, and replace `assets/img/logo.svg` with your mark. Flags load from flagcdn.com by country code and fall back to emoji.

## Sample data

The included season and endurance files are generated (fictional drivers, real circuits and team names). Regenerate with `node tools/generate-sample-data.js`, or replace the files with your own following the shapes above.
