// ... (Rest des Codes bleibt gleich bis zur playerMove Funktion)

window.playerMove = function() {
    if(inFight) return;
    if(shopOpen) { shopOpen = false; log("Neue Reise gestartet."); }
    
    let steps = getRandom(1, 4);
    playerPos += steps;

    if (playerPos >= 30) {
        playerPos = 0;
        if (meta.currentRound % 10 === 0) {
            let lvl = meta.currentRound / 10;
            let bossGold = 250 * Math.pow(2, lvl - 1);
            // Bosse skalieren extrem stark
            monster = { 
                name: "EPISCHER DRACHE", 
                hp: lvl * 800, 
                maxHp: lvl * 800, 
                atk: 15 + (lvl * 5), 
                money: bossGold, 
                isBoss: true, 
                icon: "🐲" 
            };
            inFight = true;
            log("!!! BOSS ERSCHEINT !!!");
        } else {
            meta.currentRound++;
            generateBoardEvents();
            log("Runde " + meta.currentRound);
        }
    } else {
        let ev = boardEvents[playerPos];
        if (ev && ev !== "money_coin") {
            
            // --- NEU: SCALING LOGIK (Alle 2 Runden stärker) ---
            // Berechnet, wie oft die Monster schon verstärkt wurden
            let scaleLevel = Math.floor(meta.currentRound / 2); 
            
            if(ev === "frog") {
                monster = {
                    name: "Frosch",
                    hp: 12 + (scaleLevel * 4),      // +4 HP alle 2 Runden
                    maxHp: 12 + (scaleLevel * 4),
                    atk: 2 + (scaleLevel * 1),      // +1 ATK alle 2 Runden
                    money: getRandom(3, 8),
                    icon: "🐸",
                    isBoss: false
                };
            }
            if(ev === "wolf") {
                monster = {
                    name: "Wolf",
                    hp: 30 + (scaleLevel * 10),     // +10 HP alle 2 Runden
                    maxHp: 30 + (scaleLevel * 10),
                    atk: 7 + (scaleLevel * 2),      // +2 ATK alle 2 Runden
                    money: getRandom(5, 10),
                    icon: "🐺",
                    isBoss: false
                };
            }
            if(ev === "bear") {
                monster = {
                    name: "Bär",
                    hp: 80 + (scaleLevel * 25),     // +25 HP alle 2 Runden
                    maxHp: 80 + (scaleLevel * 25),
                    atk: 15 + (scaleLevel * 3),     // +3 ATK alle 2 Runden
                    money: getRandom(15, 20),
                    icon: "🐻",
                    isBoss: false
                };
            }
            
            inFight = true;
            boardEvents[playerPos] = null;
            log(monster.name + " greift an! (Stufe " + scaleLevel + ")");
        } else if (ev === "money_coin") {
            // Goldsack Balancing (bleibt wie besprochen)
            let coinGold = 0;
            if (meta.currentRound <= 10) coinGold = getRandom(10, 13);
            else if (meta.currentRound <= 20) coinGold = getRandom(13, 15);
            else coinGold = getRandom(15, 20);
            
            meta.money += coinGold;
            boardEvents[playerPos] = null;
            log("Goldsack gefunden: +" + coinGold + " €");
        }
    }
    updateUI();
};

// ... (Rest der Funktionen wie gehabt)
