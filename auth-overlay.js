// auth-overlay.js — FULL FIXED VERSION (Mobile + Desktop getrennt + Auto Close)

(function () {

  function ensureStyles() {
    if (document.getElementById("authStyle")) return;

    const style = document.createElement("style");
    style.id = "authStyle";
    style.textContent = `

/* ===== OVERLAY ===== */
#authOverlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.75);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
}

/* ===== CARD ===== */
#authCard{
  background:#121212;
  color:white;
  font-family:system-ui;
  border:1px solid rgba(255,255,255,.15);
  box-shadow:0 20px 60px rgba(0,0,0,.6);
}

/* ===== MOBILE ===== */
@media (max-width:768px){
  #authCard{
    width:90vw;
    padding:22px;
    border-radius:22px;
  }
  #authCard h2{
    font-size:22px;
    text-align:center;
  }
}

/* ===== DESKTOP ===== */
@media (min-width:769px){
  #authCard{
    width:420px;
    padding:20px;
    border-radius:14px;
  }
}

/* ===== INPUTS ===== */
#authCard input{
  width:100%;
  padding:14px;
  margin-bottom:14px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.2);
  background:#1b1b1b;
  color:white;
  font-size:15px;
}

/* ===== BUTTONS ===== */
#btnRegister{
  width:100%;
  padding:14px;
  border:none;
  border-radius:12px;
  background:#2b8a3e;
  color:white;
  font-size:16px;
  margin-bottom:10px;
  cursor:pointer;
}

#btnLogin{
  width:100%;
  padding:14px;
  border:none;
  border-radius:12px;
  background:#1f6feb;
  color:white;
  font-size:16px;
  cursor:pointer;
}

    `;
    document.head.appendChild(style);
  }

  function createOverlay() {

    if (document.getElementById("authOverlay")) return;

    ensureStyles();

    const overlay = document.createElement("div");
    overlay.id = "authOverlay";

    overlay.innerHTML = `
      <div id="authCard">
        <h2>🔐 Anmeldung</h2>
        <input id="authName" placeholder="Benutzername (3-24)">
        <input id="authPass" type="password" placeholder="Passwort (min 6)">
        <button id="btnRegister">Registrieren</button>
        <button id="btnLogin">Login</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("btnLogin").onclick = async () => {
      const n = document.getElementById("authName").value.trim();
      const p = document.getElementById("authPass").value.trim();

      if (!n || !p) return;

      const ok = await window.__ONLINE_AUTH__.login(n, p);

      if (ok !== false) {
        overlay.remove(); // 🔥 HIER WIRD ES GESCHLOSSEN
      }
    };

    document.getElementById("btnRegister").onclick = async () => {
      const n = document.getElementById("authName").value.trim();
      const p = document.getElementById("authPass").value.trim();

      if (!n || !p) return;

      const ok = await window.__ONLINE_AUTH__.register(n, p);

      if (ok !== false) {
        overlay.remove(); // 🔥 schließt nach Registrierung
      }
    };
  }

  // Auto Start
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", createOverlay);
  else
    createOverlay();

})();