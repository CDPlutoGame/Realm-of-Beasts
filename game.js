// --- INITIALISIERUNG DER DATEN ---
let meta = { 
    hp: 30, 
    maxHpBase: 30, 
    money: 0, 
    attackPower: 5, 
    currentKills: 0, 
    currentRound: 1, 
    hpBought: 0, 
    atkBought: 0 
};

let highscore = { bestRound: 1, bestKills: 0 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;

// --- START-LOGIK ---
window.onload = function() {
    console.log("Spiel wird geladen...");
    
    const initBtn = document.getElementById("initBtn");
    const loginModal = document.getElementById("loginModal");
    const finalStartBtn = document.getElementById("finalStartBtn");

    if(initBtn) {
        initBtn.onclick = () => {
            if(loginModal) loginModal.style.display = "flex";
        };
    }

    if(finalStartBtn) {
        finalStartBtn.onclick = () => {
            const nameInput = document.getElementById("heroNameInput");
            const name = nameInput ? nameInput.value.trim() : "";
            if(name) {
                localStorage.setItem("playerName", name);
                if(loginModal) loginModal.style.display = "none";
                initGame();
            } else {
                alert("Bitte gib einen Namen ein!");
            }
        };
    }

    // Wenn der Name schon existiert, direkt starten
    if(localStorage.getItem("playerName")) {
        initGame();
    }
};

function initGame() {
    loadData();
    updateUI();
    log("Willkommen im Realm!");
}

// --- SPEICHER-FUNKTIONEN ---
function loadData() {
    try {
        const savedHighscore = localStorage.getItem("game_highscore");
        if(savedHighscore) highscore = JSON.parse(savedHighscore);

        const savedMeta = localStorage.getItem("game_meta_v11");
        if(savedMeta) meta = JSON.parse(savedMeta);
        
        playerPos = parseInt(localStorage.getItem("game_pos_v11")) || 0;
        
        const savedEvents = localStorage.getItem("game_events_v11");
        if(savedEvents) {
            boardEvents = JSON.parse(savedEvents);
        } else {
            generateBoardEvents();
        }
    } catch(e) {
        console.error("Fehler beim Laden:", e);
        generateBoardEvents(); // Notfall-Generierung
    }
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    if(meta.currentKills > highscore.bestKills) highscore.bestKills = meta.currentKills;
    
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_meta_v11", JSON.stringify(meta));
    localStorage.setItem("game_pos_v11", playerPos);
    localStorage.setItem("game_events_v11", JSON.stringify(boardEvents));
}

// --- BOARD-LOGIK (10-18 EVENTS) ---
function generateBoardEvents() {
    let count = 0;
    let attempts = 0;
    
    while ((count < 10 || count > 18) && attempts < 100) {
        boardEvents = new Array(30).fill(null);
        count = 0;
        attempts++;
        
        for (let i = 1; i < 30; i++) {
            if (Math.random() < 0.45) {
                count++;
                if (Math.random() < 0.75) {
                    let p = [];
                    if (meta.currentRound <= 15) p.push("frog");
                    if (meta.currentRound >= 11 && meta.currentRound <= 25) p.push("wolf");
                    if (meta.currentRound >= 20) p.push("bear");
                    boardEvents[i] = p.length > 0 ? p[Math.floor(Math.random() * p.length)] : "frog";
                } else {
                    boardEvents[i] = "money_coin";
                }
            }
        }
    }
}

// --- UI AKTUALISIERUNG ---
function updateUI() {
    saveData();
    const name = localStorage.getItem("playerName") || "Held";
    
    // Status Panel
    const statusPanel = document.getElementById("statusPanel");
    if(statusPanel) {
        statusPanel.innerHTML = `
        <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; text-align:left;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:5px;">
                <b style="color:#d4af37"><i class="fas fa-dragon"></i> ${name}</b>
                <span style="color:#f59e0b"><i class="fas fa-coins"></i> ${meta.money} €</span>
            </div>
            <div class="stat-grid">
                <div class="stat-box">Runde: ${meta.currentRound} | Kills: ${meta.currentKills}</div>
                <div class="stat-box" style="border-color:#d4af37">Beste: R${highscore.bestRound} | K${highscore.bestKills}</div>
            </div>
            <div style="margin-top:8px; font-size:12px; color:#ef4444; font-weight:bold;">HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}</div>
        </div>`;
    }

    // Battle Arena
    const arena = document.getElementById("battle-arena");
    const hpFill = document.getElementById("enemy-hp-fill");
    const hpText = document.getElementById("enemy-hp-text");
    const enemyIcon = document.getElementById("enemy-icon");
    const enemyName = document.getElementById("enemy-name");

    if(inFight && monster && arena) {
        arena.style.display = "block";
        if(enemyIcon) enemyIcon.innerHTML = monster.icon;
        if(enemyName) {
            enemyName.innerHTML = monster.name;
            enemyName.style.color = monster.isBoss ? "#d4af37" : "#ef4444";
        }
        let perc = (monster.hp / monster.maxHp) * 100;
        if(hpFill) hpFill.style.width = Math.max(0, perc) + "%";
        if(hpText) hpText.innerHTML = `${Math.max(0, monster.hp)} / ${monster.maxHp} HP`;
    } else if(arena) {
        arena.style.display = "none";
    }

    // Board zeichnen
    const boardDiv = document.getElementById("board");
    if(boardDiv) {
        boardDiv.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            if (i === playerPos) cell.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") cell.innerHTML = "🐸";
            else if (boardEvents[i] === "wolf") cell.innerHTML = "🐺";
            else if (boardEvents[i] === "bear") cell.innerHTML = "🐻";
            else if (boardEvents[i] === "money_coin") cell.innerHTML = "💰"; 
            boardDiv.appendChild(cell);
        }
    }

    // Aktions Buttons
    const fightPanel = document.getElementById("fightPanel");
    if (fightPanel) {
        if (inFight) {
            let color = monster.isBoss ? "#f59e0b" : "#b91c1c";
            fightPanel.innerHTML = `<button class="game-btn" style="background:${color};" onclick="attackMonster()">ANGRIFF</button>`;
        } else {
            const btnText = shopOpen ? "NEUER VERSUCH" : "VORWÄRTS (1-4)";
            fightPanel.innerHTML = `<button class="game-btn" style="background:#1d4ed8;" onclick="playerMove()">${btnText}</button>`;
        }
    }

    // Shop Buttons
    const bh = document.getElementById("btn-hp");
    const ba = document.getElementById("btn-atk");
    if(bh && ba) {
        bh.innerHTML = `+5 HP | ${100+(meta.hpBought*5)} €`;
        ba.innerHTML = `+5 ATK | ${100+(meta.atkBought*5)} €`;
        bh.disabled = ba.disabled = !shopOpen;
        bh.style.opacity = shopOpen ? "1" : "0.3";
        bh.onclick = () => buyItem('hp');
        ba.onclick = () => buyItem('atk');
    }
}

