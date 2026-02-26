import { meta, loadMeta, saveMeta } from "./profile.js";
// ===== Monster Browser Game (ONLINE) =====
(async() => {
  
function loadAnyName() {
  return localStorage.getItem("mbr_current_name_online_v10");
}
  
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

  // ---------------- SETTINGS ----------------
  const boardSize = 30;
  const ENEMY_BUFF_EVERY = 2;
  const ENEMY_HP_BUFF = 5;
  const ENEMY_ATK_BUFF = 2;
  const AUTO_BASE_COST = 1000;
  const AUTO_STEP_COST = 500;

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
// ---------------- UI ROOT (aus index.html verwenden) ----------------
const app = document.getElementById("app");
const leftCol = document.getElementById("leftCol");
const rightCol = document.getElementById("rightCol");

const statusPanel = document.getElementById("statusPanel");
const hudEl = ensureEl("hud", "div", statusPanel); // hud darf JS erstellen (ist ok)
const shopEl = document.getElementById("shop");

const controlsPanel = document.getElementById("controlsPanel");
controlsPanel.classList.add("window");
const controlsRow = document.getElementById("controlsRow");

const spinButton = ensureEl("spinButton", "button", controlsRow);
spinButton.textContent = "Drehen";

const attackButton = ensureEl("attackButton", "button", controlsRow);
attackButton.textContent = "Angreifen";

const usePotionButton = ensureEl("usePotionButton", "button", controlsRow);
usePotionButton.textContent = "Trank nutzen (+5 HP)";

const newRoundButton = ensureEl("newRoundButton", "button", controlsRow);
newRoundButton.textContent = "Neue Runde";

const fightPanel = document.getElementById("fightPanel");
const logEl = document.getElementById("log");
  function safeLog(text){
  if (!logEl) return;
  logEl.textContent += String(text) + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}
const boardEl = document.getElementById("board");

const leaderboardPanel = document.getElementById("leaderboardPanel");
leaderboardPanel.classList.add("window");
const leaderboardEl = document.getElementById("leaderboard");
  
  // ---------------- SOUND (tap-to-start, mobile safe) ----------------
  const MUSIC_LIST = ["sounds/music/bg1.mp3","sounds/music/bg2.mp3","sounds/music/bg3.mp3"];
  const SFX_HIT_SRC = "sounds/hit.mp3";

  const bgMusic = new Audio();
  bgMusic.preload = "auto";
  bgMusic.loop = false;

  let soundMuted = false;
  let baseVolume = 0.1;
  let currentMusicIndex = -1;

  function pickNextRandomIndex(){
    if (MUSIC_LIST.length === 0) return -1;
    if (MUSIC_LIST.length === 1) return 0;
    let idx;
    do { idx = Math.floor(Math.random() * MUSIC_LIST.length); }
    while (idx === currentMusicIndex);
    return idx;
  }
  function playRandomMusic(){
    if (soundMuted) return;
    const idx = pickNextRandomIndex();
    if (idx < 0) return;
    currentMusicIndex = idx;
    bgMusic.src = MUSIC_LIST[idx];
    bgMusic.currentTime = 0;
    bgMusic.volume = baseVolume;
    bgMusic.muted = false;
    bgMusic.play().catch(()=>{});
  }
  bgMusic.addEventListener("ended", () => playRandomMusic());

  const hitAudio = new Audio(SFX_HIT_SRC);
  hitAudio.preload = "auto";
  function playHit(extra = 0.25){
    if (soundMuted) return;
    hitAudio.currentTime = 0;
    hitAudio.volume = Math.min(1, baseVolume + extra);
    hitAudio.play().catch(()=>{});
  }
document.addEventListener("pointerdown", () => {
  if (!soundMuted) {
    playRandomMusic();
  }
}, { once: true });

  // ---------------- ONLINE RANKING ----------------
let __rankTries = 0;

async function renderLeaderboard() {
  // Titel steht schon in index.html als <h3>...<h3>
  // -> hier NICHT nochmal ausgeben

  // ⭐ Best-Score (lokal)
  let best = null;
  try { best = JSON.parse(localStorage.getItem("mbr_best_score") || "null"); } catch {}

  if (!window.__ONLINE_RANKING__) {
    __rankTries++;

    let html = "";
    if (best) {
      html += `
        <div style="margin:8px 0 12px;padding:8px;border-radius:10px;background:rgba(255,255,255,.08)">
          <b>⭐ Dein Best Score:</b> ${best.name} — Runden: <b>${best.rounds}</b>
          | Monster: <b>${best.monstersKilled || 0}</b> | Bosse: <b>${best.bossesKilled || 0}</b>
        </div>
      `;
    }

    html += `⏳ Online Ranking startet... (${__rankTries})`;
    leaderboardEl.innerHTML = html;

    if (__rankTries < 60) setTimeout(renderLeaderboard, 250);
    else leaderboardEl.innerHTML = `❌ Online Ranking nicht geladen.`;

    return;
  }

  let arr = [];
  try { arr = await window.__ONLINE_RANKING__.top10(); } catch { arr = []; }
  arr = (arr || []).slice(0, 3);

  let html = "";
  if (best) {
    html += `
      <div style="margin:8px 0 12px;padding:8px;border-radius:10px;background:rgba(255,255,255,.08)">
        <b>⭐ Dein Best Score:</b> ${best.name} — Runden: <b>${best.rounds}</b>
        | Monster: <b>${best.monstersKilled || 0}</b> | Bosse: <b>${best.bossesKilled || 0}</b>
      </div>
    `;
  }

  if (!arr.length) {
    html += `Noch keine Einträge.`;
  } else {
    html += `<ol style="margin:10px 0 0 18px;padding:0;">`;
    for (const e of arr) {
      html += `<li><b>${e.name}</b> — Runden: <b>${e.rounds}</b> | Monster: <b>${e.monstersKilled || 0}</b> | Bosse: <b>${e.bossesKilled || 0}</b></li>`;
    }
    html += `</ol>`;
  }

  leaderboardEl.innerHTML = html;
}

  // ---------------- AUTO SYSTEM ----------------
  let autoSpinTimer = null;
  let autoAttackTimer = null;
  function autoCost(nextStage) {
    return AUTO_BASE_COST + (nextStage - 1) * AUTO_STEP_COST;
  }
  function currentBossIdx() { return Math.floor(rounds / 10); }
  function stopAutoSpin() { if (autoSpinTimer) clearInterval(autoSpinTimer); autoSpinTimer = null; }
  function stopAutoAttack() { if (autoAttackTimer) clearInterval(autoAttackTimer); autoAttackTimer = null; }
  function startAutoSpin() {
    stopAutoSpin();
    if (meta.autoSpinStage <= 0) return;
    const maxRounds = meta.autoSpinStage * 10;
    autoSpinTimer = setInterval(() => {
      if (runOver || inFight) return;
      if (rounds >= maxRounds) { stopAutoSpin(); return; }
      spin();
    }, 350);
  }
  function startAutoAttack() {
    stopAutoAttack();
    if (meta.autoAttackStage <= 0) return;
    autoAttackTimer = setInterval(() => {
      if (runOver) return;
      if (!inFight || !monster) return;
      if (currentBossIdx() > meta.autoAttackStage) { stopAutoAttack(); return; }
      attack();
    }, 450);
  }

  // ---------------- BOARD ----------------
  function pickMonsterTypeByRound() {
    if (rounds >= 25) return "monster_hard";
    if (rounds >= 12) return Math.random() < 0.55 ? "monster_medium" : "monster_hard";
    if (rounds >= 6)  return Math.random() < 0.6 ? "monster_medium" : "monster_easy";
    return "monster_easy";
  }
  function generateBoard() {
    tiles = [];
    const lootChance = 0.12;
    const monsterChance = 0.35;
    for (let i = 0; i < boardSize; i++) {
      if (i === 0) { tiles.push("start"); continue; }
      const r = Math.random();
      if (r < lootChance) tiles.push("loot");
      else if (r < lootChance + monsterChance) tiles.push(pickMonsterTypeByRound());
      else tiles.push("normal");
    }
  }
  function renderBoard() {
    boardEl.innerHTML = "";
    for (let i = 0; i < boardSize; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      const t = tiles[i];

      let icon = "";
      if (t === "monster_easy") icon = "🐸";
      else if (t === "monster_medium") icon = "🐺";
      else if (t === "monster_hard") icon = "🐻";
      else if (t === "loot") icon = "💰";
      else if (t === "start") icon = "🏁";

      tile.innerHTML = `
        <span class="tileNum">${i + 1}</span>
        <span class="tileIcon">${icon}</span>
      `;

      if (i === playerPos) {
        tile.classList.add("player");
        tile.querySelector(".tileIcon").textContent = "🧍";
      }
      boardEl.appendChild(tile);
    }
  }

  // ---------------- HUD + SHOP ----------------
function updateHud() {
  hudEl.innerHTML =
    `<b>📊 Status</b><br>` +
    `<span class="emoji">👤</span> Account: <b>${playerName || "(nicht eingeloggt)"}</b><br>` +
    `<span class="emoji">🏁</span> Runde: <b>${rounds}</b><br>` +
    `<span class="emoji">📍</span> Feld: <b>${playerPos + 1}</b><br>` +
    `<span class="emoji">❤️</span> HP: <b>${playerHp}/${meta.maxHpBase}</b><br>` +
    `<span class="emoji">💰</span> Gold: <b>${meta.gold}</b><br>` +
    `<span class="emoji">🧪</span> Tränke: <b>${meta.potions}</b><br>` +
    `<span class="emoji">⚔️</span> Kraft: <b>${meta.attackPower}</b><br>` +
    `<span class="emoji">☠️</span> Monster: <b>${monstersKilled}</b><br>` +
    `<span class="emoji">👑</span> Bosse: <b>${bossesKilled}</b>`;
}
  function refreshUsePotionButton() {
    usePotionButton.disabled = !(meta.potions > 0 && playerHp < meta.maxHpBase);
  }
  async function renderShop() {
    const isFullHp = playerHp >= meta.maxHpBase;
    const canBuyPotion = runOver && meta.gold >= POTION_COST;
    const canBuyMaxHp  = runOver && meta.gold >= meta.maxHpPrice;
    const canBuyAtk    = runOver && meta.gold >= meta.attackPowerPrice;
    const canBuyHeal10 = !isFullHp && meta.gold >= HEAL10_COST;

    shopEl.innerHTML = `
      <b>🏪 Shop</b><br>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:10px;">
        <button id="buyPotion" ${canBuyPotion ? "" : "disabled"}>Trank +5 — 5 Gold</button>
        <button id="buyHeal10" ${canBuyHeal10 ? "" : "disabled"}>Sofort +10 — 50 Gold</button>
        <button id="buyMaxHp" ${canBuyMaxHp ? "" : "disabled"}>Max HP +5 — ${meta.maxHpPrice} Gold</button>
        <button id="buyAtk" ${canBuyAtk ? "" : "disabled"}>Kraft +5 — ${meta.attackPowerPrice} Gold</button>
        <button id="buyAutoSpin">Auto-Start</button>
        <button id="buyAutoAttack">Auto-Attack</button>
      </div>
    `;

    document.getElementById("buyPotion").onclick = async () => {
      if (!runOver) return safeLog("❌ Trank kaufen nur nach Game Over.");
      if (meta.gold < POTION_COST) return safeLog("❌ Zu wenig Gold.");
      meta.gold -= POTION_COST;
      meta.potions += 1;
     await saveMeta();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`✅ Trank gekauft. Tränke: ${meta.potions}`);
    };

    document.getElementById("buyHeal10").onclick = async () => {
  if (playerHp >= meta.maxHpBase) return safeLog("❤️ Schon voll.");
  if (meta.gold < HEAL10_COST) return safeLog("❌ Zu wenig Gold.");

  meta.gold -= HEAL10_COST;
  playerHp = Math.min(meta.maxHpBase, playerHp + HEAL10_AMOUNT);

  await saveMeta();

  updateHud();
  renderShop();
  refreshUsePotionButton();
  safeLog("✅ Sofort geheilt: +10 HP");
};

    document.getElementById("buyMaxHp").onclick = async () => {
      if (!runOver) return safeLog("❌ MaxHP kaufen nur nach Game Over.");
      if (meta.gold < meta.maxHpPrice) return safeLog("❌ Zu wenig Gold.");
      meta.gold -= meta.maxHpPrice;
      meta.maxHpBase += MAXHP_UPGRADE_AMOUNT;
      meta.maxHpPrice += MAXHP_PRICE_INCREASE;
      playerHp = meta.maxHpBase;
     await saveMeta();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`✅ MaxHP +5 gekauft (Full Heal). Neuer Preis: ${meta.maxHpPrice}`);
    };

    document.getElementById("buyAtk").onclick = async () => {
      if (!runOver) return safeLog("❌ Kraft kaufen nur nach Game Over.");
      if (meta.gold < meta.attackPowerPrice) return safeLog("❌ Zu wenig Gold.");
      meta.gold -= meta.attackPowerPrice;
      meta.attackPower += ATK_UPGRADE_AMOUNT;
      meta.attackPowerPrice += ATK_PRICE_INCREASE;
     await saveMeta();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`✅ Kraft +5 gekauft. Neue Kraft: ${meta.attackPower}. Neuer Preis: ${meta.attackPowerPrice}`);
    };

    const nextSpinStage = meta.autoSpinStage + 1;
    const nextAtkStage  = meta.autoAttackStage + 1;
    const canBuyAutoSpin =
      runOver && (meta.bossesDefeated >= nextSpinStage) && (meta.gold >= autoCost(nextSpinStage));
    const canBuyAutoAtk =
      runOver && (meta.bossesDefeated >= nextAtkStage) && (meta.gold >= autoCost(nextAtkStage));

    const btnSpin = document.getElementById("buyAutoSpin");
    const btnAtk  = document.getElementById("buyAutoAttack");

    btnSpin.disabled = !canBuyAutoSpin;
    btnSpin.textContent = `Auto-Start Stufe ${nextSpinStage} — ${autoCost(nextSpinStage)} Gold`;
    btnSpin.onclick = async () => {
      if (!canBuyAutoSpin) return safeLog("❌ Auto-Start: GameOver + Boss + Gold nötig.");
      meta.gold -= autoCost(nextSpinStage);
      meta.autoSpinStage = nextSpinStage;
     await saveMeta();
      updateHud(); renderShop();
      safeLog(`✅ Auto-Start Stufe ${meta.autoSpinStage} gekauft!`);
    };

    btnAtk.disabled = !canBuyAutoAtk;
    btnAtk.textContent = `Auto-Attack Stufe ${nextAtkStage} — ${autoCost(nextAtkStage)} Gold`;
    btnAtk.onclick = async () => {
      if (!canBuyAutoAtk) return safeLog("❌ Auto-Attack: GameOver + Boss + Gold nötig.");
      meta.gold -= autoCost(nextAtkStage);
      meta.autoAttackStage = nextAtkStage;
     await saveMeta();
      updateHud(); renderShop();
      safeLog(`✅ Auto-Attack Stufe ${meta.autoAttackStage} gekauft!`);
    };
  }

  // ---------------- ENEMIES ----------------
  function enemyLevel() { 
  return Math.floor(rounds / ENEMY_BUFF_EVERY); 
}
function makeMonsterByType(type) {
  const lvl = enemyLevel();
  let base;

  if (type === "monster_easy") {
    base = { 
      kind: "mob",
      name: "Froschling",
      hp: 20,      // mehr Grund-Leben
      atk: 5,      // immer 5 Schaden
      icon: "🐸"
    };
  }
  else if (type === "monster_medium") {
    base = { 
      kind: "mob",
      name: "Wolfsjäger",
      hp: 50,
      atk: 12,
      icon: "🐺"
    };
  }
  else {
    base = { 
      kind: "mob",
      name: "Bärenwächter",
      hp: 100,
      atk: 20,
      icon: "🐻"
    };
  }

  // 🔥 klare Skalierung pro Level
  const hp = base.hp + lvl * 40;   // viel mehr Leben pro Stufe
  const atk = base.atk + lvl * 4;  // Schaden steigt langsam mit

  return { ...base, hp, maxHp: hp, atk };
}
  function makeBossForRound(r) {
  const idx = Math.floor(r / 10); // 1,2,3,...

  const hp = 800 + idx * 400;    // Mehr Leben, aber nicht explodierend
  const atk = idx * 20;          // 20 / 40 / 60 / 80 ...

  return { 
    kind: "boss",
    name: `DRACHENBOSS Runde ${r}`,
    hp: hp,
    maxHp: hp,
    atk: atk,
    icon: "🐉"
  };
}

  // ---------------- FIGHT PANEL ----------------
  function setFightPanelIdle() {
    fightPanel.innerHTML = `
      <div style="text-align:center;opacity:.9;height:100%;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:40px;">🛡️</div>
        <div style="margin-top:8px;font-weight:900;">Kein Kampf</div>
        <div style="margin-top:6px;opacity:.75;font-size:13px;">Dreh aufs Monster-Feld</div>
      </div>
    `;
  }
