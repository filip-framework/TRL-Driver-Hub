TRL.page("login", async function () {
  const { $, esc, href } = TRL; const A = TRL.auth; const B = TRL.cfg().brand || {}; const F = TRL.cfg().f1 || {};
  TRL.setTitle("Sign in");
  const body = $("#login-body");
  if (location.hash.includes("access_token")) {
    const r = await A.handleCallback();
    if (r && r.session) { location.href = r.returnTo && !/login\.html/.test(r.returnTo) ? r.returnTo : href("f1/index.html"); return; }
    body.innerHTML = `<div class="notice bad">Discord did not return a valid session. Try again.</div>`;
  }
  const s = A.session();
  const returnTo = TRL.qs("returnTo") || href("f1/index.html");
  if (s) { body.innerHTML = `<p>Signed in as <b>${esc(s.name)}</b>.</p><div class="actions" style="justify-content:center"><a class="btn btn-primary" href="${esc(returnTo)}">Continue</a><button class="btn" type="button" id="signout">Sign out</button></div>`; $("#signout").addEventListener("click", () => { A.signOut(); location.reload(); }); return; }
  if (A.enabled()) {
    body.innerHTML = `<p>Use your ${esc(B.name)} Discord account. Race Control, steward and Team Principal roles determine which tools you can use.</p><a class="btn btn-discord btn-block" href="${esc(A.signInUrl(returnTo))}">Continue with Discord</a><p class="dim small mt-2">Authentication is handled by Discord. ${esc(F.code || B.name)} never receives your password.</p>`;
  } else {
    body.innerHTML = `<p>Use your ${esc(B.name)} Discord account. Race Control, steward and Team Principal roles determine which tools you can use.</p><div class="notice info" style="text-align:left"><b>Discord sign-in is not configured yet.</b><br>Create an application in the Discord developer portal, add <code>${esc(A.loginPage())}</code> as a redirect URL, then paste the client id (and optionally your server id) into <code>data/config.js</code>.</div><a class="btn btn-block mt-2" href="${esc(href("f1/signup.html"))}">Register without signing in</a>`;
  }
});
