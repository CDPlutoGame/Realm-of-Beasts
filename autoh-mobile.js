// ===== MOBILE OVERLAY =====
(function(){

  function createOverlay(){

    const overlay = document.createElement("div");
    overlay.id = "authOverlay";

    overlay.innerHTML = `
      <div id="authCard">
        <h2>📱 Mobile Start</h2>
        <input id="mobileName" placeholder="Dein Name">
        <button id="mobileLogin">Spielen</button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("mobileLogin").onclick = login;
  }

  function login(){
    const name = document.getElementById("mobileName").value.trim();
    if(!name) return alert("Name eingeben");

    localStorage.setItem("mobileUser", name);
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
      el.style.top = "10px";
      el.style.left = "50%";
      el.style.transform = "translateX(-50%)";
      el.style.color = "white";
      el.style.fontSize = "16px";
      document.body.appendChild(el);
    }
    el.textContent = name;
  }

  function injectStyle(){
    const style = document.createElement("style");
    style.textContent = `
      #authOverlay{
        position:fixed;
        inset:0;
        background:black;
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:9999;
      }
      #authCard{
        background:#1b1b1b;
        padding:25px;
        width:90%;
        border-radius:20px;
        color:white;
      }
      #authCard input{
        width:100%;
        padding:14px;
        margin-bottom:20px;
        font-size:16px;
      }
      #authCard button{
        width:100%;
        padding:14px;
        background:#2b8a3e;
        color:white;
        border:none;
        font-size:16px;
      }
    `;
    document.head.appendChild(style);
  }

  function init(){
    injectStyle();
    const saved = localStorage.getItem("mobileUser");
    if(saved){
      showName(saved);
    }else{
      createOverlay();
    }
  }

  init();

})();