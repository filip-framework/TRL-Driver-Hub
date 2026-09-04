/* News list + article view */
TRL.page("news", function () {
  const { $, esc, img } = TRL;
  const items = ((window.TRL_DATA || {}).news || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const id = TRL.qs("id");
  const card = (n) => `<a class="card card--flush card--link news-card" href="news.html?id=${encodeURIComponent(n.id)}"><div class="news-card__img placeholder">${img(n.image, "Article image", { w: 640, h: 360, alt: n.title })}</div><div class="news-card__body"><div class="news-card__meta"><span class="badge badge--accent">${esc(n.category)}</span><span>${esc(TRL.fmtDate(n.date))}</span></div><h3 class="news-card__title">${esc(n.title)}</h3><p class="text-muted" style="font-size:.92rem">${esc(n.excerpt)}</p></div></a>`;
  if (id) {
    const n = items.find((x) => x.id === id);
    if (!n) { $("#news-body").innerHTML = '<div class="empty">Article not found. <a href="news.html">Back to news</a>.</div>'; return; }
    TRL.setTitle(n.title);
    $("#news-title").textContent = n.title;
    $("#news-lead").innerHTML = `<span class="badge badge--accent">${esc(n.category)}</span> &nbsp;${esc(TRL.fmtDate(n.date))}${n.author ? ` · ${esc(n.author)}` : ""}`;
    $("#news-filters").innerHTML = '<a class="btn btn--ghost btn--sm" href="news.html">← All news</a>';
    const more = items.filter((x) => x.id !== id).slice(0, 3);
    $("#news-body").innerHTML = `<div class="sidebar-layout"><article class="article"><div class="article__hero placeholder">${img(n.image, "Article image", { w: 1200, h: 514, alt: n.title })}</div><div class="prose">${n.body || `<p>${esc(n.excerpt)}</p>`}</div></article><aside class="stack"><h3>More news</h3>${more.map(card).join("")}</aside></div>`;
    return;
  }
  TRL.setTitle("News");
  const cats = Array.from(new Set(items.map((n) => n.category))).sort();
  let cat = "";
  const render = () => { const list = items.filter((n) => !cat || n.category === cat); $("#news-body").innerHTML = list.length ? `<div class="grid grid--3">${list.map(card).join("")}</div>` : '<div class="empty">No articles yet.</div>'; };
  $("#news-filters").innerHTML = `<div class="seg" id="cat-seg"><button data-cat="" aria-pressed="true">All</button>${cats.map((c) => `<button data-cat="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("")}</div>`;
  $("#cat-seg").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (!b) return; cat = b.dataset.cat; Array.from($("#cat-seg").children).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); render(); });
  render();
});
