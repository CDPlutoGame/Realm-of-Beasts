let meta = { 
    playerName: "", hp: 20, maxHpBase: 20, money: 0, attackPower: 5, 
    currentRound: 1, bossesKilled: 0, autoRunLevel: 0,
    hpUpgrades: 0,
    atkUpgrades: 0
};
let highscore = { bestRound: 1, bestName: "Held" };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;
let autoRunActive = false;
let autoRunInterval = null;

// --- START & LOGIN ---
window.startGame = function() {
    const savedMeta = localStorage.getItem("cdp_rpg_meta");
    const savedHigh = localStorage.getItem("cdp_rpg_high");
    if(savedMeta) meta = JSON.parse(savedMeta);
    if(savedHigh) highscore = JSON.parse(savedHigh);

    if (!meta.playerName) {
        let name = prompt("Wie lautet dein Name?", "");
        meta.playerName = name ? name : "Spieler";
    }
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.25) {
            if (meta.currentRound <= 15) boardEvents[i] = "frog";
            else if (meta.currentRound <= 25) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (r < 0.40) {
            boardEvents[i] = "gold";
        }
    }
}

// --- BEWEGUNG & KAMPF ---
window.playerMove = function() {
    if(!gameStarted || inFight) return;
    playerPos += Math.floor(Math.random() * 4) + 1;

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 150 + (meta.currentRound*2), atk: 15 + meta.currentRound, money: 500, img: "images/dragon 1.png" };
            inFight = true;
        } else {
            meta.currentRound++;
            generateBoardEvents();
        }
    } else {
        let ev = boardEvents[playerPos];
        let scale = Math.floor(meta.currentRound / 2) * 3;
        if (ev === "frog") { monster = { name: "Frosch", hp: 15+scale, atk: 5+scale, money: 12, img: "images/frog.png" }; inFight = true; }
        else if (ev === "wolf") { monster = { name: "Wolf", hp: 40+scale, atk: 12+scale, money: 25, img: "images/wolf.png" }; inFight = true; }
        else if (ev === "bear") { monster = { name: "Bär", hp: 100+scale, atk: 20+scale, money: 50, img: "images/bär.png" }; inFight = true; }
        else if (ev === "gold") { meta.money += 15; }
        boardEvents[playerPos] = null;
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
        if (monster.name === "BOSS DRACHE") meta.bossesKilled++;
        inFight = false;
        monster = null;
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            meta.hp = meta.maxHpBase;
            playerPos = 0;
            inFight = false;
            if(autoRunActive) window.toggleAutoRun();
        }
    }
    updateUI();
};

// --- SHOP LOGIK (PREIS STEIGT UM 50) ---
window.buyItem = function(type) {
    if (type === 'hp') {
        let cost = (meta.hpUpgrades + 1) * 50;
        if (meta.money >= cost) {
            meta.maxHpBase += 5; 
            meta.hp = meta.maxHpBase; 
            meta.money -= cost;
            meta.hpUpgrades++;
        }
    } else if (type === 'atk') {
        let cost = (meta.atkUpgrades + 1) * 50;
        if (meta.money >= cost) {
            meta.attackPower += 5; 
            meta.money -= cost;
            meta.atkUpgrades++;
        }
    } else if (type === 'auto') {
        let cost = 1000 + (meta.autoRunLevel * 500);
        if (meta.money >= cost && meta.bossesKilled > meta.autoRunLevel) {
            meta.money -= cost;
            meta.autoRunLevel++;
        }
    }
    updateUI();
};

window.toggleAutoRun = function() {
    if (meta.autoRunLevel === 0) return;
    autoRunActive = !autoRunActive;
    if (autoRunActive) {
        autoRunInterval = setInterval(() => { if(inFight) attackMonster(); else playerMove(); }, 1000);
    } else {
        clearInterval(autoRunInterval);
    }
    updateUI();
};

// --- UI UPDATE ---
function updateUI() {
    if(meta.currentRound > highscore.bestRound) { highscore.bestRound = meta.currentRound; highscore.bestName = meta.playerName; }
    localStorage.setItem("cdp_rpg_meta", JSON.stringify(meta));
    localStorage.setItem("cdp_rpg_high", JSON.stringify(highscore));

    document.getElementById("statusPanel").innerHTML = `
        <b style="color:gold;">🏆 REKORD: ${highscore.bestName} (R${highscore.bestRound})</b><br>
        👤 <b>${meta.playerName}</b> | Gold: ${meta.money} | R: ${meta.currentRound}<br>
        ❤️ HP: ${meta.hp}/${meta.maxHpBase} | ⚔️ ATK: ${meta.attackPower}`;

    const arena = document.getElementById("battle-arena");
    if(inFight && monster) {
        arena.innerHTML = `<img src="${monster.img}" style="height:60px;"><br><b style="color:red;">${monster.name} (HP: ${monster.hp} | ATK: ${monster.atk})</b>`;
    } else {
        arena.innerHTML = `<div style="color:gray;">Wandern...</div>`;
    }

    const b = document.getElementById("board");
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        let icon = i === playerPos ? "🧙" : (boardEvents[i] === "frog" ? "🐸" : (boardEvents[i] === "wolf" ? "🐺" : (boardEvents[i] === "bear" ? "🐻" : (boardEvents[i] === "gold" ? "💰" : ""))));
        b.innerHTML += `<div class="cell">${icon}</div>`;
    }

    // Shop Preise berechnen
    let hpCost = (meta.hpUpgrades + 1) * 50;
    let atkCost = (meta.atkUpgrades + 1) * 50;

    document.getElementById("schwarzmarkt").innerHTML = `
        <div style="color:red; font-weight:bold; margin-bottom:5px; font-size:12px;">SCHWARZMARKT</div>
        <button class="buy-btn" style="background:green; color:white;" onclick="buyItem('hp')">+5 HP (${hpCost}G)</button>
        <button class="buy-btn" style="background:orange; color:white;" onclick="buyItem('atk')">+5 ATK (${atkCost}G)</button>
        <button class="buy-btn" style="background:purple; color:white;" onclick="buyItem('auto')">AUTO Lvl ${meta.autoRunLevel+1}</button>`;

    const actionBtn = document.getElementById("actionBtn");
    if(!gameStarted) {
        actionBtn.innerHTML = "LOGIN";
        actionBtn.className = "main-btn login-glow"; // Rotes Leuchten
        actionBtn.onclick = window.startGame;
    } else {
        actionBtn.innerHTML = inFight ? "Angriff" : "Laufen";
        actionBtn.className = "main-btn"; // Normales Rot im Spiel
        actionBtn.style.background = "linear-gradient(#dc2626, #991b1b)";
        actionBtn.style.boxShadow = "none";
        actionBtn.onclick = inFight ? window.attackMonster : window.playerMove;
        
        document.getElementById("autoRunArea").innerHTML = `
            <button onclick="toggleAutoRun()" style="width:100%; margin-top:8px; padding:10px; border-radius:10px; border:none; background:${autoRunActive ? 'red' : '#333'}; color:white; font-weight:bold;">
                AUTORUN: ${autoRunActive ? 'AN' : 'AUS'} (Lvl ${meta.autoRunLevel})
            </button>`;
    }
}
