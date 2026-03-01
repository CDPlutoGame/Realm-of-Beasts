import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

// --- SPIEL-ZUSTAND ---
let playerPos = 0;
let currentRounds = 1;
let inFight = false;
let monster = null;
let shopOpen = false;
let volumeLevel = 2; // 0=Mute, 1=Leise, 2=Laut

// --- AUDIO ---
const hitSound = new Audio("sounds/hit.mp3");
const bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;

const monsterTypes = {
    frog: { name: "Frosch", icon: "🐸", hp: 15, atk: 5, gold: 15 },
    wolf: { name: "Wolf", icon: "🐺", hp: 20, atk: 10, gold: 35 },
    bear: { name: "Bär", icon: "🐻", hp: 25, atk: 15, gold: 75 }
};

// --- HILFSFUNKTIONEN ---
function log(msg) {
    const logContent = document.getElementById("logContent");
    if (logContent) {
        logContent.innerHTML = `> ${msg}<br>` + logContent.innerHTML;
        const lines = logContent.innerHTML.split("<br>");
        if (lines.length > 8) logContent.innerHTML = lines.slice(0, 8).join("<br>");
    }
}

function updateVolume() {
    const vols = [0, 0.2, 0.6];
    bgMusic.volume = vols[volumeLevel];
    hitSound.volume = vols[volumeLevel];
}

window.toggleSound = () => {
    volumeLevel = (volumeLevel + 1) % 3;
    updateVolume();
    updateHud();
    if (volumeLevel > 0) bgMusic.play().catch(() => {});
};

// --- INITIALISIERUNG ---
async function startFullGame() {
    if (window.__STARTED__) return;
    window.__STARTED__ = true;

    log("Lade Profildaten...");
    if (auth.currentUser) { await loadMeta(); }

    // Standardwerte sicherstellen (Falls Firebase neu ist)
    if (!meta.maxHpBase || meta.maxHpBase === 100) meta.maxHpBase = 30;
    if (!meta.hp || meta.hp > meta.maxHpBase) meta.hp = meta.maxHpBase;
    if (!meta.attackPower || meta.attackPower === 10) meta.attackPower = 5;
    if (!meta.atkPrice) meta.atkPrice = 100;
    if (!meta.hpPrice) meta.hpPrice = 100;
    if (!meta.autoPrice) meta.autoPrice = 1000;
    if (meta.autoLevel === undefined) meta.autoLevel = 0;

    updateVolume();
    updateHud();
    renderShop();
    renderBoard();
    setFightPanelIdle();

    try {
        await renderLeaderboard();
    } catch (e) {
        console.warn("Ranking konnte nicht geladen werden.");
    }

    // Musik-Start bei erstem Klick
    document.body.addEventListener('click', () => {
        if (volumeLevel > 0) bgMusic.play().catch(() => {});
    }, { once: true });

    setInterval(gameLoop, 600);
}

