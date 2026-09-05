/* =============================================================
   TRL Driver Hub — shared runtime
   Section-aware header/footer, dev banner, Discord sign-in,
   shared renderers (race rows, driver tiles, leader cards, marks),
   forecast, forms and helpers. Pages call TRL.page(name, fn).
   Set window.TRL_ROOT = "../" on pages inside a sub-folder.
   ============================================================= */
window.TRL = (function () {
  "use strict";
  const ROOT = window.TRL_ROOT || "";
  const pages = {};
  const cfg = () => window.TRL_CONFIG || {};
  const E = () => window.TRL_ENGINE;

  // ---------- DOM & string helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const href = (path) => ROOT + path;
  const pref = (k, v) => { try { if (v === undefined) return localStorage.getItem("trl." + k); if (v === null) localStorage.removeItem("trl." + k); else localStorage.setItem("trl." + k, v); } catch (e) { return null; } };
  function setParam(k, v) { const u = new URL(location.href); if (v == null || v === "") u.searchParams.delete(k); else u.searchParams.set(k, v); history.replaceState(null, "", u.toString()); }
  const season = () => { const id = qs("season"); return id ? E().getSeason(id) : E().currentSeason(); };
  const initials = (name) => String(name || "?").replace(/[^A-Za-z0-9 _]/g, "").split(/[\s_]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

  // ---------- formatting ----------
  const dateObj = (d) => (d instanceof Date ? d : new Date(d));
  const fmtDate = (d, o) => { d = dateObj(d); return isNaN(d) ? "TBC" : d.toLocaleDateString(undefined, o || { weekday: "short", month: "short", day: "numeric", year: "numeric" }); };
  const fmtTime = (d) => { d = dateObj(d); return isNaN(d) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }); };
  const fmtDateTime = (d) => `${fmtDate(d)} · ${fmtTime(d)}`;
  const monthShort = (d) => { d = dateObj(d); return isNaN(d) ? "—" : d.toLocaleDateString(undefined, { month: "short" }); };
  const dayNum = (d) => { d = dateObj(d); return isNaN(d) ? "—" : d.getDate(); };
  const tz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return "local time"; } };
  const money = (n) => E().money(n);

  // ---------- flags, marks, avatars ----------
  function flagEmoji(cc) { if (!cc || cc.length !== 2) return ""; const b = 0x1f1e6; return String.fromCodePoint(b + cc.toUpperCase().charCodeAt(0) - 65, b + cc.toUpperCase().charCodeAt(1) - 65); }
  function flag(cc, name, size) {
    if (!cc) return "";
    const cls = size === "sm" ? "flag flag-sm" : size === "lg" ? "flag flag-lg" : "flag";
    const w = size === "lg" ? "w160" : "w80";
    return `<img class="${cls}" src="https://flagcdn.com/${w}/${esc(cc.toLowerCase())}.png" alt="${esc(name || cc)}" title="${esc(name || cc)}" loading="lazy" data-emoji="${esc(flagEmoji(cc.slice(0, 2)))}">`;
  }
  // Flags fall back to an emoji when the flag CDN is unreachable (error events do not bubble, so capture them)
  document.addEventListener("error", (e) => { const img = e.target; if (!img || img.tagName !== "IMG" || !img.classList || !img.classList.contains("flag")) return; const span = document.createElement("span"); span.className = "flag-emoji"; span.textContent = img.dataset.emoji || ""; span.title = img.title || ""; img.replaceWith(span); }, true);
  const teamStyle = (t) => `style="--team:${esc((t && t.color) || "#6b7280")}"`;
  function ctorMark(t, size) {
    size = size || "sm";
    if (!t) return `<span class="ctor-mark ${size}" style="--team:#6b7280"><span class="ctor-mono">FRE</span></span>`;
    if (t.logo) return `<span class="ctor-mark ${size}" ${teamStyle(t)}><img src="${esc(ROOT + t.logo)}" alt="${esc(t.name)}" loading="lazy"></span>`;
    return `<span class="ctor-mark ${size}" ${teamStyle(t)}><span class="ctor-mono">${esc(t.short || initials(t.name))}</span></span>`;
  }
  function avatar(d, size, t) {
    size = size || "md";
    const color = (t && t.color) || "#6b7280";
    const src = d && d.discord && d.discord.avatar ? d.discord.avatar : d && d.photo ? ROOT + d.photo : null;
    return `<span class="avatar ${size}" style="--team:${esc(color)}">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : esc(initials(d && d.name))}</span>`;
  }
  const divBadge = (dv) => (dv ? `<span class="div-badge">${esc(dv.short || dv.name)}</span>` : "");
  const medal = (pos) => (pos === 1 ? '<span class="medal gold">1</span>' : pos === 2 ? '<span class="medal silver">2</span>' : pos === 3 ? '<span class="medal bronze">3</span>' : `<span class="pos-num">${esc(pos == null ? "—" : pos)}</span>`);
  const rowTone = (pos) => (pos === 1 ? "row-gold" : pos === 2 ? "row-silver" : pos === 3 ? "row-bronze" : "");
  const driverUrl = (id) => href(`f1/driver.html?id=${encodeURIComponent(id)}`);
  const teamUrl = (id) => href(`f1/teams.html?c=${encodeURIComponent(id)}`);
  const resultsUrl = (roundId, divId) => href(`f1/results.html?round=${encodeURIComponent(roundId)}&div=${encodeURIComponent(divId || "d1")}`);
  const driverLink = (s, id, extra) => { const d = E().driver(s, id); return `<a href="${driverUrl(id)}">${esc(d ? d.name : id)}</a>${extra || ""}`; };
  function teamCell(s, teamId, opts) {
    opts = opts || {};
    const t = teamId ? E().team(s, teamId) : null;
    if (!t) return '<span class="team-cell free">Free agent</span>';
    const inner = `${ctorMark(t, opts.size || "sm")}${opts.short ? esc(t.short) : esc(t.name)}`;
    return opts.link === false ? `<span class="team-cell" ${teamStyle(t)}>${inner}</span>` : `<a class="team-cell" ${teamStyle(t)} href="${teamUrl(t.id)}">${inner}</a>`;
  }
  const nationCell = (d) => (d && d.cc ? `${flag(d.cc, d.nation, "sm")} ${esc(d.nation || "")}` : "");
  const reserveMark = (row) => (row && row.reserve ? '<span class="reserve-mark" title="Reserve driver">R</span>' : "");

  // ---------- shared renderers ----------
  function forecastBox(r, opts) {
    opts = opts || {};
    const id = `forecast-${esc(r.id)}-${Math.random().toString(36).slice(2, 7)}`;
    const html = `<div class="forecast-box" id="${id}"><span class="forecast-icon">⛅</span><div><p class="kicker">Projected forecast</p><div class="forecast-label">${esc(r.forecast && r.forecast.label ? r.forecast.label : "Forecast pending")}</div><div class="forecast-meta">${r.forecast && r.forecast.tempC != null ? `${esc(r.forecast.tempC)}°C · ${esc(r.forecast.rain || 0)}% rain` : "Live weather loads when the site is online"}</div><em class="forecast-note">Updated every ${(cfg().weather || {}).refreshMinutes || 20} min</em></div></div>`;
    setTimeout(() => loadForecast(r, document.getElementById(id)), 0);
    return html;
  }
  const WMO = [[0, "Clear sky", "☀️"], [1, "Mainly clear", "🌤️"], [2, "Light cloud", "⛅"], [3, "Overcast", "☁️"], [45, "Fog", "🌫️"], [48, "Rime fog", "🌫️"], [51, "Light drizzle", "🌦️"], [53, "Drizzle", "🌦️"], [55, "Heavy drizzle", "🌧️"], [61, "Light rain", "🌦️"], [63, "Rain", "🌧️"], [65, "Heavy rain", "🌧️"], [71, "Light snow", "🌨️"], [73, "Snow", "🌨️"], [75, "Heavy snow", "❄️"], [80, "Showers", "🌦️"], [81, "Showers", "🌧️"], [82, "Violent showers", "⛈️"], [95, "Thunderstorm", "⛈️"], [96, "Thunderstorm", "⛈️"], [99, "Thunderstorm", "⛈️"]];
  function wmo(code) { let best = WMO[0]; WMO.forEach((w) => { if (code >= w[0]) best = w; }); return best; }
  async function loadForecast(r, el) {
    if (!el || !(cfg().weather || {}).enabled || !r.coords || !r.date || !window.fetch) return;
    try {
      const key = `trl.wx.${r.id}`; const ttl = ((cfg().weather || {}).refreshMinutes || 20) * 60000;
      let data = null;
      try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.at < ttl) data = c.data; } catch (e) { /* ignore */ }
      if (!data) {
        const d = new Date(r.date); const day = d.toISOString().slice(0, 10);
        const daysAhead = (d - Date.now()) / 86400000; if (daysAhead > 15 || daysAhead < -1) return;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${r.coords[0]}&longitude=${r.coords[1]}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=UTC&start_date=${day}&end_date=${day}`;
        const res = await fetch(url); if (!res.ok) return; const j = await res.json();
        const hour = d.getUTCHours(); const i = (j.hourly.time || []).findIndex((t) => t.endsWith(`T${String(hour).padStart(2, "0")}:00`));
        if (i < 0) return;
        data = { code: j.hourly.weather_code[i], temp: Math.round(j.hourly.temperature_2m[i]), rain: j.hourly.precipitation_probability ? j.hourly.precipitation_probability[i] : 0 };
        try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch (e) { /* ignore */ }
      }
      const w = wmo(data.code);
      $(".forecast-icon", el).textContent = w[2]; $(".forecast-label", el).textContent = w[1]; $(".forecast-meta", el).textContent = `${data.temp}°C · ${data.rain || 0}% rain`;
    } catch (e) { /* offline: keep placeholder */ }
  }
  function raceRow(s, r, opts) {
    opts = opts || {};
    const status = E().roundStatus(s, r);
    const next = opts.next != null ? opts.next : (E().nextRound(s) || {}).id === r.id;
    const divs = E().divisions(s);
    const primaryDiv = opts.division || (divs[0] && divs[0].id);
    const winners = divs.map((dv) => { const sh = E().sheet(s, r.id, dv.id); const w = sh && (sh.race || [])[0]; return w ? { dv, w } : null; }).filter(Boolean);
    const roundLabel = r.preseason ? "Preseason" : `Round ${r.round}`;
    const shortLabel = r.preseason ? "PRE" : `R${r.round}`;
    let side = "";
    if (status === "completed") {
      const w = winners[0];
      side = `<div class="race-winner"><small>Winner:</small> ${w ? `${esc((E().driver(s, w.w.driver) || {}).name || w.w.driver)} ${w.w.team ? ctorMark(E().team(s, w.w.team), "sm") : ""}` : "—"}</div><span class="btn btn-green btn-compact">View results →</span>`;
    } else if (next) {
      side = forecastBox(r);
    } else {
      side = `<div class="lights-out"><small>Lights out</small><b>${esc(fmtDate(r.date))}</b></div>`;
    }
    const cls = `race-row ${status === "completed" ? "is-done" : next ? "is-next" : "is-upcoming"} ${opts.compact ? "is-compact" : ""}`;
    const inner = `
      <div class="race-date"><span class="race-month">${esc(monthShort(r.date))}</span><span class="race-day">${esc(dayNum(r.date))}</span></div>
      <div class="race-round">${esc(roundLabel)}${status === "completed" ? "<b>Published</b>" : ""}</div>
      <div class="race-main"><div class="race-title">${flag(r.cc, r.location)}<span>${esc(r.name)}</span></div><div class="race-venue">${esc(r.circuit)} · ${esc(r.location)}</div>${next ? `<div class="race-status">Lights out ${esc(fmtDateTime(r.date))}</div>` : ""}</div>
      <div class="race-side">${side}</div>`;
    if (status === "completed") return `<a class="${cls}" href="${resultsUrl(r.id, primaryDiv)}" data-round="${esc(r.id)}" aria-label="${esc(r.name)} results">${inner}</a>`;
    return `<article class="${cls}" data-round="${esc(r.id)}" title="${esc(shortLabel)}">${inner}</article>`;
  }
  function driverTile(s, d, opts) {
    opts = opts || {};
    const t = d.team ? E().team(s, d.team) : null;
    const dv = d.division ? E().division(s, d.division) : null;
    const st = E().driverStats(s, d.id);
    const tags = [dv ? divBadge(dv) : "", d.unsigned ? '<span class="chip chip-unsigned">Unsigned</span>' : "", d.role === "reserve" ? '<span class="chip chip-reserve">Reserve</span>' : "", d.principal ? '<span class="chip chip-principal">Principal</span>' : ""].join("");
    return `<a class="driver-tile ${d.unsigned ? "is-unsigned" : ""}" ${teamStyle(t)} href="${driverUrl(d.id)}">
      ${d.number ? `<span class="driver-tile-num">${esc(d.number)}</span>` : ""}
      <div class="driver-tile-top">${avatar(d, "md", t)}<div><div class="driver-tile-tags">${tags}</div><h3>${esc(d.name)}</h3>${d.cc ? `<div class="driver-tile-nation">${flag(d.cc, d.nation, "sm")}<span>${esc(d.nation || "")}</span></div>` : ""}</div></div>
      ${opts.stats === false ? "" : `<div class="driver-tile-bottom">${t ? ctorMark(t, "md") : "<span></span>"}<div class="driver-tile-stats"><div><span>Pts</span><b>${st.points}</b></div><div><span>Wins</span><b>${st.wins}</b></div><div><span>Podiums</span><b>${st.podiums}</b></div></div></div>`}
    </a>`;
  }
  function leaderCard(s, e) {
    const t = e.team; const d = e.driver || {};
    const cls = e.position === 1 ? "is-p1" : e.position === 2 ? "is-p2" : "is-p3";
    return `<a class="leader-card ${cls}" ${teamStyle(t)} href="${driverUrl(e.driverId)}">
      <div class="leader-copy">
        <div class="leader-top">${medal(e.position)}<span>${e.position === 1 ? "Leader" : `${e.gap} behind`}</span></div>
        <div class="leader-id">${ctorMark(t, "sm")}<div><h3>${esc(e.name)}</h3><small>${esc(t ? t.name : "Free agent")}</small></div><span class="leader-num">${esc(d.number || "")}</span></div>
        <div class="leader-stats"><div><span>Wins</span><br><b>${e.wins}</b></div><div><span>Podiums</span><br><b>${e.podiums}</b></div><div><span>Pts</span><br><b>${e.points}</b></div></div>
      </div>
      <div class="leader-media">${avatar(d, "lg", t)}</div>
    </a>`;
  }
  const ctorTile = (t) => `<a class="ctor-tile" ${teamStyle(t)} href="${teamUrl(t.id)}">${ctorMark(t, "md")}<span>${esc(t.name)}</span></a>`;
  const bonusChips = (bonuses) => (bonuses && bonuses.length ? `<div class="bonus-chips">${bonuses.map((b) => `<span class="bonus-chip ${b.key}">+${b.points} ${esc(b.label)}${b.detail ? ` ${esc(b.detail)}` : ""}</span>`).join("")}</div>` : "");

  // ---------- Discord sign-in (OAuth2 implicit grant, browser only) ----------
  const auth = {
    enabled: () => !!(cfg().discord || {}).clientId,
    loginPage: () => new URL(href("login.html"), location.href).toString().split("#")[0],
    signInUrl: (returnTo) => {
      const d = cfg().discord || {};
      const scope = d.guildId ? "identify guilds.members.read" : "identify";
      const state = encodeURIComponent(returnTo || location.href);
      return `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(d.clientId)}&response_type=token&redirect_uri=${encodeURIComponent(auth.loginPage())}&scope=${encodeURIComponent(scope)}&state=${state}&prompt=none`;
    },
    session: () => { try { const s = JSON.parse(localStorage.getItem("trl.session") || "null"); if (s && s.expires > Date.now()) return s; } catch (e) { /* ignore */ } return null; },
    signOut: () => { try { localStorage.removeItem("trl.session"); } catch (e) { /* ignore */ } },
    roleNames: (session) => { const names = (cfg().discord || {}).roles || {}; const ids = (cfg().discord || {}).roleIds || {}; const out = []; Object.keys(names).forEach((k) => { if (session && session.roles && ids[k] && session.roles.includes(ids[k])) out.push(names[k]); }); return out; },
    isTeamPrincipal: (session) => auth.roleNames(session).includes(((cfg().discord || {}).roles || {}).teamPrincipal),
    async handleCallback() {
      const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
      const token = hash.get("access_token"); if (!token) return null;
      const expires = Date.now() + (Number(hash.get("expires_in")) || 604800) * 1000;
      const me = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null));
      if (!me) return null;
      let roles = [];
      const gid = (cfg().discord || {}).guildId;
      if (gid) { try { const m = await fetch(`https://discord.com/api/users/@me/guilds/${gid}/member`, { headers: { Authorization: `Bearer ${token}` } }); if (m.ok) roles = (await m.json()).roles || []; } catch (e) { /* ignore */ } }
      const avatarUrl = me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128` : null;
      const session = { id: me.id, name: me.global_name || me.username, username: me.username, avatar: avatarUrl, roles, expires, token };
      try { localStorage.setItem("trl.session", JSON.stringify(session)); } catch (e) { /* ignore */ }
      history.replaceState(null, "", location.pathname + location.search);
      return { session, returnTo: hash.get("state") ? decodeURIComponent(hash.get("state")) : null };
    }
  };
  function authSlotHtml() {
    const s = auth.session();
    if (s) {
      const d = cfg().discord || {};
      const tp = auth.isTeamPrincipal(s) || !d.guildId; // without a guild we can't verify roles: show the office link
      return `<div class="user-menu" id="user-menu"><button class="user-menu-btn" type="button" aria-expanded="false"><span class="avatar sm" style="--team:#5865f2">${s.avatar ? `<img src="${esc(s.avatar)}" alt="">` : esc(initials(s.name))}</span><span>${esc(s.name)}</span></button><div class="user-menu-panel"><a href="${href("faq.html")}">FAQ</a>${tp ? `<a href="${href("team-principal.html")}">Team Principal</a>` : ""}<a href="${href("f1/drivers.html")}">My driver profile</a><button type="button" data-signout>Sign out</button></div></div>`;
    }
    return `<a class="btn btn-discord" href="${auth.enabled() ? esc(auth.signInUrl(location.href)) : href("login.html")}"><span class="auth-long">Sign in with Discord</span><span class="auth-short">Sign in</span></a>`;
  }

  // ---------- layout ----------
  const NAVS = {
    hub: (b) => [["f1/signup.html", "Join"], ["f1/index.html", "F1 Home"], ["endurance/index.html", "Endurance", "endurance"], [b.invite, "Discord ↗", "btn btn-discord", true]],
    f1: () => [["f1/index.html", "F1 Home"], ["f1/standings.html", "Standings"], ["f1/drivers.html", "Drivers"], ["f1/schedule.html", "Calendar"], ["f1/teams.html", "Teams"], ["f1/signup.html", "Join"], ["f1/rulebook.html", "Rulebook", "btn btn-primary"], ["faq.html", "FAQ"]],
    endurance: (b) => [["endurance/index.html", "Endurance"], ["endurance/races.html", "Races"], ["endurance/liveries.html", "Liveries"], ["endurance/drivers.html", "Drivers"], ["endurance/signup.html", "Join"], [b.invite, "Discord ↗", "btn btn-discord", true]]
  };
  function currentPath() { const p = location.pathname.replace(/\/+$/, "/"); const parts = p.split("/"); const file = parts.pop() || "index.html"; const dir = ROOT ? parts.pop() + "/" : ""; return dir + file; }
  function renderChrome() {
    const B = cfg().brand || {}, D = cfg().discord || {}, F = cfg().f1 || {}, EN = cfg().endurance || {};
    const section = document.body.dataset.section || "hub";
    const invite = D.invite || "#";
    const brand = section === "f1" ? [F.code || "F1", B.fullName || B.name] : section === "endurance" ? [B.name, B.version] : [B.line1 || B.name, B.line2 || ""];
    const items = (NAVS[section] || NAVS.hub)({ invite }).filter((it) => !(it[2] === "endurance" && EN.enabled === false));
    const cur = currentPath();
    const nav = items.map(([p, label, cls, ext]) => { const isBtn = cls && cls.startsWith("btn"); const url = ext ? p : href(p); const active = !ext && p === cur; return `<a href="${esc(url)}" ${isBtn ? `class="${cls}"` : active ? 'class="is-active" aria-current="page"' : ""} ${ext ? 'target="_blank" rel="noreferrer"' : ""}>${label}</a>`; }).join("");
    const banner = cfg().devBanner && cfg().devBanner.enabled ? `<aside class="dev-banner">${esc(cfg().devBanner.text)} <a href="${esc(invite)}" target="_blank" rel="noreferrer">${esc(cfg().devBanner.linkText || "Join Discord ↗")}</a></aside>` : "";
    const head = document.createElement("div");
    head.innerHTML = `<a class="skip-link" href="#main">Skip to content</a>${banner}<header class="topbar"><div class="wrap topbar-inner"><a class="brand" href="${href("index.html")}" aria-label="${esc(B.fullName || B.name)} home"><img class="brand-mark" src="${href("assets/img/logo.svg")}" alt=""><span><span class="brand-l1">${esc(brand[0])}</span><span class="brand-l2">${esc(brand[1])}</span></span></a><nav class="topnav" id="site-nav" aria-label="Primary navigation">${nav}</nav><div class="auth-slot" id="auth-slot">${section === "hub" && !auth.session() ? "" : authSlotHtml()}</div><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span>Navigate</span><i></i></button></div></header>`;
    document.body.prepend(...Array.from(head.childNodes));
    const foot = document.createElement("footer");
    foot.className = "site-footer";
    foot.innerHTML = `<div class="wrap site-footer-inner"><a class="brand" href="${href("index.html")}"><img class="brand-mark" src="${href("assets/img/logo.svg")}" alt=""><span><span class="brand-l1">${esc(B.line1 || B.name)}</span><span class="brand-l2">${esc(B.line2 || "")}</span></span></a><div class="tagline">${esc(B.tagline || "")}</div><div class="meta"><a href="${href("faq.html")}">FAQ</a> · © ${esc(B.year || new Date().getFullYear())} ${esc(B.fullName || B.name)} · ${section === "endurance" ? "Endurance " : ""}${esc(B.version || "")}</div></div>`;
    document.body.appendChild(foot);
    const btn = $(".nav-toggle"), navEl = $("#site-nav");
    btn.addEventListener("click", () => { const open = navEl.classList.toggle("is-open"); btn.setAttribute("aria-expanded", open ? "true" : "false"); });
    document.addEventListener("click", (e) => { if (!navEl.contains(e.target) && !btn.contains(e.target)) { navEl.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); } const um = $("#user-menu"); if (um && !um.contains(e.target)) um.classList.remove("is-open"); });
    const um = $("#user-menu");
    if (um) { $(".user-menu-btn", um).addEventListener("click", () => { const o = um.classList.toggle("is-open"); $(".user-menu-btn", um).setAttribute("aria-expanded", o ? "true" : "false"); }); $("[data-signout]", um).addEventListener("click", () => { auth.signOut(); location.reload(); }); }
  }
  const setTitle = (t) => { const B = cfg().brand || {}; document.title = t ? `${t} | ${B.fullName || B.name}` : (B.fullName || B.name); };
  function pageHead(el, kicker, title, lede, extra) { el.innerHTML = `<section class="page-head"><p class="kicker">${esc(kicker)}</p><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}${extra || ""}</section>`; }

  // ---------- forms / stores ----------
  async function submitForm(kind, title, fields) {
    const f = ((cfg().forms || {})[kind]) || {};
    const B = cfg().brand || {};
    const text = fields.map((x) => `${x.name}: ${x.value}`).join("\n");
    const mailto = `mailto:${(cfg().forms || {}).email || ""}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
    try {
      if (f.discordWebhook) { const r = await fetch(f.discordWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: B.fullName || "Driver Hub", embeds: [{ title, color: 16724295, fields: fields.map((x) => ({ name: x.name, value: String(x.value || "—").slice(0, 1000), inline: String(x.value || "").length < 40 })), timestamp: new Date().toISOString() }] }) }); if (!r.ok) throw new Error(`Webhook responded ${r.status}`); return { ok: true }; }
      if (f.formEndpoint) { const payload = { form: kind, title }; fields.forEach((x) => { payload[x.key || x.name] = x.value; }); const r = await fetch(f.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) }); if (!r.ok) throw new Error(`Endpoint responded ${r.status}`); return { ok: true }; }
    } catch (err) { return { ok: false, error: err.message, mailto }; }
    return { ok: false, fallback: true, mailto };
  }
  function validateForm(form) { let ok = true; $$(".field", form).forEach((f) => { const i = $("input, select, textarea", f); if (!i) return; const v = i.checkValidity(); f.classList.toggle("is-invalid", !v); if (!v) ok = false; }); return ok; }
  const interest = {
    set: () => { try { return new Set(JSON.parse(localStorage.getItem("trl.interest") || "[]")); } catch (e) { return new Set(); } },
    has: (id) => interest.set().has(id),
    toggle: (id) => { const s = interest.set(); if (s.has(id)) s.delete(id); else s.add(id); try { localStorage.setItem("trl.interest", JSON.stringify(Array.from(s))); } catch (e) { /* ignore */ } return s.has(id); }
  };
  function interestButton(ev) {
    const on = interest.has(ev.id); const me = auth.session();
    const names = (ev.interested || []).slice(); if (on && me && !names.includes(me.name)) names.push(me.name);
    return `<div class="interest-col"><button class="btn btn-compact ${on ? "btn-green" : ""}" type="button" data-interest="${esc(ev.id)}">${on ? "✓ Interested" : "I'm interested"}</button><span class="interest-count">${names.length} interested</span></div>`;
  }
  function bindInterest(root, onChange) {
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-interest]"); if (!b) return; const id = b.dataset.interest; const on = interest.toggle(id); const ev = E().enduranceEvent(id); if (on && ev) submitForm("interest", `Interest · ${ev.series} — ${ev.track}`, [{ name: "Driver", value: (auth.session() || {}).name || "Anonymous (not signed in)" }, { name: "Event", value: `${ev.series} — ${ev.track} (${ev.length})` }, { name: "Date", value: fmtDateTime(ev.date) }]); if (onChange) onChange(id, on); });
  }
  function scrollSpy(links, targets) {
    if (!("IntersectionObserver" in window) || !targets.length) return;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-15% 0px -75% 0px" });
    targets.forEach((t) => io.observe(t));
  }

  // ---------- boot ----------
  function page(name, fn) { pages[name] = fn; }
  function init() {
    if (!window.TRL_ENGINE || !window.TRL_CONFIG) { console.error("TRL: config or engine missing"); return; }
    renderChrome();
    const fn = pages[document.body.dataset.page];
    try { if (fn) fn(); } catch (err) { console.error("TRL page error:", err); const m = $("#main"); if (m) m.insertAdjacentHTML("afterbegin", `<div class="wrap"><div class="notice bad" style="margin-top:20px">Something went wrong rendering this page: ${esc(err.message)}</div></div>`); }
  }
  document.addEventListener("DOMContentLoaded", init);

  return { page, $, $$, esc, qs, href, pref, setParam, season, initials, fmtDate, fmtTime, fmtDateTime, monthShort, dayNum, tz, money, flag, flagEmoji, teamStyle, ctorMark, avatar, divBadge, medal, rowTone, driverUrl, teamUrl, resultsUrl, driverLink, teamCell, nationCell, reserveMark, forecastBox, raceRow, driverTile, leaderCard, ctorTile, bonusChips, auth, authSlotHtml, setTitle, pageHead, submitForm, validateForm, interest, interestButton, bindInterest, scrollSpy, cfg, E, ROOT };
})();
