import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

// --- SPIEL-VARIABLEN ---
let playerPos = 0;
let currentRounds = 1;
let inFight = false;
let monster = null;

const monsterTypes = [
    { name: "Frosch", icon: "🐸", hp: 30, atk: 5, gold: 15 },
    { name: "Wolf", icon: "🐺", hp: 60, atk: 12, gold: 35 },
    { name: "Bär", icon: "🐻", hp: 120, atk: 25, gold: 75 }
];

// --- INITIALISIERUNG ---
async function startFullGame() {
    if (window.__GAME_RUNNING__) return;
    window.__GAME_RUNNING__ = true;

    if (auth.currentUser) {
        await loadMeta();
        document.getElementById("topBar").style.display = "flex";
    }

    // Standardwerte für Preise setzen, falls sie in der DB fehlen
    if (meta.atkPrice === undefined) meta.atkPrice = 100;
    if (meta.hpPrice === undefined) meta.hpPrice = 100;
    if (meta.autoUnlocked === undefined) meta.autoUnlocked = false;

    updateHud();
    renderShop();
    renderBoard();
    setFightPanelIdle();
    
    try { await renderLeaderboard(); } catch(e) {}

    startHeartbeat();
}

// --- STATUS PANEL ---
function updateHud() {
    const statusPanel = document.getElementById("statusPanel");
    const autoStatus = meta.autoUnlocked ? "✅ Aktiviert" : "🔒 Besiege Boss 1 (Welle 10)";
    
    statusPanel.innerHTML = `
        <h3>📊 Helden-Status</h3>
        <p>❤️ HP: <b>${meta.hp} / ${meta.maxHpBase}</b></p>
        <p>💰 Gold: <b>${meta.gold}</b> | ⚔️ Kraft: <b>${meta.attackPower}</b></p>
        <hr>
        <p>🌊 Welle: <b>${currentRounds}</b> | 📍 Feld: <b>${playerPos + 1}</b></p>
        <p>🤖 Auto: ${autoStatus}</p>
        <p>💀 Kills: ${meta.monstersKilled || 0} | 👑 Bosse: ${meta.bossesKilled || 0}</p>
    `;
}

// --- SHOP (Preissystem & Tränke) ---
function renderShop() {
    const shop = document.getElementById("shop");
    shop.innerHTML = `
        <h3>🏪 Marktplatz</h3>
        <div style="display: grid; gap: 5px;">
            <button id="buyAtk" class="game-btn">⚔️ +10 Kraft (Price: ${meta.atkPrice} G)</button>
            <button id="buyMaxHp" class="game-btn">❤️ +10 Max HP (Price: ${meta.hpPrice} G)</button>
            <hr>
            <button id="buyHeal" class="game-btn">🧪 Heiltrank +10 HP (50 G)</button>
            <button id="potionAtk" class="game-btn">⚡ Kraft-Elexier +5 (10 G)</button>
            <button id="potionHP" class="game-btn">💎 Vital-Elexier +10 (10 G)</button>
        </div>
    `;

    // Permanente Upgrades (+5 Gold Preiserhöhung)
    document.getElementById("buyAtk").onclick = async () => {
        if (meta.gold >= meta.atkPrice) {
            meta.gold -= meta.atkPrice;
            meta.attackPower += 10;
            meta.atkPrice += 5;
            await saveMeta(); updateHud(); renderShop();
        }
    };

    document.getElementById("buyMaxHp").onclick = async () => {
        if (meta.gold >= meta.hpPrice) {
            meta.gold -= meta.hpPrice;
            meta.maxHpBase += 10;
            meta.hp += 10;
            meta.hpPrice += 5;
            await saveMeta(); updateHud(); renderShop();
        }
    };

    // Tränke (Feste Preise)
    document.getElementById("buyHeal").onclick = async () => {
        if (meta.gold >= 50) {
            meta.gold -= 50;
            meta.hp = Math.min(meta.maxHpBase, meta.hp + 10);
            await saveMeta(); updateHud();
        }
    };

    document.getElementById("potionAtk").onclick = async () => {
        if (meta.gold >= 10) {
            meta.gold -= 10;
            meta.attackPower += 5;
            await saveMeta(); updateHud();
        }
    };

    document.getElementById("potionHP").onclick = async () => {
        if (meta.gold >= 10) {
            meta.gold -= 10;
            meta.maxHpBase += 10;
            meta.hp += 10;
            await saveMeta(); updateHud();
        }
    };
}

