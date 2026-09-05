/* Race analysis */
TRL.page("analysis", function () {
  const { $, esc } = TRL; const E = TRL.E(); const s = TRL.season();
  const roundId = TRL.qs("round"), divId = TRL.qs("div") || (E.divisions(s)[0] || {}).id;
  const r = roundId ? E.round(s, roundId) : null; const an = r ? E.analysis(s, roundId, divId) : null; const dv = E.division(s, divId);
  const root = $("#analysis");
  if (!an) { root.innerHTML = '<div class="state-page"><p class="kicker">Analysis</p><h1>No data</h1><p class="lede" style="margin:0 auto">Pick a published round from the calendar.</p></div>'; return; }
  $("#back").href = `results.html?round=${encodeURIComponent(roundId)}&div=${encodeURIComponent(divId)}`;
  TRL.setTitle(`${r.name} analysis`);
  const name = (id) => { const d = E.driver(s, id); return `<a href="${TRL.driverUrl(id)}">${esc(d ? d.name : id)}</a>`; };
  const gained = an.rows.filter((x) => x.row.status === "Finished").sort((a, b) => b.gained - a.gained);
  const maxGain = Math.max(1, ...gained.map((x) => Math.abs(x.gained)));
  const gaps = an.rows.filter((x) => x.gap != null && x.row.position > 1).slice(0, 12); const maxGap = Math.max(1, ...gaps.map((x) => x.gap));
  const pens = an.rows.filter((x) => x.penaltyTotal > 0).sort((a, b) => b.penaltyTotal - a.penaltyTotal);
  const quali = an.rows.filter((x) => x.qualiGap != null).sort((a, b) => a.qualiGap - b.qualiGap).slice(0, 10); const maxQ = Math.max(0.1, ...quali.map((x) => x.qualiGap));
  const bars = (list, val, max, fmt, cls) => list.map((x) => `<div><div class="lbl"><span>${name(x.driverId)}</span><b>${fmt(val(x))}</b></div><div class="bar"><i class="${cls ? cls(x) : ""}" style="width:${Math.max(2, Math.abs(val(x)) / max * 100)}%"></i></div></div>`).join("");
  root.innerHTML = `
    <section class="page-head"><p class="kicker">${esc(s.name)} - ${r.preseason ? "Preseason" : "Round " + r.round} - Race analysis</p><h1 class="page-head-flag"><span>${esc(r.name)}</span>${TRL.flag(r.cc, r.location, "lg")}</h1><p class="lede">Your race in plain terms: the result, where the time went, and how you stacked up.</p></section>
    <div class="results-meta">${TRL.divBadge(dv)}<span class="pill pill-green">Published</span><span class="grow"></span><a class="btn btn-primary btn-compact" href="results.html?round=${esc(roundId)}&div=${esc(divId)}">Classification</a></div>
    <div class="stat-strip" style="margin-top:0"><div class="stat-cell"><span>Classified</span><b>${an.finishers}</b></div><div class="stat-cell"><span>Retirements</span><b>${an.retirements}</b></div><div class="stat-cell"><span>Drivers penalised</span><b>${an.penalised}</b></div><div class="stat-cell accent" style="--team:var(--gold)"><span>Most positions gained</span><b style="font-size:1.6rem">${an.mostGained ? name(an.mostGained) : "—"}</b></div></div>
    <div class="analysis-grid mt-3">
      <div class="analysis-card"><p class="kicker">Race craft</p><h3>Positions gained</h3>${bars(gained.slice(0, 12), (x) => x.gained, maxGain, (v) => (v > 0 ? "+" : "") + v, (x) => (x.gained >= 0 ? "green" : ""))}</div>
      <div class="analysis-card"><p class="kicker">Pace</p><h3>Gap to winner</h3>${bars(gaps, (x) => x.gap, maxGap, (v) => "+" + v.toFixed(3) + "s")}</div>
      <div class="analysis-card"><p class="kicker">One lap</p><h3>Qualifying gap to pole</h3>${bars(quali, (x) => x.qualiGap, maxQ, (v) => (v ? "+" + v.toFixed(3) + "s" : "Pole"), () => "green")}</div>
    </div>
    <div class="analysis-card mt-2"><p class="kicker">Stewards</p><h3>Penalty time</h3>${pens.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Driver</th><th class="c">Track limits</th><th class="c">Stewards</th><th class="c">Total</th><th class="c">Finish</th></tr></thead><tbody>${pens.map((x) => `<tr><td>${name(x.driverId)}</td><td class="c">${x.row.trackLimits || 0}s</td><td class="c">${(x.row.penalties || []).map((p) => `${p.seconds}s ${esc(p.reason || "")}`).join(", ") || "—"}</td><td class="c"><b>${x.penaltyTotal}s</b></td><td class="c">${x.row.status === "Finished" ? "P" + x.row.position : esc(x.row.status)}</td></tr>`).join("")}</tbody></table></div>` : '<p class="muted">A clean race: no penalty time was added.</p>'}</div>`;
});