function renderFightPanel() {
  if (!monster) return setFightPanelIdle();

  const pct = clamp(Math.round((monster.hp / monster.maxHp) * 100), 0, 100);

  fightPanel.innerHTML = `
    <div style="height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:10px;">

      <!-- TOP INFO BAR -->
      <div style="display:flex;justify-content:space-between;font-size:13px;opacity:.85;">
        <div>
          🏁 Runde: <b>${rounds}</b><br>
          📍 Feld: <b>${playerPos + 1}</b>
        </div>
        <div style="text-align:right;">
          ❤️ HP: <b>${playerHp}/${meta.maxHpBase}</b>
        </div>
      </div>

      <!-- MONSTER -->
      <div style="text-align:center;">
        <div style="font-size:${monster.kind === "boss" ? 62 : 52}px;line-height:1;">
          ${monster.icon}
        </div>
        <div style="margin-top:6px;font-size:15px;font-weight:900">
          ${monster.name}
        </div>
        <div style="margin:10px 0 6px; font-size:12px; opacity:.85;">
          HP: ${monster.hp}/${monster.maxHp}
        </div>
        <div style="height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(255,255,255,.12)">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#ff7a18,#ff4d6d);"></div>
        </div>
      </div>

    </div>
  `;
}
  // ---------------- COMBAT ----------------
  function startFight(m) {
    inFight = true;
    monster = m;
    spinButton.disabled = true;
    attackButton.disabled = false;
    renderFightPanel();
    refreshUsePotionButton();
    if (meta.autoAttackStage > 0) startAutoAttack();
  }