// --- SPIEL-AKTIONEN ---
window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Neue Reise gestartet."); }
    
    let steps = Math.floor(Math.random() * 4) + 1;
    playerPos += steps;
    log("Vorwärts: " + steps);

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            let lvl = meta.currentRound / 10;
            monster = { name: "EPISCHER DRACHE", hp: lvl*800, maxHp: lvl*800, atk: 15+(lvl*5), money: lvl*1000, isBoss: true, icon: "🐲" };
            inFight = true;
            log("!!! BOSS-KAMPF !!!");
        } else {
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound);
        }
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "money_coin") {
            if(ev==="frog") monster={name:"Giftfrosch", hp:12, maxHp:12, atk:2, money:15, icon:"🐸", isBoss:false};
            if(ev==="wolf") monster={name:"Schattenwolf", hp:30, maxHp:30, atk:7, money:35, icon:"🐺", isBoss:false};
            if(ev==="bear") monster={name:"Höhlenbär", hp:80, maxHp:80, atk:15, money:70, icon:"🐻", isBoss:false};
            inFight = true;
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            meta.money += 25;
            boardEvents[playerPos] = null;
            log("+25 € gefunden!");
        }
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
        meta.currentKills++;
        inFight = false;
        log("Besiegt! +" + monster.money + " €");
        if(monster.isBoss) { meta.currentRound++; generateBoardEvents(); }
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            meta.hp = meta.maxHpBase; 
            meta.currentRound = 1; 
            meta.currentKills = 0; 
            playerPos = 0; 
            inFight = false; 
            shopOpen = true; 
            generateBoardEvents();
            log("💀 Besiegt! Rückzug...");
        }
    }
    updateUI();
};

window.buyItem = function(type) {
    if(!shopOpen) return;
    let cost = type === 'hp' ? 100+(meta.hpBought*5) : 100+(meta.atkBought*5);
    if(meta.money >= cost) {
        meta.money -= cost;
        if(type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.hpBought++; }
        else { meta.attackPower += 5; meta.atkBought++; }
        log("Attribut verbessert!");
    } else {
        log("Nicht genug Geld!");
    }
    updateUI();
};

function log(msg) {
    const lc = document.getElementById("logContent");
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML;
}
