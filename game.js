import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

let playerPos = 0; let currentRounds = 1; let inFight = false; let monster = null;
const hitSound = new Audio("sounds/hit.mp3");
const bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;

const monsterTypes = {
    frog: { name: "Frosch", icon: "🐸", hp: 30, atk: 5, gold: 15 },
    wolf: { name: "Wolf", icon: "🐺", hp: 60, atk: 12, gold: 35 },
    bear: { name: "Bär", icon: "🐻", hp: 120, atk: 25, gold: 75 }
};

// Log-Funktion
function log(msg) {
    const logContent = document.getElementById("logContent");
    if (logContent) {
        logContent.innerHTML = `> ${msg}<br>` + logContent.innerHTML;
        const lines = logContent.innerHTML.split("<br>");
        if (lines.length > 8) logContent.innerHTML = lines.slice(0, 8).join("<br>");
    }
}

async function startFullGame() {
    if (window.__STARTED__) return; window.__STARTED__ = true;
    if (auth.currentUser) { await loadMeta(); }
    
    if (meta.atkPrice === undefined) meta.atkPrice = 100;
    if (meta.hpPrice === undefined) meta.hpPrice = 100;

    updateHud(); renderShop(); renderBoard(); setFightPanelIdle();
    try { await renderLeaderboard(); } catch(e) {}
    
    document.body.addEventListener('click', () => { bgMusic.play().catch(()=>{}); }, {once:true});
    setInterval(gameLoop, 600);
}

