/* Team profile */
TRL.page("team", function () {
  const { $, esc, link, img } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  const id = TRL.qs("id");
  const team = s ? E.team(s, id) : null;
  if (!team) { $("#main").innerHTML = '<div class="container section"><div class="empty">Team not found. <a href="teams.html">Back to teams</a>.</div></div>'; return; }
  TRL.setTitle(team.name);
  const tiers = E.tiers(s);
  const perTier = tiers.map((t) => ({ tier: t, st: E.computeStandings(s, t.id) })).map((x) => ({ ...x, entry: x.st.teams.find((e) => e.teamId === id) }));
  const totals = perTier.reduce((a, x) => { if (x.entry) { a.points += x.entry.points; a.wins += x.entry.wins; a.podiums += x.entry.podiums; a.poles += x.entry.poles; } return a; }, { points: 0, wins: 0, podiums: 0, poles: 0 });
  const tile = (label, v) => `<div class="stat-tile"><b>${esc(v)}</b><span>${label}</span></div>`;
  $("#profile").innerHTML = `
    <div><div class="profile__photo placeholder" style="aspect-ratio:16/10">${img(team.livery, "Team livery", { w: 640, h: 400, accent: team.color, alt: team.name })}</div></div>
    <div>
      <div class="kicker">Constructor · ${esc(s.name)}</div>
      <h1 class="profile__name" style="color:${esc(team.color)}">${esc(team.name)}</h1>
      <p class="lead">${esc(team.description || `${team.name} fields two drivers in every tier. Constructors' points combine both cars, including any reserve who stands in.`)}</p>
      <div class="stat-tiles">${tile("Points (all tiers)", totals.points)}${tile("Wins", totals.wins)}${tile("Podiums", totals.podiums)}${tile("Poles", totals.poles)}</div>
    </div>`;
  $("#tiers").innerHTML = perTier.map(({ tier, st, entry }) => {
    const rows = st.drivers.filter((d) => d.teamId === id || (E.driver(s, d.driverId) || {}).team === id && (E.driver(s, d.driverId) || {}).tier === tier.id);
    const lineup = E.tierDrivers(s, tier.id).filter((d) => d.team === id);
    lineup.forEach((d) => { if (!rows.some((r) => r.driverId === d.id)) rows.push({ driverId: d.driverId, position: null, points: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, starts: 0 }); });
    return `<div class="card mb-3">
      <div class="card__title"><span>${TRL.tierPill(tier)} ${esc(tier.name)} ${entry ? `— ${TRL.ordinal(entry.position)} in the constructors' championship, ${entry.points} pts` : ""}</span><a href="${esc(link("standings.html", { tier: tier.id }))}">Standings</a></div>
      <div class="table-wrap"><table class="table table--compact"><thead><tr><th>Driver</th><th class="c">Champ. pos</th><th class="c">Starts</th><th class="c">Wins</th><th class="c">Podiums</th><th class="c">Poles</th><th class="c">FL</th><th class="pts">Pts</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${TRL.driverName(s, r.driverId, { number: true, reserve: true })}</td><td class="c">${r.position ? TRL.posBadge(r.position) : "—"}</td><td class="c">${r.starts}</td><td class="c">${r.wins}</td><td class="c">${r.podiums}</td><td class="c">${r.poles}</td><td class="c">${r.fastestLaps}</td><td class="pts">${r.points}</td></tr>`).join("")}</tbody></table></div>
      ${entry && st.rounds.length ? `<div class="table-wrap mt-2"><table class="table table--compact table--rounds"><thead><tr><th>Team points by round</th>${st.rounds.map((r) => `<th class="c" title="${esc(r.name)}">${TRL.flag(r.country)}<br>R${r.round}</th>`).join("")}<th class="pts">Total</th></tr></thead><tbody><tr><td>${esc(team.name)}</td>${st.rounds.map((r) => `<td class="rp">${entry.results[r.id] || 0}</td>`).join("")}<td class="pts">${entry.points}</td></tr></tbody></table></div>` : ""}
    </div>`;
  }).join("");
});
