// 1. Variablen & Status (Meta)
let meta = { 
    playerName: "", 
    hp: 20, 
    maxHpBase: 20, 
    money: 0, 
    attackPower: 5, 
    currentRound: 1, 
    bossesKilled: 0, 
    autoRunLevel: 0, 
    hpUpgrades: 0, 
    atkUpgrades: 0
};

let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let gameStarted = false;
let isGameOver = false;
let autoRunActive = false;
let autoRunInterval = null;
let bgMusic = null;

const musicTracks = ['sounds/music/bg1.mp3', 'sounds/music/bg2.mp3', 'sounds/music/bg3.mp3'];

// 2. Musik-Steuerung (Global für HTML-Slider)
window.changeVolume = function(val) { 
    if (bgMusic) bgMusic.volume = val / 100; 
};

function playRandomMusic() {
    try {
        const track = musicTracks[Math.floor(Math.random() * musicTracks.length)];
        if (bgMusic) bgMusic.pause();
        bgMusic = new Audio(track);
        bgMusic.loop = true;
        bgMusic.volume = document.getElementById("volumeSlider").value / 100;
        bgMusic.play().catch(e => console.log("Musik-Autoplay blockiert, warte auf Interaktion."));
    } catch(e) {
        console.error("Musik konnte nicht geladen werden:", e);
    }
}

// 3. Laden beim Starten der Seite
window.onload = function() {
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) {
        const d = JSON.parse(saved);
        if(d.playerName) {
            document.getElementById("playerNameInput").value = d.playerName;
        }
    }
    console.log("Seite geladen, bereit für Login.");
};

// 4. DIE START-FUNKTION (Wird vom Button gerufen)
window.startGame = function() {
    const nameInput = document.getElementById("playerNameInput");
    const name = nameInput.value.trim();
    
    if (name === "") {
        alert("Nenne deinen Namen!");
        return;
    }

    // Speicherstand laden falls vorhanden
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) {
        meta = JSON.parse(saved);
    }
    
    meta.playerName = name;
    
    // UI ausblenden & Spiel starten
    document.getElementById("loginOverlay").style.display = "none";
    
    console.log("Spiel gestartet für: " + meta.playerName);
    
    playRandomMusic();
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

// 5. Spiel-Logik (Events generieren)
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.35) {
            if (meta.currentRound <= 10) boardEvents[i] = "frog";
            else if (meta.currentRound <= 20) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (r < 0.50) {
            boardEvents[i] = "item";
        }
    }
    console.log("Spielfeld generiert.");
}

// 6. UI Aktualisierung
function updateUI() {
    const status = document.getElementById("statusPanel");
    if (status) {
        status.innerHTML = `
            <strong>${meta.playerName}</strong> | 
            HP: ${meta.hp}/${meta.maxHpBase} | 
            Gold: ${meta.money} | 
            Power: ${meta.attackPower} | 
            Runde: ${meta.currentRound}
        `;
    }
    
    // Board zeichnen
    const board = document.getElementById("board");
    if(board) {
        board.innerHTML = "";
        boardEvents.forEach((event, index) => {
            const cell = document.createElement("div");
            cell.className = "cell";
            if(index === playerPos) cell.innerHTML = "👤";
            else if(event === "frog") cell.innerHTML = "🐸";
            else if(event === "wolf") cell.innerHTML = "🐺";
            else if(event === "bear") cell.innerHTML = "🐻";
            else if(event === "item") cell.innerHTML = "💰";
            else cell.innerHTML = "·";
            board.appendChild(cell);
        });
    }

    const actionBtn = document.getElementById("actionBtn");
    if(actionBtn) {
        actionBtn.innerText = inFight ? "ANGREIFEN!" : "VORWÄRTS GEHEN";
    }
}

// Speichern-Funktion (kannst du regelmäßig aufrufen)
function saveGame() {
    localStorage.setItem("cdp_rpg_meta", JSON.stringify(meta));
}
