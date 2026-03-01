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
    const savedMeta = localStorage.getItem("game_meta_v10");
    if(savedMeta) meta = JSON.parse(savedMeta);
    
    playerPos = parseInt(localStorage.getItem("game_pos_v10")) || 0;
    const savedEvents = localStorage.getItem("game_events_v10");
    if(savedEvents) boardEvents = JSON.parse(savedEvents); 
    else generateBoardEvents();
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    if(meta.currentKills > highscore.bestKills) highscore.bestKills = meta.currentKills;
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_meta_v10", JSON.stringify(meta));
    localStorage.setItem("game_pos_v10", playerPos);
    localStorage.setItem("game_events_v10", JSON.stringify(boardEvents));
}

function log(msg) {
    const lc = document.getElementById("logContent");
    if(lc) lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML;
}

// --- NEUE LOGIK FÜR DAS BOARD ---
function generateBoardEvents() {
    let count = 0;
    // Wir versuchen so lange zu generieren, bis wir zwischen 10 und 18 Events haben
    while (count < 10 || count > 18) {
        boardEvents = new Array(30).fill(null);
        count = 0;
        
        for (let i = 1; i < 30; i++) { // Feld 0 bleibt immer frei (Start)
            let chance = Math.random();
            if (chance < 0.4) { // 40% Chance auf IRGENDETWAS pro Feld im ersten Durchlauf
                count++;
                if (Math.random() < 0.7) { // Davon 70% Monster
                    let p = [];
                    if (meta.currentRound <= 15) p.push("frog");
                    if (meta.currentRound >= 11 && meta.currentRound <= 25) p.push("wolf");
                    if (meta.currentRound >= 20) p.push("bear");
                    boardEvents[i] = p.length > 0 ? p[Math.floor(Math.random() * p.length)] : "frog";
                } else { // 30% Münzen
                    boardEvents[i] = "money_coin";
                }
            }
        }
    }
    console.log("Board generiert mit " + count + " Events.");
}

// --- UI ---
function updateUI() {
    saveData();
    const name = localStorage.getItem("playerName") || "Held";
    
    // Status Panel
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
        <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; text-align:left;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:5px;">
                <b style="color:#d4af37"><i class="fas fa-dragon"></i> ${name}</b>
                <span style="color:#f59e0b"><i class="fas fa-coins"></i> ${meta.money} €</span>
            </div>
            <div class="stat-grid">
                <div class="stat-box">Runde: ${meta.currentRound} | Kills: ${meta.currentKills}</div>
                <div class="stat-box" style="border-color:#d4af37">Beste: R${highscore.bestRound} | K${highscore.bestKills}</div>
            </div>
            <div style="margin-top:8px; font-size:12px; color:#ef4444; font-weight:bold;">HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}</div>
        </div>`;
    }

    // Battle Arena
    const arena = document.getElementById("battle-arena");
    if(inFight && monster) {
        arena.style.display = "block";
        document.getElementById("enemy-icon").innerHTML = monster.icon;
        document.getElementById("enemy-name").innerHTML = monster.name;
        document.getElementById("enemy-name").style.color = monster.isBoss ? "#d4af37" : "#ef4444";
        let perc = (monster.hp / monster.maxHp) * 100;
        document.getElementById("enemy-hp-fill").style.width = perc + "%";
        document.getElementById("enemy-hp-text").innerHTML = `${Math.max(0, monster.hp)} / ${monster.maxHp} HP`;
    } else {
        arena.style.display = "none";
    }

    // Board
    const b = document.getElementById("board");
    if(b) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const t = document.createElement("div");
            t.className = "cell";
            if (i === playerPos) t.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") t.innerHTML = "🐸";
            else if (boardEvents[i] === "wolf") t.innerHTML = "🐺";
            else if (boardEvents[i] === "bear") t.innerHTML = "🐻";
            else if (boardEvents[i] === "money_coin") t.innerHTML = "💰"; 
            b.appendChild(t);
        }
    }

    // Buttons
    const fp = document.getElementById("fightPanel");
    if (inFight) {
        let color = monster.isBoss ? "#f59e0b" : "#b91c1c";
        fp.innerHTML = `<button class="game-btn" style="background:${color};" onclick="attackMonster()">ANGRIFF</button>`;
    } else {
        const btnText = shopOpen ? "NEUER VERSUCH" : "VORWÄRTS (1-4)";
        fp.innerHTML = `<button class="game-btn" style="background:#1d4ed8;" onclick="playerMove()">${btnText}</button>`;
    }

    const bh = document.getElementById("btn-hp");
    const ba = document.getElementById("btn-atk");
    if(bh && ba) {
        bh.innerHTML = `+5 HP | ${100+(meta.hpBought*5)} €`;
        ba.innerHTML = `+5 ATK | ${100+(meta.atkBought*5)} €`;
        bh.disabled = ba.disabled = !shopOpen;
        bh.style.opacity = shopOpen ? "1" : "0.3";
        bh.onclick = () => buyItem('hp');
        ba.onclick = () => buyItem('atk');
    }
}

window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Neue Reise gestartet."); }
    let steps = Math.floor(Math.random() * 4) + 1;
    playerPos += steps;
    log("Vorwärts: " + steps);

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            let lvl = meta.currentRound / 10;
            monster = { name: "EPISCHER DRACHE", hp: lvl*800, maxHp: lvl*800, atk: 15+(lvl*5), money: lvl*1000, isBoss: true, icon: "🐲" };
            inFight = true;
            log("!!! BOSS-KAMPF !!!");
        } else {
            meta.currentRound++;
            generateBoardEvents(); // Hier wird die neue 10-18er Regel angewendet
            log("Runde " + meta.currentRound);
        }
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "money_coin") {
            if(ev==="frog") monster={name:"Giftfrosch", hp:12, maxHp:12, atk:2, money:15, icon:"🐸", isBoss:false};
            if(ev==="wolf") monster={name:"Schattenwolf", hp:30, maxHp:30, atk:7, money:35, icon:"🐺", isBoss:false};
            if(ev==="bear") monster={name:"Höhlenbär", hp:80, maxHp:80, atk:15, money:70,
