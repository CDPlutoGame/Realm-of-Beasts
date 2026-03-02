// ==========================================
// --- BASIS FUNKTIONEN (Wichtig für Stabilität) ---
// ==========================================
function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) {
        lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
        if(lc.innerHTML.length > 500) lc.innerHTML = lc.innerHTML.substring(0, 500); // Verhindert Überlaufen
    }
}

// ==========================================
// --- MUSIK SYSTEM (Geprüfte Pfade) ---
// ==========================================
const playlist = [
    "sounds/music/bg1.mp3",
    "sounds/music/bg2.mp3",
    "sounds/music/bg3.mp3"
];
let currentTrackIndex = 0;
let bgMusic = new Audio();
let isMusicPlaying = false;

function setupMusic() {
    const toggleBtn = document.getElementById("toggleMusic");
    const volControl = document.getElementById("volumeControl");
    const songNameDisplay = document.getElementById("current-song-name");
    
    // Prüfen ob die Musik-Elemente im HTML existieren
    if (!toggleBtn || !volControl || !songNameDisplay) {
        // Falls die Musik-UI nicht da ist, springe raus ohne Absturz
        return; 
    }

    bgMusic.src = playlist[currentTrackIndex];
    bgMusic.volume = volControl.value;

    toggleBtn.onclick = () => {
        if (isMusicPlaying) {
            bgMusic.pause();
