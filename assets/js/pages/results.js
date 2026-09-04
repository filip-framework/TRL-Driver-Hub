/* Results page */
TRL.page("results", function () {
  const { $, $$, esc, link } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  TRL.setTitle("Results");
  TRL.seasonSelect($("#season-select"));
  let tid = null, rid = TRL.qs("round"), tab = "race";
  const roundSel = $("#round-select");

  function refreshRounds() {
    const sheets = E.tierSheets(s, tid);
    roundSel.innerHTML = sheets.length ? sheets.map((sh) => { const r = E.round(s, sh.round); return `<option value="${esc(r.id)}">R${r.round} · ${esc(r.name)}</option>`; }).join("") : '<option value="">No results yet</option>';
    if (!sheets.some((sh) => sh.round === rid)) rid = sheets.length ? sheets[sheets.length - 1].round : null;
    roundSel.value = rid || "";
  }
  function timeCell(row, i) { if (row.status !== "Finished") return `<span class="text-dim">${esc(row.status)}</span>`; return esc(row.time || ""); }
  function render() {
    const t = E.tier(s, tid);
    const sh = rid ? E.sheet(s, rid, tid) : null;
    const r = rid ? E.round(s, rid) : null;
    if (!sh || !r) { $("#round-head").innerHTML = ""; $("#result").innerHTML = `<div class="empty">No results have been posted for ${esc(t ? t.name : "this tier")} yet.</div>`; return; }
    TRL.setParam("round", rid); TRL.setParam("tier", tid);
    TRL.setTitle(`R${r.round} ${r.name} · ${t.name}`);
    const sheets = E.tierSheets(s, tid); const idx = sheets.findIndex((x) => x.round === rid);
    const prev = idx > 0 ? sheets[idx - 1].round : null, next = idx < sheets.length - 1 ? sheets[idx + 1].round : null;
    const st = E.computeStandings(s, tid);
    const resOf = (driverId) => { const e = st.drivers.find((d) => d.driverId === driverId); return e ? e.results[rid] || {} : {}; };
    const race = sh.race || [], quali = sh.qualifying || [], sprint = sh.sprint || null;
    const fl = race.find((x) => x.fastestLap);
    const pole = quali.find((x) => x.position === 1);

    $("#round-head").innerHTML = `
      <div class="row row--between">
        <div>
          <div class="kicker">${esc(t.name)} · Round ${r.round} of ${s.rounds.length}</div>
          <h2 style="margin:6px 0 6px">${TRL.flag(r.country)} ${esc(r.name)}</h2>
          <div class="race-meta"><span><b>${esc(r.circuit)}</b>, ${esc(r.location)}</span><span>${r.laps} laps · ${esc(r.format || "")}</span><span>${esc(TRL.fmtDateTime(E.sessionDate(s, r, tid)))}</span>${r.sprint ? '<span class="badge badge--purple">Sprint weekend</span>' : ""}</div>
        </div>
        <div class="row">${prev ? `<button class="btn btn--ghost btn--sm" data-go="${esc(prev)}">← Previous</button>` : ""}${next ? `<button class="btn btn--ghost btn--sm" data-go="${esc(next)}">Next →</button>` : ""}</div>
      </div>`;

    const podium = `<div class="podium">${race.slice(0, 3).map((row) => `<div class="podium__step">${TRL.posBadge(row.position)}<div class="podium__name">${TRL.driverName(s, row.driver, { flag: false })}</div><div class="podium__team">${esc((E.team(s, row.team) || {}).name || "")}</div></div>`).join("")}</div>`;
    const facts = `<dl class="dl mt-3">${pole ? `<dt>Pole</dt><dd>${TRL.driverName(s, pole.driver)} <span class="mono text-muted">${esc(pole.time || "")}</span></dd>` : ""}${fl ? `<dt>Fastest lap</dt><dd>${TRL.driverName(s, fl.driver)} <span class="mono text-muted">${esc(fl.fastestLapTime || "")}</span></dd>` : ""}${sh.dotd ? `<dt>Driver of the day</dt><dd>${TRL.driverName(s, sh.dotd)}</dd>` : ""}<dt>Classified</dt><dd>${race.filter((x) => x.status === "Finished").length} of ${race.length}</dd></dl>`;
    const tabs = [["race", "Race"], ["qualifying", "Qualifying"]].concat(sprint ? [["sprint", "Sprint"]] : []);
    if (!tabs.some((x) => x[0] === tab)) tab = "race";

    let table = "";
    if (tab === "race") {
      table = `<table class="table"><thead><tr><th>Pos</th><th>Driver</th><th>Team</th><th class="c">Grid</th><th class="c">+/−</th><th class="c">Laps</th><th>Time / Gap</th><th class="c">Pen</th><th class="pts">Pts</th></tr></thead><tbody>${race.map((row) => { const res = resOf(row.driver); const delta = row.grid && row.status === "Finished" ? row.grid - row.position : null; return `<tr><td>${TRL.posBadge(row.position, row.status)}</td><td>${TRL.driverName(s, row.driver, { number: true, reserve: true })}${row.fastestLap ? '<span class="fl-dot" title="Fastest lap">FL</span>' : ""}${sh.dotd === row.driver ? ' <span class="badge badge--gold" title="Driver of the day" style="padding:1px 6px">DOTD</span>' : ""}</td><td>${TRL.teamName(s, row.team)}</td><td class="c">${row.grid || "—"}</td><td class="c">${delta == null ? "—" : delta > 0 ? `<span class="delta delta--up">▲${delta}</span>` : delta < 0 ? `<span class="delta delta--down">▼${-delta}</span>` : '<span class="delta delta--same">–</span>'}</td><td class="c">${row.laps}</td><td class="mono">${timeCell(row)}</td><td class="c">${row.penaltySeconds ? `<span class="badge badge--accent">+${row.penaltySeconds}s</span>` : ""}</td><td class="pts">${res.racePoints != null ? res.racePoints : 0}</td></tr>`; }).join("")}</tbody></table>`;
    } else if (tab === "qualifying") {
      const toSec = (t) => { const m = /^(\d+):(\d+\.\d+)$/.exec(t || ""); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
      const p = pole ? toSec(pole.time) : null;
      table = `<table class="table"><thead><tr><th>Pos</th><th>Driver</th><th>Team</th><th>Lap time</th><th>Gap</th></tr></thead><tbody>${quali.map((row) => { const sec = toSec(row.time); return `<tr><td>${TRL.posBadge(row.position)}</td><td>${TRL.driverName(s, row.driver, { number: true, reserve: true })}</td><td>${TRL.teamName(s, row.team)}</td><td class="mono">${esc(row.time || "—")}</td><td class="mono text-muted">${p != null && sec != null && row.position > 1 ? "+" + (sec - p).toFixed(3) : ""}</td></tr>`; }).join("")}</tbody></table>`;
    } else if (tab === "sprint") {
      const ps = E.pointsSystem(s);
      table = `<table class="table"><thead><tr><th>Pos</th><th>Driver</th><th>Team</th><th class="c">Laps</th><th>Time / Gap</th><th class="pts">Pts</th></tr></thead><tbody>${sprint.map((row) => `<tr><td>${TRL.posBadge(row.position, row.status)}</td><td>${TRL.driverName(s, row.driver, { number: true, reserve: true })}</td><td>${TRL.teamName(s, row.team)}</td><td class="c">${row.laps}</td><td class="mono">${timeCell(row)}</td><td class="pts">${row.status === "Finished" ? (ps.sprint[row.position - 1] || 0) : 0}</td></tr>`).join("")}</tbody></table>`;
    }
    const pens = E.penalties(s, { tier: tid, round: rid });
    $("#result").innerHTML = `
      <div class="sidebar-layout">
        <div>
          <div class="tabs" id="session-tabs">${tabs.map(([k, l]) => `<button class="tab" role="tab" aria-selected="${tab === k}" data-tab="${k}">${l}</button>`).join("")}</div>
          <div class="table-wrap">${table}</div>
          ${sh.report ? `<div class="card mt-3"><div class="card__title">Race report</div><p class="text-muted">${esc(sh.report)}</p></div>` : ""}
        </div>
        <div class="stack">
          <div class="card"><div class="card__title">Podium</div>${podium}${facts}</div>
          <div class="card"><div class="card__title">Stewards' decisions <a href="${esc(link("penalties.html", { tier: tid, round: rid }))}">All</a></div>${pens.length ? pens.map((p) => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:.9rem"><b>${TRL.driverName(s, p.driver, { flag: false })}</b> · lap ${p.lap}<div class="text-muted">${esc(p.incident)} — ${esc(p.decision)}${p.points ? ` (+${p.points} pts)` : ""}</div></div>`).join("") : '<p class="text-muted">No penalties.</p>'}</div>
          ${sh.stream ? `<a class="btn btn--ghost btn--block" href="${esc(sh.stream)}" target="_blank" rel="noopener">${TRL.icon("youtube")} Watch the replay</a>` : `<div class="placeholder" style="aspect-ratio:16/9;border-radius:var(--radius)">Replay embed placeholder</div>`}
        </div>
      </div>`;
    $$("#session-tabs .tab").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); }));
    $$("#round-head [data-go]").forEach((b) => b.addEventListener("click", () => { rid = b.dataset.go; roundSel.value = rid; render(); }));
  }
  roundSel.addEventListener("change", () => { rid = roundSel.value; render(); });
  TRL.tierTabs($("#tier-tabs"), s, (id) => { tid = id; refreshRounds(); render(); });
});
