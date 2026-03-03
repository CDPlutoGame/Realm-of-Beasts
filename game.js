// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
}

// --- SPIEL WERTE (DEINE ORIGINAL-WERTE) ---
let meta = { 
    hp: 20,           // Start HP
    maxHpBase: 20, 
    money: 0, 
    attackPower: 5,   // Start ATK
    currentRound: 1, 
    bossesKilled: 0, 
    autoRunLevel: 0 
};
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;

// --- LADEN & STARTEN ---
window.startGame = function() {
    gameStarted = true;
    loadData();
    generateBoardEvents();
    updateUI();
    log("Spiel gestartet!");
};

function loadData() {
    const m = localStorage.getItem("game_meta_v29");
    if(m) meta = JSON.parse(m);
    const h = localStorage.getItem("game_highscore");
    if(h) highscore = JSON.parse(h);
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    localStorage.setItem("game_meta_v29", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
}

// --- MONSTER LOGIK (DEINE RUNDEN-REGELN) ---
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.4) {
            let p = [];
            // Frosch: 1-15 | Wolf: 11-23 | Bär: ab 19
            if (meta.currentRound <= 15) p.push("frog");
            if (meta.currentRound >= 11 && meta.currentRound <= 23) p.push("wolf");
            if (meta.currentRound >= 19) p.push("bear");
            
            if (p.length > 0) {
                boardEvents[i] = p[Math.floor(Math.random() * p.length)];
            } else if (Math.random() < 0.2) {
                boardEvents[i] = "money_coin";
            }
        }
    }
}

// --- LAUFEN & KÄMPFEN ---
window.playerMove = function() {
    if(!gameStarted || inFight) return;
    playerPos += getRandom(1, 4);

    if (playerPos >= 30) {
        playerPos = 0;
        // Boss alle 10 Runden
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 150, maxHp: 150, atk: 15, money: 500, isBoss: true, img: "images/dragon 1.png" };
            inFight = true;
        } else {
            meta.currentRound++;
            generateBoardEvents();
        }
    } else {
        let ev = boardEvents[playerPos];
        let scale = Math.floor(meta.currentRound / 2) * 3; // +3 alle 2 Runden
        
        if (ev === "frog") {
            monster = { name: "Frosch", hp: 15+scale, maxHp: 15+scale, atk: 5+scale, money: 12, img: "images/frog.png" };
            inFight = true;
        } else if (ev === "wolf") {
            monster = { name: "Wolf", hp: 40+scale, maxHp: 40+scale, atk: 12+scale, money: 25, img: "images/wolf.png" };
            inFight = true;
        } else if (ev === "bear") {
            monster = { name: "Bär", hp: 100+scale, maxHp: 100+scale, atk: 20+scale, money: 50, img: "images/bär.png" };
            inFight = true;
        } else if (ev === "money_coin") {
            meta.money += 15;
            log("Gold gefunden!");
        }
        boardEvents[playerPos] = null;
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        if (monster.isBoss) meta.bossesKilled++;
        meta.money += monster.money;
        inFight = false;
        monster = null;
        log("Sieg!");
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            meta.hp = meta.maxHpBase;
            playerPos = 0;
            inFight = false;
            if(autoRunActive) window.toggleAutoRun();
            log("Du bist gestorben!");
        }
    }
    updateUI();
};

// --- AUTORUN SYSTEM ---
let autoRunActive = false;
let autoRunInterval = null;

window.toggleAutoRun = function() {
    if (meta.autoRunLevel === 0) {
        alert("Kauf erst Autorun im Schwarzmarkt!");
        return;
    }
    autoRunActive = !autoRunActive;
    if (autoRunActive) {
        autoRunInterval = setInterval(() => {
            if (inFight) window.attackMonster();
            else window.playerMove();
        }, 1000);
    } else {
        clearInterval(autoRunInterval);
    }
    updateUI();
};

// --- SCHWARZMARKT ---
window.buyItem = function(type) {
    if (type === 'hp' && meta.money >= 50) { 
        meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.money -= 50; 
    } else if (type === 'atk' && meta.money >= 50) { 
        meta.attackPower += 2; meta.money -= 50; 
    } else if (type === 'auto') {
        let cost = 1000 + (meta.autoRunLevel * 500);
        if (meta.money >= cost && meta.bossesKilled > meta.autoRunLevel) {
            meta.money -= cost;
            meta.autoRunLevel++;
        } else {
            alert("Nicht genug Gold oder Boss noch nicht besiegt!");
        }
    }
    updateUI();
};

// --- UI UPDATE ---
function updateUI() {
    saveData();
    
    // Oberer Haupt-Button (Wird nach Start ROT)
    const topBtn = document.getElementById("mainActionBtn");
    if(topBtn) {
        if(gameStarted) {
            topBtn.innerHTML = inFight ? "ANGRIFF" : "LAUFEN";
            topBtn.style.background = "linear-gradient(to bottom, #dc2626, #991b1b)";
            topBtn.style.border = "2px solid gold";
            topBtn.onclick = inFight ? window.attackMonster : window.playerMove;
        } else {
            topBtn.onclick = window.startGame;
        }
    }

    // Status Panel
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#1a1a1a; padding:10px; border:1px solid gold; border-radius:8px; color:white; font-size:12px;">
                <b>CDPluto</b> | Gold: ${meta.money} | Beste: ${highscore.bestRound}<br>
                Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}
            </div>`;
    }

    // Battle Arena
    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            arena.innerHTML = `<img src="${monster.img}" style="height:80px;"><div style="color:red; font-weight:bold;">${monster.name} (${monster.hp} HP)</div>`;
        } else {
            arena.innerHTML = `<div style="color:gray;">LAUFEN...</div>`;
        }
    }

    // Brett
    const b = document.getElementById("board"); 
    if(b && gameStarted) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const c = document.createElement("div"); c.className = "cell";
            if (i === playerPos) c.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
            else if (boardEvents[i] === "wolf") c.innerHTML = "🐺";
            else if (boardEvents[i] === "bear") c.innerHTML = "🐻";
            else if (boardEvents[i] === "money_coin") c.innerHTML = "💰"; 
            b.appendChild(c);
        }
    }

    // Epic Autorun Button
    const elFight = document.getElementById("fightPanel");
    if(elFight && gameStarted) {
        const runGlow = autoRunActive ? "box-shadow: 0 0 20px red; background: red; border: 2px solid white;" : "background: #333; border: 1px solid #666;";
        elFight.innerHTML = `
            <button onclick="toggleAutoRun()" style="${runGlow} color:white; width:100%; padding:12px; border-radius:8px; font-weight:bold; text-transform:uppercase;">
                AUTORUN: ${autoRunActive ? 'AN' : 'AUS'} (Lvl ${meta.autoRunLevel})
            </button>`;
    }

    // Schwarzmarkt
    const sm = document.getElementById("schwarzmarkt");
    if(sm) {
        sm.innerHTML = `
            <div style="color:red; font-weight:bold; text-align:center; margin-bottom:10px; text-transform:uppercase;">Schwarzmarkt</div>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button onclick="buyItem('hp')" style="background:#057a1a; color:white; border:none; border-radius:5px; padding:10px; font-weight:bold;">+5 HP (50G)</button>
                <button onclick="buyItem('atk')" style="background:#b45309; color:white; border:none; border-radius:5px; padding:10px; font-weight:bold;">+2 ATK (50G)</button>
                <button onclick="buyItem('auto')" style="background:#6d28d9; color:white; border:none; border-radius:5px; padding:10px; font-weight:bold;">Auto Lvl ${meta.autoRunLevel+1}</button>
            </div>`;
    }
}
