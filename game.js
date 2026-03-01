import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

let playerPos = 0; let currentRounds = 1; let inFight = false; let monster = null;
const hitSound = new Audio("sounds/hit.mp3");
const bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;

const monsterTypes = {
    frog: { name: "Frosch", icon: "🐸", hp: 15, atk: 5, gold: 15 },
    wolf: { name: "Wolf", icon: "🐺", hp: 20, atk: 10, gold: 35 },
    bear: { name: "Bär", icon: "🐻", hp: 25, atk: 15, gold: 75 }
};

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
    
    // Initialisierung der Startwerte (30 HP, 5 Kraft)
    if (meta.hp === undefined || meta.hp === 100) meta.hp = 30;
    if (meta.maxHpBase === undefined || meta.maxHpBase === 100) meta.maxHpBase = 30;
    if (meta.attackPower === undefined || meta.attackPower === 10) meta.attackPower = 5;
    
    // Shop-Preise Initialisierung
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
    // Monster Leben skaliert pro Welle um +5
    monster = {...m, hp: m.hp + ((currentRounds - 1) * 5)}; 
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
    
    monster.hp -= meta.attackPower;
    log(`Du triffst ${monster.name} für ${meta.attackPower}.`);
    
    if (monster.hp <= 0) {
        log(`💀 ${monster.name} besiegt! +${monster.gold} Gold.`);
        inFight = false; meta.gold += monster.gold;
        if (monster.name === "Drache") { meta.bossesKilled++; meta.autoUnlocked = true; log("👑 AUTO-MODUS FREIGESCHALTET!"); }
        else meta.monstersKilled++;
        monster = null; await saveMeta(); updateHud(); setFightPanelIdle(); return;
    }
    
    meta.hp -= monster.atk;
    log(`💥 ${monster.name} trifft dich für ${monster.atk}!`);
    
    if (meta.hp <= 0) {
        log("💀 Du bist gefallen!");
        meta.hp = meta.maxHpBase; playerPos = 0; currentRounds = 1; inFight = false; monster = null;
        setFightPanelIdle();
    }
    await saveMeta(); updateHud(); if(inFight) renderFight();
}

function renderBoard() {
    const
