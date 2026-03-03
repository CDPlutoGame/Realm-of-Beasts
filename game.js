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
    for (let i = 1; i < 30; i++)
