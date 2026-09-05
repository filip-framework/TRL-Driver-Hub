/* F1 home */
TRL.page("f1home", function () {
  const { $, esc } = TRL; const E = TRL.E(); const F = TRL.cfg().f1 || {}; const s = TRL.season();
  TRL.setTitle(F.shortName || "F1 Championship");
  $("#hero-kicker").textContent = `${F.code || "F1"} Championship`;
  $("#hero-title").innerHTML = `${esc(F.heroLine1 || "Built for the")} <em class="hot">${esc(F.heroLine2 || "limit.")}</em>`;
  $("#hero-lede").textContent = F.lede || "";
  const rounds = E.championshipRounds(s); const nDrivers = E.drivers(s).length;
  $("#season-strip").innerHTML = `<span>${esc(s.name)}</span><span>${rounds.length} rounds</span><span>${esc(F.raceNight || "")}<small>${esc(F.raceTime || "")}</small></span><span>${nDrivers} drivers</span>`;
  const next = E.nextRound(s);
  $("#next-race").innerHTML = next ? TRL.raceRow(s, next, { next: true }) : '<div class="empty-state">Every round of the season is in the books.</div>';
  const d1 = E.divisions(s)[0];
  $("#title-fight").innerHTML = d1 ? E.leaders(s, d1.id, 3).map((e) => TRL.leaderCard(s, e)).join("") : "";
  const preview = E.drivers(s).filter((d) => d1 && d.division === d1.id && !d.unsigned && d.role === "driver").sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
  $("#driver-preview").innerHTML = preview.map((d) => TRL.driverTile(s, d)).join("");
  $("#ctor-strip").innerHTML = E.teams(s).map((t) => TRL.ctorTile(t)).join("");
});
