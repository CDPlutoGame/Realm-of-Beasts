// --- SPIEL-DATEN (Version 13) ---
let meta = { 
    hp: 20,              // Start-Leben auf 20
    maxHpBase: 20, 
    money: 0, 
    attackPower: 5, 
    currentKills: 0, 
    currentRound: 1, 
    hpBought: 0, 
    atkBought: 0 
};

let highscore = { bestRound: 1, bestKills: 0 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;

// --- START-LOGIK ---
window.onload = function() {
    const initBtn = document.getElementById("initBtn");
    const loginModal = document.getElementById("loginModal");
    const finalStartBtn = document.getElementById("finalStartBtn");

    if(initBtn) initBtn.onclick = () => { if(loginModal) loginModal.style.display = "flex"; };
    
    if(finalStartBtn) {
        finalStartBtn.onclick = () => {
            const nameInput = document.getElementById("heroNameInput");
            const name = nameInput ? nameInput.value.trim() : "";
            if(name) {
                localStorage.setItem("playerName", name);
                if(loginModal) loginModal.style.display = "none";
                initGame();
            }
        };
    }
    if(localStorage.getItem("playerName")) initGame();
};

function initGame() {
    loadData();
    updateUI();
    log("Willkommen im Realm!");
}

function loadData() {
    const savedHighscore = localStorage.getItem("game_highscore");
    if(savedHighscore) highscore = JSON.parse(savedHighscore);

    const savedMeta = localStorage.getItem("game_meta_v13");
    if(savedMeta) meta = JSON.parse(savedMeta);
    
    playerPos = parseInt(localStorage.getItem("game_pos_v13")) || 0;
    const savedEvents = localStorage.getItem("game_events_v13");
    if(savedEvents) boardEvents = JSON.parse(savedEvents); 
    else generateBoardEvents();
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    if(meta.currentKills > highscore.bestKills) highscore.bestKills = meta.currentKills;
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_meta_v13", JSON.stringify(meta));
    localStorage.setItem("game_pos_v13", playerPos);
    localStorage.setItem("game_events_v13", JSON.stringify(boardEvents));
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML;
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- BOARD-GENERIERUNG ---
function generateBoardEvents() {
    let count = 0;
    while (count < 10 || count > 18) {
        boardEvents = new Array(30).fill(null);
        count = 0;
        for (let i = 1; i < 30; i++) {
            if (Math.random() < 0.45) {
                count++;
                if (Math.random() < 0.75) {
                    let p = [];
                    if (meta.currentRound <= 15) p.push("frog");
                    if (meta.currentRound >= 11) p.push("wolf");
                    if (meta.currentRound >= 21) p.push("bear");
                    boardEvents[i] = p.length > 0 ? p[Math.floor(Math.random() * p.length)] : "frog";
                } else {
                    boardEvents[i] = "money_coin";
                }
            }
        }
    }
}

// --- SPIEL-AKTIONEN ---
window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Neue Reise gestartet."); }
    
    let steps = getRandom(1, 4);
    playerPos += steps;

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            let lvl = meta.currentRound / 10;
            let bossGold = 250 * Math.pow(2, lvl - 1);
            monster = { name: "EPISCHER DRACHE", hp: lvl*1000, maxHp: lvl*500, atk: 15+(lvl*5), money
