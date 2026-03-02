// --- BASIS FUNKTIONEN (Wichtig damit nichts abstürzt) ---
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) {
        lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
        if(lc.innerHTML.length > 500) lc.innerHTML = lc.innerHTML.substring(0, 500);
    }
}

// --- MUSIK SYSTEM ---
const playlist = ["sounds/music/bg1.mp3", "sounds/music/bg2.mp3", "sounds/music/bg3.mp3"];
let currentTrackIndex = 0;
let bgMusic = new Audio();
let isMusicPlaying = false;

function setupMusic() {
    const toggleBtn = document.getElementById("toggleMusic");
    const volControl = document.getElementById("volumeControl");
    const songNameDisplay = document.getElementById("current-song-name");
    if (!toggleBtn) return;

    bgMusic.src = playlist[currentTrackIndex];
    bgMusic.volume = 0.5;

    toggleBtn.onclick = () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            toggleBtn.innerHTML = '▶';
            if(songNameDisplay) songNameDisplay.innerText = "Pause";
        } else {
            bgMusic.play().then(() => {
                toggleBtn.innerHTML = '⏸';
                if(songNameDisplay) songNameDisplay.innerText = "Musik läuft";
            }).catch(e => console.log("Musik-Start Fehler"));
        }
        isMusicPlaying = !isMusicPlaying;
    };
}

// --- SPIEL DATEN & HELDEN ---
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", hp: 30, atk: 10, img: "images/ben.png" },
    "Jeffrey": { class: "Ritter",     hp: 50, atk: 6,  img: "images/jeffry.png" },
    "Jamal":   { class: "Berserker",  hp: 35, atk: 15, img: "images/jamal.png" },
    "Luna":    { class: "Waldläuferin", hp: 20, atk: 18, img: "images/luna.png" },
    "Berta":   { class: "Magierin",   hp: 40, atk: 8,  img: "images/berta.png" },
    "Brutus":  { class: "Schläger",   hp: 45, atk: 12, img: "images/brutus.png" }
};

let meta = { hp: 30, maxHpBase: 30, money: 0, attackPower: 10, currentRound: 1, hpBought: 0, atkBought: 0 };
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;
let currentHero = "Ben";

window.onload = function() {
    setupMusic();
    loadData();
    
    // Login-Button Logik
    const finalStartBtn = document.getElementById("finalStartBtn");
    if(finalStartBtn) {
        finalStartBtn.onclick = function() {
            const nameInput = document.getElementById("heroNameInput");
            if(nameInput && nameInput.value.trim() !== "") {
                localStorage.setItem("playerName", nameInput.value.trim());
                document.getElementById("loginModal").style.display = "none";
                updateUI();
                log("Willkommen, " + nameInput.value);
            }
        };
    }
    updateUI();
};

function loadData() {
    try {
        const m = localStorage.getItem("game_meta_v22");
        if(m) meta = JSON.parse(m);
        const h = localStorage.getItem("game_highscore");
        if(h) highscore = JSON.parse(h);
        playerPos = parseInt(localStorage.getItem("game_pos_v22")) || 0;
        const e = localStorage.getItem("game_events_v22");
        if(e) boardEvents = JSON.parse(e); else generateBoardEvents();
        const savedHero = localStorage.getItem("currentHero");
        if(savedHero) currentHero = savedHero;
    } catch(err) { generateBoardEvents(); }
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    localStorage.setItem("game_meta_v22", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_pos_v22", playerPos);
    localStorage.setItem("game_events_v22", JSON.stringify(boardEvents));
    localStorage.setItem("currentHero", currentHero);
}

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.35) {
            if (Math.random() < 0.7) {
                let p = ["frog"];
                if (meta.currentRound >= 5) p.push("wolf");
                if (meta.currentRound >= 12) p.push("bear");
                boardEvents[i] = p[Math.floor(Math.random() * p.length)];
            } else { boardEvents[i] = "money_coin"; }
        }
    }
}

window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Shop verlassen."); updateUI(); return; }
    
    let steps = getRandom(1, 4);
    playerPos += steps;
    log("Du gehst " + steps + " Schritte.");

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            monster = { name: "BOSS DRACHE", hp: 500, maxHp: 500, atk: 20, money: 500, isBoss: true, img: "images/dragon 1.png" };
            inFight = true;
            log("DER DRACHE ERSCHEINT!");
        } else {
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound);
        }
    } else {
        let ev =
