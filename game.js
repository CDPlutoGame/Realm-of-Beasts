import { auth } from "./firebase.js";
import { meta, loadMeta, saveMeta } from "./profile.js";

// --- SPIEL-ZUSTAND ---
let playerPos = 0;
let currentRounds = 1;
let inFight = false;
let monster = null;
let shopOpen = false;
let volumeLevel = 2; // 0=Mute, 1=Leise, 2=Laut

// --- AUDIO ---
const hitSound = new Audio("sounds/hit.mp3");
const bgMusic = new Audio("sounds/music/bg1.mp3");
bgMusic.loop = true;

const monsterTypes = {
    frog: { name: "Frosch", icon: "🐸", hp: 15, atk: 5, gold: 15 },
    wolf: { name: "Wolf", icon: "🐺", hp: 20, atk: 10, gold: 35 },
    bear: { name: "Bär", icon: "🐻", hp: 25, atk: 15, gold: 75 }
};

// --- HILFSFUNKTIONEN ---
function log(msg) {
    const logContent = document.getElementById("logContent");
    if (logContent) {
        logContent.innerHTML = `> ${msg}<br>` + logContent.innerHTML;
        const lines = logContent.innerHTML.split("<br>");
        if (lines.length > 8) logContent.innerHTML = lines.slice(0, 8).join("<br>");
    }
}

function updateVolume() {
    const vols = [0, 0.2,
