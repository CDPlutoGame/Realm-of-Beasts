import { auth } from "./firebase.js";
import { 
    GoogleAuthProvider, 
    signInWithRedirect, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const provider = new GoogleAuthProvider();

// 1. Die wichtigste Funktion am Handy: Beobachten des Login-Status
onAuthStateChanged(auth, (user) => {
    const statusPanel = document.getElementById("statusPanel");
    const logContent = document.getElementById("logContent");

    if (user) {
        // LOGIN ERFOLGREICH
        statusPanel.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span>👤 ${user.displayName}</span>
                <button onclick="logout()" class="game-btn" style="background:#d93025; padding: 5px;">Logout</button>
            </div>
        `;
        logContent.innerText = "✅ Willkommen, " + user.displayName + "! Dein Abenteuer beginnt.";
        
        // HIER kannst du jetzt andere Funktionen starten, z.B. das Board zeigen
        document.getElementById("board").style.display = "block";
    } else {
        // NICHT EINGELOGGT
        statusPanel.innerHTML = `
            <button onclick="login()" class="game-btn" style="background:#4285F4; width:100%;">🔑 Mit Google anmelden</button>
        `;
        logContent.innerText = "🎮 Bitte logge dich ein.";
        document.getElementById("board").style.display = "none";
    }
});

// 2. Login-Funktion
export const login = async () => {
    try {
        // Wir nutzen Redirect, weil Popups am Handy fast immer geblockt werden
        await signInWithRedirect(auth, provider);
    } catch (error) {
        alert("Fehler beim Login-Start: " + error.message);
    }
};

// 3. Logout-Funktion
export const logout = async () => {
    await signOut(auth);
    location.reload();
};

window.login = login;
window.logout = logout;
