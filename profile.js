import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export let meta = {
    hp: 30, maxHpBase: 30, gold: 0, attackPower: 5,
    monstersKilled: 0, bossesKilled: 0, autoLevel: 0,
    atkPrice: 100, hpPrice: 100, autoPrice: 1000
};

export async function loadMeta() {
    if (!auth.currentUser) return;
    const userDoc = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(userDoc);
    if (snap.exists()) {
        Object.assign(meta, snap.data());
    } else {
        await saveMeta();
    }
}

export async function saveMeta() {
    if (!auth.currentUser) return;
    const userDoc = doc(db, "users", auth.currentUser.uid);
    await setDoc(userDoc, meta, { merge: true });
}
