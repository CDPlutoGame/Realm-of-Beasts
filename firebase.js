import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Deine Firebase Konfiguration (Diese Daten hast du aus der Firebase Konsole)
const firebaseConfig = {
    apiKey: "DEIN_API_KEY",
    authDomain: "realm-of-beasts.firebaseapp.com",
    projectId: "realm-of-beasts",
    storageBucket: "realm-of-beasts.appspot.com",
    messagingSenderId: "DEINE_ID",
    appId: "DEINE_APP_ID"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);

// Dienste exportieren, damit game.js, auth.js und profile.js darauf zugreifen können
export const db = getFirestore(app);
export const auth = getAuth(app);
