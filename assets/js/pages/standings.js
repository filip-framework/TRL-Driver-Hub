/* Standings page */
TRL.page("standings", function () {
  const { $, $$, esc, link } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  TRL.setTitle("Standings");
  TRL.seasonSelect($("#season-select"));
  let view = "drivers", mode = "summary", tid = null, hl = "";

  function cellPos(res, dropped) {
    if (!res || res.position == null) return '<td class="rp text-dim">–</td>';
    const finished = res.status === "Finished";
    let style = finished ? (res.position === 1 ? "color:var(--gold)" : res.position === 2 ? "color:var(--silver)" : res.position === 3 ? "color:var(--bronze)" : "") : "color:var(--accent-2);font-size:.72rem";
    if (dropped) style += ";text-decoration:line-through;opacity:.55";
    const marks = `${res.pole ? '<sup title="Pole position" style="color:#7cb0ff;font-size:.6rem"> P</sup>' : ""}${res.fastestLap ? '<sup title="Fastest lap" style="color:#c49bff;font-size:.6rem"> FL</sup>' : ""}`;
    const title = `${res.points} pts${res.sprintPosition ? ` · sprint P${res.sprintPosition}` : ""}${dropped ? " · dropped result" : ""}`;
    return `<td class="rp" style="${style}" title="${esc(title)}">${finished ? res.position : esc(res.status)}${marks}</td>`;
  }
  const rowCls = (name, id) => (hl && name.toLowerCase().includes(hl)) || TRL.qs("me") === id ? "is-me" : "";

  function renderDrivers(st) {
    $("#table").innerHTML = `<table class="table" id="std-table"><thead><tr><th>Pos</th><th title="Change since last round"></th><th class="sortable" data-key="name">Driver</th><th>Team</th><th class="pts sortable" data-key="points" data-dir="desc">Pts</th><th class="r">Gap</th><th class="c sortable" data-key="wins">Wins</th><th class="c sortable" data-key="podiums">Podiums</th><th class="c sortable" data-key="poles">Poles</th><th class="c sortable" data-key="fl">FL</th><th class="c sortable" data-key="dnf">DNF</th><th class="c sortable" data-key="starts">Starts</th></tr></thead><tbody>${st.drivers.map((d) => `<tr class="${rowCls(d.name, d.driverId)} ${d.role === "reserve" ? "is-reserve" : ""}" data-name="${esc(d.name)}" data-points="${d.points}" data-wins="${d.wins}" data-podiums="${d.podiums}" data-poles="${d.poles}" data-fl="${d.fastestLaps}" data-dnf="${d.dnfs}" data-starts="${d.starts}"><td>${TRL.posBadge(d.position)}</td><td>${TRL.movement(d.movement)}</td><td>${TRL.driverName(s, d.driverId, { number: true, reserve: true })}</td><td>${TRL.teamName(s, d.teamId)}</td><td class="pts">${d.points}</td><td class="r text-muted">${d.position === 1 ? "—" : "−" + d.gapToLeader}</td><td class="c">${d.wins}</td><td class="c">${d.podiums}</td><td class="c">${d.poles}</td><td class="c">${d.fastestLaps}</td><td class="c">${d.dnfs}</td><td class="c">${d.starts}</td></tr>`).join("")}</tbody></table>`;
    TRL.sortableTable($("#std-table"));
  }
  function renderRounds(st) {
    const rounds = st.rounds;
    if (!rounds.length) { $("#table").innerHTML = '<div class="empty">No rounds completed yet.</div>'; return; }
    $("#table").innerHTML = `<table class="table table--compact table--rounds"><thead><tr><th>Pos</th><th>Driver</th>${rounds.map((r) => `<th class="c" title="${esc(r.name)}"><a href="${esc(link("results.html", { tier: tid, round: r.id }))}" style="font-weight:700">${TRL.flag(r.country)}<br>R${r.round}</a></th>`).join("")}<th class="pts">Pts</th></tr></thead><tbody>${st.drivers.map((d) => `<tr class="${rowCls(d.name, d.driverId)}"><td>${TRL.posBadge(d.position)}</td><td>${TRL.driverName(s, d.driverId, { reserve: true })}</td>${rounds.map((r) => cellPos(d.results[r.id], d.dropped.some((x) => x.round === r.id))).join("")}<td class="pts">${d.points}</td></tr>`).join("")}</tbody></table>`;
  }
  function renderTeams(st) {
    $("#table").innerHTML = `<table class="table" id="std-table"><thead><tr><th>Pos</th><th></th><th>Team</th><th>Drivers</th><th class="pts">Pts</th><th class="r">Gap</th><th class="c">Wins</th><th class="c">Podiums</th><th class="c">Poles</th><th class="c">FL</th></tr></thead><tbody>${st.teams.map((t, i) => { const gap = st.teams[0].points - t.points; const drivers = E.tierDrivers(s, tid).filter((d) => d.team === t.teamId); return `<tr><td>${TRL.posBadge(t.position)}</td><td>${TRL.movement(t.movement)}</td><td>${TRL.teamName(s, t.teamId)}</td><td class="text-muted" style="white-space:normal">${drivers.map((d) => TRL.driverName(s, d.id, { flag: false })).join(", ") || "—"}</td><td class="pts">${t.points}</td><td class="r text-muted">${i === 0 ? "—" : "−" + gap}</td><td class="c">${t.wins}</td><td class="c">${t.podiums}</td><td class="c">${t.poles}</td><td class="c">${t.fastestLaps}</td></tr>`; }).join("")}</tbody></table>`;
  }
  function render() {
    if (!tid) return;
    const st = E.computeStandings(s, tid);
    const h = E.highlights(s, tid);
    const t = E.tier(s, tid);
    const tile = (label, v, sub) => `<div class="stat-tile"><span>${label}</span><b style="font-size:1.35rem;margin:4px 0 2px">${esc(v)}</b><span style="text-transform:none;letter-spacing:0" class="text-dim">${esc(sub)}</span></div>`;
    $("#highlights").innerHTML = [
      tile("Leader", h.leader ? h.leader.name : "—", h.leader ? `${h.leader.points} pts` : ""),
      tile("Most wins", h.mostWins && h.mostWins.wins ? h.mostWins.name : "—", h.mostWins && h.mostWins.wins ? TRL.plural(h.mostWins.wins, "win") : ""),
      tile("Most poles", h.mostPoles && h.mostPoles.poles ? h.mostPoles.name : "—", h.mostPoles && h.mostPoles.poles ? TRL.plural(h.mostPoles.poles, "pole") : ""),
      tile("Fastest laps", h.mostFastestLaps && h.mostFastestLaps.fastestLaps ? h.mostFastestLaps.name : "—", h.mostFastestLaps && h.mostFastestLaps.fastestLaps ? TRL.plural(h.mostFastestLaps.fastestLaps, "lap") : ""),
      tile("Top team", h.team ? h.team.name : "—", h.team ? `${h.team.points} pts` : ""),
      tile("Rounds", `${h.rounds} / ${s.rounds.length}`, "completed")
    ].join("");
    $("#tier-desc").textContent = t ? `${s.name} · ${t.name}: ${t.description || ""} Races on ${t.raceDay}s at ${t.raceTime}.` : "";
    if (view === "drivers") { if (mode === "summary") renderDrivers(st); else renderRounds(st); } else renderTeams(st);
  }

  $$("#view-seg button").forEach((b) => b.addEventListener("click", () => { view = b.dataset.view; $$("#view-seg button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); $("#mode-seg").classList.toggle("hidden", view !== "drivers"); render(); }));
  $$("#mode-seg button").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; $$("#mode-seg button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); render(); }));
  $("#me").addEventListener("input", (e) => { hl = e.target.value.trim().toLowerCase(); if (hl.length < 2) hl = ""; render(); });
  const ps = E.pointsSystem(s);
  $("#points-note").textContent = `Points: ${ps.race.join("-")}${ps.fastestLap ? ` · +${ps.fastestLap} fastest lap${ps.fastestLapTop10Only ? " (top 10 only)" : ""}` : ""}${ps.sprint && ps.sprint.length ? ` · Sprint ${ps.sprint.join("-")}` : ""}${ps.pole ? ` · +${ps.pole} pole` : ""}${s.dropRounds ? ` · worst ${s.dropRounds} round(s) dropped` : ""}. Ties are broken on countback.`;
  TRL.tierTabs($("#tier-tabs"), s, (id) => { tid = id; render(); });
});
