// --- MUSIK SYSTEM (Pfade aus deinem Screenshot) ---
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
    if (!toggleBtn || !volControl || !songNameDisplay) return;

    bgMusic.src = playlist[currentTrackIndex];
    bgMusic.volume = 0.5;

    toggleBtn.onclick = () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
            songNameDisplay.innerText = "Pausiert";
        } else {
            bgMusic.play().then(() => {
                toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
                songNameDisplay.innerText = playlist[currentTrackIndex].split('/').pop().replace(".mp3", "");
            });
        }
        isMusicPlaying = !isMusicPlaying;
    };
    volControl.oninput = (e) => { bgMusic.volume = e.target.value; };
    bgMusic.onended = () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        bgMusic.src = playlist[currentTrackIndex];
        bgMusic.play();
    };
}

// --- SPIEL DATEN & HELDEN (Exakte Namen von deinem Handy) ---
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", hp: 30, atk: 10, img: "images/ben.png" },
    "Jeffrey": { class: "Ritter",     hp: 50, atk: 6,  img: "images/jeff
