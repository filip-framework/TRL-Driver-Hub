/* =============================================================
   TRL Driver Hub — shared runtime
   Header/footer, navigation, helpers, placeholders, forms.
   Pages register themselves with TRL.page("name", fn) and are
   run on DOMContentLoaded when <body data-page="name">.
   ============================================================= */
window.TRL = (function () {
  "use strict";
  const pages = {};
  const cfg = () => window.TRL_CONFIG || { league: {} };
  const E = () => window.TRL_ENGINE;

  // ---------- tiny DOM helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const html = (el, markup) => { el.innerHTML = markup; return el; };
  const pref = (k, v) => { try { if (v === undefined) return localStorage.getItem("trl." + k); localStorage.setItem("trl." + k, v); } catch (e) { return null; } };

  // ---------- season / tier selection ----------
  function season() { const id = qs("season"); return id ? E().getSeason(id) : E().currentSeason(); }
  function tierId(seasonObj) {
    const list = E().tiers(seasonObj);
    const wanted = qs("tier") || pref("tier");
    return (list.find((t) => t.id === wanted) || list[0] || {}).id || null;
  }
  function link(pageName, params) {
    const p = new URLSearchParams();
    const s = qs("season"); if (s) p.set("season", s);
    Object.entries(params || {}).forEach(([k, v]) => { if (v != null && v !== "") p.set(k, v); });
    const q = p.toString();
    return pageName + (q ? "?" + q : "");
  }
  function setParam(k, v) {
    const url = new URL(location.href);
    if (v == null || v === "") url.searchParams.delete(k); else url.searchParams.set(k, v);
    history.replaceState(null, "", url.toString());
  }

  // ---------- formatting ----------
  const DATE_OPTS = { weekday: "short", day: "numeric", month: "short", year: "numeric" };
  function fmtDate(d, opts) { d = d instanceof Date ? d : new Date(d); return isNaN(d) ? "TBC" : d.toLocaleDateString(undefined, opts || DATE_OPTS); }
  function fmtTime(d) { d = d instanceof Date ? d : new Date(d); return isNaN(d) ? "TBC" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }); }
  function fmtDateTime(d) { return `${fmtDate(d)} · ${fmtTime(d)}`; }
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return "local time"; } }
  function flag(cc) {
    if (!cc || cc.length !== 2) return "";
    const base = 0x1f1e6;
    return String.fromCodePoint(base + cc.toUpperCase().charCodeAt(0) - 65, base + cc.toUpperCase().charCodeAt(1) - 65);
  }
  const ordinal = (n) => n + (["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  // ---------- placeholder art ----------
  function placeholderSrc(label, w, h, color, accent) {
    w = w || 600; h = h || 400; color = color || "#1c2030";
    const stripe = "#232839";
    const size = Math.max(12, Math.min(Math.min(w, h) / 11, (w * 0.86) / (Math.max(6, String(label).length) * 0.64)));
    const band = accent ? `<rect x="0" y="${h - Math.round(h * 0.12)}" width="${w}" height="${Math.round(h * 0.12)}" fill="${accent}"/>` : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="28" fill="${color}"/><rect x="14" width="14" height="28" fill="${stripe}"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/>${band}<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" fill="none" stroke="#353b52" stroke-width="2" stroke-dasharray="7 7"/><text x="50%" y="50%" fill="#7a819c" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">${esc(label).toUpperCase()}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  /** <img> that shows the real image when one is set, otherwise a labelled placeholder. */
  function img(src, label, opts) {
    opts = opts || {};
    const s = src || placeholderSrc(label, opts.w, opts.h, opts.color, opts.accent);
    return `<img src="${esc(s)}" alt="${esc(opts.alt || label)}" loading="lazy" ${opts.className ? `class="${esc(opts.className)}"` : ""}>`;
  }

  // ---------- entity rendering ----------
  function teamOf(seasonObj, teamId) { return E().team(seasonObj, teamId); }
  function teamColor(seasonObj, teamId) { const t = teamOf(seasonObj, teamId); return (t && t.color) || "#6b7290"; }
  function teamDot(seasonObj, teamId) { return `<span class="team-dot" style="background:${esc(teamColor(seasonObj, teamId))}"></span>`; }
  function driverName(seasonObj, driverId, opts) {
    opts = opts || {};
    const d = E().driver(seasonObj, driverId) || (E().driverAnySeason(driverId) || {}).driver;
    const name = d ? d.name : driverId;
    const parts = [];
    if (opts.flag !== false && d) parts.push(`<span class="flag" aria-hidden="true">${flag(d.nationality)}</span>`);
    parts.push(`<a href="${esc(link("driver.html", { id: driverId }))}">${esc(name)}</a>`);
    if (opts.number && d) parts.push(` <span class="num">#${d.number}</span>`);
    if (opts.reserve && d && d.role === "reserve") parts.push(` <span class="badge" title="Reserve driver">R</span>`);
    return parts.join("");
  }
  function teamName(seasonObj, teamId, opts) {
    opts = opts || {};
    const t = teamOf(seasonObj, teamId);
    if (!t) return `<span class="text-dim">—</span>`;
    return `${opts.dot !== false ? teamDot(seasonObj, teamId) : ""}<a href="${esc(link("team.html", { id: teamId }))}">${esc(opts.short ? t.shortName : t.name)}</a>`;
  }
  function tierPill(t) { return t ? `<span class="tier-pill" style="background:${esc(t.color || "#6b7290")}">${esc(t.shortName || t.name)}</span>` : ""; }
  function posBadge(position, status) {
    if (status && status !== "Finished") return `<span class="pos pos--dnf">${esc(status)}</span>`;
    const cls = position <= 3 ? ` pos--${position}` : "";
    return `<span class="pos${cls}">${position == null ? "—" : position}</span>`;
  }
  function movement(m) {
    if (!m) return `<span class="delta delta--same" title="No change">–</span>`;
    return m > 0 ? `<span class="delta delta--up" title="Up ${m}">▲${m}</span>` : `<span class="delta delta--down" title="Down ${-m}">▼${-m}</span>`;
  }
  function statusBadge(status) {
    const map = { completed: ["Completed", ""], live: ["Live now", "badge--accent"], next: ["Next race", "badge--gold"], upcoming: ["Upcoming", "badge--blue"], pending: ["Results pending", "badge--yellow"] };
    const m = map[status] || [status, ""];
    return `<span class="badge ${m[1]}">${esc(m[0])}</span>`;
  }

  // ---------- season selector ----------
  function seasonSelect(el) {
    if (!el) return;
    const cur = season();
    el.innerHTML = E().seasons().map((s) => `<option value="${esc(s.id)}" ${s.id === cur.id ? "selected" : ""}>${esc(s.name)} · ${esc(s.year)}</option>`).join("");
    el.addEventListener("change", () => {
      const url = new URL(location.href);
      const isCurrent = E().currentSeason() && E().currentSeason().id === el.value;
      if (isCurrent) url.searchParams.delete("season"); else url.searchParams.set("season", el.value);
      location.href = url.toString();
    });
  }
  /** Tier tabs: calls onChange(tierId) and keeps ?tier= in sync. */
  function tierTabs(el, seasonObj, onChange, opts) {
    opts = opts || {};
    const list = E().tiers(seasonObj);
    let active = opts.allOption ? (qs("tier") || "") : tierId(seasonObj);
    const render = () => {
      el.innerHTML = (opts.allOption ? [{ id: "", name: "All tiers", shortName: "All" }] : []).concat(list).map((t) => `<button class="tab" role="tab" aria-selected="${(t.id || "") === (active || "") ? "true" : "false"}" data-tier="${esc(t.id)}">${esc(t.name)}</button>`).join("");
    };
    render();
    el.setAttribute("role", "tablist");
    el.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-tier]"); if (!b) return;
      active = b.dataset.tier;
      if (active) pref("tier", active);
      setParam("tier", active);
      render(); onChange(active);
    });
    onChange(active);
    return { get: () => active };
  }

  // ---------- countdown ----------
  function countdown(target, el, onDone) {
    const t = target instanceof Date ? target.getTime() : new Date(target).getTime();
    const units = { d: $('[data-unit="d"]', el), h: $('[data-unit="h"]', el), m: $('[data-unit="m"]', el), s: $('[data-unit="s"]', el) };
    let timer = null;
    const tick = () => {
      let diff = Math.max(0, t - Date.now());
      const d = Math.floor(diff / 86400000); diff -= d * 86400000;
      const h = Math.floor(diff / 3600000); diff -= h * 3600000;
      const m = Math.floor(diff / 60000); diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      if (units.d) units.d.textContent = String(d);
      if (units.h) units.h.textContent = String(h).padStart(2, "0");
      if (units.m) units.m.textContent = String(m).padStart(2, "0");
      if (units.s) units.s.textContent = String(s).padStart(2, "0");
      if (t - Date.now() <= 0) { clearInterval(timer); if (onDone) onDone(); }
    };
    tick(); timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }
  const countdownMarkup = () => ["d", "h", "m", "s"].map((u) => `<div class="countdown__unit"><b data-unit="${u}">0</b><span>${{ d: "Days", h: "Hours", m: "Min", s: "Sec" }[u]}</span></div>`).join("");

  // ---------- iCal export ----------
  function icsForSeason(seasonObj, onlyTier, onlyRound) {
    const L = cfg().league || {};
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const escT = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${escT(L.name || "League")}//Driver Hub//EN`, "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escT(L.name || "League")} ${escT(seasonObj.name)}`];
    E().rounds(seasonObj).forEach((r) => {
      if (onlyRound && r.id !== onlyRound) return;
      E().tiers(seasonObj).forEach((t) => {
        if (onlyTier && t.id !== onlyTier) return;
        const start = E().sessionDate(seasonObj, r, t.id); if (!start) return;
        const end = new Date(start.getTime() + 2 * 3600000);
        lines.push("BEGIN:VEVENT", `UID:${seasonObj.id}-${r.id}-${t.id}@${(location.hostname || "trl-driver-hub").replace(/[^a-z0-9.-]/gi, "")}`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
          `SUMMARY:${escT(`${L.name || "League"} ${t.name} · R${r.round} ${r.name}`)}`, `LOCATION:${escT(`${r.circuit}, ${r.location}`)}`,
          `DESCRIPTION:${escT(`${r.format || ""} race, ${r.laps} laps${r.sprint ? " (sprint weekend)" : ""}. ${L.discordInvite ? "Discord: " + L.discordInvite : ""}`)}`, "END:VEVENT");
      });
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
  function download(filename, content, type) {
    const blob = new Blob([content], { type: type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  // ---------- forms (Discord webhook / endpoint / mailto) ----------
  async function submitForm(kind, title, fields) {
    const f = ((cfg().forms || {})[kind]) || {};
    const L = cfg().league || {};
    const asText = fields.map((x) => `${x.name}: ${x.value}`).join("\n");
    try {
      if (f.discordWebhook) {
        const res = await fetch(f.discordWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: L.fullName || "Driver Hub", embeds: [{ title, color: 15204397, fields: fields.map((x) => ({ name: x.name, value: String(x.value || "—").slice(0, 1000), inline: String(x.value || "").length < 40 })), timestamp: new Date().toISOString() }] }) });
        if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
        return { ok: true, via: "discord" };
      }
      if (f.formEndpoint) {
        const payload = { form: kind, title }; fields.forEach((x) => { payload[x.key || x.name] = x.value; });
        const res = await fetch(f.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Endpoint responded ${res.status}`);
        return { ok: true, via: "endpoint" };
      }
    } catch (err) {
      return { ok: false, error: err.message, mailto: `mailto:${L.email || ""}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(asText)}` };
    }
    return { ok: false, fallback: true, mailto: `mailto:${L.email || ""}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(asText)}` };
  }
  function validateForm(form) {
    let ok = true;
    $$(".field", form).forEach((field) => {
      const input = $("input, select, textarea", field); if (!input) return;
      const valid = input.checkValidity();
      field.classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  // ---------- icons ----------
  const ICONS = {
    discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4.5h7l1.2 1.5h1.8A3.5 3.5 0 0 1 22 9.5v5a5 5 0 0 1-5 5h-1.6l-1-2H9.6l-1 2H7a5 5 0 0 1-5-5v-5A3.5 3.5 0 0 1 5.5 6h1.8L8.5 4.5zM9 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>',
    twitch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h16v11l-4 4h-4l-2 2H8v-2H4V3zm2 2v11h3v2l2-2h4l3-3V5H6zm5 3h2v5h-2V8zm5 0h2v5h-2V8z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5A3.5 3.5 0 0 1 6.5 4h11A3.5 3.5 0 0 1 21 7.5v9a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 16.5v-9zM10 8.5v7l6-3.5-6-3.5z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h4.5l4 5.6L17.5 3H20l-6.3 7.3L20.5 21H16l-4.3-6-5.2 6H4l6.7-7.7L4 3zm3.2 1.6 9.6 14.8h1.5L8.8 4.6H7.2z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5h-9zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm5-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3h3a4.5 4.5 0 0 0 4 4v3a7.4 7.4 0 0 1-4-1.2V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm-1 8v10h12V10H6zm2 2h3v3H8v-3z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11h10.2l-4.6-4.6L12 5l7 7-7 7-1.4-1.4 4.6-4.6H5v-2z"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v10.2l3.6-3.6L18 11l-6 6-6-6 1.4-1.4L11 13.2V3zM4 19h16v2H4v-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>'
  };
  const icon = (n) => ICONS[n] || "";
  function socialsHtml() {
    const s = (cfg().league || {}).socials || {};
    const labels = { discord: "Discord", twitch: "Twitch", youtube: "YouTube", twitter: "X / Twitter", instagram: "Instagram", tiktok: "TikTok" };
    return `<div class="socials">${Object.keys(labels).filter((k) => s[k]).map((k) => `<a href="${esc(s[k])}" target="_blank" rel="noopener" title="${labels[k]}" aria-label="${labels[k]}">${icon(k)}</a>`).join("")}</div>`;
  }

  // ---------- layout ----------
  const NAV = [
    ["standings.html", "Standings"], ["drivers.html", "Drivers"], ["teams.html", "Teams"], ["calendar.html", "Calendar"], ["results.html", "Results"],
    ["penalties.html", "Penalties"], ["rules.html", "Rules"], ["news.html", "News"], ["about.html", "About"]
  ];
  function currentPage() { const p = location.pathname.split("/").pop() || "index.html"; return p; }
  function renderHeader() {
    const L = cfg().league || {};
    const cur = currentPage();
    const s = season();
    const live = s ? E().liveNow(s) : null;
    const nameParts = (L.fullName || L.name || "Driver Hub").split(" ");
    const brandName = nameParts.length > 1 ? `${esc(nameParts[0])} <span>${esc(nameParts.slice(1).join(" "))}</span>` : esc(nameParts[0]);
    const el = document.createElement("div");
    el.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-header">
        <div class="container site-header__inner">
          <a class="brand" href="index.html" aria-label="${esc(L.fullName || L.name)} home"><img class="brand__logo" src="assets/img/logo.svg" alt=""><span class="brand__name">${brandName}</span></a>
          ${live ? `<a class="live-pill" href="${esc(link("index.html"))}#watch" title="${esc(live.tier.name)} · ${esc(live.round.name)}">Live</a>` : ""}
          <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Toggle menu"><span></span></button>
          <nav id="site-nav" class="nav" aria-label="Main">
            ${NAV.map(([href, label]) => `<a class="nav__link" href="${esc(link(href))}" ${cur === href ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
            <div class="nav__cta">
              <a class="btn btn--discord btn--sm btn--icon" href="${esc(L.discordInvite || "#")}" target="_blank" rel="noopener" aria-label="Discord" title="Join our Discord">${icon("discord")}<span class="nav__cta-label">Discord</span></a>
              <a class="btn btn--primary btn--sm" href="register.html">Register</a>
            </div>
          </nav>
        </div>
      </header>`;
    document.body.prepend(...Array.from(el.childNodes));
  }
  function renderFooter() {
    const L = cfg().league || {};
    const s = season();
    const next = s ? E().nextSession(s) : null;
    const foot = document.createElement("footer");
    foot.className = "site-footer";
    foot.innerHTML = `
      <div class="container">
        <div class="site-footer__inner">
          <div>
            <a class="brand" href="index.html"><img class="brand__logo" src="assets/img/logo.svg" alt=""><span class="brand__name">${esc(L.name)}</span></a>
            <p class="site-footer__about mt-2">${esc(L.description || "")}</p>
            ${socialsHtml()}
          </div>
          <div><h4>Championship</h4><ul>
            <li><a href="${esc(link("standings.html"))}">Standings</a></li><li><a href="${esc(link("drivers.html"))}">Drivers</a></li><li><a href="${esc(link("teams.html"))}">Teams</a></li><li><a href="${esc(link("calendar.html"))}">Calendar</a></li><li><a href="${esc(link("results.html"))}">Results</a></li><li><a href="${esc(link("penalties.html"))}">Penalties &amp; stewarding</a></li>
          </ul></div>
          <div><h4>Community</h4><ul>
            <li><a href="register.html">Register as a driver</a></li><li><a href="${esc(L.discordInvite || "#")}" target="_blank" rel="noopener">Discord server</a></li><li><a href="rules.html">Rules &amp; regulations</a></li><li><a href="news.html">News</a></li><li><a href="gallery.html">Gallery</a></li><li><a href="about.html">About &amp; contact</a></li>
          </ul></div>
          <div><h4>Next race</h4>
            ${next ? `<div class="round__title" style="font-size:1.15rem">${esc(next.round.name)}</div><div class="text-muted" style="font-size:.9rem">${esc(next.tier.name)} · Round ${next.round.round}<br>${esc(fmtDateTime(next.date))}</div><a class="btn btn--ghost btn--sm mt-2" href="${esc(link("calendar.html"))}">${icon("calendar")} Full calendar</a>` : `<p class="text-muted">The next season is being prepared. Watch this space.</p>`}
          </div>
        </div>
        <div class="site-footer__bottom">
          <span>© ${new Date().getFullYear()} ${esc(L.fullName || L.name)}. Not affiliated with Formula 1 or EA Sports.</span>
          <span>Times shown in your timezone (${esc(tz())}).</span>
        </div>
      </div>`;
    document.body.appendChild(foot);
  }
  function initNav() {
    const btn = $(".nav-toggle"), nav = $("#site-nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => { const open = nav.classList.toggle("is-open"); btn.setAttribute("aria-expanded", open ? "true" : "false"); });
    document.addEventListener("click", (e) => { if (!nav.contains(e.target) && !btn.contains(e.target) && nav.classList.contains("is-open")) { nav.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { nav.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); } });
  }
  function initReveal() {
    const items = $$(".reveal"); if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } }), { threshold: 0.08 });
    items.forEach((i) => io.observe(i));
  }
  function setTitle(t) { const L = cfg().league || {}; document.title = t ? `${t} · ${L.fullName || L.name}` : (L.fullName || L.name); }
  function fillBrand() {
    const L = cfg().league || {};
    $$("[data-league-name]").forEach((el) => { el.textContent = L.name || ""; });
    $$("[data-league-fullname]").forEach((el) => { el.textContent = L.fullName || L.name || ""; });
    $$("[data-league-tagline]").forEach((el) => { el.textContent = L.tagline || ""; });
    $$("[data-league-game]").forEach((el) => { el.textContent = L.game || ""; });
    $$("[data-league-email]").forEach((el) => { el.textContent = L.email || ""; if (el.tagName === "A") el.href = `mailto:${L.email || ""}`; });
    $$("[data-discord-link]").forEach((el) => { el.href = L.discordInvite || "#"; });
  }
  function sortableTable(table, getRows) {
    $$("th.sortable", table).forEach((th) => th.addEventListener("click", () => {
      const key = th.dataset.key; const dir = th.dataset.dir === "desc" ? "asc" : "desc";
      $$("th.sortable", table).forEach((x) => x.removeAttribute("data-dir")); th.dataset.dir = dir;
      const tbody = $("tbody", table);
      const rows = $$("tr", tbody);
      rows.sort((a, b) => { const av = a.dataset[key], bv = b.dataset[key]; const an = parseFloat(av), bn = parseFloat(bv); const cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : String(av).localeCompare(String(bv)); return dir === "asc" ? cmp : -cmp; });
      rows.forEach((r) => tbody.appendChild(r));
    }));
  }

  // ---------- boot ----------
  function page(name, fn) { pages[name] = fn; }
  function init() {
    if (!window.TRL_ENGINE || !window.TRL_CONFIG) { console.error("TRL: config or engine missing"); return; }
    renderHeader(); renderFooter(); initNav(); fillBrand();
    const name = document.body.dataset.page;
    const fn = pages[name];
    try { if (fn) fn(); } catch (err) { console.error("TRL page error:", err); const main = $("#main"); if (main) main.insertAdjacentHTML("afterbegin", `<div class="container mt-3"><div class="alert alert--error">Something went wrong rendering this page: ${esc(err.message)}</div></div>`); }
    initReveal();
  }
  document.addEventListener("DOMContentLoaded", init);

  return { page, $, $$, esc, qs, html, pref, season, tierId, link, setParam, fmtDate, fmtTime, fmtDateTime, tz, flag, ordinal, plural, placeholderSrc, img, teamColor, teamDot, driverName, teamName, tierPill, posBadge, movement, statusBadge, seasonSelect, tierTabs, countdown, countdownMarkup, icsForSeason, download, submitForm, validateForm, icon, socialsHtml, setTitle, sortableTable, cfg, E };
})();
