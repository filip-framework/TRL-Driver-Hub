/* Rulebook: fills the regulation values from config + season data */
TRL.page("rulebook", function () {
  const { $, $$, esc, money } = TRL; const E = TRL.E(); const C = TRL.cfg(); const F = C.f1 || {}; const s = TRL.season();
  TRL.setTitle("Rules & Regulations");
  TRL.pageHead($("#head"), `${F.code || "F1"} Championship`, "Rules &amp; Regulations", `Official ${esc(F.name || "F1 championship")} regulations covering administration, finance, sporting operations, racing code, and stewarding.`);
  $$("[data-code]").forEach((el) => { el.textContent = F.code || "F1"; });
  if (F.rulebookSource) { const a = $("#source-link"); a.href = F.rulebookSource; a.classList.remove("hidden"); }
  const ps = E.pointsSystem(s), cap = E.capRules(), lic = E.licenceRules();
  const divs = E.divisions(s), rounds = E.championshipRounds(s), pre = E.preseasonRounds(s);
  $("#schedule-text").textContent = `Races are held on ${F.raceNight || "race night"} at ${F.raceTime || "the published time"}. ${divs.length > 1 ? "Every division races at the same time in its own lobby." : "The championship runs in a single lobby."}`;
  $("#calendar-text").textContent = `${s.name} consists of ${rounds.length} championship rounds${pre.length ? ` and ${pre.length} preseason week dedicated to the driver showcase, which sets contract positions for new drivers` : ""}. The full calendar, with lights-out in your local time, is on the schedule page.`;
  const half = Math.ceil(ps.race.length / 2);
  const ord = (n) => n + (["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
  const rowsOf = (from, to) => `<tr><th>Pos</th>${ps.race.slice(from, to).map((_, i) => `<td>${ord(from + i + 1)}</td>`).join("")}</tr><tr><th>Points</th>${ps.race.slice(from, to).map((p) => `<td><b>${p}</b></td>`).join("")}</tr>`;
  $("#points-table").className = "rule-table"; $("#points-table").innerHTML = `<tbody>${rowsOf(0, half)}${rowsOf(half, ps.race.length)}</tbody>`;
  const b = ps.bonuses || {};
  $("#bonus-list").innerHTML = [b.pole ? `<li><strong>Pole position (+${b.pole})</strong> — the classified driver who starts from first on the grid.</li>` : "", b.fastestLap ? `<li><strong>Fastest lap (+${b.fastestLap})</strong> — the classified driver who sets the fastest race lap, regardless of finishing position.</li>` : "", b.dotd ? `<li><strong>Driver of the day (+${b.dotd})</strong> — chosen by Race Control from the broadcast.</li>` : "", b.mostGained ? `<li><strong>Most positions gained (+${b.mostGained})</strong> — the classified driver who gains the most places from their grid slot; ties go to the better finishing position.</li>` : ""].join("") || "<li>No bonus points this season.</li>";
  $("#licence-text").textContent = `Licence points accumulate through steward rulings and every driver starts the season on zero. Up to ${lic.activeMax} points a licence is Active. From ${lic.activeMax + 1} to ${lic.provisionalMax} it is Provisional: the driver is warned and their next incident is reviewed with their history in mind. At ${lic.provisionalMax + 1} points or more the licence is Suspended and the driver misses the next round. Points reset at the end of the season.`;
  $("#roster-text").textContent = `Each constructor has ${cap.seatsPerTeam} contract positions: ${cap.fullTimePerDivision} full-time drivers in each division it competes in. Reserve drivers sit outside the contract positions and are signed one race at a time.`;
  $("#cap-text").innerHTML = `The salary cap exists to keep the field balanced and to reward good team management. Every constructor has a cap of <strong>${money(cap.limit)}</strong> per season, used only for driver contracts, reserve fees, waiver fees and the adjustments described below.`;
  const table = cap.salaryTable || []; const h2 = Math.ceil(table.length / 2);
  $("#salary-table").className = "rule-table"; $("#salary-table").innerHTML = `<thead><tr><th>Position</th><th>Salary</th><th>Position</th><th>Salary</th></tr></thead><tbody>${Array.from({ length: h2 }, (_, i) => `<tr><td>P${i + 1}</td><td><b>${money(table[i])}</b></td><td>${table[i + h2] != null ? "P" + (i + h2 + 1) : ""}</td><td>${table[i + h2] != null ? "<b>" + money(table[i + h2]) + "</b>" : ""}</td></tr>`).join("")}</tbody>`;
  const pd = cap.performanceDivision ? E.division(s, cap.performanceDivision) : null;
  $("#perf-text").innerHTML = `A driver who finishes the season above their contract position earns a performance adjustment of <strong>${money(cap.performancePerPosition)}</strong> per position gained, charged to the constructor's cap at the end of the season. Finishing below the contract position never refunds money.${pd ? ` Performance adjustments apply to ${esc(pd.name)} contracts.` : ""}`;
  $("#reserve-text").innerHTML = `A reserve is signed for one race at a time for a fee of <strong>${money(cap.reserveFee)}</strong>. Reserves score drivers' points only and their contract expires when the chequered flag falls.`;
  $("#brackets-table").className = "rule-table"; let prev = 0; $("#brackets-table").innerHTML = `<thead><tr><th>Amount over the cap</th><th>Constructors' points deducted</th></tr></thead><tbody>${(cap.overCapBrackets || []).map((x) => { const label = x.upTo === Infinity || x.upTo == null ? `More than ${money(prev)}` : `${money(prev)} to ${money(x.upTo)}`; prev = x.upTo; return `<tr><td>${label}</td><td><b>${x.points}</b></td></tr>`; }).join("")}</tbody>`;
  $("#waiver-text").innerHTML = `Releasing a driver before their contract ends costs the constructor a waiver fee of <strong>${money(cap.waiverFee)}</strong> against the cap. The released driver returns to the free-agent list immediately.`;
  TRL.scrollSpy($$("#toc a[href^='#']"), $$(".rules-body h2, .rules-body h3"));
});
