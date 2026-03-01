// --- SPIEL-DATEN ---
let meta = { 
    hp: 30, 
    maxHpBase: 30, 
    gold: 0, 
    attackPower: 5, 
    currentKills: 0, 
    currentRound: 1, 
    hpBought: 0, 
    atkBought: 0 
};

// Highscores (werden niemals automatisch resetet)
let highscore = {
    bestRound: 1,
    bestKills: 0
};

let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;

// --- START-LOGIK ---
window.onload = function() {
    const initBtn = document.getElementById("initBtn");
    if(initBtn) initBtn.onclick = () => document.getElementById("loginModal").style.display = "flex";

    const finalBtn = document.getElementById("finalStartBtn");
    if(finalBtn) {
        finalBtn.onclick = () => {
            const name = document.getElementById("heroNameInput").value.trim();
            if(name) {
                localStorage.setItem("playerName", name);
                document.getElementById("loginModal").style.display = "none";
                initGame();
            }
        };
    }

    if(localStorage.getItem("playerName")) initGame();
};

function initGame() {
    loadData();
    updateUI();
    log("Willkommen im Abenteuer!");
}

function loadData() {
    // Lade Highscores
    const savedHighscore = localStorage.getItem("game_highscore");
    if(savedHighscore) highscore = JSON.parse(savedHighscore);

    // Lade aktuellen Spielstand
    const savedMeta = localStorage.getItem("game_meta_v3");
    if(savedMeta) meta = JSON.parse(savedMeta);
    
    playerPos = parseInt(localStorage.getItem("game_pos_v3")) || 0;
    const savedEvents = localStorage.getItem("game_events_v3");
    if(savedEvents) boardEvents = JSON.parse(savedEvents); 
    else generateBoardEvents();
}

function saveData() {
    // Prüfe und speichere Highscores
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    if(meta.currentKills > highscore.bestKills) highscore.bestKills = meta.currentKills;
    
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_meta_v3", JSON.stringify(meta));
    localStorage.setItem("game_pos_v3", playerPos);
    localStorage.setItem("game_events_v3", JSON.stringify(boardEvents));
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML;
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.22) {
            let possible = [];
            if (meta.currentRound <= 15) possible.push("frog");
            if (meta.currentRound >= 11 && meta.currentRound <= 25) possible.push("wolf");
            if (meta.currentRound >= 20) possible.push("bear");
            boardEvents[i] = possible.length > 0 ? possible[Math.floor(Math.random() * possible.length)] : "frog";
        } else if (Math.random() < 0.1) {
            boardEvents[i] = "gold";
        }
    }
}

// --- UI ---
function updateUI() {
    saveData();
    const name = localStorage.getItem("playerName") || "Held";
    
    document.getElementById("statusPanel").innerHTML = `
        <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; text-align:left;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:5px;">
                <b style="color:#d4af37"><i class="fas fa-user"></i> ${name}</b>
                <span style="color:#4ade80"><i class="fas fa-coins"></i> ${meta.gold}</span>
            </div>
            <div class="stat-grid">
                <div class="stat-box">
                    <span class="best-label">AKTUELL</span>
                    Runde: ${meta.currentRound}<br>Kills: ${meta.currentKills}
                </div>
                <div class="stat-box" style="border-color:#d4af37">
                    <span class="best-label">BESTE (👑)</span>
                    Runde: ${highscore.bestRound}<br>Kills: ${highscore.bestKills}
                </div>
            </div>
            <div style="margin-top:8px; font-size:12px; color:#ef4444;">
                <i class="fas fa-heart"></i> HP: ${meta.hp}/${meta.maxHpBase} | <i class="fas fa-khanda"></i> ATK: ${meta.attackPower}
            </div>
        </div>`;

    // Board
    const b = document.getElementById("board");
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.style = "height:35px; background:#1a1a1a; border:1px solid #333; display:flex; align-items:center; justify-content:center; border-radius:4px;";
        if (i === playerPos) t.innerHTML = "🚶";
        else if (boardEvents[i] === "frog") t.innerHTML = "🐸";
        else if (boardEvents[i] === "wolf") t.innerHTML = "🐺";
        else if (boardEvents[i] === "bear") t.innerHTML = "🐻";
        else if (boardEvents[i] === "gold") t.innerHTML = "💰";
        b.appendChild(t);
    }

    const fp = document.getElementById("fightPanel");
    if (inFight) {
        fp.innerHTML = `<button class="game-btn" style="background:#b91c1c;" onclick="attackMonster()">ANGRIFF (${monster.hp} HP)</button>`;
    } else {
        const btnText = shopOpen ? "ZURÜCK IN DIE WILDNIS" : "SPRINGEN (1-4)";
        fp.innerHTML = `<button class="game-btn" style="background:#1d4ed8;" onclick="playerMove()">${btnText}</button>`;
    }

    const bh = document.getElementById("btn-hp");
    const ba = document.getElementById("btn-atk");
    bh.innerHTML = `+5 HP | ${100+(meta.hpBought*5)} 💰`;
    ba.innerHTML = `+5 ATK | ${100+(meta.atkBought*5)} 💰`;
    bh.disabled = ba.disabled = !shopOpen;
    bh.style.opacity = shopOpen ? "1" : "0.3";
    bh.onclick = () => buyItem('hp');
    ba.onclick = () => buyItem('atk');
}

// --- AKTIONEN ---
window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Ein neuer Versuch beginnt!"); }

    let steps = Math.floor(Math.random() * 4) + 1;
    playerPos += steps;
    log("Du läufst " + steps + " Felder.");

    if (playerPos >= 30) {
        playerPos = 0;
        meta.currentRound++;
        generateBoardEvents();
        log("Runde " + meta.currentRound + " erreicht!");
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "gold") {
            if(ev==="frog") monster={hp:10, atk:2, gold:12};
            if(ev==="wolf") monster={hp:25, atk:6, gold:30};
            if(ev==="bear") monster={hp:65, atk:13, gold:60};
            inFight = true;
            boardEvents[playerPos] = null;
            log("Ein wildes Monster!");
        } else if (ev === "gold") {
            meta.gold += 15;
            boardEvents[playerPos] = null;
            log("+15 Gold gefunden!");
        }
    }
    updateUI();
};

window.attackMonster = function() {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.gold += monster.gold;
        meta.currentKills++;
        inFight = false;
        log("Monster besiegt! +"+monster.gold+" Gold.");
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            // GAME OVER LOGIK
            log("💀 GEFALLEN! Runde " + meta.currentRound + " endet.");
            
            // Stats für Highscore prüfen bevor Reset
            saveData(); 

            // RESET für aktuellen Run
            meta.hp = meta.maxHpBase;
            meta.currentRound = 1;
            meta.currentKills = 0;
            playerPos = 0;
            inFight = false;
            shopOpen = true; // Schwarzmarkt öffnen
            generateBoardEvents();
        }
    }
    updateUI();
};

window.buyItem = function(type) {
    if(!shopOpen) return;
    let cost = type === 'hp' ? 100+(meta.hpBought*5) : 100+(meta.atkBought*5);
    if(meta.gold >= cost) {
        meta.gold -= cost;
        if(type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.hpBought++; }
        else { meta.attackPower += 5; meta.atkBought++; }
        log("Upgrade gekauft!");
    } else {
        log("Zu wenig Gold!");
    }
    updateUI();
};
