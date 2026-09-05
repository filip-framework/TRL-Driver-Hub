/* Race calendar */
TRL.page("schedule", function () {
  const { $, esc } = TRL; const E = TRL.E(); const s = TRL.season(); const B = TRL.cfg().brand || {};
  TRL.setTitle("Race calendar");
  TRL.pageHead($("#head"), s.name, "Race calendar", "From iconic high-speed temples to technical street circuits. Published rounds show the winner and open the official classification.");
  const pre = E.preseasonRounds(s), champ = E.championshipRounds(s);
  const next = E.nextRound(s);
  const list = (rs) => `<div class="race-list">${rs.map((r) => TRL.raceRow(s, r, { next: next && next.id === r.id })).join("")}</div>`;
  $("#groups").innerHTML = (pre.length ? `<section><div class="cal-group-head is-preseason"><h2>Preseason</h2><span>Showcase · no championship points</span></div>${list(pre)}</section>` : "") + `<section><div class="cal-group-head is-season"><h2>Championship season</h2><span>${champ.length} rounds</span></div>${list(champ)}</section>`;
  $("#ics").addEventListener("click", () => {
    const pad = (n) => String(n).padStart(2, "0"); const stamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const escT = (x) => String(x || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${escT(B.name)}//Driver Hub//EN`, "CALSCALE:GREGORIAN", `X-WR-CALNAME:${escT(B.name)} ${escT(s.name)}`];
    E.rounds(s).forEach((r) => { if (!r.date) return; const st = new Date(r.date), en = new Date(st.getTime() + 2 * 3600000); lines.push("BEGIN:VEVENT", `UID:${s.id}-${r.id}@${(location.hostname || "driver-hub").replace(/[^a-z0-9.-]/gi, "")}`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(st)}`, `DTEND:${stamp(en)}`, `SUMMARY:${escT(`${B.name} F1 · ${r.preseason ? "Preseason" : "R" + r.round} ${r.name}`)}`, `LOCATION:${escT(`${r.circuit}, ${r.location}`)}`, "END:VEVENT"); });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${(B.name || "league").toLowerCase()}-${s.id}.ics`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  });
});
