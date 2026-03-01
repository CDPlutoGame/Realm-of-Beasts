/** * REALM OF BEAAASTS - BOSS EDITION */

let meta = { 
    hp: 30, 
    maxHpBase: 30, 
    gold: 0, 
    attackPower: 5, 
    kills: 0,
    hpBought: 0,
    atkBought: 0,
    rounds: 1 // Wir starten in Runde 1
};
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = []; 

// --- SPEICHERN & LADEN ---
function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) {
        meta = JSON.parse(m);
        if (meta.rounds === undefined) meta.rounds = 1;
    }
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
    
    const savedEvents = localStorage.getItem("game_events");
    if (savedEvents) {
        boardEvents = JSON.parse(savedEvents);
    } else {
        generateBoardEvents();
    }
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
    localStorage.setItem("game_events", JSON.stringify(boardEvents));
}

// --- BOARD GENERIERUNG ---
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        const rand = Math.random();
        if (rand < 0.15) {
            const mRand = Math.random();
            if (mRand < 0.5) boardEvents[i] = "frog";
            else if (mRand < 0.85) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        }
        else if (rand < 0.25) boardEvents[i] = "gold";
    }
    saveData();
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if (lc) lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
}

function updateStatus() {
    const sp = document.getElementById("statusPanel");
    const name = localStorage.getItem("playerName") || "Held";
    const nextHpCost = 100 + (meta.hpBought * 5);
    const nextAtkCost = 100 + (meta.atkBought * 5);

    if (sp) {
        sp.innerHTML = `
            <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; font-size:11px;">
                <div style="margin-bottom:5px; border-bottom:1px solid #333; padding-bottom:5px; color:#d4af37; display:flex; justify-content:space-between;">
                    <span><i class="fas fa-crown"></i> RUNDE: ${meta.rounds}</span>
                    <span><b>${name}</b></span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px; text-align:left;">
                    <span style="color:#ef4444;"><i class="fas fa-heartbeat"></i> HP: ${meta.hp}/${meta.maxHpBase}</span>
                    <span style="color:#f59e0b;"><i class="fas fa-coins"></i> Gold: ${meta.gold}</span>
                    <span style="color:#60a5fa;"><i class="fas fa-khanda"></i> Kraft: ${meta.attackPower}</span>
                    <span style="color:#a855f7;"><i class="fas fa-skull"></i> Kills: ${meta.kills}</span>
                </div>
            </div>`;
    }
    updateShopUI(hpCost, atkCost);
}

function updateShopUI(hpCost, atkCost) {
    const shop = document.getElementById("shopPanel");
    if (!shop) return;
    const buttons = shop.getElementsByTagName("button");
    if (buttons.length >= 2) {
        buttons[0].innerHTML = `<i class="fas fa-heart"></i> +5 MAX HP <span style="margin-left:auto;">${hpCost} <i class="fas fa-coins"></i></span>`;
        buttons[1].innerHTML = `<i class="fas fa-khanda"></i> +5 ANGRIFF <span style="margin-left:auto;">${atkCost} <i class="fas fa-coins"></i></span>`;
    }
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
        t.style.height = "35px";
        t.style.background = i === playerPos ? "#444" : "#1a1a1a";
        t.style.border = "1px solid #333";
        t.style.display = "flex"; t.style.alignItems = "center"; t.style.justifyContent = "center";
        
        if (i === playerPos) {
            t.innerHTML = '<i class="fas fa-walking" style="color:white;"></i>';
        } else {
            switch(boardEvents[i]) {
                case "frog": t.innerHTML = "🐸"; break;
                case "wolf": t.innerHTML = "🐺"; break;
                case "bear": t.innerHTML = "🐻"; break;
                case "gold": t.innerHTML = "💰"; break;
            }
        }
        b.appendChild(t);
    }
}

function setActionBtn() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    if (inFight) {
        let btnColor = monster.isBoss ? "#d4af37" : "#b91c1c";
        fp.innerHTML = `
            <div style="border:2px solid ${btnColor}; padding:15px; background:#200; border-radius:10px;">
                <div style="margin-bottom:10px; color:${btnColor}; font-size:18px; font-weight:bold;">
                    ${monster.icon} ${monster.name} (HP: ${monster.hp})
                </div>
                <button onclick="attack()" class="game-btn" style="background:${btnColor}; color:black;">⚔️ SCHLAG: -${meta.attackPower} HP</button>
            </div>`;
    } else {
        fp.innerHTML = `<button onclick="move()" class="game-btn" style="background:#1d4ed8;"><i class="fas fa-shoe-prints"></i> VORWÄRTS STÜRZEN</button>`;
    }
}

