function updateUI() {
    saveData();
    
    // Status Panel (Oben)
    const status = document.getElementById("statusPanel");
    if(status) {
        status.innerHTML = `
            <div style="background:#111; padding:10px; border:1px solid gold; border-radius:10px; font-size:12px; color:white;">
                <b style="color:gold;">🏆 REKORD: ${highscore.bestName} (R${highscore.bestRound})</b><br>
                👤 <b>${meta.playerName}</b> | Gold: ${meta.money} | Runde: ${meta.currentRound}<br>
                ❤️ HP: ${meta.hp}/${meta.maxHpBase} | ⚔️ ATK: ${meta.attackPower}
            </div>`;
    }

    // Kampf-Anzeige (Mitte)
    const arena = document.getElementById("battle-arena");
    if(arena) {
        if(inFight && monster) {
            arena.innerHTML = `
                <img src="${monster.img}" style="height:80px; filter: drop-shadow(0 0 10px red);">
                <div style="color:red; font-weight:bold;">${monster.name}<br>HP: ${monster.hp} | ATK: ${monster.atk}</div>`;
        } else {
            arena.innerHTML = `<div style="padding:40px; color:gray;">WANDERN...</div>`;
        }
    }

    // Tasten-Logik (Ganz unten fixieren)
    const actionBtn = document.getElementById("mainActionBtn");
    const controlDiv = document.getElementById("controls");

    if(gameStarted && actionBtn) {
        // Text und Funktion ändern
        actionBtn.innerHTML = inFight ? "ANGRIFF" : "LAUFEN";
        actionBtn.style.background = "linear-gradient(to bottom, #dc2626, #991b1b)";
        actionBtn.style.border = "2px solid gold";
        actionBtn.onclick = inFight ? window.attackMonster : window.playerMove;

        // Autorun Button hinzufügen, falls er noch nicht da ist
        if (!document.getElementById("autoRunBtn")) {
            const autoBtn = document.createElement("button");
            autoBtn.id = "autoRunBtn";
            autoBtn.onclick = window.toggleAutoRun;
            autoBtn.style = "width:100%; padding:10px; border-radius:10px; border:none; margin-top:10px; color:white; font-size:12px;";
            controlDiv.appendChild(autoBtn);
        }
        
        const autoBtn = document.getElementById("autoRunBtn");
        if(autoBtn) {
            autoBtn.innerHTML = `AUTORUN: ${autoRunActive ? 'AN' : 'AUS'} (Lvl ${meta.autoRunLevel})`;
            autoBtn.style.background = autoRunActive ? "red" : "#333";
            autoBtn.style.boxShadow = autoRunActive ? "0 0 20px red" : "none";
        }
    }

    // Brett Zeichnen
    const b = document.getElementById("board"); 
    if(b && gameStarted) {
        b.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const c = document.createElement("div");
            c.style = "width:32px; height:32px; background:#222; display:inline-block; margin:2px; line-height:32px; text-align:center; border-radius:5px;";
            if (i === playerPos) c.innerHTML = "🧙"; 
            else if (boardEvents[i] === "frog") c.innerHTML = "🐸";
            else if (boardEvents[i] === "wolf") c.innerHTML = "🐺";
            else if (boardEvents[i] === "bear") c.innerHTML = "🐻";
            else if (boardEvents[i] === "gold") c.innerHTML = "💰"; 
            b.appendChild(c);
        }
    }
}
