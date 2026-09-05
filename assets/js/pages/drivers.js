/* Driver directory */
TRL.page("drivers", function () {
  const { $, esc } = TRL; const E = TRL.E(); const s = TRL.season();
  TRL.setTitle("Meet the drivers");
  TRL.pageHead($("#head"), s.name, "Meet the drivers", "Rostered drivers by constructor, then free agents — open a profile for the full sheet.");
  const groups = E.divisions(s).map((dv) => {
    const ro = E.rosters(s, dv.id);
    if (!ro.byTeam.length) return "";
    return `<section class="standings-block"><div class="block-head"><div>${TRL.divBadge(dv)}<h2 style="margin-top:8px">${esc(dv.name)}</h2></div><span class="section-count">${ro.byTeam.length} constructors</span></div><div class="grid-2">${ro.byTeam.map((g) => `<div class="ctor-group" ${TRL.teamStyle(g.team)}><div class="ctor-group-head">${TRL.ctorMark(g.team, "md")}<div><p class="kicker" style="color:var(--team)">Constructor</p><h3>${esc(g.team.name)}</h3></div><span class="count">${g.drivers.length} driver${g.drivers.length === 1 ? "" : "s"}</span></div><div class="driver-grid two">${g.drivers.map((d) => TRL.driverTile(s, d)).join("")}</div></div>`).join("")}</div></section>`;
  }).join("");
  const fa = E.freeAgents(s);
  $("#blocks").innerHTML = groups + (fa.length ? `<section class="standings-block"><div class="block-head"><div><p class="kicker">Unsigned</p><h2>Free agents</h2></div><span class="section-count">${fa.length} drivers</span></div><div class="driver-grid">${fa.map((d) => TRL.driverTile(s, d, { stats: false })).join("")}</div></section>` : "");
});
