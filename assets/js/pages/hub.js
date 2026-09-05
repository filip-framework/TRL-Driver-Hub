/* Hub home */
TRL.page("hub", function () {
  const { $, esc } = TRL; const E = TRL.E(); const C = TRL.cfg(); const B = C.brand || {}, F = C.f1 || {}, EN = C.endurance || {}, D = C.discord || {};
  const s = TRL.season();
  TRL.setTitle("");
  $("#hero-kicker").textContent = B.fullName || B.name;
  $("#hero-title").innerHTML = `${esc(B.heroLine1 || "One league.")}<br><em class="hot">${esc(B.heroLine2 || "Every grid.")}</em>`;
  $("#hero-desc").textContent = B.description || "";
  $("#f1-code").textContent = F.code || "F1";
  $("#open-f1").textContent = `Open ${F.code || "F1"} →`;
  $("#feature-title").textContent = F.featureTitle || "Full league operations";
  $("#cta-name").textContent = B.name || "us";
  $("#cta-discord").href = D.invite || "#";
  const divs = s ? E.divisions(s) : [];
  $("#feature-text").innerHTML = `<b style="color:var(--text)">${divs.length === 1 ? "One division" : `${divs.length} divisions`}</b>, ${esc(F.featureText || "")}`;
  const rounds = s ? E.championshipRounds(s) : [];
  const platforms = (EN.platforms || []).map((p) => p.name.replace("Le Mans Ultimate", "LMU")).join(" + ");
  $("#season-strip").innerHTML = [`F1 ${esc(s ? s.name : "Season")}`, `${rounds.length} F1 rounds`, EN.enabled === false ? "" : `Endurance · ${esc(platforms)}`, "Community first"].filter(Boolean).map((x) => `<span>${x}</span>`).join("");
  const next = s ? E.nextRound(s) : null;
  $("#feature-aside").innerHTML = next ? `<p class="kicker">Next F1 round</p><div class="big-round">${next.preseason ? "PRE" : "R" + next.round}</div><h4>${esc(next.name)}</h4><p>${esc(next.circuit)}<br>${esc(next.location)}</p>${TRL.forecastBox(next)}<a class="block-link" href="f1/schedule.html" style="margin-top:12px">Full F1 schedule →</a>` : `<p class="kicker">Season complete</p><h4>Every round is in the books.</h4><a class="block-link" href="f1/standings.html">Final standings →</a>`;
  if (EN.enabled === false) { $("#endurance-block").classList.add("hidden"); $("#hero-endurance").classList.add("hidden"); $("#cta-endurance").classList.add("hidden"); }
  else $("#venture-grid").innerHTML = (EN.platforms || []).map((p) => `<article class="venture-panel"><p class="kicker">${esc(p.name)}</p><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><a class="block-link" href="endurance/index.html#${esc(p.id)}">Learn more →</a></article>`).join("");
});
