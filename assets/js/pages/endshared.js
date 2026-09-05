/* Shared endurance renderers (loaded by every endurance page script) */
window.TRL_END = (function () {
  const { esc } = TRL;
  const platformName = (id) => { const p = ((TRL.cfg().endurance || {}).platforms || []).find((x) => x.id === id); return p ? p.name : id; };
  function eventRow(ev, opts) {
    opts = opts || {};
    const who = (ev.interested || []).length ? `<div class="who-list">${ev.interested.slice(0, 6).map((n) => `<span>${esc(n)}</span>`).join("")}${ev.interested.length > 6 ? `<span>+${ev.interested.length - 6}</span>` : ""}</div>` : '<div class="race-status">Nobody has signed up yet</div>';
    return `<article class="race-row is-compact ${ev.status === "next" ? "is-next" : ev.status === "completed" ? "is-done" : "is-upcoming"} ${ev.headline ? "is-headline" : ""}" data-event="${esc(ev.id)}">
      <div class="race-date"><span class="race-month">${esc(TRL.monthShort(ev.date))}</span><span class="race-day">${esc(TRL.dayNum(ev.date))}</span></div>
      <div class="race-round"><span class="caps muted">${ev.type === "team" ? (ev.hours >= 6 ? ev.hours + " hour" : "Team") : "Solo"}</span><span class="race-len ${ev.status === "next" ? "" : ev.hours >= 6 ? "" : "is-white"}">${esc(ev.length)}</span></div>
      <div class="race-main"><div class="race-title"><a href="race.html?id=${esc(ev.id)}">${esc(ev.series)} — ${esc(ev.track)}</a></div><div class="race-venue">${esc(ev.track)}</div><div class="race-status">${esc(platformName(ev.platform))} · ${esc(TRL.fmtTime(ev.date))} · ${ev.status === "next" ? "Next" : ev.status === "completed" ? "Completed" : "Upcoming"}</div>${who}</div>
      <div class="race-side">${opts.noInterest ? `<div class="lights-out"><small>Lights out</small><b>${esc(TRL.fmtDate(ev.date))}</b></div>` : TRL.interestButton(ev)}</div>
    </article>`;
  }
  return { eventRow, platformName };
})();
