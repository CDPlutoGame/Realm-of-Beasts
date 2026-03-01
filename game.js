/** * REALM OF BEAAASTS - FANTASY LOGIC MIT KILLS & KRAFT */

let meta = { 
    hp: 100, 
    maxHpBase: 100, 
    gold: 0, 
    attackPower: 5,
    kills: 0 
};
let playerPos = 0;
let inFight = false;
let monster = null;

// --- SPEICHERN & LADEN ---
function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) {
        meta = JSON.parse(m);
        // Falls kills noch nicht existieren (altes Save), auf 0 setzen
        if (meta.kills === undefined) meta.kills = 0;
    }
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
}

// --- LOGIK ---
function log(msg) {
    const lc = document.getElementById("logContent");
    if (lc) lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
}

function updateStatus() {
    const sp = document.getElementById("statusPanel");
    const name = localStorage.getItem("playerName") || "Held";
    if (sp) {
        sp.innerHTML = `
            <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; font-size:12px;">
                <div style="margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:5px; color:#d4af37;">
                    <i class="fas fa-user-shield"></i> <b>${name}</b>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; text-align:left;">
                    <span style="color:#ef4444;"><i class="fas fa-heartbeat"></i> HP: ${meta.hp}/${meta.maxHpBase}</span>
                    <span style="color:#f59e0b;"><i class="fas fa-coins"></i> Gold: ${meta.gold}</span>
                    <span style="color:#60a5fa;"><i class="fas fa-khanda"></i> Kraft: ${meta.attackPower}</span>
                    <span style="color:#a855f7;"><i class="fas fa-skull"></i> Kills: ${meta.kills}</span>
                </div>
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
        t.style.height = "30px";
        t.style.background = i === playerPos ? "#444" : "#1a1a1a";
        t.style.border = "1px solid #333";
        t.style.display = "flex"; t.style.alignItems = "center"; t.style.justifyContent = "center";
        t.innerHTML = i === playerPos ? '<i class="fas fa-walking" style="color:white;"></i>' : "";
        b.appendChild(t);
    }
}

function setActionBtn() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    if (inFight) {
        fp.innerHTML = `
            <div style="border:2px solid #b91c1c; padding:15px; background:#200; border-radius:10px;">
                <div style="margin-bottom:10px; color:#f87171;"><i class="fas fa-dragon"></i> ${monster.name} (HP: ${monster.hp})</div>
                <button onclick="attack()" class="game-btn" style="background:#b91c1c;">⚔️ ZUSCHLAGEN</button>
            </div>`;
    } else {
        fp.innerHTML = `<button onclick="move()" class="game-btn" style="background:#1d4ed8;"><i class="fas fa-shoe-prints"></i> VORRÜCKEN</button>`;
    }
}

window.move = () => {
    if (inFight) return;
    playerPos = (playerPos + 1) % 30;
    if (Math.random() < 0.3) {
        monster = { name: "Beast", hp: 10 + meta.kills, atk: 4 + Math.floor(meta.kills/5), gold: 15 };
        inFight = true;
        log("Monster gesichtet!");
    } else { log("Du wanderst weiter..."); }
    renderBoard(); setActionBtn(); updateStatus(); saveData();
};

window.attack = () => {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.gold += monster.gold;
        meta.kills += 1; // Kill zählen!
        inFight = false;
        log(`Sieg! +${monster.gold} Gold. (${meta.kills}. Kill)`);
    } else {
        meta.hp -= monster.atk;
        log(`Aua! -${monster.atk} HP`);
        if (meta.hp <= 0) {
            log("💀 Besiegt! Rückzug ins Lager...");
            meta.hp = meta.maxHpBase; playerPos = 0; inFight = false;
        }
    }
    renderBoard(); setActionBtn(); updateStatus(); saveData();
};

window.buyUpgrade = (type) => {
    const cost = 100;
    if (type === 'hp' && meta.gold >= cost) {
        meta.gold -= cost; meta.maxHpBase += 5; meta.hp = meta.maxHpBase;
        log("💖 Max HP permanent erhöht!");
    } else if (type === 'atk' && meta.gold >= cost) {
        meta.gold -= cost; meta.attackPower += 5;
        log("⚔️ Kraft permanent erhöht!");
    } else { log("⚠️ Zu wenig Gold!"); }
    saveData(); updateStatus();
};

function checkAndStart() {
    if (localStorage.getItem("playerName")) {
        loadData(); updateStatus(); renderBoard(); setActionBtn();
    }
}
window.addEventListener('load', checkAndStart);
setInterval(() => {
    const b = document.getElementById("board");
    if (localStorage.getItem("playerName") && b && b.style.display !== "grid") checkAndStart();
}, 1000);
