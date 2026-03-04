let meta = { 
    playerName: "", hp: 20, maxHpBase: 20, money: 0, attackPower: 5, 
    currentRound: 1, bossesKilled: 0, autoRunLevel: 0, hpUpgrades: 0, atkUpgrades: 0
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

// Lautstärke-Funktion (muss global sein für oninput im HTML)
window.changeVolume = function(val) { 
    if (bgMusic) bgMusic.volume = val / 100; 
};

function playRandomMusic() {
    const track = musicTracks[Math.floor(Math.random() * musicTracks.length)];
    if (bgMusic) bgMusic.pause();
    bgMusic = new Audio(track);
    bgMusic.loop = true;
    // Sucht den Slider-Wert aus deinem HTML
    const vol = document.getElementById("volumeSlider") ? document.getElementById("volumeSlider").value : 50;
    bgMusic.volume = vol / 100;
    bgMusic.play().catch(() => { console.log("Musik braucht Klick zum Starten"); });
}

window.onload = function() {
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) {
        const d = JSON.parse(saved);
        if(d.playerName) document.getElementById("playerNameInput").value = d.playerName;
    }
};

// DER START-BUTTON
window.startGame = function() {
    const nameInput = document.getElementById("playerNameInput");
    const name = nameInput.value.trim();
    
    if (name === "") return alert("Nenne deinen Namen!");
    
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) meta = JSON.parse(saved);
    
    meta.playerName = name;
    
    // Versteckt dein Login-Overlay
    document.getElementById("loginOverlay").style.display = "none";
    
    playRandomMusic();
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

// DIE AKTION (VORWÄRTS) - Verknüpft mit deinem actionBtn
window.handleAction = function() {
    if (!gameStarted || isGameOver) return;

    if (!inFight) {
        if (playerPos < 29) {
            playerPos++;
            checkEvent();
        } else {
            // Neue Runde
            playerPos = 0;
            meta.currentRound++;
            generateBoardEvents();
        }
    } else {
        // Hier käme deine Kampf-Logik rein
        console.log("Kampf läuft...");
    }
    updateUI();
};

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.35) {
            // Deine Monster-Logik
            if (meta.currentRound <= 10) boardEvents[i] = "frog";
            else if (meta.currentRound <= 20) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (r < 0.50) {
            boardEvents[i] = "gold"; // Der Goldsack
        }
    }
}

function checkEvent() {
    const ev = boardEvents[playerPos];
    if (ev === "gold") {
        meta.money += 5;
        boardEvents[playerPos] = null;
    } else if (ev === "frog" || ev === "wolf" || ev === "bear") {
        // Hier setzt du inFight = true für den Kampf
    }
}

function updateUI() {
    // Status Panel
    const status = document.getElementById("statusPanel");
    if (status) {
        status.innerHTML = `Held: ${meta.playerName} | HP: ${meta.hp}/${meta.maxHpBase} | Gold: ${meta.money} | Runde: ${meta.currentRound}`;
    }

    // Spielfeld (Board)
    const board = document.getElementById("board");
    if (board) {
        board.innerHTML = "";
        boardEvents.forEach((event, index) => {
            const cell = document.createElement("div");
            cell.className = "cell";
            if (index === playerPos) cell.innerHTML = "👤";
            else if (event === "frog") cell.innerHTML = "🐸";
            else if (event === "wolf") cell.innerHTML = "🐺";
            else if (event === "bear") cell.innerHTML = "🐻";
            else if (event === "gold") cell.innerHTML = "💰"; // Sack bleibt Sack
            else cell.innerHTML = "·";
            board.appendChild(cell);
        });
    }

    // Button Text anpassen
    const btn = document.getElementById("actionBtn");
    if (btn) {
        btn.innerText = inFight ? "ANGREIFEN" : "VORWÄRTS";
    }
}
