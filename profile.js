import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Deine Charakter-Werte
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
    autoPrice: 1000,
    email: ""
};

// Lädt dein Profil beim Start
export async function loadMeta() {
    if (!auth.currentUser) return;
    
    const userDoc = doc(db, "users", auth.currentUser.uid);
    try {
        const snap = await getDoc(userDoc);
        if (snap.exists()) {
            // Daten vom Server laden und in 'meta' schreiben
            const data = snap.data();
            Object.assign(meta, data);
        } else {
            // Neuer Spieler: Email speichern und ersten Save erstellen
            meta.email = auth.currentUser.email;
            await saveMeta();
        }
    } catch (e) {
        console.error("Fehler beim Laden des Profils:", e);
    }
}

// Speichert nur deine Charakter-Daten
export async function saveMeta() {
    if (!auth.currentUser) return;
    
    const userDoc = doc(db, "users", auth.currentUser.uid);
    try {
        // Wir speichern das gesamte meta-Objekt direkt in dein User-Dokument
        await setDoc(userDoc, meta, { merge: true });
    } catch (e) {
        console.error("Fehler beim Speichern:", e);
    }
}
