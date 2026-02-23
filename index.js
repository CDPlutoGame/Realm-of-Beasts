(function(){

  function getStoredName(){
    return localStorage.getItem("mobileUser");
  }

function askForName(){
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";

  overlay.innerHTML = `
    <div style="background:#1b1b1b;padding:20px;border-radius:15px;width:90%;max-width:400px;text-align:center;color:white;">
      <h2>Login</h2>
      <input id="nameInput" placeholder="Dein Name"
        style="width:100%;padding:12px;margin-bottom:10px;border-radius:10px;border:none;">
      <button id="startBtn"
        style="width:100%;padding:12px;border-radius:10px;border:none;background:#1f6feb;color:white;">
        Start
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("startBtn").onclick = function(){
    const name = document.getElementById("nameInput").value.trim();
    if(!name) return;

    localStorage.setItem("mobileUser", name);
    showName(name);
    overlay.remove();
  };
}
