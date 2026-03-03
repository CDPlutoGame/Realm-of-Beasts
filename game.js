// ... (Obere Variablen bleiben gleich wie vorher) ...

window.startGame = function() {
    const nameInput = document.getElementById("playerNameInput").value.trim();
    
    // Check ob Name eingegeben wurde
    if (nameInput === "") {
        alert("Wähle einen Namen, Wanderer!");
        return;
    }

    // Daten laden
    const savedMeta = localStorage.getItem("cdp_rpg_meta");
    const savedHigh = localStorage.getItem("cdp_rpg_high");
    if(savedMeta) meta = JSON.parse(savedMeta);
    if(savedHigh) highscore = JSON.parse(savedHigh);

    meta.playerName = nameInput;
    
    // Overlay entfernen
    document.getElementById("loginOverlay").style.display = "none";
    
    playRandomMusic();
    gameStarted = true;
    isGameOver = false;
    generateBoardEvents();
    updateUI();
};

// ... (Rest der Funktionen: playerMove, attackMonster, buyItem, updateUI bleiben wie zuvor) ...
