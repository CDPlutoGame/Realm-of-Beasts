// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
}

// --- HELDEN (Bilder laut deiner Liste) ---
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", img: "images/Ben.png" },
    "Jeffrey": { class: "Ritter",      img: "images/jeffry.png" },
    "Jamal":   { class: "Berserker",   img: "images/jamal.png" },
    "Luna":    { class: "Waldläuferin", img: "images/luna.png" },
    "Berta":   { class: "Magierin",    img: "images/berta.png" },
    "Brutus":  { class: "Schläger",    img: "images/brutus.png" }
};

// --- DEINE START-WERTE ---
let meta = { hp: 20, maxHpBase: 20, money: 0, attackPower: 5, currentRound: 1 };
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;
let currentHero = "Ben";

// --- AUTORUN SYSTEM ---
let autoRunActive = false;
let autoRunInterval = null;

window.toggleAutoRun = function() {
    autoRunActive = !autoRunActive;
    log(autoRunActive ? "Autorun AKTIVIERT" : "Autorun DEAKTIVIERT");
    
    if (autoRunActive) {
        autoRunInterval = setInterval(() => {
            if (inFight) {
                window.attackMonster();
            } else {
                window.playerMove();
            }
        }, 1500); // Alle 1.5 Sekunden eine Aktion
    } else {
        clearInterval(autoRunInterval);
    }
    updateUI();
};

window.onload = function() {
    loadData();
    const modal = document.getElementById("loginModal");
    if (!localStorage.getItem("playerName") && modal) modal.style.display = "flex";
    
    const startBtn = document.getElementById("finalStartBtn");
    if(startBtn) {
        startBtn.onclick = function() {
            const val = document.getElementById("heroNameInput").value;
            if(val) { 
                localStorage.setItem("playerName", val); 
                if(modal) modal.style.display = "none";
                updateUI();
            }
        };
    }
    updateUI();
};

function loadData() {
    const m = localStorage.getItem("game_meta_v25");
    if(m) meta = JSON.parse(m);
    const h = localStorage.getItem("game_highscore");
    if(h) highscore = JSON.parse(h);
    const e = localStorage.getItem("game_events_v25");
    if(e) boardEvents = JSON.parse(e); else generateBoardEvents();
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    localStorage.setItem("game_meta_v25", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_events_v25", JSON.stringify(boardEvents));
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.4) {
            if (Math.random() < 0.7) {
                let p = [];
                if (meta.currentRound <= 15) p.push("frog");
                if (meta.currentRound >= 11 && meta.currentRound <= 23) p.push("wolf");
                if (meta.currentRound >= 19) p.push("bear");
                boardEvents[i] = p[Math.floor(Math.random() * p.length)] || "frog";
            } else { boardEvents[i] = "money_coin"; }
        }
    }
}

window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; updateUI(); return; }
    
    let steps = getRandom(1, 4);
    playerPos += steps;

    if (playerPos >= 30) {
        playerPos = 0;
        meta.currentRound++;
        generateBoardEvents();
    } else {
        let ev = boardEvents[playerPos];
        let scale = Math.floor(meta.currentRound / 2) * 3; 
        
        if (ev && ev !== "money_coin") {
            if(ev==="frog") monster={name:"Frosch", hp:15+scale, maxHp:15+scale, atk:5+scale, money:12, img:"images/frog.png"};
            if(ev==="wolf") monster={name:"Wolf", hp:40+scale, maxHp:40+scale, atk:12+scale, money:25, img:"images/wolf.png"};
            if(ev==="bear") monster={name:"Bär", hp:100+scale, maxHp:100+scale, atk:20+scale, money:50, img:"images/bär.png"};
            inFight = true;
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            meta.money += 15;
            boardEvents[playerPos] = null;
        }
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
        inFight = false;
        monster = null;
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            meta.hp = meta.maxHpBase;
            playerPos = 0;
            inFight = false;
            shopOpen = true; 
            if(autoRunActive) window.toggleAutoRun(); // Stoppe Autorun bei Tod
        }
    }
    updateUI();
};

window.buyItem = function(type) {
    if(meta.money >= 50) {
        meta.money -= 50;
        if(type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; }
        else { meta.attackPower += 2; }
    }
    updateUI();
};

function updateUI() {
    saveData();
    const hero = HERO_DATA[currentHero];
    const name = localStorage.getItem("playerName") || "Held";
    
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#1a1a1a; padding:10px; border:1px solid gold; display:flex; gap:10px; align-items:center; border-radius:8px; color:white;">
                <img src="${hero.img}" style="width:40px; height:40px; border:1px solid white;">
                <div style="font-size:11px;">
                    <b>${name}</b> | Gold: ${meta.money} | Beste: ${highscore.bestRound}<br>
                    Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}
                </div>
            </div>`;
    }

    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            arena.innerHTML = `
                <img src="${monster.img}" style="height:80px; object-fit:contain;">
                <div style="font-weight:bold; color:red;">${monster.name} (${monster.hp} HP)</div>
                <div style="background:#444; width:100%; height:8px; border-radius:4px;"><div style="background:red; width:${(monster.hp/monster.maxHp)*100}%; height:100%;"></div></div>`;
        } else if(shopOpen) {
            arena.innerHTML = `
                <div style="color:gold;">SHOP</div>
                <button onclick="buyItem('hp')" style="background:green; color:white; margin:5px; padding:5px;">+5 HP (50G)</button>
                <button onclick="buyItem('atk')" style="background:orange; color:white; margin:5px; padding:5px;">+2 ATK (50G)</button>`;
        } else { arena.innerHTML = "WANDERN..."; }
    }

    const b = document.getElementById("board"); 
    if(b) {
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
    }

    const fPanel = document.getElementById("fightPanel");
    if(fPanel) {
        fPanel.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:5px;">
                ${inFight ? 
                    `<button onclick="attackMonster()" style="background:red; color:white; padding:10px;">ANGRIFF</button>` : 
                    `<button onclick="playerMove()" style="background:blue; color:white; padding:10px;">${shopOpen ? 'WEITER' : 'WÜRFELN'}</button>`
                }
                <button onclick="toggleAutoRun()" style="background:${autoRunActive ? 'green' : 'gray'}; color:white; padding:5px; font-size:10px;">
                    AUTORUN: ${autoRunActive ? 'AN' : 'AUS'}
                </button>
            </div>`;
    }
}