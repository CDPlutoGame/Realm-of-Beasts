(function(){

  function createOverlay(){
    const overlay = document.createElement("div");
    overlay.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        background:black;
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:9999;
      ">
        <div style="
          background:#1b1b1b;
          padding:20px;
          width:90%;
          border-radius:20px;
          color:white;
        ">
          <h2>📱 Mobile Login</h2>
          <input id="mobileName" placeholder="Name" style="width:100%;padding:14px;margin-bottom:15px;">
          <button onclick="loginMobile()" style="width:100%;padding:14px;">Start</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  window.loginMobile = function(){
    const name = document.getElementById("mobileName").value;
    localStorage.setItem("mobileUser", name);
    location.reload();
  };

  if(!localStorage.getItem("mobileUser")){
    createOverlay();
  }

})();