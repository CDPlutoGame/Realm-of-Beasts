import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

let playerPos = 0; let currentRounds = 1; let inFight = false; let monster = null;
const hitSound = new Audio("sounds/hit.mp3");
const bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;

const monsterTypes = [
    { name: "Frosch", icon: "🐸", hp: 30, atk: 5, gold: 15 },
    { name: "Wolf", icon: "🐺", hp: 60, atk: 12, gold: 35 },
    { name: "Bär", icon: "🐻", hp: 120, atk: 25, gold: 75 }
];

async function startFullGame() {
    if (window.__STARTED__) return; window.__STARTED__ = true;
    if (auth.currentUser) { await loadMeta(); document.getElementById("topBar").style.display = "flex"; }
    
    // Standardwerte setzen falls leer
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
            ${!meta.autoUnlocked ? '<button onclick="window.manualMove()" class="game-btn" style="width:auto; padding:10px 20px;">👣 LAUFEN</button>' : '<span style="color:lime;">🤖 AUTO</span>'}
        </div>
    `;
}

function renderShop() {
    const shop = document.getElementById("shop");
    if (!shop) return;
    shop.innerHTML = `
        <h3 style="margin-top:0;">🏪 Shop</h3>
        <div style="display:flex; flex-wrap:wrap; gap:5px;">
            <button onclick="window.buy('atk')" class="game-btn">⚔️ +10 ATK (${meta.atkPrice}G)</button>
            <button onclick="window.buy('hp')" class="game-btn">❤️ +10 MaxHP (${meta.hpPrice}G)</button>
            <button onclick="window.buy('heal')" class="game-btn">🧪 Heilung (50G)</button>
            <button onclick="window.buy('potAtk')" class="game-btn">⚡ +5 ATK (10G)</button>
            <button onclick="window.buy('potHP')" class="game-btn">💎 +10 HP (10G)</button>
        </div>
    `;
}

window.buy = async (type) => {
    if (type === 'atk' && meta.gold >= meta.atkPrice) { meta.gold -= meta.atkPrice; meta.attackPower += 10; meta.atkPrice += 5; }
    else if (type === 'hp' && meta.gold >= meta.hpPrice) { meta.gold -= meta.hpPrice; meta.maxHpBase += 10; meta.hp += 10; meta.hpPrice += 5; }
    else if (type === 'heal' && meta.gold >= 50) { meta.gold -= 50; meta.hp = meta.maxHpBase; }
    else if (type === 'potAtk' && meta.gold >= 10) { meta.gold -= 10; meta.attackPower += 5; }
    else if (type === 'potHP' && meta.gold >= 10) { meta.gold -= 10; meta.maxHpBase += 10; meta.hp += 10; }
    await saveMeta(); updateHud(); renderShop();
};

// MANUELLES LAUFEN (Der "Dreh"-Ersatz)
window.manualMove = () => {
    if (!inFight) move();
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
    if (playerPos >= 30) { playerPos = 0; currentRounds++; }
    renderBoard(); updateHud();
    if (currentRounds % 10 === 0 && playerPos === 29) spawnBoss();
    else if (Math.random() < 0.3 && playerPos !== 0) spawnMonster();
}

function spawnMonster() {
    const m = monsterTypes[Math.floor(Math.random()*monsterTypes.length)];
    monster = {...m, hp: m.hp + (currentRounds*2)}; inFight = true; renderFight();
}

function spawnBoss() {
    monster = { name: "Drache", icon: "🐲", hp: 1000 + (meta.bossesKilled*1000), atk: 30 + (meta.bossesKilled*10), gold: 1000 };
    inFight = true; renderFight();
}

async function attack() {
    if (!inFight || !monster) return;
    hitSound.play().catch(()=>{});
    monster.hp -= meta.attackPower;
    
    if (monster.hp <= 0) {
        inFight = false; meta.gold += monster.gold;
        if (monster.name === "Drache") { meta.bossesKilled++; meta.autoUnlocked = true; }
        else meta.monstersKilled++;
        monster = null; await saveMeta(); updateHud(); setFightPanelIdle(); return;
    }
    
    meta.hp -= monster.atk;
    if (meta.hp <= 0) {
        alert("Besiegt! Du fängst von vorne an, behältst aber deine Kraft.");
        meta.hp = meta.maxHpBase; playerPos = 0; currentRounds = 1; inFight = false; monster = null;
    }
    await saveMeta(); updateHud(); if(inFight) renderFight();
}

function renderBoard() {
    const b = document.getElementById("board"); if(!b) return;
    b.innerHTML = "";
    for(let i=0; i<30; i++) {
        const t = document.createElement("div"); t.className = "tile";
        t.style.border = i === playerPos ? "2px solid yellow" : "1px solid #444";
        t.innerHTML = i === playerPos ? "🧍" : (i === 29 ? "🐲" : "⬜");
        b.appendChild(t);
    }
}

function setFightPanelIdle() { 
    document.getElementById("fightPanel").innerHTML = `
        <div style="height:100%; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); border-radius:10px;">
            <p style="font-size:1.2em;">🌿 Der Weg ist sicher...</p>
        </div>`; 
}

function renderFight() {
    document.getElementById("fightPanel").innerHTML = `
        <div style="text-align:center; background:rgba(0,0,0,0.7); height:100%; padding:20px; border-radius:10px; border: 2px solid #b32020;">
            <div style="font-size:60px; margin-bottom:10px;">${monster.icon}</div>
            <h2 style="margin:0; color:#ff4d4d;">${monster.name}</h2>
            <p>Gegner Leben: <b>${monster.hp}</b></p>
            <button onclick="window.manualAtk()" class="game-btn" style="width:80%; padding:15px; font-size:1.2em; background:#ff4d4d;">⚔️ ANGRIFF</button>
        </div>`;
}

window.manualAtk = () => attack();

if (window.__AUTH_READY__) startFullGame();
else { document.addEventListener("auth-ready", startFullGame); setTimeout(startFullGame, 3000); }
