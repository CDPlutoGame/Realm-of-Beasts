import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";
import { renderLeaderboard } from "./ranking.js";

let playerPos = 0; let currentRounds = 1; let inFight = false; let monster = null;
let shopOpen = false;

// Sound-System
let volumeLevel = 2; // 0 = Mute, 1 = Leise, 2 = Laut
const hitSound = new Audio("sounds/hit.mp3");
const bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;

function updateVolume() {
    const vols = [0, 0.2, 0.6]; // Lautstärken
    bgMusic.volume = vols[volumeLevel];
    hitSound.volume = vols[volumeLevel];
}

window.toggleSound = () => {
    volumeLevel = (volumeLevel + 1) % 3;
    updateVolume();
    updateHud();
    if (volumeLevel > 0) bgMusic.play().catch(()=>{});
};

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
    
    if (!meta.maxHpBase || meta.maxHpBase === 100) meta.maxHpBase = 30;
    if (!meta.hp || meta.hp > meta.maxHpBase) meta.hp = meta.maxHpBase;
    if (!meta.attackPower || meta.attackPower === 10) meta.attackPower = 5;
    
    if (!meta.atkPrice) meta.atkPrice = 100;
    if (!meta.hpPrice) meta.hpPrice = 100;
    if (!meta.autoPrice) meta.autoPrice = 1000;
    if (meta.autoLevel === undefined) meta.autoLevel = 0;

    updateVolume();
    updateHud(); renderShop(); renderBoard(); setFightPanelIdle();
    try { await renderLeaderboard(); } catch(e) {}
    
    document.body.addEventListener('click', () => { bgMusic.play().catch(()=>{}); }, {once:true});
    setInterval(gameLoop, 600);
}

function updateHud() {
    const statusPanel = document.getElementById("statusPanel");
    if (!statusPanel) return;
    
    const soundIcons = ["🔇", "🔉", "🔊"];
    
    statusPanel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <h3 style="margin:0;">📊 Status</h3>
                <p style="margin:2px 0;">❤️ HP: ${meta.hp}/${meta.maxHpBase} | 💰 Gold: ${meta.gold}</p>
                <p style="margin:2px 0;">⚔️ Kraft: ${meta.attackPower} | 🌊 Welle: ${currentRounds}</p>
            </div>
            <div style="text-align:right;">
                <button onclick="window.toggleSound()" class="game-btn" style="background:#444; margin-bottom:5px; padding:5px 10px;">${soundIcons[volumeLevel]}</button><br>
                <span style="color:${meta.autoLevel > 0 ? 'lime' : 'orange'}; font-weight:bold; font-size:0.8em;">
                    ${meta.autoLevel > 0 ? '🤖 AUTO Lv.' + meta.autoLevel : '🔒 MANUELL'}
                </span>
            </div>
        </div>
    `;
}

function renderShop() {
    const shop = document.getElementById("shop");
    if (!shop) return;
    if (!shopOpen) {
        shop.innerHTML = `<h3 style="margin:0; color:#888; font-size:
