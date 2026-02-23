// ranking.js — stable (game.js erwartet top10!)
(() => {
  console.log("✅ ranking.js geladen");

  if (typeof firebase === "undefined") {
    console.log("❌ firebase undefined -> Firebase-Libs fehlen");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyD3Z_HFQ04XVsbAnL3XCqf_6bkX3Cc21oc",
    authDomain: "realm-of-beaasts.firebaseapp.com",
    databaseURL: "https://realm-of-beaasts-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "realm-of-beaasts",
    storageBucket: "realm-of-beaasts.firebasestorage.app",
    messagingSenderId: "723138830522",
    appId: "1:723138830522:web:b3ec8a3d8947c25ec66283"
  };

  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.log("❌ Firebase init Fehler:", e);
    return;
  }

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

  // game.js ruft top10() auf -> wir liefern einfach TOP 3 zurück
  async function top10() {
    const snap = await db.ref("ranking")
      .orderByChild("ts")
      .limitToLast(300)
      .once("value");

    const arr = [];
    snap.forEach(c => arr.push(c.val()));
    arr.sort((a, b) => toNum(b.rounds) - toNum(a.rounds));
    return arr.slice(0, 3);
  }

  window.__ONLINE_RANKING__ = { submitScore, top10 };
  console.log("✅ __ONLINE_RANKING__ bereit");
    // pending score nachschieben (Handy-Fix)
  try {
    const pending = localStorage.getItem("mbr_pending_score");
    if (pending) {
      submitScore(JSON.parse(pending)).then(() => {
        localStorage.removeItem("mbr_pending_score");
        console.log("✅ pending score hochgeladen");
      }).catch(()=>{});
    }
  } catch {}
})();
