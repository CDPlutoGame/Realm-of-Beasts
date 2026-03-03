// Wir fügen zwei Zähler für die Käufe hinzu, damit der Preis steigen kann
let meta = { 
    playerName: "", hp: 20, maxHpBase: 20, money: 0, attackPower: 5, 
    currentRound: 1, bossesKilled: 0, autoRunLevel: 0,
    hpUpgrades: 0,  // Neu: Zähler für HP-Käufe
    atkUpgrades: 0  // Neu: Zähler für ATK-Käufe
};
let highscore = { bestRound: 1, bestName: "Held" };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;
let autoRunActive = false;
let autoRunInterval = null;

window.startGame = function() {
    const savedMeta = localStorage.getItem("cdp_rpg_meta");
    const savedHigh = localStorage.getItem("cdp_rpg_high");
    if(savedMeta) meta = JSON.parse(savedMeta);
    if(savedHigh) highscore = JSON.parse(savedHigh);

    if (!meta.playerName) {
        let name = prompt("Wie heißt dein Charakter?", "");
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

window.playerMove = function() {
    if(!gameStarted || inFight) return;
    playerPos += Math.floor(Math.random() * 4) + 1;

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 150, atk: 15, money: 500, img: "images/dragon 1.png" };
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

window.toggleAutoRun = function() {
    if (meta.autoRunLevel === 0) return;
    autoRunActive = !autoRunActive;
    if (autoRunActive) {
        autoRunInterval = setInterval(() => { if(inFight) attackMonster(); else playerMove(); }, 1000);
    } else
