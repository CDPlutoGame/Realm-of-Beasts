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

window.changeVolume = function(val) { if (bgMusic) bgMusic.volume = val / 100; };

function playRandomMusic() {
    const track = musicTracks[Math.floor(Math.random() * musicTracks.length)];
    if (bgMusic) bgMusic.pause();
    bgMusic = new Audio(track);
    bgMusic.loop = true;
    bgMusic.volume = document.getElementById("volumeSlider").value / 100;
    bgMusic.play().catch(() => {});
}

window.onload = function() {
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) {
        const d = JSON.parse(saved);
        if(d.playerName) document.getElementById("playerNameInput").value = d.playerName;
    }
};

window.startGame = function() {
    const name = document.getElementById("playerNameInput").value.trim();
    if (name === "") return alert("Nenne deinen Namen!");
    const saved = localStorage.getItem("cdp_rpg_meta");
    if(saved) meta = JSON.parse(saved);
    meta.playerName = name;
    document.getElementById("loginOverlay").style.display = "none";
    playRandomMusic();
    gameStarted = true;
    generateBoardEvents();
    updateUI();
};

function generateBoardEvents() {
    boardEvents = new Array(30).fill(null);
    for (let i = 1; i < 30; i++) {
        let r = Math.random();
        if (r < 0.35) {
            if (meta.currentRound <= 10) boardEvents[i] = "frog";
            else if (meta.currentRound <= 20) boardEvents[i] = "wolf";
            else boardEvents[i] = "bear";
        } else if (r 