async function endFightWin() {
    if (monster?.kind === "boss") bossesKilled += 1;
    else if (monster) monstersKilled += 1;

    inFight = false;

    const reward = monster.kind === "boss"
      ? Math.floor(Math.random() * 81) + 120
      : Math.floor(Math.random() * 16) + 10;

    if (monster?.kind === "boss") meta.bossesDefeated += 1;
    meta.gold += reward;
   await saveMeta();

    if (tiles[playerPos] && String(tiles[playerPos]).startsWith("monster_")) {
      tiles[playerPos] = "normal";
    }

    monster = null;
    spinButton.disabled = false;
    attackButton.disabled = true;

    renderBoard();
    renderFightPanel();
    updateHud(); renderShop(); refreshUsePotionButton();
    safeLog(`✅ Sieg! +${reward} Gold. Drück "Drehen".`);
  }

  function gameOver() {
    runOver = true;
    inFight = false;
    stopAutoSpin();
    stopAutoAttack();

    spinButton.disabled = true;
    attackButton.disabled = true;
    newRoundButton.disabled = false; // ✅ jetzt darf man neue Runde drücken

    const payload = {
      name: playerName || "Unknown",
      rounds,
      gold: meta.gold,
      hp: playerHp,
      monstersKilled,
      bossesKilled
    };

    // ⭐ Best-Score lokal (pro Gerät)
    let best = null;
    try { best = JSON.parse(localStorage.getItem("mbr_best_score") || "null"); } catch {}
    if (!best || safeNum(payload.rounds) > safeNum(best.rounds)) {
      localStorage.setItem("mbr_best_score", JSON.stringify(payload));
    }

    // Handy-safe: parken + retry
    localStorage.setItem("mbr_pending_score", JSON.stringify(payload));

const t = setInterval(async () => {
  if (!window.__ONLINE_RANKING__) return;

  try {
    const top = await window.__ONLINE_RANKING__.top10();

    // Spieler schon vorhanden?
    const existing = top.find(e => e.name === payload.name);

    // Wenn nicht vorhanden → speichern
    if (!existing) {
      await window.__ONLINE_RANKING__.submitScore(payload);
    } 
    // Wenn vorhanden → nur speichern wenn besser
    else if (payload.rounds > existing.rounds) {
      await window.__ONLINE_RANKING__.submitScore(payload);
    }

    localStorage.removeItem("mbr_pending_score");
    clearInterval(t);
    renderLeaderboard();
  } catch (err) {}
}, 500);

    monster = null;
    renderFightPanel();
    updateHud(); renderShop(); refreshUsePotionButton();
    renderLeaderboard();
    safeLog("💀 Game Over! Shop ist aktiv.");
  }

