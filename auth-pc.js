(function(){

  function createOverlay(){
    const overlay = document.createElement("div");
    overlay.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.8);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:9999;
      ">
        <div style="
          background:#111;
          padding:30px;
          width:400px;
          border-radius:12px;
          color:white;
        ">
          <h2>PC Anmeldung</h2>
          <input id="pcName" placeholder="Name" style="width:100%;padding:10px;margin-bottom:10px;">
          <button onclick="loginPC()" style="width:100%;padding:10px;">Login</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  window.loginPC = function(){
    const name = document.getElementById("pcName").value;
    localStorage.setItem("pcUser", name);
    location.reload();
  };

  if(!localStorage.getItem("pcUser")){
    createOverlay();
  }

})();