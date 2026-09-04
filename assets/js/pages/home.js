/* Home page */
TRL.page("home", function () {
  const { $, esc, link, img } = TRL;
  const E = TRL.E();
  const L = TRL.cfg().league || {};
  const s = TRL.season();
  TRL.setTitle("");
  if (!s) { $("#next-race").innerHTML = '<div class="empty">No season data found. Add a season file under data/seasons/.</div>'; return; }
  const tiers = E.tiers(s);

  // ----- hero -----
  const tag = L.tagline || "Where the grid comes to race.";
  const words = tag.split(" ");
  const cut = Math.max(1, words.length - 3);
  $("#hero-title").innerHTML = `${esc(words.slice(0, cut).join(" "))} <em>${esc(words.slice(cut).join(" "))}</em>`;
  $("#hero-kicker").textContent = [s.name, s.game || L.game, (L.platforms || []).join(" / ")].filter(Boolean).join(" · ");
  $("#hero-desc").textContent = L.description || "";
  const fullTime = (s.drivers || []).filter((d) => d.role !== "reserve").length;
  $("#hero-stats").innerHTML = [[fullTime, "Drivers"], [tiers.length, "Tiers"], [(s.rounds || []).length, "Rounds"], [E.seasons().length, "Seasons"]]
    .map(([n, l]) => `<div class="hero__stat"><b>${n}</b><span>${l}</span></div>`).join("");
  $("#hero-art").innerHTML = `<div class="placeholder" style="aspect-ratio:4/3;border-radius:var(--radius);box-shadow:var(--shadow)">${img(null, "Hero artwork placeholder", { w: 800, h: 600, accent: "#e8002d", alt: "Hero artwork" })}</div>`;

  // ----- next race + countdown -----
  const next = E.nextSession(s);
  const nr = $("#next-race");
  if (next) {
    const r = next.round;
    nr.innerHTML = `
      <div>
        <div class="kicker">${next.live ? "Live now" : "Next race"}</div>
        <h3 style="font-size:2rem;margin:6px 0 6px">${TRL.flag(r.country)} ${esc(r.name)}</h3>
        <div class="race-meta">
          <span>${TRL.tierPill(next.tier)}</span>
          <span>Round <b>${r.round}</b> of ${s.rounds.length}</span>
          <span><b>${esc(r.circuit)}</b></span>
          <span>${r.laps} laps · ${esc(r.format || "")}</span>
          ${r.sprint ? '<span class="badge badge--purple">Sprint weekend</span>' : ""}
        </div>
        <div class="race-meta mt-2"><span><b>${esc(TRL.fmtDateTime(next.date))}</b></span><span class="text-dim">${esc(TRL.tz())}</span></div>
        <div class="row mt-3">
          <a class="btn btn--ghost btn--sm" href="${esc(link("calendar.html", { tier: next.tier.id }))}">${TRL.icon("calendar")} Calendar</a>
          <a class="btn btn--primary btn--sm" href="#watch">${next.live ? "Watch live" : "Where to watch"}</a>
        </div>
      </div>
      <div>
        <div class="countdown">${TRL.countdownMarkup()}</div>
        <p class="text-dim text-center mt-1" style="font-size:.8rem;letter-spacing:.12em;text-transform:uppercase">${next.live ? "Session in progress" : "Until lights out"}</p>
      </div>`;
    TRL.countdown(next.date, nr);
  } else {
    nr.innerHTML = `<div><div class="kicker">Season complete</div><h3 style="font-size:1.8rem;margin:6px 0">Every round of ${esc(s.name)} is in the books.</h3><p class="text-muted">Final standings are live. The next season will be announced on Discord.</p></div><div class="row"><a class="btn btn--primary" href="${esc(link("standings.html"))}">Final standings</a></div>`;
  }

  // ----- latest results per tier -----
  const podium = (rows) => `<div class="podium">${rows.map((row) => `<div class="podium__step">${TRL.posBadge(row.position)}<div class="podium__name">${TRL.driverName(s, row.driver, { flag: false })}</div><div class="podium__team">${esc((E.team(s, row.team) || {}).name || "")}</div></div>`).join("")}</div>`;
  $("#latest-results").innerHTML = tiers.map((t) => {
    const lc = E.lastCompleted(s, t.id);
    if (!lc) return `<div class="card"><div class="card__title">${TRL.tierPill(t)} ${esc(t.name)}</div><p class="text-muted">No results posted yet.</p></div>`;
    const top3 = (lc.sheet.race || []).slice(0, 3);
    return `<div class="card"><div class="card__title"><span>${TRL.tierPill(t)} Round ${lc.round.round}</span><a href="${esc(link("results.html", { tier: t.id, round: lc.round.id }))}">Full result</a></div><div class="text-muted mb-2" style="font-size:.9rem">${TRL.flag(lc.round.country)} ${esc(lc.round.name)}</div>${podium(top3)}</div>`;
  }).join("");

  // ----- standings snapshot -----
  TRL.tierTabs($("#home-tiers"), s, (tid) => {
    const st = E.computeStandings(s, tid);
    const table = (title, href, head, rows) => `<div class="card card--flush mini-table"><div style="padding:18px 20px 0"><div class="card__title">${title}<a href="${esc(href)}">Full table</a></div></div><div class="table-wrap" style="border:0;border-radius:0"><table class="table table--compact"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
    $("#home-standings").innerHTML =
      table("Drivers", link("standings.html", { tier: tid }), "<th>Pos</th><th>Driver</th><th>Team</th><th class=\"pts\">Pts</th>",
        st.drivers.slice(0, 6).map((d) => `<tr><td>${TRL.posBadge(d.position)}</td><td>${TRL.driverName(s, d.driverId)}</td><td>${TRL.teamName(s, d.teamId, { short: true })}</td><td class="pts">${d.points}</td></tr>`).join("")) +
      table("Constructors", link("standings.html", { tier: tid }), "<th>Pos</th><th>Team</th><th class=\"c\">Wins</th><th class=\"pts\">Pts</th>",
        st.teams.slice(0, 6).map((t) => `<tr><td>${TRL.posBadge(t.position)}</td><td>${TRL.teamName(s, t.teamId)}</td><td class="c">${t.wins}</td><td class="pts">${t.points}</td></tr>`).join(""));
    $("#full-standings").href = link("standings.html", { tier: tid });
  });

  // ----- upcoming rounds -----
  const upcoming = E.rounds(s).filter((r) => E.roundStatus(s, r) !== "completed").slice(0, 3);
  const nextId = next ? next.round.id : null;
  $("#upcoming").innerHTML = upcoming.length ? upcoming.map((r) => `
    <div class="round ${r.id === nextId ? "round--next" : ""}">
      <div class="round__no">Round<b>${r.round}</b></div>
      <div>
        <div class="round__title">${TRL.flag(r.country)} ${esc(r.name)}</div>
        <div class="round__meta"><span>${esc(r.circuit)}</span><span>${r.laps} laps · ${esc(r.format || "")}</span>${r.sprint ? '<span class="badge badge--purple">Sprint</span>' : ""}</div>
        <div class="round__sessions">${tiers.map((t) => { const d = E.sessionDate(s, r, t.id); const st = E.roundStatus(s, r, t.id); return `<span>${TRL.tierPill(t)} <b>${st === "completed" ? "Completed" : esc(TRL.fmtDate(d, { weekday: "short", day: "numeric", month: "short" }) + " " + TRL.fmtTime(d))}</b></span>`; }).join("")}</div>
      </div>
      <div class="round__actions">${TRL.statusBadge(r.id === nextId ? "next" : "upcoming")}</div>
    </div>`).join("") : '<div class="empty">No more rounds this season.</div>';

  // ----- stream -----
  const stream = $("#stream");
  const ch = L.twitchChannel;
  const configured = ch && !/your-channel|example/i.test(ch);
  if (configured && location.hostname && location.protocol.startsWith("http")) {
    stream.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${encodeURIComponent(ch)}&parent=${encodeURIComponent(location.hostname)}&muted=true" allowfullscreen title="Live stream"></iframe>`;
  } else {
    stream.innerHTML = `<a class="placeholder" style="width:100%;height:100%;padding:24px" href="${esc((L.socials || {}).twitch || "#")}" target="_blank" rel="noopener">Stream embed placeholder<br><small style="letter-spacing:0;text-transform:none">Set twitchChannel in data/config.js and host the site on a domain</small></a>`;
  }
  $("#watch-info").innerHTML = `
    <h3>Race nights</h3>
    <div class="stack" style="--gap:8px">${tiers.map((t) => `<div class="row row--between" style="padding:10px 0;border-bottom:1px solid var(--border)"><span>${TRL.tierPill(t)} <b>${esc(t.name)}</b></span><span class="text-muted">${esc(t.raceDay)}s · ${esc(t.raceTime)}</span></div>`).join("")}</div>
    <p class="text-muted mt-2">Every session is streamed with live commentary. Replays are posted to YouTube within 24 hours.</p>
    ${TRL.socialsHtml()}`;

  // ----- news -----
  const news = ((window.TRL_DATA || {}).news || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);
  $("#home-news").innerHTML = news.map((n) => `
    <a class="card card--flush card--link news-card" href="news.html?id=${encodeURIComponent(n.id)}">
      <div class="news-card__img placeholder">${img(n.image, "Article image", { w: 640, h: 360, alt: n.title })}</div>
      <div class="news-card__body"><div class="news-card__meta"><span class="badge badge--accent">${esc(n.category)}</span><span>${esc(TRL.fmtDate(n.date))}</span></div><h3 class="news-card__title">${esc(n.title)}</h3><p class="text-muted" style="font-size:.92rem">${esc(n.excerpt)}</p></div>
    </a>`).join("") || '<div class="empty">No news yet.</div>';

  // ----- partners -----
  const partners = TRL.cfg().partners || [];
  $("#partners").innerHTML = partners.map((p) => `<a class="placeholder" href="${esc(p.url || "#")}" title="${esc(p.name)}">${p.logo ? img(p.logo, p.name, { alt: p.name }) : esc(p.name) + " logo"}</a>`).join("");
  if (!partners.length) $("#partners").closest("section").classList.add("hidden");
});
