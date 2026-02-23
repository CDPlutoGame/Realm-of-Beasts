// auth-overlay.js — Mobile + Desktop getrennt

(function () {

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function ensureStyles() {
    if (document.getElementById("authStyle")) return;

    const s = document.createElement("style");
    s.id = "authStyle";
    s.textContent = `

/* ===== MOBILE ===== */
@media (max-width:768px){

  #authCard{
    width:90vw;
    border-radius:20px;
    padding:20px;
  }

  #authCard h2{
    font-size:22px;
    text-align:center;
  }

  #authCard input{
    font-size:16px;
    padding:14px;
  }

  #authCard button{
    font-size:16px;
    padding:14px;
  }

}

/* ===== DESKTOP ===== */
@media (min-width:769px){

  #authCard{
    width:420px;
    border-radius:14px;
    padding:18px;
  }

}

#authOverlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.75);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:9999;
}

#authCard{
  background:#121212;
  color:#fff;
  border:1px solid rgba(255,255,255,.15);
  box-shadow:0 20px 60px rgba(0,0,0,.6);
  font-family:system-ui;
}

#authCard input{
  width:100%;
  margin-bottom:12px;
  border-radius:12px;
  border:1px solid rgba(255,255,255,.2);
  background:#1b1b1b;
  color:white;
}

#btnRegister{
  width:100%;
  background:#2b8a3e;
  color:white;
  border:none;
  border-radius:12px;
  margin-bottom:10px;
}

#btnLogin{
  width:100%;
  background:#1f6feb;
  color:white;
  border:none;
  border-radius:12px;
}

    `;
    document.head.appendChild(s);
  }

  function createOverlay() {

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
      const n = document.getElementById("authName").value;
      const p = document.getElementById("authPass").value;
      await window.__ONLINE_AUTH__.login(n,p);
    };

    document.getElementById("btnRegister").onclick = async () => {
      const n = document.getElementById("authName").value;
      const p = document.getElementById("authPass").value;
      await window.__ONLINE_AUTH__.register(n,p);
    };
  }

  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",createOverlay);
  else
    createOverlay();

})();