function updateHud() {
    const statusPanel = document.getElementById("statusPanel");
    if (!statusPanel) return;
    statusPanel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3 style="margin:0;">📊 Status</h3>
                <p style="margin:2px 0;">❤️ HP: ${meta.hp}/${meta.maxHpBase} | 💰 Gold: ${meta.gold}</p>
                <p style="margin:2px 0;">⚔️ Kraft: ${meta.attackPower} | 🌊 Welle: ${currentRounds}</p>
            </div>
            <div style="text-align:right;">
                <span style="color:${meta.autoUnlocked ? 'lime' : 'orange'}; font-weight:bold;">
                    ${meta.autoUnlocked ? '🤖 AUTO' : '🔒 MANUELL'}
                </span>
            </div>
        </div>
    `;
}

function renderShop() {
    const shop = document.getElementById("shop");
    if (!shop) return;
    shop.innerHTML = `
        <h3 style="margin-top:0;">🏪 Shop</h3>
        <div style="display:flex; flex-wrap:wrap; gap:5px;">
            <button onclick="window.buy('atk')" class="game-btn">⚔️ +10 Kraft (${meta.atkPrice}G)</button>
            <button onclick="window.buy('hp')" class="game-btn">❤️ +10 MaxHP (${meta.hpPrice}G)</button>
            <button onclick="window.buy('heal')" class="game-btn">🧪 Heilung (50G)</button>
            <button onclick="window.buy('potAtk')" class="game-btn">⚡ +5 Kraft (10G)</button>
            <button onclick="window.buy('potHP')" class="game-btn">💎 +10 MaxHP (10G)</button>
        </div>
    `;
}

window.buy = async (type) => {
    if (type === 'atk' && meta.gold >= meta.atkPrice) { 
        meta.gold -= meta.atkPrice; meta.attackPower += 10; meta.atkPrice += 5; 
        log("⚔️ Kraft permanent gesteigert!");
    }
    else if (type === 'hp' && meta.gold >= meta.hpPrice) { 
        meta.gold -= meta.hpPrice; meta.maxHpBase += 10; meta.hp += 10; meta.hpPrice += 5; 
        log("❤️ Max HP permanent gesteigert!");
    }
    else if (type === 'heal' && meta.gold >= 50) { 
        meta.gold -= 50; meta.hp = meta.maxHpBase; 
        log("🧪 Du fühlst dich erfrischt!");
    }
    else if (type === 'potAtk' && meta.gold >= 10) { 
        meta.gold -= 10; meta.attackPower += 5; 
        log("⚡ Trank gibt dir +5 Kraft!");
    }
    else if (type === 'potHP' && meta.gold >= 10) { 
        meta.gold -= 10; meta.maxHpBase += 10; meta.hp += 10; 
        log("💎 Trank gibt dir +10 Max HP!");
    }
    await saveMeta(); updateHud(); renderShop();
};

function gameLoop() {
    if (!meta.autoUnlocked) return;
    if (inFight) {
        if (monster && monster.name !== "Drache") attack();
    } else {
        const isBossNext = (currentRounds % 10 === 0 && playerPos === 28);
        if (!isBossNext) move();
    }
}

async function move() {
    if (inFight) return;
    playerPos++;
    if (playerPos >= 30) { playerPos = 0; currentRounds++; log(`🌊 Welle ${currentRounds} beginnt!`); }
    renderBoard(); updateHud();
    if (currentRounds % 10 === 0 && playerPos === 29) spawnBoss();
    else if (Math.random() < 0.3 && playerPos !== 0) spawnMonster();
}

window.manualMove = () => { if (!inFight) move(); };

function spawnMonster() {
    let pool = [];
    if (currentRounds <= 10) pool = [monsterTypes.frog];
    else if (currentRounds <= 14) pool = [monsterTypes.frog, monsterTypes.wolf];
    else if (currentRounds <= 20) pool = [monsterTypes.wolf];
    else if (currentRounds === 21) pool = [monsterTypes.wolf, monsterTypes.bear];
    else pool = [monsterTypes.bear];

    const m = pool[Math.floor(Math.random() * pool.length)];
    monster = {...m, hp: m.hp + (currentRounds * 2)}; 
    inFight = true; 
    log(`⚠️ Ein ${monster.name} taucht auf!`);
    renderFight();
}

function spawnBoss() {
    monster = { name: "Drache", icon: "🐲", hp: 1000 + (meta.bossesKilled*1000), atk: 30 + (meta.bossesKilled*10), gold: 1000 };
    inFight = true; 
    log("🔥 EIN DRACHE BLOCKIERT DEN WEG!");
    renderFight();
}

async function attack() {
    if (!inFight || !monster) return;
    hitSound.play().catch(()=>{});
    
    // Spieler schlägt
    monster.hp -= meta.attackPower;
    log(`Du triffst ${monster.name} für ${meta.attackPower}.`);
    
    if (monster.hp <= 0) {
        log(`💀 ${monster.name} besiegt! +${monster.gold} Gold.`);
        inFight = false; meta.gold += monster.gold;
        if (monster.name === "Drache") { meta.bossesKilled++; meta.autoUnlocked = true; log("👑 AUTO-MODUS FREIGESCHALTET!"); }
        else meta.monstersKilled++;
        monster = null; await saveMeta(); updateHud(); setFightPanelIdle(); return;
    }
    
    // Monster schlägt zurück
    meta.hp -= monster.atk;
    log(`💥 ${monster.name} trifft dich für ${monster.atk}!`);
    
    if (meta.hp <= 0) {
        log("💀 Du bist gefallen! Zurück zum Start.");
        meta.hp = meta.maxHpBase; playerPos = 0; currentRounds = 1; inFight = false; monster = null;
        setFightPanelIdle();
    }
    await saveMeta(); updateHud(); if(inFight) renderFight();
}

function renderBoard() {
    const b = document.getElementById("board"); if(!b) return;
    b.innerHTML = "";
    for(let i=0; i<30; i++) {
        const t = document.createElement("div"); t.className = "tile";
        t.style.backgroundColor = i === playerPos ? "#444" : "#222";
        t.innerHTML = i === playerPos ? "🧍" : (i === 29 ? "🐲" : "");
        b.appendChild(t);
    }
}

function setFightPanelIdle() { 
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    fp.innerHTML = `
        <div style="height:150px; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); border-radius:10px;">
            ${!meta.autoUnlocked ? '<button onclick="window.manualMove()" class="game-btn" style="width:70%; padding:20px; font-size:1.5em; background:#4a90e2;">👣 LAUFEN</button>' : '<p style="color:lime;">🤖 Erkundung läuft...</p>'}
        </div>`; 
}

function renderFight() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    fp.innerHTML = `
        <div style="text-align:center; background:rgba(0,0,0,0.7); min-height:150px; padding:15px; border-radius:10px; border: 2px solid #b32020; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <div style="font-size:50px;">${monster.icon}</div>
            <p style="color:white; margin:5px 0;">${monster.name} (HP: ${monster.hp})</p>
            <button onclick="window.manualAtk()" class="game-btn" style="width:80%; padding:15px; font-size:1.2em; background:#ff4d4d;">⚔️ ANGRIFF</button>
        </div>`;
}

window.manualAtk = () => attack();

if (window.__AUTH_READY__) startFullGame();
else { document.addEventListener("auth-ready", startFullGame); setTimeout(startFullGame, 3000); }
