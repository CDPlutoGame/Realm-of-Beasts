// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
}

// --- SPIEL WERTE ---
let meta = { 
    hp: 20, maxHpBase: 20, money: 0, attackPower: 5, 
    currentRound: 1, bossesKilled: 0, autoRunLevel: 0,
    playerName: "" 
};
let highscore = { bestRound: 1, bestName: "Held" };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;

// --- LOGIN / START ---
window.startGame = function() {
    loadData();
    if (!meta.playerName) {
        let name = prompt("Wie lautet dein Name?", "Held");
        meta.playerName = name ? name : "Spieler";
    }
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

function loadData() {
    const m = localStorage.getItem("game_meta_classic_v2");
    if(m) meta = JSON.parse(m);
    const h = localStorage.getItem("game_highscore_v2");
    if(h) highscore = JSON.parse(h);
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) {
        highscore.bestRound = meta.currentRound;
        highscore.bestName = meta.playerName;
    }
    localStorage.setItem("game_meta_classic_v2", JSON.stringify(meta));
    localStorage.setItem("game_highscore_v2", JSON.stringify(highscore));
}

// --- BRETT EVENTS ---
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.3) {
            if (meta.currentRound <= 15) boardEvents[i] = "frog";
            else if (meta.currentRound <= 23) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (r < 0.45) {
            boardEvents[i] = "gold";
        }
    }
}

// --- KAMPF-LOGIK (WAS DER GEGNER HAT) ---
window.playerMove = function() {
    if(!gameStarted || inFight) return;
    playerPos += getRandom(1, 4);
    
    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            // BOSS WERTE
            monster = { name: "BOSS DRACHE", hp: 150, maxHp: 150, atk: 15, money: 500, isBoss: true, img: "images/dragon 1.png" };
            inFight = true;
            log("Ein Boss erscheint!");
        } else {
            meta.currentRound++;
            generateBoardEvents();
        }
    } else {
        let ev = boardEvents[playerPos];
        let scale = Math.floor(meta.currentRound / 2) * 3; // Gegner werden stärker
        
        if (ev === "frog") { 
            monster = { name: "Frosch", hp: 15+scale, maxHp: 15+scale, atk: 5+scale, money: 12, img: "images/frog.png" }; 
            inFight = true; 
        }
        else if (ev === "wolf") { 
            monster = { name: "Wolf", hp: 40+scale, maxHp: 40+scale, atk: 12+scale, money: 25, img: "images/wolf.png" }; 
            inFight = true; 
        }
        else if (ev === "bear") { 
            monster = { name: "Bär", hp: 100+scale, maxHp: 100+scale, atk: 20+scale, money: 50, img: "images/bär.png" }; 
            inFight = true; 
        }
        else if (ev === "gold") { 
            meta.money += 15; 
            log("Gold gefunden!"); 
        }
        boardEvents[playerPos] = null;
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    
    // Du schlägst zu
    monster.hp -= meta.attackPower;
    
    if (monster.hp <= 0) {
        log(monster.name + " besiegt! +" + monster.money + " Gold");
        if (monster.isBoss) meta.bossesKilled++;
        meta.money += monster.money;
        inFight = false;
        monster = null;
    } else {
        // Gegner schlägt zurück
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            log("Du wurdest besiegt!");
            meta.hp = meta.maxHpBase;
            playerPos = 0;
            inFight = false;
            if(autoRunActive) window.toggleAutoRun();
        }
    }
    updateUI();
};

// --- AUTORUN & KAUFEN ---
let autoRunActive = false;
let autoRunInterval = null;
window.toggleAutoRun = function() {
    if (meta.autoRunLevel === 0) return;
    autoRunActive = !autoRunActive;
    if (autoRunActive) autoRunInterval = setInterval(() => { if(inFight) attackMonster(); else playerMove(); }, 1000);
    else clearInterval(autoRunInterval);
    updateUI();
};

