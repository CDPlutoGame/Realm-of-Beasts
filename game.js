/** * REALM OF BEAAASTS - FINALE GAME LOGIC
 */

let meta = { hp: 100, maxHpBase: 100, gold: 0, attackPower: 5 };
let playerPos = 0;
let inFight = false;
let monster = null;

// --- LADEN & SPEICHERN ---
function loadData() {
    const m = localStorage.getItem("game_meta");
    if (m) meta = JSON.parse(m);
    playerPos = parseInt(localStorage.getItem("game_pos")) || 0;
}

function saveData() {
    localStorage.setItem("game_meta", JSON.stringify(meta));
    localStorage.setItem("game_pos", playerPos);
}

// --- SPIEL-FUNKTIONEN ---
function log(msg) {
    const lc = document.getElementById("logContent");
    if (lc) lc.innerHTML = `> ${msg}<br>` + lc.innerHTML;
}

function renderBoard() {
    const b = document.getElementById("board");
    if (!b) return;
    b.style.display = "grid";
    b.style.gridTemplateColumns = "repeat(10, 1fr)";
    b.style.gap = "4px";
    b.innerHTML = "";

    for (let i = 0; i < 30; i++) {
        const t = document.createElement("div");
        t.style.height = "30px";
        t.style.background = i === playerPos ? "#555" : "#222";
        t.style.border = "1px solid #333";
        t.style.display = "flex";
        t.style.alignItems = "center";
        t.style.justifyContent = "center";
        t.innerHTML = i === playerPos ? "🧍" : "";
        b.appendChild(t);
    }
}

function setActionBtn() {
    const fp = document.getElementById("fightPanel");
    if (!fp) return;
    if (inFight) {
        fp.innerHTML = `
            <div style="border:1px solid red; padding:10px; margin-top:10px;">
                👾 Monster (HP: ${monster.hp})<br>
                <button onclick="attack()" class="game-btn" style="background:red; width:100%;">⚔️ ANGRIFF</button>
            </div>`;
    } else {
        fp.innerHTML = `<button onclick="move()" class="game-btn" style="background:#3b82f6; width:100%; margin-top:10px;">👣 LAUFEN</button>`;
    }
}

window.move = () => {
    if (inFight) return;
    playerPos = (playerPos + 1) % 30;
    if (Math.random() < 0.3) {
        monster = { hp: 15, atk: 5, gold: 10 };
        inFight = true;
        log("Ein wildes Beast erscheint!");
    }
    renderBoard();
    setActionBtn();
    saveData();
};

window.attack = () => {
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        log("Sieg! +10 Gold.");
        meta.gold += 10;
        inFight = false;
    } else {
        meta.hp -= monster.atk;
        log(`Monster schlägt zu! HP: ${meta.hp}`);
        if (meta.hp <= 0) {
            log("Besiegt! Erholung...");
            meta.hp = meta.maxHpBase;
            playerPos = 0;
            inFight = false;
        }
    }
    renderBoard();
    setActionBtn();
    saveData();
};

// --- START ---
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem("playerName")) {
        loadData();
        renderBoard();
        setActionBtn();
    }
});