function attack() {
  if (!inFight || !monster) return;

  // ✅ Spieler macht festen Schaden
  const playerDmg = meta.attackPower;
  monster.hp -= playerDmg;

  playHit(0.25);
  renderFightPanel();

  if (monster.hp <= 0) return endFightWin();

  // ✅ Gegner macht festen Schaden
  const enemyDmg = monster.atk;
  playerHp -= enemyDmg;

  if (playerHp <= 0) {
    playerHp = 0;
    updateHud();
    return gameOver();
  }

  updateHud();
  renderShop();
  refreshUsePotionButton();

  safeLog(`⚔️ Du machst ${playerDmg} Schaden.\n💀 Gegner macht ${enemyDmg} Schaden.`);
}

  async function usePotion() {
    if (meta.potions <= 0) return;
    if (playerHp >= meta.maxHpBase) return safeLog("❤️ Schon voll.");

    meta.potions -= 1;
    playerHp = Math.min(meta.maxHpBase, playerHp + POTION_HEAL);
   await saveMeta();

    updateHud(); renderShop(); refreshUsePotionButton();
    safeLog(`🧪 Trank genutzt: +5 HP. Übrig: ${meta.potions}`);
  }

  // ---------------- SPIN ----------------
  async function spin() {
    if (!playerName) return safeLog("🔒 Bitte zuerst anmelden.");
    if (inFight) return;
    if (runOver) return safeLog("Game Over. Shop ist aktiv. Starte 'Neue Runde'.");

    const steps = Math.floor(Math.random() * 6) + 1;
    const newPos = playerPos + steps;
    const passedStart = newPos >= boardSize;

    playerPos = newPos % boardSize;

    if (passedStart) {
      rounds += 1;
      generateBoard();
    }

    if (passedStart && rounds > 0 && rounds % 10 === 0) {
      renderBoard();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`🐉 DRACHENBOSS! Runde ${rounds}`);
      return startFight(makeBossForRound(rounds));
    }

    const t = tiles[playerPos];

 if (t === "monster_easy" || 
    t === "monster_medium" || 
    t === "monster_hard") {
      renderBoard();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`⚔️ Kampf! Runde ${rounds}`);
      return startFight(makeMonsterByType(t));
    }

    if (t === "loot") {
      const g = Math.floor(Math.random() * 11) + 5;
      meta.gold += g;
      tiles[playerPos] = "normal";
     await saveMeta();

      renderBoard();
      updateHud(); renderShop(); refreshUsePotionButton();
      return safeLog(`💰 Loot! +${g} Gold. Runde ${rounds}`);
    }

    renderBoard();
    updateHud(); renderShop(); refreshUsePotionButton();
    safeLog(`🎲 Du drehst ${steps} Felder. Runde ${rounds}`);
  }

  // ---------------- RESET RUN ----------------
 async function resetRunKeepMeta() {
 
   // 🆕 Log löschen
  if (logEl) logEl.textContent = "";
   
  // ❌ Wenn Spiel noch läuft → nichts tun
  if (!runOver) {
    safeLog("❌ Du kannst nur nach Game Over eine neue Runde starten.");
    return;
  }

  rounds = 0;
  playerHp = meta.maxHpBase;
  playerPos = 0;
  inFight = false;
  runOver = false;
  monster = null;
  monstersKilled = 0;
  bossesKilled = 0;

  stopAutoSpin();
  stopAutoAttack();

  spinButton.disabled = false;
  attackButton.disabled = true;
  newRoundButton.disabled = true; // 🔒 sofort sperren

  generateBoard();
  renderBoard();
  updateHud();
  renderShop();
  refreshUsePotionButton();
  setFightPanelIdle();

  await renderLeaderboard();

  safeLog("✅ Neue Runde gestartet. Drück 'Drehen'.");

  if (meta.autoSpinStage > 0) startAutoSpin();
  if (meta.autoAttackStage > 0) startAutoAttack();
}

  // ---------------- HOOKS ----------------
  spinButton.onclick = spin;
  attackButton.onclick = attack;
  usePotionButton.onclick = usePotion;
  newRoundButton.onclick = resetRunKeepMeta;

  // ---------------- INIT ----------------
  attackButton.disabled = true;
  newRoundButton.disabled = true; // 🔒 Start gesperrt
  
  async function loadUserFromStorage() {
    const n = loadAnyName();
    playerName = n;
    playerHp = meta.maxHpBase;
  }

  let __lastSeenName = "";
  
 async function watchUserChange() {
    const n = loadAnyName();
    if (n !== __lastSeenName) {
      __lastSeenName = n;
      playerName = n;
     
      runOver = true;
      resetRunKeepMeta().catch(()=>{});
      safeLog(n ? `✅ Eingeloggt als "${n}". Drück 'Drehen'.` : "🔒 Bitte anmelden.");
    }
  }

