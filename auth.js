// Wir brauchen keine Firebase-Imports mehr!

const logContent = document.getElementById("logContent");
const statusPanel = document.getElementById("statusPanel");

// Funktion, um den Namen lokal zu speichern
export const login = () => {
    const userName = prompt("Wie lautet dein Heldenname?", "Spieler 1");
    
    if (userName) {
        localStorage.setItem("playerName", userName);
        updateUI(userName);
    }
};

export const logout = () => {
    localStorage.removeItem("playerName");
    location.reload();
};

// UI aktualisieren
function updateUI(name) {
    if (name) {
        statusPanel.innerHTML = `<span>👤 ${name}</span> <button onclick="logout()" class="game-btn" style="background:#d93025; padding:5px; margin-left:10px;">Logout</button>`;
        logContent.innerText = `🎮 Willkommen, ${name}! Dein Abenteuer kann beginnen.`;
        if(document.getElementById("board")) document.getElementById("board").style.display = "block";
    } else {
        statusPanel.innerHTML = `<button onclick="login()" class="game-btn" style="background:#4285F4;">🔑 Starten</button>`;
        logContent.innerText = "🎮 Bitte gib deinen Namen ein.";
        if(document.getElementById("board")) document.getElementById("board").style.display = "none";
    }
}

// Beim Laden der Seite prüfen, ob schon ein Name gespeichert ist
window.onload = () => {
    const savedName = localStorage.getItem("playerName");
    updateUI(savedName);
};

// Global machen für die Buttons
window.login = login;
window.logout = logout;
