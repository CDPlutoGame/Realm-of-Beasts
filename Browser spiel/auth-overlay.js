// auth-overlay.js — FINAL (Register/Login Overlay + Status/Logout oben rechts)
// ✅ funktioniert ohne nameInput/nameConfirmButton (game.js v12)
// ✅ hält Overlay-State immer korrekt
(function () {
  function removeNewGameAndReloadOnly() {
    document.getElementById("newGameButton")?.remove();
    document.querySelectorAll("button, a, input[type=button], input[type=submit]").forEach((el) => {
      const t = ((el.textContent || el.value || "") + "").trim().toLowerCase();
      if (t.includes("neu laden") || t.includes("neues spiel")) el.remove();
    });
  }

  function ensureStyles() {
    if (document.getElementById("authOverlayStyle")) return;
    const s = document.createElement("style");
    s.id = "authOverlayStyle";
    s.textContent = `
      #authOverlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;z-index:9999}
      #authCard{width:min(520px,92vw);background:#121212;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;box-shadow:0 18px 60px rgba(0,0,0,.5)}
      #authCard h2{margin:0 0 10px 0;font-size:20px}
      #authCard .row{display:flex;gap:10px;margin:10px 0}
      #authCard input{flex:1;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#1b1b1b;color:#fff;outline:none}
      #authCard button{padding:10px 12px;border-radius:10px;border:none;cursor:pointer;font-weight:700}
      #btnRegister{background:#2b8a3e;color:#fff}
      #btnLogin{background:#1f6feb;color:#fff}
      #authMsg{min-height:18px;opacity:.95;font-size:13px}

      #authTopRight{position:fixed;right:12px;top:12px;z-index:10000;display:flex;gap:8px;align-items:center}
      #authStatus{background:rgba(0,0,0,.55);color:#fff;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-size:12px}
      #authLogout{display:none;background:#b42318;color:#fff;padding:8px 10px;border-radius:10px;border:none;cursor:pointer;font-weight:800}
    `;
    document.head.appendChild(s);
  }

  async function waitAuthLoaded() {
    for (let i = 0; i < 150; i++) {
      if (window.__ONLINE_AUTH__?.status) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  }

  function setNameIntoGame(nameKey) {
    // game.js v12 liest nur localStorage + polling -> reicht völlig
    try { localStorage.setItem("mbr_current_name_online_v10", String(nameKey || "")); } catch {}
  }

  function createUI() {
    ensureStyles();
    removeNewGameAndReloadOnly();

    // Top-right Status + Logout
    const top = document.createElement("div");
    top.id = "authTopRight";
    top.innerHTML = `<div id="authStatus">🔴 Nicht eingeloggt</div><button id="authLogout" type="button">Logout</button>`;
    document.body.appendChild(top);

    const statusEl = document.getElementById("authStatus");
    const logoutEl = document.getElementById("authLogout");

    // Overlay
    const overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.innerHTML = `
      <div id="authCard">
        <h2>🔐 Anmeldung</h2>
        <div id="authMsg"></div>
        <div class="row"><input id="authName" placeholder="Benutzername (3-24)" autocomplete="username"></div>
        <div class="row"><input id="authPass" placeholder="Passwort (min 6)" type="password" autocomplete="current-password"></div>
        <div class="row">
          <button id="btnRegister" type="button">Registrieren</button>
          <button id="btnLogin" type="button">Login</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const msg = document.getElementById("authMsg");
    const nameEl = document.getElementById("authName");
    const passEl = document.getElementById("authPass");
    const btnRegister = document.getElementById("btnRegister");
    const btnLogin = document.getElementById("btnLogin");

    function setMsg(t, ok) {
      msg.textContent = t || "";
      msg.style.color = ok ? "#7CFC9A" : "#ffb4b4";
    }

    function showLoggedIn(nameKey) {
      overlay.style.display = "none";
      statusEl.textContent = `🟢 Eingeloggt als ${nameKey || ""}`;
      logoutEl.style.display = "inline-block";
      setNameIntoGame(nameKey || "");
      removeNewGameAndReloadOnly();
    }

    function showLoggedOut() {
      overlay.style.display = "flex";
      statusEl.textContent = "🔴 Nicht eingeloggt";
      logoutEl.style.display = "none";
      setNameIntoGame(""); // ✅ wichtig: nameKey löschen
      setMsg("");
      btnRegister.disabled = false;
      btnRegister.title = "";
    }

    function getCreds() {
      const n = (nameEl.value || "").trim();
      const p = (passEl.value || "").trim();
      if (!n) throw new Error("Bitte Benutzername eingeben.");
      if (p.length < 6) throw new Error("Passwort min. 6 Zeichen.");
      return { n, p };
    }

    btnRegister.onclick = async () => {
      try {
        if (!window.__ONLINE_AUTH__?.register) return setMsg("❌ ranking-online.js lädt nicht.", false);
        const { n, p } = getCreds();
        setMsg("Registriere…", true);
        await window.__ONLINE_AUTH__.register(n, p);
        const st = window.__ONLINE_AUTH__.status;
        setMsg("✅ Registriert & eingeloggt!", true);
        showLoggedIn(st.nameKey || n);
      } catch (e) {
        const code = e?.code || "";
        if (code === "auth/email-already-in-use") {
          setMsg("Schon registriert. Bitte Login benutzen.", false);
          btnRegister.disabled = true;
          btnRegister.title = "Schon registriert – bitte Login.";
        } else {
          setMsg(`❌ ${code || e?.message || e}`, false);
        }
      }
    };

    btnLogin.onclick = async () => {
      try {
        if (!window.__ONLINE_AUTH__?.login) return setMsg("❌ ranking-online.js lädt nicht.", false);
        const { n, p } = getCreds();
        setMsg("Logge ein…", true);
        await window.__ONLINE_AUTH__.login(n, p);
        const st = window.__ONLINE_AUTH__.status;
        setMsg("✅ Eingeloggt!", true);
        showLoggedIn(st.nameKey || n);
        try { window.renderLeaderboard?.(); } catch {}
      } catch (e) {
        setMsg(`❌ ${e?.code || e?.message || e}`, false);
      }
    };

    logoutEl.onclick = async () => {
      try {
        if (!window.__ONLINE_AUTH__?.logout) return setMsg("❌ ranking-online.js lädt nicht.", false);
        await window.__ONLINE_AUTH__.logout();
        showLoggedOut();
      } catch (e) {
        setMsg(`❌ ${e?.code || e?.message || e}`, false);
      }
    };

    // ✅ Initialer Zustand (wartet bis ranking-online.js da ist)
    (async () => {
      const ok = await waitAuthLoaded();
      if (!ok) return setMsg("❌ Online-Login nicht geladen (ranking-online.js).", false);

      const st = window.__ONLINE_AUTH__.status;
      if (st.loggedIn) showLoggedIn(st.nameKey || "");
      else showLoggedOut();
    })();

    // ✅ Overlay-State immer korrekt halten (JETZT im richtigen Scope)
    setInterval(() => {
      const st = window.__ONLINE_AUTH__?.status;
      if (!st) return;

      if (st.loggedIn) showLoggedIn(st.nameKey || "");
      else showLoggedOut();
    }, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", createUI);
  else createUI();
})();