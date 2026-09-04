/* Driver registration */
TRL.page("register", function () {
  const { $, $$, esc } = TRL;
  const E = TRL.E();
  const L = TRL.cfg().league || {};
  const s = TRL.season();
  TRL.setTitle("Register");
  const tiers = E.tiers(s);
  $("#r-tz").value = TRL.tz();
  $("#r-tier").innerHTML = '<option value="">Select…</option><option value="Let the admins decide">Let the admins decide</option>' + tiers.map((t) => `<option value="${esc(t.name)}">${esc(t.name)} — ${esc(t.raceDay)}s ${esc(t.raceTime)}</option>`).join("");
  $("#r-days").innerHTML = tiers.map((t) => `<label class="checkbox" style="margin-right:14px"><input type="checkbox" name="days" value="${esc(t.raceDay)}"> ${esc(t.raceDay)}s <span class="text-dim">(${esc(t.name)})</span></label>`).join("");
  $("#race-nights").innerHTML = tiers.map((t) => `<div class="row row--between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>${TRL.tierPill(t)} ${esc(t.name)}</span><span class="text-muted">${esc(t.raceDay)}s · ${esc(t.raceTime)}</span></div>`).join("") + `<p class="text-muted mt-2" style="font-size:.85rem">Lobby opens 15 minutes before. Times are UK time; your timezone is ${esc(TRL.tz())}.</p>`;
  const taken = Array.from(new Set((s.drivers || []).map((d) => Number(d.number)).filter(Boolean))).sort((a, b) => a - b);
  $("#taken-numbers").textContent = taken.length ? taken.join(", ") : "None yet";
  const numInput = $("#r-number");
  numInput.addEventListener("input", () => { const n = Number(numInput.value); numInput.setCustomValidity(n && taken.includes(n) ? "That number is already taken." : ""); numInput.closest(".field").querySelector(".error").textContent = numInput.validationMessage || "Choose a number from 2 to 99."; });

  const form = $("#reg-form"), status = $("#reg-status");
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (form.website && form.website.value) return; // honeypot
    if (!TRL.validateForm(form)) { status.innerHTML = '<div class="alert alert--error">Please fix the highlighted fields.</div>'; return; }
    const fd = new FormData(form);
    const days = $$('input[name="days"]:checked', form).map((x) => x.value).join(", ");
    const fields = [["Driver name", "name"], ["Gamertag", "tag"], ["Discord", "discord"], ["Email", "email"], ["Nationality", "nationality"], ["Number", "number"], ["Platform", "platform"], ["Input", "input"], ["Timezone", "timezone"], ["Experience", "experience"], ["Preferred tier", "tier"], ["Seat type", "role"], ["Teams", "teams"], ["About", "about"]].map(([name, key]) => ({ name, key, value: fd.get(key) || "" }));
    fields.splice(12, 0, { name: "Availability", key: "days", value: days || "—" });
    const btn = form.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Sending…";
    const res = await TRL.submitForm("registration", `New driver registration · ${fd.get("name")} (${fd.get("tier")})`, fields);
    btn.disabled = false; btn.textContent = "Submit registration";
    if (res.ok) {
      status.innerHTML = `<div class="alert alert--success"><strong>You're in the queue.</strong> An admin will confirm your seat on Discord. ${L.discordInvite ? `Make sure you've <a href="${esc(L.discordInvite)}" target="_blank" rel="noopener">joined the server</a>.` : ""}</div>`;
      form.reset(); $("#r-tz").value = TRL.tz(); window.scrollTo({ top: status.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
    } else {
      status.innerHTML = `<div class="alert alert--info">${res.fallback ? "This site has no form endpoint configured yet, so" : "Your registration could not be sent automatically (" + esc(res.error || "") + "), so"} please <a href="${esc(res.mailto)}">send it by email</a>${L.discordInvite ? ` or post it in the sign-ups channel on <a href="${esc(L.discordInvite)}" target="_blank" rel="noopener">Discord</a>` : ""}. Your answers are pre-filled in the email.</div>`;
    }
  });
});
