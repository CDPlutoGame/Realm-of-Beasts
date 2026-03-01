// --- SPIEL-ZUSTAND ---
let meta = { hp: 30, maxHpBase: 30, gold: 0, attackPower: 5, kills: 0, rounds: 1, hpBought: 0, atkBought: 0 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;

// --- INITIALISIERUNG ---
document.addEventListener("DOMContentLoaded", () => {
    // Button im Hauptmenü
    const initBtn = document.getElementById("initBtn");
    if(initBtn) {
        initBtn.onclick = () => {
            document.getElementById("loginModal").style.display = "flex";
        };
    }

    // Button im Login-Fenster
    const finalStartBtn = document.getElementById("finalStartBtn");
    if(finalStartBtn) {
        finalStartBtn.onclick = () => {
            const val = document.getElementById("heroNameInput").value.trim();
            if (val) {
                localStorage.setItem("playerName", val);
                document.getElementById("loginModal").style.display = "none";
                startGame();
            } else {
                alert("Bitte gib einen Namen ein!");
            }
        };
    }

    // Prüfen ob bereits eingeloggt
    if (localStorage.getItem("playerName")) {
        startGame();
    }
});

function startGame() {
    loadData();
    updateUI();
    log("Willkommen zurück, " + localStorage.getItem("playerName") + "!");
}

function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) meta = JSON.parse(m);
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
    const savedEvents = localStorage.getItem("game_events");
    if (savedEvents) boardEvents = JSON.parse(savedEvents); else generateBoardEvents();
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
    localStorage.setItem("game_events", JSON.stringify(boardEvents));
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if (lc) {
        lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
        lc.scrollTop = 0;
    }
}

// --- MONSTER LOGIK ---
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        const rand = Math.random();
        if (rand < 0.2) {
            let possible = [];
            if (meta.rounds <= 15) possible.push("frog");
            if (meta.rounds >= 11 && meta.rounds <= 25) possible.push("wolf");
            if (meta.rounds >= 20) possible.push("bear");
            if (possible.length === 0) possible.push("frog");
            boardEvents[i] = possible[Math.floor(Math.random() * possible.length)];
        } else if (rand < 0.3) {
            boardEvents[i] = "gold";
        }
    }
    saveData();
}

// --- UI UPDATES ---
function updateStatus() {
    const sp = document.getElementById("statusPanel");
    const name = localStorage.getItem("playerName") || "Held";
    const hpCost = 100 + (meta.hpBought * 5);
    const atkCost = 100 + (meta.atkBought * 5);

    if (sp) {
        sp.innerHTML = `<div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; font-size:11px;">
            <div style="margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:5px; color:#d4af37; display:flex; justify-content:space-between;">
                <span><i class="fas fa-crown"></i> RUNDE: ${meta.rounds}</span>
                <span><b>${name}</b></span>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; text-align:left;">
                <span style="color:#ef4444;"><i class="fas fa-heart"></i> HP: ${meta.hp}/${meta.maxHpBase}</span>
                <span style="color:#f59e0b;"><i class="fas fa-coins"></i> Gold: ${meta.gold}</span>
                <span style="color:#60a5fa;"><i class="fas fa-khanda"></i> Kraft: ${meta.attackPower}</span>
                <span style="color:#a855f7;"><i class="fas fa-skull"></i> Kills: ${meta.kills}</span>
            </div></div>`;
    }
    
    document.getElementById("shopPanel").style.display = "block";
    const btnHp = document.getElementById("btn-hp");
    const btnAtk = document.getElementById("btn-atk");

    btnHp.innerHTML = `<i class="fas fa-plus-circle"></i> LEBEN (+5) | ${hpCost} 💰`;
    btnAtk.innerHTML = `<i class="fas fa-fire"></i> STÄRKE (+5) | ${atkCost} 💰`;

    [btnHp, btnAtk].forEach(btn => {
        btn.disabled = !shopOpen;
        btn.style.opacity = shopOpen ? "1" : "0.3";
        btn.style.cursor = shopOpen ? "pointer" : "not-allowed";
        btn.onclick = () => {
            const type = btn.id === "btn-hp" ? 'hp' : 'atk';
            buyUpgrade(type);
        };
    });
}

