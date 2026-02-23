// ranking.js — Best-Score pro Name + Top10 nach rounds
(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyD3Z_HFQ04XVsbAnL3XCqf_6bkX3Cc21oc",
    authDomain: "realm-of-beaasts.firebaseapp.com",
    databaseURL: "https://realm-of-beaasts-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "realm-of-beaasts",
    storageBucket: "realm-of-beaasts.firebasestorage.app",
    messagingSenderId: "723138830522",
    appId: "1:723138830522:web:b3ec8a3d8947c25ec66283"
  };

  if (typeof firebase === "undefined") {
    console.log("❌ Firebase libs fehlen");
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const db = firebase.database();

  const toNum = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };

  // sichere Key-Erstellung (keine Slashes, keine Punkte)
  const safeKey = (name) =>
    String(name || "Unknown")
      .trim()
      .slice(0, 24)
      .replace(/[.#$\[\]\/]/g, "_");

  async function submitScore(payload) {
    const nameRaw = String(payload?.name || "Unknown").trim() || "Unknown";
    const name = nameRaw.slice(0, 24);
    const key = safeKey(name);

    const newData = {
      name,
      rounds: toNum(payload?.rounds),
      monstersKilled: toNum(payload?.monstersKilled),
      bossesKilled: toNum(payload?.bossesKilled),
      ts: Date.now()
    };

    const ref = db.ref("ranking_best/" + key);

    // nur überschreiben, wenn besser als der alte Score
    const snap = await ref.once("value");
    const old = snap.val();
    const oldRounds = toNum(old?.rounds);

    if (!old || newData.rounds > oldRounds) {
      await ref.set(newData);
      return true; // updated
    }
    return false; // not better
  }

  async function top10() {
    const snap = await db
      .ref("ranking_best")
      .orderByChild("rounds")
      .limitToLast(10)
      .once("value");

    const arr = [];
    snap.forEach((c) => arr.push(c.val()));
    arr.sort((a, b) => toNum(b.rounds) - toNum(a.rounds));
    return arr;
  }

  window.__ONLINE_RANKING__ = { submitScore, top10 };
  console.log("✅ Ranking ready (best per name)");
})();
