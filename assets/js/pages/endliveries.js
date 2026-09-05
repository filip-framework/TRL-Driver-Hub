TRL.page("endliveries", function () {
  const { $, esc } = TRL; const B = TRL.cfg().brand || {}; const list = ((window.TRL_DATA || {}).endurance || {}).liveries || [];
  TRL.setTitle("Liveries");
  TRL.pageHead($("#head"), `Endurance · ${B.version || ""}`, "Liveries", `Club cars and ${esc(B.name)} paints, grouped by class. Numbers and lineups are set from Endurance Ops.`);
  const groups = {}; list.forEach((l) => { (groups[l.class || "Other"] = groups[l.class || "Other"] || []).push(l); });
  $("#liveries").innerHTML = list.length ? Object.keys(groups).map((cls) => `<section class="block-tight"><div class="block-head"><div><p class="kicker">Class</p><h2>${esc(cls)}</h2></div></div><div class="grid-3">${groups[cls].map((l) => `<article class="panel"><div class="placeholder" style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:var(--muted)">${l.image ? `<img src="${esc(TRL.ROOT + l.image)}" alt="${esc(l.name)}">` : "Livery image"}</div><div class="panel-pad"><b>#${esc(l.number || "—")} ${esc(l.name)}</b><br><small class="muted">${esc(l.car || "")} · ${(l.drivers || []).map(esc).join(", ")}</small></div></article>`).join("")}</div></section>`).join("") : `<div class="empty-state">No ${esc(B.name)} liveries published yet.</div>`;
});