function renderBoard() {
    const b = document.getElementById("board"); 
    if (!b) return;
    b.style.display = "grid"; b.style.gridTemplateColumns = "repeat(10, 1fr)"; b.style.gap = "4px"; b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.style = `height:35px; background:${i===playerPos?"#444":"#1a1a1a"}; border:1px solid #333; display:flex; align-items:center; justify-content:center; border-radius:4px;`;
        if (i === playerPos) t.innerHTML = '<i class="fas fa-walking" style="color:white;"></i>';
        else if (boardEvents[i] === "frog") t.innerHTML = "🐸";
        else if (boardEvents[i] === "wolf") t.innerHTML = "🐺";
        else if (boardEvents[i] === "bear") t.innerHTML = "🐻";
        else if (boardEvents[i] === "gold") t.innerHTML = "💰";
        b.appendChild(t);
    }
}

// --- AKTIONEN ---
function move() {
    if (inFight) return;
    shopOpen = false; 
    let steps = Math.floor(Math.random() * 4) + 1;
    playerPos += steps;
    log(`Du springst ${steps} Felder.`);

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.rounds % 10 === 0) {
            let mult = meta.rounds / 10;
            monster = { name: "BOSS", icon: "🐲", hp: mult*1000, atk: mult*20, gold: mult*500, isBoss: true };
            inFight = true; log("!!! BOSS ERSCHEINT !!!");
        } else { 
            meta.rounds++; 
            generateBoardEvents(); 
            log(`Runde ${meta.rounds} beginnt.`); 
        }
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "gold") {
            if(ev==="frog") monster={name:"Frosch", icon:"🐸", hp:10, atk:2, gold:10};
            if(ev==="wolf") monster={name:"Wolf", icon:"🐺", hp:25, atk:6, gold:25};
            if(ev==="bear") monster={name:"Bär", icon:"🐻", hp:60, atk:12, gold:60};
            inFight = true; boardEvents[playerPos] = null;
            log(`${monster.icon} Kampf gegen ${monster.name}!`);
        } else if (ev === "gold") { 
            meta.gold += 10; boardEvents[playerPos] = null; log("+10 Gold gefunden!"); 
        }
    }
    updateUI();
}

function attack() {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        log(`Sieg! +${monster.gold} Gold.`);
        meta.gold += monster.gold; meta.kills++; inFight = false;
        if (monster.isBoss) { meta.rounds++; generateBoardEvents(); }
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) { 
            meta.hp = meta.maxHpBase; playerPos = 0; inFight = false; shopOpen = true; 
            log("💀 GEFALLEN! Schwarzmarkt im Lager offen."); generateBoardEvents(); 
        }
    }
    updateUI();
}

function buyUpgrade(type) {
    if (!shopOpen) return;
    let cost = type === 'hp' ? 100+(meta.hpBought*5) : 100+(meta.atkBought*5);
    if (meta.gold >= cost) {
        meta.gold -= cost;
        if (type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.hpBought++; }
        else { meta.attackPower += 5; meta.atkBought++; }
        log("Upgrade auf dem Schwarzmarkt gekauft.");
    } else {
        log("Zu wenig Gold!");
    }
    updateUI();
}

function updateUI() { saveData(); updateStatus(); renderBoard(); setActionBtn(); }

function setActionBtn() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    if (inFight) {
        fp.innerHTML = `<button id="atkBtn" class="game-btn" style="background:#b91c1c;">${monster.icon} ANGRIFF (-${meta.attackPower})</button>`;
        document.getElementById("atkBtn").onclick = attack;
    } else {
        let label = shopOpen ? "ZURÜCK IN DIE WILDNIS" : "SPRINGEN (1-4)";
        fp.innerHTML = `<button id="moveBtn" class="game-btn" style="background:#1d4ed8;">${label}</button>`;
        document.getElementById("moveBtn").onclick = move;
    }
}
