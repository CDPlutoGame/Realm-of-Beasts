// --- MUSIK SYSTEM ---
// WICHTIG: Prüfe, ob deine Dateien wirklich in sounds/music/ liegen!
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

    // Falls die Playlist leer ist oder Dateien fehlen, laden wir sicherheitshalber nichts
    if (playlist.length > 0) {
        bgMusic.src = playlist[currentTrackIndex];
        bgMusic.volume = 0.5;
    }

    toggleBtn.onclick = () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            toggleBtn.innerHTML = '<i class="fas fa-play"></i>';
            songNameDisplay.innerText = "Pausiert";
        } else {
            bgMusic.play().then(() => {
                toggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
                songNameDisplay.innerText = playlist[currentTrackIndex].split('/').pop().replace(".mp3", "");
            }).catch(() => {
                log("Musik konnte nicht geladen werden.");
                console.log("Checke Pfad: " + playlist[currentTrackIndex]);
            });
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

// --- SPIEL DATEN ---
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
    
    // Wenn schon ein Name da ist, direkt UI zeigen
    if(localStorage.getItem("playerName")) {
        updateUI();
    }
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
    } catch(err) { 
        generateBoardEvents(); 
    }
}

function saveData() {
    if(meta.currentRound > highscore.bestRound) {
        highscore.bestRound = meta.currentRound;
    }
    localStorage.setItem("game_meta_v19", JSON.stringify(meta));
    localStorage.setItem("game_highscore", JSON.stringify(highscore));
    localStorage.setItem("game_pos_v19", playerPos);
    localStorage.setItem("game_events_v19", JSON.stringify(boardEvents));
}

function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateBoardEvents() {
    let count = 0;
    while (count < 10 || count > 18) {
        boardEvents = new Array(30).fill(null);
        count = 0;
        for (let i = 1; i < 30; i++) {
            if (Math.random() < 0.45) {
                count++;
                if (Math.random() < 0.75) {
                    let p = ["frog"];
                    if (meta.currentRound >= 11) p.push("wolf");
                    if (meta.currentRound >= 21) p.push("bear");
                    boardEvents[i] = p[Math.floor(Math.random() * p.length)];
                } else { boardEvents[i] = "money_coin"; }
            }
        }
    }
}

window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { 
        shopOpen = false; 
        log("Abenteuer fortgesetzt!"); 
        updateUI();
        return; 
    }
    
    let steps = getRandom(1, 4);
    playerPos += steps;

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            let lvl = meta.currentRound / 10;
            monster = { name: "BOSS DRACHE", hp: lvl*800, maxHp: lvl*800, atk: 15+(lvl*5), money: 250*Math.pow(2, lvl-1), isBoss: true, icon: "🐲" };
            inFight = true;
        } else {
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound);
        }
    } else {
        let ev = boardEvents[playerPos];
        let scale = Math.floor(meta.currentRound / 2);
        if (ev && ev !== "money_coin") {
            if(ev==="frog") monster={name:"Frosch", hp:12+(scale*4), maxHp:12+(scale*4), atk:2+(scale*1), money:getRandom(3,8), icon:"🐸", isBoss:false};
            if(ev==="wolf") monster={name:"Wolf", hp:30+(scale*10), maxHp:30+(scale*10), atk:7+(scale*2), money:getRandom(5,10), icon:"🐺", isBoss:false};
            if(ev==="bear") monster={name:"Bär", hp:80+(scale*25), maxHp:80+(scale*25), atk:15+(scale*3), money:getRandom(15,20), icon:"🐻", isBoss:false};
            inFight = true;
            boardEvents[playerPos] = null;
        } else if (ev === "money_coin") {
            let gold = meta.currentRound <= 10 ? getRandom(10,13) : (meta.currentRound <= 20 ? getRandom(13,15) : getRandom(15,20));
            meta.money += gold;
            boardEvents[playerPos] = null;
            log("💰 Gold: +" + gold);
        }
    }
    updateUI();
};

