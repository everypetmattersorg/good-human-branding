(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;
  var status = document.getElementById("form-status");
  var button = form.querySelector('button[type="submit"]');
  var cfg = window.GHB_CONFIG || {};

  function say(msg, tone) {
    status.textContent = msg;
    status.style.color = tone === "error" ? "#A3461F" : "#4E4639";
  }

  function values() {
    var data = new FormData(form);
    return {
      name: (data.get("name") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      organization: (data.get("organization") || "").toString().trim() || null,
      topic: (data.get("topic") || "").toString() || null,
      message: (data.get("message") || "").toString().trim(),
      website: (data.get("website") || "").toString() // honeypot
    };
  }

  function thanks(name) {
    var card = form.parentElement;
    form.remove();
    var box = document.createElement("div");
    box.setAttribute("role", "status");
    box.style.cssText = "padding:40px 28px;display:flex;flex-direction:column;gap:12px";
    var h = document.createElement("p");
    h.style.cssText = "margin:0;font-family:'Caveat',cursive;font-weight:700;font-size:2.2rem;line-height:1;color:#A3461F";
    h.textContent = "signed & sent!";
    var p = document.createElement("p");
    p.style.cssText = "margin:0;font-family:'Zilla Slab',Georgia,serif;font-weight:600;font-size:1.4rem;line-height:1.3";
    p.textContent = "Thanks" + (name ? ", " + name.split(" ")[0] : "") + ". Your note is on its way up the trail, and I'll be in touch soon.";
    var a = document.createElement("a");
    a.href = "/";
    a.textContent = "← back to the park";
    a.style.cssText = "font-weight:600;padding-top:6px";
    box.appendChild(h); box.appendChild(p); box.appendChild(a);
    card.appendChild(box);
  }

  function mailtoFallback(v) {
    var to = cfg.contactEmail || "erin@confluencecreativeco.com";
    var subject = "Trail register: " + (v.topic || "hello") + " from " + v.name;
    var body = v.message + "\n\n— " + v.name + " (" + v.email + ")" + (v.organization ? "\n" + v.organization : "");
    window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    say("Opening your email app to send this. If nothing opens, write to " + to + ".");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = values();
    if (v.website) { thanks(v.name); return; } // bot filled the hidden field
    if (!form.reportValidity()) return;

    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) { mailtoFallback(v); return; }

    button.disabled = true;
    say("Sending…");
    var headers = {
      "Content-Type": "application/json",
      apikey: cfg.supabaseAnonKey,
      Prefer: "return=minimal"
    };
    // Legacy anon keys are JWTs and also go in Authorization; publishable keys don't.
    if (/^eyJ/.test(cfg.supabaseAnonKey)) headers.Authorization = "Bearer " + cfg.supabaseAnonKey;
    fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/contact_messages", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        name: v.name,
        email: v.email,
        organization: v.organization,
        topic: v.topic,
        message: v.message,
        page: location.pathname
      })
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      thanks(v.name);
    }).catch(function () {
      button.disabled = false;
      say("Hmm, that didn't go through. Please try again, or email " + (cfg.contactEmail || "erin@confluencecreativeco.com") + ".", "error");
    });
  });
})();
