import { auth } from "./firebase.js";
import { 
    GoogleAuthProvider, 
    signInWithRedirect, 
    getRedirectResult, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const provider = new GoogleAuthProvider();
const logContent = document.getElementById("logContent");
const statusPanel = document.getElementById("statusPanel");

// 1. Prüfen, ob der User gerade vom Login zurückkommt
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            logContent.innerText = "✅ Login erfolgreich!";
        }
    })
    .catch((error) => {
        // Zeigt Fehler direkt am Handy-Bildschirm an
        logContent.innerText = "❌ Fehler: " + error.code;
        console.error("Redirect Fehler:", error);
    });

// 2. Automatisches Update, wenn sich der Login-Status ändert
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Wenn eingeloggt: Name zeigen und Logout-Button
        statusPanel.innerHTML = `
            <span>👤 ${user.displayName}</span>
            <button onclick="logout()" class="game-btn" style="background:#d93025; margin-left: 10px; padding: 5px 10px;">Logout</button>
        `;
        logContent.innerText = "🎮 Willkommen zurück, " + user.displayName + "!";
    } else {
        // Wenn nicht eingeloggt: Login-Button zeigen
        statusPanel.innerHTML = `
            <button onclick="login()" class="game-btn" style="background:#4285F4;">🔑 Google Login</button>
        `;
        logContent.innerText = "🎮 Bitte einloggen zum Spielen.";
    }
});

// 3. Funktionen für die Buttons (Export für das Spiel)
export const login = async () => {
    logContent.innerText = "⏳ Verbinde mit Google...";
    try {
        await signInWithRedirect(auth, provider);
    } catch (error) {
        logContent.innerText = "❌ Login-Start Fehler: " + error.message;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        location.reload();
    } catch (error) {
        logContent.innerText = "❌ Logout Fehler";
    }
};

// Global machen, damit die onclick-Events im HTML funktionieren
window.login = login;
window.logout = logout;
