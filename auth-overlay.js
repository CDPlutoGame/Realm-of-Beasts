// auth-overlay.js — COMPLETE VERSION (Mobile + Status + Auto Name Fill)

(function () {

  function ensureStyles() {
    if (document.getElementById("authStyle")) return;

    const style = document.createElement("style");
    style.id = "authStyle";
    style.textContent = `

/* Overlay */
#authOverlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.75);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
}

/* Card */
#authCard{
  background:#121212;
  color:white;
  font-family:system-ui;
  border:1px solid rgba(255,255,255,.15);
  box-shadow:0 20px 60px rgba(0,0,0,.6);
}

/* Mobile */
@media (max-width:768px){
  #authCard{
    width:90vw;
    padding:22px;
    border-radius:22px;
  }
}

/* Desktop */
@media (min-width:769px){
  #authCard{
    width:420px;
    padding:20px;
    border-radius:14px;
  }
}

#authCard input{
  width:100%;
  padding:14px;
  margin-bottom:14px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.2);
  background:#1b1b1b;
  color:white;
}

#btnRegister, #btnLogin{
  width:100%;
  padding:14px;
  border:none;
  border-radius:12px;
  font-size:15px;
  cursor:pointer;
}

#btnRegister{
  background:#2b8a3e;
  margin-bottom:10px;
}

#btnLogin{
  background:#1f6feb;
}

/* Status oben rechts */
#authTopBar{
  position:fixed;
  top:12px;
  right:12px;
  z-index:10000;
  display:flex;
  gap:8px;
  align-items:center;
}

#authStatus{
  background:rgba(0,0,0,.6);
  padding:8px 12px;
  border-radius:12px;
  font-size:12px;
  border:1px solid rgba(255,255,255,.2);
}

#authLogout{
  background:#b42318;
  border:none;
  padding:8px 12px;
  border-radius:12px;
  color:white;
  cursor:pointer;
  display:none;
}

    `;
    document.head.appendChild(style);
  }

  function fillNameIntoGame() {
    const st = window.__ONLINE_AUTH__?.status;
    if (!st || !st.loggedIn || !st.nameKey) return;

    localStorage.setItem("mbr_current_name_online_v10", st.nameKey);

    const nameInput = document.getElementById("nameInput");
    const nameBtn = document.getElementById("nameConfirmButton");

    if (nameInput) nameInput.value = st.nameKey;
    if (nameBtn) nameBtn.click();
  }

  function createUI() {

    ensureStyles();

    // Top Bar
    const top = document.createElement("div");
    top.id = "authTopBar";
    top.innerHTML = `
      <div id="authStatus">🔴 Nicht eingeloggt</div>
      <button id="authLogout">Logout</button>
    `;
    document.body.appendChild(top);

    const statusEl = document.getElementById("authStatus");
    const logoutBtn = document.getElementById("authLogout");

    function showOverlay() {

      if (document.getElementById("authOverlay")) return;

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

      document.getElementById("btnLogin").onclick = async () => {
        const n = document.getElementById("authName").value.trim();
        const p = document.getElementById("authPass").value.trim();
        await window.__ONLINE_AUTH__.login(n,p);

        fillNameIntoGame();
        updateStatus();
        overlay.remove();
      };

      document.getElementById("btnRegister").onclick = async () => {
        const n = document.getElementById("authName").value.trim();
        const p = document.getElementById("authPass").value.trim();
        await window.__ONLINE_AUTH__.register(n,p);

        fillNameIntoGame();
        updateStatus();
        overlay.remove();
      };
    }

    function updateStatus() {
      const st = window.__ONLINE_AUTH__?.status;
      if (st && st.loggedIn) {
        statusEl.textContent = "🟢 " + st.nameKey;
        logoutBtn.style.display = "inline-block";
      } else {
        statusEl.textContent = "🔴 Nicht eingeloggt";
        logoutBtn.style.display = "none";
        showOverlay();
      }
    }

    logoutBtn.onclick = async () => {
      await window.__ONLINE_AUTH__.logout();
      updateStatus();
    };

    // Initial prüfen
    setTimeout(() => {
      updateStatus();
      fillNameIntoGame();
    }, 800);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", createUI);
  else
    createUI();

})();