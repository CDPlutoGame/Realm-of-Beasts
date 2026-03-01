/** * REALM OF BEAAASTS - VOLLSTÄNDIGE GAME LOGIC (LOKAL)
 */

// 1. Dein Profil & Spielstatus (Ersatz für meta/profile.js)
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

// --- SPEICHER-FUNKTIONEN (Lokal am Handy) ---

function saveGameState() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_playerPos", playerPos);
    localStorage.setItem("game_rounds", currentRounds);
}

function loadGameState() {
    const savedMeta = localStorage.getItem("game_meta");
    const savedPos = localStorage.getItem("game_playerPos");
    const savedRounds = localStorage.getItem("game_rounds");
    
    if (savedMeta) meta = JSON.parse(savedMeta);
    if (savedPos) playerPos = parseInt(savedPos);
    if (savedRounds) currentRounds = parseInt(savedRounds);
}

// --- KERN-LOGIK ---

function log(msg) {
    const logContent = document.getElementById("logContent");
    if (logContent) {
        // Neue Nachrichten oben anzeigen
        logContent.innerHTML = `> ${msg}<br>` + logContent.innerHTML;
    }
}

function updateHud() {
    const el = document.getElementById("statusPanel");
    if (!el) return;
    
    const name = localStorage.getItem("playerName") || "Held";
    el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#222; padding:8px; border-radius:5px; border:1px solid #444;">
            <div style="font-size:14px;">❤️ ${meta.hp}/${meta.maxHpBase} | 💰 ${meta.gold}</div>
            <button onclick="logout()" style="background:none; border:none; color:#777; font-size:10px;">Abmelden</button>
        </div>
    `;
}

function renderBoard() {
    const b = document.getElementById("board");
    if (!b) return;
    b.innerHTML = "";
    b.style.display = "grid";
    b.style.gridTemplateColumns = "repeat(10, 1fr)";
    b.style.gap = "4px";
    b.style.padding = "10px";

    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.style.height = "35px";
        t.style.display = "flex";
        t.style.alignItems = "center";
        t.style.justifyContent = "center";
        t.style.background = i === playerPos ? "#555" : "#1a1a1a";
        t.style.border = "1px solid #333";
        t.style.borderRadius = "3px";
        t.innerHTML = i === playerPos ? "🧍" : "";
        b.appendChild(t);
    }
}

function setFightPanelIdle() {
    const fp = document.getElementById("fightPanel");
    if (fp) {
        fp.innerHTML = `<button onclick="move()" class="game-btn" style="width:100%; padding:15px; background:#3b82f6; color:white; border:none; border-radius:8px; font-weight:bold; font-size:18px;">👣 LAUFEN</button>`;
    }
}

// --- AKTIONEN ---

window.move = () => {
    if (inFight) return;
    playerPos++;
    if (playerPos >= 30) { 
        playerPos = 0; 
        currentRounds++; 
        log(`Runde ${currentRounds} erreicht!`);
    }
    
    if (Math.random() < 0.3) {
        spawnMonster();
    } else {
        renderBoard();
        updateHud();
        saveGameState();
    }
};

function spawnMonster() {
    monster = { 
        name: "Wildes Beast", 
        hp: 10 + currentRounds, 
        atk: 2 + Math.floor(currentRounds/2), 
        gold: 10 
    };
    inFight = true;
    
    const fp = document.getElementById("fightPanel");
    if (fp) {
        fp.innerHTML = `
            <div style="border:2px solid #ef4444; padding:15px; text-align:center; background:#1a0505; border-radius:8px;">
                <div style="font-size:18px; margin-bottom:5px;">👾 ${monster.name}</div>
                <div style="color:#ef4444; font-weight:bold; margin-bottom:10px;">HP: ${monster.hp}</div>
                <button onclick="attack()" class="game-btn" style="background:#ef4444; color:white; width:100%; padding:12px; border:none; border-radius:5px; font-weight:bold;">⚔️ ANGRIFF</button>
            </div>
        `;
    }
}

window.attack = () => {
    // Spieler schlägt zu
    monster.hp -= meta.attackPower;
    
    if (monster.hp <= 0) {
        meta.gold += monster.gold;
        inFight = false;
        log(`Sieg! +${monster.gold} Gold.`);
        saveGameState();
        updateHud();
        setFightPanelIdle();
        renderBoard();
    } else {
        // Monster schlägt zurück
        meta.hp -= monster.atk;
        updateHud();
        
        if (meta.hp <= 0) { 
            log("Besiegt! Rückzug zum Start..."); 
            meta.hp = meta.maxHpBase; 
            playerPos = 0;
            inFight = false;
            setFightPanelIdle();
            renderBoard();
        } else {
            // Update Monster Anzeige
            spawnMonster();
        }
    }
    saveGameState();
};

function gameLoop() {
    if (meta.autoLevel > 0 && !inFight) window.move();
}

// --- INITIALISIERUNG ---
