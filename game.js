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

window.onload = function() {
    loadData();
    updateUI();
};

function loadData() {
    const m = localStorage.getItem("game_meta_v26");
    if(m) meta = JSON.parse(m);
    const h = localStorage.getItem("game_highscore");
    if(h) highscore = JSON.parse(h);
    if (!boardEvents.length) generateBoardEvents();
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    localStorage.setItem("game_meta_v26", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.4) {
