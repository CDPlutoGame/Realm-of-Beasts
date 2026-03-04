let meta = {
    playerName: "",
    hp: 20,
    maxHp: 20,
    money: 0,
    attackPower: 5
};

let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;

// Start
window.startGame = function () {
    const name = document.getElementById("playerNameInput").value.trim();
    if (!name) return alert("Bitte Namen eingeben!");

    meta.playerName = name;
    document.getElementById("loginOverlay").style.display = "none";

    generateBoard();
    updateUI();
    gameStarted = true;
};

// Board generieren
function generateBoard() {
    boardEvents = [];
    for (let i = 0; i < 30; i++) {
        if (Math.random() < 0.3) {
            boardEvents.push("monster");
        } else {
            boardEvents.push("empty");
        }
    }
    drawBoard();
}

// Board anzeigen
function drawBoard() {
    const board = document.getElementById("board");
    board.innerHTML = "";

    boardEvents.forEach((event, index) => {
        const cell = document.createElement("div");
        cell.className = "cell";

        if (index === playerPos) {
            cell.innerText = "🧙";
        } else {
            cell.innerText = "?";
        }

        board.appendChild(cell);
    });
}

// Aktion
window.handleAction = function () {
    if (!gameStarted) return;

    if (inFight) {
        attackMonster();
        return;
    }

    playerPos++;

    if (playerPos >= boardEvents.length) {
        alert("Du hast das Ende erreicht!");
        return;
    }

    if (boardEvents[playerPos] === "monster") {
        startFight();
    }

    drawBoard();
    updateUI();
};

// Kampf starten
function startFight() {
    inFight = true;
    monster = {
        hp: 10,
        attack: 3
    };

    document.getElementById("battle-arena").innerText =
        "Monster erscheint! HP: " + monster.hp;
}

// Angriff
function attackMonster() {
    monster.hp -= meta.attackPower;

    if (monster.hp <= 0) {
        meta.money += 10;
        inFight = false;
        monster = null;
        document.getElementById("battle-arena").innerText =
            "Monster besiegt!";
    } else {
        meta.hp -= monster.attack;

        if (meta.hp <= 0) {
            alert("Game Over!");
            location.reload();
        } else {
            document.getElementById("battle-arena").innerText =
                "Monster HP: " + monster.hp + " | Deine HP: " + meta.hp;
        }
    }

    updateUI();
}

// UI Update
function updateUI() {
    document.getElementById("statusPanel").innerText =
        meta.playerName +
        " | HP: " + meta.hp +
        " | Gold: " + meta.money;
}
