/* Teams grid */
TRL.page("teams", function () {
  const { $, esc, link, img } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  TRL.setTitle("Teams");
  TRL.seasonSelect($("#season-select"));
  TRL.tierTabs($("#tier-tabs"), s, (tid) => {
    const st = E.computeStandings(s, tid);
    $("#grid").innerHTML = st.teams.map((t) => {
      const team = t.team || { name: t.teamId, color: "#6b7290" };
      const drivers = E.tierDrivers(s, tid).filter((d) => d.team === t.teamId);
      return `<a class="team-card" href="${esc(link("team.html", { id: t.teamId, tier: tid }))}">
        <div class="team-card__livery placeholder">${img(team.livery, "Team livery", { w: 640, h: 280, accent: team.color, alt: team.name })}</div>
        <div class="team-card__stripe" style="background:${esc(team.color)}"></div>
        <div class="team-card__body">
          <div class="row row--between"><div class="team-card__name">${esc(team.name)}</div>${TRL.posBadge(t.position)}</div>
          <div class="row" style="gap:16px"><span><b style="font-family:var(--font-display);font-size:1.5rem">${t.points}</b> <span class="text-muted">pts</span></span><span class="text-muted" style="font-size:.85rem">${TRL.plural(t.wins, "win")} · ${TRL.plural(t.podiums, "podium")} · ${TRL.plural(t.poles, "pole")}</span></div>
          <div class="team-card__drivers">${drivers.map((d) => `<span>${TRL.flag(d.nationality)} ${esc(d.name)} <span class="num">#${esc(d.number)}</span></span>`).join("") || '<span class="text-dim">No drivers assigned</span>'}</div>
        </div></a>`;
    }).join("");
  });
});