window.attackMonster = function() {
    if(!monster) return;
    monster.hp -= meta.attackPower;
    if (monster.hp <= 0) {
        meta.money += monster.money;
        inFight = false;
        log("Besiegt! +" + monster.money + " G");
        if(monster.isBoss) { meta.currentRound++; generateBoardEvents(); }
    } else {
        meta.hp -= monster.atk;
        if (meta.hp <= 0) {
            log("💀 Besiegt! Shop ist offen.");
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
    if(!shopOpen) return;
    let cost = type === 'hp' ? 100+(meta.hpBought*5) : 100+(meta.atkBought*5);
    if(meta.money >= cost) {
        meta.money -= cost;
        if(type === 'hp') { meta.maxHpBase += 5; meta.hp = meta.maxHpBase; meta.hpBought++; }
        else { meta.attackPower += 5; meta.atkBought++; }
        log("Upgrade gekauft!");
    } else {
        log("Nicht genug Gold!");
    }
    updateUI();
};

function updateUI() {
    saveData();
    const name = localStorage.getItem("playerName") || "Held";
    
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#1e1e1e; padding:10px; border-radius:10px; border:1px solid #444; text-align:left; font-size:12px;">
                <div style="display:flex; justify-content:space-between;">
                    <b style="color:#d4af37">${name}</b>
                    <b style="color:#4ade80">BESTE RUNDE: ${highscore.bestRound}</b>
                </div>
                <hr style="border:0; border-top:1px solid #333; margin:5px 0;">
                <span style="color:#f59e0b">${meta.money} Gold</span> | Aktuelle Runde: ${meta.currentRound}<br>
                HP: ${meta.hp}/${meta.maxHpBase} | ATK: ${meta.attackPower}
            </div>`;
    }

    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            let bgText = "Wald voller Gefahren"; let icon = "🌲";
            if(meta.currentRound >= 11) { bgText = "Magischer Wald"; icon = "✨"; }
            if(meta.currentRound >= 21) { bgText = "Mysteriöser Wald"; icon = "🌳"; }
            arena.innerHTML = `<div style="font-size:9px; color:#4ade80; text-transform:uppercase; margin-bottom:5px;">${icon} ${bgText}</div><div style="font-size:50px;">${monster.icon}</div><div style="font-weight:bold; color:${monster.isBoss ? '#d4af37' : '#ef4444'};">${monster.name}</div><div class="hp-bar-container"><div id="enemy-hp-fill" style="width:${(monster.hp/monster.maxHp)*100}%"></div><div id="enemy-hp-text">${Math.max(0, monster.hp)}/${monster.maxHp} HP</div></div>`;
        } else if(shopOpen) {
            arena.innerHTML = `<div style="color:#ef4444; font-size:40px;"><i class="fas fa-store"></i></div><div style="color:#ef4444; font-size:10px; margin-top:5px; font-weight:bold;">SHOP OFFEN - VERSTÄRKE DICH!</div>`;
        } else {
            arena.innerHTML = `<div style="color:#2d4c2d; font-size:40px;"><i class="fas fa-hiking"></i></div><div style="color:#444; font-size:10px; margin-top:5px;">WANDERN...</div>`;
        }
    }

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

    const fPanel = document.getElementById("fightPanel");
    if(fPanel) {
        fPanel.innerHTML = inFight ? 
            `<button class="game-btn" style="background:#b91c1c;" onclick="attackMonster()">ANGRIFF</button>` : 
            `<button class="game-btn" style="background:${shopOpen ? '#d4af37' : '#1d4ed8'}; color:${shopOpen ? 'black' : 'white'};" onclick="playerMove()">${shopOpen ? 'SHOP VERLASSEN & START' : 'VORWÄRTS'}</button>`;
    }

    const bh = document.getElementById("btn-hp"); 
    const ba = document.getElementById("btn-atk");
    if(bh && ba) {
        bh.innerHTML = `+5 HP (${100+(meta.hpBought*5)} G)`; 
        ba.innerHTML = `+5 ATK (${100+(meta.atkBought*5)} G)`;
        bh.disabled = ba.disabled = !shopOpen;
        bh.style.opacity = shopOpen ? "1" : "0.3";
        ba.style.opacity = shopOpen ? "1" : "0.3";
        bh.onclick = () => buyItem('hp');
        ba.onclick = () => buyItem('atk');
    }
}

function log(msg) { 
    const lc = document.getElementById("logContent"); 
    if(lc) {
        lc.innerHTML = "> " + msg + "<br>" + lc.innerHTML; 
        if(lc.innerHTML.length > 1000) lc.innerHTML = lc.innerHTML.substring(0, 1000); // Verhindert dass Log zu groß wird
    }
}
