import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Das "Herz" deines Charakters
export let meta = {
    hp: 30,
    maxHpBase: 30,
    gold: 0,
    attackPower: 5,
    monstersKilled: 0,
    bossesKilled: 0,
    autoLevel: 0,
    atkPrice: 100,
    hpPrice: 100,
    autoPrice: 1000
};

// Lädt die Daten vom Server
export async function loadMeta() {
    if (!auth.currentUser) return;
    const userDoc = doc(db, "users", auth.currentUser.uid);
    try {
        const snap = await getDoc(userDoc);
        if (snap.exists()) {
            // Falls Daten existieren, überschreibe die Standardwerte
            meta = { ...meta, ...snap.data() };
        } else {
            // Neuer Spieler? Dann erstelle den ersten Eintrag
            await saveMeta();
        }
    } catch (e) {
        console.error("Fehler beim Laden des Profils:", e);
    }
}

// Speichert die Daten auf dem Server
export async function saveMeta() {
    if (!auth.currentUser) return;
    const userDoc = doc(db, "users", auth.currentUser.uid);
    try {
        await setDoc(userDoc, meta, { merge: true });
    } catch (e) {
        console.error("Fehler beim Speichern des Profils:", e);
    }
}
