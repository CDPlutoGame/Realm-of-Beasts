/** * REALM OF BEAAASTS - GAME LOGIC */

let meta = { hp: 100, maxHpBase: 100, gold: 0, attackPower: 5 };
let playerPos = 0;
let inFight = false;
let monster = null;

// --- LADEN & SPEICHERN ---
function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) meta = JSON.parse(m);
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
}

// --- SPIEL-FUNKTIONEN ---
function log(msg) {
    const lc = document.getElementById("logContent");
    if (lc) lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
}

function updateStatus() {
    const sp = document.getElementById("statusPanel");
    const name = localStorage.getItem("playerName") || "Held";
    if (sp) {
        sp.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#222; padding:10px; border-radius:8px;">
                <span>👤 ${name}</span>
                <span style="color:#ff4444;">❤️ ${meta.hp}</span>
                <span style="color:#ffd700;">💰 ${meta.gold}</span>
            </div>`;
    }
}

function renderBoard() {
    const b = document.getElementById("board");
    if (!b) return;
    
    // Board sichtbar machen!
    b.style.display = "grid";
    b.style.gridTemplateColumns = "repeat(10, 1fr)";
    b.style.gap = "4px";
    b.innerHTML = "";

    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.style.height = "35px";
        t.style.background = i === playerPos ? "#555" : "#222";
        t.style.border = "1px solid #333";
        t.style.display = "flex";
        t.style.alignItems = "center";
        t.style.justifyContent = "center";
        t.innerHTML = i === playerPos ? "🧍" : "";
        b.appendChild(t);
    }
}

function setActionBtn() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    if (inFight) {
        fp.innerHTML = `
            <div style="border:2px solid #ff4444; padding:15px; background:#1a0505; border-radius:8px;">
                <div style="margin-bottom:10px;">👾 Monster (HP: ${monster.hp})</div>
                <button onclick="attack()" class="game-btn" style="background:#ff4444; width:100%; color:white;">⚔️ ANGRIFF</button>
            </div>`;
    } else {
        fp.innerHTML = `<button onclick="move()" class="game-btn" style="background:#3b82f6; width:100%; color:white;">👣 WEITERLAUFEN</button>`;
    }
}

window.move = () => {
    if (inFight) return;
    playerPos = (playerPos + 1) % 30;
    
    if (Math.random() < 0.3) {
        monster = { hp: 15 + Math.floor(playerPos/2), atk: 5, gold: 12 };
        inFight = true;
        log("Ein Monster versperrt den Weg!");
    } else {
        log("Du wanderst tiefer in den Wald...");
    }
    
    renderBoard();
    setActionBtn();
    updateStatus();
    saveData();
};

window.attack = () => {
    // Spieler greift an
    monster.hp -= meta.attackPower;
    
    if (monster.hp <= 0) {
        log(`Sieg! Du erhältst ${monster.gold} Gold.`);
        meta.gold += monster.gold;
        inFight = false;
    } else {
        // Monster schlägt zurück
        meta.hp -= monster.atk;
        log(`Das Monster trifft dich! -${monster.atk} HP`);
        
        if (meta.hp <= 0) {
            log("Du bist erschöpft... Rückzug ins Lager.");
            meta.hp = meta.maxHpBase;
            playerPos = 0;
            inFight = false;
        }
    }
    renderBoard();
    setActionBtn();
    updateStatus();
    saveData();
};

// --- START-SEQUENZ ---
function checkAndStart() {
    if (localStorage.getItem("playerName")) {
        loadData();
        updateStatus();
        renderBoard();
        setActionBtn();
        log("Spiel bereit. Klicke auf Laufen!");
    }
}

// Prüfen beim Laden
window.addEventListener('load', checkAndStart);

// Falls der User sich gerade erst einloggt (Intervall-Check)
setInterval(() => {
    const b = document.getElementById("board");
    if (localStorage.getItem("playerName") && b && b.style.display !== "grid") {
        checkAndStart();
    }
}, 1000);