// --- UI RENDERING ---
function updateHud() {
    const el = document.getElementById("statusPanel");
    if (!el) return;
    const icons = ["🔇", "🔉", "🔊"];
    el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h3 style="margin:0;">📊 Status</h3>
                <p style="margin:2px 0;">❤️ HP: ${meta.hp}/${meta.maxHpBase} | 💰 Gold: ${meta.gold}</p>
                <p style="margin:2px 0;">⚔️ Kraft: ${meta.attackPower} | 🌊 Welle: ${currentRounds}</p>
            </div>
            <div style="text-align:right;">
                <button onclick="window.toggleSound()" class="game-btn" style="background:#444; padding:5px 10px; margin-bottom:5px;">${icons[volumeLevel]}</button><br>
                <span style="color:${meta.autoLevel > 0 ? 'lime' : 'orange'}; font-weight:bold; font-size:0.8em;">
                    ${meta.autoLevel > 0 ? '🤖 AUTO Lv.' + meta.autoLevel : '🔒 MANUELL'}
                </span>
            </div>
        </div>
    `;
}

function renderShop() {
    const el = document.getElementById("shop");
    if (!el) return;
    if (!shopOpen) {
        el.innerHTML = `<h3 style="margin:0; color:#888; font-size:0.9em;">🏪 Shop (Nur nach Game Over verfügbar)</h3>`;
        return;
    }

    let autoBtn = meta.bossesKilled > 0 ? `<button onclick="window.buy('auto')" class="game-btn" style="background:#4caf50;">🤖 Auto (${meta.autoPrice}G)</button>` : "";

    el.innerHTML = `
        <h3 style="margin-top:0; color:lime;">🏪 Shop GEÖFFNET</h3>
        <div style="display:flex; flex-wrap:wrap; gap:5px;">
            <button onclick="window.buy('atk')" class="game-btn">⚔️ +10 Kraft (${meta.atkPrice}G)</button>
            <button onclick="window.buy('hp')" class="game-btn">❤️ +10 MaxHP (${meta.hpPrice}G)</button>
            <button onclick="window.buy('heal')" class="game-btn" style="background:#2196F3;">🧪 Heilung (50G)</button>
            ${autoBtn}
        </div>
    `;
}

window.buy = async (type) => {
    if (!shopOpen) return;
    if (type === 'atk' && meta.gold >= meta.atkPrice) {
        meta.gold -= meta.atkPrice; meta.attackPower += 10; meta.atkPrice += 5;
        log("⚔️ Kraft permanent gesteigert!");
    } else if (type === 'hp' && meta.gold >= meta.hpPrice) {
        meta.gold -= meta.hpPrice; meta.maxHpBase += 10; meta.hp += 10; meta.hpPrice += 5;
        log("❤️ Max HP permanent gesteigert!");
    } else if (type === 'heal' && meta.gold >= 50) {
        meta.gold -= 50; meta.hp = meta.maxHpBase;
        log("🧪 Vollständig geheilt!");
    } else if (type === 'auto' && meta.gold >= meta.autoPrice) {
        meta.gold -= meta.autoPrice; meta.autoLevel++; meta.autoPrice += 1000;
        log("🤖 Auto-System Upgrade!");
    }
    await saveMeta(); updateHud(); renderShop();
};

// --- GAME LOGIC ---
function gameLoop() {
    if (meta.autoLevel === 0 || shopOpen) return;
    if (inFight) {
        if (monster && monster.name !== "Drache") attack();
    } else {
        move();
    }
}

async function move() {
    if (inFight) return;
    if (shopOpen) {
        shopOpen = false;
        renderShop();
        log("🚪 Shop verlassen. Neuer Lauf beginnt!");
    }

    playerPos++;
    if (playerPos >= 30) {
        playerPos = 0;
        currentRounds++;
        log(`🌊 Welle ${currentRounds}!`);
    }

    renderBoard();
    updateHud();

    if (currentRounds % 10 === 0 && playerPos === 29) {
        spawnBoss();
    } else if (Math.random() < 0.3 && playerPos !== 0) {
        spawnMonster();
    }
}

window.manualMove = () => move();

function spawnMonster() {
    let pool = currentRounds <= 10 ? [monsterTypes.frog] : (currentRounds <= 20 ? [monsterTypes.wolf] : [monsterTypes.bear]);
    const m = pool[Math.floor(Math.random() * pool.length)];
    monster = { ...m, hp: m.hp + ((currentRounds - 1) * 5) };
    inFight = true;
    log(`⚠️ Ein ${monster.name} greift an!`);
    renderFight();
}

function spawnBoss() {
    monster = {
        name: "Drache", icon: "🐲",
        hp: 1000 + (meta.bossesKilled * 1000),
        atk: 30 + (meta.bossesKilled * 10),
        gold: 1000
    };
    inFight = true;
    log("🔥 DER DRACHE ERSCHEINT!");
    renderFight();
}

async function attack() {
    if (!inFight || !monster) return;
    if (volumeLevel > 0) hitSound.play().catch(() => {});

    monster.hp -= meta.attackPower;

    if (monster.hp <= 0) {
        log(`💀 ${monster.name} besiegt! +${monster.gold} Gold.`);
        inFight = false;
        meta.gold += monster.gold;
        if (monster.name === "Drache") meta.bossesKilled++;
        else meta.monstersKilled++;
        monster = null;
        await saveMeta();
        updateHud();
        renderShop();
        setFightPanelIdle();
        return;
    }

    meta.hp -= monster.atk;

    if (meta.hp <= 0) {
        log("💀 GAME OVER! Shop ist jetzt offen.");
        meta.hp = meta.maxHpBase;
        playerPos = 0;
        currentRounds = 1;
        inFight = false;
        monster = null;
        shopOpen = true;
        renderShop();
        setFightPanelIdle();
    }
    await saveMeta();
    updateHud();
    if (inFight) renderFight();
}

// --- BOARD & FIGHT UI ---
function renderBoard() {
    const b = document.getElementById("board");
    if (!b) return;
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.style.backgroundColor = i === playerPos ? "#444" : "#222";
        t.innerHTML = i === playerPos ? "🧍" : (i === 29 ? "🐲" : "");
        b.appendChild(t);
    }
}

function setFightPanelIdle() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    fp.innerHTML = `
        <div style="height:120px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:10px;">
            ${!meta.autoLevel || shopOpen ? '<button onclick="window.manualMove()" class="game-btn" style="width:80%; padding:15px; background:#4a90e2;">👣 LAUFEN</button>' : '<p style="color:lime;">🤖 Automatisch...</p>'}
        </div>`;
}

function renderFight() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    fp.innerHTML = `
        <div style="text-align:center; background:rgba(0,0,0,0.6); padding:10px; border-radius:10px; border:2px solid #b32020;">
            <div style="font-size:40px;">${monster.icon}</div>
            <p style="margin:5px 0;">${monster.name} (HP: ${monster.hp})</p>
            <button onclick="window.manualAtk()" class="game-btn" style="width:90%; background:#ff4d4d;">⚔️ ANGRIFF</button>
        </div>`;
}

window.manualAtk = () => attack();

// --- AUTH START ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await startFullGame();
    } else {
        log("Bitte einloggen...");
    }
});
