// ranking.js (type="module") — modular, nutzt window.db

import {
  ref,
  get,
  query,
  orderByChild,
  limitToLast,
  push,
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
  const data = {
    name: String(payload?.name || "Unknown").slice(0, 24),
    rounds: toNum(payload?.rounds),
    monstersKilled: toNum(payload?.monstersKilled),
    bossesKilled: toNum(payload?.bossesKilled),
    ts: Date.now(),
    createdAt: serverTimestamp()
  };
  const entryRef = push(ref(db, "ranking"));
  await set(entryRef, data);
  return true;
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
