let meta = { 
    playerName: "", hp: 20, maxHpBase: 20, money: 0, attackPower: 5, 
    currentRound: 1, bossesKilled: 0, autoRunLevel: 0, hpUpgrades: 0, atkUpgrades: 0 
};
let highscore = { bestRound: 1, bestName: "Held" };
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

// Lautstärke
window.changeVolume = function(val) {
    if (bgMusic) bgMusic.volume = val / 100;
};

function playRandomMusic() {
    try {
        const track = musicTracks[Math.floor(Math.random() * musicTracks.length)];
        if (bgMusic) bgMusic.pause();
        bgMusic = new Audio(track);
        bgMusic.loop = true;
        bgMusic.volume = document.getElementById("volumeSlider").value / 100;
        bgMusic.play().catch(e => console.log("Musik geblockt: Interaktion nötig."));
    } catch(e) { console.error("Fehler beim Musikladen"); }
}

// Start-Logik
window.startGame = function() {
    const input = document.getElementById("playerNameInput");
    const name = input.value.trim();
    if (name === "") return alert("Wähle einen Namen!");

    // Save laden
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) meta = JSON.parse(saved);
    meta.playerName = name;

    document.getElementById("loginOverlay").style.display = "none";
    playRandomMusic();
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.25) {
            boardEvents[i] = meta.currentRound <= 15 ? "frog" : (meta.currentRound <= 25 ? "wolf" : "bear");
        } else if (r < 0.4) { boardEvents[i] = "gold"; }
    }
}

window.playerMove = function() {
    if(!gameStarted || inFight || isGameOver) return;
    playerPos += Math.floor(Math.random() * 4) + 1;
    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 150 + (meta.currentRound*2), atk: 15 + meta.currentRound, money: 500, img: "images/dragon 1.png" };
            inFight = true;
        } else { meta.currentRound++; generateBoardEvents(); }
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
    if(!monster || isGameOver) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
        if (monster.name === "BOSS DRACHE") meta.bossesKilled++;
        inFight = false; monster = null;
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) { isGameOver = true; inFight = false; playerPos = 0; if(autoRunActive) toggleAutoRun(); }
    }
    updateUI();
};

window.respawn = function() { meta.hp = meta.maxHpBase; isGameOver = false; updateUI(); };

window.buyItem = function(type) {
    if (!isGameOver) return;
    let cost = type === 'auto' ? (1000 + meta.autoRunLevel * 500) : ((type === 'hp' ? meta.hpUpgrades : meta.atkUpgrades) + 1) * 50;
    if (meta.money >= cost) {
        if (type === 'hp') { meta.maxHpBase += 5; meta.hpUpgrades++; }
        else if (type === 'atk') { meta.attackPower += 5; meta.atkUpgrades++; }
        else if (type === 'auto' && meta.bossesKilled > meta.autoRunLevel) { meta.autoRunLevel++; }
        meta.money -= cost;
    }
    updateUI();
};

window.toggleAutoRun = function() {
    if (meta.autoRunLevel === 0 || isGameOver) return;
    autoRunActive = !autoRunActive;
    if (autoRunActive) autoRunInterval = setInterval(() => { if(inFight) attackMonster(); else playerMove(); }, 1000);
    else clearInterval(autoRunInterval);
    updateUI();
};

function updateUI() {
    localStorage.setItem("cdp_rpg_meta", JSON.stringify(meta));
    document.getElementById("statusPanel").innerHTML = `👤 <b>${meta.playerName}</b> | Gold: ${meta.money} | Runde: ${meta.currentRound}<br>❤️ HP: ${Math.max(0, meta.hp)}/${meta.maxHpBase} | ⚔️ ATK: ${meta.attackPower}`;
    
    const arena = document.getElementById("battle-arena");
    if(isGameOver) arena.innerHTML = `<b style="color:red; font-size:24px;">GAME OVER</b>`;
    else if(inFight) arena.innerHTML = `<img src="${monster.img}" style="height:60px;"><br><b style="color:red;">${monster.name} (HP: ${monster.hp})</b>`;
    else arena.innerHTML = `<div style="color:gray;">Wandern...</div>`;

    const b = document.getElementById("board"); b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        let icon = i === playerPos ? "🧙" : (boardEvents[i] === "frog" ? "🐸" : (boardEvents[i] === "wolf" ? "🐺" : (boardEvents[i] === "bear" ? "🐻" : (boardEvents[i] === "gold" ? "💰" : ""))));
        b.innerHTML += `<div class="cell">${icon}</div>`;
    }

    document.getElementById("schwarzmarkt").innerHTML = `
        <button class="buy-btn" ${!isGameOver ? 'disabled' : ''} onclick="buyItem('hp')">HP (+50G)</button>
        <button class="buy-btn" ${!isGameOver ? 'disabled' : ''} onclick="buyItem('atk')">ATK (+50G)</button>
        <button class="buy-btn" ${!isGameOver ? 'disabled' : ''} onclick="buyItem('auto')">AUTO (Lvl ${meta.autoRunLevel+1})</button>`;

    const btn = document.getElementById("actionBtn");
    btn.innerHTML = isGameOver ? "WEITERKÄMPFEN" : (inFight ? "ANGRIFF" : "LAUFEN");
    btn.style.background = isGameOver ? "green" : (inFight ? "red" : "#444");
    btn.onclick = isGameOver ? window.respawn : (inFight ? window.attackMonster : window.playerMove);
    
    document.getElementById("autoRunArea").innerHTML = `<button onclick="toggleAutoRun()" style="width:100%; margin-top:10px; background:${autoRunActive ? 'red' : '#333'}; color:white; padding:10px; border-radius:10px;">AUTORUN: ${autoRunActive ? 'AN' : 'AUS'}</button>`;
}
