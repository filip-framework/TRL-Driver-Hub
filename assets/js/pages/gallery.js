/* Gallery with lightbox */
TRL.page("gallery", function () {
  const { $, $$, esc, img } = TRL;
  const E = TRL.E();
  const s = TRL.season();
  TRL.setTitle("Gallery");
  const items = ((window.TRL_DATA || {}).gallery || []).slice();
  const tiers = s ? E.tiers(s) : [];
  let filter = "", list = items, current = 0;
  const render = () => {
    list = items.filter((g) => !filter || g.tier === filter);
    $("#gallery").innerHTML = list.length ? list.map((g, i) => { const r = s && g.round ? E.round(s, g.round) : null; return `<button class="gallery__item placeholder" type="button" data-index="${i}" aria-label="Open ${esc(g.title)}">${img(g.image, "Photo", { w: 480, h: 360, alt: g.title })}<figcaption>${esc(g.title)}${r ? ` · R${r.round}` : ""}</figcaption></button>`; }).join("") : '<div class="empty" style="grid-column:1/-1">No images yet.</div>';
  };
  $("#gallery-filters").innerHTML = `<div class="seg" id="tier-seg"><button data-tier="" aria-pressed="true">All</button>${tiers.map((t) => `<button data-tier="${esc(t.id)}" aria-pressed="false">${esc(t.name)}</button>`).join("")}</div>`;
  $("#tier-seg").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (!b) return; filter = b.dataset.tier; Array.from($("#tier-seg").children).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); render(); });
  const lb = $("#lightbox");
  const show = (i) => {
    current = (i + list.length) % list.length; const g = list[current]; const r = s && g.round ? E.round(s, g.round) : null; const t = s && g.tier ? E.tier(s, g.tier) : null;
    $("#lightbox-img").innerHTML = img(g.image, g.title, { w: 1280, h: 720, alt: g.title });
    $("#lightbox-caption").innerHTML = `<b>${esc(g.title)}</b>${g.caption ? ` — ${esc(g.caption)}` : ""}${r ? ` · Round ${r.round}` : ""}${t ? ` · ${esc(t.name)}` : ""} <span class="text-dim">(${current + 1}/${list.length})</span>`;
    lb.classList.add("is-open"); $(".lightbox__close", lb).focus();
  };
  const close = () => lb.classList.remove("is-open");
  $("#gallery").addEventListener("click", (ev) => { const b = ev.target.closest("[data-index]"); if (b) show(Number(b.dataset.index)); });
  $(".lightbox__close", lb).addEventListener("click", close);
  $(".lightbox__nav--prev", lb).addEventListener("click", () => show(current - 1));
  $(".lightbox__nav--next", lb).addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", (ev) => { if (ev.target === lb) close(); });
  document.addEventListener("keydown", (ev) => { if (!lb.classList.contains("is-open")) return; if (ev.key === "Escape") close(); if (ev.key === "ArrowLeft") show(current - 1); if (ev.key === "ArrowRight") show(current + 1); });
  render();
});
