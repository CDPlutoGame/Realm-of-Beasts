import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

// --- VARIABLEN ---
let playerPos = 0;
let currentRounds = 1;
let inFight = false;
let monster = null;
let gameStarted = false;

const monsterTypes = [
    { name: "Frosch", icon: "🐸", hp: 30, atk: 5, gold: 15 },
    { name: "Wolf", icon: "🐺", hp: 60, atk: 12, gold: 35 },
    { name: "Bär", icon: "🐻", hp: 120, atk: 25, gold: 75 }
];

// --- START-FUNKTION ---
async function startFullGame() {
    if (gameStarted) return;
    gameStarted = true;

    console.log("Versuche Spielstart...");

    try {
        if (auth.currentUser) {
            await loadMeta();
            document.getElementById("topBar").style.display = "flex";
        }

        // SICHERHEITS-CHECK: Falls Werte in Firebase fehlen, Standard setzen
        if (!meta.gold) meta.gold = 0;
        if (!meta.hp) meta.hp = 100;
        if (!meta.maxHpBase) meta.maxHpBase = 100;
        if (!meta.attackPower) meta.attackPower = 10;
        if (!meta.atkPrice) meta.atkPrice = 100;
        if (!meta.hpPrice) meta.hpPrice = 100;
        if (meta.autoUnlocked === undefined) meta.autoUnlocked = false;
        if (!meta.monstersKilled) meta.monstersKilled = 0;
        if (!meta.bossesKilled) meta.bossesKilled = 0;

        updateHud();
        renderShop();
        renderBoard();
        setFightPanelIdle();
        
        try { await renderLeaderboard(); } catch(e) { console.warn("Ranking lädt noch..."); }

        // Startet die Automatik-Schleife
        setInterval(heartbeat, 600);

    } catch (error) {
        console.error("KRITISCHER FEHLER:", error);
        alert("Fehler beim Laden: " + error.message);
    }
}

// --- LOGIK-SCHLEIFE ---
function heartbeat() {
    if (meta.autoUnlocked && !inFight) {
        // Stoppt vor dem Boss in Welle 10, 20...
        const isBossNext = (currentRounds % 10 === 0 && playerPos === 28);
        if (!isBossNext) {
            move();
        }
    } else if (meta.autoUnlocked && inFight) {
        if (monster && monster.name !== "Drache") {
            attack();
        }
    }
}

// --- STATUS ---
function updateHud() {
    const statusPanel = document.getElementById("statusPanel");
    if (!statusPanel) return;
    const autoStatus = meta.autoUnlocked ? "✅ Aktiv" : "🔒 Besiege Boss 1";
    
    statusPanel.innerHTML = `
        <h3>📊 Helden-Status</h3>
        <p>❤️ HP: <b>${meta.hp} / ${meta.maxHpBase}</b></p>
        <p>💰 Gold: <b>${meta.gold}</b> | ⚔️ Kraft: <b>${meta.attackPower}</b></p>
        <hr>
        <p>🌊 Welle: <b>${currentRounds}</b> | 📍 Feld: <b>${playerPos + 1}</b></p>
        <p>🤖 Auto: ${autoStatus}</p>
    `;
}

// --- SHOP ---
function renderShop() {
    const shop = document.getElementById("shop");
    if (!shop) return;
    shop.innerHTML = `
        <h3>🏪 Marktplatz</h3>
        <button id="buyAtk" class="game-btn">⚔️ +10 ATK (${meta.atkPrice}G)</button>
        <button id="buyMaxHp" class="game-btn">❤️ +10 MaxHP (${meta.hpPrice}G)</button>
        <button id="buyHeal" class="game-btn">🧪 Heiltrank +10 (50G)</button>
        <button id="potionAtk" class="game-btn">⚡ Elexier +5 ATK (10G)</button>
        <button id="potionHP" class="game-btn">💎 Elexier +10 HP (10G)</button>
    `;

    document.getElementById("buyAtk").onclick = () => buyUpgrade("atk");
    document.getElementById("buyMaxHp").onclick = () => buyUpgrade("hp");
    document.getElementById("buyHeal").onclick = () => usePotion("heal");
    document.getElementById("potionAtk").onclick = () => usePotion("atk");
    document.getElementById("potionHP").onclick = () => usePotion("maxhp");
}

