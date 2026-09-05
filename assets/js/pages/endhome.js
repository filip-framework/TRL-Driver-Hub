TRL.page("endhome", function () {
  const { $, esc } = TRL; const E = TRL.E(); const C = TRL.cfg(); const B = C.brand || {}, EN = C.endurance || {}, D = C.discord || {};
  TRL.setTitle("Endurance Racing");
  TRL.pageHead($("#head"), `${B.fullName || B.name} · ${B.version || ""}`, "Endurance Racing", esc(EN.lede || ""));
  $("#cta-discord").href = D.invite || "#";
  const events = E.enduranceEvents();
  const hl = E.nextHeadline();
  if (hl) { $("#next-kicker").textContent = `Next ${hl.length}`; $("#next-title").textContent = `Next ${hl.length}`; $("#headline").innerHTML = `<article class="headline-race"><div class="hl-round"><small>${hl.hours >= 6 ? hl.hours + " hour" : "Team"}</small><span class="race-len">${esc(hl.length)}</span></div><div><h3><a href="race.html?id=${esc(hl.id)}">${esc(hl.series)} — ${esc(hl.track)}</a></h3><p class="muted" style="margin:0">${esc(hl.track)}<br>${esc(TRL_END.platformName(hl.platform))}<br>${(hl.cars || []).length} car${(hl.cars || []).length === 1 ? "" : "s"} · ${(hl.interested || []).length} interested</p></div><div class="hl-when"><small>Lights out</small><b>${esc(TRL.fmtDate(hl.date))}</b><span>${esc(TRL.fmtTime(hl.date))}</span></div></article>`; }
  else $("#headline").innerHTML = '<div class="empty-state">No headline race scheduled.</div>';
  const cal = $("#calendar");
  const render = () => { cal.innerHTML = events.filter((e) => e.status !== "completed" && (!hl || e.id !== hl.id)).slice(0, 4).map((e) => TRL_END.eventRow(e)).join("") || '<div class="empty-state">No upcoming races.</div>'; };
  render(); TRL.bindInterest(cal, render);
  $("#platforms").innerHTML = (EN.platforms || []).map((p) => `<article class="platform-panel" id="${esc(p.id)}"><p class="kicker">Platform</p><h2>${esc(p.name)}</h2><p>${esc(p.panelText || p.text)}</p></article>`).join("");
});
