TRL.page("endraces", function () {
  const { $, esc } = TRL; const E = TRL.E(); const B = TRL.cfg().brand || {};
  TRL.setTitle("Endurance race calendar");
  TRL.pageHead($("#head"), `Endurance · ${B.version || ""}`, "Race calendar", "6H, 12H, 24H, and 1000km team races first. Filter by series or length, then mark the races you want to run.");
  const all = E.enduranceEvents();
  const series = Array.from(new Set(all.map((e) => e.series))).sort();
  let f = { series: "", len: "headline", when: "upcoming" };
  $("#filters").innerHTML = `<label>Series<select class="select" id="f-series"><option value="">All series</option>${series.map((x) => `<option>${esc(x)}</option>`).join("")}</select></label><label>Length<select class="select" id="f-len"><option value="headline">6H / 12H / 24H / 1000KM</option><option value="">All lengths</option><option value="6H">6H</option><option value="12H">12H</option><option value="24H">24H</option><option value="1000KM">1000KM</option><option value="short">Up to 3H</option><option value="mid">4–8H</option><option value="long">9–16H</option></select></label><label>When<select class="select" id="f-when"><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="">All</option></select></label><span class="section-count" id="count"></span>`;
  const list = $("#list");
  function render() {
    const rows = all.filter((e) => (!f.series || e.series === f.series) && (f.when !== "upcoming" || e.status !== "completed") && (f.when !== "past" || e.status === "completed") && (!f.len || (f.len === "headline" ? e.headline : f.len === "short" ? e.hours <= 3 : f.len === "mid" ? e.hours >= 4 && e.hours <= 8 : f.len === "long" ? e.hours >= 9 && e.hours <= 16 : e.length === f.len)));
    $("#count").textContent = `${rows.length} race${rows.length === 1 ? "" : "s"}`;
    list.innerHTML = rows.map((e) => TRL_END.eventRow(e)).join("") || '<div class="empty-state">No races match those filters.</div>';
  }
  ["series", "len", "when"].forEach((k) => $(`#f-${k}`).addEventListener("change", (e) => { f[k] = e.target.value; render(); }));
  render(); TRL.bindInterest(list, render);
});
