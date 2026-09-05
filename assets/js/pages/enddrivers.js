TRL.page("enddrivers", function () {
  const { $, esc } = TRL; const B = TRL.cfg().brand || {}; const list = ((window.TRL_DATA || {}).endurance || {}).drivers || [];
  TRL.setTitle("Endurance driver list");
  TRL.pageHead($("#head"), `Endurance · ${B.version || ""}`, "Driver list", `Everyone signed up for ${esc(B.name)} endurance. Join from the signup page, then mark races you want from the calendar.`);
  $("#grid").innerHTML = list.length ? list.map((d) => `<article class="driver-tile" style="--team:#5c8dff"><div class="driver-tile-top"><span class="avatar md" style="--team:#5c8dff">${esc(TRL.initials(d.name))}</span><div><p class="kicker" style="margin-bottom:4px">${esc((d.platforms || []).map(TRL_END.platformName).join(" + "))}</p><h3>${esc(d.name)}</h3><div class="driver-tile-nation">${esc(d.classes || "All")} · ${esc(d.timezone || "")}</div></div></div></article>`).join("") : '<div class="empty-state" style="grid-column:1/-1">Nobody on the endurance list yet.</div>';
});
