/* Official classification */
TRL.page("results", function () {
  const { $, $$, esc, href } = TRL; const E = TRL.E(); const s = TRL.season();
  const root = $("#results");
  const divs = E.divisions(s);
  let roundId = TRL.qs("round"), divId = TRL.qs("div") || (divs[0] && divs[0].id);
  const published = E.rounds(s).filter((r) => divs.some((dv) => E.sheet(s, r.id, dv.id)));
  if (!roundId || !published.some((r) => r.id === roundId)) roundId = published.length ? published[published.length - 1].id : null;
  if (!roundId) { root.innerHTML = '<div class="state-page"><p class="kicker">Results</p><h1>Nothing published yet</h1><p class="lede" style="margin:0 auto">Results appear here once Race Control publishes a round.</p></div>'; return; }
  if (!E.sheet(s, roundId, divId)) divId = (divs.find((dv) => E.sheet(s, roundId, dv.id)) || divs[0]).id;
  TRL.setParam("round", roundId); TRL.setParam("div", divId);
  const r = E.round(s, roundId), sh = E.sheet(s, roundId, divId), dv = E.division(s, divId);
  TRL.setTitle(`${r.name} results`);
  const race = sh.race || [];
  const ps = (row) => E.rowPoints(s, sh, row);
  const idx = published.findIndex((x) => x.id === roundId); const prev = published[idx - 1], next = published[idx + 1];
  const podium = race.slice(0, 3).map((row) => { const d = E.driver(s, row.driver); const t = row.team ? E.team(s, row.team) : null; const cls = row.position === 1 ? "gold" : row.position === 2 ? "silver" : "bronze"; return `<article class="podium-card ${cls}" ${TRL.teamStyle(t)}>${t ? `<div class="podium-watermark">${TRL.ctorMark(t, "lg")}</div>` : ""}${TRL.medal(row.position)}<span class="place">${row.position === 1 ? "Winner" : "P" + row.position}</span>${TRL.avatar(d, "lg", t)}<div class="who">${TRL.ctorMark(t, "sm")}<a href="${TRL.driverUrl(row.driver)}">${esc(d ? d.name : row.driver)}</a>${d && d.cc ? TRL.flag(d.cc, d.nation, "sm") : ""}</div><span class="team-name">${esc(t ? t.name : "Free agent")}</span><div class="time">${esc(row.time || "—")}</div></article>`; }).join("");
  const gridCell = (row) => { if (!row.grid) return "—"; const delta = row.status === "Finished" ? row.grid - row.position : null; return `${row.grid}${delta ? ` <span class="grid-delta ${delta > 0 ? "up" : "down"}">(${delta > 0 ? "+" : ""}${delta})</span>` : ""}`; };
  const penCell = (row) => (row.trackLimits ? `<span class="pen-chip ${row.trackLimits >= 9 ? "hard" : "warn"}">${row.trackLimits}s</span>` : '<span class="dim">—</span>');
  const fiaCell = (row) => ((row.penalties || []).length ? row.penalties.map((p) => `<span class="pen-chip hard" title="${esc(p.reason || "")}">${p.seconds}s</span>`).join(" ") : '<span class="dim">—</span>');
  const nameCell = (row) => { const d = E.driver(s, row.driver); const t = row.team ? E.team(s, row.team) : null; return `<span style="display:inline-flex;align-items:center;gap:8px">${TRL.ctorMark(t, "sm")}<a href="${TRL.driverUrl(row.driver)}"><b>${esc(d ? d.name : row.driver)}</b></a>${TRL.reserveMark(row)}${d && d.cc ? TRL.flag(d.cc, d.nation, "sm") : ""}</span>`; };
  const isPole = (row) => row.grid === 1 && row.quali;
  const rows = race.map((row) => { const p = ps(row); const retired = row.status !== "Finished"; return `<tr class="${retired ? "row-retired" : TRL.rowTone(row.position)}"><td>${TRL.medal(row.position)}</td><td>${nameCell(row)}</td><td class="c">${gridCell(row)}</td><td class="c ${isPole(row) ? "time-pole" : ""}">${esc(row.quali || "—")}</td><td class="c">${retired ? esc(row.status) : esc(row.time || "—")}</td><td class="c">${retired ? "—" : row.position === 1 ? "Leader" : esc(row.time || "—")}</td><td class="c">${penCell(row)}</td><td class="c">${fiaCell(row)}</td><td class="pts-cell">${p.total}${TRL.bonusChips(p.bonuses)}</td></tr>`; }).join("");
  const cards = race.map((row) => { const p = ps(row); const retired = row.status !== "Finished"; return `<div class="result-card ${retired ? "is-retired" : ""}"><div class="result-card-top">${TRL.medal(row.position)}<span class="name">${nameCell(row)}</span><span class="pts">${p.total}</span></div><div class="result-card-stats"><div><span>Grid</span>${gridCell(row)}</div><div><span>Quali</span>${esc(row.quali || "—")}</div><div><span>Time</span>${retired ? esc(row.status) : esc(row.time || "—")}</div><div><span>Pen</span>${penCell(row)} ${fiaCell(row)}</div></div>${TRL.bonusChips(p.bonuses)}</div>`; }).join("");
  const dotd = sh.dotd ? E.driver(s, sh.dotd) : null;
  root.innerHTML = `
    <section class="page-head"><p class="kicker">${esc(s.name)} - ${r.preseason ? "Preseason" : "Round " + r.round}</p><h1 class="page-head-flag"><span>${esc(r.name)}</span>${TRL.flag(r.cc, r.location, "lg")}</h1><p class="lede">${esc(r.circuit)}, ${esc(r.location)}. ${r.laps} laps.</p></section>
    <div class="results-meta">${TRL.divBadge(dv)}<span class="pill pill-green">Published</span>${divs.length > 1 ? `<div class="desk-tabs" style="margin:0">${divs.filter((x) => E.sheet(s, roundId, x.id)).map((x) => `<button type="button" data-div="${esc(x.id)}" aria-selected="${x.id === divId}">${esc(x.short)}</button>`).join("")}</div>` : ""}<span class="grow"></span>${prev ? `<a class="btn btn-compact" href="?round=${esc(prev.id)}&div=${esc(divId)}">← ${prev.preseason ? "Pre" : "R" + prev.round}</a>` : ""}${next ? `<a class="btn btn-compact" href="?round=${esc(next.id)}&div=${esc(divId)}">${next.preseason ? "Pre" : "R" + next.round} →</a>` : ""}<a class="btn btn-primary btn-compact" href="analysis.html?round=${esc(roundId)}&div=${esc(divId)}">Race analysis</a></div>
    <div class="podium-grid">${podium}</div>
    <div class="results-head"><div><p class="kicker">Official classification</p><h2>Race results</h2></div>${dotd ? `<div class="dotd-box"><p class="kicker">Driver of the day</p><span class="who">${TRL.ctorMark(dotd.team ? E.team(s, dotd.team) : null, "sm")}<a href="${TRL.driverUrl(dotd.id)}">${esc(dotd.name)}</a></span></div>` : ""}</div>
    <div class="table-panel results-table-wrap"><div class="table-scroll"><table class="data-table results-table"><thead><tr><th>Pos</th><th>Driver</th><th class="c">Grid</th><th class="c">Qualifying</th><th class="c">Time</th><th class="c">Gap</th><th class="c">Track limits</th><th class="c">Stewards</th><th class="r">Pts</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="result-cards">${cards}</div>
    ${r.preseason ? '<p class="muted small mt-2">Preseason showcase: no championship points are awarded. Bonus markers are shown for reference.</p>' : ""}`;
  $$("[data-div]", root).forEach((b) => b.addEventListener("click", () => { location.search = `?round=${encodeURIComponent(roundId)}&div=${encodeURIComponent(b.dataset.div)}`; }));
});
