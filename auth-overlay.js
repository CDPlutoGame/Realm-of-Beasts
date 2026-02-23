// ===== AUTH OVERLAY COMPLETE CLEAN VERSION =====

(function () {

  // ---------- STYLE ----------
  function injectStyles() {
    if (document.getElementById("auth-style")) return;

    const style = document.createElement("style");
    style.id = "auth-style";

    style.textContent = `
      #authOverlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      #authCard {
        background: #121212;
        padding: 25px;
        border-radius: 18px;
        width: 90%;
        max-width: 400px;
        color: white;
        font-family: system-ui;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      }

      #authCard h2 {
        text-align: center;
        margin-bottom: 20px;
      }

      #authCard input {
        width: 100%;
        padding: 14px;
        margin-bottom: 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.2);
        background: #1b1b1b;
        color: white;
        font-size: 16px;
      }

      #authCard button {
        width: 100%;
        padding: 14px;
        border-radius: 12px;
        border: none;
        font-size: 16px;
        margin-bottom: 10px;
        cursor: pointer;
      }

      #btnRegister {
        background: #2b8a3e;
        color: white;
      }

      #btnLogin {
        background: #1f6feb;
        color: white;
      }
    `;

    document.head.appendChild(style);
  }

  // ---------- OVERLAY ----------
  function createOverlay() {

    injectStyles();

    const overlay = document.createElement("div");
    overlay.id = "authOverlay";

    overlay.innerHTML = `
      <div id="authCard">
        <h2>🔐 Anmeldung</h2>
        <input id="authName" placeholder="Benutzername">
        <input id="authPass" type="password" placeholder="Passwort">
        <button id="btnRegister">Registrieren</button>
        <button id="btnLogin">Login</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("btnLogin").onclick = handleLogin;
    document.getElementById("btnRegister").onclick = handleRegister;
  }

  // ---------- LOGIN ----------
  function handleLogin() {
    const name = document.getElementById("authName").value;
    const pass = document.getElementById("authPass").value;

    if (!name || !pass) {
      alert("Bitte alles ausfüllen");
      return;
    }

    localStorage.setItem("playerName", name);

    closeOverlay();
    updatePlayerName(name);
  }

  // ---------- REGISTER ----------
  function handleRegister() {
    const name = document.getElementById("authName").value;
    const pass = document.getElementById("authPass").value;

    if (!name || !pass) {
      alert("Bitte alles ausfüllen");
      return;
    }

    localStorage.setItem("playerName", name);

    closeOverlay();
    updatePlayerName(name);
  }

  // ---------- CLOSE ----------
  function closeOverlay() {
    const overlay = document.getElementById("authOverlay");
    if (overlay) overlay.remove();
  }

  // ---------- UPDATE NAME IN GAME ----------
  function updatePlayerName(name) {
    const el = document.getElementById("playerName");
    if (el) el.textContent = name;
  }

  // ---------- INIT ----------
  function init() {
    const saved = localStorage.getItem("playerName");

    if (saved) {
      updatePlayerName(saved);
    } else {
      createOverlay();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();