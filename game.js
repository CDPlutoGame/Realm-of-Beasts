/** * REALM OF BEAAASTS - JUMP & OVERDRIVE EDITION */

let meta = { 
    hp: 30, maxHpBase: 30, gold: 0, attackPower: 5, kills: 0, rounds: 1, hpBought: 0, atkBought: 0 
};
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];

window.openLogin = () => {
    document.getElementById("loginModal").style.display = "flex";
};

window.submitHeroName = () => {
    const val = document.getElementById("heroNameInput").value.trim();
    if (val) {
        localStorage.setItem("playerName", val);
        document.getElementById("loginModal").style.display = "none";
        checkAndStart();
    }
};

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
    if (lc) lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        const rand = Math.random();
        if (rand < 0.2) {
            const mRand = Math.random();
            if (mRand < 0.5) boardEvents[i] = "frog";
            else if (mRand < 0.85) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (rand < 0.3) boardEvents[i] = "gold";
    }
    saveData();
}

function updateStatus() {
    const sp = document.getElementById("statusPanel");
    const name = localStorage.getItem("playerName") || "Held";
    const hpCost = 100 + (meta.hpBought * 5);
    const atkCost = 100 + (meta.atkBought * 5);

    if (sp) {
        sp.innerHTML = `
            <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; font-size:11px;">
                <div style="margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:5px; color:#d4af37; display:flex; justify-content:space-between;">
                    <span><i class="fas fa-crown"></i> RUNDE: ${meta.rounds}</span>
                    <span><b>${name}</b></span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; text-align:left;">
                    <span style="color:#ef4444;"><i class="fas fa-heart"></i> HP: ${meta.hp}/${meta.maxHpBase}</span>
                    <span style="color:#f59e0b;"><i class="fas fa-coins"></i> Gold: ${meta.gold}</span>
                    <span style="color:#60a5fa;"><i class="fas fa-khanda"></i> Kraft: ${meta.attackPower}</span>
                    <span style="color:#a855f7;"><i class="fas fa-skull"></i> Kills: ${meta.kills}</span>
                </div>
            </div>`;
    }
    
    document.getElementById("shopPanel").style.display = "block";
    document.getElementById("btn-hp").innerHTML = `<i class="fas fa-heart"></i> +5 HP <span style="margin-left:auto;">${hpCost} 💰</span>`;
    document.getElementById("btn-atk").innerHTML = `<i class="fas fa-sword"></i> +5 ATK <span style="margin-left:auto;">${atkCost} 💰</span>`;
}

function renderBoard() {
    const b = document.getElementById("board"); 
    if (!b) return;
    b.style.display = "grid"; 
    b.style.gridTemplateColumns = "repeat(10, 1fr)"; 
    b.style.gap = "4px"; 
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.style = `height:35px; background:${i===playerPos?"#444":"#1a1a1a"}; border:1px solid #333; display:flex; align-items:center; justify-content:center;`;
        if (i === playerPos) t.innerHTML = '<i class="fas fa-walking" style="color:white;"></i>';
        else if (boardEvents[i] === "frog") t.innerHTML = "🐸";
        else if (boardEvents[i] === "wolf") t.innerHTML = "🐺";
        else if (boardEvents[i] === "bear") t.innerHTML = "🐻";
        else if (boardEvents[i] === "gold") t.innerHTML = "💰";
        b.appendChild(t);
    }
}

window.move = () => {
    if (inFight) return;

    // Zufällig 1 bis 4 Schritte
    let steps = Math.floor(Math.random() * 4) + 1;
    log(`Du springst ${steps} Felder weit!`);

    playerPos += steps;

    // Check ob wir über das Ziel hinausgeschossen sind (Runden-Ende)
    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.rounds % 10 === 0) {
            let bossMult = meta.rounds / 10;
            monster = { name: "WELTEN-FRESSER", icon: "🐲", hp: bossMult*1000, atk: bossMult*20, gold: bossMult*500, isBoss: true };
            inFight = true; 
            log("!!! BOSS ERSCHEINT AM RUNDENENDE !!!"); 
        } else { 
            meta.rounds++; 
            generateBoardEvents(); 
            log("Nächste Runde erreicht."); 
        }
    } else {
        // Wir prüfen NUR das Feld, auf dem wir landen
        let ev = boardEvents[playerPos];
        if (ev === "frog" || ev === "wolf" || ev === "bear") {
            if(ev==="frog") monster={name:"Frosch", icon:"🐸", hp:10, atk:2, gold:10};
            if(ev==="wolf") monster={name:"Wolf", icon:"🐺", hp:25, atk:6, gold:25};
            if(ev==="bear") monster={name:"Bär", icon:"🐻", hp:60, atk:12, gold:60};
            inFight = true; 
            boardEvents[playerPos] = null; 
            log(`Du landest direkt vor einem ${monster.name}!`);
        } else if (ev === "gold") { 
            meta.gold += 10; 
            boardEvents[playerPos] = null; 
            log("Gold gefunden! +10 💰"); 
        } else {
            log("Sicher gelandet.");
        }
    }
    updateUI();
};

window.attack = () => {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        log(`Besiegt! +${monster.gold} Gold.`); meta.gold += monster.gold; meta.kills++; inFight = false;
        if (monster.isBoss) { meta.rounds++; generateBoardEvents(); }
    } else {
        meta.hp -= monster.atk; log(`Monster trifft: -${monster.atk} HP`);
        if (meta.hp <= 0) { log("KO! Neustart im Lager."); meta.hp = meta.maxHpBase; playerPos = 0; inFight = false; generateBoardEvents(); }
    }
    updateUI();
};

window.buyUpgrade = (type) => {
    let cost = type === 'hp' ? 100+(meta.hpBought*5) : 100+(meta.atkBought*5);
    if (meta.gold >= cost) {
        meta.gold -= cost;
        if (type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.hpBought++; }
        else { meta.attackPower += 5; meta.atkBought++; }
    } else log("Zu wenig Gold!");
    updateUI();
};

function updateUI() { saveData(); updateStatus(); renderBoard(); setActionBtn(); }

function setActionBtn() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    if (inFight) {
        fp.innerHTML = `<div style="border:2px solid #b91c1c; padding:15px; background:#200; border-radius:10px;">
            <div style="color:#f87171; font-size:18px;">${monster.icon} ${monster.name} (${monster.hp} HP)</div>
            <button onclick="attack()" class="game-btn" style="background:#b91c1c;">ANGRIFF (-${meta.attackPower})</button></div>`;
    } else {
        fp.innerHTML = `<button onclick="move()" class="game-btn" style="background:#1d4ed8;">SPRINGEN (1-4 FELDER)</button>`;
    }
}

function checkAndStart() { 
    if (localStorage.getItem("playerName")) { 
        loadData(); 
        updateUI(); 
    } 
}

window.addEventListener('load', checkAndStart);
