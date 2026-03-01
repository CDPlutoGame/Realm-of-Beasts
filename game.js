// --- SPIEL-DATEN ---
let meta = { 
    hp: 30, 
    maxHpBase: 30, 
    money: 0, 
    attackPower: 5, 
    currentKills: 0, 
    currentRound: 1, 
    hpBought: 0, 
    atkBought: 0 
};

let highscore = { bestRound: 1, bestKills: 0 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;

// --- START ---
window.onload = function() {
    const initBtn = document.getElementById("initBtn");
    if(initBtn) initBtn.onclick = () => document.getElementById("loginModal").style.display = "flex";

    const finalBtn = document.getElementById("finalStartBtn");
    if(finalBtn) {
        finalBtn.onclick = () => {
            const name = document.getElementById("heroNameInput").value.trim();
            if(name) {
                localStorage.setItem("playerName", name);
                document.getElementById("loginModal").style.display = "none";
                initGame();
            }
        };
    }
    if(localStorage.getItem("playerName")) initGame();
};

function initGame() {
    loadData();
    updateUI();
    log("Willkommen im Realm!");
}

function loadData() {
    const savedHighscore = localStorage.getItem("game_highscore");
    if(savedHighscore) highscore = JSON.parse(savedHighscore);

    const savedMeta = localStorage.getItem("game_meta_v8");
    if(savedMeta) meta = JSON.parse(savedMeta);
    
    playerPos = parseInt(localStorage.getItem("game_pos_v8")) || 0;
    const savedEvents = localStorage.getItem("game_events_v8");
    if(savedEvents) boardEvents = JSON.parse(savedEvents); 
    else generateBoardEvents();
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    if(meta.currentKills > highscore.bestKills) highscore.bestKills = meta.currentKills;
    
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_meta_v8", JSON.stringify(meta));
    localStorage.setItem("game_pos_v8", playerPos);
    localStorage.setItem("game_events_v8", JSON.stringify(boardEvents));
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML;
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        if (Math.random() < 0.25) {
            let p = [];
            if (meta.currentRound <= 15) p.push("frog");
            if (meta.currentRound >= 11 && meta.currentRound <= 25) p.push("wolf");
            if (meta.currentRound >= 20) p.push("bear");
            boardEvents[i] = p.length > 0 ? p[Math.floor(Math.random() * p.length)] : "frog";
        } else if (Math.random() < 0.1) {
            boardEvents[i] = "money_coin"; 
        }
    }
}

// --- UI ---
function updateUI() {
    saveData();
    const name = localStorage.getItem("playerName") || "Held";
    
    document.getElementById("statusPanel").innerHTML = `
        <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; text-align:left;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:5px; margin-bottom:5px;">
                <b style="color:#d4af37"><i class="fas fa-dragon"></i> ${name}</b>
                <span style="color:#f59e0b"><i class="fas fa-coins"></i> ${meta.money} €</span>
            </div>
            <div class="stat-grid">
                <div class="stat-box">
                    <span class="best-label">AKTUELL</span>
                    Runde: ${meta.currentRound}<br>Kills: ${meta.currentKills}
                </div>
                <div class="stat-box" style="border-color:#d4af37">
                    <span class="best-label">BESTE (👑)</span>
                    Runde: ${highscore.bestRound}<br>Kills: ${highscore.bestKills}
                </div>
            </div>
            <div style="margin-top:8px; font-size:12px; color:#ef4444; font-weight:bold;">
                HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}
            </div>
        </div>`;

    const b = document.getElementById("board");
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.style = "height:35px; background:#1a1a1a; border:1px solid #333; display:flex; align-items:center; justify-content:center; border-radius:4px;";
        if (i === playerPos) t.innerHTML = "🧙"; // Wir lassen das Icon, aber es wird im Text nicht mehr als Magier bezeichnet
        else if (boardEvents[i] === "frog") t.innerHTML = "🐸";
        else if (boardEvents[i] === "wolf") t.innerHTML = "🐺";
        else if (boardEvents[i] === "bear") t.innerHTML = "🐻";
        else if (boardEvents[i] === "money_coin") t.innerHTML = "💰"; 
        b.appendChild(t);
    }

    const fp = document.getElementById("fightPanel");
    if (inFight) {
        let color = monster.isBoss ? "#f59e0b" : "#b91c1c";
        fp.innerHTML = `<button class="game-btn" style="background:${color};" onclick="attackMonster()">ANGRIFF (${monster.hp} HP)</button>`;
    } else {
        const btnText = shopOpen ? "NEUER VERSUCH" : "VORWÄRTS (1-4)";
        fp.innerHTML = `<button class="game-btn" style="background:#1d4ed8;" onclick="playerMove()">${btnText}</button>`;
    }

    const bh = document.getElementById("btn-hp");
    const ba = document.getElementById("btn-atk");
    bh.innerHTML = `+5 HP | ${100+(meta.hpBought*5)} €`;
    ba.innerHTML = `+5 ATK | ${100+(meta.atkBought*5)} €`;
    bh.disabled = ba.disabled = !shopOpen;
    bh.style.opacity = shopOpen ? "1" : "0.3";
    bh.onclick = () => buyItem('hp');
    ba.onclick = () => buyItem('atk');
}

// --- AKTIONEN ---
window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Neue Reise gestartet."); }

    let steps = Math.floor(Math.random() * 4) + 1;
    playerPos += steps;
    log("Du rückst vor: " + steps);

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            let level = meta.currentRound / 10;
            monster = { hp: level * 800, atk: 15 + (level * 5), money: level * 1000, isBoss: true };
            inFight = true;
            log("!!! BOSS ERSCHEINT !!!");
        } else {
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound + "!");
        }
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "money_coin") {
            if(ev==="frog") monster={hp:10, atk:2, money:12, isBoss:false};
            if(ev==="wolf") monster={hp:25, atk:6, money:30, isBoss:false};
            if(ev==="bear") monster={hp:70, atk:14, money:65, isBoss:false};
            inFight = true;
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            meta.money += 25;
            boardEvents[playerPos] = null;
            log("+25 € gefunden!");
        }
    }
    updateUI();
};

window.attackMonster = function() {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
        meta.currentKills++;
        inFight = false;
        log("Sieg! +" + monster.money + " €");
        if(monster.isBoss) {
            meta.currentRound++;
            generateBoardEvents();
            log("Der Boss wurde bezwungen!");
        }
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            log("💀 Besiegt! Rückzug zum Schwarzmarkt.");
            saveData(); 
            meta.hp = meta.maxHpBase;
            meta.currentRound = 1;
            meta.currentKills = 0;
            playerPos = 0;
            inFight = false;
            shopOpen = true; 
            generateBoardEvents();
        }
    }
    updateUI();
};

window.buyItem = function(type) {
    if(!shopOpen) return;
    let cost = type === 'hp' ? 100+(meta.hpBought*5) : 100+(meta.atkBought*5);
    if(meta.money >= cost) {
        meta.money -= cost;
        if(type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.hpBought++; }
        else { meta.attackPower += 5; meta.atkBought++; }
        log("Held verstärkt!");
    } else { log("Zu wenig Geld!"); }
    updateUI();
};
