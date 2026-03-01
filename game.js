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
    
    updateHud(); renderShop(); renderBoard(); setFightPanelIdle();
    try { await renderLeaderboard(); } catch(e) {}
    
    // Musik bei erstem Klick
    document.body.addEventListener('click', () => { bgMusic.play().catch(()=>{}); }, {once:true});
    setInterval(gameLoop, 600);
}

function updateHud() {
    const statusPanel = document.getElementById("statusPanel");
    if (!statusPanel) return;
    statusPanel.innerHTML = `
        <h3>📊 Status</h3>
        <p>❤️ HP: ${meta.hp}/${meta.maxHpBase} | 💰 Gold: ${meta.gold}</p>
        <p>⚔️ Kraft: ${meta.attackPower} | 🌊 Welle: ${currentRounds}</p>
        <p>🤖 Auto: ${meta.autoUnlocked ? "AN" : "AUS (Boss 1 fehlt)"}</p>
    `;
}

function renderShop() {
    const shop = document.getElementById("shop");
    if (!shop) return;
    shop.innerHTML = `
        <h3>🏪 Shop</h3>
        <button onclick="window.buy('atk')">⚔️ +10 ATK (${meta.atkPrice}G)</button>
        <button onclick="window.buy('hp')">❤️ +10 MaxHP (${meta.hpPrice}G)</button>
        <button onclick="window.buy('heal')">🧪 Heilung (50G)</button>
        <button onclick="window.buy('potAtk')">⚡ +5 ATK Trank (10G)</button>
        <button onclick="window.buy('potHP')">💎 +10 HP Trank (10G)</button>
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

function gameLoop() {
    if (!meta.autoUnlocked) return;
    if (inFight) {
        if (monster && monster.name !== "Drache") attack();
    } else {
        if (!(currentRounds % 10 === 0 && playerPos === 28)) move();
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
        meta.hp = meta.maxHpBase; playerPos = 0; currentRounds = 1; inFight = false; monster = null;
        alert("Besiegt!");
    }
    await saveMeta(); updateHud(); if(inFight) renderFight();
}

function renderBoard() {
    const b = document.getElementById("board"); if(!b) return;
    b.innerHTML = "";
    for(let i=0; i<30; i++) {
        const t = document.createElement("div"); t.className = "tile";
        t.innerHTML = i === playerPos ? "🧍" : (i === 29 ? "🏁" : "⬜");
        b.appendChild(t);
    }
}

function setFightPanelIdle() { document.getElementById("fightPanel").innerHTML = "🌿 Friedlich..."; }
function renderFight() {
    document.getElementById("fightPanel").innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:40px;">${monster.icon}</div>
            <p>${monster.name} (HP: ${monster.hp})</p>
            <button onclick="window.manualAtk()" class="game-btn">⚔️ SCHLAGEN</button>
        </div>`;
}
window.manualAtk = () => attack();

if (window.__AUTH_READY__) startFullGame();
else { document.addEventListener("auth-ready", startFullGame); setTimeout(startFullGame, 3000); }