window.move = () => {
    if (inFight) return;
    let steps = Math.floor(Math.random() * 3) + 1;

    for(let s = 0; s < steps; s++) {
        playerPos++;
        
        // Check ob Runde zu Ende
        if (playerPos >= 30) {
            playerPos = 0;
            if (meta.rounds % 10 === 0) {
                initBoss(meta.rounds);
                inFight = true;
                log(`🚨 ALARM! Der Boss der Runde ${meta.rounds} erscheint!`);
                break; 
            } else {
                meta.rounds++;
                generateBoardEvents();
                log(`Runde ${meta.rounds} beginnt!`);
            }
        }

        const event = boardEvents[playerPos];
        if (event === "frog" || event === "wolf" || event === "bear") {
            initMonster(event);
            inFight = true;
            log(`${monster.icon} Ein ${monster.name} greift an!`);
            boardEvents[playerPos] = null;
            break;
        } else if (event === "gold") {
            meta.gold += 10;
            log("Gold gefunden! +10 💰");
            boardEvents[playerPos] = null;
        }
    }
    renderBoard(); setActionBtn(); updateStatus(); saveData();
};

function initMonster(type) {
    if (type === "frog") monster = { name: "Giftfrosch", icon: "🐸", hp: 10, atk: 2, gold: 10, isBoss: false };
    else if (type === "wolf") monster = { name: "Hungriger Wolf", icon: "🐺", hp: 25, atk: 6, gold: 25, isBoss: false };
    else if (type === "bear") monster = { name: "Großer Bär", icon: "🐻", hp: 60, atk: 12, gold: 60, isBoss: false };
}

function initBoss(round) {
    // Runde 10: 1000 HP / 20 ATK | Runde 20: 2000 HP / 40 ATK
    let multiplier = round / 10;
    monster = { 
        name: "WELTEN-ZERSTÖRER", 
        icon: "🐲", 
        hp: 1000 * multiplier, 
        atk: 20 * multiplier, 
        gold: 500 * multiplier,
        isBoss: true
    };
}

window.attack = () => {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.gold += monster.gold;
        meta.kills += 1;
        inFight = false;
        log(`SIEGER! ${monster.name} besiegt! +${monster.gold} Gold.`);
        
        if (monster.isBoss) {
            meta.rounds++;
            generateBoardEvents();
            log(`Nächste Runde ${meta.rounds} freigeschaltet!`);
        }
    } else {
        meta.hp -= monster.atk;
        log(`${monster.icon} trifft dich! -${monster.atk} HP.`);
        if (meta.hp <= 0) {
            log("💀 Game Over! Du wurdest zerschmettert.");
            meta.hp = meta.maxHpBase; 
            playerPos = 0; 
            inFight = false;
            generateBoardEvents(); 
        }
    }
    renderBoard(); setActionBtn(); updateStatus(); saveData();
};

window.buyUpgrade = (type) => {
    if (type === 'hp') {
        const cost = 100 + (meta.hpBought * 5);
        if (meta.gold >= cost) {
            meta.gold -= cost; meta.maxHpBase += 5; meta.hp = meta.maxHpBase;
            meta.hpBought++; log(`💖 Leben erhöht!`);
        } else { log(`⚠️ Zu wenig Gold!`); }
    } else if (type === 'atk') {
        const cost = 100 + (meta.atkBought * 5);
        if (meta.gold >= cost) {
            meta.gold -= cost; meta.attackPower += 5;
            meta.atkBought++; log(`⚔️ Kraft erhöht!`);
        } else { log(`⚠️ Zu wenig Gold!`); }
    }
    saveData(); updateStatus();
};

function checkAndStart() {
    if (localStorage.getItem("playerName")) {
        loadData(); updateStatus(); renderBoard(); setActionBtn();
    }
}
window.addEventListener('load', checkAndStart);
setInterval(() => {
    const b = document.getElementById("board");
    if (localStorage.getItem("playerName") && b && b.style.display !== "grid") checkAndStart();
}, 1000);
