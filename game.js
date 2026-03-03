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
let autoRunActive = false;
let autoRunInterval = null;
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
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) meta = JSON.parse(saved);
    meta.playerName = name;
    document.getElementById("loginOverlay").style.display = "none";
    playRandomMusic();
    gameStarted = true;
    generateBoardEvents(); // Erstes Board füllen
    updateUI();
};

// BALANCING: Mehr Gold, sanftere Monster
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.35) { // 35% Chance auf Monster
            if (meta.currentRound <= 10) boardEvents[i] = "frog";
            else if (meta.currentRound <= 20) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (r < 0.55) { // 20% Chance auf Gold (Erhöht!)
            boardEvents[i] = "gold";
        }
    }
}

window.playerMove = function() {
    if(!gameStarted || inFight || isGameOver) return;
    playerPos += Math.floor(Math.random() * 4) + 1;
    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 100 + (meta.currentRound*5), atk: 10 + meta.currentRound, money: 300, img: "images/dragon 1.png" };
            inFight = true;
        } else { 
            meta.currentRound++; 
            generateBoardEvents(); // BOARD ERNEUERT SICH JEDE RUNDE
        }
    } else {
        let ev = boardEvents[playerPos];
        let s = meta.currentRound;
        if (ev === "frog") { monster = { name: "Frosch", hp: 10+s, atk: 3+s, money: 15, img: "images/frog.png" }; inFight = true; }
        else if (ev === "wolf") { monster = { name: "Wolf", hp: 30+(s*2), atk: 8+s, money: 35, img: "images/wolf.png" }; inFight = true; }
        else if (ev === "bear") { monster = { name: "Bär", hp: 70+(s*3), atk: 15+s, money: 60, img: "images/bär.png" }; inFight = true; }
        else if (ev === "gold") { meta.money += (10 + meta.currentRound); }
        boardEvents[playerPos] = null;
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster || isGameOver) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
        if (monster.name === "BOSS DRACHE") { meta.bossesKilled++; meta.currentRound++; generateBoardEvents(); }
        inFight = false; monster = null;
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) { isGameOver = true; inFight = false; }
    }
    updateUI();
};

window.respawn = function() {
    meta.hp = meta.maxHpBase;
    playerPos = 0;
    isGameOver = false;
    generateBoardEvents(); // BOARD ERNEUERT SICH NACH TOD
    updateUI();
};

window.buyItem = function(type) {
    if (!isGameOver) return;
    let cost = type === 'auto' ? (1000 + meta.autoRunLevel * 500) : ((type === 'hp' ? meta.hpUpgrades : meta.atkUpgrades) + 1) * 50;
    if (meta.money >= cost) {
        if (type === 'hp') { meta.maxHpBase += 10; meta.hpUpgrades++; }
        else if (type === 'atk') { meta.attackPower += 5; meta.atkUpgrades++; }
        else if (type === 'auto' && meta.bossesKilled > meta.autoRunLevel) { meta.autoRunLevel++; }
        meta.money -= cost;
    }
    updateUI();
};

window.toggleAutoRun = function() {
    if (meta.autoRunLevel === 0 || isGameOver) return;
    autoRunActive = !autoRunActive;
    if (autoRunActive) autoRunInterval = setInterval(() => { if(inFight) attackMonster(); else playerMove(); }, 800);
    else clearInterval(autoRunInterval);
    updateUI();
};

function updateUI() {
    localStorage.setItem("cdp_rpg_meta", JSON.stringify(meta));
    document.getElementById("statusPanel").innerHTML = `<b style="color:#f00; text-shadow:0 0 10px red;">${meta.playerName}</b> | Gold: ${meta.money} | Runde: ${meta.currentRound}<br>❤️ HP: ${Math.max(0, meta.hp)}/${meta.maxHpBase} | ⚔️ ATK: ${meta.attackPower}`;
    const arena = document.getElementById("battle-arena");
    if(isGameOver) arena.innerHTML = `<b style="color:red; font-size:26px; text-shadow:0 0 15px red;">GEFALLEN</b>`;
    else if(inFight) arena.innerHTML = `<img src="${monster.img}" style="height:60px; filter:drop-shadow(0 0 10px red);"><br><b style="color:red;">${monster.name}</b>`;
    else arena.innerHTML = `<div style="color:#444;">Wandere durch das Realm...</div>`;
    const b = document.getElementById("board"); b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        let icon = i === playerPos ? "🧙" : (boardEvents[i] === "frog" ? "🐸" : (boardEvents[i] === "wolf" ? "🐺" : (boardEvents[i] === "bear" ? "🐻" : (boardEvents[i] === "gold" ? "💰" : ""))));
        b.innerHTML += `<div class="cell">${icon}</div>`;
    }
    document.getElementById("schwarzmarkt").innerHTML = `<button class="buy-btn" ${!isGameOver ? 'disabled' : ''} onclick="buyItem('hp')">HP (+${(meta.hpUpgrades+1)*50}G)</button><button class="buy-btn" ${!isGameOver ? 'disabled' : ''} onclick="buyItem('atk')">ATK (+${(meta.atkUpgrades+1)*50}G)</button><button class="buy-btn" ${!isGameOver ? 'disabled' : ''} onclick="buyItem('auto')">AUTO (Lvl ${meta.autoRunLevel+1})</button>`;
    const actionBtn = document.getElementById("actionBtn");
    actionBtn.innerHTML = isGameOver ? "NEUER VERSUCH" : (inFight ? "ANGRIFF" : "WANDERN");
    actionBtn.style.background = isGameOver ? "#400" : (inFight ? "#f00" : "#700");
    actionBtn.onclick = isGameOver ? window.respawn : (inFight ? window.attackMonster : window.playerMove);
    document.getElementById("autoRunArea").innerHTML = `<button onclick="toggleAutoRun()" style="width:100%; margin-top:10px; background:${autoRunActive ? '#f00' : '#222'}; color:white; padding:10px; border-radius:10px; border:1px solid red; box-shadow:${autoRunActive ? '0 0 15px red' : 'none'};">AUTORUN: ${autoRunActive ? 'AN' : 'AUS'}</button>`;
}
