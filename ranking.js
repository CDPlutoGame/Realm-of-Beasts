// ranking.js (type="module") — modular, nutzt window.db

import {
  ref,
  get,
  query,
  orderByChild,
  limitToLast,
  set,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("✅ ranking.js geladen");

const db = window.db;
if (!db) {
  console.log("❌ window.db fehlt (Firebase Setup in index.html?)");
}

const toNum = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

async function submitScore(payload) {

  const user = auth.currentUser;
  if (!user) return;

  async function submitScore(payload) {
  const user = auth.currentUser;
  if (!user) return;

  const data = {
    uid: user.uid,
    name: payload.name,
    rounds: payload.rounds,
    monstersKilled: payload.monstersKilled,
    bossesKilled: payload.bossesKilled,
    ts: Date.now()
  };

  const playerRef = ref(db, "ranking/" + user.uid);
  const snap = await get(playerRef);

  if (!snap.exists()) {
    await set(playerRef, data);
  } else {
    const existing = snap.val();
    if (toNum(data.rounds) > toNum(existing.rounds)) {
      await set(playerRef, data);
    }
  }
}
  // Prüfen ob es schon einen Eintrag gibt
  const snap = await get(playerRef);

  if (!snap.exists()) {
    // Spieler existiert noch nicht → speichern
    await set(playerRef, data);
  } else {
    const existing = snap.val();

    // Nur überschreiben wenn besser
    if (data.rounds > toNum(existing.rounds)) {
      await set(playerRef, data);
    }
  }
}

async function top10() {
  // Direkt nach rounds sortieren!
  const q = query(
    ref(db, "ranking"),
    orderByChild("rounds"),
    limitToLast(3)
  );

  const snap = await get(q);

  if (!snap.exists()) return [];

  const obj = snap.val();
  const arr = Object.values(obj);

  // Höchste zuerst
  arr.sort((a, b) => toNum(b?.rounds) - toNum(a?.rounds));

  return arr;
}

window.__ONLINE_RANKING__ = { submitScore, top10 };
console.log("✅ __ONLINE_RANKING__ bereit");

// pending score nachschieben
try {
  const pending = localStorage.getItem("mbr_pending_score");
  if (pending) {
    submitScore(JSON.parse(pending))
      .then(() => {
        localStorage.removeItem("mbr_pending_score");
        console.log("✅ pending score hochgeladen");
      })
      .catch((e) => console.log("❌ pending upload:", e?.code || e?.message));
  }
} catch {}
