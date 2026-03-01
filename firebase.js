import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

// --- SPIEL-VARIABLEN ---
let playerPos = 0;
let currentRounds = 1;
let inFight = false;
let monster = null;
let autoInterval = null;

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

    // Sicherstellen, dass Unlock-Variable existiert
    if (meta.autoUnlocked === undefined) meta.autoUnlocked = false;

    updateHud();
    renderShop();
    renderBoard();
    setFightPanelIdle();
    
    try { await renderLeaderboard(); } catch(e) {}

    // Starte Schleife (prüft ob Auto aktiv sein darf)
    startHeartbeat();
}

// --- STATUS PANEL ---
function updateHud() {
    const statusPanel = document.getElementById("statusPanel");
    const autoStatus = meta.autoUnlocked ? "✅ Aktiviert" : "🔒 Besiege Boss 1 zum Freischalten";
    
    statusPanel.innerHTML = `
        <h3>📊 Helden-Status</h3>
        <p>❤️ HP: <b>${meta.hp} / ${meta.maxHpBase}</b></p>
        <p>💰 Gold: <b>${meta.gold}</b> | ⚔️ Kraft: <b>${meta.attackPower}</b></p>
        <hr>
        <p>🌊 Welle: <b>${currentRounds}</b> | 📍 Feld: <b>${playerPos + 1}</b></p>
        <p>🤖 Auto-System: <br><small>${autoStatus}</small></p>
        <p>💀 Kills: <b>${meta.monstersKilled || 0}</b> | 👑 Bosse: <b>${meta.bossesKilled || 0}</b></p>
    `;
}

// --- MONSTER & BOSS SPAWN ---
function checkTile() {
    // BOSS LOGIK: Erscheint exakt in Welle 10 (und 20, 30...) auf Feld 30
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
    // Normale Monster-Chance auf anderen Feldern
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
            // ERSTER BOSS SIEG SCHALTET AUTO FREI
            if (!meta.autoUnlocked) {
                meta.autoUnlocked = true;
                alert("🎊 LEGENDÄR! Du hast den Drachen besiegt und das AUTOMATIK-SYSTEM freigeschaltet!");
            }
        } else {
            meta.monstersKilled++;
        }
        
        monster = null;
        await saveMeta();
        updateHud();
        setFightPanelIdle();
        return;
    }

    meta.hp -= monster.atk;
    
    if (meta.hp <= 0) {
        alert("💀 BESIEGT! Zurück zum Start. (Auto-System bleibt erhalten)");
        meta.hp = meta.maxHpBase;
        playerPos = 0;
        currentRounds = 1;
        inFight = false;
        monster = null;
    }
    
    await saveMeta();
    updateHud();
    if (inFight) renderFight();
}

// --- BEWEGUNG ---
async function move() {
    if (inFight) return;
    playerPos++;
    if (playerPos >= 30) {
        playerPos = 0;
        currentRounds++;
    }
    renderBoard();
    updateHud();
    setFightPanelIdle();
    checkTile();
}

// --- AUTO-LOGIK ---
function startHeartbeat() {
    setInterval(() => {
        // Auto-System läuft nur wenn:
        // 1. Freigeschaltet
        // 2. Kein Boss-Kampf aktiv (bei Bossen muss man selbst drücken)
        if (meta.autoUnlocked) {
            if (inFight) {
                // Stoppe Auto-Angriff wenn es ein Drache ist
                if (monster && monster.name !== "Drache") {
                    attack();
                }
            } else {
                // Laufe nur automatisch, wenn wir NICHT vor einem Boss stehen (Feld 29 in Welle 10)
                const isBossNext = (currentRounds % 10 === 0 && playerPos === 28);
                if (!isBossNext) {
                    move();
                }
            }
        }
    }, 600);
}

// --- UI / SHOP (Preise: 5 Gold) ---
function renderShop() {
    const shop = document.getElementById("shop");
    shop.innerHTML = `
        <h3>🏪 Marktplatz</h3>
        <button id="buyAtk" class="game-btn">⚔️ +10 Kraft (5 G)</button>
        <button id="buyMaxHp" class="game-btn">❤️ +10 Max HP (5 G)</button>
        <button id="buyHeal" class="game-btn">🧪 Heilung (5 G)</button>
        <p style="font-size: 0.7em; margin-top:5px;">Preise bleiben immer bei 5 Gold!</p>
    `;
    document.getElementById("buyAtk").onclick = async () => { if(meta.gold >= 5){ meta.gold -= 5; meta.attackPower += 10; await saveMeta(); updateHud(); } };
    document.getElementById("buyMaxHp").onclick = async () => { if(meta.gold >= 5){ meta.gold -= 5; meta.maxHpBase += 10; meta.hp += 10; await saveMeta(); updateHud(); } };
    document.getElementById("buyHeal").onclick = async () => { if(meta.gold >= 5){ meta.gold -= 5; meta.hp = meta.maxHpBase; await saveMeta(); updateHud(); } };
}

function renderBoard() {
    const b = document.getElementById("board"); b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div"); t.className = "tile";
        t.innerHTML = i === playerPos ? "🧍" : (i === 29 ? "🐲" : "⬜");
        b.appendChild(t);
    }
}

function setFightPanelIdle() {
    document.getElementById("fightPanel").innerHTML = `<p style="text-align:center; padding:20px;">🌿 Feld ${playerPos+1} - Sicher</p>`;
}

function renderFight() {
    const fp = document.getElementById("fightPanel");
    fp.innerHTML = `
        <div style="text-align: center; padding: 10px; border: 2px solid red;">
            <div style="font-size: 40px;">${monster.icon}</div>
            <h4>${monster.name} (HP: ${monster.hp})</h4>
            <button id="atkBtn" class="game-btn" style="width:100%; padding:10px;">⚔️ MANUELLER ANGRIFF</button>
        </div>`;
    document.getElementById("atkBtn").onclick = () => attack();
}

// --- START ---
if (window.__AUTH_READY__) startFullGame();
else {
    document.addEventListener("auth-ready", startFullGame);
    setTimeout(startFullGame, 3000);
}
