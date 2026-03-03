// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// --- SPIEL WERTE ---
let meta = { hp: 20, maxHpBase: 20, money: 0, attackPower: 5, currentRound: 1, autoRunLevel: 0 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;

// --- SPIEL STARTEN ---
window.startGame = function() {
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

// --- BRETT EVENTS (MONSTER & GOLDSÄCKE) ---
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.3) boardEvents[i] = "frog";      // 🐸
        else if (r < 0.15) boardEvents[i] = "gold"; // 💰
    }
}

// --- LAUFEN ---
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
            monster = { name: "Frosch", hp: 15, maxHp: 15, atk: 5, money: 12 };
            inFight = true;
        } else if (ev === "gold") {
            meta.money += 20;
        }
        boardEvents[playerPos] = null;
    }
    updateUI();
};

// --- KÄMPFEN ---
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
}

// --- UI UPDATE (ALTES DESIGN) ---
function updateUI() {
    // Status oben
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `<h2 style="color:white;">Gold: ${meta.money} | Runde: ${meta.currentRound}</h2>`;
    }

    // Brett in der Mitte
    const b = document.getElementById("board"); 
    if(b) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const c = document.createElement("div");
            c.style = "width:40px; height:40px; background:#333; display:inline-block; margin:2px; vertical-align:top; line-height:40px; text-align:center; font-size:20px; border-radius:5px;";
            if (i === playerPos) c.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
            else if (boardEvents[i] === "gold") c.innerHTML = "💰"; 
            b.appendChild(c);
        }
    }

    // Tasten UNTEN
    const control = document.getElementById("controls");
    if(control) {
        if(!gameStarted) {
            control.innerHTML = `<button onclick="startGame()" style="width:100%; padding:25px; background:blue; color:white; font-weight:bold; font-size:20px; border:none; border-radius:10px;">SPIEL LADEN</button>`;
        } else {
            control.innerHTML = `
                <div style="background:#222; padding:15px; border-radius:10px; margin-bottom:10px;">
                    ${inFight ? `<b style="color:red;">GEGNER: ${monster.name} (${monster.hp} HP)</b>` : `<b style="color:green;">WANDERN...</b>`}
                </div>
                <button onclick="${inFight ? 'attackMonster()' : 'playerMove()'}" 
                    style="width:100%; padding:25px; background:red; color:white; font-weight:bold; font-size:20px; border:none; border-radius:10px; border:2px solid gold;">
                    ${inFight ? 'ANGRIFF' : 'LAUFEN'}
                </button>`;
        }
    }
}
