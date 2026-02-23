// =======================================
// 🎮 REALM OF BEASTS - CLEAN VERSION
// =======================================

(function () {

  // ===============================
  // 🔊 SOUND
  // ===============================
  const HIT_SOUND = "music/hit.mp3";
  let soundUnlocked = false;

  function unlockSound() {
    soundUnlocked = true;
  }

  function playHitSound() {
    if (!soundUnlocked) return;
    const audio = new Audio(HIT_SOUND);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  }

  document.addEventListener("click", unlockSound, { once: true });


  // ===============================
  // 👤 LOGIN
  // ===============================
  function getPlayerName() {
    return localStorage.getItem("playerName");
  }

  function askName() {
    const name = prompt("Bitte gib deinen Namen ein:");
    if (!name) return askName();
    localStorage.setItem("playerName", name.trim());
    location.reload();
  }

  let playerName = getPlayerName();
  if (!playerName) {
    askName();
    return;
  }

  document.getElementById("playerName").innerHTML =
    "👤 Spieler: <b>" + playerName + "</b>";


  // ===============================
  // 🎲 GAME STATE
  // ===============================
  let hp = 30;
  let maxHp = 30;
  let gold = 0;
  let round = 0;
  let inFight = false;
  let monsterHp = 0;
  let monsterAtk = 0;

  const container = document.getElementById("gameContainer");

  // ===============================
  // 🎨 RENDER
  // ===============================
  function render() {
    container.innerHTML = `
      <div style="margin-bottom:15px;">
        ❤️ HP: ${hp}/${maxHp} |
        💰 Gold: ${gold} |
        🏁 Runde: ${round}
      </div>

      <button id="spinBtn">🎲 Drehen</button>
      <button id="attackBtn" ${inFight ? "" : "disabled"}>⚔️ Angreifen</button>
      <button id="healBtn">🧪 Heilen (10 Gold)</button>

      <div style="margin-top:20px;" id="log"></div>
    `;

    document.getElementById("spinBtn").onclick = spin;
    document.getElementById("attackBtn").onclick = attack;
    document.getElementById("healBtn").onclick = heal;
  }

  function log(text) {
    document.getElementById("log").innerHTML = text;
  }

  // ===============================
  // 🎲 SPIN
  // ===============================
  function spin() {
    if (inFight) return;

    round++;

    if (Math.random() < 0.6) {
      startFight();
    } else {
      const loot = Math.floor(Math.random() * 15) + 5;
      gold += loot;
      log("💰 Du findest " + loot + " Gold!");
    }

    render();
  }

  // ===============================
  // 👹 FIGHT
  // ===============================
  function startFight() {
    inFight = true;
    monsterHp = Math.floor(Math.random() * 20) + 15;
    monsterAtk = Math.floor(Math.random() * 6) + 3;

    log("👹 Monster erscheint! HP: " + monsterHp);
  }

  function attack() {
    if (!inFight) return;

    const playerDmg = Math.floor(Math.random() * 8) + 5;
    monsterHp -= playerDmg;

    playHitSound();

    if (monsterHp <= 0) {
      const reward = Math.floor(Math.random() * 20) + 10;
      gold += reward;
      inFight = false;
      log("✅ Monster besiegt! +" + reward + " Gold");
      render();
      return;
    }

    const enemyDmg = Math.floor(Math.random() * monsterAtk) + 1;
    hp -= enemyDmg;

    if (hp <= 0) {
      hp = 0;
      render();
      return gameOver();
    }

    log(
      "⚔️ Du machst " + playerDmg +
      " Schaden.<br>💥 Monster macht " + enemyDmg + " Schaden."
    );

    render();
  }

  // ===============================
  // 🧪 HEAL
  // ===============================
  function heal() {
    if (gold < 10) {
      log("❌ Nicht genug Gold!");
      return;
    }

    if (hp >= maxHp) {
      log("❤️ Schon volle HP!");
      return;
    }

    gold -= 10;
    hp = Math.min(maxHp, hp + 10);
    log("🧪 Du heilst dich um 10 HP.");
    render();
  }

  // ===============================
  // 💀 GAME OVER
  // ===============================
  function gameOver() {
    inFight = false;

    log("💀 GAME OVER<br>Runde erreicht: " + round);

    // Online Ranking senden
    if (window.__ONLINE_RANKING__) {
      window.__ONLINE_RANKING__.submitScore({
        name: playerName,
        rounds: round,
        gold: gold
      }).catch(() => {});
    }

    setTimeout(() => {
      round = 0;
      hp = maxHp;
      gold = 0;
      render();
      log("🔄 Neue Runde gestartet!");
    }, 3000);
  }

  // ===============================
  // START
  // ===============================
  render();

})();