// --- KAMPF & BOSS ---
function checkTile() {
    // Boss alle 10 Wellen auf dem letzten Feld
    if (currentRounds % 10 === 0 && playerPos === 29) {
        const bossBonus = meta.bossesKilled * 1000;
        monster = { 
            name: "Drache", 
            icon: "🐲", 
            hp: 1000 + bossBonus, 
            atk: 30 + (meta.bossesKilled * 10), 
            gold: 1000 
        };
        inFight = true;
        renderFight();
    } 
    else if (Math.random() < 0.30 && playerPos !== 0) {
        const randomM = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        monster = { ...randomM, hp: randomM.hp + (currentRounds * 2) };
        inFight = true;
        renderFight();
    }
}

async function attack() {
    if (!inFight || !monster) return;
    monster.hp -= meta.attackPower;
    
    if (monster.hp <= 0) {
        inFight = false;
        meta.gold += monster.gold;
        if (monster.name === "Drache") {
            meta.bossesKilled++;
            if (!meta.autoUnlocked) {
                meta.autoUnlocked = true;
                alert("AUTOMATIK FREIGESCHALTET!");
            }
        } else { meta.monstersKilled++; }
        monster = null;
        await saveMeta(); updateHud(); setFightPanelIdle();
        return;
    }

    meta.hp -= monster.atk;
    if (meta.hp <= 0) {
        alert("💀 BESIEGT! Gold & Kraft bleiben erhalten.");
        meta.hp = meta.maxHpBase;
        playerPos = 0; currentRounds = 1; inFight = false; monster = null;
    }
    await saveMeta(); updateHud(); if (inFight) renderFight();
}

// --- CORE LOOPS ---
async function move() {
    if (inFight) return;
    playerPos++;
    if (playerPos >= 30) { playerPos = 0; currentRounds++; }
    renderBoard(); updateHud(); setFightPanelIdle(); checkTile();
}

function startHeartbeat() {
    setInterval(() => {
        if (meta.autoUnlocked) {
            if (inFight) {
                if (monster && monster.name !== "Drache") attack();
            } else {
                const isBossNext = (currentRounds % 10 === 0 && playerPos === 28);
                if (!isBossNext) move();
            }
        }
    }, 600);
}

function renderBoard() {
    const b = document.getElementById("board"); b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div"); t.className = "tile";
        t.innerHTML = i === playerPos ? "🧍" : (i === 29 ? "🏁" : "⬜");
        b.appendChild(t);
    }
}

function setFightPanelIdle() {
    document.getElementById("fightPanel").innerHTML = `<p style="text-align:center; padding:15px; opacity:0.6;">🌿 Feld ${playerPos+1}</p>`;
}

function renderFight() {
    const fp = document.getElementById("fightPanel");
    fp.innerHTML = `
        <div style="text-align: center; padding: 10px; border: 2px solid #555;">
            <div style="font-size: 40px;">${monster.icon}</div>
            <h4>${monster.name} (HP: ${monster.hp})</h4>
            <button id="atkBtn" class="game-btn" style="width:100%">⚔️ ANGRIFF</button>
        </div>`;
    document.getElementById("atkBtn").onclick = () => attack();
}

if (window.__AUTH_READY__) startFullGame();
else {
    document.addEventListener("auth-ready", startFullGame);
    setTimeout(startFullGame, 3000);
}
