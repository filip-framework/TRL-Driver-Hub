TRL.page("endsignup", function () {
  const { $, esc } = TRL; const E = TRL.E(); const A = TRL.auth; const C = TRL.cfg(); const B = C.brand || {}, D = C.discord || {}, EN = C.endurance || {};
  TRL.setTitle("Endurance driver signup");
  TRL.pageHead($("#head"), `Endurance Racing · ${B.version || ""}`, "Driver signup", `Start on the website: connect Discord, register for endurance, then join the ${esc(B.name)} Discord if you aren’t already in.`);
  const card = $("#signup"); const session = A.session();
  function form() {
    card.innerHTML = `<p class="kicker">${session ? "Connected" : "Driver details"}</p>${session ? `<div class="identity-row"><span class="avatar sm" style="--team:#5865f2">${session.avatar ? `<img src="${esc(session.avatar)}" alt="">` : esc(TRL.initials(session.name))}</span><div><b>${esc(session.name)}</b><small>@${esc(session.username)} · Discord connected</small></div></div>` : ""}
      <form class="form-grid" id="end-form" novalidate>
        <div class="field"><label>Driver name <span class="req">*</span></label><input name="name" required value="${session ? esc(session.name) : ""}"><span class="error">Required.</span></div>
        <div class="field"><label>Discord handle <span class="req">*</span></label><input name="discord" required value="${session ? esc(session.username) : ""}"><span class="error">Required.</span></div>
        <div class="field"><label>Platforms <span class="req">*</span></label><select name="platforms" required><option value="">Select…</option>${(EN.platforms || []).map((p) => `<option>${esc(p.name)}</option>`).join("")}<option>Both</option></select><span class="error">Choose one.</span></div>
        <div class="field"><label>Preferred classes</label><input name="classes" placeholder="GT3, LMP2, GTP…"></div>
        <div class="field"><label>Timezone</label><input name="timezone" value="${esc(TRL.tz())}"></div>
        <div class="field"><label>iRating / experience</label><input name="experience" placeholder="Optional"></div>
        <input class="honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="field full actions"><button class="btn btn-primary" type="submit">Join the endurance list</button><a class="btn btn-discord" href="${esc(D.invite || "#")}" target="_blank" rel="noreferrer">Open Discord</a></div><div class="field full" id="status"></div></form>`;
    $("#end-form").addEventListener("submit", async (e) => { e.preventDefault(); const f = e.target; if (f.website.value) return; if (!TRL.validateForm(f)) { $("#status").innerHTML = '<div class="notice bad">Please fix the highlighted fields.</div>'; return; } const fd = new FormData(f); const fields = ["name", "discord", "platforms", "classes", "timezone", "experience"].map((k) => ({ name: k[0].toUpperCase() + k.slice(1), value: fd.get(k) || "—" })); const res = await TRL.submitForm("enduranceSignup", `Endurance signup · ${fd.get("name")}`, fields); $("#status").innerHTML = res.ok ? '<div class="notice ok"><b>You’re on the endurance list.</b> Mark the races you want from the calendar below.</div>' : `<div class="notice info">${res.fallback ? "No signup webhook is configured yet, so" : "The signup could not be sent automatically, so"} please <a href="${esc(res.mailto)}">send it by email</a> or post it in Discord.</div>`; });
  }
  if (!session && A.enabled()) { card.innerHTML = `<p class="kicker">Step 1</p><h3 style="font-size:1.6rem">Connect Discord</h3><p class="muted">Sign in so your entry is linked to your Discord account.</p><div class="actions"><a class="btn btn-discord" href="${esc(A.signInUrl(location.href))}">Sign in with Discord</a><button class="btn" type="button" id="skip">Continue without Discord</button></div>`; $("#skip").addEventListener("click", form); } else form();
  const cal = $("#calendar"); const events = E.enduranceEvents().filter((e) => e.status !== "completed");
  const render = () => { cal.innerHTML = events.map((e) => TRL_END.eventRow(e)).join("") || '<div class="empty-state">No upcoming races.</div>'; };
  render(); TRL.bindInterest(cal, render);
});
