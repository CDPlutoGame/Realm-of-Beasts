import { db, firebaseRef as ref, firebaseGet as get, firebaseSet as set } from "./firebase.js";

console.log("✅ ranking.js geladen");

const db = window.db;
const auth = window.auth;

const toNum = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

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

async function top10() {
  const q = query(
    ref(db, "ranking"),
    orderByChild("rounds"),
    limitToLast(3)
  );

  const snap = await get(q);
  if (!snap.exists()) return [];

  const arr = Object.values(snap.val());
  arr.sort((a, b) => toNum(b.rounds) - toNum(a.rounds));
  return arr;
}

window.__ONLINE_RANKING__ = { submitScore, top10 };

console.log("✅ __ONLINE_RANKING__ bereit");