window.buyItem = function(type) {
    if (type === 'hp' && meta.money >= 50) { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.money -= 50; }
    else if (type === 'atk' && meta.money >= 50) { meta.attackPower += 2; meta.money -= 50; }
    else if (type === 'auto') {
        let cost = 1000 + (meta.autoRunLevel * 500);
        if (meta.money >= cost && meta.bossesKilled > meta.autoRunLevel) { meta.money -= cost; meta.autoRunLevel++; }
    }
    updateUI();
};

// --- UI UPDATE ---
function updateUI() {
    saveData();
    
    // Status
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#111; padding:10px; border:1px solid gold; border-radius:10px; font-size:12px; color:white;">
                <b style="color:gold;">🏆 REKORD: ${highscore.bestName} (R${highscore.bestRound})</b><br>
                👤 <b>${meta.playerName}</b> | Gold: ${meta.money} | Runde: ${meta.currentRound}<br>
                ❤️ HP: ${meta.hp}/${meta.maxHpBase} | ⚔️ ATK: ${meta.attackPower}
            </div>`;
    }

    // Kampf-Anzeige (Hier siehst du, was der Gegner hat!)
    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            arena.innerHTML = `
                <img src="${monster.img}" style="height:80px; filter: drop-shadow(0 0 10px red);">
                <div style="color:red; font-weight:bold; font-size:14px;">
                    ${monster.name}<br>
                    HP: ${monster.hp} | ⚔️ ATK: ${monster.atk}
                </div>`;
        } else {
            arena.innerHTML = `<div style="padding:40px; color:gray; font-weight:bold;">WANDERN...</div>`;
        }
    }

    // Brett
    const b = document.getElementById("board"); 
    if(b) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const c = document.createElement("div");
            c.style = "width:32px; height:32px; background:#222; display:inline-block; margin:2px; line-height:32px; text-align:center; border-radius:5px;";
            if (i === playerPos) c.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
            else if (boardEvents[i] === "wolf") c.innerHTML = "🐺";
            else if (boardEvents[i] === "bear") c.innerHTML = "🐻";
            else if (boardEvents[i] === "gold") c.innerHTML = "💰"; 
            b.appendChild(c);
        }
    }

    // Schwarzmarkt
    const sm = document.getElementById("schwarzmarkt");
    if(sm) {
        sm.innerHTML = `
            <div style="color:red; font-weight:bold; margin-bottom:10px; font-size:14px;">SCHWARZMARKT</div>
            <div style="display:flex; gap:5px; justify-content:center;">
                <button onclick="buyItem('hp')" style="background:green; color:white; border:none; padding:8px; border-radius:5px;">+5 HP (50G)</button>
                <button onclick="buyItem('atk')" style="background:orange; color:white; border:none; padding:8px; border-radius:5px;">+2 ATK (50G)</button>
                <button onclick="buyItem('auto')" style="background:purple; color:white; border:none; padding:8px; border-radius:5px;">AUTO Lvl ${meta.autoRunLevel+1}</button>
            </div>`;
    }

    // Steuerung Ganz Unten
    const ctrl = document.getElementById("controls");
    if(ctrl) {
        if(!gameStarted) {
            ctrl.innerHTML = `<button onclick="startGame()" style="width:100%; padding:20px; background:blue; color:white; font-weight:bold; border-radius:10px; border:none;">SPIEL LADEN / LOGIN</button>`;
        } else {
            const runGlow = autoRunActive ? "box-shadow: 0 0 20px red; background: red;" : "background: #333;";
            ctrl.innerHTML = `
                <button onclick="${inFight ? 'attackMonster()' : 'playerMove()'}" 
                    style="width:100%; padding:20px; background:linear-gradient(to bottom, #dc2626, #991b1b); color:white; font-weight:bold; border:2px solid gold; border-radius:10px; margin-bottom:10px; text-transform:uppercase;">
                    ${inFight ? 'ANGRIFF' : 'LAUFEN'}
                </button>
                <button onclick="toggleAutoRun()" style="${runGlow} color:white; width:100%; padding:10px; border-radius:10px; border:none; font-size:12px;">
                    AUTORUN: ${autoRunActive ? 'AN' : 'AUS'} (Lvl ${meta.autoRunLevel})
                </button>`;
        }
    }
}
