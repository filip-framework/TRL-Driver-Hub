/* F1 driver signup */
TRL.page("signup", function () {
  const { $, $$, esc, href } = TRL; const E = TRL.E(); const A = TRL.auth; const C = TRL.cfg(); const F = C.f1 || {}, D = C.discord || {}; const s = TRL.season();
  TRL.setTitle("Driver signup");
  TRL.pageHead($("#head"), `${F.code || "F1"} Championship`, "Driver signup", "Start on the website: connect Discord, add yourself to the F1 driver list, then join the league Discord if you aren’t already in. Race Control places free agents when seats open — you can also register for Endurance separately.");
  const card = $("#signup");
  const session = A.session();
  const divs = E.divisions(s);
  const taken = new Set(E.drivers(s).map((d) => Number(d.number)).filter(Boolean));
  function form() {
    card.innerHTML = `
      <p class="kicker">${session ? "Connected" : "Driver details"}</p>
      ${session ? `<div class="identity-row"><span class="avatar sm" style="--team:#5865f2">${session.avatar ? `<img src="${esc(session.avatar)}" alt="">` : esc(TRL.initials(session.name))}</span><div><b>${esc(session.name)}</b><small>@${esc(session.username)} · Discord connected</small></div></div>` : A.enabled() ? `<div class="notice info mb-2">Connect Discord so Race Control can match your roles. <a href="${esc(A.signInUrl(location.href))}">Sign in with Discord</a> or continue below.</div>` : ""}
      <form class="form-grid" id="signup-form" novalidate>
        <div class="field"><label for="f-name">Driver name <span class="req">*</span></label><input id="f-name" name="name" required value="${session ? esc(session.name) : ""}"><span class="error">Required.</span></div>
        <div class="field"><label for="f-discord">Discord handle <span class="req">*</span></label><input id="f-discord" name="discord" required value="${session ? esc(session.username) : ""}"><span class="error">Required.</span></div>
        <div class="field"><label for="f-ea">EA ID / PSN / Gamertag <span class="req">*</span></label><input id="f-ea" name="ea" required><span class="error">Required.</span></div>
        <div class="field"><label for="f-platform">Platform <span class="req">*</span></label><select id="f-platform" name="platform" required><option value="">Select…</option><option>PC</option><option>PlayStation</option><option>Xbox</option></select><span class="error">Choose a platform.</span></div>
        <div class="field"><label for="f-number">Preferred number</label><input id="f-number" name="number" type="number" min="1" max="99"><span class="hint">1–99. Taken: ${Array.from(taken).sort((a, b) => a - b).join(", ") || "none"}</span><span class="error">Number unavailable.</span></div>
        <div class="field"><label for="f-nation">Nation</label><input id="f-nation" name="nation" placeholder="e.g. Canada"></div>
        <div class="field"><label for="f-div">Division preference</label><select id="f-div" name="division"><option value="Race Control decides">Race Control decides</option>${divs.map((d) => `<option>${esc(d.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="f-role">Seat type <span class="req">*</span></label><select id="f-role" name="role" required><option value="">Select…</option><option>Full-time</option><option>Reserve</option><option>Either</option></select><span class="error">Choose one.</span></div>
        <div class="field full"><label for="f-exp">Experience</label><textarea id="f-exp" name="experience" placeholder="Previous leagues, time-trial pace, a link to your onboards…"></textarea></div>
        <div class="field full"><label class="check"><input type="checkbox" name="agree" required> I have read the <a href="rulebook.html" target="_blank">rules &amp; regulations</a> and agree to race cleanly. <span class="req">*</span></label><span class="error">You need to accept the rules.</span></div>
        <input class="honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="field full actions"><button class="btn btn-primary" type="submit">Add me to the F1 driver list</button><a class="btn btn-discord" href="${esc(D.invite || "#")}" target="_blank" rel="noreferrer">Open Discord</a></div>
        <div class="field full" id="status"></div>
      </form>`;
    const num = $("#f-number");
    num.addEventListener("input", () => num.setCustomValidity(taken.has(Number(num.value)) ? "taken" : ""));
    $("#signup-form").addEventListener("submit", async (e) => {
      e.preventDefault(); const f = e.target; if (f.website.value) return;
      if (!TRL.validateForm(f)) { $("#status").innerHTML = '<div class="notice bad">Please fix the highlighted fields.</div>'; return; }
      const fd = new FormData(f);
      const fields = [["Driver name", "name"], ["Discord", "discord"], ["EA ID", "ea"], ["Platform", "platform"], ["Number", "number"], ["Nation", "nation"], ["Division", "division"], ["Seat type", "role"], ["Experience", "experience"]].map(([n, k]) => ({ name: n, value: fd.get(k) || "—" }));
      if (session) fields.push({ name: "Discord id", value: session.id });
      const btn = f.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Sending…";
      const res = await TRL.submitForm("f1Signup", `F1 signup · ${fd.get("name")}`, fields);
      btn.disabled = false; btn.textContent = "Add me to the F1 driver list";
      $("#status").innerHTML = res.ok ? `<div class="notice ok"><b>You're on the list.</b> Race Control will confirm your seat on Discord.${D.invite ? ` <a href="${esc(D.invite)}" target="_blank" rel="noreferrer">Join the server</a> if you haven't.` : ""}</div>` : `<div class="notice info">${res.fallback ? "No signup webhook is configured yet, so" : "The signup could not be sent automatically (" + esc(res.error || "") + "), so"} please <a href="${esc(res.mailto)}">send it by email</a> or post it in the sign-ups channel on Discord. Your answers are pre-filled in the email.</div>`;
      if (res.ok) f.reset();
    });
  }
  if (!session && A.enabled()) {
    card.innerHTML = `<p class="kicker">Step 1</p><h3 style="font-size:1.6rem">Connect Discord</h3><p class="muted">Sign in so your driver entry is linked to your Discord account and league roles.</p><div class="actions"><a class="btn btn-discord" href="${esc(A.signInUrl(location.href))}">Sign in with Discord</a><button class="btn" type="button" id="skip">Continue without Discord</button></div>`;
    $("#skip").addEventListener("click", form);
  } else form();
});
