TRL.page("faq", function () {
  const { $, $$, esc } = TRL; const E = TRL.E(); const B = TRL.cfg().brand || {}; const D = TRL.cfg().discord || {};
  TRL.setTitle("FAQ");
  $("#faq-kicker").textContent = B.fullName || B.name;
  $("#faq-discord").href = D.invite || "#";
  TRL.scrollSpy($$("#faq-toc a[href^='#']"), $$(".faq-section"));
  const s = TRL.season(); const teams = s ? E.teams(s) : []; const drivers = s ? E.drivers(s).filter((d) => !d.unsigned).slice(0, 6) : [];
  const stage = $("#draft-stage");
  const views = {
    pick: () => `<div class="pick-card gold"><div class="lights"><i></i><i></i><i></i><i></i><i class="off"></i></div><p class="kicker">Pick is in</p><h2>Pick is in</h2><p class="muted"><b style="color:var(--text)">${esc(teams[4] ? teams[4].name : "A constructor")}</b> submitted a pick</p><p class="caps muted">Round 1 · Pick 2</p><p class="dim small">Closes automatically</p></div>`,
    reveal: () => { const d = drivers[0]; const t = teams[6]; return `<div class="pick-card"><p class="kicker">Driver selected</p><p class="caps muted">Round 1 · Pick 1</p><h2>${esc(d ? d.name : "Driver")}</h2><p class="team-name" style="--team:${esc(t ? t.color : "#fff")}">${esc(t ? t.name : "Team")}</p></div>`; },
    drivers: () => `<div class="board" style="width:100%">${drivers.map((d, i) => `<div class="board-row"><span class="pick">R1 · P${i + 1}</span><span>${esc(d.name)}</span><span class="team-name" style="--team:${esc((teams[i] || {}).color || "#fff")}">${esc((teams[i] || {}).name || "")}</span></div>`).join("")}</div>`,
    ctors: () => `<div class="board" style="width:100%">${teams.slice(0, 6).map((t, i) => `<div class="board-row" style="--team:${esc(t.color)}"><span class="pick">Pick ${i + 1}</span><span class="team-name">${esc(t.name)}</span><span class="muted">${esc((E.driver(s, t.principal) || {}).name || "TBC")}</span></div>`).join("")}</div>`
  };
  const show = (v) => { stage.innerHTML = views[v](); $$("#draft-tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.view === v ? "true" : "false")); };
  $("#draft-tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(b.dataset.view); });
  show("pick");
});
