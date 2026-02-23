// ===== Monster Browser Game (ONLINE) - stable + SOUND + mobile safe =====
(() => {
  if (window.__MBR_LOADED__) return;
  window.__MBR_LOADED__ = true;

  // ---------------- SETTINGS ----------------
  const boardSize = 30;
  const ENEMY_BUFF_EVERY = 2;
  const ENEMY_HP_BUFF = 5;
  const ENEMY_ATK_BUFF = 2;
  const AUTO_BASE_COST = 1000;
  const AUTO_STEP_COST = 500;

  const PROFILES_KEY = "mbr_profiles_online_v10";
  const CURRENT_NAME_KEY = "mbr_current_name_online_v10";

  const POTION_HEAL = 5;
  const POTION_COST = 5;
  const HEAL10_AMOUNT = 10;
  const HEAL10_COST = 50;
  const MAXHP_UPGRADE_AMOUNT = 5;
  const MAXHP_PRICE_INCREASE = 50;
  const ATK_UPGRADE_AMOUNT = 5;
  const ATK_PRICE_INCREASE = 5;

  const DEFAULT_META = {
    gold: 0,
    potions: 0,
    maxHpBase: 30,
    attackPower: 5,
    maxHpPrice: 100,
    attackPowerPrice: 100,
    bossesDefeated: 0,
    autoSpinStage: 0,
    autoAttackStage: 0,
  };

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

  // ---------------- STORAGE ----------------
  function loadProfiles() {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}"); }
    catch { return {}; }
  }
  function saveProfiles(p) { localStorage.setItem(PROFILES_KEY, JSON.stringify(p)); }
  function loadProfile(name) {
    const p = loadProfiles()[name];
    return p ? { ...DEFAULT_META, ...p } : { ...DEFAULT_META };
  }
  function saveProfile(name, meta) {
    const all = loadProfiles();
    all[name] = { ...meta };
    saveProfiles(all);
  }
  function loadAnyName() {
    return (
      (localStorage.getItem(CURRENT_NAME_KEY) || "").trim() ||
      (localStorage.getItem("mobileUser") || "").trim() ||
      (localStorage.getItem("pcUser") || "").trim() ||
      (localStorage.getItem("playerName") || "").trim()
    );
  }
  function persistIfNamed() {
    if (playerName) saveProfile(playerName, meta);
  }

  // ---------------- UI ROOT ----------------
  const app = ensureEl("app", "div", document.body);
  const statusPanel = ensureEl("statusPanel", "div", app);
  const rightCol = ensureEl("rightCol", "div", app);
  const mainArea = ensureEl("mainArea", "div", rightCol);
  const row1 = ensureEl("uiRow1", "div", rightCol);
  const hudWrapper = ensureEl("hudWrapper", "div", rightCol);
  const leftCol = ensureEl("leftCol", "div", mainArea);
  const fightPanel = ensureEl("fightPanel", "div", leftCol);
  const logEl = ensureEl("log", "pre", leftCol);
  const boardEl = ensureEl("board", "div", mainArea);

  const spinButton = ensureEl("spinButton", "button", row1);
  spinButton.textContent = "Drehen";

  const attackButton = ensureEl("attackButton", "button", row1);
  attackButton.textContent = "Angreifen";

  const usePotionButton = ensureEl("usePotionButton", "button", row1);
  usePotionButton.textContent = "Trank nutzen (+5 HP)";

  const newRoundButton = ensureEl("newRoundButton", "button", row1);
  newRoundButton.textContent = "Neue Runde";

  const hudEl = ensureEl("hud", "div", statusPanel);
  const shopEl = ensureEl("shop", "div", hudWrapper);
  const leaderboardEl = ensureEl("leaderboard", "div", rightCol);

  // Leaderboard sichtbar & scrollbar (sonst wirkt es wie “nur Platz 1”)
  leaderboardEl.style.maxHeight = "260px";
  leaderboardEl.style.overflowY = "auto";
  leaderboardEl.style.padding = "10px";
  leaderboardEl.style.borderRadius = "10px";
  leaderboardEl.style.background = "rgba(0,0,0,0.35)";
  leaderboardEl.style.border = "1px solid rgba(255,255,255,0.15)";

  function safeLog(msg) { logEl.textContent = String(msg ?? ""); }

  // ---------------- SOUND (tap-to-start, mobile safe) ----------------
  const MUSIC_LIST = ["sounds/music/bg1.mp3","sounds/music/bg2.mp3","sounds/music/bg3.mp3"];
  const SFX_HIT_SRC = "sounds/hit.mp3";

  const bgMusic = new Audio();
  bgMusic.preload = "auto";
  bgMusic.loop = false;

  let soundMuted = true;
  let baseVolume = 0.4;
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

  const audioBox = document.createElement("div");
  audioBox.style.position = "fixed";
  audioBox.style.left = "6px";
  audioBox.style.top = "6px";
  audioBox.style.zIndex = "10001";
  audioBox.style.background = "rgba(0,0,0,0.45)";
  audioBox.style.padding = "3px 5px";
  audioBox.style.borderRadius = "6px";
  audioBox.style.display = "flex";
  audioBox.style.alignItems = "center";
  audioBox.style.gap = "6px";
  audioBox.style.border = "1px solid rgba(255,255,255,0.1)";

  const soundBtn = document.createElement("button");
  soundBtn.type = "button";
  soundBtn.textContent = "🔇";
  soundBtn.style.padding = "2px 6px";
  soundBtn.style.borderRadius = "6px";

  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "1";
  volumeSlider.step = "0.01";
  volumeSlider.value = String(baseVolume);
  volumeSlider.style.width = "70px";

  audioBox.appendChild(soundBtn);
  audioBox.appendChild(volumeSlider);
  document.body.appendChild(audioBox);

  soundBtn.onclick = () => {
    soundMuted = !soundMuted;
    soundBtn.textContent = soundMuted ? "🔇" : "🔊";
    if (!soundMuted) playRandomMusic();
    else bgMusic.pause();
  };
  volumeSlider.addEventListener("input", () => {
    baseVolume = parseFloat(volumeSlider.value);
    bgMusic.volume = baseVolume;
  });
  document.addEventListener("pointerdown", () => {
    if (!soundMuted && bgMusic.paused) playRandomMusic();
  }, { once: true });

  // ---------------- ONLINE RANKING ----------------
  let __rankTries = 0;
  async function renderLeaderboard() {
    const TITLE = "🏆 Bestenliste (Top 3 – Online)";

    // ⭐ Best-Score (lokal, pro Gerät)
    let best = null;
    try { best = JSON.parse(localStorage.getItem("mbr_best_score") || "null"); } catch {}

    if (!window.__ONLINE_RANKING__) {
      __rankTries++;
      let html = `<b>${TITLE}</b><br>`;
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
      else leaderboardEl.innerHTML =
        `<b>${TITLE}</b><br>❌ Online Ranking nicht geladen.`;
      return;
    }

    let arr = [];
    try { arr = await window.__ONLINE_RANKING__.top10(); } catch { arr = []; }
    // Top 3 erzwingen
    arr = (arr || []).slice(0, 3);

    let html = `<b>${TITLE}</b><br>`;
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

  // ---------------- GAME STATE ----------------
  let playerName = "";
  let meta = { ...DEFAULT_META };
  let rounds = 0;
  let playerHp = 30;
  let playerPos = 0;
  let inFight = false;
  let runOver = false;
  let tiles = [];
  let monster = null;
  let monstersKilled = 0;
  let bossesKilled = 0;

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
      `👤 Account: <b>${playerName || "(nicht eingeloggt)"}</b><br>` +
      `🏁 Runde: <b>${rounds}</b><br>` +
      `📍 Feld: <b>${playerPos + 1}</b><br>` +
      `❤️ HP: <b>${playerHp}/${meta.maxHpBase}</b><br>` +
      `💰 Gold: <b>${meta.gold}</b><br>` +
      `🧪 Tränke: <b>${meta.potions}</b><br>` +
      `⚔️ Kraft: <b>${meta.attackPower}</b><br>` +
      `☠️ Monster: <b>${monstersKilled}</b><br>` +
      `👑 Bosse: <b>${bossesKilled}</b>`;
  }
  function refreshUsePotionButton() {
    usePotionButton.disabled = !(meta.potions > 0 && playerHp < meta.maxHpBase);
  }
  function renderShop() {
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

    document.getElementById("buyPotion").onclick = () => {
      if (!runOver) return safeLog("❌ Trank kaufen nur nach Game Over.");
      if (meta.gold < POTION_COST) return safeLog("❌ Zu wenig Gold.");
      meta.gold -= POTION_COST;
      meta.potions += 1;
      persistIfNamed();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`✅ Trank gekauft. Tränke: ${meta.potions}`);
    };

    document.getElementById("buyHeal10").onclick = () => {
      if (playerHp >= meta.maxHpBase) return safeLog("❤️ Schon voll.");
      if (meta.gold < HEAL10_COST) return safeLog("❌ Zu wenig Gold.");
      meta.gold -= HEAL10_COST;
      playerHp = Math.min(meta.maxHpBase, playerHp + HEAL10_AMOUNT);
      persistIfNamed();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog("✅ Sofort geheilt: +10 HP");
    };

    document.getElementById("buyMaxHp").onclick = () => {
      if (!runOver) return safeLog("❌ MaxHP kaufen nur nach Game Over.");
      if (meta.gold < meta.maxHpPrice) return safeLog("❌ Zu wenig Gold.");
      meta.gold -= meta.maxHpPrice;
      meta.maxHpBase += MAXHP_UPGRADE_AMOUNT;
      meta.maxHpPrice += MAXHP_PRICE_INCREASE;
      playerHp = meta.maxHpBase;
      persistIfNamed();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`✅ MaxHP +5 gekauft (Full Heal). Neuer Preis: ${meta.maxHpPrice}`);
    };

    document.getElementById("buyAtk").onclick = () => {
      if (!runOver) return safeLog("❌ Kraft kaufen nur nach Game Over.");
      if (meta.gold < meta.attackPowerPrice) return safeLog("❌ Zu wenig Gold.");
      meta.gold -= meta.attackPowerPrice;
      meta.attackPower += ATK_UPGRADE_AMOUNT;
      meta.attackPowerPrice += ATK_PRICE_INCREASE;
      persistIfNamed();
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
    btnSpin.onclick = () => {
      if (!canBuyAutoSpin) return safeLog("❌ Auto-Start: GameOver + Boss + Gold nötig.");
      meta.gold -= autoCost(nextSpinStage);
      meta.autoSpinStage = nextSpinStage;
      persistIfNamed();
      updateHud(); renderShop();
      safeLog(`✅ Auto-Start Stufe ${meta.autoSpinStage} gekauft!`);
    };

    btnAtk.disabled = !canBuyAutoAtk;
    btnAtk.textContent = `Auto-Attack Stufe ${nextAtkStage} — ${autoCost(nextAtkStage)} Gold`;
    btnAtk.onclick = () => {
      if (!canBuyAutoAtk) return safeLog("❌ Auto-Attack: GameOver + Boss + Gold nötig.");
      meta.gold -= autoCost(nextAtkStage);
      meta.autoAttackStage = nextAtkStage;
      persistIfNamed();
      updateHud(); renderShop();
      safeLog(`✅ Auto-Attack Stufe ${meta.autoAttackStage} gekauft!`);
    };
  }

  // ---------------- ENEMIES ----------------
  function enemyLevel() { return Math.floor(rounds / ENEMY_BUFF_EVERY); }
  function makeMonsterByType(type) {
    const lvl = enemyLevel();
    let base;
    if (type === "monster_easy") base = { kind:"mob", name:"Froschling", hp:10, atk:3, icon:"🐸" };
    else if (type === "monster_medium") base = { kind:"mob", name:"Wolfsjäger", hp:18, atk:5, icon:"🐺" };
    else base = { kind:"mob", name:"Bärenwächter", hp:30, atk:8, icon:"🐻" };

    const hp = base.hp + lvl * ENEMY_HP_BUFF;
    const atk = base.atk + lvl * ENEMY_ATK_BUFF;
    return { ...base, hp, maxHp: hp, atk };
  }
  function makeBossForRound(r) {
    const idx = Math.floor(r / 10);
    const hp = idx * 1000;
    return { kind:"boss", name:`DRACHENBOSS Runde ${r}`, hp, maxHp: hp, atk: 35 + idx * 10, icon:"🐉" };
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
      <div style="text-align:center;height:100%;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:${monster.kind === "boss" ? 62 : 52}px;line-height:1;">${monster.icon}</div>
        <div style="margin-top:6px;font-size:15px;font-weight:900">${monster.name}</div>
        <div style="margin:10px 0 6px; font-size:12px; opacity:.85;">HP: ${monster.hp}/${monster.maxHp}</div>
        <div style="height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(255,255,255,.12)">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#ff7a18,#ff4d6d);"></div>
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
  function endFightWin() {
    if (monster?.kind === "boss") bossesKilled += 1;
    else if (monster) monstersKilled += 1;

    inFight = false;

    const reward = monster.kind === "boss"
      ? Math.floor(Math.random() * 81) + 120
      : Math.floor(Math.random() * 16) + 10;

    if (monster?.kind === "boss") meta.bossesDefeated += 1;
    meta.gold += reward;
    persistIfNamed();

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

    const t = setInterval(() => {
      if (!window.__ONLINE_RANKING__) return;
      window.__ONLINE_RANKING__.submitScore(payload)
        .then(() => {
          localStorage.removeItem("mbr_pending_score");
          clearInterval(t);
          renderLeaderboard();
        })
        .catch(() => {});
    }, 500);

    monster = null;
    renderFightPanel();
    updateHud(); renderShop(); refreshUsePotionButton();
    renderLeaderboard();
    safeLog("💀 Game Over! Shop ist aktiv.");
  }

  function attack() {
    if (!inFight || !monster) return;

    const playerDmg = Math.max(1, meta.attackPower + (Math.floor(Math.random() * 5) - 2));
    monster.hp -= playerDmg;

    playHit(0.25);
    renderFightPanel();

    if (monster.hp <= 0) return endFightWin();

    const enemyDmg = Math.floor(Math.random() * monster.atk) + 1;
    playerHp -= enemyDmg;

    if (playerHp <= 0) {
      playerHp = 0;
      updateHud();
      return gameOver();
    }

    updateHud(); renderShop(); refreshUsePotionButton();
    safeLog(`⚔️ Du machst ${playerDmg} Schaden.\n💀 Gegner macht ${enemyDmg} Schaden.`);
  }

  function usePotion() {
    if (meta.potions <= 0) return;
    if (playerHp >= meta.maxHpBase) return safeLog("❤️ Schon voll.");

    meta.potions -= 1;
    playerHp = Math.min(meta.maxHpBase, playerHp + POTION_HEAL);
    persistIfNamed();

    updateHud(); renderShop(); refreshUsePotionButton();
    safeLog(`🧪 Trank genutzt: +5 HP. Übrig: ${meta.potions}`);
  }

  // ---------------- SPIN ----------------
  function spin() {
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

    if (String(t).startsWith("monster_")) {
      renderBoard();
      updateHud(); renderShop(); refreshUsePotionButton();
      safeLog(`⚔️ Kampf! Runde ${rounds}`);
      return startFight(makeMonsterByType(t));
    }

    if (t === "loot") {
      const g = Math.floor(Math.random() * 11) + 5;
      meta.gold += g;
      tiles[playerPos] = "normal";
      persistIfNamed();

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

    generateBoard();
    renderBoard();

    updateHud(); renderShop(); refreshUsePotionButton();
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

  function loadUserFromStorage() {
    const n = loadAnyName();
    playerName = n;
    meta = n ? loadProfile(n) : { ...DEFAULT_META };
    playerHp = meta.maxHpBase;
  }

  let __lastSeenName = "";
  function watchUserChange() {
    const n = loadAnyName();
    if (n !== __lastSeenName) {
      __lastSeenName = n;
      playerName = n;
      meta = n ? loadProfile(n) : { ...DEFAULT_META };
      resetRunKeepMeta().catch(()=>{});
      safeLog(n ? `✅ Eingeloggt als "${n}". Drück 'Drehen'.` : "🔒 Bitte anmelden.");
    }
  }

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
})();
