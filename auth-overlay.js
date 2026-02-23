// auth-overlay.js — Clean App Style + Auto Name + Status + Logout

(function () {

  function injectStyles() {
    if (document.getElementById("authStyle")) return;

    const style = document.createElement("style");
    style.id = "authStyle";
    style.textContent = `

/* ===== OVERLAY ===== */
#authOverlay{
  position:fixed;
  inset:0;
  background:linear-gradient(180deg,#0b0b0b,#141414);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
  font-family:system-ui,-apple-system,Segoe UI,Roboto;
}

/* ===== CARD ===== */
#authCard{
  width:92vw;
  max-width:420px;
  background:#181818;
  padding:28px;
  border-radius:26px;
  box-shadow:0 30px 90px rgba(0,0,0,.7);
  text-align:center;
  animation:fadeIn .25s ease;
}

#authCard h2{
  margin-bottom:22px;
  font-size:22px;
}

/* ===== INPUT ===== */
#authCard input{
  width:100%;
  padding:16px;
  margin-bottom:16px;
  border-radius:16px;
  border:1px solid rgba(255,255,255,.15);
  background:#111;
  color:white;
  font-size:16px;
}

#authCard input:focus{
  outline:none;
  border:1px solid #1f6feb;
}

/* ===== BUTTONS ===== */
#btnRegister,#btnLogin{
  width:100%;
  padding:16px;
  border:none;
  border-radius:16px;
  font-size:16px;
  font-weight:600;
  cursor:pointer;
  transition:.15s;
}

#btnRegister{
  background:#2b8a3e;
  margin-bottom:12px;
}

#btnLogin{
  background:#1f6feb;
}

#btnRegister:active,#btnLogin:active{
  transform:scale(.96);
}

/* ===== TOP STATUS ===== */
#authTopBar{
  position:fixed;
  top:12px;
  right:12px;
  display:flex;
  gap:8px;
  align-items:center;
  z-index:10000;
}

#authStatus{
  background:rgba(0,0,0,.6);
  padding:8px 12px;
  border-radius:14px;
  font-size:13px;
  border:1px solid rgba(255,255,255,.2);
}

#authLogout{
  background:#b42318;
  border:none;
  padding:8px 12px;
  border-radius:14px;
  color:white;
  cursor:pointer;
  display:none;
}

/* ===== ANIMATION ===== */
@keyframes fadeIn{
  from{opacity:0; transform:translateY(10px);}
  to{opacity:1; transform:translateY(0);}
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

    injectStyles();

    // Top Status Bar
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

    // Initial check
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