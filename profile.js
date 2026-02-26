import { auth, db } from "./firebase.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* =========================
   META OBJEKT (GLOBAL)
========================= */

export let meta = {
  gold: 0,
  potions: 0,
  maxHpBase: 30,
  attackPower: 5,
  maxHpPrice: 100,
  attackPowerPrice: 100,
  bossesDefeated: 0,
  autoSpinStage: 0,
  autoAttackStage: 0,
  prestigeLevel: 0
};

/* =========================
   META LADEN
========================= */

export async function loadMeta() {
  const user = auth.currentUser;

  if (!user) {
    console.log("🚫 Kein User – Meta bleibt lokal");
    return meta;
  }

  const snap = await get(ref(db, `users/${user.uid}/meta`));

  if (snap.exists()) {
    meta = snap.val();
    console.log("📦 Meta vom Server geladen:", meta);
  } else {
    console.log("🆕 Kein Meta vorhanden – erstelle neu");
    await saveMeta();
  }

  return meta;
}

/* =========================
   META SPEICHERN
========================= */

export async function saveMeta() {
  const user = auth.currentUser;

  if (!user) {
    console.log("🚫 Kein User – Speichern übersprungen");
    return;
  }

  await set(ref(db, `users/${user.uid}/meta`), meta);
  console.log("💾 Meta gespeichert");
}