await new Promise(resolve => {
  const unsub = window.auth.onAuthStateChanged(async (user) => {

    if (user) {
      await loadMeta();
    } else {
      await loadMeta(); // lädt DEFAULT_META
    }

    unsub();
    resolve();
  });
});

console.log("META GELADEN:", meta);

loadUserFromStorage();
__lastSeenName = playerName;

generateBoard();
renderBoard();
updateHud();
renderShop();
refreshUsePotionButton();
setFightPanelIdle();
renderLeaderboard();
safeLog(playerName ? `✅ Eingeloggt als "${playerName}". Drück 'Drehen'.` : "🔒 Bitte anmelden.");
setInterval(watchUserChange, 500);
  
  // ==================== 📜 MENÜ BUTTON ====================

const menuWrapper = document.createElement("div");
menuWrapper.style.position = "fixed";
menuWrapper.style.top = "10px";
menuWrapper.style.right = "10px";
menuWrapper.style.zIndex = "10005";

const menuButton = document.createElement("button");
menuButton.textContent = "📜";
menuButton.style.fontSize = "24px";
menuButton.style.padding = "8px 14px";
menuButton.style.borderRadius = "12px";
menuButton.style.cursor = "pointer";

const menuWindow = document.createElement("div");
menuWindow.style.position = "absolute";
menuWindow.style.top = "50px";
menuWindow.style.right = "0";
menuWindow.style.width = "220px";
menuWindow.style.padding = "15px";
menuWindow.style.borderRadius = "14px";
menuWindow.style.background = "rgba(0,0,0,0.95)";
menuWindow.style.border = "1px solid rgba(255,255,255,0.15)";
menuWindow.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";
menuWindow.style.display = "none";

