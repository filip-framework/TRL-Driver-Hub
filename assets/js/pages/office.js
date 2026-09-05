TRL.page("office", function () {
  const { $, $$, esc, href, money } = TRL; const E = TRL.E(); const A = TRL.auth; const C = TRL.cfg(); const s = TRL.season();
  TRL.setTitle("Team Principal");
  const root = $("#office");
  const session = A.session();
  const demo = TRL.qs("demo") === "1";
  const rules = E.capRules();
  if (!session && !demo) {
    root.innerHTML = `<div class="state-page"><p class="kicker">${esc((C.f1 || {}).code || "F1")} Race Control</p><h1>Team office</h1><p class="lede" style="margin:0 auto 24px">Sign in with Discord to open the constructor linked to your Team Principal role.</p><div class="actions" style="justify-content:center"><a class="btn btn-discord" href="${A.enabled() ? esc(A.signInUrl(location.href)) : esc(href("login.html"))}">Sign in with Discord</a><a class="btn" href="?demo=1">Preview the office</a></div></div>`;
    return;
  }
  // find the constructor: principal whose Discord handle matches the signed-in user, otherwise the first team (demo)
  let team = null;
  if (session) team = E.teams(s).find((t) => { const p = E.driver(s, t.principal); return p && p.discord && (p.discord.id === session.id || (p.discord.handle || "").toLowerCase() === (session.username || "").toLowerCase()); }) || null;
  if (!team) team = E.teams(s)[0];
  const cap = E.teamCap(s, team.id);
  const divs = E.divisions(s);
  const seats = divs.flatMap((dv) => { const r = E.roster(s, team.id, dv.id); return Array.from({ length: rules.fullTimePerDivision || 2 }, (_, i) => ({ dv, driver: r[i] || null, i })); });
  root.innerHTML = `
    <section class="page-head"><p class="kicker">Team Principal office${session ? ` · ${esc(session.name)}` : " · Preview"}</p><h1 style="color:${esc(team.color)}">${esc(team.name)}</h1><p class="lede">Your constructor’s seats, cap and roster actions. Requests are sent to Race Control for approval.</p></section>
    <div class="office-grid">
      <div>
        <div class="panel panel-pad">
          <div class="block-head" style="margin-bottom:10px"><div><p class="kicker">Roster</p><h2 style="font-size:1.6rem">Division seats</h2></div><span class="section-count">${cap.seatsUsed} / ${cap.seats} contract positions</span></div>
          ${seats.map((x) => `<div class="seat-row"><span class="seat">${esc(x.dv.short)}<br>Seat ${x.i + 1}</span><div>${x.driver ? `<b>${esc(x.driver.name)}</b><br><small class="muted">Contract P${x.driver.contract ? x.driver.contract.position : "—"} · ${money(x.driver.contract ? x.driver.contract.salary : 0)}${x.driver.principal ? " · Principal" : ""}</small>` : '<span class="muted">Open seat</span>'}</div><div class="actions">${x.driver ? `<button class="btn btn-compact" type="button" data-action="waive" data-driver="${esc(x.driver.id)}" data-div="${esc(x.dv.id)}">Waive</button>` : `<button class="btn btn-compact btn-primary" type="button" data-action="sign" data-div="${esc(x.dv.id)}">Request signing</button>`}<button class="btn btn-compact" type="button" data-action="reserve" data-div="${esc(x.dv.id)}">Sign reserve</button></div></div>`).join("")}
        </div>
        <div class="panel panel-pad mt-2" id="action-panel" hidden></div>
        <div class="panel panel-pad mt-2"><div class="block-head" style="margin-bottom:10px"><div><p class="kicker">Draft</p><h2 style="font-size:1.6rem">Draft room</h2></div></div><p class="muted">Constructor night and driver night open here when Race Control starts the session.</p><button class="btn" type="button" disabled>Enter Draft Room</button></div>
      </div>
      <aside class="panel panel-pad">
        <p class="cap-title">Salary cap</p>
        <div class="cap-stats" style="grid-template-columns:1fr 1fr"><div class="cap-stat remaining"><span>Remaining</span><b>${money(cap.remaining)}</b></div><div class="cap-stat contracts"><span>Contracts</span><b>${money(cap.contracts)}</b></div><div class="cap-stat reserves"><span>Reserves</span><b>${money(cap.reserves)}</b></div><div class="cap-stat waivers"><span>Waivers</span><b>${money(cap.waivers)}</b></div><div class="cap-stat performance"><span>Performance</span><b>${money(cap.performance)}</b></div><div class="cap-stat penalties"><span>Penalties</span><b>${money(cap.penalties)}</b></div></div>
        <p class="cap-note">${money(cap.limit)} cap · reserve ${money(rules.reserveFee)} per race · waiver fee ${money(rules.waiverFee)}.</p>
        <p class="kicker mt-3">Pending requests</p><p class="muted small" id="pending">None. Actions you send here appear until Race Control decides.</p>
        <a class="block-link" href="${href("f1/teams.html?c=" + encodeURIComponent(team.id))}">Public team page →</a>
      </aside>
    </div>`;
  const panel = $("#action-panel");
  const pending = [];
  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-action]"); if (!b) return;
    const action = b.dataset.action; const dv = E.division(s, b.dataset.div);
    const fa = E.freeAgents(s);
    if (action === "waive") {
      const d = E.driver(s, b.dataset.driver);
      panel.hidden = false; panel.innerHTML = `<p class="kicker">Waive driver</p><p>Waive <b>${esc(d.name)}</b> from ${esc(dv.name)}? The ${money(rules.waiverFee)} waiver fee is applied to your cap.</p><div class="actions"><button class="btn btn-primary" type="button" id="confirm">Send request</button><button class="btn" type="button" id="cancel">Cancel</button></div>`;
      $("#confirm").onclick = () => send(`Waive ${d.name}`, [["Constructor", team.name], ["Division", dv.name], ["Driver", d.name], ["Fee", money(rules.waiverFee)]]);
    } else {
      const title = action === "sign" ? "Request full-time signing" : "Sign one-race reserve";
      panel.hidden = false; panel.innerHTML = `<p class="kicker">${title}</p><div class="form-grid"><div class="field"><label>Free agent</label><select class="select" id="fa">${fa.map((d) => `<option value="${esc(d.id)}">${esc(d.name)}${d.role === "reserve" ? " (reserve)" : ""}</option>`).join("")}</select></div><div class="field"><label>${action === "sign" ? "Contract position" : "Round"}</label>${action === "sign" ? `<input id="pos" type="number" min="1" max="${rules.salaryTable.length}" value="${Math.min(rules.salaryTable.length, cap.seatsUsed + 10)}">` : `<select class="select" id="rnd">${E.championshipRounds(s).filter((r) => E.roundStatus(s, r) !== "completed").map((r) => `<option value="${esc(r.id)}">R${r.round} · ${esc(r.name)}</option>`).join("")}</select>`}</div></div><p class="muted small mt-2" id="quote"></p><div class="actions mt-2"><button class="btn btn-primary" type="button" id="confirm">Send request</button><button class="btn" type="button" id="cancel">Cancel</button></div>`;
      const quote = () => { const pos = Number(($("#pos") || {}).value || 0); $("#quote").textContent = action === "sign" ? `Salary for P${pos}: ${money(E.salaryFor(pos))} · remaining after signing: ${money(cap.remaining - E.salaryFor(pos))}` : `Reserve fee: ${money(rules.reserveFee)} · remaining after: ${money(cap.remaining - rules.reserveFee)}`; };
      quote(); if ($("#pos")) $("#pos").addEventListener("input", quote);
      $("#confirm").onclick = () => { const d = E.driver(s, $("#fa").value); send(`${title}: ${d.name}`, [["Constructor", team.name], ["Division", dv.name], ["Driver", d.name], action === "sign" ? ["Contract position", `P${$("#pos").value} (${money(E.salaryFor(Number($("#pos").value)))})`] : ["Round", $("#rnd").selectedOptions[0].textContent]]); };
    }
    $("#cancel").onclick = () => { panel.hidden = true; };
  });
  async function send(title, rows) {
    const fields = rows.map(([name, value]) => ({ name, value })); fields.push({ name: "Requested by", value: session ? `${session.name} (${session.username})` : "Preview mode" });
    const res = await TRL.submitForm("office", `TP request · ${title}`, fields);
    pending.push(title); $("#pending").innerHTML = pending.map((p) => `<span class="chip chip-principal" style="margin:0 6px 6px 0">${esc(p)}</span>`).join("");
    panel.innerHTML = res.ok ? `<div class="notice ok">Request sent to Race Control: ${esc(title)}.</div>` : `<div class="notice info">No office webhook is configured yet, so this request was recorded here only. <a href="${esc(res.mailto)}">Email it to Race Control</a> or post it in Discord.</div>`;
  }
});
