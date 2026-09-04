/* About page */
TRL.page("about", function () {
  const { $, esc, img } = TRL;
  const E = TRL.E();
  const C = TRL.cfg();
  const L = C.league || {};
  TRL.setTitle("About");
  $("#about-desc").textContent = L.description || "";
  const seasons = E.seasons();
  const uniqueDrivers = new Set(seasons.flatMap((s) => (s.drivers || []).map((d) => d.id))).size;
  const racesRun = seasons.reduce((n, s) => n + (s.results || []).length, 0);
  $("#about-stats").innerHTML = [[L.established || "", "Established"], [seasons.length, "Seasons"], [uniqueDrivers, "Drivers"], [racesRun, "Races run"]].map(([n, l]) => `<div class="hero__stat"><b>${esc(n)}</b><span>${l}</span></div>`).join("");
  $("#staff").innerHTML = (C.staff || []).map((p) => `<div class="staff-card"><div class="placeholder">${img(p.avatar, "Avatar", { w: 96, h: 96, alt: p.name })}</div><b>${esc(p.name)}</b><span>${esc(p.role)}</span>${p.handle ? `<div class="text-dim" style="font-size:.8rem">@${esc(p.handle)}</div>` : ""}</div>`).join("") || '<p class="text-muted">Add staff in data/config.js.</p>';
  $("#partners").innerHTML = (C.partners || []).map((p) => `<a class="placeholder" href="${esc(p.url || "#")}" title="${esc(p.name)}">${p.logo ? img(p.logo, p.name, { alt: p.name }) : esc(p.name) + " logo"}</a>`).join("") || '<p class="text-muted">Add partners in data/config.js.</p>';
  $("#faq-list").innerHTML = (C.faq || []).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
  $("#about-socials").innerHTML = TRL.socialsHtml();
});
