// ranking.js — nur /ranking (Top10 nach rounds)
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

  async function submitScore(payload) {
    const data = {
      name: String(payload?.name || "Unknown").slice(0, 24),
      rounds: toNum(payload?.rounds),
      monstersKilled: toNum(payload?.monstersKilled),
      bossesKilled: toNum(payload?.bossesKilled),
      ts: Date.now()
    };
    await db.ref("ranking").push(data);
    return true;
  }

  async function top10() {
    const snap = await db.ref("ranking")
      .orderByChild("rounds")
      .limitToLast(10)
      .once("value");

    const arr = [];
    snap.forEach(c => arr.push(c.val()));
    arr.sort((a,b) => toNum(b.rounds) - toNum(a.rounds));
    return arr;
  }

  window.__ONLINE_RANKING__ = { submitScore, top10 };
  console.log("✅ Ranking ready");

  // pending score nachschieben
  try {
    const pending = localStorage.getItem("mbr_pending_score");
    if (pending) {
      submitScore(JSON.parse(pending)).then(() => {
        localStorage.removeItem("mbr_pending_score");
      }).catch(()=>{});
    }
  } catch {}
})();
