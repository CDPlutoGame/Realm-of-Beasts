/** * REALM OF BEAAASTS - FINALE FANTASY EDITION */

let meta = { hp: 100, maxHpBase: 100, gold: 0, attackPower: 5 };
let playerPos = 0;
let inFight = false;
let monster = null;

// --- SPEICHERN & LADEN ---
function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) meta = JSON.parse(m);
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
}

// --- SPIEL-LOGIK ---
function log(msg) {
    const lc = document.getElementById("logContent");
    if (lc) lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
}

// Status-Panel mit Fantasy-Icons
function updateStatus() {
    const sp = document.getElementById("statusPanel");
    const name = localStorage.getItem("playerName") || "Unbekannter Held";
    if (sp) {
        sp.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#1e1e1e; padding:12px; border-radius:10px; border:1px solid #444; box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);">
                <span style="font-weight: bold; color: #e5e7eb;">
                    <i class="fas fa-user-shield" style="margin-right: 8px; color: #9ca3af;"></i> ${name}
                </span>
                <span style="color:#ef4444; font-weight: bold;">
                    <i class="fas fa-heartbeat" style="margin-right: 6px;"></i> ${meta.hp}/${meta.maxHpBase}
                </span>
                <span style="color:#f59e0b; font-weight: bold;">
                    <i class="fas fa-coins" style="margin-right: 6px;"></i> ${meta.gold}
                </span>
            </div>`;
    }
}

function renderBoard() {
    const b = document.getElementById("board");
    if (!b) return;
    b.style.display = "grid";
    b.style.gridTemplateColumns = "repeat(10, 1fr)";
    b.style.gap = "4px";
    b.innerHTML = "";

    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
