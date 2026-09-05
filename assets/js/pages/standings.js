/* Championship standings */
TRL.page("standings", function () {
  const { $, esc } = TRL; const E = TRL.E(); const s = TRL.season();
  TRL.setTitle("Championship standings");
  TRL.pageHead($("#head"), s.name, "Championship standings", "Every point. Every position. The complete drivers’ and constructors’ championship picture.");
  const row = (e) => `<tr class="${TRL.rowTone(e.position)}"><td>${TRL.medal(e.position)}</td><td class="driver-cell"><b><a href="${TRL.driverUrl(e.driverId)}">${esc(e.name)}</a></b><small>#${esc(e.driver && e.driver.number != null ? e.driver.number : 0)}${e.driver && e.driver.nation ? ` · ${esc(e.driver.nation)}` : ""}</small></td><td>${TRL.teamCell(s, e.teamId)}</td><td class="c">${e.wins}</td><td class="c">${e.podiums}</td><td class="c">${e.poles}</td><td class="c">${e.top5}</td><td class="pts-cell">${e.points}<small class="${e.position === 1 ? "leader" : ""}">${e.position === 1 ? "Leader" : "+" + e.gap}</small></td></tr>`;
  const ctorRow = (t) => `<a class="ctor-row" ${TRL.teamStyle(t.team)} href="${TRL.teamUrl(t.teamId)}"><span>${t.position <= 3 ? TRL.medal(t.position) : `<span class="rank-circle">${t.position}</span>`}</span>${TRL.ctorMark(t.team, "md")}<div><span class="team-cell">${esc(t.name)}</span><small>${t.wins} race win${t.wins === 1 ? "" : "s"}</small></div><div class="pts-cell">${t.points}<small class="${t.position === 1 ? "leader" : ""}">pts · ${t.position === 1 ? "Leader" : "+" + t.gap}</small></div></a>`;
  $("#blocks").innerHTML = E.divisions(s).map((dv) => {
    const st = E.computeStandings(s, dv.id);
    if (!st.drivers.length) return "";
    return `<section class="standings-block"><div class="block-head"><div>${TRL.divBadge(dv)}<h2 style="margin-top:8px">${esc(dv.name)}</h2></div><span class="section-count">${st.drivers.length} classified drivers</span></div>
      <div class="standings-layout">
        <div class="table-panel"><div class="table-panel-head">Drivers</div><div class="table-scroll"><table class="data-table"><thead><tr><th>Pos</th><th>Driver</th><th>Team</th><th class="c">Wins</th><th class="c">Podiums</th><th class="c">Poles</th><th class="c">Top 5</th><th class="r">Points</th></tr></thead><tbody>${st.drivers.map(row).join("")}</tbody></table></div></div>
        <div><div class="table-panel"><div class="table-panel-head">Constructors</div></div><div class="ctor-list" style="margin-top:10px">${st.teams.map(ctorRow).join("")}</div></div>
      </div></section>`;
  }).join("") || '<div class="empty-state">No results published yet.</div>';
});
