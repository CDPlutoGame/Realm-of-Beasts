// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
}

// --- HELDEN DATEN (Bilder laut deiner Liste) ---
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", img: "images/Ben.png" }, //
    "Jeffrey": { class: "Ritter",      img: "images/jeffry.png" }, //
    "Jamal":   { class: "Berserker",   img: "images/jamal.png" },
    "Luna":    { class: "Waldläuferin", img: "images/luna.png" },
    "Berta":   { class: "Magierin",    img: "images/berta.png" },
    "Brutus":  { class: "Schläger",    img: "images/brutus.png" }
};

// --- DEINE SPIEL WERTE ---
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
        log("Du musst erst Autorun im Schwarzmarkt kaufen!");
        return;
    }
    autoRunActive = !autoRunActive;
    if (autoRunActive) {
        log("Autorun AKTIVIERT");
        autoRunInterval = setInterval(autoStep, 1000);
    } else {
        log("Autorun DEAKTIVIERT");
        clearInterval(autoRunInterval);
    }
    updateUI();
};

function autoStep() {
    let maxRound = meta.autoRunLevel * 10;
    // Stoppt vor dem Boss oder am Ende der Stufe
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
            // Boss Drache
            monster = { name: "BOSS DRACHE", hp: 150, maxHp: 150, atk: 15, money: 500, isBoss: true, img: "images/dragon 1.png" };
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

window.buyItem = function(type) {
    let autoCost = 1000 + (meta.autoRunLevel * 500);
    if (type === 'hp' && meta.money >= 50) { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.money -= 50; }
    else if (type === 'atk' && meta.money >= 50) { meta.attackPower += 2; meta.money -= 50; }
    else if (type === 'auto' && meta.money >= autoCost) {
        if (meta.bossesKilled > meta.autoRunLevel) {
            meta.autoRunLevel++;
            meta.money -= autoCost;
            log("Autorun Stufe " + meta.autoRunLevel + " gekauft!");
        } else { log("Besiege erst den Boss!"); }
    }
    updateUI();
};

function updateUI() {
    saveData();
    const hero = HERO_DATA[currentHero];
    
    // Header
    document.getElementById("statusPanel").innerHTML = `
        <div style="background:#1a1a1a; padding:10px; border:1px solid gold; display:flex; gap:10px; align-items:center; border-radius:8px; color:white;">
            <img src="${hero.img}" style="width:40px; height:40px; border:1px solid white;">
            <div style="font-size:11px;">
                <b>CDPluto</b> | Gold: ${meta.money} | Beste: ${highscore.bestRound}<br>
                Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}
            </div>
        </div>`;

    // Kampf-Bereich
    const arena = document.getElementById("battle-arena");
    if(inFight && monster) {
        arena.innerHTML = `<img src="${monster.img}" style="height:90px; filter: drop-shadow(0 0 10px red);"><div style="color:red; font-weight:bold; margin-top:5px;">${monster.name} (${monster.hp} HP)</div>`;
    } else {
        arena.innerHTML = `<div style="padding:40px; color:gray; font-weight:bold;">WANDERN...</div>`;
    }

    // Brett (Wieder mit deinen Icons!)
    const b = document.getElementById("board"); 
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const c = document.createElement("div"); c.className = "cell";
        if (i === playerPos) c.innerHTML = "🧙"; 
        else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
        else if (boardEvents[i] === "wolf") c.innerHTML = "🐺";
        else if (boardEvents[i] === "bear") c.innerHTML = "🐻";
        else if (boardEvents[i] === "money_coin") c.innerHTML = "💰"; 
        b.appendChild(c);
    }

    // Epic Buttons
    const runGlow = autoRunActive ? "box-shadow: 0 0 20px #ff0000; background: #ff0000; border: 2px solid white;" : "background: #333; border: 1px solid #666;";
    document.getElementById("fightPanel").innerHTML = `
        <button onclick="${inFight ? 'attackMonster()' : 'playerMove()'}" 
            style="background: linear-gradient(to bottom, #1d4ed8, #1e3a8a); color:white; width:100%; padding:15px; border-radius:8px; font-weight:bold; border:1px solid gold; box-shadow: 0 0 10px rgba(30,58,138,0.5); margin-bottom:10px; text-transform:uppercase;">
            ${inFight ? 'ANGRIFF' : 'WÜRFELN'}
        </button>
        <button onclick="toggleAutoRun()" 
            style="${runGlow} color:white; width:100%; padding:10px; border-radius:8px; font-weight:bold; transition: all 0.3s; text-transform:uppercase; font-size:12px;">
            AUTORUN: ${autoRunActive ? 'AN' : 'AUS'} (Stufe ${meta.autoRunLevel})
        </button>
    `;

    // Schwarzmarkt Schrift & Buttons
    document.getElementById("schwarzmarkt").innerHTML = `
        <div style="color:#ff0000; font-weight:bold; text-align:center; letter-spacing:2px; margin-bottom:10px; text-shadow: 0 0 5px black;">SCHWARZMARKT</div>
        <div style="display:flex; gap:10px; justify-content:center;">
            <button onclick="buyItem('hp')" style="background:#057a1a; color:white; border:none; border-radius:5px; padding:8px 15px; font-weight:bold;">+5 HP (50G)</button>
            <button onclick="buyItem('atk')" style="background:#b45309; color:white; border:none; border-radius:5px; padding:8px 15px; font-weight:bold;">+2 ATK (50G)</button>
            <button onclick="buyItem('auto')" style="background:#6d28d9; color:white; border:none; border-radius:5px; padding:8px 15px; font-weight:bold;">AUTO Lvl ${meta.autoRunLevel+1}</button>
        </div>
    `;
}