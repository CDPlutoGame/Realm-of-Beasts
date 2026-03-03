// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
}

// --- HELDEN DATEN ---
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", img: "images/Ben.png" },
    "Jeffrey": { class: "Ritter",      img: "images/jeffry.png" },
    "Jamal":   { class: "Berserker",   img: "images/jamal.png" },
    "Luna":    { class: "Waldläuferin", img: "images/luna.png" },
    "Berta":   { class: "Magierin",    img: "images/berta.png" },
    "Brutus":  { class: "Schläger",    img: "images/brutus.png" }
};

// --- SPIEL WERTE ---
let meta = { 
    hp: 20, maxHpBase: 20, money: 0, attackPower: 5, 
    currentRound: 1, bossesKilled: 0, autoRunLevel: 0 
};
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let currentHero = "Ben";

// --- AUTORUN LOGIK ---
let autoRunActive = false;
let autoRunInterval = null;

window.toggleAutoRun = function() {
    if (meta.autoRunLevel === 0) {
        log("Kauf erst Autorun im Schwarzmarkt!");
        return;
    }
    autoRunActive = !autoRunActive;
    if (autoRunActive) {
        log("AUTORUN START");
        autoRunInterval = setInterval(autoStep, 1000);
    } else {
        log("AUTORUN STOPP");
        clearInterval(autoRunInterval);
    }
    updateUI();
};

function autoStep() {
    let maxRound = meta.autoRunLevel * 10;
    if (meta.currentRound > maxRound || (playerPos >= 26 && meta.currentRound % 10 === 0)) {
        if(autoRunActive) window.toggleAutoRun();
        return;
    }
    if (inFight) window.attackMonster();
    else window.playerMove();
}

// --- LADEN & STARTEN (FIXED) ---
window.onload = function() {
    console.log("Spiel wird geladen...");
    try {
        loadData();
    } catch (e) {
        console.error("Ladefehler, starte neues Spiel:", e);
        generateBoardEvents();
    }
    updateUI();
};

function loadData() {
    const m = localStorage.getItem("game_meta_v27"); // Neuer Schlüssel für sauberen Start
    if(m) meta = JSON.parse(m);
    
    const h = localStorage.getItem("game_highscore");
    if(h) highscore = JSON.parse(h);
    
    // Immer neue Events generieren, falls das Laden fehlschlägt
    generateBoardEvents();
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    localStorage.setItem("game_meta_v27", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.4) {
            let p = [];
            if (meta.currentRound <= 15) p.push("frog");
            if (meta.currentRound >= 11 && meta.currentRound <= 23) p.push("wolf");
            if (meta.currentRound >= 19) p.push("bear");
            boardEvents[i] = p[Math.floor(Math.random() * p.length)] || "frog";
        }
    }
}

window.playerMove = function() {
    if(inFight) return;
    playerPos += getRandom(1, 4);

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 150 + (meta.currentRound*2), maxHp: 150 + (meta.currentRound*2), atk: 15 + meta.currentRound, money: 500, isBoss: true, img: "images/dragon 1.png" };
            inFight = true;
        } else {
            meta.currentRound++;
            generateBoardEvents();
        }
    } else {
        let ev = boardEvents[playerPos];
        let scale = Math.floor(meta.currentRound / 2) * 3;
        if (ev === "frog") {
            monster = { name: "Frosch", hp: 15+scale, maxHp: 15+scale, atk: 5+scale, money: 12, img: "images/frog.png" };
            inFight = true;
        } else if (ev === "wolf") {
            monster = { name: "Wolf", hp: 40+scale, maxHp: 40+scale, atk: 12+scale, money: 25, img: "images/wolf.png" };
            inFight = true;
        } else if (ev === "bear") {
            monster = { name: "Bär", hp: 100+scale, maxHp: 100+scale, atk: 20+scale, money: 50, img: "images/bär.png" };
            inFight = true;
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
    }