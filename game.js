// --- BASIS FUNKTIONEN ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) {
        lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
        if(lc.innerHTML.length > 500) lc.innerHTML = lc.innerHTML.substring(0, 500);
    }
}

// --- SPIEL DATEN & HELDEN (Deine Handy-Dateien) ---
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", hp: 30, atk: 10, img: "images/ben.png" },
    "Jeffrey": { class: "Ritter",     hp: 50, atk: 6,  img: "images/jeffry.png" },
    "Jamal":   { class: "Berserker",  hp: 35, atk: 15, img: "images/jamal.png" },
    "Luna":    { class: "Waldläuferin", hp: 20, atk: 18, img: "images/luna.png" },
    "Berta":   { class: "Magierin",   hp: 40, atk: 8,  img: "images/berta.png" },
    "Brutus":  { class: "Schläger",   hp: 45, atk: 12, img: "images/brutus.png" }
};

let meta = { hp: 30, maxHpBase: 30, money: 0, attackPower: 10, currentRound: 1, hpBought: 0, atkBought: 0 };
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;
let currentHero = "Ben";

// --- INITIALISIERUNG (Login & Start) ---
window.onload = function() {
    loadData();
    
    const loginModal = document.getElementById("loginModal");
    const playerName = localStorage.getItem("playerName");

    // Wenn kein Name da ist, zeige das Login-Fenster sofort
    if (!playerName || playerName === "") {
        if(loginModal) loginModal.style.display = "flex";
    } else {
        if(loginModal) loginModal.style.display = "none";
        log("Willkommen zurück, " + playerName);
    }

    // Login Button Logik
    const finalStartBtn = document.getElementById("finalStartBtn");
    if(finalStartBtn) {
        finalStartBtn.onclick = function() {
            const nameInput = document.getElementById("heroNameInput");
            if(nameInput && nameInput.value.trim() !== "") {
                localStorage.setItem("playerName", nameInput.value.trim());
                if(loginModal) loginModal.style.display = "none";
                updateUI();
                log("Das Abenteuer beginnt, " + nameInput.value);
            } else {
                alert("Bitte gib einen Namen ein!");
            }
        };
    }
    
    // Musik Setup (Optional, falls Buttons da sind)
    const toggleBtn = document.getElementById("toggleMusic");
    if(toggleBtn) {
        toggleBtn.onclick = function() {
            log("Musik-System bereit.");
        };
    }

    updateUI();
};

function loadData() {
    try {
        const m = localStorage.getItem("game_meta_v23");
        if(m) meta = JSON.parse(m);
        const h = localStorage.getItem("game_highscore");
        if(h) highscore = JSON.parse(h);
        playerPos = parseInt(localStorage.getItem("game_pos_v23")) || 0;
        const e = localStorage.getItem("game_events_v23");
        if(e) boardEvents = JSON.parse(e); else generateBoardEvents();
        const savedHero = localStorage.getItem("currentHero");
        if(savedHero) currentHero = savedHero;
    } catch(err) { generateBoardEvents(); }
}

function saveData() {
    localStorage.setItem("game_meta_v23", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_pos_v23", playerPos);
    localStorage.setItem("game_events_v23", JSON.stringify(boardEvents));
    localStorage.setItem("currentHero", currentHero);
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.35) {
            if (Math.random() < 0.7) {
                let p = ["frog"];
                if (meta.currentRound >= 5) p.push("wolf");
                if (meta.currentRound >= 12) p.push("bear");
                boardEvents[i] = p[Math.floor(Math.random() * p.length)];
            } else { boardEvents[i] = "money_coin"; }
        }
    }
}

// --- GAMEPLAY FUNKTIONEN ---
window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; updateUI(); return; }
    
    let steps = getRandom(1, 4);
    playerPos += steps;

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 500, maxHp: 500, atk: 20, money: 500, isBoss: true, img: "images/dragon 1.png" };
            inFight = true;
        } else {
            meta.currentRound++;
            generateBoardEvents();
        }
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "money_coin") {
            if(ev==="frog") monster={name:"Frosch", hp:20, maxHp:20, atk:3, money:10, img: "images/frosch.png", isBoss:false};
            if(ev==="wolf") monster={name:"Wolf", hp:50, maxHp:50, atk:8, money:20, img: "images/wolf.png", isBoss:false};
            if(ev==="bear") monster={name:"Bär", hp:120, maxHp:120, atk:15, money:40, img: "images/bär.png", isBoss:false};
            inFight = true;
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            meta.money += 20;
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
        if(monster.isBoss) { meta.currentRound++; generateBoardEvents(); }
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            meta.hp = meta.maxHpBase;
            meta.currentRound = 1;
            playerPos = 0;
            inFight = false;
            shopOpen = true; 
            generateBoardEvents();
        }
    }
    updateUI();
};

// --- UI UPDATE MIT DEINEN BILDERN ---
function updateUI() {
    saveData();
    const hero = HERO_DATA[currentHero];
    const name = localStorage.getItem("playerName") || "Held";
    
    // Status Panel oben
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#1a1a1a; padding:10px; border:1px solid gold; display:flex; gap:10px; align-items:center; border-radius:8px; color:white;">
                <img src="${hero.img}" style="width:40px; height:40px; border:1px solid white;">
                <div style="font-size:11px;">
                    <b>${name}</b> | Gold: ${meta.money}<br>
                    Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase}
                </div>
            </div>`;
    }

    // Arena (Monster Bilder)
    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            arena.innerHTML = `
                <img src="${monster.img}" style="height:90px; object-fit:contain; margin-bottom:5px;">
                <div style="font-weight:bold; color:red; font-size:14px;">${monster.name}</div>
                <div style="background:#444; width:100%; height:8px; border-radius:4px; margin-top:5px;">
                    <div style="background:red; width:${(monster.hp/monster.maxHp)*100}%; height:100%; border-radius:4px;"></div>
                </div>`;
        } else {
            arena.innerHTML = `<div style="padding:20px; color:#666;">${shopOpen ? "IM SHOP" : "WANDERN..."}</div>`;
        }
    }
    // Spielbrett
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

    // Kampf / Bewegungs Button
    const fPanel = document.getElementById("fightPanel");
    if(fPanel) {
        fPanel.innerHTML = inFight ? 
            `<button onclick="attackMonster()" style="background:#b91c1c; color:white; padding:10px; width:100%; border:none; border-radius:5px;">ANGRIFF</button>` : 
            `<button onclick="playerMove()" style="background:#1d4ed8; color:white; padding:10px; width:100%; border:none; border-radius:5px;">${shopOpen ? 'SHOP VERLASSEN' : 'WÜRFELN'}</button>`;
    }
}