/* Drivers grid */
TRL.page("drivers", function () {
  const { $, esc, link, img } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  TRL.setTitle("Drivers");
  TRL.seasonSelect($("#season-select"));
  let tid = "", q = "", team = "", role = "";
  $("#team-filter").innerHTML = '<option value="">All teams</option>' + (s.teams || []).map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("");
  const standings = {}; E.tiers(s).forEach((t) => { standings[t.id] = E.computeStandings(s, t.id); });
  const tierOrder = (id) => ((E.tier(s, id) || {}).order || 99);
  const entryOf = (d) => { const st = standings[d.tier]; return st ? st.drivers.find((x) => x.driverId === d.id) : null; };

  function card(d) {
    const t = E.team(s, d.team), tier = E.tier(s, d.tier), e = entryOf(d);
    const color = t ? t.color : "#6b7290";
    return `<a class="driver-card" href="${esc(link("driver.html", { id: d.id }))}">
      <div class="driver-card__photo placeholder">${img(d.photo, "Driver photo", { w: 400, h: 400, accent: color, alt: d.name })}</div>
      <div class="driver-card__bar" style="background:${esc(color)}"></div>
      <div class="driver-card__body">
        <div class="driver-card__name">${TRL.flag(d.nationality)} ${esc(d.name)}</div>
        <div class="driver-card__num">${esc(d.number)}</div>
        <div class="driver-card__team">${t ? esc(t.name) : "Reserve driver"}</div>
        <div class="driver-card__meta">${TRL.tierPill(tier)}${d.role === "reserve" ? '<span class="badge">Reserve</span>' : e ? `<span class="badge">P${e.position} · ${e.points} pts</span>` : ""}<span class="badge">${esc(d.platform || "")}</span></div>
      </div></a>`;
  }
  function render() {
    const list = (s.drivers || []).filter((d) => (!tid || d.tier === tid) && (!team || d.team === team) && (!role || d.role === role) && (!q || `${d.name} ${d.tag} ${d.number}`.toLowerCase().includes(q)));
    list.sort((a, b) => tierOrder(a.tier) - tierOrder(b.tier) || ((a.role === "reserve") - (b.role === "reserve")) || (((entryOf(a) || {}).position || 999) - ((entryOf(b) || {}).position || 999)));
    $("#count").textContent = `${list.length} driver${list.length === 1 ? "" : "s"}`;
    $("#grid").innerHTML = list.length ? list.map(card).join("") : '<div class="empty" style="grid-column:1/-1">No drivers match those filters.</div>';
  }
  $("#team-filter").addEventListener("change", (e) => { team = e.target.value; render(); });
  $("#role-filter").addEventListener("change", (e) => { role = e.target.value; render(); });
  $("#search").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); render(); });
  TRL.tierTabs($("#tier-tabs"), s, (id) => { tid = id; render(); }, { allOption: true });
});
