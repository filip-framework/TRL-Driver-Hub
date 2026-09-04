/* Rules page: fills the dynamic bits from config + season data */
TRL.page("rules", function () {
  const { $, $$, esc } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  const ps = E.pointsSystem(s);
  const pp = TRL.cfg().penaltyPoints || { raceBanAt: 12, warningAt: 8, expiryRounds: 12 };
  TRL.setTitle("Rules & regulations");
  const strip = (arr) => arr.map((p, i) => `<span><small>P${i + 1}</small><b>${p}</b></span>`).join("");
  $("#points-race").innerHTML = strip(ps.race);
  $("#points-sprint").innerHTML = ps.sprint && ps.sprint.length ? strip(ps.sprint) : '<span class="text-muted">No sprint points this season.</span>';
  $("#points-extra").innerHTML = [ps.fastestLap ? `<strong>+${ps.fastestLap} point</strong> for the fastest lap of the Grand Prix${ps.fastestLapTop10Only ? ", only if the driver finishes in the top 10" : ""}.` : "", ps.pole ? `<strong>+${ps.pole} point</strong> for pole position.` : ""].filter(Boolean).join(" ");
  $("#points-drop").innerHTML = s.dropRounds ? `The worst <strong>${s.dropRounds}</strong> result${s.dropRounds > 1 ? "s" : ""} of the season are dropped from the drivers' championship.` : "No dropped rounds: every result counts towards the championship.";
  const sprints = E.rounds(s).filter((r) => r.sprint);
  $("#format-length").textContent = (E.rounds(s)[0] || {}).format || "50%";
  $("#format-season").innerHTML = `<strong>${esc(s.name)}</strong> (${esc(s.year)}) on <strong>${esc(s.game || "")}</strong> · ${s.rounds.length} rounds · sprint weekends: ${sprints.length ? sprints.map((r) => `R${r.round} ${esc(r.name)}`).join(", ") : "none"}.`;
  $("#tiers-table").innerHTML = `<thead><tr><th>Tier</th><th>Race night</th><th>Time</th><th class="c">Drivers</th><th>Description</th></tr></thead><tbody>${E.tiers(s).map((t) => `<tr><td>${TRL.tierPill(t)} ${esc(t.name)}</td><td>${esc(t.raceDay)}s</td><td>${esc(t.raceTime)}</td><td class="c">${E.tierDrivers(s, t.id, "driver").length}</td><td style="white-space:normal">${esc(t.description || "")}</td></tr>`).join("")}</tbody>`;
  $("#licence-rule").innerHTML = `<strong>Licence points.</strong> A driver reaching <strong>${pp.warningAt}</strong> points receives a formal warning. At <strong>${pp.raceBanAt}</strong> points the driver is banned for the next round and their points reset to zero. Points expire ${pp.expiryRounds} rounds after they are issued. Current totals are on the <a href="penalties.html">Penalties</a> page.`;
  // scroll-spy for the section nav
  const links = $$("#rules-nav a");
  const targets = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && targets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id)); } });
    }, { rootMargin: "-20% 0px -70% 0px" });
    targets.forEach((t) => io.observe(t));
  }
});
