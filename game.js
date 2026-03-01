/** * REALM OF BEAAASTS - FIX-DAMAGE & STARTER EDITION */

let meta = { 
    hp: 30,             // Start-HP auf 30 gesetzt
    maxHpBase: 30,      // Max-HP Basis ebenfalls 30
    gold: 0, 
    attackPower: 5,     // Start-Schaden
    kills: 0 
};
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = []; 

// --- SPEICHERN & LADEN ---
function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) {
        meta = JSON.parse(m);
    }
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
    
    const savedEvents = localStorage.getItem("game_events");
    if (savedEvents) {
        boardEvents = JSON.parse(savedEvents);
    } else {
        generateBoardEvents();
    }
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
    localStorage.setItem("game_events", JSON.stringify(boardEvents));
}

// --- BOARD GENERIERUNG ---
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        const rand = Math.random();
        if (rand < 0.2) boardEvents[i] = "monster"; 
        else if (rand < 0.3) boardEvents[i] = "gold"; 
    }
    saveData();
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
                <div style="margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:5px; color:#d4af37; display:flex; justify-content:space-between;">
                    <span><i class="fas fa-user-shield"></i> <b>${name}</b></span>
                    <button onclick="logout()" style="background:none; border:none; color:grey; font-size:10px;">Logout</button>
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
        t.style.height = "35px";
        t.style.background = i === playerPos ? "#444" : "#1a1a1a";
        t.style.border = "1px solid #333";
        t.style.display = "flex"; t.style.alignItems = "center"; t.style.justifyContent = "center";
        
        if (i === playerPos) {
            t.innerHTML = '<i class="fas fa-walking" style="color:white;"></i>';
        } else if (boardEvents[i] === "monster") {
            t.innerHTML = '<i class="fas fa-dragon" style="color:#772222;"></i>';
        } else if (boardEvents[i] === "gold") {
            t.innerHTML = '<i class="fas fa-coins" style="color:#aa8800;"></i>';
        }
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
                <button onclick="attack()" class="game-btn" style="background:#b91c1c;">⚔️ SCHLAG: -${meta.attackPower} HP</button>
            </div>`;
    } else {
        fp.innerHTML = `<button onclick="move()" class="game-btn" style="background:#1d4ed8;"><i class="fas fa-shoe-prints"></i> VORRÜCKEN</button>`;
    }
}

window.move = () => {
    if (inFight) return;
    playerPos++;
    if (playerPos >= 30) {
        playerPos = 0;
        generateBoardEvents();
        log("Neues Gebiet betreten!");
    }
    
    const event = boardEvents[playerPos];
    if (event === "monster") {
        // Monster-HP skalieren leicht mit Kills
        monster = { name: "Bestie", hp: 15 + (meta.kills * 2), atk: 5 + Math.floor(meta.kills/3), gold: 20 };
        inFight = true;
        log("Kampf beginnt!");
        boardEvents[playerPos] = null;
    } else if (event === "gold") {
        meta.gold += 10;
        log("Gold gefunden! +10 💰");
        boardEvents[playerPos] = null;
    }
    
    renderBoard(); setActionBtn(); updateStatus(); saveData();
};

window.attack = () => {
    // FIXER SCHADEN (kein Random)
    monster.hp -= meta.attackPower;
    log(`Du triffst für genau ${meta.attackPower} Schaden.`);

    if (monster.hp <= 0) {
        meta.gold += monster.gold;
        meta.kills += 1;
        inFight = false;
        log(`Sieg! +${monster.gold} Gold.`);
    } else {
        // Monster-Schaden ebenfalls fix
        meta.hp -= monster.atk;
        log(`Monster beißt zu! -${monster.atk} HP.`);
        
        if (meta.hp <= 0) {
            log("💀 Game Over! Du wachst im Lager auf.");
            meta.hp = meta.maxHpBase; 
            playerPos = 0; 
            inFight = false;
            generateBoardEvents(); 
        }
    }
    renderBoard(); setActionBtn(); updateStatus(); saveData();
};

window.buyUpgrade = (type) => {
    const cost = 100;
    if (type === 'hp' && meta.gold >= cost) {
        meta.gold -= cost; meta.maxHpBase += 5; meta.hp = meta.maxHpBase;
        log("💖 Max HP +5 permanent!");
    } else if (type === 'atk' && meta.gold >= cost) {
        meta.gold -= cost; meta.attackPower += 5;
        log("⚔️ Kraft +5 permanent!");
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
