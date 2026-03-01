/** * REALM OF BEAAASTS - GAME LOGIC (LOKAL)
 */

// 1. Dein Profil (Ersatz für meta/profile.js mit Firebase)
let meta = {
    hp: 100,
    maxHpBase: 100,
    gold: 0,
    attackPower: 5,
    autoLevel: 0
};

let playerPos = 0;
let currentRounds = 1;
let inFight = false;
let monster = null;

// --- FUNKTIONEN ZUM SPEICHERN & LADEN (LOKAL) ---

function saveMeta() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_playerPos", playerPos);
}

function loadMeta() {
    const savedMeta = localStorage.getItem("game_meta");
    const savedPos = localStorage.getItem("game_playerPos");
    
    if (savedMeta) {
        meta = JSON.parse(savedMeta);
    }
    if (savedPos) {
        playerPos = parseInt(savedPos);
    }
}

// --- SPIEL LOGIK ---

function log(msg) {
    const logContent = document.getElementById("logContent");
    if (logContent) {
        logContent.innerHTML = `> ${msg}<br>` + logContent.innerHTML;
    }
}

function updateHud() {
    const el = document.getElementById("statusPanel");
    if (!el) return;
    
    const playerName = localStorage.getItem("playerName") || "Held";
    
    el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#333; padding:5px; border-radius:5px;">
            <div>👤 ${playerName} | ❤️ HP: ${meta.hp}/${meta.maxHpBase} | 💰 Gold: ${meta.gold}</div>
            <button onclick="logout()" style="background:#555; border:none; color:white; font-size:10px; padding:3px 8px; border-radius:3px;">Logout</button>
        </div>
    `;
}

function renderBoard() {
    const b = document.getElementById("board");
    if (!b) return;
    b.innerHTML = "";
    // Kleines Board-Layout
    b.style.display = "grid";
    b.style.gridTemplateColumns = "repeat(10, 1fr)";
    b.style.gap = "2px";

    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
