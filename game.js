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
let shopOpen = false;
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
        autoRunInterval = setInterval(autoStep, 1000);
    } else {
        clearInterval(autoRunInterval);
    }
    updateUI();
};

function autoStep() {
    // Stopp-Bedingungen für Autorun
    let maxRound = meta.autoRunLevel * 10;
    if (meta.currentRound > maxRound || (playerPos >= 25 && meta.currentRound % 10 === 0)) {
        log("Autorun Ziel erreicht / Boss steht bevor!");
        window.toggleAutoRun();
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
    generateBoardEvents();
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
            monster = { name: "BOSS", hp: 100 + (meta.currentRound * 5), maxHp: 100 + (meta.currentRound * 5), atk: 10 + meta.currentRound, money: 200, isBoss: true, img: "images/dragon 1.png" };
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

// --- SCHWARZMARKT LOGIK ---
window.buyItem = function(type) {
    let cost = 50;
    if (type === 'auto') cost = 1000 + (meta.autoRunLevel * 500);

    if (meta.money >= cost) {
        if (type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.money -= 50; }
        else if (type === 'atk') { meta.attackPower += 2; meta.money -= 50; }
        else if (type === 'auto') {
            if (meta.bossesKilled > meta.autoRunLevel) {
                meta.autoRunLevel++;
                meta.money -= cost;
                log("Autorun Stufe " + meta.autoRunLevel + " freigeschaltet!");
            } else {
                log("Besiege erst den nächsten Boss!");
            }
        }
    } else { log("Zu wenig Gold!"); }
    updateUI();
};

function updateUI() {
    saveData();
    const hero = HERO_DATA[currentHero];
    
    // Top Panel
    document.getElementById("statusPanel").innerHTML = `
        <div style="background:#1a1a1a; padding:10px; border:1px solid gold; display:flex; gap:10px; align-items:center; border-radius:8px; color:white;">
            <img src="${hero.img}" style="width:40px; height:40px; border:1px solid white;">
            <div style="font-size:11px;">
                <b>CDPluto</b> | Gold: ${meta.money} | Beste: ${highscore.bestRound}<br>
                Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}
            </div>
        </div>`;

    // Kampffenster (Bleibt sauber!)
    const arena = document.getElementById("battle-arena");
    if(inFight && monster) {
        arena.innerHTML = `<img src="${monster.img}" style="height:80px;"><div style="color:red;">${monster.name} (${monster.hp} HP)</div>`;
    } else {
        arena.innerHTML = `<div style="padding:40px; color:gray;">WANDERN...</div>`;
    }

    // Brett
    const b = document.getElementById("board"); 
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const c = document.createElement("div"); c.className = "cell";
        if (i === playerPos) c.innerHTML = "🧙"; 
        else if (boardEvents[i]) c.innerHTML = "👾";
        b.appendChild(c);
    }

    // Buttons & Autorun (Rot leuchtend wenn an)
    const runStyle = autoRunActive ? "background:red; box-shadow: 0 0 15px red; color:white;" : "background:#444; color:white;";
    document.getElementById("fightPanel").innerHTML = `
        <button onclick="${inFight ? 'attackMonster()' : 'playerMove()'}" style="background:blue; color:white; width:100%; padding:15px; margin-bottom:5px; font-weight:bold;">
            ${inFight ? 'ANGRIFF' : 'WEITER'}
        </button>
        <button onclick="toggleAutoRun()" style="${runStyle} width:100%; padding:10px; border-radius:5px; border:none; font-weight:bold;">
            AUTORUN: ${autoRunActive ? 'AN' : 'AUS'} (Stufe ${meta.autoRunLevel})
        </button>
    `;

    // Schwarzmarkt (Hier sind die Käufe!)
    document.getElementById("schwarzmarkt").innerHTML = `
        <div style="color:red; font-weight:bold; margin-bottom:5px;">SCHWARZMARKT</div>
        <div style="display:flex; gap:5px; justify-content:center;">
            <button onclick="buyItem('hp')" style="background:green; color:white; padding:5px; font-size:10px;">+5 HP (50G)</button>
            <button onclick="buyItem('atk')" style="background:orange; color:white; padding:5px; font-size:10px;">+2 ATK (50G)</button>
            <button onclick="buyItem('auto')" style="background:purple; color:white; padding:5px; font-size:10px;">Auto Lvl ${meta.autoRunLevel+1} (${1000+(meta.autoRunLevel*500)}G)</button>
        </div>
    `;
}