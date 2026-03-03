// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// --- SPIEL WERTE ---
let meta = { hp: 20, maxHpBase: 20, money: 0, attackPower: 5, currentRound: 1, autoRunLevel: 0 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;

// --- START FUNKTION ---
window.startGame = function() {
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

// --- EVENTS (GOLDSÄCKE WIEDER DABEI) ---
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.2) boardEvents[i] = "frog"; // Monster
        else if (r < 0.35) boardEvents[i] = "money_coin"; // Goldsäcke 💰
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
            monster = { name: "Frosch", hp: 15, maxHp: 15, atk: 5, money: 12, img: "images/frog.png" };
            inFight = true;
        } else if (ev === "money_coin") {
            meta.money += 20; // Gold sammeln
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
        }
    }
    updateUI();
};

function updateUI() {
    // Status Panel
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `<div style="background:#1a1a1a; padding:10px; border:1px solid gold; border-radius:8px; color:white; font-size:12px;">
            Gold: ${meta.money} | Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase}</div>`;
    }

    // Brett mit Goldsäcken
    const b = document.getElementById("board"); 
    if(b) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const c = document.createElement("div"); c.className = "cell";
            if (i === playerPos) c.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
            else if (boardEvents[i] === "money_coin") c.innerHTML = "💰"; 
            b.appendChild(c);
        }
    }

    // TASTE UNTEN (Steuerungs-Bereich)
    const fightP = document.getElementById("fightPanel");
    if(fightP) {
        if(!gameStarted) {
            fightP.innerHTML = `<button onclick="startGame()" style="background: #4285f4; color: white; width: 100%; padding: 20px; border-radius: 10px; font-weight: bold;">SPIEL LADEN</button>`;
        } else {
            fightP.innerHTML = `<button onclick="${inFight ? 'attackMonster()' : 'playerMove()'}" 
                style="background: linear-gradient(to bottom, #dc2626, #991b1b); color:white; width:100%; padding:20px; border-radius:10px; font-weight:bold; border:2px solid gold;">
                ${inFight ? 'ANGRIFF' : 'LAUFEN'}
            </button>`;
        }
    }
}
