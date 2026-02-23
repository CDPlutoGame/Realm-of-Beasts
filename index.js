// index.js — Login Overlay (speichert Name kompatibel zu game.js)
(() => {
  const KEY_MAIN = "mbr_current_name_online_v10"; // <-- DAS liest game.js
  const KEY_MOBILE = "mobileUser";
  const KEY_PC = "pcUser";

  function setLabel(name) {
    const el = document.getElementById("playerName");
    if (el) el.textContent = name ? `Eingeloggt als: ${name}` : "";
  }

  function getName() {
    return (
      (localStorage.getItem(KEY_MAIN) || "").trim() ||
      (localStorage.getItem(KEY_MOBILE) || "").trim() ||
      (localStorage.getItem(KEY_PC) || "").trim()
    );
  }

  function saveName(name) {
    localStorage.setItem(KEY_MAIN, name);
    localStorage.setItem(KEY_MOBILE, name);
    localStorage.setItem(KEY_PC, name);
    setLabel(name);
  }

  function showLogin() {
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
        <h2 style="margin-top:0;">Login</h2>
        <input id="nameInput" placeholder="Dein Name (min. 3)"
          style="width:100%;padding:12px;margin-bottom:10px;border-radius:10px;border:none;">
        <button id="startBtn"
          style="width:100%;padding:12px;border-radius:10px;border:none;background:#c62828;color:white;font-weight:700;">
          Start
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector("#nameInput");
    const btn = overlay.querySelector("#startBtn");

    function submit() {
      const name = (input.value || "").trim();
      if (name.length < 3) return;
      saveName(name);
      overlay.remove();
      // game.js merkt es nach max. 0.5s automatisch (watchUserChange)
    }

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => e.key === "Enter" && submit());
    setTimeout(() => input.focus(), 50);
  }

  const existing = getName();
  if (existing) setLabel(existing);
  else window.addEventListener("DOMContentLoaded", showLogin);
})();
