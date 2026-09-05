/* Teams & contracts */
TRL.page("teams", function () {
  const { $, esc, money } = TRL; const E = TRL.E(); const s = TRL.season(); const rules = E.capRules();
  TRL.setTitle("Teams & contracts");
  const divs = E.divisions(s);
  TRL.pageHead($("#head"), s.name, "Teams &amp; contracts", `The constructors, their driver line-ups, and the numbers shaping the competition. Salary cap is shared across ${divs.map((d) => d.short.replace("DIV", "Div")).join(" and ")}. Open a team for roster and cap detail.`);
  const open = TRL.qs("c");
  $("#teams").innerHTML = E.teams(s).map((t) => {
    const cap = E.teamCap(s, t.id); const principal = t.principal ? E.driver(s, t.principal) : null; const pts = E.teamTotal(s, t.id);
    const scale = Math.max(cap.limit * 1.2, cap.total);
    const seg = (n, cls) => (n > 0 ? `<i class="${cls}" style="width:${(n / scale * 100).toFixed(2)}%"></i>` : "");
    const limitPct = (cap.limit / scale * 100).toFixed(2);
    const rosterRows = cap.roster.map((x) => `<a class="roster-row" href="${TRL.driverUrl(x.driver.id)}"><span class="num">${esc(x.driver.number != null ? x.driver.number : "")}</span><div><b>${esc(x.driver.name)}${x.driver.principal ? ' <span class="chip chip-principal">Principal</span>' : ""}</b><small><span class="div">${esc(x.division ? x.division.name : "")}</span> · Contract P${x.contract ? x.contract.position : "—"} · ${money(x.salary)} · ${x.standing ? x.standing.points : 0} PTS</small></div><div class="roster-now"><small>Now</small><b>${x.standing ? "P" + x.standing.position : "—"}</b>${x.perf ? `<em>+${money(x.perf)}</em>` : ""}</div></a>`).join("");
    const reserves = cap.reserveTx.map((tx) => { const d = E.driver(s, tx.driver); const rr = E.round(s, tx.round); return `<div class="roster-row" style="padding:8px 0"><span class="num" style="color:var(--reserve)">R</span><div><b>${esc(d ? d.name : tx.driver)}</b><small>${rr ? esc(rr.name) : ""} · ${money(tx.amount || rules.reserveFee)}</small></div><div></div></div>`; }).join("");
    return `<details class="team-acc" ${TRL.teamStyle(t)} id="constructor-${esc(t.id)}" ${open === t.id ? "open" : ""}>
      <summary><span class="team-acc-identity">${TRL.ctorMark(t, "md")}<h2>${esc(t.name)}</h2></span><span class="principal"><span class="team-acc-label">Team Principal</span><span class="team-acc-val">${principal ? `${principal.cc ? TRL.flag(principal.cc, principal.nation, "sm") : ""}${esc(principal.name)}` : "TBC"}</span></span><span class="hq"><span class="team-acc-label">Headquarters</span><span class="team-acc-val">${t.hq ? `${esc(t.hq.city)}, ${esc(t.hq.country)} ${TRL.flag(t.hq.cc, t.hq.country, "sm")}` : "—"}</span></span><span class="team-acc-pts">${pts}<small>PTS</small></span><span class="team-acc-cap ${cap.remaining < 0 ? "is-over" : ""}">${cap.remaining < 0 ? money(-cap.remaining) + " over" : money(cap.remaining) + " left"}</span><span class="team-acc-caret"></span></summary>
      <div class="team-acc-body">
        <div class="team-watermark">${TRL.ctorMark(t, "lg")}</div>
        <p class="seats-line">Contract positions <b>${cap.seatsUsed} / ${cap.seats}</b></p>
        <p class="roster-label">Active roster</p>
        ${rosterRows || '<p class="muted">No full-time drivers signed.</p>'}
        <div class="reserve-box"><p class="roster-label is-reserve">Reserves <span>One-race contracts · ${money(rules.reserveFee)}</span></p>${reserves || "<p>No reserve drivers signed.</p>"}</div>
        <p class="cap-title">End of season projected cap</p>
        <p class="cap-lead">Running total as the year unfolds. Performance adjustments and financial penalties are applied at season’s end.</p>
        <div class="cap-stats"><div class="cap-stat remaining"><span>Remaining</span><b>${money(cap.remaining)}</b></div><div class="cap-stat contracts"><span>Contracts</span><b>${money(cap.contracts)}</b></div><div class="cap-stat reserves"><span>Reserves</span><b>${money(cap.reserves)}</b></div><div class="cap-stat waivers"><span>Waivers</span><b>${money(cap.waivers)}</b></div><div class="cap-stat performance"><span>Performance</span><b>${money(cap.performance)}</b></div><div class="cap-stat penalties"><span>Financial penalties</span><b>${money(cap.penalties)}</b></div></div>
        <div class="cap-bar-wrap"><span class="cap-limit" style="left:${limitPct}%">${money(cap.limit)} cap</span><div class="cap-bar" role="img" aria-label="End of season projected cap ${money(cap.total)} of ${money(cap.limit)}. The striped zone past ${money(cap.limit)} incurs financial penalties.">${seg(cap.contracts, "seg-contracts")}${seg(cap.reserves, "seg-reserves")}${seg(cap.waivers, "seg-waivers")}${seg(cap.performance, "seg-performance")}${seg(cap.penalties, "seg-penalties")}<span class="cap-over" style="width:${(100 - limitPct).toFixed(2)}%"></span><span class="cap-marker" style="left:${limitPct}%"></span></div></div>
        <div class="cap-legend"><span><i style="background:var(--blue)"></i>Contracts</span><span><i style="background:var(--reserve)"></i>Reserves</span><span><i style="background:var(--gold)"></i>Waivers</span><span><i style="background:var(--teal)"></i>Performance</span><span><i style="background:var(--red)"></i>Penalties</span></div>
        <p class="cap-note">Spending into the striped zone past ${money(cap.limit)} incurs financial penalties at season’s end.</p>
      </div></details>`;
  }).join("");
  if (open) { const el = document.getElementById(`constructor-${open}`); if (el) setTimeout(() => el.scrollIntoView({ block: "start", behavior: "smooth" }), 50); }
});
