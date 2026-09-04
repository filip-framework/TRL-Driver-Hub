/* Penalties & stewarding */
TRL.page("penalties", function () {
  const { $, esc, link } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  const pp = TRL.cfg().penaltyPoints || { raceBanAt: 12, warningAt: 8, expiryRounds: 12 };
  TRL.setTitle("Penalties");
  TRL.seasonSelect($("#season-select"));
  const tiers = E.tiers(s);
  let tid = "", roundF = TRL.qs("round") || "", driverF = TRL.qs("driver") || "";
  const roundSel = $("#round-filter"), driverSel = $("#driver-filter");
  roundSel.innerHTML = '<option value="">All rounds</option>' + E.rounds(s).map((r) => `<option value="${esc(r.id)}" ${r.id === roundF ? "selected" : ""}>R${r.round} · ${esc(r.name)}</option>`).join("");
  function refreshDrivers() {
    const list = (s.drivers || []).filter((d) => !tid || d.tier === tid).sort((a, b) => a.name.localeCompare(b.name));
    driverSel.innerHTML = '<option value="">All drivers</option>' + list.map((d) => `<option value="${esc(d.id)}" ${d.id === driverF ? "selected" : ""}>${esc(d.name)}</option>`).join("");
    if (!list.some((d) => d.id === driverF)) driverF = "";
  }
  function render() {
    const pens = E.penalties(s, { tier: tid || null, round: roundF || null, driver: driverF || null });
    $("#log-count").textContent = `${pens.length} decision${pens.length === 1 ? "" : "s"}`;
    $("#log").innerHTML = pens.length ? `<table class="table table--compact"><thead><tr><th>Round</th><th>Tier</th><th>Driver</th><th>Involving</th><th class="c">Lap</th><th>Incident</th><th>Decision</th><th class="c">Pts</th><th>Status</th></tr></thead><tbody>${pens.map((p) => { const r = E.round(s, p.round); const t = E.tier(s, p.tier); return `<tr><td><a href="${esc(link("results.html", { tier: p.tier, round: p.round }))}">R${r ? r.round : "?"} ${r ? TRL.flag(r.country) : ""}</a></td><td>${TRL.tierPill(t)}</td><td>${TRL.driverName(s, p.driver)}</td><td>${p.against ? TRL.driverName(s, p.against) : '<span class="text-dim">—</span>'}</td><td class="c">${p.lap || "—"}</td><td style="white-space:normal;min-width:180px">${esc(p.incident)}</td><td>${esc(p.decision)}</td><td class="c">${p.points ? `<span class="badge badge--accent">+${p.points}</span>` : '<span class="text-dim">0</span>'}</td><td><span class="badge ${p.status === "Under review" ? "badge--yellow" : p.status === "Overturned" ? "badge--blue" : "badge--green"}">${esc(p.status || "Decided")}</span></td></tr>`; }).join("")}</tbody></table>` : '<div class="empty">No stewards\' decisions match those filters.</div>';
    // licence table
    const rows = (tid ? [tid] : tiers.map((t) => t.id)).flatMap((id) => E.licenceTable(s, id).map((x) => ({ ...x, tier: E.tier(s, id) }))).filter((x) => x.points > 0).sort((a, b) => b.points - a.points).slice(0, 12);
    $("#licence-note").textContent = `Warning at ${pp.warningAt} points, race ban at ${pp.raceBanAt}. Points expire ${pp.expiryRounds} rounds after they are issued.`;
    $("#licence").innerHTML = rows.length ? rows.map((x) => `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div class="row row--between" style="font-size:.92rem"><span>${TRL.driverName(s, x.driver.id)} ${tid ? "" : TRL.tierPill(x.tier)}</span><b class="${x.points >= pp.raceBanAt ? "delta--down" : x.points >= pp.warningAt ? "" : ""}">${x.points} pts</b></div><div class="licence mt-1"><i style="width:${Math.min(100, (x.points / pp.raceBanAt) * 100)}%"></i></div></div>`).join("") : '<p class="text-muted">Nobody has licence points. Clean racing!</p>';
  }
  roundSel.addEventListener("change", () => { roundF = roundSel.value; TRL.setParam("round", roundF); render(); });
  driverSel.addEventListener("change", () => { driverF = driverSel.value; TRL.setParam("driver", driverF); render(); });
  TRL.tierTabs($("#tier-tabs"), s, (id) => { tid = id; refreshDrivers(); render(); }, { allOption: true });

  // ----- incident form -----
  $("#i-tier").innerHTML = '<option value="">Select…</option>' + tiers.map((t) => `<option value="${esc(t.name)}">${esc(t.name)} (${esc(t.raceDay)}s)</option>`).join("");
  $("#i-round").innerHTML = '<option value="">Select…</option>' + E.rounds(s).filter((r) => E.roundStatus(s, r) !== "upcoming").map((r) => `<option value="R${r.round} ${esc(r.name)}">R${r.round} · ${esc(r.name)}</option>`).join("");
  const form = $("#incident-form"), status = $("#incident-status");
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (form.website && form.website.value) return; // honeypot
    if (!TRL.validateForm(form)) { status.innerHTML = '<div class="alert alert--error">Please fix the highlighted fields.</div>'; return; }
    const fd = new FormData(form);
    const fields = [["Reporter", "reporter"], ["Discord", "discord"], ["Tier", "tier"], ["Round", "round"], ["Lap", "lap"], ["Drivers involved", "against"], ["Description", "description"], ["Clip", "clip"]].map(([name, key]) => ({ name, key, value: fd.get(key) || "" }));
    const btn = form.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Sending…";
    const res = await TRL.submitForm("incident", `Incident report · ${fd.get("tier")} · ${fd.get("round")} · lap ${fd.get("lap")}`, fields);
    btn.disabled = false; btn.textContent = "Submit report";
    if (res.ok) { status.innerHTML = '<div class="alert alert--success">Report received. The stewards will review it and publish a decision on this page.</div>'; form.reset(); }
    else status.innerHTML = `<div class="alert alert--info">${res.fallback ? "This site has no form endpoint configured yet, so" : "The report could not be sent automatically (" + esc(res.error || "") + "), so"} please <a href="${esc(res.mailto)}">send it by email</a> or post it in the stewards' channel on Discord.</div>`;
  });
});
