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
        let ev = boardEvents[playerPos];
        if (ev && ev !== "money_coin") {
            if(ev==="frog") monster={name:"Frosch", hp:20, maxHp:20, atk:3, money:10, img: "images/frosch.png", isBoss:false};
            if(ev==="wolf") monster={name:"Wolf", hp:50, maxHp:50, atk:8, money:20, img: "images/wolf.png", isBoss:false};
            if(ev==="bear") monster={name:"Bär", hp:120, maxHp:120, atk:15, money:40, img: "images/bär.png", isBoss:false};
            inFight = true;
            log("Ein " + monster.name + " greift an!");
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            meta.money += 20;
            log("Gold gefunden! +20");
            boardEvents[playerPos] = null;
        }
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    log("Du triffst für " + meta.attackPower);
    
    if (monster.hp <= 0) {
        meta.money += monster.money;
        inFight = false;
        log("Sieg! +" + monster.money + " Gold");
        if(monster.isBoss) { meta.currentRound++; generateBoardEvents(); }
    } else {
        meta.hp -= monster.atk;
        log(monster.name + " schlägt zurück: -" + monster.atk + " HP");
        if (meta.hp <= 0) {
            log("Game Over! Zurück zum Shop.");
            meta.hp = meta.maxHpBase;
            meta.currentRound = 1;
            playerPos = 0;
            inFight = false;
            shopOpen = true; 
            generateBoardEvents();
        }
    }
    updateUI();
};

window.buyItem = function(type) {
    if(meta.money >= 100) {
        meta.money -= 100;
        if(type === 'hp') { meta.maxHpBase += 10; meta.hp = meta.maxHpBase; log("+10 Max HP!"); }
        else { meta.attackPower += 5; log("+5 Angriff!"); }
        updateUI();
    } else { log("Zu wenig Gold!"); }
};

function updateUI() {
    saveData();
    const hero = HERO_DATA[currentHero];
    const name = localStorage.getItem("playerName") || "Held";
    
    // Status Panel
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#1a1a1a; padding:10px; border:1px solid #444; display:flex; gap:10px; align-items:center; border-radius:8px;">
                <img src="${hero.img}" style="width:50px; height:50px; border:1px solid gold;">
                <div style="font-size:12px; color:white;">
                    <b>${name}</b> | Gold: <span style="color:gold">${meta.money}</span><br>
                    Runde: ${meta.currentRound} | HP: ${meta.hp}/${meta.maxHpBase}
                </div>
            </div>`;
    }

    // Arena
    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            arena.innerHTML = `
                <img src="${monster.img}" style="height:80px; margin-bottom:5px;">
                <div style="font-weight:bold; color:red;">${monster.name}</div>
                <div style="background:#333; width:100%; height:10px; border-radius:5px;">
                    <div style="background:red; width:${(monster.hp/monster.maxHp)*100}%; height:100%; border-radius:5px;"></div>
                </div>`;
        } else {
            arena.innerHTML = `<div style="padding:20px; color:#666;">${shopOpen ? "SHOP" : "WANDERN..."}</div>`;
        }
    }

    // Brett
    const b = document.getElementById("board"); 
    if(b) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const c = document.createElement("div"); c.className = "cell";
            if (i === playerPos) c.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
            else if (boardEvents[i] === "wolf") c.innerHTML = "🐺";
            else if (boardEvents[i] === "bear") c.innerHTML = "🐻";
            else if (boardEvents[i] === "money_coin") c.innerHTML = "💰"; 
            b.appendChild(c);
        }
    }

    // Buttons
    const fPanel = document.getElementById("fightPanel");
    if(fPanel) {
        fPanel.innerHTML = inFight ? 
            `<button onclick="attackMonster()" style="background:red; color:white; padding:10px; width:100%;">ANGRIFF</button>` : 
            `<button onclick="playerMove()" style="background:blue; color:white; padding:10px; width:100%;">${shopOpen ? 'SHOP VERLASSEN' : 'WÜRFELN'}</button>`;
    }
}