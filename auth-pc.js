// ===== PC OVERLAY =====
(function(){

  function createOverlay(){

    const overlay = document.createElement("div");
    overlay.id = "authOverlay";

    overlay.innerHTML = `
      <div id="authCard">
        <h2>PC Login</h2>
        <input id="pcName" placeholder="Benutzername">
        <button id="pcLogin">Start</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("pcLogin").onclick = login;
  }

  function login(){
    const name = document.getElementById("pcName").value.trim();
    if(!name) return alert("Name eingeben");

    localStorage.setItem("pcUser", name);
    closeOverlay();
    showName(name);
  }

  function closeOverlay(){
    document.getElementById("authOverlay")?.remove();
  }

  function showName(name){
    let el = document.getElementById("playerName");
    if(!el){
      el = document.createElement("div");
      el.id = "playerName";
      el.style.position = "fixed";
      el.style.top = "15px";
      el.style.right = "20px";
      el.style.color = "white";
      el.style.fontSize = "18px";
      document.body.appendChild(el);
    }
    el.textContent = "Spieler: " + name;
  }

  function injectStyle(){
    const style = document.createElement("style");
    style.textContent = `
      #authOverlay{
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.8);
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:9999;
      }
      #authCard{
        background:#111;
        padding:40px;
        width:420px;
        border-radius:12px;
        color:white;
        box-shadow:0 20px 60px rgba(0,0,0,0.6);
      }
      #authCard input{
        width:100%;
        padding:12px;
        margin-bottom:15px;
      }
      #authCard button{
        width:100%;
        padding:12px;
        background:#1f6feb;
        color:white;
        border:none;
      }
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectStyle();
    const saved = localStorage.getItem("pcUser");
    if(saved){
      showName(saved);
    }else{
      createOverlay();
    }
  }

  init();

})();