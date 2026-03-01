// --- MUSIK SYSTEM ---
const playlist = ["sounds/music/bg1.mp3", "sounds/music/bg2.mp3", "sounds/music/bg3.mp3"];
let currentTrackIndex = 0;
let bgMusic = new Audio();
let isMusicPlaying = false;

function setupMusic() {
    const toggleBtn = document.getElementById("toggleMusic");
    const volControl = document.getElementById("volumeControl");
    const songNameDisplay = document.getElementById("current-song-name");
    bgMusic.src = playlist[currentTrackIndex];
    bgMusic.volume = 0.5;
    toggleBtn.onclick = () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
            songNameDisplay.innerText = "Pausiert";
        } else {
            bgMusic.play().catch(() => log("Klick nötig!"));
            toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
            songNameDisplay.innerText = playlist[currentTrackIndex].split('/').pop().replace(".mp3", "");
        }
        isMusicPlaying = !isMusicPlaying;
    };
    volControl.oninput = (e) => { bgMusic.volume = e.target.value; };
    bgMusic.onended = () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        bgMusic.src = playlist[currentTrackIndex];
        songNameDisplay.innerText = playlist[currentTrackIndex].split('/').pop().replace(".mp3", "");
        bgMusic.play();
    };
}

// --- SPIEL DATEN (v19 - Shop & Highscore Fix) ---
const DEFAULT_META = { hp: 20, maxHpBase: 20, money: 0, attackPower: 5, currentKills: 0, currentRound: 1, hpBought: 0, atkBought: 0 };
let meta = JSON.parse(JSON.stringify(DEFAULT_META));
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;

window.onload = function() {
    setupMusic();
    loadData();
    const initBtn = document.getElementById("initBtn");
    const finalStartBtn = document.getElementById("finalStartBtn");
    if(initBtn) initBtn.onclick = () => document.getElementById("loginModal").style.display = "flex";
    if(finalStartBtn) {
        finalStartBtn.onclick = () => {
            const name = document.getElementById("heroNameInput").value.trim();
            if(name) {
                localStorage.setItem("playerName", name);
                document.getElementById("loginModal").style.display = "none";
                updateUI();
                log("Reise beginnt!");
            }
        };
    }
    if(localStorage.getItem("playerName")) updateUI();
};

function loadData() {
    try {
        const m = localStorage.getItem("game_meta_v19");
        if(m) meta = JSON.parse(m);
        const h = localStorage.getItem("game_highscore");
        if(h) highscore = JSON.parse(h);
        playerPos = parseInt(localStorage.getItem("game_pos_v19")) || 0;
        const e = localStorage.getItem("game_events_v19");
        if(e) boardEvents = JSON.parse(e); else generateBoardEvents();
    } catch(err) { generateBoardEvents(); }
}

function saveData() {
    if(meta.currentRound
