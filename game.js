// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) { lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; }
}

// --- HELDEN DATEN (Exakt nach deiner Liste) ---
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", img: "images/Ben.png" },    // Großes B
    "Jeffrey": { class: "Ritter",      img: "images/jeffry.png" }, // Ohne 'e'
    "Jamal":   { class: "Berserker",   img: "images/jamal.png" },
    "Luna":    { class: "Waldläuferin", img: "images/luna.png" },
    "Berta":   { class: "Magierin",    img: "images/berta.png" },
    "Brutus":  { class: "Schläger",    img: "images/brutus.png" }
};

let meta = { hp: 30, maxHpBase: 30, money: 20, attackPower: 10, currentRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let currentHero = "Ben";

// --- INITIALISIERUNG (Login & Start) ---
window.onload = function() {
    const modal = document.getElementById("loginModal");
    const playerName = localStorage.getItem("playerName");

    if (!playerName) {
        if(modal) modal.style.display = "flex";
    } else {
        if(modal) modal.style.display = "none";
        log("Bereit für die Reise...");
    }

    const startBtn = document.getElementById("finalStartBtn");
    if(startBtn) {
        startBtn.onclick = function() {
            const val = document.getElementById("heroNameInput").value.trim();
            if(val) { 
                localStorage.setItem("playerName", val); 
                if(modal) modal.style.display = "none";
                updateUI();
                log("Das Abenteuer beginnt, " + val);
            }
        };
    }
    generateBoardEvents();
    updateUI();
};

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.3) {
            let r = Math.random();
            if (r < 0.7) boardEvents[i] = "frog";
            else boardEvents[i] = "money_coin";
        }
    }
}

// --- GAMEPLAY ---
window.playerMove = function() {
    if(inFight) return;
    let steps = getRandom(1, 4);
    playerPos += steps;

    if (playerPos >= 30) {
        playerPos = 0;
        meta.currentRound++;
        generateBoardEvents();
    } else {
        let ev = boardEvents[playerPos];
        if (ev === "frog") {
            // Name 'frog.png' exakt wie in deiner Liste
            monster = { name: "Frosch", hp: 20, maxHp: 20, atk: 3, img: "images/frog.png" };
            inFight = true;
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            meta.money += 20;
            boardEvents[playerPos] = null;
        }
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
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

// --- UI UPDATE (Fix für die Bilder) ---
function updateUI() {
    const hero = HERO_DATA[currentHero];
    const name = localStorage.getItem("playerName") || "Held";
    
    // Status Panel
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#1a1a1a; padding:10px; border:1px solid gold; display:flex; gap:10px; align-items:center; border-radius:8px; color:white;">
                <img src="${hero.img}" style="width:40px; height:40px; border:1px solid white; object-fit:cover;">
                <div style="font-size:11px;">
                    <b>${name}</b> | Gold: ${meta.money}<br>
                    Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase}
                </div>
            </div>`;
    }

    // Arena (Monster Bilder)
    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            arena.innerHTML = `
                <div style="height:100px; display:flex; align-items:center; justify-content:center;">
                    <img src="${monster.img}" style="max-height:90px; object-fit:contain;">
                </div>
                <div style="font-weight:bold; color:red; margin-top:5px;">${monster.name}</div>
                <div style="background:#444; width:100%; height:8px; border-radius:4px; margin-top:5px;">
                    <div style="background:red; width:${(monster.hp/monster.maxHp)*100}%; height:100%; border-radius:4px;"></div>
                </div>`;
        } else {
            arena.innerHTML = `<div style="padding:40px; color:#666;">WANDERN...</div>`;
        }
    }

    // Brett
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

    // Buttons
    const fPanel = document.getElementById("fightPanel");
    if(fPanel) {
        fPanel.innerHTML = inFight ? 
            `<button onclick="attackMonster()" style="background:#b91c1c; color:white; padding:10px; width:100%; border:none; border-radius:5px;">ANGRIFF</button>` : 
            `<button onclick="playerMove()" style="background:#1d4ed8; color:white; padding:10px; width:100%; border:none; border-radius:5px;">WÜRFELN</button>`;
    }
}
