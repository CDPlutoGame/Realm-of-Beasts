import { db, auth } from "./firebase.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export let meta = {
    gold: 0, hp: 100, maxHpBase: 100, attackPower: 10,
    atkPrice: 100, hpPrice: 100,
    monstersKilled: 0, bossesKilled: 0,
    autoUnlocked: false
};

export async function loadMeta() {
    if (!auth.currentUser) return;
    const userRef = ref(db, 'users/' + auth.currentUser.uid);
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            meta = { ...meta, ...snapshot.val() };
        }
    } catch (e) { console.error("Load Error", e); }
}

export async function saveMeta() {
    if (!auth.currentUser) return;
    const userRef = ref(db, 'users/' + auth.currentUser.uid);
    try {
        await set(userRef, meta);
    } catch (e) { console.error("Save Error", e); }
}
