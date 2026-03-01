/** * REALM OF BEAAASTS - ROGUELITE SHOP EDITION */

let meta = { 
    hp: 30, maxHpBase: 30, gold: 0, attackPower: 5, kills: 0, rounds: 1, hpBought: 0, atkBought: 0 
};
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false; // Neu: Kontrolliert, ob der Shop gerade aktiv ist

window.openLogin = () => {
    document.getElementById("loginModal").style.display = "flex";
};

window.submitHeroName = () => {
    const val = document.getElementById("heroNameInput").value.trim();
    if (val) {
        localStorage.setItem("playerName", val);
        document.getElementById("loginModal").style.display = "none";
        checkAndStart();
    }
};

function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) meta = JSON.parse(m);
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
    const savedEvents = localStorage.getItem("game_events");
    if (savedEvents) boardEvents = JSON.parse(savedEvents); else generateBoardEvents();
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
    localStorage.setItem("game_events", JSON.stringify(boardEvents));
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if (lc) lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        const rand = Math.random();
        if (rand < 0.2) {
            const mRand = Math.random();
            if (mRand < 0.5) boardEvents[i] = "frog";
            else if (mRand < 0.85) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (rand < 0.3) boardEvents[i] = "gold";
    }
    saveData();
}

function updateStatus() {
    const sp = document.getElementById("statusPanel");
    const name = localStorage.getItem("playerName") || "Held";
    const hpCost = 100 + (meta.hpBought * 5);
    const atkCost = 100 + (meta.atkBought * 5);

    if (sp) {
        sp.innerHTML = `
            <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; font-size:11px;">
                <div style="margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:5px; color:#d4af37; display:flex; justify-content:space-between;">
                    <span><i class="fas fa-crown"></i> RUNDE: ${meta.rounds}</span>
                    <span><b>${name}</b></span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; text-align:left;">
                    <span style="color:#ef4444;"><i class="fas fa-heart"></i> HP: ${meta.hp}/${meta.maxHpBase}</span>
                    <span style="color:#f59e0b;"><i class="fas fa-coins"></i> Gold: ${meta.gold}</span>
                    <span style="color:#60a5fa;"><i class="fas fa-khanda"></i> Kraft: ${meta.attackPower}</span>
                    <span style="color:#a855f7;"><i class="fas fa-skull"></i> Kills: ${meta.kills}</span>
                </div>
            </div>`;
    }
    
    // Shop UI Logik
    document.getElementById("shopPanel").style.display = "block";
    const btnHp = document.getElementById("btn-hp");
    const btnAtk = document.getElementById("btn-atk");

    btnHp.innerHTML = `<i class="fas fa-heart"></i> +5 HP <span style="margin-left:auto;">${hpCost} 💰</span>`;
    btnAtk.innerHTML = `<i class="fas fa-sword"></i> +5 ATK <span style="margin-left:auto;">${atkCost} 💰</span>`;

    // Buttons deaktivieren, wenn nicht im Shop-Modus
    if (!shopOpen) {
        btnHp.style.opacity = "0.3";
        btnHp.style.cursor = "not-allowed";
        btnHp.disabled = true;
        btnAtk.style.opacity = "0.3";
        btnAtk.style.cursor = "not-allowed";
        btnAtk.disabled = true;
    } else {
        btnHp.style.opacity = "1";
        btnHp.style.cursor = "pointer";
        btnHp.disabled = false;
        btnAtk.style.opacity = "1";
        btnAtk.style.cursor = "pointer";
        btnAtk.disabled =
