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
            toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
            songNameDisplay.innerText = "Musik pausiert";
        } else {
            bgMusic.play().then(() => {
                toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
                songNameDisplay.innerText = playlist[currentTrackIndex].split('/').pop().replace(".mp3", "");
            }).catch(e => {
                songNameDisplay.innerText = "Fehler beim Laden";
                log("Musikfehler: Starten fehlgeschlagen.");
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

// ==========================================
// --- SPIEL DATEN & HELDEN (BILDER FIX) ---
// ==========================================
// EXAKTE Namen von deinem Handy (Gross/Kleinschreibung beachten!)
const HERO_DATA = {
    "Ben":     { class: "Abenteurer", hp: 30, atk: 10, img: "images/Ben.png" }, // WICHTIG: Grosses 'B'
    "Jeffrey": { class: "Ritter",     hp: 50, atk: 6,  img: "images/jeffry.png" }, // Ohne 'e'
    "Jamal":   { class: "Berserker",  hp: 35, atk: 15, img: "images/jamal.png" },
    "Luna":    { class: "Waldläuferin", hp: 20, atk: 18, img: "images/luna.png" },
    "Berta":   { class: "Magierin",   hp: 40, atk: 8,  img: "images/berta.png" },
    "Brutus":  { class: "Schläger",   hp: 45, atk: 12, img: "images/brutus.png" }
};

// Standard-Werte für ein neues Spiel
const DEFAULT_META = { hp: 30, maxHpBase: 30, money: 20, attackPower: 10, currentRound: 1 };
let meta = JSON.parse(JSON.stringify(DEFAULT_META)); // Kopie der Standardwerte
let highscore = { bestRound: 1 };
let playerPos = 0;
let inFight = false;
let monster = null;
let boardEvents = [];
let shopOpen = false;
let currentHero = "Ben"; // Start-Held

// ==========================================
// --- INITIALISIERUNG (Start & Login) ---
// ==========================================
window.onload = function() {
    setupMusic(); // Musik initialisieren
    loadData(); // Gespeicherte Daten laden
    
    // Login Modul Steuerung
    const modal = document.getElementById("loginModal");
    const playerName = localStorage.getItem("playerName");

    if (!playerName || playerName === "") {
        // Kein Name gespeichert: Login-Fenster anzeigen
        if(modal) modal.style.display = "flex";
    } else {
        // Name ist da: Login-Fenster verstecken
        if(modal) modal.style.display = "none";
        log("Willkommen zurück, " + playerName + "!");
    }

    // "Anmelden" Button Logik
    const startBtn = document.getElementById("finalStartBtn");
    if(startBtn) {
        startBtn.onclick = function() {
            const nameInput = document.getElementById("heroNameInput");
            if(nameInput && nameInput.value.trim() !== "") {
                // Name speichern
                localStorage.setItem("playerName", nameInput.value.trim());
                // Login-Fenster ausblenden
                if(modal) modal.style.display = "none";
                updateUI(); // Spielbrett anzeigen
                log("Das Abenteuer beginnt, " + nameInput.value + "!");
            } else {
                alert("Bitte gib einen Namen ein, Held!");
            }
        };
    }
    
    updateUI(); // Spiel anzeigen
};

// ==========================================
// --- DATEN SPEICHERN & LADEN ---
// ==========================================
function loadData() {
    try {
        const m = localStorage.getItem("game_meta_v24"); // Versions-Tag v24 für Kompatibilität
        if(m) meta = JSON.parse(m);
        
        const h = localStorage.getItem("game_highscore");
        if(h) highscore = JSON.parse(h);
        
        playerPos = parseInt(localStorage.getItem("game_pos_v24")) || 0;
        
        const e = localStorage.getItem("game_events_v24");
        if(e) boardEvents = JSON.parse(e); else generateBoardEvents();
        
        const savedHero = localStorage.getItem("currentHero");
        if(savedHero) currentHero = savedHero;
        
    } catch(err) {
        // Falls JSON fehlerhaft ist, neu generieren
        log("Datenfehler: Neues Brett erstellt.");
        generateBoardEvents();
    }
}

function saveData() {
    // Highscore aktualisieren
    if(meta.currentRound > highscore.bestRound) highscore.bestRound = meta.currentRound;
    
    // Alles im LocalStorage speichern
    localStorage.setItem("game_meta_v24", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_pos_v24", playerPos);
    localStorage.setItem("game_events_v24", JSON.stringify(boardEvents));
    localStorage.setItem("currentHero", currentHero);
}

// ==========================================
// --- SPIELBRETT GENERIERUNG ---
// ==========================================
function generateBoardEvents() {
    boardEvents = new Array(30).fill(null); // 30 Felder Pfad
    
    for (let i = 1; i < 30; i++) {
        // 35% Chance für ein Ereignis
        if (Math.random() < 0.35) {
            if (Math.random() < 0.7) {
                // Ein Monster erscheint
                let possibleMonsters = ["frog"]; // Frosch immer möglich
                if (meta.currentRound >= 5) possibleMonsters.push("wolf"); // Ab Runde 5 auch Wölfe
                if (meta.currentRound >= 12) possibleMonsters.push("bear"); // Ab Runde 12 Bären
                
                // Zufälliges Monster aus der Liste wählen
                boardEvents[i] = possibleMonsters[Math.floor(Math.random() * possibleMonsters.length)];
            } else {
                // Gold gefunden
                boardEvents[i] = "money_coin";
            }
        }
    }
}

// ==========================================
// --- BEWEGUNG & MONSTER LOGIK (BILDER FIX) ---
// ==========================================
window.playerMove = function() {
    // Verhindern dass gewürfelt wird während man kämpft oder im Shop ist
    if(inFight || shopOpen) return;
    
    let steps = getRandom(1, 4); // 1-4 Felder würfeln
    playerPos += steps;
    
    log("Du gehst " + steps + " Schritte voran.");

    // Pfad-Ende erreicht (Boss-Drache oder nächste Runde)
    if (playerPos >= 30) {
        playerPos = 0; // Zurück zum Start
        if (meta.currentRound % 10 === 0) {
            // Jede 10. Runde ist Boss-Zeit!
            // Name 'dragon 1' exakt wie auf deinem Handy
            monster = { name: "BOSS DRACHE", hp: 800, maxHp: 800, atk: 25, money: 500, isBoss: true, img: "images/dragon 1.png" };
            inFight = true;
            log("DER DRACHE ERSCHEINT!");
        } else {
            // Nächste Runde, neue Ereignisse
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound + " beginnt.");
        }
    } else {
        // Was liegt auf dem Feld?
        let ev = boardEvents[playerPos];
        
        // Normale Monster Begegnungen (Abgestimmt auf deine Handy-Liste)
        if (ev && ev !== "money_coin") {
            if (ev === "frog") {
                monster = { name: "Frosch", hp: 20, maxHp: 20, atk: 3, money: 10, img: "images/frog.png", isBoss:false }; // frog.png laut Liste
            }
            else if (ev === "wolf") {
                monster = { name: "Wolf", hp: 50, maxHp: 50, atk: 8, money: 20, img: "images/wolf.png", isBoss:false }; // wolf.png
            }
            else if (ev === "bear") {
                monster = { name: "Bär", hp: 120, maxHp: 120, atk: 15, money: 40, img: "images/bär.png", isBoss:false }; // bär.png
            }
            inFight = true;
            log("Ein " + monster.name + " greift an!");
            boardEvents[playerPos] = null; // Feld leeren
        } else if (ev === "money_coin") {
            // Gold gefunden
            let foundGold = 15;
            meta.money += foundGold;
            log("💰 Gold gefunden: +" + foundGold);
            boardEvents[playerPos] = null; // Feld leeren
        }
    }
    updateUI(); // Spiel anzeigen
};

// ==========================================
// --- KAMPF SYSTEM ---
// ==========================================
window.attackMonster = function() {
    if(!monster) return;
    
    // Spieler schlägt Monster
    monster.hp -= meta.attackPower;
    log("Spieler verursacht " + meta.attackPower + " Schaden.");
    
    // Monster tot?
    if (monster.hp <= 0) {
        meta.money += monster.money;
        inFight = false;
        log("Sieg! +" + monster.money + " Gold erhalten.");
        
        // Wenn es ein Boss war, Runde beenden
        if(monster.isBoss) {
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound + " beginnt.");
        }
        monster = null;
    } else {
        // Monster schlägt Spieler zurück
        meta.hp -= monster.atk;
        log(monster.name + " schlägt zurück: -" + monster.atk + " HP.");
        
        // Spieler tot?
        if (meta.hp <= 0) {
            log("Du bist gefallen!");
            meta.hp = meta.maxHpBase; // HP wieder auffüllen
            meta.money = Math.floor(meta.money * 0.8); // 20% Geld verlieren
            log("💰 Verlust: 20% deines Goldes.");
            
            // Zurück in den Shop (Game Over/Revive)
            playerPos = 0;
            inFight = false;
            shopOpen = true; 
            meta.currentRound = 1; // Runde zurücksetzen
            generateBoardEvents(); // Neues Brett
        }
    }
    updateUI(); // Spiel anzeigen
};

// ==========================================
// --- SHOP SYSTEM (Funktionen sind vorbereitet) ---
// ==========================================
window.buyItem = function(type) {
    // Shop-Funktionalität hier einfügen (Preis-Check, Gold abziehen, Status erhöhen)
    // Beispiel:
    // if(type === 'hp' && meta.money >= 100) { ... }
    log("Shop Funktion noch nicht aktiv.");
    updateUI();
};

// ==========================================
// --- DIE UI MIT BILDERN ---
// ==========================================
function updateUI() {
    // Zuerst alles speichern, damit nichts verloren geht
    saveData();
    
    const hero = HERO_DATA[currentHero];
    const name = localStorage.getItem("playerName") || "Held";
    
    // Status Panel oben mit Helden-Bild (Bilder Fix)
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#1a1a1a; padding:10px; border-radius:10px; border:1px solid gold; display:flex; gap:10px; align-items:center; color:white;">
                <img src="${hero.img}" 
                     style="width:50px; height:50px; border-radius:5px; border:1px solid gold; object-fit: cover;" 
                     onerror="this.src='https://via.placeholder.com/40?text=Error'">
                <div style="flex-grow:1; font-size:12px;">
                    <b style="color:gold">${name} (${hero.class})</b><br>
                    💰 ${meta.money} Gold | Runde: ${meta.currentRound}<br>
                    ❤️ HP: ${meta.hp}/${meta.maxHpBase} | ⚔️ ATK: ${meta.attackPower}
                </div>
            </div>`;
    }

    // Battle Arena mit Monster-Bildern (Bilder Fix)
    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            // Im Kampf: Monster Bild, Name und HP-Leiste
            arena.innerHTML = `
                <div style="font-size:10px; color:#4ade80; text-transform:uppercase; font-weight:bold;">KAMPF!</div>
                
                <div style="height: 110px; display: flex; align-items: center; justify-content: center; margin: 10px 0;">
                    <img src="${monster.img}" 
                         style="max-height: 100%; max-width: 140px; object-fit: contain; filter: drop-shadow(0 0 10px rgba(255,0,0,0.3));" 
                         onerror="this.src='https://via.placeholder.com/80?text=Bild+fehlt'">
                </div>

                <div style="font-weight:bold; color:red; font-size:14px; text-transform:uppercase;">
                    ${monster.name}
                </div>

                <div class="hp-bar-container" style="background:#333; width:100%; height:12px; border-radius:6px; margin-top:8px; border:1px solid #555; overflow:hidden; position:relative;">
                    <div id="enemy-hp-fill" style="background:#b91c1c; width:${(monster.hp / monster.maxHp) * 100}%; height:100%;"></div>
                    <div id="enemy-hp-text" style="position:absolute; width:100%; top:0; left:0; font-size:9px; color:white; font-weight:bold; line-height:12px; text-align:center;">
                        ${Math.max(0, monster.hp)} / ${monster.maxHp} HP
                    </div>
                </div>
            `;
        } else if(shopOpen) {
            // Im Shop (Game Over/Revive)
            arena.innerHTML = `<div style="color:gold; font-size:50px;"><i class="fas fa-store"></i></div><div style="color:gold; font-weight:bold;">SHOP OFFEN</div>`;
        } else {
            // Standard-Ansicht (Wandern)
            arena.innerHTML = `<div style="color:#666; font-size:50px;"><i class="fas fa-hiking"></i></div><div>WANDERN...</div>`;
        }
    }

    // Spielbrett Zellen aktualisieren
    const board = document.getElementById("board"); 
    if(board) {
        board.innerHTML = ""; // Altes Brett leeren
        for (let i = 0; i < 30; i++) {
            const cell = document.createElement("div"); 
            cell.className = "cell";
            
            if (i === playerPos) {
                // Spieler Symbol
                cell.innerHTML = "🧙"; 
            } else if (boardEvents[i] === "frog") {
                cell.innerHTML = "🐸"; // Frosch Icon
            } else if (boardEvents[i] === "wolf") {
                cell.innerHTML = "🐺"; // Wolf Icon
            } else if (boardEvents[i] === "bear") {
                cell.innerHTML = "🐻"; // Bär Icon
            } else if (boardEvents[i] === "money_coin") {
                cell.innerHTML = "💰"; // Gold Icon
            } 
            board.appendChild(cell);
        }
    }

    // Kampf / Bewegungs Button aktualisieren
    const fPanel = document.getElementById("fightPanel");
    if(fPanel) {
        fPanel.innerHTML = inFight ? 
            `<button class="game-btn" style="background:#b91c1c; color:white; padding:10px; width:100%; border-radius:5px; border:1px solid #600;" onclick="attackMonster()">ANGRIFF</button>` : 
            `<button class="game-btn" style="background:${shopOpen ? '#d4af37' : '#1d4ed8'}; color:white; padding:10px; width:100%; border-radius:5px; border:1px solid #004;" onclick="playerMove()">${shopOpen ? 'SHOP VERLASSEN' : 'WÜRFELN'}</button>`;
    }
}
