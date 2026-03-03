// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// --- HELDEN & MONSTER BILDER ---
const HERO_DATA = {
    "Ben": { class: "Abenteurer", img: "images/Ben.png" }
};

// --- SPIEL WERTE ---
let meta = { hp: 20, maxHpBase: 20, money: 20, attackPower: 5, currentRound: 1, bossesKilled: 0, autoRunLevel: 0 };
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;

// --- DIESE FUNKTION FIXT DEN "SPIEL LADEN" BUTTON ---
window.startGame = function() {
    console.log("Starte Spiel...");
    gameStarted = true;
    loadData();
    generateBoardEvents();
    updateUI();
};

// --- AUTORUN LOGIK ---
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

function loadData() {
    const m = localStorage.getItem("game_meta_final");
    if(m) meta = JSON.parse(m);
}

function saveData() {
    localStorage.setItem("game_meta_final", JSON.stringify(meta));
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.3) boardEvents[i] = "frog";
        else if (Math.random() < 0.1) boardEvents[i] = "money_coin";
    }
}

window.playerMove = function() {
    if(!gameStarted || inFight) return;
    playerPos += getRandom(1, 4);
    if (playerPos >= 30) {
        playerPos = 0;
        meta.currentRound++;
        generateBoardEvents();
    } else {
        let ev = boardEvents[playerPos];
        if (ev === "frog") {
            monster = { name: "Frosch", hp: 10, maxHp: 10, atk: 2, money: 10, img: "images/frog.png" };
            inFight = true;
        } else if (ev === "money_coin") {
            meta.money += 15;
        }
        boardEvents[playerPos] = null;
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
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

window.buyItem = function(type) {
    if (type === 'hp' && meta.money >= 50) { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.money -= 50; }
    else if (type === 'atk' && meta.money >= 50) { meta.attackPower += 2; meta.money -= 50; }
    else if (type === 'auto') {
        let cost = 1000 + (meta.autoRunLevel * 500);
        if (meta.money >= cost) { meta.money -= cost; meta.autoRunLevel++; }
    }
    updateUI();
};

function updateUI() {
    saveData();
    
    // SPIEL LADEN Button zu LAUFEN ändern wenn Spiel läuft
    const topBtn = document.querySelector('button[style*="background: #4285f4"]'); 
    if(topBtn && gameStarted) {
        topBtn.innerHTML = inFight ? "ANGRIFF" : "LAUFEN";
        topBtn.style.background = "linear-gradient(to bottom, #dc2626, #991b1b)";
        topBtn.style.border = "2px solid gold";
        topBtn.onclick = inFight ? window.attackMonster : window.playerMove;
    } else if(topBtn) {
        topBtn.onclick = window.startGame;
    }

    // Brett mit Icons
    const b = document.getElementById("board"); 
    if(b && gameStarted) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const c = document.createElement("div"); c.className = "cell";
            if (i === playerPos) c.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
            else if (boardEvents[i] === "money_coin") c.innerHTML = "💰"; 
            b.appendChild(c);
        }
    }

    // Autorun Button
    const elFight = document.getElementById("fightPanel");
    if(elFight && gameStarted) {
        const runGlow = autoRunActive ? "box-shadow: 0 0 20px red; background: red;" : "background: #333;";
        elFight.innerHTML = `
            <button onclick="toggleAutoRun()" style="${runGlow} color:white; width:100%; padding:10px; border-radius:8px; font-weight:bold; margin-top:10px;">
                AUTORUN: ${autoRunActive ? 'AN' : 'AUS'} (Lvl ${meta.autoRunLevel})
            </button>`;
    }
}
