/* Driver profile */
TRL.page("driver", function () {
  const { $, esc, href } = TRL; const E = TRL.E(); const s = TRL.season(); const id = TRL.qs("id");
  const d = id ? E.driver(s, id) : null;
  const root = $("#profile");
  if (!d) { root.innerHTML = '<div class="state-page"><p class="kicker">Driver</p><h1>Not found</h1><p class="lede" style="margin:0 auto">That driver is not on the list.</p></div>'; return; }
  TRL.setTitle(d.name);
  const t = d.team ? E.team(s, d.team) : null; const dv = d.division ? E.division(s, d.division) : null;
  const st = E.driverStats(s, d.id); const lic = E.licence(s, d); const hist = E.driverHistory(s, d.id);
  const social = (label, url, cls) => `<span class="${url ? "" : "empty"}">${esc(label)} · ${url ? `<a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(url.replace(/^https?:\/\/(www\.)?/, ""))}</a>` : "—"}</span>`;
  root.innerHTML = `
    <section class="driver-hero" ${TRL.teamStyle(t)}>
      <div class="driver-hero-copy">
        ${dv ? TRL.divBadge(dv) : '<span class="chip chip-unsigned">Free agent</span>'}
        <p class="driver-team-line">${t ? `${TRL.ctorMark(t, "sm")}<span>${esc(t.name)}</span>` : "<span>Unsigned</span>"}${d.cc ? `<span class="sep">·</span>${TRL.flag(d.cc, d.nation, "sm")}<span>${esc(d.nation || "")}</span>` : ""}</p>
        <h1 class="driver-name">${esc(d.name)}</h1>
        <div class="social-lines">
          <span>EA · <b>${esc(d.ea || "—")}</b></span>
          <span>Discord · <b>${esc(d.discord && d.discord.handle ? d.discord.handle : "—")}</b></span>
          ${social("Twitch", d.socials && d.socials.twitch)}${social("YouTube", d.socials && d.socials.youtube)}${social("TikTok", d.socials && d.socials.tiktok)}
        </div>
        ${d.bio ? `<p class="muted mt-3" style="max-width:520px">${esc(d.bio)}</p>` : ""}
      </div>
      <div class="driver-hero-visual">${t ? `<div class="watermark">${TRL.ctorMark(t, "lg")}</div>` : ""}${TRL.avatar(d, "xl", t)}</div>
    </section>
    <section class="stat-strip">
      <div class="stat-cell accent"><span>Championship points</span><b>${st.points}</b></div>
      <div class="stat-cell"><span>Race wins</span><b>${st.wins}</b></div>
      <div class="stat-cell"><span>Podiums</span><b>${st.podiums}</b></div>
      <div class="stat-cell"><span>Car number</span><b>#${esc(d.number != null ? d.number : "—")}</b></div>
    </section>
    <section class="licence-panel">
      <div><p class="kicker">Competition eligibility</p><h2>Licence status</h2></div>
      <span class="pill ${lic.status === "Active" ? "pill-green" : lic.status === "Provisional" ? "pill-amber" : "pill-red"}"><i></i>${esc(lic.status)}</span>
      <div class="licence-kv"><span>Licence points</span><b>${lic.points}</b></div>
      <div class="licence-kv"><span>Contract</span><b>${esc(lic.contract)}</b></div>
      <p>Licence points accumulate through steward rulings. Status thresholds: Active (0–${lic.thresholds.activeMax}), Provisional (${lic.thresholds.activeMax + 1}–${lic.thresholds.provisionalMax}), Suspended (${lic.thresholds.provisionalMax + 1}+).${st.position ? ` Currently P${st.position} of ${st.of} in ${esc(st.division ? st.division.name : "the championship")}.` : ""}</p>
    </section>
    <section class="block-tight"><div class="block-head" style="margin-bottom:12px"><div><p class="kicker">Published results</p><h2 style="font-size:1.8rem">Race history</h2></div></div>
      ${hist.length ? `<div class="table-panel history-table"><div class="table-scroll"><table class="data-table"><thead><tr><th>Round</th><th>Race</th><th>Team</th><th class="c">Grid</th><th class="c">Finish</th><th class="r">Pts</th></tr></thead><tbody>${hist.map((h) => `<tr class="${h.row.position === 1 && h.row.status === "Finished" ? "is-p1" : ""}"><td class="round-cell">${h.round.preseason ? "PRE" : "R" + h.round.round}</td><td><a href="${TRL.resultsUrl(h.round.id, h.division ? h.division.id : "d1")}"><b>${TRL.flag(h.round.cc, h.round.location, "sm")} ${esc(h.round.name)}</b></a>${h.row.fastestLap ? ' <span class="chip chip-fl">FL</span>' : ""}${TRL.reserveMark(h.row)}</td><td>${TRL.teamCell(s, h.row.team, { link: false })}</td><td class="c">${h.row.grid || "—"}</td><td class="c ${h.row.position === 1 ? "finish-p1" : ""}">${h.row.status === "Finished" ? h.row.position : esc(h.row.status)}</td><td class="pts-cell">${h.points}</td></tr>`).join("")}</tbody></table></div></div>` : '<p class="muted">No published results yet.</p>'}
    </section>
    <section class="block-tight"><div class="block-head" style="margin-bottom:12px"><div><p class="kicker">Media</p><h2 style="font-size:1.8rem">Highlights</h2></div></div>${(d.highlights || []).length ? `<div class="grid-3">${d.highlights.map((h) => `<a class="panel panel-pad" href="${esc(h.url)}" target="_blank" rel="noreferrer"><b>${esc(h.title)}</b><br><small class="muted">${esc(h.source || "")}</small></a>`).join("")}</div>` : '<p class="muted">No clips or highlights linked yet.</p>'}</section>`;
});
