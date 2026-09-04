/* Driver profile */
TRL.page("driver", function () {
  const { $, esc, link, img } = TRL;
  const E = TRL.E();
  const id = TRL.qs("id");
  let s = TRL.season();
  let d = s && id ? E.driver(s, id) : null;
  if (!d && id) { const any = E.driverAnySeason(id); if (any) { s = any.season; d = any.driver; } }
  if (!d) { $("#main").innerHTML = '<div class="container section"><div class="empty">Driver not found. <a href="drivers.html">Back to the drivers list</a>.</div></div>'; return; }
  TRL.setTitle(d.name);
  $("#back").href = link("drivers.html", { tier: d.tier });
  const team = E.team(s, d.team), tier = E.tier(s, d.tier);
  const color = team ? team.color : "#6b7290";
  const entries = E.driverSeason(s, id);
  const main = entries.find((x) => x.tier.id === d.tier) || entries[0] || null;
  const e = main ? main.entry : null;
  const ps = E.pointsSystem(s);

  // ----- header -----
  const socials = Object.entries(d.socials || {}).map(([k, v]) => `<a class="btn btn--ghost btn--sm" href="${esc(v)}" target="_blank" rel="noopener">${TRL.icon(k)} ${esc(k)}</a>`).join(" ");
  const tile = (label, v, accent) => `<div class="stat-tile ${accent ? "stat-tile--accent" : ""}"><b>${esc(v)}</b><span>${label}</span></div>`;
  $("#profile").innerHTML = `
    <div><div class="profile__photo placeholder">${img(d.photo, "Driver photo", { w: 600, h: 600, accent: color, alt: d.name })}</div></div>
    <div>
      <div class="profile__number" style="-webkit-text-stroke-color:${esc(color)}">${esc(d.number)}</div>
      <h1 class="profile__name">${TRL.flag(d.nationality)} ${esc(d.name)}</h1>
      <div class="row mb-2">${TRL.tierPill(tier)}${team ? `<a class="badge" href="${esc(link("team.html", { id: team.id, tier: d.tier }))}">${TRL.teamDot(s, team.id)}${esc(team.name)}</a>` : '<span class="badge">Reserve driver</span>'}<span class="badge">${esc(d.tag || "")}</span><span class="badge">${esc(d.platform || "")}</span><span class="badge">${esc(d.input || "")}</span><span class="badge">Since ${esc(d.joined || s.year)}</span></div>
      <p class="lead">${esc(d.bio || "")}</p>
      ${socials ? `<div class="row mb-3">${socials}</div>` : ""}
      <div class="stat-tiles">${e ? [tile("Championship", `P${e.position}`, true), tile("Points", e.points), tile("Wins", e.wins), tile("Podiums", e.podiums), tile("Poles", e.poles), tile("Fastest laps", e.fastestLaps), tile("Best finish", e.bestFinish == null ? "—" : `P${e.bestFinish}`), tile("Avg finish", e.avgFinish == null ? "—" : e.avgFinish.toFixed(1)), tile("DNFs", e.dnfs)].join("") : '<div class="empty">No results this season yet.</div>'}</div>
    </div>`;
  $("#season-label").textContent = `${s.name} · ${main ? main.tier.name : ""}`;

  // ----- season results + chart -----
  if (e && main) {
    const rounds = main.standings.rounds;
    const fieldSize = Math.max(20, ...main.standings.drivers.map((x) => x.starts ? 20 : 0));
    $("#chart").innerHTML = chart(rounds, e.results, fieldSize);
    $("#results").innerHTML = `<table class="table table--compact"><thead><tr><th>Rd</th><th>Grand Prix</th><th class="c">Grid</th><th class="c">Finish</th><th class="c">Sprint</th><th class="c">FL</th><th class="pts">Pts</th></tr></thead><tbody>${rounds.map((r) => { const res = e.results[r.id]; if (!res) return `<tr><td>${r.round}</td><td>${esc(r.name)}</td><td class="c text-dim" colspan="4">Did not take part</td><td class="pts text-dim">0</td></tr>`; return `<tr><td>${r.round}</td><td><a href="${esc(link("results.html", { tier: main.tier.id, round: r.id }))}">${TRL.flag(r.country)} ${esc(r.name)}</a></td><td class="c">${res.grid || "—"}${res.pole ? ' <span class="badge badge--blue" style="padding:1px 5px">P</span>' : ""}</td><td class="c">${TRL.posBadge(res.position, res.status)}</td><td class="c">${res.sprintPosition ? `P${res.sprintPosition} (${res.sprintPoints})` : "—"}</td><td class="c">${res.fastestLap ? '<span class="fl-dot" style="margin:0">FL</span>' : ""}</td><td class="pts">${res.points}</td></tr>`; }).join("")}</tbody></table>`;
  } else {
    $("#chart").innerHTML = ""; $("#results").innerHTML = '<div class="empty">No results yet.</div>';
  }
  function chart(rounds, results, fieldSize) {
    if (!rounds.length) return "";
    const w = 720, h = 240, padL = 34, padR = 18, padT = 14, padB = 30;
    const n = rounds.length;
    const xs = (i) => padL + (n > 1 ? (i * (w - padL - padR)) / (n - 1) : (w - padL - padR) / 2);
    const ys = (p) => padT + ((p - 1) * (h - padT - padB)) / (fieldSize - 1);
    const gridLines = [1, 5, 10, 15, fieldSize].map((p) => `<line class="grid-line" x1="${padL}" x2="${w - padR}" y1="${ys(p)}" y2="${ys(p)}"/><text class="axis-label" x="${padL - 6}" y="${ys(p) + 4}" text-anchor="end">P${p}</text>`).join("");
    const pts = rounds.map((r, i) => { const res = results[r.id]; if (!res || res.position == null) return null; const finished = res.status === "Finished"; return { x: xs(i), y: ys(finished ? Math.min(res.position, fieldSize) : fieldSize), finished, label: `R${r.round} ${r.name}: ${finished ? "P" + res.position : res.status}`, r }; });
    const linePts = pts.filter((p) => p && p.finished);
    const path = linePts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const dots = pts.map((p) => p ? `<circle class="dot ${p.finished ? "" : "dot--dnf"}" cx="${p.x}" cy="${p.y}" r="5"><title>${esc(p.label)}</title></circle>` : "").join("");
    const labels = rounds.map((r, i) => `<text class="axis-label" x="${xs(i)}" y="${h - 8}" text-anchor="middle">R${r.round}</text>`).join("");
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Finishing positions by round">${gridLines}<path class="line" d="${path}"/>${dots}${labels}</svg><div class="legend"><span><i class="timeline-dot" style="background:var(--accent)"></i> Finish position</span><span><i class="timeline-dot" style="background:var(--dim)"></i> DNF / DSQ</span></div>`;
  }

  // ----- teammate head-to-head -----
  const mate = team ? (s.drivers || []).find((x) => x.team === d.team && x.tier === d.tier && x.id !== d.id && x.role !== "reserve") : null;
  if (mate) {
    let qA = 0, qB = 0, rA = 0, rB = 0;
    E.tierSheets(s, d.tier).forEach((sh) => {
      const qa = (sh.qualifying || []).find((x) => x.driver === d.id), qb = (sh.qualifying || []).find((x) => x.driver === mate.id);
      if (qa && qb) { if (qa.position < qb.position) qA++; else qB++; }
      const ra = (sh.race || []).find((x) => x.driver === d.id), rb = (sh.race || []).find((x) => x.driver === mate.id);
      if (ra && rb && ra.status === "Finished" && rb.status === "Finished") { if (ra.position < rb.position) rA++; else rB++; }
    });
    const bar = (a, b) => { const tot = a + b || 1; return `<div class="row" style="gap:8px;margin:6px 0 12px"><b class="mono" style="min-width:20px;text-align:right">${a}</b><div class="licence" style="flex:1;background:var(--surface-3)"><i style="width:${(a / tot) * 100}%;background:${esc(color)}"></i></div><b class="mono" style="min-width:20px">${b}</b></div>`; };
    $("#h2h").innerHTML = `<div class="card__title">Teammate head-to-head</div><div class="row row--between text-muted" style="font-size:.9rem"><span>${esc(d.name)}</span><span>${TRL.driverName(s, mate.id, { flag: false })}</span></div><div class="mt-2"><span class="kicker">Qualifying</span>${bar(qA, qB)}<span class="kicker">Race</span>${bar(rA, rB)}</div>`;
  } else {
    $("#h2h").innerHTML = '<div class="card__title">Teammate head-to-head</div><p class="text-muted">No full-time teammate this season.</p>';
  }

  // ----- licence points + penalties -----
  const pp = TRL.cfg().penaltyPoints || { raceBanAt: 12, warningAt: 8 };
  const pts = E.penaltyPoints(s, id);
  const pens = E.penalties(s, { driver: id });
  $("#licence").innerHTML = `<div class="card__title">Licence points <span class="badge ${pts >= pp.raceBanAt ? "badge--accent" : pts >= pp.warningAt ? "badge--yellow" : "badge--green"}">${pts} / ${pp.raceBanAt}</span></div><div class="licence"><i style="width:${Math.min(100, (pts / pp.raceBanAt) * 100)}%"></i></div><p class="text-muted mt-2" style="font-size:.85rem">${pts >= pp.raceBanAt ? "Race ban threshold reached." : pts >= pp.warningAt ? "Formal warning threshold reached." : "Clean licence."} Points expire ${pp.expiryRounds || 12} rounds after they are issued.</p>`;
  $("#penalties").innerHTML = `<div class="card__title">Stewards' decisions <a href="${esc(link("penalties.html", { tier: d.tier, driver: id }))}">Full log</a></div>${pens.length ? pens.slice(0, 6).map((p) => { const r = E.round(s, p.round); const against = p.against === id; return `<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:.92rem"><div class="row row--between"><b>${r ? "R" + r.round + " " + esc(r.name) : ""}</b><span class="badge ${against ? "badge--blue" : p.points ? "badge--accent" : ""}">${against ? "Involved" : p.points ? "+" + p.points + " pts" : "No points"}</span></div><div class="text-muted">${esc(p.incident)} · ${esc(p.decision)}${against ? ` (penalty for ${TRL.driverName(s, p.driver, { flag: false })})` : ""}</div></div>`; }).join("") : '<p class="text-muted">No stewards\' decisions involving this driver.</p>'}`;

  // ----- career -----
  const c = E.career(id);
  $("#career-tiles").innerHTML = [tile("Seasons", c.totals.seasons), tile("Starts", c.totals.starts), tile("Wins", c.totals.wins), tile("Podiums", c.totals.podiums), tile("Poles", c.totals.poles), tile("Fastest laps", c.totals.fastestLaps), tile("Points", c.totals.points), tile("Titles", c.totals.titles, c.totals.titles > 0)].join("");
  $("#career").innerHTML = `<table class="table table--compact"><thead><tr><th>Season</th><th>Tier</th><th>Team</th><th class="c">Pos</th><th class="c">Starts</th><th class="c">Wins</th><th class="c">Podiums</th><th class="pts">Pts</th></tr></thead><tbody>${c.entries.map((x) => `<tr><td><a href="${esc("driver.html?id=" + encodeURIComponent(id) + (x.season.current ? "" : "&season=" + encodeURIComponent(x.season.id)))}">${esc(x.season.name)} · ${esc(x.season.year)}</a>${x.season.current ? ' <span class="badge badge--green">Current</span>' : ""}</td><td>${TRL.tierPill(x.tier)}</td><td>${x.team ? TRL.teamDot(s, x.team.id) + esc(x.team.name) : "—"}</td><td class="c">${TRL.posBadge(x.position)} <span class="text-dim">/ ${x.of}</span></td><td class="c">${x.entry.starts}</td><td class="c">${x.entry.wins}</td><td class="c">${x.entry.podiums}</td><td class="pts">${x.entry.points}</td></tr>`).join("")}</tbody></table>`;
});