async function buyUpgrade(type) {
    if (type === "atk" && meta.gold >= meta.atkPrice) {
        meta.gold -= meta.atkPrice; meta.attackPower += 10; meta.atkPrice += 5;
    } else if (type === "hp" && meta.gold >= meta.hpPrice) {
        meta.gold -= meta.hpPrice; meta.maxHpBase += 10; meta.hp += 10; meta.hpPrice += 5;
    }
    await saveMeta(); updateHud(); renderShop();
}

async function usePotion(type) {
    if (type === "heal" && meta.gold >= 50) {
        meta.gold -= 50; meta.hp = Math.min(meta.maxHpBase, meta.hp + 10);
    } else if (type === "atk" && meta.gold >= 10) {
        meta.gold -= 10; meta.attackPower += 5;
    } else if (type === "maxhp" && meta.gold >= 10) {
        meta.gold -= 10; meta.maxHpBase += 10; meta.hp += 10;
    }
    await saveMeta(); updateHud(); renderShop();
}

// --- BEWEGUNG & KAMPF ---
function move() {
    if (inFight) return;
    playerPos++;
    if (playerPos >= 30) { playerPos = 0; currentRounds++; }
    renderBoard();
    updateHud();
    setFightPanelIdle();
    checkTile();
}

function checkTile() {
    if (currentRounds % 10 === 0 && playerPos === 29) {
        const bonus = (meta.bossesKilled || 0) * 1000;
        monster = { name: "Drache", icon: "🐲", hp: 1000 + bonus, atk: 30 + ((meta.bossesKilled || 0) * 10), gold: 1000 };
        inFight = true; renderFight();
    } else if (Math.random() < 0.3 && playerPos !== 0) {
        const m = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        monster = { ...m, hp: m.hp + (currentRounds * 2) };
        inFight = true; renderFight();
    }
}

async function attack() {
    if (!inFight || !monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        inFight = false; meta.gold += monster.gold;
        if (monster.name === "Drache") {
            meta.bossesKilled++; meta.autoUnlocked = true;
        } else { meta.monstersKilled++; }
        monster = null; await saveMeta(); updateHud(); setFightPanelIdle();
        return;
    }
    meta.hp -= monster.atk;
    if (meta.hp <= 0) {
        alert("Besiegt! Kraft bleibt erhalten.");
        meta.hp = meta.maxHpBase; playerPos = 0; currentRounds = 1; inFight = false;
    }
    await saveMeta(); updateHud(); if (inFight) renderFight();
}

// --- UI RENDERER ---
function renderBoard() {
    const b = document.getElementById("board"); if(!b) return;
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div"); t.className = "tile";
        t.innerHTML = i === playerPos ? "🧍" : (i === 29 ? "🏁" : "⬜");
        b.appendChild(t);
    }
}

function setFightPanelIdle() {
    const fp = document.getElementById("fightPanel"); if(!fp) return;
    fp.innerHTML = `<p style="text-align:center; padding:15px;">🌿 Feld ${playerPos+1}</p>`;
}

function renderFight() {
    const fp = document.getElementById("fightPanel"); if(!fp) return;
    fp.innerHTML = `<div style="text-align: center; padding: 10px;">
        <div style="font-size: 40px;">${monster.icon}</div>
        <h4>${monster.name} (HP: ${monster.hp})</h4>
        <button id="atkBtn" class="game-btn" style="width:100%">⚔️ ANGRIFF</button>
    </div>`;
    document.getElementById("atkBtn").onclick = () => attack();
}

// --- TRIGGER ---
if (window.__AUTH_READY__) {
    startFullGame();
} else {
    document.addEventListener("auth-ready", startFullGame);
    setTimeout(startFullGame, 3000);
}
