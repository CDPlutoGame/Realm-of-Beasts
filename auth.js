import { auth } from "./firebase.js";
import { 
    GoogleAuthProvider, 
    signInWithRedirect, // Geändert von signInWithPopup
    getRedirectResult, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const provider = new GoogleAuthProvider();

// Diese Funktion prüft beim Laden der Seite, ob der User gerade vom Login zurückkommt
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      console.log("Erfolgreich eingeloggt:", result.user);
      // Hier kannst du dein Spiel starten oder das UI updaten
    }
  }).catch((error) => {
    console.error("Fehler nach dem Redirect:", error);
  });

export const login = async () => {
    try {
        // Redirect ist am Handy viel stabiler als ein Popup
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error("Login Fehler:", error);
    }
};

export const logout = async () => {
    await signOut(auth);
    location.reload();
};

window.login = login;
window.logout = logout;

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Prüft automatisch, ob ein User angemeldet ist
onAuthStateChanged(auth, (user) => {
    const statusPanel = document.getElementById("statusPanel");
    const logContent = document.getElementById("logContent");

    if (user) {
        // User ist drin! Login-Button verstecken oder durch Profil ersetzen
        statusPanel.innerHTML = `
            <span>Willkommen, ${user.displayName}</span>
            <button onclick="logout()" class="game-btn" style="background:#d93025; margin-left: 10px;">🚪 Logout</button>
        `;
        logContent.innerText = "🎮 Spiel geladen. Viel Erfolg, " + user.displayName + "!";
        
        // Hier könntest du jetzt deine game.js oder profile.js Funktionen starten
    } else {
        // Kein User da, zeige den Login-Button (Standard-HTML)
        logContent.innerText = "🎮 Warte auf Login...";
    }
});
