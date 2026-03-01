// --- SPIEL-DATEN (Version 13) ---
let meta = { 
    hp: 20,              // Start-Leben auf 20
    maxHpBase: 20, 
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
    const initBtn = document.getElementById("initBtn");
    const loginModal = document.getElementById("loginModal");
    const finalStartBtn = document.getElementById("finalStartBtn");

    if(initBtn) initBtn.onclick = () => { if(loginModal) loginModal.style.display = "flex"; };
    
    if(finalStartBtn) {
        finalStartBtn.onclick = () => {
            const nameInput = document.getElementById("heroNameInput");
            const name = nameInput ? nameInput.value.trim() : "";
            if(name) {
                localStorage.setItem("playerName", name);
                if(loginModal) loginModal.style.display = "none";
                initGame();
            }
        };
    }
    if(localStorage.getItem("playerName")) initGame();
};

function initGame() {
    loadData();
    updateUI();
    log("Willkommen im Realm!");
}

function loadData() {
    const savedHighscore = localStorage.getItem("game_highscore");
    if(savedHighscore) highscore = JSON.parse(savedHighscore);

    const savedMeta = localStorage.getItem("game_meta_v13");
    if(savedMeta) meta = JSON.parse(savedMeta);
    
    playerPos = parseInt(localStorage.getItem("game_pos_v13")) || 0;
    const savedEvents = localStorage.getItem("game_events_v13");
    if(savedEvents) boardEvents = JSON.parse(savedEvents); 
    else generateBoardEvents();
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    if(meta.currentKills > highscore.bestKills) highscore.bestKills = meta.currentKills;
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_meta_v13", JSON.stringify(meta));
    localStorage.setItem("game_pos_v13", playerPos);
    localStorage.setItem("game_events_v13", JSON.stringify(boardEvents));
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML;
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- BOARD-GENERIERUNG ---
function generateBoardEvents() {
    let count = 0;
    while (count < 10 || count > 18) {
        boardEvents = new Array(30).fill(null);
        count = 0;
        for (let i = 1; i < 30; i++) {
            if (Math.random() < 0.45) {
                count++;
                if (Math.random() < 0.75) {
                    let p = [];
                    if (meta.currentRound <= 15) p.push("frog");
                    if (meta.currentRound >= 11) p.push("wolf");
                    if (meta.currentRound >= 21) p.push("bear");
                    boardEvents[i] = p.length > 0 ? p[Math.floor(Math.random() * p.length)] : "frog";
                } else {
                    boardEvents[i] = "money_coin";
                }
            }
        }
    }
}

// --- SPIEL-AKTIONEN ---
window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Neue Reise gestartet."); }
    
    let steps = getRandom(1, 4);
    playerPos += steps;

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            let lvl = meta.currentRound / 10;
            let bossGold = 250 * Math.pow(2, lvl - 1);
            monster = { name: "EPISCHER DRACHE", hp: lvl*800, maxHp: lvl*800, atk: 15+(lvl*5), money: bossGold, isBoss: true, icon: "🐲" };
            inFight = true;
            log("!!! BOSS ERSCHEINT !!!");
        } else {
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound);
        }
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "money_coin") {
            let scale = Math.floor(meta.currentRound / 2); // Alle 2 Runden stärker
            if(ev==="frog") monster={name:"Frosch", hp: 12+(scale*4), maxHp: 12+(scale*4), atk: 2+(scale*1), money: getRandom(3, 8), icon:"🐸", isBoss:false};
            if(ev==="wolf") monster={name:"Wolf", hp: 30+(scale*10), maxHp: 30+(scale*10), atk: 7+(scale*2), money: getRandom(5, 10), icon:"🐺", isBoss:false};
            if(ev==="bear") monster={name:"Bär", hp: 80+(scale*25), maxHp: 80+(scale*25), atk: 15+(scale*3), money: getRandom(15, 20), icon:"🐻", isBoss:false};
            inFight = true;
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            let coinGold = meta.currentRound <= 10 ? getRandom(10, 13) : (meta.currentRound <= 20 ? getRandom(13, 15) : getRandom(15, 20));
            meta.money += coinGold;
            boardEvents[playerPos] = null;
            log("Goldsack: +" + coinGold + " €");
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
        log("Sieg! Beute: " + monster.money + " €");
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
            log("💀 Besiegt!");
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
    }
    updateUI();
};

function updateUI() {
    saveData();
    const name = localStorage.getItem("playerName") || "Held";
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `<div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; text-align:left;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:5px;">
                <b style="color:#d4af37"><i class="fas fa-dragon"></i> ${name}</b>
                <span style="color:#f59e0b"><i class="fas fa-coins"></i> ${meta.money} €</span>
            </div>
            <div class="stat-grid">
                <div class="stat-box">R: ${meta.currentRound} | K: ${meta.currentKills}</div>
                <div class="stat-box" style="border-color:#d4af37">Beste: R${highscore.bestRound}</div>
            </div>
            <div style="margin-top:8px; font-size:12px; color:#ef4444; font-weight:bold;">HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}</div>
        </div>`;
    }

    const arena = document.getElementById("battle-arena");
    if(inFight && monster && arena) {
        arena.style.display = "block";
        document.getElementById("enemy-icon").innerHTML = monster.icon;
        document.getElementById("enemy-name").innerHTML = monster.name;
        let perc = (monster.hp / monster.maxHp) * 100;
        document.getElementById("enemy-hp-fill").style.width = Math.max(0, perc) + "%";
        document.getElementById("enemy-hp-text").innerHTML = `${Math.max(0, monster.hp)} / ${monster.maxHp} HP`;
    } else if(arena) { arena.style.display = "none"; }

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

    const fightPanel = document.getElementById("fightPanel");
    if (fightPanel) {
        if (inFight) {
            fightPanel.innerHTML = `<button class="game-btn" style="background:#b91c1c;" onclick="attackMonster()">ANGRIFF</button>`;
        } else {
            fightPanel.innerHTML = `<button class="game-btn" style="background:#1d4ed8;" onclick="playerMove()">${shopOpen ? "START" : "VORWÄRTS"}</button>`;
        }
    }

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
