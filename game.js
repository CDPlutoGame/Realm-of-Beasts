window.onerror = function (msg, src, line, col, err) {
  alert("JS ERROR:\n" + msg + "\nZeile: " + line);
};

console.log("GAME STARTET");

import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";

// ===== Monster Browser Game (ONLINE) =====
(async() => {

  console.log("🚀 game.js gestartet");

  if (window.__MBR_LOADED__) return;
  window.__MBR_LOADED__ = true;

  // ---------------- GAME STATE ----------------
  let playerName = "";
  let rounds = 0;
  let playerHp = 30;
  let playerPos = 0;
  let inFight = false;
  let runOver = false;
  let tiles = [];
  let monster = null;
  let monstersKilled = 0;
  let bossesKilled = 0;
  let autoTimer = null;

  // ---------------- SETTINGS ----------------
  const boardSize = 30;
  const ENEMY_BUFF_EVERY = 2;
  const POTION_HEAL = 5;
  const POTION_COST = 5;
  const HEAL10_AMOUNT = 10;
  const HEAL10_COST = 50;
  const MAXHP_UPGRADE_AMOUNT = 5;
  const MAXHP_PRICE_INCREASE = 50;
  const ATK_UPGRADE_AMOUNT = 5;
  const ATK_PRICE_INCREASE = 5;

  // ---------------- HELPERS ----------------
  function ensureEl(id, tag = "div", parent = document.body) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      el.id = id;
      parent.appendChild(el);
    }
    return el;
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  // ---------------- UI ROOT ----------------
  const statusPanel = document.getElementById("statusPanel");
  const hudEl = ensureEl("hud", "div", statusPanel);
  const shopEl = document.getElementById("shop");
  const controlsRow = document.getElementById("controlsRow");
  const spinButton = ensureEl("spinButton", "button", controlsRow);
  spinButton.textContent = "Drehen";
  const attackButton = ensureEl("attackButton", "button", controlsRow);
  attackButton.textContent = "Angreifen";
  const usePotionButton = ensureEl("usePotionButton", "button", controlsRow);
  usePotionButton.textContent = "Trank (+5 HP)";
  const newRoundButton = ensureEl("newRoundButton", "button", controlsRow);
  newRoundButton.textContent = "Neue Runde";
  const fightPanel = document.getElementById("fightPanel");
  const logEl = document.getElementById("log");
  const boardEl = document.getElementById("board");
  const leaderboardEl = document.getElementById("leaderboard");

  function safeLog(text){
    if (!logEl) return;
    logEl.textContent += String(text) + "\n";
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ---------------- SOUND ----------------
  const bgMusic = new Audio();
  let soundMuted = false;
  
  // ---------------- AUTO SYSTEM ----------------
  function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; }
  function startAuto() {
    if (meta.autoStage <= 0) return;
    stopAuto();
    autoTimer = setInterval(() => {
      if (runOver) return stopAuto();
      if (inFight && monster) { attack(); return; }
      if (!inFight) { spin(); }
      if (rounds > 0 && rounds % 10 === 0 && inFight) { stopAuto(); }
    }, 400);
  }

  // ---------------- BOARD ----------------
  function pickMonsterTypeByRound() {
    if (rounds >= 25) return "monster_hard";
    if (rounds >= 12) return Math.random() < 0.55 ? "monster_medium" : "monster_hard";
    return "monster_easy";
  }
  function generateBoard() {
    tiles = [];
    for (let i = 0; i < boardSize; i++) {
      if (i === 0) { tiles.push("start"); continue; }
      const r = Math.random();
      if (r < 0.12) tiles.push("loot");
      else if (r < 0.47) tiles.push(pickMonsterTypeByRound());
      else tiles.push("normal");
    }
  }
  function renderBoard() {
    boardEl.innerHTML = "";
    for (let i = 0; i < boardSize; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      let icon = tiles[i] === "loot" ? "💰" : (tiles[i] === "start" ? "🏁" : "⬜");
      if (tiles[i].startsWith("monster")) icon = "👾";
      tile.innerHTML = `<span class="tileNum">${i + 1}</span><span class="tileIcon">${i === playerPos ? "🧍" : icon}</span>`;
      if (i === playerPos) tile.classList.add("player");
      boardEl.appendChild(tile);
    }
  }

  // ---------------- HUD & SHOP ----------------
  function updateHud() {
    hudEl.innerHTML = `<b>📊 Status</b><br>👤 Account: <b>${playerName || "Gast"}</b><br>❤️ HP: <b>${playerHp}/${meta.maxHpBase}</b><br>💰 Gold: <b>${meta.gold}</b><br>⚔️ Kraft: <b>${meta.attackPower}</b>`;
    usePotionButton.disabled = !(meta.potions > 0 && playerHp < meta.maxHpBase);
  }

  async function renderShop() {
    shopEl.innerHTML = `<b>🏪 Shop</b><br><button id="buyHeal">Heilung (50 Gold)</button>`;
    document.getElementById("buyHeal").onclick = async () => {
        if (meta.gold >= 50) { meta.gold -= 50; playerHp = meta.maxHpBase; await saveMeta(); updateHud(); }
    };
  }

  // ---------------- COMBAT ----------------
  function attack() {
    if (!inFight || !monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) { 
        inFight = false; monster = null; meta.gold += 20; 
        spinButton.disabled = false; attackButton.disabled = true;
        updateHud(); setFightPanelIdle(); return; 
    }
    playerHp -= monster.atk;
    if (playerHp <= 0) { runOver = true; stopAuto(); safeLog("💀 Game Over!"); newRoundButton.disabled = false; }
    updateHud(); renderFightPanel();
  }

  function setFightPanelIdle() { fightPanel.innerHTML = "🛡️ Kein Kampf"; }
  function renderFightPanel() { if(monster) fightPanel.innerHTML = `👾 ${monster.name} HP: ${monster.hp}`; }

  async function spin() {
    const steps = Math.floor(Math.random() * 6) + 1;
    playerPos = (playerPos + steps) % boardSize;
    if (playerPos < steps) rounds++;
    renderBoard();
    if (tiles[playerPos].startsWith("monster")) {
        inFight = true; monster = {name: "Monster", hp: 50, atk: 5};
        spinButton.disabled = true; attackButton.disabled = false;
        renderFightPanel();
    }
    updateHud();
  }

  // ---------------- INITIALISIERUNG ----------------
  const startMyGame = async () => {
    if (window.__GAME_STARTED_FINAL__) return;
    window.__GAME_STARTED_FINAL__ = true;
    
    try {
      if (auth && auth.currentUser) { await loadMeta(); playerName = auth.currentUser.email.split("@")[0]; }
      generateBoard();
      renderBoard();
      updateHud();
      await renderShop();
      setFightPanelIdle();
      safeLog("✅ Spiel bereit!");
    } catch (e) {
      console.error(e);
      generateBoard(); renderBoard();
    }
  };

  // Start-Sicherungs-System
  if (window.__AUTH_READY__ === true) {
    startMyGame();
  } else {
    document.addEventListener("auth-ready", startMyGame, { once: true });
    setTimeout(startMyGame, 4000); // Zwingt Start nach 4 Sek
  }

  spinButton.onclick = spin;
  attackButton.onclick = attack;
  newRoundButton.onclick = () => { location.reload(); };

})();