menuWrapper.appendChild(menuButton);
menuWrapper.appendChild(menuWindow);
document.body.appendChild(menuWrapper);

let menuOpen = false;

menuButton.onclick = () => {
  menuOpen = !menuOpen;
  menuWindow.style.display = menuOpen ? "block" : "none";
  if (menuOpen) renderMenu();
};
menuWindow.style.border = "1px solid rgba(255,255,255,0.15)";
menuWindow.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";
menuWindow.style.display = "none";

function renderMenu() {
  if (!playerName) {
    menuWindow.innerHTML = `
      <button id="menuLogin" style="width:100%;margin-bottom:8px;">🔑 Login</button>
      <button id="menuSound" style="width:100%;">🔊 Sound</button>
    `;

    document.getElementById("menuLogin").onclick = () => {
      document.getElementById("loginOverlay").style.display = "flex";
      menuWindow.style.display = "none";
    };

  } else {
    menuWindow.innerHTML = `
      <button id="menuChangeName" style="width:100%;margin-bottom:8px;">✏️ Benutzername ändern</button>
      <button id="menuLogout" style="width:100%;margin-bottom:8px;">🚪 Logout</button>
      <button id="menuSound" style="width:100%;">🔊 Sound</button>
    `;

    document.getElementById("menuChangeName").onclick = () => {
      const overlay = document.getElementById("nameOverlay");
      const input = document.getElementById("nameInput");
      input.value = playerName || "";
      overlay.style.display = "flex";
      menuWindow.style.display = "none";
    };

    document.getElementById("menuLogout").onclick = async () => {
      await window.auth.signOut();
      menuWindow.style.display = "none";
    };
  }

  document.getElementById("menuSound").onclick = () => {
    soundMuted = !soundMuted;
    if (!soundMuted) playRandomMusic();
    else bgMusic.pause();
  };
}

// ==================== NAME OVERLAY LOGIK ====================

document.addEventListener("DOMContentLoaded", () => {

  const nameOverlay = document.getElementById("nameOverlay");
  const nameInput = document.getElementById("nameInput");
  const nameConfirm = document.getElementById("nameConfirm");
  const nameCancel = document.getElementById("nameCancel");
  const nameError = document.getElementById("nameError");

  if (!nameOverlay || !nameInput || !nameConfirm || !nameCancel || !nameError) {
    console.log("Name Overlay Elemente nicht gefunden");
    return;
  }

  nameCancel.addEventListener("click", () => {
    nameOverlay.style.display = "none";
    nameError.textContent = "";
  });

  nameConfirm.addEventListener("click", () => {
    const newName = nameInput.value.trim().slice(0, 24);

    if (!newName) {
      nameError.textContent = "Name darf nicht leer sein.";
      return;
    }

    localStorage.setItem("mbr_current_name_online_v10", newName);

    playerName = newName;
    updateHud();

    nameOverlay.style.display = "none";
    nameInput.value = "";
    nameError.textContent = "";

    safeLog("✏️ Neuer Name gespeichert: " + newName);
  });

});
})();
