import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";

let playerPos = 0;
let currentRounds = 1;
let inFight = false;
let monster = null;
let shopOpen = false;

function log(msg) {
    const logContent = document.getElementById("logContent");
    if (logContent) {
        logContent.innerHTML = `> ${msg}<br>` + logContent.innerHTML;
    }
}

async function startFullGame() {
    log("Lade Profil...");
    await loadMeta();
    updateHud();
    renderBoard();
    setFightPanelIdle();
    setInterval(gameLoop, 800);
}

function updateHud() {
    const el = document.getElementById("statusPanel");
    if (!el) return;
    el.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
            <div>❤️ HP: ${meta.hp}/${meta.maxHpBase} | 💰 Gold: ${meta.gold}</div>
            <button onclick="logout()" style="background:none; border:none; color:grey; font-size:10px;">Logout</button>
        </div>
    `;
}

function renderBoard() {
    const b = document.getElementById("board");
    if (!b) return;
    b.innerHTML = "";
    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.className = "tile";
        t.style.background = i === playerPos ? "#444" : "#222";
        t.innerHTML = i === playerPos ? "🧍" : "";
        b.appendChild(t);
    }
}

function setFightPanelIdle() {
    const fp = document.getElementById("fightPanel");
    if (fp) fp.innerHTML = `<button onclick="move()" class="game-btn">👣 LAUFEN</button>`;
}

window.move = async () => {
    if (inFight) return;
    playerPos++;
    if (playerPos >= 30) { playerPos = 0; currentRounds++; }
    
    if (Math.random() < 0.3) {
        spawnMonster();
    } else {
        renderBoard();
        updateHud();
    }
};

function spawnMonster() {
    monster = { name: "Monster", hp: 10 + currentRounds, atk: 2, gold: 10 };
    inFight = true;
    document.getElementById("fightPanel").innerHTML = `
        <div class="container" style="border:1px solid red;">
            👾 ${monster.name} (HP: ${monster.hp})<br>
            <button onclick="attack()" class="game-btn" style="background:red;">⚔️ ANGRIFF</button>
        </div>
    `;
}

window.attack = async () => {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.gold += monster.gold;
        inFight = false;
        log("Sieg!");
        await saveMeta();
        updateHud();
        setFightPanelIdle();
        renderBoard();
    } else {
        meta.hp -= monster.atk;
        updateHud();
        if (meta.hp <= 0) { log("Tod!"); meta.hp = meta.maxHpBase; }
    }
};

function gameLoop() {
    if (meta.autoLevel > 0 && !inFight) window.move();
}

auth.onAuthStateChanged((user) => {
    if (user) {
        startFullGame();
    } else {
        document.getElementById("logContent").innerHTML = "Bitte einloggen...";
    }
});
