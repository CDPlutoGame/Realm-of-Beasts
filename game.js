let meta = { 
    playerName: "", hp: 20, maxHpBase: 20, money: 0, attackPower: 5, 
    currentRound: 1, bossesKilled: 0, autoRunLevel: 0, hpUpgrades: 0, atkUpgrades: 0
};
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;
let isGameOver = false;
let bgMusic = null;

const musicTracks = ['sounds/music/bg1.mp3', 'sounds/music/bg2.mp3', 'sounds/music/bg3.mp3'];

window.changeVolume = function(val) { if (bgMusic) bgMusic.volume = val / 100; };

function playRandomMusic() {
    const track = musicTracks[Math.floor(Math.random() * musicTracks.length)];
    if (bgMusic) bgMusic.pause();
    bgMusic = new Audio(track);
    bgMusic.loop = true;
    bgMusic.volume = document.getElementById("volumeSlider").value / 100;
    bgMusic.play().catch(() => {});
}

window.onload = function() {
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) {
        const d = JSON.parse(saved);
        if(d.playerName) document.getElementById("playerNameInput").value = d.playerName;
    }
};

window.startGame = function() {
    const name = document.getElementById("playerNameInput").value.trim();
    if (name === "") return alert("Nenne deinen Namen!");
    meta.playerName = name;
    document.getElementById("loginOverlay").style.display = "none";
    playRandomMusic();
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

window.handleAction = function() {
    if (!gameStarted || isGameOver) return;
    if (inFight) {
        fightRound();
    } else {
        if (playerPos < 29) {
            playerPos++;
            checkEvent();
        } else {
            playerPos = 0;
            meta.currentRound++;
            generateBoardEvents();
        }
    }
    updateUI();
};

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.35) {
            if (meta.currentRound <= 10) boardEvents[i] = "frog";
            else if (meta.currentRound <= 20) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (r < 0.50) boardEvents[i] = "gold";
    }
}

function checkEvent() {
    const ev = boardEvents[playerPos];
    if (ev === "gold") {
        meta.money += 5 + meta.currentRound;
        boardEvents[playerPos] = null;
    } else if (ev === "frog" || ev === "wolf" || ev === "bear") {
        inFight = true;
        monster = { type: ev, hp: 10 + (meta.currentRound * 2), atk: 2 + meta.currentRound };
    }
}

function fightRound() {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        inFight = false;
        meta.money += 10;
        boardEvents[playerPos] = null;
        return;
    }
    meta.hp -= monster.atk;
    if (meta.hp <= 0) {
        isGameOver = true;
        alert("GAME OVER!");
        location.reload();
    }
}

function updateUI() {
    document.getElementById("statusPanel").innerHTML = `Held: ${meta.playerName} | HP: ${meta.hp}/${meta.maxHpBase} | Gold: ${meta.money} | Runde: ${meta.currentRound}`;
    const board = document.getElementById("board");
    board.innerHTML = "";
    boardEvents.forEach((ev, i) => {
        const c = document.createElement("div"); c.className = "cell";
        if (i === playerPos) c.innerHTML = "👤";
        else if (ev === "frog") c.innerHTML = "🐸";
        else if (ev === "wolf") c.innerHTML = "🐺";
        else if (ev === "bear") c.innerHTML = "🐻";
        else if (ev === "gold") c.innerHTML = "💰";
        else c.innerHTML = "·";
        board.appendChild(c);
    });
    const arena = document.getElementById("battle-arena");
    arena.innerHTML = inFight ? `KAMPF: Monster HP: ${monster.hp}` : "Kein Kampf";
    document.getElementById("actionBtn").innerText = inFight ? "ANGREIFEN" : "VORWÄRTS";
    
    // Shop (Schwarzmarkt)
    document.getElementById("schwarzmarkt").innerHTML = `
        <b>Schwarzmarkt</b><br>
        <button class="buy-btn" onclick="buy('hp')">Heilen (5G)</button>
        <button class="buy-btn" onclick="buy('atk')">+Atk (20G)</button>
    `;
}

window.buy = function(type) {
    if (type === 'hp' && meta.money >= 5) { meta.hp = meta.maxHpBase; meta.money -= 5; }
    if (type === 'atk' && meta.money >= 20) { meta.attackPower += 2; meta.money -= 20; }
    updateUI();
};
