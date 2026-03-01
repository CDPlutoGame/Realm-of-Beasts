import { auth } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const provider = new GoogleAuthProvider();

// Login Funktion
export const login = async () => {
    try {
        await signInWithPopup(auth, provider);
        console.log("Login erfolgreich");
    } catch (error) {
        console.error("Login Fehler:", error);
    }
};

// Logout Funktion
export const logout = async () => {
    try {
        await signOut(auth);
        location.reload(); // Seite neu laden nach Logout
    } catch (error) {
        console.error("Logout Fehler:", error);
    }
};

// Global verfügbar machen für die HTML-Buttons
window.login = login;
window.logout = logout;
