/* Calendar page */
TRL.page("calendar", function () {
  const { $, esc, link } = TRL;
  const E = TRL.E();
  const L = TRL.cfg().league || {};
  const s = TRL.season();
  TRL.setTitle("Calendar");
  TRL.seasonSelect($("#season-select"));
  const tiers = E.tiers(s);
  $("#intro").textContent = `${s.name} · ${s.rounds.length} rounds. ${tiers.map((t) => `${t.name} races on ${t.raceDay}s at ${t.raceTime}`).join(", ")}. All times below are converted to your timezone (${TRL.tz()}).`;
  let tid = "";
  function render() {
    const shown = tid ? [E.tier(s, tid)] : tiers;
    const next = E.nextSession(s, tid || null);
    $("#rounds").innerHTML = E.rounds(s).map((r) => {
      const status = E.roundStatus(s, r, tid || null);
      const isNext = next && next.round.id === r.id;
      const winners = tiers.filter((t) => !tid || t.id === tid).map((t) => { const sh = E.sheet(s, r.id, t.id); const w = sh && (sh.race || [])[0]; return w ? `<span>${TRL.tierPill(t)} <b>${TRL.driverName(s, w.driver, { flag: false })}</b> won</span>` : ""; }).join("");
      return `<div class="round round--${status} ${isNext ? "round--next" : ""}" id="${esc(r.id)}">
        <div class="round__no">Round<b>${r.round}</b></div>
        <div>
          <div class="round__title">${TRL.flag(r.country)} ${esc(r.name)}</div>
          <div class="round__meta"><span>${esc(r.circuit)}, ${esc(r.location)}</span><span>${r.laps} laps · ${esc(r.format || "")}</span>${r.sprint ? '<span class="badge badge--purple">Sprint weekend</span>' : ""}</div>
          <div class="round__sessions">${shown.map((t) => { const d = E.sessionDate(s, r, t.id); const st = E.roundStatus(s, r, t.id); return `<span>${TRL.tierPill(t)} <b>${esc(TRL.fmtDate(d))} · ${esc(TRL.fmtTime(d))}</b>${st === "completed" ? ' <span class="badge badge--green" style="padding:1px 6px">Done</span>' : st === "live" ? ' <span class="badge badge--accent" style="padding:1px 6px">Live</span>' : ""}</span>`; }).join("")}</div>
          ${winners ? `<div class="round__sessions">${winners}</div>` : ""}
          <details class="mt-2"><summary class="text-muted" style="cursor:pointer;font-size:.88rem">Circuit info</summary><div class="two-col mt-2"><div class="track-map placeholder"><img src="${esc(r.map || "assets/img/track-placeholder.svg")}" alt="${esc(r.circuit)} track map placeholder" loading="lazy"></div><dl class="dl"><dt>Circuit</dt><dd>${esc(r.circuit)}</dd><dt>Location</dt><dd>${esc(r.location)}, ${esc(r.countryName || r.country)}</dd><dt>Length</dt><dd>${r.length ? r.length.toFixed(3) + " km" : "—"}</dd><dt>Race distance</dt><dd>${r.laps} laps (${esc(r.format || "")} of ${r.fullLaps || "?"})</dd>${r.notes ? `<dt>Notes</dt><dd>${esc(r.notes)}</dd>` : ""}</dl></div></details>
        </div>
        <div class="round__actions">
          ${TRL.statusBadge(isNext ? (status === "live" ? "live" : "next") : status)}
          ${status === "completed" || (!tid && tiers.some((t) => E.sheet(s, r.id, t.id))) ? `<a class="btn btn--ghost btn--sm" href="${esc(link("results.html", { tier: tid || tiers[0].id, round: r.id }))}">Results</a>` : ""}
          ${status !== "completed" ? `<button class="btn btn--ghost btn--sm" type="button" data-ics="${esc(r.id)}">${TRL.icon("calendar")} Add</button>` : ""}
        </div>
      </div>`;
    }).join("");
  }
  $("#rounds").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ics]"); if (!b) return;
    TRL.download(`${(L.name || "league").toLowerCase()}-${s.id}-${b.dataset.ics}.ics`, TRL.icsForSeason(s, tid || null, b.dataset.ics), "text/calendar");
  });
  $("#ics-season").addEventListener("click", () => TRL.download(`${(L.name || "league").toLowerCase()}-${s.id}-${tid || "all-tiers"}.ics`, TRL.icsForSeason(s, tid || null), "text/calendar"));
  TRL.tierTabs($("#tier-tabs"), s, (id) => { tid = id; render(); }, { allOption: true });
});
